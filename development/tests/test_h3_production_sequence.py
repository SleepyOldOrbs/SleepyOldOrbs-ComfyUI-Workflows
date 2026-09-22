import importlib.util
import json
import subprocess
import sys
import types
from pathlib import Path

import imageio_ffmpeg
import pytest


PACKAGE_ROOT = (
    Path(__file__).resolve().parents[1]
    / "custom_nodes"
    / "ComfyUI-Codex-H3-Production"
)


def load_nodes(output_directory: Path):
    folder_paths = types.ModuleType("folder_paths")
    folder_paths.get_output_directory = lambda: str(output_directory)
    sys.modules["folder_paths"] = folder_paths

    package_name = "codex_h3_production_m6_under_test"
    for name in list(sys.modules):
        if name == package_name or name.startswith(f"{package_name}."):
            del sys.modules[name]
    spec = importlib.util.spec_from_file_location(
        package_name,
        PACKAGE_ROOT / "__init__.py",
        submodule_search_locations=[str(PACKAGE_ROOT)],
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules[package_name] = module
    spec.loader.exec_module(module)
    return module


def make_clip(path: Path, *, color="red", size="64x48", rate=24, audio=True):
    path.parent.mkdir(parents=True, exist_ok=True)
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(),
        "-y",
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        f"color=c={color}:s={size}:r={rate}:d=0.5",
    ]
    if audio:
        command += [
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=32000:cl=stereo:d=0.5",
            "-shortest",
        ]
    command += ["-c:v", "libx264", "-pix_fmt", "yuv420p"]
    if audio:
        command += ["-c:a", "aac", "-b:a", "96k"]
    command.append(str(path))
    subprocess.run(command, check=True)


def manual_sources(*paths):
    return json.dumps(
        [
            {"path": str(path.relative_to(path.parents[1])), "label": path.stem}
            for path in paths
        ]
    )


def test_sequence_assembler_losslessly_concatenates_matching_streams(tmp_path):
    module = load_nodes(tmp_path)
    first = tmp_path / "fixtures" / "first.mp4"
    second = tmp_path / "fixtures" / "second.mp4"
    make_clip(first, color="red")
    make_clip(second, color="blue")
    before = {path: path.read_bytes() for path in (first, second)}
    assembler = module.NODE_CLASS_MAPPINGS["CodexH3SequenceAssembler"]()

    status, output_path, manifest_path, manifest_json, transcode_plan = (
        assembler.assemble(
            project="M6 Matching",
            assembly_name="Red then blue",
            sources_json=manual_sources(first, second),
            action="assemble lossless",
        )
    )
    manifest = json.loads(manifest_json)

    assert status.startswith("ASSEMBLY COMPLETE")
    assert transcode_plan == ""
    assert Path(output_path).is_file()
    assert Path(manifest_path).is_file()
    assert json.loads(Path(manifest_path).read_text(encoding="utf-8")) == manifest
    assert manifest["operation"] == "ffmpeg_concat_stream_copy"
    assert [source["label"] for source in manifest["sources"]] == [
        "first",
        "second",
    ]
    assert manifest["output"]["duration_seconds"] == pytest.approx(
        sum(source["duration_seconds"] for source in manifest["sources"]),
        abs=0.12,
    )
    assert len(manifest["output"]["sha256"]) == 64
    assert manifest["compatibility"]["stream_copy_safe"] is True
    assert {path: path.read_bytes() for path in (first, second)} == before


def test_sequence_assembler_refuses_mismatch_and_explains_transcode(tmp_path):
    module = load_nodes(tmp_path)
    first = tmp_path / "fixtures" / "wide.mp4"
    second = tmp_path / "fixtures" / "small.mp4"
    make_clip(first, color="red", size="64x48")
    make_clip(second, color="blue", size="48x32")
    assembler = module.NODE_CLASS_MAPPINGS["CodexH3SequenceAssembler"]()

    result = assembler.assemble(
        project="M6 Mismatch",
        assembly_name="Unsafe copy",
        sources_json=manual_sources(first, second),
        action="assemble lossless",
    )
    plan = json.loads(result[4])

    assert result[0].startswith("ASSEMBLY REFUSED")
    assert result[1:3] == ("", "")
    assert json.loads(result[3])["operation"] == "refused_requires_transcode"
    assert "video.width" in plan["mismatches"]
    assert "video.height" in plan["mismatches"]
    assert plan["required_operation"] == "explicit_normalizing_transcode"
    assert "libx264" in plan["suggested_ffmpeg_arguments"]
    assert not (tmp_path / "H3_Projects" / "m6-mismatch" / "assemblies").exists()


def test_sequence_assembler_inspection_has_no_media_write(tmp_path):
    module = load_nodes(tmp_path)
    first = tmp_path / "fixtures" / "first.mp4"
    second = tmp_path / "fixtures" / "second.mp4"
    make_clip(first, color="red")
    make_clip(second, color="green")
    assembler = module.NODE_CLASS_MAPPINGS["CodexH3SequenceAssembler"]()

    result = assembler.assemble(
        project="M6 Inspect",
        assembly_name="Inspection only",
        sources_json=manual_sources(first, second),
        action="inspect only",
    )
    inspection = json.loads(result[3])

    assert result[0] == "ASSEMBLY READY — 2 compatible clips"
    assert result[1:3] == ("", "")
    assert result[4] == ""
    assert inspection["operation"] == "inspection_only"
    assert inspection["compatibility"]["stream_copy_safe"] is True
    assert not (tmp_path / "H3_Projects" / "m6-inspect" / "assemblies").exists()


def test_sequence_assembler_reads_only_accepted_take_media(tmp_path):
    module = load_nodes(tmp_path)
    accepted_clip = tmp_path / "fixtures" / "accepted.mp4"
    rejected_clip = tmp_path / "fixtures" / "rejected.mp4"
    make_clip(accepted_clip, color="red")
    make_clip(rejected_clip, color="black")
    project = module.NODE_CLASS_MAPPINGS["CodexH3ProjectControl"]()
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3TakeRecorder"]()
    accepted_token, *_ = project.open_take(
        project="M6 Takes",
        scene="Scene A",
        shot="S01",
        branch="main",
        engine="test",
        model="none",
        lora="none",
        profile="test",
        prompt="accepted",
        references_json="[]",
        parent_handoff="",
        native_width=64,
        native_height=48,
        delivery_width=64,
        delivery_height=48,
        seed=1,
    )
    recorder.record(
        accepted_token,
        "accepted",
        str(accepted_clip),
        "complete",
        True,
    )
    rejected_token, *_ = project.open_take(
        project="M6 Takes",
        scene="Scene A",
        shot="S02",
        branch="alternate",
        engine="test",
        model="none",
        lora="none",
        profile="test",
        prompt="rejected",
        references_json="[]",
        parent_handoff="",
        native_width=64,
        native_height=48,
        delivery_width=64,
        delivery_height=48,
        seed=2,
    )
    recorder.record(
        rejected_token,
        "rejected",
        str(rejected_clip),
        "rejected",
        False,
    )
    assembler = module.NODE_CLASS_MAPPINGS["CodexH3SequenceAssembler"]()

    accepted_result = assembler.assemble(
        project="M6 Takes",
        assembly_name="Accepted take",
        sources_json=json.dumps(
            [{"take_id": accepted_token["take_id"], "media_index": 0}]
        ),
        action="inspect only",
    )
    accepted_source = json.loads(accepted_result[3])["sources"][0]

    assert accepted_source["source_type"] == "accepted_take"
    assert accepted_source["take_id"] == accepted_token["take_id"]
    assert accepted_source["sha256"]
    with pytest.raises(ValueError, match="not accepted"):
        assembler.assemble(
            project="M6 Takes",
            assembly_name="Rejected take",
            sources_json=json.dumps(
                [{"take_id": rejected_token["take_id"], "media_index": 0}]
            ),
            action="inspect only",
        )
    with pytest.raises(ValueError, match="no media index -1"):
        assembler.assemble(
            project="M6 Takes",
            assembly_name="Negative media index",
            sources_json=json.dumps(
                [{"take_id": accepted_token["take_id"], "media_index": -1}]
            ),
            action="inspect only",
        )


def test_sequence_assembler_rejects_duplicate_and_outside_output_sources(tmp_path):
    module = load_nodes(tmp_path)
    clip = tmp_path / "fixtures" / "one.mp4"
    make_clip(clip)
    assembler = module.NODE_CLASS_MAPPINGS["CodexH3SequenceAssembler"]()
    duplicate = manual_sources(clip, clip)
    outside = tmp_path.parent / "outside.mp4"
    make_clip(outside)

    with pytest.raises(ValueError, match="duplicate source"):
        assembler.assemble(
            "M6 Safety", "Duplicate", duplicate, "inspect only"
        )
    with pytest.raises(ValueError, match="inside the ComfyUI output"):
        assembler.assemble(
            "M6 Safety",
            "Outside",
            json.dumps([{"path": str(outside)}]),
            "inspect only",
        )
