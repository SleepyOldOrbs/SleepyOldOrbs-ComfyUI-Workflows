import importlib.util
import json
import sys
import types
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

    package_name = "codex_h3_production_m5_under_test"
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


def gradient_image(width=96, height=64):
    x = torch.linspace(0.1, 0.7, width).view(1, 1, width, 1)
    y = torch.linspace(0.0, 0.2, height).view(1, height, 1, 1)
    return (x + y).expand(1, height, width, 3).clamp(0, 1)


def open_take(module, *, shot):
    project = module.NODE_CLASS_MAPPINGS["CodexH3ProjectControl"]()
    return project.open_take(
        project="Continuity History",
        scene="Kitchen",
        shot=shot,
        branch="main",
        engine="m5-state-test",
        model="(none)",
        lora="(none)",
        profile="Gold Base",
        prompt="A goat crosses the kitchen.",
        references_json='["goat"]',
        parent_handoff="",
        native_width=96,
        native_height=64,
        delivery_width=96,
        delivery_height=64,
        seed=42,
    )


def test_continuity_monitor_reports_brightness_metric_and_threshold(tmp_path):
    module = load_nodes(tmp_path)
    monitor = module.NODE_CLASS_MAPPINGS["CodexH3ContinuityMonitor"]()
    previous = gradient_image()
    brighter = (previous + 0.32).clamp(0, 1)

    current, difference, status, advisory, metrics_json, chain_length = (
        monitor.compare(previous, brighter)
    )
    metrics = json.loads(metrics_json)

    assert torch.equal(current, brighter)
    assert difference.shape == brighter.shape
    assert metrics["previous"]["dimensions"] == [96, 64]
    assert metrics["current"]["dimensions"] == [96, 64]
    assert metrics["comparisons"]["brightness_delta"] > 0.18
    assert metrics["thresholds"]["brightness_delta"] == 0.18
    assert status.startswith("CONTINUITY ADVISORY")
    assert "brightness_delta" in advisory
    assert "threshold 0.1800" in advisory
    assert metrics["blocking"] is False
    assert chain_length == 0


def test_continuity_metrics_respond_to_blur_crop_and_identity_pattern(tmp_path):
    module = load_nodes(tmp_path)
    monitor = module.NODE_CLASS_MAPPINGS["CodexH3ContinuityMonitor"]()
    generator = torch.Generator().manual_seed(73)
    base = torch.rand((1, 64, 96, 3), generator=generator)
    blurred = torch.nn.functional.avg_pool2d(
        base.movedim(-1, 1), kernel_size=7, stride=1, padding=3
    ).movedim(1, -1)
    cropped = base[:, 8:-8, 16:-16, :]
    identity_change = 1.0 - base

    blur_metrics = json.loads(monitor.compare(base, blurred)[4])
    crop_metrics = json.loads(monitor.compare(base, cropped)[4])
    identity_metrics = json.loads(monitor.compare(base, identity_change)[4])

    assert blur_metrics["comparisons"]["sharpness_ratio"] < 0.5
    assert blur_metrics["current"]["edge_density"] < blur_metrics["previous"][
        "edge_density"
    ]
    assert crop_metrics["comparisons"]["dimension_match"] is False
    assert crop_metrics["comparisons"]["aspect_ratio_delta"] > 0
    assert identity_metrics["comparisons"]["perceptual_hash_distance"] >= 48
    assert identity_metrics["comparisons"]["histogram_distance"] < 0.04
    assert blur_metrics["measurement_source"]["sharpness"] == (
        "H3 Multishot contrast-normalised Laplacian texture energy"
    )
    assert blur_metrics["blocking"] is False


def test_continuity_record_uses_reference_and_prior_accepted_branch_history(tmp_path):
    module = load_nodes(tmp_path)
    first_token, *_ = open_take(module, shot="S01 Arrival")
    first_root = Path(first_token["project_root"]) / first_token["take_directory"]
    first_handoff = first_root / "handoff.png"
    first_handoff.write_bytes(b"accepted-goat-frame")
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3TakeRecorder"]()
    recorder.record(
        token=first_token,
        take_state="accepted",
        output_paths=str(first_handoff),
        completion_signal="accepted test take",
        accepted_signal=True,
    )
    current_token, *_ = open_take(module, shot="S02 Crossing")
    monitor = module.NODE_CLASS_MAPPINGS["CodexH3ContinuityMonitor"]()
    reference = gradient_image()
    ordinary_motion = torch.roll(reference, shifts=2, dims=2)

    result = monitor.compare(
        reference,
        ordinary_motion,
        reference_image=reference,
        take_token=current_token,
    )
    metrics = json.loads(result[4])
    continuity_path = (
        Path(current_token["project_root"])
        / current_token["take_directory"]
        / "continuity.json"
    )
    recorded = json.loads(continuity_path.read_text(encoding="utf-8"))

    assert result[5] == 2
    assert metrics["chain_length"] == 2
    assert metrics["prior_accepted_takes"] == 1
    assert metrics["take_id"] == current_token["take_id"]
    assert metrics["reference"]["dimensions"] == [96, 64]
    assert "reference_histogram_distance" in metrics["comparisons"]
    assert "reference_perceptual_hash_distance" in metrics["comparisons"]
    assert metrics["blocking"] is False
    assert recorded == metrics


def test_reference_manifest_keeps_mixed_types_and_compacts_enabled_slots(tmp_path):
    module = load_nodes(tmp_path)
    builder = module.NODE_CLASS_MAPPINGS["CodexH3ReferenceManifest"]()
    entries = [
        {
            "slot": 1,
            "enabled": True,
            "entity_id": "mabel",
            "display_name": "Mabel",
            "role": "character",
            "view": "front view",
            "description": "red coat",
            "group_id": "cast-mabel",
        },
        {
            "slot": 2,
            "enabled": False,
            "entity_id": "unused",
            "display_name": "Unused",
            "role": "other",
            "view": "unused view",
            "description": "disabled entry",
        },
        {
            "slot": 3,
            "enabled": True,
            "entity_id": "mabel",
            "display_name": "Mabel",
            "role": "character",
            "view": "profile view",
            "description": "same red coat",
            "group_id": "cast-mabel",
        },
        {
            "slot": 4,
            "enabled": True,
            "entity_id": "clover",
            "display_name": "Clover",
            "role": "creature",
            "view": "side view",
            "description": "brown-and-black goat",
        },
        {
            "slot": 5,
            "enabled": True,
            "entity_id": "blue-van",
            "display_name": "Blue Van",
            "role": "vehicle",
            "view": "three-quarter view",
            "description": "small blue delivery van",
        },
        {
            "slot": 6,
            "enabled": True,
            "entity_id": "station",
            "display_name": "Station",
            "role": "location",
            "view": "exterior view",
            "description": "red-brick village station",
        },
        {
            "slot": 7,
            "enabled": True,
            "entity_id": "sandwich",
            "display_name": "Sandwich",
            "role": "prop",
            "view": "hero view",
            "description": "toasted cheese sandwich on a blue plate",
        },
    ]
    images = [torch.full((1, 32, 48, 3), index / 10) for index in range(1, 8)]

    result = builder.build(
        json.dumps(entries),
        image_1=images[0],
        image_2=images[1],
        image_3=images[2],
        image_4=images[3],
        image_5=images[4],
        image_6=images[5],
        image_7=images[6],
    )
    manifest = json.loads(result[11])

    assert torch.equal(result[0], images[0])
    assert torch.equal(result[1], images[2])
    assert torch.equal(result[5], images[6])
    assert result[6:9] == (None, None, None)
    assert result[9].shape == (6, 32, 48, 3)
    assert result[10] == "2,1,1,1,1"
    assert [entry["picture"] for entry in manifest["entries"]] == list(range(1, 7))
    assert [entry["source_slot"] for entry in manifest["entries"]] == [
        1,
        3,
        4,
        5,
        6,
        7,
    ]
    assert [entry["role"] for entry in manifest["entries"]] == [
        "character",
        "character",
        "creature",
        "vehicle",
        "location",
        "prop",
    ]
    assert manifest["entries"][0]["entity_id"] == "mabel"
    assert manifest["entries"][1]["entity_id"] == "mabel"
    assert len(manifest["manifest_sha256"]) == 64
    assert "Picture 1 is Character Mabel: front view — red coat." in result[12]
    assert (
        "Picture 3 is Creature Clover: side view — brown-and-black goat."
        in result[12]
    )
    assert (
        "Picture 6 is Prop Sandwich: hero view — toasted cheese sandwich "
        "on a blue plate."
        in result[12]
    )
    assert "MANIFEST READY — 6 pictures, 5 entities" in result[13]


def test_reference_manifest_preserves_originals_and_records_batch_fitting(tmp_path):
    module = load_nodes(tmp_path)
    builder = module.NODE_CLASS_MAPPINGS["CodexH3ReferenceManifest"]()
    entries = [
        {
            "slot": 1,
            "enabled": True,
            "entity_id": "mabel",
            "display_name": "Mabel",
            "role": "character",
            "view": "front view",
            "description": "red coat",
        },
        {
            "slot": 2,
            "enabled": True,
            "entity_id": "mabel",
            "display_name": "Mabel",
            "role": "character",
            "view": "profile view",
            "description": "same red coat",
        },
    ]
    first = torch.rand((1, 32, 48, 3), generator=torch.Generator().manual_seed(1))
    second = torch.rand((1, 40, 64, 3), generator=torch.Generator().manual_seed(2))

    result = builder.build(
        json.dumps(entries), image_1=first, image_2=second
    )
    manifest = json.loads(result[11])

    assert torch.equal(result[0], first)
    assert torch.equal(result[1], second)
    assert result[9].shape == (2, 32, 48, 3)
    assert manifest["entries"][0]["source_dimensions"] == [48, 32]
    assert manifest["entries"][0]["batch_fit"] == "none"
    assert manifest["entries"][1]["source_dimensions"] == [64, 40]
    assert manifest["entries"][1]["batch_dimensions"] == [48, 32]
    assert manifest["entries"][1]["batch_fit"] == "bilinear_center"
    assert manifest["batch_fitted_count"] == 1


def reference_entry(slot, entity_id, display_name, role="character", **changes):
    entry = {
        "slot": slot,
        "enabled": True,
        "entity_id": entity_id,
        "display_name": display_name,
        "role": role,
        "view": "reference view",
        "description": "literal supplied description",
        "group_id": entity_id,
    }
    entry.update(changes)
    return entry


def test_reference_manifest_rejects_ambiguous_entity_grouping(tmp_path):
    module = load_nodes(tmp_path)
    builder = module.NODE_CLASS_MAPPINGS["CodexH3ReferenceManifest"]()
    image = torch.zeros((1, 16, 16, 3))
    interleaved = [
        reference_entry(1, "mabel", "Mabel"),
        reference_entry(2, "clover", "Clover", role="creature"),
        reference_entry(3, "mabel", "Mabel"),
    ]
    conflicting = [
        reference_entry(1, "mabel", "Mabel"),
        reference_entry(2, "mabel", "Mabel Clone"),
    ]
    invalid_enabled = [
        reference_entry(1, "mabel", "Mabel", enabled="false")
    ]

    with pytest.raises(ValueError, match="contiguous"):
        builder.build(
            json.dumps(interleaved), image_1=image, image_2=image, image_3=image
        )
    with pytest.raises(ValueError, match="metadata"):
        builder.build(json.dumps(conflicting), image_1=image, image_2=image)
    with pytest.raises(ValueError, match="enabled must be true or false"):
        builder.build(json.dumps(invalid_enabled), image_1=image)


def test_reference_manifest_hash_is_repeatable_and_one_picture_means_one_image(
    tmp_path,
):
    module = load_nodes(tmp_path)
    builder = module.NODE_CLASS_MAPPINGS["CodexH3ReferenceManifest"]()
    entries = [reference_entry(1, "clover", "Clover", role="creature")]
    image = torch.rand((1, 20, 24, 3), generator=torch.Generator().manual_seed(8))

    first = builder.build(json.dumps(entries), image_1=image)
    second = builder.build(json.dumps(entries), image_1=image.clone())
    changed = builder.build(json.dumps(entries), image_1=1.0 - image)

    assert first[11] == second[11]
    assert first[12] == second[12]
    assert json.loads(first[11])["manifest_sha256"] != json.loads(changed[11])[
        "manifest_sha256"
    ]
    with pytest.raises(ValueError, match="exactly one image"):
        builder.build(json.dumps(entries), image_1=torch.cat((image, image), dim=0))
