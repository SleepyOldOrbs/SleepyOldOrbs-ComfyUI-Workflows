import importlib.util
import json
import sys
import types
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

    package_name = "codex_h3_production_controls_under_test"
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


def test_render_profile_control_exposes_only_evidence_cleared_atomic_recipes(tmp_path):
    module = load_nodes(tmp_path)
    node_class = module.NODE_CLASS_MAPPINGS["CodexH3RenderProfileControl"]
    inputs = node_class.INPUT_TYPES()["required"]
    node = node_class()

    gold = node.select("Gold Base", "workflow-10")
    preview = node.select("Quick Preview", "h3-multishot-first-frame")

    assert inputs["profile"][0] == ["Gold Base", "Quick Preview"]
    assert set(inputs) == {"profile", "engine"}
    assert gold[1:7] == (
        "Gold Base",
        20,
        1.0,
        "res_multistep",
        "simple",
        "(none)",
    )
    assert preview[1:7] == (
        "Quick Preview",
        6,
        1.0,
        "res_multistep",
        "simple",
        "(none)",
    )
    assert gold[0]["quality_tier"] == "final"
    assert gold[0]["engine"] == "workflow-10"
    assert gold[0]["resolution_owner"] == "external Pixaroma controls"
    assert preview[0]["quality_tier"] == "non-final preview"
    assert preview[0]["engine"] == "h3-multishot-first-frame"
    assert len(gold[0]["recipe_sha256"]) == 64
    assert len(preview[0]["recipe_sha256"]) == 64
    assert gold[7] == (
        "PROFILE READY — Gold Base — workflow-10 — 20 steps, CFG 1, "
        "res_multistep/simple, LoRA (none) — FINAL"
    )
    assert preview[7] == (
        "PROFILE READY — Quick Preview — h3-multishot-first-frame — 6 steps, "
        "CFG 1, res_multistep/simple, LoRA (none) — NON-FINAL PREVIEW"
    )


def test_project_take_provenance_records_the_complete_selected_profile(tmp_path):
    module = load_nodes(tmp_path)
    profile = module.NODE_CLASS_MAPPINGS["CodexH3RenderProfileControl"]().select(
        "Gold Base", "workflow-10"
    )
    project = module.NODE_CLASS_MAPPINGS["CodexH3ProjectControl"]()

    token, *_ = project.open_take(
        project="Profile provenance",
        scene="Lab",
        shot="S01 Recipe",
        branch="main",
        engine="workflow-10",
        model="H3/model.safetensors",
        lora="(none)",
        profile=profile[1],
        prompt="Profile evidence only.",
        references_json="[]",
        parent_handoff="",
        native_width=864,
        native_height=480,
        delivery_width=864,
        delivery_height=480,
        seed=42,
        render_profile=profile[0],
    )

    assert token["provenance"]["render_profile"] == profile[0]
    assert token["provenance"]["render_profile"]["recipe_sha256"] == profile[0][
        "recipe_sha256"
    ]
    with pytest.raises(ValueError, match="does not match the take"):
        project.open_take(
            project="Profile provenance",
            scene="Lab",
            shot="S02 Mismatch",
            branch="main",
            engine="workflow-10",
            model="H3/model.safetensors",
            lora="(none)",
            profile="Quick Preview",
            prompt="Mismatch must fail.",
            references_json="[]",
            parent_handoff="",
            native_width=864,
            native_height=480,
            delivery_width=864,
            delivery_height=480,
            seed=42,
            render_profile=profile[0],
        )


THREE_SHOT_PLAN = [
    {
        "shot_id": "S01",
        "title": "The arrival",
        "scene": "Kitchen",
        "action": "A goat walks to the table and stops beside the teapot.",
        "camera": "Locked medium-wide shot at goat eye level.",
        "dialogue": 'Mabel says, "Tea — now?"',
        "references": ["character:mabel", "prop:blue-teapot"],
        "profile_override": "Gold Base",
        "handoff_notes": "Keep the goat on frame left.",
    },
    {
        "shot_id": "S02",
        "title": "The answer",
        "scene": "Kitchen",
        "action": "Arthur turns from the sink without moving the teapot.",
        "camera": "Slow push toward Arthur.",
        "dialogue": 'Arthur replies, "Not before the bell."',
        "references": ["character:arthur", "prop:blue-teapot"],
        "profile_override": "Quick Preview",
        "handoff_notes": "End with Arthur facing camera right.",
    },
    {
        "shot_id": "S03",
        "title": "The bell",
        "scene": "Hallway",
        "action": "The brass bell rings once as both characters look off-screen.",
        "camera": "Static close-up on the bell, then rack focus behind it.",
        "dialogue": "",
        "references": ["prop:brass-bell"],
        "profile_override": "Gold Base",
        "handoff_notes": "Hold the bell centred for the next sequence.",
    },
]


def create_plan(
    module,
    *,
    project="Small Emergencies",
    branch="main",
    action="ensure",
    shots=None,
):
    control = module.NODE_CLASS_MAPPINGS["CodexH3ShotPlanControl"]()
    return control.control(
        project=project,
        branch=branch,
        plan_name="Kitchen sequence",
        plan_json=json.dumps(shots or THREE_SHOT_PLAN, ensure_ascii=False),
        action=action,
    )


def test_shot_plan_is_versioned_and_first_shot_is_read_at_execution_time(tmp_path):
    module = load_nodes(tmp_path)
    control_token, control_status, position, plan_hash = create_plan(module)
    reader = module.NODE_CLASS_MAPPINGS["CodexH3ShotPlanReader"]()

    result = reader.read(control_token)

    project_root = tmp_path / "H3_Projects" / "small-emergencies"
    plan_root = project_root / "shot-plan" / "kitchen-sequence"
    plan = json.loads((plan_root / "plan.json").read_text(encoding="utf-8"))
    state = json.loads(
        (plan_root / "branches" / "main.json").read_text(encoding="utf-8")
    )
    assert control_status == "PLAN READY — Kitchen sequence — main — shot 1 of 3"
    assert position == "1/3"
    assert plan_hash == plan["plan_sha256"] == state["plan_sha256"]
    assert (plan_root / "versions" / f"{plan_hash}.json").is_file()
    assert result[1:5] == (
        "Small Emergencies",
        "Kitchen",
        "S01 The arrival",
        "main",
    )
    assert result[5] == (
        "A goat walks to the table and stops beside the teapot.\n"
        "Camera: Locked medium-wide shot at goat eye level.\n"
        'Dialogue (exact): Mabel says, "Tea — now?"'
    )
    assert result[6] == 'Mabel says, "Tea — now?"'
    assert json.loads(result[7]) == ["character:mabel", "prop:blue-teapot"]
    assert result[8] == "Gold Base"
    assert result[9] == "Keep the goat on frame left."
    assert result[10] == "SHOT READY — S01 The arrival — 1 of 3 — plan locked"
    assert result[0]["shot_id"] == "S01"
    assert result[0]["state_revision"] == 0
    assert result[0]["plan_sha256"] == plan_hash


def record_current_take(module, shot_result, *, accepted):
    project_control = module.NODE_CLASS_MAPPINGS["CodexH3ProjectControl"]()
    take_token, *_ = project_control.open_take(
        project=shot_result[1],
        scene=shot_result[2],
        shot=shot_result[3],
        branch=shot_result[4],
        engine="m4-state-test",
        model="(none)",
        lora="(none)",
        profile=shot_result[8] or "Gold Base",
        prompt=shot_result[5],
        references_json=shot_result[7],
        parent_handoff="",
        native_width=864,
        native_height=480,
        delivery_width=864,
        delivery_height=480,
        seed=42,
    )
    take_root = Path(take_token["project_root"]) / take_token["take_directory"]
    handoff = take_root / ("handoff.png" if accepted else "rejected-handoff.png")
    handoff.write_bytes(b"accepted-frame" if accepted else b"rejected-frame")
    recorder = module.NODE_CLASS_MAPPINGS["CodexH3TakeRecorder"]()
    _, record_json, *_ = recorder.record(
        token=take_token,
        take_state="accepted" if accepted else "rejected",
        output_paths=str(handoff),
        completion_signal="test take",
        accepted_signal=accepted,
    )
    return str(handoff), record_json


def test_commit_advances_only_after_accepted_take_and_retains_rejected_shot(tmp_path):
    module = load_nodes(tmp_path)
    plan_control, *_ = create_plan(module)
    reader = module.NODE_CLASS_MAPPINGS["CodexH3ShotPlanReader"]()
    commit = module.NODE_CLASS_MAPPINGS["CodexH3ShotPlanCommit"]()
    first = reader.read(plan_control)
    first_handoff, first_record = record_current_take(module, first, accepted=True)

    first_status, first_position, first_complete = commit.commit(
        shot_token=first[0],
        accepted=True,
        handoff_path=first_handoff,
        take_record_json=first_record,
    )
    with pytest.raises(ValueError, match="shot position is stale"):
        commit.commit(
            shot_token=first[0],
            accepted=True,
            handoff_path=first_handoff,
            take_record_json=first_record,
        )
    second = reader.read(plan_control)
    second_handoff, second_record = record_current_take(module, second, accepted=False)
    second_status, second_position, second_complete = commit.commit(
        shot_token=second[0],
        accepted=False,
        handoff_path=second_handoff,
        take_record_json=second_record,
    )
    repeated_second = reader.read(plan_control)

    assert first_status == (
        "PLAN ADVANCED — accepted S01 via "
        "kitchen/s01-the-arrival/main/take-0001 — next shot 2 of 3"
    )
    assert first_position == "2/3"
    assert first_complete is False
    assert second_status == (
        "PLAN RETAINED — rejected S02 via "
        "kitchen/s02-the-answer/main/take-0001 — remains shot 2 of 3"
    )
    assert second_position == "2/3"
    assert second_complete is False
    assert repeated_second[0]["shot_id"] == "S02"
    assert repeated_second[0]["state_revision"] == 2
    state_path = (
        tmp_path
        / "H3_Projects"
        / "small-emergencies"
        / "shot-plan"
        / "kitchen-sequence"
        / "branches"
        / "main.json"
    )
    history = json.loads(state_path.read_text(encoding="utf-8"))["history"]
    assert [event["result"] for event in history] == ["accepted", "rejected"]
    assert [event["shot_id"] for event in history] == ["S01", "S02"]


def test_operator_navigation_and_explicit_reset_preserve_plan_versions(tmp_path):
    module = load_nodes(tmp_path)
    original_control, _, _, original_hash = create_plan(module)
    reader = module.NODE_CLASS_MAPPINGS["CodexH3ShotPlanReader"]()

    _, next_status, next_position, _ = create_plan(module, action="next")
    after_next = reader.read(original_control)
    _, repeat_status, repeat_position, _ = create_plan(module, action="repeat")
    after_repeat = reader.read(original_control)
    _, previous_status, previous_position, _ = create_plan(module, action="previous")
    after_previous = reader.read(original_control)

    edited = [dict(shot) for shot in THREE_SHOT_PLAN]
    edited[0] = dict(edited[0], action="The goat enters through the red door.")
    try:
        create_plan(module, shots=edited)
    except ValueError as exc:
        assert "use the explicit reset action" in str(exc)
    else:
        raise AssertionError("A changed live plan was accepted without reset")
    reset_control, reset_status, reset_position, reset_hash = create_plan(
        module,
        action="reset",
        shots=edited,
    )
    after_reset = reader.read(reset_control)

    assert next_status == "PLAN MOVED — Kitchen sequence — main — shot 2 of 3"
    assert next_position == "2/3"
    assert after_next[0]["shot_id"] == "S02"
    assert repeat_status == "PLAN REPEAT — Kitchen sequence — main — shot 2 of 3"
    assert repeat_position == "2/3"
    assert after_repeat[0]["shot_id"] == "S02"
    assert previous_status == "PLAN MOVED — Kitchen sequence — main — shot 1 of 3"
    assert previous_position == "1/3"
    assert after_previous[0]["shot_id"] == "S01"
    assert reset_hash != original_hash
    assert reset_status == "PLAN RESET — Kitchen sequence — main — shot 1 of 3"
    assert reset_position == "1/3"
    assert after_reset[5].startswith("The goat enters through the red door.")

    versions = (
        tmp_path
        / "H3_Projects"
        / "small-emergencies"
        / "shot-plan"
        / "kitchen-sequence"
        / "versions"
    )
    assert (versions / f"{original_hash}.json").is_file()
    assert (versions / f"{reset_hash}.json").is_file()
    state = json.loads(
        (
            tmp_path
            / "H3_Projects"
            / "small-emergencies"
            / "shot-plan"
            / "kitchen-sequence"
            / "branches"
            / "main.json"
        ).read_text(encoding="utf-8")
    )
    assert state["revision"] == 4
    assert [event["result"] for event in state["history"]] == [
        "operator_next",
        "operator_repeat",
        "operator_previous",
        "operator_reset",
    ]
    assert state["history"][-1]["previous_plan_sha256"] == original_hash
    assert state["history"][-1]["plan_sha256"] == reset_hash


def test_prequeued_control_reads_three_shots_in_order_and_reports_completion(tmp_path):
    module = load_nodes(tmp_path)
    prequeued_control, *_ = create_plan(module)
    reader = module.NODE_CLASS_MAPPINGS["CodexH3ShotPlanReader"]()
    commit = module.NODE_CLASS_MAPPINGS["CodexH3ShotPlanCommit"]()
    seen = []
    final_status = ""

    first = reader.read(prequeued_control)
    seen.append(first[0]["shot_id"])
    first_handoff, first_record = record_current_take(module, first, accepted=True)
    commit.commit(first[0], True, first_handoff, first_record)

    failed_second = reader.read(prequeued_control)
    repeated_after_failure = reader.read(prequeued_control)
    assert failed_second[0]["shot_id"] == "S02"
    assert repeated_after_failure[0]["shot_id"] == "S02"
    assert failed_second[0]["state_revision"] == repeated_after_failure[0][
        "state_revision"
    ]

    for expected_id in ("S02", "S03"):
        shot = reader.read(prequeued_control)
        seen.append(shot[0]["shot_id"])
        handoff, record = record_current_take(module, shot, accepted=True)
        final_status, _, _ = commit.commit(shot[0], True, handoff, record)
        assert shot[0]["shot_id"] == expected_id

    _, complete_status, complete_position, _ = create_plan(module)

    assert seen == ["S01", "S02", "S03"]
    assert final_status == (
        "PLAN COMPLETE — accepted S03 via "
        "hallway/s03-the-bell/main/take-0001 — 3 of 3 committed"
    )
    assert complete_status == "PLAN COMPLETE — Kitchen sequence — main — 3 of 3 committed"
    assert complete_position == "complete 3/3"
    with pytest.raises(ValueError, match="plan is complete"):
        reader.read(prequeued_control)
