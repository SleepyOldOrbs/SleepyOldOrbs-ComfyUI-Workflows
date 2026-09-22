import importlib.util
import json
import math
import os
import sys
import time
import types
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

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

    package_name = "codex_h3_production_under_test"
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


def start_benchmark(module):
    node = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkStart"]()
    return node.start(
        project="The Ministry of Small Emergencies",
        engine="workflow-10",
        model="H3/minimax_h3_fl2va.safetensors",
        lora="(none)",
        profile="Gold Base",
        native_width=864,
        native_height=480,
        delivery_width=1296,
        delivery_height=720,
        frame_count=124,
        steps=20,
        cfg=1.0,
        sampler="res_multistep",
        scheduler="simple",
        seed=42,
    )


def test_start_returns_the_recorded_settings_and_render_seed(tmp_path):
    module = load_nodes(tmp_path)

    token, render_seed = start_benchmark(module)

    assert render_seed == 42
    assert token["project"] == "The Ministry of Small Emergencies"
    assert token["project_slug"] == "the-ministry-of-small-emergencies"
    assert token["settings"] == {
        "cfg": 1.0,
        "delivery_dimensions": [1296, 720],
        "engine": "workflow-10",
        "frame_count": 124,
        "lora": "(none)",
        "model": "H3/minimax_h3_fl2va.safetensors",
        "native_dimensions": [864, 480],
        "profile": "Gold Base",
        "sampler": "res_multistep",
        "scheduler": "simple",
        "seed": 42,
        "steps": 20,
    }
    assert len(token["run_id"]) == 36
    assert len(token["settings_sha256"]) == 64
    assert token["started_at"].endswith("+00:00")
    assert token["wall_started_ns"] > 0
    assert token["monotonic_started"] > 0
    assert math.isnan(module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkStart"].IS_CHANGED())


def test_successful_output_appends_one_complete_project_record(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    output = tmp_path / "renders" / "shot.mp4"
    output.parent.mkdir()
    output.write_bytes(b"rendered-h3-output")
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    status, record_json, manifest_path = recorder.record(
        token=token,
        output_path="renders/shot.mp4",
        completion_state="auto",
        peak_vram_mb=1234.5,
        completion_signal="handoff saved",
    )

    record = json.loads(record_json)
    manifest = Path(manifest_path)
    assert status == "RECORDED — success"
    assert manifest == (
        tmp_path
        / "H3_Projects"
        / "the-ministry-of-small-emergencies"
        / "benchmarks"
        / "benchmark.jsonl"
    )
    assert record["completion_state"] == "success"
    assert record["completion_signal"] == "handoff saved"
    assert record["output_path"] == "renders/shot.mp4"
    assert record["output_sha256"] == (
        "bbca43103e2f965511c1bc91004302c5e1264d6e8a64e8e6c17d0c0b267ef313"
    )
    assert record["peak_vram_mb"] == 1234.5
    assert record["settings"] == token["settings"]
    assert record["elapsed_seconds"] >= 0
    assert [json.loads(line) for line in manifest.read_text(encoding="utf-8").splitlines()] == [record]
    assert list(manifest.parent.glob("*.tmp")) == []


def test_missing_output_cannot_be_recorded_as_success(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    with pytest.raises(ValueError, match="output does not exist"):
        recorder.record(
            token=token,
            output_path="renders/missing.mp4",
            completion_state="success",
        )

    assert list(tmp_path.rglob("benchmark.jsonl")) == []


def test_interrupted_run_can_be_recorded_without_claiming_an_output(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    status, record_json, manifest_path = recorder.record(
        token=token,
        output_path="renders/interrupted.mp4",
        completion_state="interrupted",
        completion_signal="operator stopped render",
    )

    record = json.loads(record_json)
    assert status == "RECORDED — interrupted"
    assert record["completion_state"] == "interrupted"
    assert record["completion_signal"] == "operator stopped render"
    assert record["output_exists"] is False
    assert record["output_sha256"] is None
    assert json.loads(Path(manifest_path).read_text(encoding="utf-8")) == record


def test_auto_state_marks_an_old_existing_output_as_cached(tmp_path):
    output = tmp_path / "renders" / "cached.mp4"
    output.parent.mkdir()
    output.write_bytes(b"cached-output")
    old_time = time.time() - 60
    os.utime(output, (old_time, old_time))
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    status, record_json, _ = recorder.record(
        token=token,
        output_path="renders/cached.mp4",
        completion_state="auto",
    )

    record = json.loads(record_json)
    assert status == "RECORDED — cached"
    assert record["completion_state"] == "cached"
    assert record["output_exists"] is True


def test_duplicate_output_and_settings_are_retained_only_once(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    output = tmp_path / "renders" / "shot.mp4"
    output.parent.mkdir()
    output.write_bytes(b"same-render")
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    first = recorder.record(token, "renders/shot.mp4", "success")
    second = recorder.record(token, "renders/shot.mp4", "success")

    manifest = Path(first[2])
    assert first[0] == "RECORDED — success"
    assert second[0] == "DUPLICATE — existing benchmark retained"
    assert json.loads(second[1]) == json.loads(first[1])
    assert len(manifest.read_text(encoding="utf-8").splitlines()) == 1


def test_concurrent_duplicate_records_leave_one_valid_jsonl_entry(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    output = tmp_path / "renders" / "shot.mp4"
    output.parent.mkdir()
    output.write_bytes(b"parallel-render")

    def record_once(_):
        recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()
        return recorder.record(token, "renders/shot.mp4", "success")

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(record_once, range(24)))

    statuses = [result[0] for result in results]
    lines = Path(results[0][2]).read_text(encoding="utf-8").splitlines()
    assert statuses.count("RECORDED — success") == 1
    assert statuses.count("DUPLICATE — existing benchmark retained") == 23
    assert len(lines) == 1
    assert json.loads(lines[0])["completion_state"] == "success"


def test_output_path_must_stay_inside_the_comfyui_output_directory(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    with pytest.raises(ValueError, match="must stay inside the ComfyUI output directory"):
        recorder.record(token, "../outside.mp4", "interrupted")

    assert list(tmp_path.parent.glob("H3_Projects/**/benchmark.jsonl")) == []


def test_project_manifest_slug_cannot_be_replaced_with_a_path(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    token["project_slug"] = "../../escape"
    output = tmp_path / "renders" / "shot.mp4"
    output.parent.mkdir()
    output.write_bytes(b"render")
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    with pytest.raises(ValueError, match="project slug is invalid"):
        recorder.record(token, "renders/shot.mp4", "success")

    assert list(tmp_path.rglob("benchmark.jsonl")) == []


def test_existing_invalid_jsonl_is_reported_and_not_overwritten(tmp_path):
    module = load_nodes(tmp_path)
    token, _ = start_benchmark(module)
    output = tmp_path / "renders" / "shot.mp4"
    output.parent.mkdir()
    output.write_bytes(b"render")
    manifest = (
        tmp_path
        / "H3_Projects"
        / token["project_slug"]
        / "benchmarks"
        / "benchmark.jsonl"
    )
    manifest.parent.mkdir(parents=True)
    manifest.write_text("{broken json\n", encoding="utf-8")
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3BenchmarkRecorder"]()

    with pytest.raises(ValueError, match="invalid JSONL at line 1"):
        recorder.record(token, "renders/shot.mp4", "success")

    assert manifest.read_text(encoding="utf-8") == "{broken json\n"
