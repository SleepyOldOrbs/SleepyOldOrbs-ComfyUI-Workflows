import hashlib
import importlib.util
import json
import sys
import types
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
import torch


PACKAGE_ROOT = (
    Path(__file__).resolve().parents[1]
    / "custom_nodes"
    / "ComfyUI-Codex-H3-Production"
)


def load_nodes(output_directory: Path):
    folder_paths = types.ModuleType("folder_paths")
    folder_paths.get_output_directory = lambda: str(output_directory)
    sys.modules["folder_paths"] = folder_paths

    package_name = "codex_h3_production_state_under_test"
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


def open_take(
    module,
    *,
    project="The Ministry of Small Emergencies",
    scene="Kitchen",
    shot="Goat close-up",
    branch="main",
    parent_handoff="",
):
    node = module.NODE_CLASS_MAPPINGS["CodexH3ProjectControl"]()
    return node.open_take(
        project=project,
        scene=scene,
        shot=shot,
        branch=branch,
        engine="workflow-10",
        model="H3/minimax_h3_fl2va.safetensors",
        lora="(none)",
        profile="Gold Base",
        prompt='The goat looks at camera and says, "Tea?"',
        references_json='[{"id":"goat","path":"references/goat.png"}]',
        parent_handoff=parent_handoff,
        native_width=864,
        native_height=480,
        delivery_width=1296,
        delivery_height=720,
        seed=42,
    )


def textured_image(width=864, height=480):
    generator = torch.Generator().manual_seed(42)
    return torch.rand((1, height, width, 3), generator=generator)


def test_project_control_creates_human_readable_project_and_take_identity(tmp_path):
    module = load_nodes(tmp_path)

    token, take_label, render_seed, status = open_take(module)

    project_root = (
        tmp_path / "H3_Projects" / "the-ministry-of-small-emergencies"
    )
    project = json.loads((project_root / "project.json").read_text(encoding="utf-8"))
    take_directory = project_root / token["take_directory"]
    assert project["display_name"] == "The Ministry of Small Emergencies"
    assert project["project_slug"] == "the-ministry-of-small-emergencies"
    assert project["schema_version"] == 1
    assert take_directory.is_dir()
    assert take_label == "Kitchen / Goat close-up / main / Take 0001"
    assert render_seed == 42
    assert status == "TAKE READY — Kitchen / Goat close-up / main / Take 0001"
    assert token["identity"] == {
        "project": "The Ministry of Small Emergencies",
        "project_slug": "the-ministry-of-small-emergencies",
        "scene": "Kitchen",
        "scene_slug": "kitchen",
        "shot": "Goat close-up",
        "shot_slug": "goat-close-up",
        "branch": "main",
        "branch_slug": "main",
        "take_number": 1,
    }
    assert token["provenance"]["prompt"] == (
        'The goat looks at camera and says, "Tea?"'
    )
    assert token["provenance"]["references"] == [
        {"id": "goat", "path": "references/goat.png"}
    ]
    assert token["provenance"]["native_dimensions"] == [864, 480]
    assert token["provenance"]["delivery_dimensions"] == [1296, 720]
    assert token["provenance"]["seed"] == 42
    assert token["take_id"].endswith("/take-0001")
    assert token["opened_at"].endswith("+00:00")
    assert token["monotonic_started"] > 0
    assert module.NODE_CLASS_MAPPINGS["CodexH3ProjectControl"].IS_CHANGED() != (
        module.NODE_CLASS_MAPPINGS["CodexH3ProjectControl"].IS_CHANGED()
    )


def test_identical_scene_and_shot_names_stay_isolated_by_project(tmp_path):
    module = load_nodes(tmp_path)

    first, *_ = open_take(module, project="Project Alpha")
    second, *_ = open_take(module, project="Project Beta")

    assert first["identity"]["take_number"] == 1
    assert second["identity"]["take_number"] == 1
    assert first["project_root"] != second["project_root"]
    assert (tmp_path / "H3_Projects" / "project-alpha" / "project.json").is_file()
    assert (tmp_path / "H3_Projects" / "project-beta" / "project.json").is_file()


def test_concurrent_take_allocation_produces_unique_atomic_directories(tmp_path):
    module = load_nodes(tmp_path)

    def allocate(_):
        token, *_ = open_take(module)
        return token

    with ThreadPoolExecutor(max_workers=8) as executor:
        tokens = list(executor.map(allocate, range(32)))

    numbers = sorted(token["identity"]["take_number"] for token in tokens)
    directories = {token["take_directory"] for token in tokens}
    assert numbers == list(range(1, 33))
    assert len(directories) == 32
    assert all(
        (Path(token["project_root"]) / token["take_directory"]).is_dir()
        for token in tokens
    )


def test_rollback_branch_allocates_new_history_without_deleting_main(tmp_path):
    module = load_nodes(tmp_path)
    main_take, *_ = open_take(module, branch="main")
    later_main_take, *_ = open_take(module, branch="main")
    rollback_take, *_ = open_take(module, branch="rollback-from-take-1")

    assert main_take["identity"]["take_number"] == 1
    assert later_main_take["identity"]["take_number"] == 2
    assert rollback_take["identity"]["take_number"] == 1
    assert Path(main_take["project_root"], main_take["take_directory"]).is_dir()
    assert Path(
        later_main_take["project_root"], later_main_take["take_directory"]
    ).is_dir()
    assert Path(
        rollback_take["project_root"], rollback_take["take_directory"]
    ).is_dir()


def test_take_recorder_preserves_complete_provenance_and_content_hashes(tmp_path):
    module = load_nodes(tmp_path)
    parent = tmp_path / "H3_Projects" / "parent.png"
    parent.parent.mkdir(parents=True)
    parent.write_bytes(b"accepted-parent-frame")
    token, *_ = open_take(module, parent_handoff="H3_Projects/parent.png")
    take_root = Path(token["project_root"]) / token["take_directory"]
    output = take_root / "shot.mp4"
    output.write_bytes(b"rendered-shot")
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3TakeRecorder"]()

    status, record_json, take_manifest_path, index_path = recorder.record(
        token=token,
        take_state="accepted",
        output_paths=str(output),
        completion_signal="technical and human review accepted",
    )

    record = json.loads(record_json)
    assert status == "TAKE RECORDED — accepted — Take 0001"
    assert record["identity"] == token["identity"]
    assert record["provenance"] == token["provenance"]
    assert record["completion_state"] == "accepted"
    assert record["completion_signal"] == "technical and human review accepted"
    assert record["parent_handoff"] == {
        "path": "H3_Projects/parent.png",
        "scope": "output",
        "sha256": hashlib.sha256(b"accepted-parent-frame").hexdigest(),
    }
    assert record["media"] == [
        {
            "path": f"{token['take_directory']}/shot.mp4",
            "scope": "project",
            "sha256": hashlib.sha256(b"rendered-shot").hexdigest(),
            "size_bytes": len(b"rendered-shot"),
        }
    ]
    assert Path(take_manifest_path) == take_root / "take.json"
    assert json.loads(Path(take_manifest_path).read_text(encoding="utf-8")) == record
    assert [
        json.loads(line)
        for line in Path(index_path).read_text(encoding="utf-8").splitlines()
    ] == [record]


def test_take_recorder_auto_uses_gate_signal_and_refuses_external_media(tmp_path):
    module = load_nodes(tmp_path)
    token, *_ = open_take(module)
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3TakeRecorder"]()

    status, record_json, *_ = recorder.record(
        token=token,
        take_state="auto",
        output_paths="",
        completion_signal="handoff rejected",
        accepted_signal=False,
    )
    assert status == "TAKE RECORDED — rejected — Take 0001"
    assert json.loads(record_json)["completion_state"] == "rejected"

    other_token, *_ = open_take(module)
    outside = tmp_path.parent / "outside.mp4"
    outside.write_bytes(b"outside")
    with pytest.raises(ValueError, match="must stay inside the ComfyUI output directory"):
        recorder.record(
            token=other_token,
            take_state="accepted",
            output_paths=str(outside),
            completion_signal="",
            accepted_signal=True,
        )


def test_normal_frame_advances_current_handoff_with_immutable_take_copy(tmp_path):
    module = load_nodes(tmp_path)
    token, *_ = open_take(module)
    gate = module.NODE_CLASS_MAPPINGS["CodexH3SafeContinuationStore"]()
    images = textured_image()

    frame, status, accepted, handoff_path, gate_json = gate.store(
        images=images,
        token=token,
        mode="BLOCK TECHNICAL",
        expected_width=864,
        expected_height=480,
        continuity_warning="",
    )

    record = json.loads(gate_json)
    current = (
        Path(token["project_root"])
        / "handoffs"
        / "kitchen"
        / "goat-close-up"
        / "main"
        / "current.png"
    )
    immutable = Path(token["project_root"]) / token["take_directory"] / "handoff.png"
    assert torch.equal(frame, images[-1:])
    assert accepted is True
    assert status == "HANDOFF ACCEPTED — Take 0001 is ready for the next run"
    assert Path(handoff_path) == immutable
    assert immutable.is_file()
    assert current.is_file()
    assert immutable.read_bytes() == current.read_bytes()
    assert record["result"] == "accepted"
    assert record["blocking_failures"] == []
    assert record["pixel_sha256"] == hashlib.sha256(
        (images[0].mul(255).round().to(torch.uint8).numpy()).tobytes()
    ).hexdigest()


@pytest.mark.parametrize(
    ("images", "failure"),
    [
        (torch.zeros((1, 480, 864, 3)), "near_total_black"),
        (torch.ones((1, 480, 864, 3)), "near_total_white"),
        (torch.full((1, 480, 864, 3), float("nan")), "non_finite_pixels"),
    ],
)
def test_blocked_frames_are_saved_for_inspection_without_changing_current(
    tmp_path, images, failure
):
    module = load_nodes(tmp_path)
    accepted_token, *_ = open_take(module)
    rejected_token, *_ = open_take(module)
    gate = module.NODE_CLASS_MAPPINGS["CodexH3SafeContinuationStore"]()
    _, _, accepted, current_path, _ = gate.store(
        textured_image(), accepted_token, "BLOCK TECHNICAL", 864, 480, ""
    )
    current = (
        Path(accepted_token["project_root"])
        / "handoffs"
        / "kitchen"
        / "goat-close-up"
        / "main"
        / "current.png"
    )
    before = current.read_bytes()

    _, status, rejected_accepted, rejected_path, gate_json = gate.store(
        images, rejected_token, "BLOCK TECHNICAL", 864, 480, ""
    )

    record = json.loads(gate_json)
    assert accepted is True
    assert Path(current_path).is_file()
    assert rejected_accepted is False
    assert status.startswith("HANDOFF BLOCKED — previous accepted handoff retained:")
    assert failure in record["blocking_failures"]
    assert Path(rejected_path).name == "rejected-handoff.png"
    assert Path(rejected_path).is_file()
    assert current.read_bytes() == before


def test_warn_mode_and_continuity_warning_are_advisory(tmp_path):
    module = load_nodes(tmp_path)
    token, *_ = open_take(module)
    gate = module.NODE_CLASS_MAPPINGS["CodexH3SafeContinuationStore"]()

    _, status, accepted, handoff_path, gate_json = gate.store(
        torch.zeros((1, 480, 864, 3)),
        token,
        "WARN",
        864,
        480,
        "subject position changed",
    )

    record = json.loads(gate_json)
    assert accepted is True
    assert status.startswith("HANDOFF ACCEPTED WITH WARNINGS —")
    assert Path(handoff_path).name == "handoff.png"
    assert "near_total_black" in record["blocking_failures"]
    assert "continuity: subject position changed" in record["warnings"]


def test_dimension_mismatch_is_blocked(tmp_path):
    module = load_nodes(tmp_path)
    token, *_ = open_take(module)
    gate = module.NODE_CLASS_MAPPINGS["CodexH3SafeContinuationStore"]()

    _, _, accepted, _, gate_json = gate.store(
        textured_image(width=608, height=352),
        token,
        "BLOCK TECHNICAL",
        864,
        480,
        "",
    )

    record = json.loads(gate_json)
    assert accepted is False
    assert "unexpected_dimensions:608x352_expected_864x480" in record[
        "blocking_failures"
    ]


def test_older_take_cannot_replace_a_newer_accepted_handoff(tmp_path):
    module = load_nodes(tmp_path)
    older, *_ = open_take(module)
    newer, *_ = open_take(module)
    gate = module.NODE_CLASS_MAPPINGS["CodexH3SafeContinuationStore"]()

    _, _, newer_accepted, _, _ = gate.store(
        textured_image(), newer, "BLOCK TECHNICAL", 864, 480, ""
    )
    current = (
        Path(newer["project_root"])
        / "handoffs"
        / "kitchen"
        / "goat-close-up"
        / "main"
        / "current.png"
    )
    before = current.read_bytes()
    older_image = textured_image() * 0.5

    _, status, older_accepted, saved_path, gate_json = gate.store(
        older_image, older, "BLOCK TECHNICAL", 864, 480, ""
    )

    record = json.loads(gate_json)
    assert newer_accepted is True
    assert older_accepted is False
    assert status == "HANDOFF NOT ADVANCED — Take 0001 completed after Take 0002"
    assert record["result"] == "out_of_sequence"
    assert Path(saved_path).name == "out-of-sequence-handoff.png"
    assert current.read_bytes() == before
