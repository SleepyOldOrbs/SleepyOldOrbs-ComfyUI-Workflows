"""ComfyUI nodes for reproducible H3 production records."""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path

import folder_paths
import torch
from PIL import Image, PngImagePlugin


_SLUG_RE = re.compile(r"[^a-z0-9]+")
_RECORD_LOCK = threading.Lock()
_STATE_LOCK = threading.RLock()
_FILE_TIMESTAMP_TOLERANCE_NS = 10_000_000


def _project_slug(value: object) -> str:
    display = str(value or "").strip()
    ascii_name = unicodedata.normalize("NFKD", display).encode("ascii", "ignore").decode()
    slug = _SLUG_RE.sub("-", ascii_name.lower()).strip("-")
    return (slug or "untitled")[:80]


def _resolve_output_path(value: object) -> tuple[Path, str]:
    output_root = Path(folder_paths.get_output_directory()).resolve()
    candidate = Path(str(value).strip())
    resolved = (candidate if candidate.is_absolute() else output_root / candidate).resolve()
    try:
        relative = resolved.relative_to(output_root)
    except ValueError as exc:
        raise ValueError(
            "H3 benchmark output path must stay inside the ComfyUI output directory"
        ) from exc
    return resolved, relative.as_posix()


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            json.dump(payload, handle, indent=2, sort_keys=True)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def _atomic_save_png(image: Image.Image, path: Path, metadata: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pnginfo = PngImagePlugin.PngInfo()
    for key, value in metadata.items():
        pnginfo.add_text(str(key), str(value))
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.stem}.", suffix=".tmp.png", dir=path.parent
    )
    os.close(descriptor)
    try:
        image.save(
            temporary_name,
            format="PNG",
            pnginfo=pnginfo,
            compress_level=4,
        )
        os.replace(temporary_name, path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def _atomic_copy_file(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{destination.name}.", suffix=".tmp", dir=destination.parent
    )
    try:
        with source.open("rb") as input_handle, os.fdopen(
            descriptor, "wb"
        ) as output_handle:
            for block in iter(lambda: input_handle.read(1024 * 1024), b""):
                output_handle.write(block)
            output_handle.flush()
            os.fsync(output_handle.fileno())
        os.replace(temporary_name, destination)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def _output_root() -> Path:
    return Path(folder_paths.get_output_directory()).resolve()


def _resolve_media_path(value: object) -> Path:
    output_root = _output_root()
    candidate = Path(str(value).strip())
    resolved = (candidate if candidate.is_absolute() else output_root / candidate).resolve()
    try:
        resolved.relative_to(output_root)
    except ValueError as exc:
        raise ValueError(
            "H3 media path must stay inside the ComfyUI output directory"
        ) from exc
    return resolved


def _media_descriptor(path: Path, project_root: Path) -> dict:
    if not path.is_file():
        raise ValueError(f"H3 media file does not exist: {path}")
    try:
        relative = path.relative_to(project_root)
        scope = "project"
    except ValueError:
        relative = path.relative_to(_output_root())
        scope = "output"
    return {
        "path": relative.as_posix(),
        "scope": scope,
        "sha256": _sha256_file(path),
        "size_bytes": path.stat().st_size,
    }


def _parse_references(value: object) -> list:
    text = str(value or "").strip()
    if not text:
        return []
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError("H3 references_json must contain valid JSON") from exc
    if not isinstance(parsed, list):
        raise ValueError("H3 references_json must contain a JSON array")
    return parsed


def _project_root_from_token(token: dict) -> Path:
    identity = token.get("identity")
    if not isinstance(identity, dict):
        raise ValueError("H3 project/take token has no identity")
    project_slug = str(identity.get("project_slug", ""))
    if project_slug != _project_slug(project_slug):
        raise ValueError("H3 project/take token has an invalid project slug")
    expected = (_output_root() / "H3_Projects" / project_slug).resolve()
    recorded = Path(str(token.get("project_root", ""))).resolve()
    if recorded != expected:
        raise ValueError("H3 project/take token does not belong to this output directory")
    return expected


def _take_root_from_token(token: dict) -> tuple[Path, Path]:
    project_root = _project_root_from_token(token)
    take_directory = Path(str(token.get("take_directory", "")))
    take_root = (project_root / take_directory).resolve()
    try:
        take_root.relative_to(project_root / "takes")
    except ValueError as exc:
        raise ValueError("H3 project/take token has an invalid take directory") from exc
    if not take_root.is_dir():
        raise ValueError(f"H3 take directory does not exist: {take_root}")
    return project_root, take_root


def _atomic_write_jsonl(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            for record in records:
                handle.write(json.dumps(record, sort_keys=True, separators=(",", ":")))
                handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    finally:
        if os.path.exists(temporary_name):
            os.unlink(temporary_name)


def _read_jsonl(path: Path) -> list[dict]:
    records = []
    for line_number, line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"H3 benchmark manifest has invalid JSONL at line {line_number}"
            ) from exc
        if not isinstance(record, dict):
            raise ValueError(
                f"H3 benchmark manifest has invalid JSONL at line {line_number}: "
                "record must be an object"
            )
        records.append(record)
    return records


class CodexH3BenchmarkStart:
    """Capture one render configuration immediately before its sampler seed is read."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "project": ("STRING", {"default": "h3-production-lab"}),
                "engine": ("STRING", {"default": "workflow-10"}),
                "model": ("STRING", {"default": ""}),
                "lora": ("STRING", {"default": "(none)"}),
                "profile": ("STRING", {"default": "Gold Base"}),
                "native_width": ("INT", {"default": 864, "min": 1}),
                "native_height": ("INT", {"default": 480, "min": 1}),
                "delivery_width": ("INT", {"default": 864, "min": 1}),
                "delivery_height": ("INT", {"default": 480, "min": 1}),
                "frame_count": ("INT", {"default": 124, "min": 1}),
                "steps": ("INT", {"default": 20, "min": 1}),
                "cfg": ("FLOAT", {"default": 1.0, "min": 0.0, "step": 0.1}),
                "sampler": ("STRING", {"default": "res_multistep"}),
                "scheduler": ("STRING", {"default": "simple"}),
                "seed": ("INT", {"default": 0, "min": 0, "max": 0xFFFFFFFFFFFFFFFF}),
            }
        }

    RETURN_TYPES = ("H3_BENCHMARK_TOKEN", "INT")
    RETURN_NAMES = ("benchmark_token", "render_seed")
    FUNCTION = "start"
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Capture the exact H3 settings and start time, then supply the same seed to "
        "the sampler so timing begins on the real render dependency path."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    def start(
        self,
        project,
        engine,
        model,
        lora,
        profile,
        native_width,
        native_height,
        delivery_width,
        delivery_height,
        frame_count,
        steps,
        cfg,
        sampler,
        scheduler,
        seed,
    ):
        settings = {
            "cfg": float(cfg),
            "delivery_dimensions": [int(delivery_width), int(delivery_height)],
            "engine": str(engine),
            "frame_count": int(frame_count),
            "lora": str(lora),
            "model": str(model),
            "native_dimensions": [int(native_width), int(native_height)],
            "profile": str(profile),
            "sampler": str(sampler),
            "scheduler": str(scheduler),
            "seed": int(seed),
            "steps": int(steps),
        }
        canonical = json.dumps(settings, sort_keys=True, separators=(",", ":"))
        token = {
            "run_id": str(uuid.uuid4()),
            "project": str(project).strip() or "Untitled",
            "project_slug": _project_slug(project),
            "started_at": datetime.now(timezone.utc).isoformat(),
            "wall_started_ns": time.time_ns(),
            "monotonic_started": time.perf_counter(),
            "settings": settings,
            "settings_sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
        }
        return token, int(seed)


class CodexH3BenchmarkRecorder:
    """Atomically append a completed render record to its project manifest."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "token": ("H3_BENCHMARK_TOKEN",),
                "output_path": ("STRING", {"default": ""}),
                "completion_state": (
                    ["auto", "success", "cached", "interrupted", "failed"],
                    {"default": "auto"},
                ),
                "peak_vram_mb": ("FLOAT", {"default": 0.0, "min": 0.0}),
                "completion_signal": ("STRING", {"default": ""}),
            }
        }

    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("status", "record_json", "manifest_path")
    FUNCTION = "record"
    OUTPUT_NODE = True
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Record an H3 render only after its output file or explicit terminal state "
        "is available. Project manifests are replaced atomically."
    )

    def record(
        self,
        token,
        output_path,
        completion_state,
        peak_vram_mb=0.0,
        completion_signal="",
    ):
        project_slug = str(token.get("project_slug", ""))
        if project_slug != _project_slug(project_slug):
            raise ValueError("H3 benchmark project slug is invalid")

        resolved_output, relative_output = _resolve_output_path(output_path)
        state = str(completion_state)
        allowed_states = {"auto", "success", "cached", "interrupted", "failed"}
        if state not in allowed_states:
            raise ValueError(f"Unsupported H3 benchmark completion state: {state}")

        output_exists = resolved_output.is_file()
        if not output_exists and state not in {"interrupted", "failed"}:
            raise ValueError(f"H3 benchmark output does not exist: {relative_output}")

        if state == "auto":
            # Windows filesystems can expose a coarser write timestamp than
            # time.time_ns(); allow one timestamp quantum around the start.
            state = (
                "success"
                if resolved_output.stat().st_mtime_ns
                >= int(token["wall_started_ns"]) - _FILE_TIMESTAMP_TOLERANCE_NS
                else "cached"
            )

        recorded_at = datetime.now(timezone.utc).isoformat()
        elapsed_seconds = max(0.0, time.perf_counter() - float(token["monotonic_started"]))
        output_sha256 = _sha256_file(resolved_output) if output_exists else None
        record_id_source = ":".join(
            [str(token["settings_sha256"]), output_sha256 or "(no-output)", state]
        )
        record = {
            "schema_version": 1,
            "record_id": hashlib.sha256(record_id_source.encode("utf-8")).hexdigest(),
            "run_id": str(token["run_id"]),
            "recorded_at": recorded_at,
            "started_at": str(token["started_at"]),
            "project": str(token["project"]),
            "project_slug": project_slug,
            "settings": token["settings"],
            "settings_sha256": str(token["settings_sha256"]),
            "completion_state": state,
            "completion_signal": str(completion_signal),
            "elapsed_seconds": round(elapsed_seconds, 6),
            "peak_vram_mb": float(peak_vram_mb),
            "output_path": relative_output,
            "output_exists": output_exists,
            "output_sha256": output_sha256,
        }
        output_root = Path(folder_paths.get_output_directory()).resolve()
        manifest = (
            output_root
            / "H3_Projects"
            / project_slug
            / "benchmarks"
            / "benchmark.jsonl"
        )

        with _RECORD_LOCK:
            records = []
            if manifest.is_file():
                records = _read_jsonl(manifest)
            existing = next(
                (
                    item
                    for item in records
                    if item.get("record_id") == record["record_id"]
                ),
                None,
            )
            if existing is None:
                records.append(record)
                _atomic_write_jsonl(manifest, records)

        if existing is not None:
            return (
                "DUPLICATE — existing benchmark retained",
                json.dumps(existing, sort_keys=True),
                str(manifest),
            )

        return (
            f"RECORDED — {state}",
            json.dumps(record, sort_keys=True),
            str(manifest),
        )


class CodexH3ProjectControl:
    """Create an isolated project identity and atomically reserve one take."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "project": ("STRING", {"default": "H3 Production Lab"}),
                "scene": ("STRING", {"default": "Scene 1"}),
                "shot": ("STRING", {"default": "Shot 1"}),
                "branch": ("STRING", {"default": "main"}),
                "engine": ("STRING", {"default": "workflow-10"}),
                "model": ("STRING", {"default": ""}),
                "lora": ("STRING", {"default": "(none)"}),
                "profile": ("STRING", {"default": "Gold Base"}),
                "prompt": ("STRING", {"default": "", "multiline": True}),
                "references_json": (
                    "STRING",
                    {"default": "[]", "multiline": True},
                ),
                "parent_handoff": ("STRING", {"default": ""}),
                "native_width": ("INT", {"default": 864, "min": 1}),
                "native_height": ("INT", {"default": 480, "min": 1}),
                "delivery_width": ("INT", {"default": 864, "min": 1}),
                "delivery_height": ("INT", {"default": 480, "min": 1}),
                "seed": (
                    "INT",
                    {"default": 0, "min": 0, "max": 0xFFFFFFFFFFFFFFFF},
                ),
            },
            "optional": {
                "render_profile": ("H3_RENDER_PROFILE",),
            },
        }

    RETURN_TYPES = ("H3_PROJECT_TAKE", "STRING", "INT", "STRING")
    RETURN_NAMES = ("take_token", "take_label", "render_seed", "status")
    FUNCTION = "open_take"
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Create or open an isolated H3 project and atomically reserve the next "
        "take number for one scene, shot, and branch."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    def open_take(
        self,
        project,
        scene,
        shot,
        branch,
        engine,
        model,
        lora,
        profile,
        prompt,
        references_json,
        parent_handoff,
        native_width,
        native_height,
        delivery_width,
        delivery_height,
        seed,
        render_profile=None,
    ):
        display_project = str(project or "").strip() or "Untitled"
        display_scene = str(scene or "").strip() or "Scene"
        display_shot = str(shot or "").strip() or "Shot"
        display_branch = str(branch or "").strip() or "main"
        project_slug = _project_slug(display_project)
        scene_slug = _project_slug(display_scene)
        shot_slug = _project_slug(display_shot)
        branch_slug = _project_slug(display_branch)
        project_root = _output_root() / "H3_Projects" / project_slug
        project_manifest = project_root / "project.json"
        opened_at = datetime.now(timezone.utc).isoformat()
        render_profile_record = None
        if render_profile is not None:
            if not isinstance(render_profile, dict):
                raise ValueError("H3 render profile token must be an object")
            if (
                render_profile.get("profile") != str(profile)
                or render_profile.get("engine") != str(engine)
                or render_profile.get("required_lora") != str(lora)
            ):
                raise ValueError(
                    "H3 render profile token does not match the take profile, "
                    "engine, or LoRA"
                )
            recipe = {
                key: render_profile.get(key)
                for key in (
                    "steps",
                    "cfg",
                    "sampler",
                    "scheduler",
                    "required_lora",
                    "quality_tier",
                    "evidence",
                )
            }
            canonical_recipe = json.dumps(
                recipe, sort_keys=True, separators=(",", ":")
            )
            expected_recipe_hash = hashlib.sha256(
                canonical_recipe.encode("utf-8")
            ).hexdigest()
            if render_profile.get("recipe_sha256") != expected_recipe_hash:
                raise ValueError("H3 render profile token hash is invalid")
            render_profile_record = dict(render_profile)

        with _STATE_LOCK:
            project_root.mkdir(parents=True, exist_ok=True)
            if project_manifest.is_file():
                try:
                    existing_project = json.loads(
                        project_manifest.read_text(encoding="utf-8")
                    )
                except json.JSONDecodeError as exc:
                    raise ValueError(
                        f"H3 project manifest is invalid: {project_manifest}"
                    ) from exc
                if existing_project.get("display_name") != display_project:
                    raise ValueError(
                        "H3 project name collides with an existing filesystem slug: "
                        f"{project_slug}"
                    )
            else:
                existing_project = {
                    "schema_version": 1,
                    "display_name": display_project,
                    "project_slug": project_slug,
                    "created_at": opened_at,
                }
                _atomic_write_json(project_manifest, existing_project)

            for directory in (
                "shot-plan",
                "references",
                "takes",
                "handoffs",
                "benchmarks",
                "assemblies",
            ):
                (project_root / directory).mkdir(exist_ok=True)

            branch_root = (
                project_root / "takes" / scene_slug / shot_slug / branch_slug
            )
            branch_root.mkdir(parents=True, exist_ok=True)
            take_number = 1
            while True:
                take_root = branch_root / f"take-{take_number:04d}"
                try:
                    take_root.mkdir()
                    break
                except FileExistsError:
                    take_number += 1

        parent_record = None
        parent_text = str(parent_handoff or "").strip()
        if parent_text:
            parent_path = _resolve_media_path(parent_text)
            parent_descriptor = _media_descriptor(parent_path, project_root)
            parent_record = {
                key: parent_descriptor[key] for key in ("path", "scope", "sha256")
            }

        identity = {
            "project": display_project,
            "project_slug": project_slug,
            "scene": display_scene,
            "scene_slug": scene_slug,
            "shot": display_shot,
            "shot_slug": shot_slug,
            "branch": display_branch,
            "branch_slug": branch_slug,
            "take_number": take_number,
        }
        provenance = {
            "engine": str(engine),
            "model": str(model),
            "lora": str(lora),
            "profile": str(profile),
            "prompt": str(prompt),
            "references": _parse_references(references_json),
            "native_dimensions": [int(native_width), int(native_height)],
            "delivery_dimensions": [int(delivery_width), int(delivery_height)],
            "seed": int(seed),
        }
        if render_profile_record is not None:
            provenance["render_profile"] = render_profile_record
        take_directory = take_root.relative_to(project_root).as_posix()
        take_id = f"{scene_slug}/{shot_slug}/{branch_slug}/take-{take_number:04d}"
        token = {
            "schema_version": 1,
            "take_id": take_id,
            "project_root": str(project_root.resolve()),
            "take_directory": take_directory,
            "opened_at": opened_at,
            "monotonic_started": time.perf_counter(),
            "identity": identity,
            "provenance": provenance,
            "parent_handoff": parent_record,
        }
        take_label = (
            f"{display_scene} / {display_shot} / {display_branch} / "
            f"Take {take_number:04d}"
        )
        return token, take_label, int(seed), f"TAKE READY — {take_label}"


class CodexH3TakeRecorder:
    """Write an immutable take manifest and append the project take index."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "token": ("H3_PROJECT_TAKE",),
                "take_state": (
                    ["auto", "accepted", "rejected", "failed", "interrupted"],
                    {"default": "auto"},
                ),
                "output_paths": (
                    "STRING",
                    {"default": "", "multiline": True, "forceInput": True},
                ),
                "completion_signal": (
                    "STRING",
                    {"default": "", "forceInput": True},
                ),
                "accepted_signal": (
                    "BOOLEAN",
                    {"default": True, "forceInput": True},
                ),
            }
        }

    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING")
    RETURN_NAMES = (
        "status",
        "take_record_json",
        "take_manifest_path",
        "project_index_path",
    )
    FUNCTION = "record"
    OUTPUT_NODE = True
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Record the accepted, rejected, failed, or interrupted result for one "
        "reserved take, including reproducible provenance and media hashes."
    )

    def record(
        self,
        token,
        take_state,
        output_paths,
        completion_signal,
        accepted_signal=True,
    ):
        project_root, take_root = _take_root_from_token(token)
        identity = token.get("identity")
        provenance = token.get("provenance")
        if not isinstance(identity, dict) or not isinstance(provenance, dict):
            raise ValueError("H3 project/take token is missing provenance")
        state = str(take_state)
        allowed = {"auto", "accepted", "rejected", "failed", "interrupted"}
        if state not in allowed:
            raise ValueError(f"Unsupported H3 take state: {state}")
        if state == "auto":
            state = "accepted" if bool(accepted_signal) else "rejected"

        raw_paths = str(output_paths or "").strip()
        if raw_paths.startswith("["):
            try:
                path_values = json.loads(raw_paths)
            except json.JSONDecodeError as exc:
                raise ValueError("H3 output_paths JSON is invalid") from exc
            if not isinstance(path_values, list) or not all(
                isinstance(item, str) for item in path_values
            ):
                raise ValueError("H3 output_paths JSON must be an array of paths")
        else:
            path_values = [line.strip() for line in raw_paths.splitlines() if line.strip()]

        media = []
        for path_value in path_values:
            media_path = _resolve_media_path(path_value)
            media.append(_media_descriptor(media_path, project_root))
        if state == "accepted" and not media:
            raise ValueError("An accepted H3 take must record at least one output file")

        record_id_source = json.dumps(
            {
                "take_id": token.get("take_id"),
                "completion_state": state,
                "media": media,
            },
            sort_keys=True,
            separators=(",", ":"),
        )
        record = {
            "schema_version": 1,
            "record_id": hashlib.sha256(record_id_source.encode("utf-8")).hexdigest(),
            "take_id": str(token.get("take_id", "")),
            "opened_at": str(token.get("opened_at", "")),
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "elapsed_seconds": round(
                max(0.0, time.perf_counter() - float(token["monotonic_started"])), 6
            ),
            "identity": identity,
            "provenance": provenance,
            "parent_handoff": token.get("parent_handoff"),
            "completion_state": state,
            "completion_signal": str(completion_signal),
            "media": media,
        }
        manifest = take_root / "take.json"
        project_index = project_root / "takes" / "takes.jsonl"

        with _STATE_LOCK:
            existing = None
            if manifest.is_file():
                try:
                    existing = json.loads(manifest.read_text(encoding="utf-8"))
                except json.JSONDecodeError as exc:
                    raise ValueError(f"H3 take manifest is invalid: {manifest}") from exc
                if existing.get("record_id") != record["record_id"]:
                    raise ValueError(
                        "H3 take is already recorded with different media or state"
                    )
            else:
                _atomic_write_json(manifest, record)

            records = _read_jsonl(project_index) if project_index.is_file() else []
            indexed = next(
                (item for item in records if item.get("take_id") == record["take_id"]),
                None,
            )
            if indexed is None:
                records.append(existing or record)
                _atomic_write_jsonl(project_index, records)
            elif indexed.get("record_id") != record["record_id"]:
                raise ValueError("H3 project take index conflicts with the take manifest")

        final_record = existing or record
        take_number = int(identity["take_number"])
        prefix = "TAKE RETAINED" if existing is not None else "TAKE RECORDED"
        return (
            f"{prefix} — {state} — Take {take_number:04d}",
            json.dumps(final_record, sort_keys=True),
            str(manifest),
            str(project_index),
        )


class CodexH3SafeContinuationStore:
    """Advance accepted cross-run handoff state only after technical checks pass."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "token": ("H3_PROJECT_TAKE",),
                "mode": (
                    ["OFF", "WARN", "BLOCK TECHNICAL"],
                    {"default": "BLOCK TECHNICAL"},
                ),
                "expected_width": ("INT", {"default": 864, "min": 1}),
                "expected_height": ("INT", {"default": 480, "min": 1}),
                "continuity_warning": ("STRING", {"default": ""}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING", "BOOLEAN", "STRING", "STRING")
    RETURN_NAMES = (
        "handoff_frame",
        "status",
        "accepted",
        "handoff_path",
        "gate_record_json",
    )
    FUNCTION = "store"
    OUTPUT_NODE = True
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Store every inspected ending frame per take, but advance the project's "
        "accepted handoff only when objective technical checks pass."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    def store(
        self,
        images,
        token,
        mode,
        expected_width,
        expected_height,
        continuity_warning,
    ):
        project_root, take_root = _take_root_from_token(token)
        identity = token["identity"]
        if not isinstance(images, torch.Tensor) or images.ndim != 4 or images.shape[0] < 1:
            raise ValueError("images must be a non-empty ComfyUI IMAGE batch")
        if images.shape[-1] not in (3, 4):
            raise ValueError(f"unsupported IMAGE channel count: {images.shape[-1]}")
        last = images[-1:]
        cpu = last[0].detach().to(device="cpu", dtype=torch.float32)
        finite = bool(torch.isfinite(cpu).all().item())
        safe = torch.nan_to_num(cpu, nan=0.0, posinf=1.0, neginf=0.0).clamp(0.0, 1.0)
        pixels = safe.mul(255.0).round().to(torch.uint8).numpy()
        image = Image.fromarray(pixels)
        width, height = image.size
        mean = float(safe.mean().item())
        contrast = float(safe.std().item())
        horizontal_detail = (
            float(torch.mean(torch.abs(safe[:, 1:] - safe[:, :-1])).item())
            if width > 1
            else 0.0
        )
        vertical_detail = (
            float(torch.mean(torch.abs(safe[1:, :] - safe[:-1, :])).item())
            if height > 1
            else 0.0
        )
        detail = (horizontal_detail + vertical_detail) / 2.0

        blocking_failures = []
        warnings = []
        if not finite:
            blocking_failures.append("non_finite_pixels")
        if width != int(expected_width) or height != int(expected_height):
            blocking_failures.append(
                f"unexpected_dimensions:{width}x{height}_expected_"
                f"{int(expected_width)}x{int(expected_height)}"
            )
        if mean <= 0.002 and contrast <= 0.002:
            blocking_failures.append("near_total_black")
        elif mean >= 0.998 and contrast <= 0.002:
            blocking_failures.append("near_total_white")
        if mean < 0.03:
            warnings.append("very_low_exposure")
        elif mean > 0.97:
            warnings.append("very_high_exposure")
        if contrast < 0.01:
            warnings.append("very_low_contrast")
        if detail < 0.003:
            warnings.append("low_detail_or_blur")
        continuity_text = str(continuity_warning or "").strip()
        if continuity_text:
            warnings.append(f"continuity: {continuity_text}")

        gate_mode = str(mode)
        if gate_mode not in {"OFF", "WARN", "BLOCK TECHNICAL"}:
            raise ValueError(f"Unsupported H3 handoff safety mode: {gate_mode}")
        should_block = gate_mode == "BLOCK TECHNICAL" and bool(blocking_failures)
        pixel_sha256 = hashlib.sha256(image.tobytes()).hexdigest()
        checked_at = datetime.now(timezone.utc).isoformat()
        metadata = {
            "take_id": str(token["take_id"]),
            "checked_at": checked_at,
            "pixel_sha256": pixel_sha256,
            "width": str(width),
            "height": str(height),
        }
        state_root = (
            project_root
            / "handoffs"
            / identity["scene_slug"]
            / identity["shot_slug"]
            / identity["branch_slug"]
        )
        current_image = state_root / "current.png"
        current_metadata = state_root / "current.json"
        take_number = int(identity["take_number"])

        with _STATE_LOCK:
            current = None
            if current_metadata.is_file():
                try:
                    current = json.loads(current_metadata.read_text(encoding="utf-8"))
                except json.JSONDecodeError as exc:
                    raise ValueError(
                        f"H3 accepted handoff metadata is invalid: {current_metadata}"
                    ) from exc

            if should_block:
                result = "blocked"
                saved_path = take_root / "rejected-handoff.png"
                status = (
                    "HANDOFF BLOCKED — previous accepted handoff retained: "
                    + ", ".join(blocking_failures)
                )
                accepted = False
            elif current and int(current.get("take_number", 0)) >= take_number:
                result = "out_of_sequence"
                saved_path = take_root / "out-of-sequence-handoff.png"
                status = (
                    f"HANDOFF NOT ADVANCED — Take {take_number:04d} completed after "
                    f"Take {int(current['take_number']):04d}"
                )
                accepted = False
            else:
                result = "accepted"
                saved_path = take_root / "handoff.png"
                accepted = True
                if gate_mode == "WARN" and (blocking_failures or warnings):
                    status = "HANDOFF ACCEPTED WITH WARNINGS — " + ", ".join(
                        blocking_failures + warnings
                    )
                else:
                    status = (
                        f"HANDOFF ACCEPTED — Take {take_number:04d} is ready for the "
                        "next run"
                    )

            if saved_path.exists():
                raise ValueError(
                    "H3 take already contains a handoff image; allocate a new take "
                    "instead of overwriting it"
                )
            _atomic_save_png(image, saved_path, metadata)

            if accepted:
                _atomic_copy_file(saved_path, current_image)
                _atomic_write_json(
                    current_metadata,
                    {
                        "schema_version": 1,
                        "take_id": str(token["take_id"]),
                        "take_number": take_number,
                        "accepted_at": checked_at,
                        "pixel_sha256": pixel_sha256,
                        "image": saved_path.relative_to(project_root).as_posix(),
                    },
                )

            record = {
                "schema_version": 1,
                "take_id": str(token["take_id"]),
                "checked_at": checked_at,
                "mode": gate_mode,
                "result": result,
                "blocking_failures": blocking_failures,
                "warnings": warnings,
                "width": width,
                "height": height,
                "expected_dimensions": [int(expected_width), int(expected_height)],
                "mean_exposure": round(mean, 8),
                "contrast": round(contrast, 8),
                "detail": round(detail, 8),
                "pixel_sha256": pixel_sha256,
                "saved_path": saved_path.relative_to(project_root).as_posix(),
                "accepted_handoff_advanced": accepted,
            }
            _atomic_write_json(take_root / "handoff-gate.json", record)

        print(f"[CodexH3Production] {status}: {saved_path}", flush=True)
        return last, status, accepted, str(saved_path), json.dumps(record, sort_keys=True)


class CodexH3RenderProfileControl:
    """Expose an evidence-cleared H3 recipe without owning a sampler or size."""

    _RECIPES = {
        "Gold Base": {
            "steps": 20,
            "cfg": 1.0,
            "sampler": "res_multistep",
            "scheduler": "simple",
            "required_lora": "(none)",
            "quality_tier": "final",
            "evidence": "workflow-09-and-10-gold-acceptance",
        },
        "Quick Preview": {
            "steps": 6,
            "cfg": 1.0,
            "sampler": "res_multistep",
            "scheduler": "simple",
            "required_lora": "(none)",
            "quality_tier": "non-final preview",
            "evidence": "m2-matched-first-frame-comparison",
        },
    }

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "profile": (list(cls._RECIPES), {"default": "Gold Base"}),
                "engine": ("STRING", {"default": "workflow-10"}),
            }
        }

    RETURN_TYPES = (
        "H3_RENDER_PROFILE",
        "STRING",
        "INT",
        "FLOAT",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
    )
    RETURN_NAMES = (
        "profile_token",
        "profile_name",
        "steps",
        "cfg",
        "sampler_name",
        "scheduler",
        "required_lora",
        "status",
    )
    FUNCTION = "select"
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Select one benchmark-cleared H3 recipe and expose its primitive "
        "settings to the existing workflow-10 or Multishot sampler. This node "
        "does not receive a model, execute sampling, or own resolution."
    )

    def select(self, profile, engine):
        profile_name = str(profile)
        recipe = self._RECIPES.get(profile_name)
        if recipe is None:
            raise ValueError(f"Unsupported H3 render profile: {profile_name}")
        engine_name = str(engine or "").strip()
        if not engine_name:
            raise ValueError("H3 render profile engine must be named explicitly")
        canonical = json.dumps(recipe, sort_keys=True, separators=(",", ":"))
        token = {
            "schema_version": 1,
            "profile": profile_name,
            "engine": engine_name,
            "steps": recipe["steps"],
            "cfg": recipe["cfg"],
            "sampler": recipe["sampler"],
            "scheduler": recipe["scheduler"],
            "required_lora": recipe["required_lora"],
            "quality_tier": recipe["quality_tier"],
            "evidence": recipe["evidence"],
            "resolution_owner": "external Pixaroma controls",
            "recipe_sha256": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
        }
        tier = recipe["quality_tier"].upper()
        status = (
            f"PROFILE READY — {profile_name} — {engine_name} — "
            f"{recipe['steps']} steps, CFG {recipe['cfg']:g}, "
            f"{recipe['sampler']}/{recipe['scheduler']}, "
            f"LoRA {recipe['required_lora']} — {tier}"
        )
        return (
            token,
            profile_name,
            recipe["steps"],
            recipe["cfg"],
            recipe["sampler"],
            recipe["scheduler"],
            recipe["required_lora"],
            status,
        )


def _parse_shot_plan(value: object) -> list[dict]:
    try:
        shots = json.loads(str(value))
    except json.JSONDecodeError as exc:
        raise ValueError("H3 shot plan must contain valid JSON") from exc
    if not isinstance(shots, list) or not shots:
        raise ValueError("H3 shot plan must be a non-empty JSON array")
    normalized = []
    seen_ids = set()
    required = ("shot_id", "title", "action", "camera", "dialogue")
    for index, item in enumerate(shots, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"H3 shot plan item {index} must be an object")
        missing = [name for name in required if name not in item]
        if missing:
            raise ValueError(
                f"H3 shot plan item {index} is missing: {', '.join(missing)}"
            )
        record = {name: str(item[name]) for name in required}
        if not record["shot_id"].strip():
            raise ValueError(f"H3 shot plan item {index} has an empty shot_id")
        if record["shot_id"] in seen_ids:
            raise ValueError(f"H3 shot plan has duplicate shot_id: {record['shot_id']}")
        seen_ids.add(record["shot_id"])
        references = item.get("references", [])
        if not isinstance(references, list) or not all(
            isinstance(reference, str) for reference in references
        ):
            raise ValueError(
                f"H3 shot plan item {index} references must be an array of strings"
            )
        profile_override = str(item.get("profile_override", ""))
        if profile_override not in {"", "Gold Base", "Quick Preview"}:
            raise ValueError(
                f"H3 shot plan item {index} uses an uncleared profile: "
                f"{profile_override}"
            )
        record.update(
            {
                "scene": str(item.get("scene", "Scene")),
                "references": references,
                "profile_override": profile_override,
                "handoff_notes": str(item.get("handoff_notes", "")),
            }
        )
        normalized.append(record)
    return normalized


def _shot_plan_paths_from_token(token: dict) -> tuple[Path, Path, Path]:
    project_slug = str(token.get("project_slug", ""))
    branch_slug = str(token.get("branch_slug", ""))
    plan_slug = str(token.get("plan_slug", ""))
    if project_slug != _project_slug(project_slug):
        raise ValueError("H3 shot-plan token has an invalid project slug")
    if branch_slug != _project_slug(branch_slug):
        raise ValueError("H3 shot-plan token has an invalid branch slug")
    if plan_slug != _project_slug(plan_slug):
        raise ValueError("H3 shot-plan token has an invalid plan slug")
    project_root = (_output_root() / "H3_Projects" / project_slug).resolve()
    plan_root = (project_root / "shot-plan" / plan_slug).resolve()
    state_path = plan_root / "branches" / f"{branch_slug}.json"
    return project_root, plan_root, state_path


class CodexH3ShotPlanControl:
    """Create a versioned project plan and expose its mutable branch state."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "project": ("STRING", {"default": "H3 Production Lab"}),
                "branch": ("STRING", {"default": "main"}),
                "plan_name": ("STRING", {"default": "Shot plan"}),
                "plan_json": ("STRING", {"default": "[]", "multiline": True}),
                "action": (
                    ["ensure", "previous", "next", "repeat", "reset"],
                    {"default": "ensure"},
                ),
            }
        }

    RETURN_TYPES = ("H3_SHOT_PLAN_CONTROL", "STRING", "STRING", "STRING")
    RETURN_NAMES = ("plan_control", "status", "position", "plan_sha256")
    FUNCTION = "control"
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Create or verify a versioned JSON shot plan for one project and branch. "
        "Plan edits require an explicit reset so queued work cannot change silently."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    def control(self, project, branch, plan_name, plan_json, action):
        operator_action = str(action)
        allowed_actions = {"ensure", "previous", "next", "repeat", "reset"}
        if operator_action not in allowed_actions:
            raise ValueError(f"Unsupported H3 shot-plan action: {operator_action}")
        display_project = str(project or "").strip() or "Untitled"
        display_branch = str(branch or "").strip() or "main"
        display_plan = str(plan_name or "").strip() or "Shot plan"
        project_slug = _project_slug(display_project)
        branch_slug = _project_slug(display_branch)
        plan_slug = _project_slug(display_plan)
        shots = _parse_shot_plan(plan_json)
        canonical = json.dumps(
            shots, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        )
        plan_sha256 = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        project_root = _output_root() / "H3_Projects" / project_slug
        project_manifest = project_root / "project.json"
        plan_root = project_root / "shot-plan" / plan_slug
        plan_path = plan_root / "plan.json"
        version_path = plan_root / "versions" / f"{plan_sha256}.json"
        state_path = plan_root / "branches" / f"{branch_slug}.json"
        now = datetime.now(timezone.utc).isoformat()

        with _STATE_LOCK:
            project_root.mkdir(parents=True, exist_ok=True)
            if project_manifest.is_file():
                try:
                    project_record = json.loads(
                        project_manifest.read_text(encoding="utf-8")
                    )
                except json.JSONDecodeError as exc:
                    raise ValueError(
                        f"H3 project manifest is invalid: {project_manifest}"
                    ) from exc
                if project_record.get("display_name") != display_project:
                    raise ValueError(
                        "H3 project name collides with an existing filesystem slug: "
                        f"{project_slug}"
                    )
            else:
                _atomic_write_json(
                    project_manifest,
                    {
                        "schema_version": 1,
                        "display_name": display_project,
                        "project_slug": project_slug,
                        "created_at": now,
                    },
                )

            current_plan = None
            if plan_path.is_file():
                try:
                    current_plan = json.loads(plan_path.read_text(encoding="utf-8"))
                except json.JSONDecodeError as exc:
                    raise ValueError(f"H3 shot plan is invalid: {plan_path}") from exc
                if (
                    current_plan.get("plan_sha256") != plan_sha256
                    and operator_action != "reset"
                ):
                    raise ValueError(
                        "H3 shot plan changed; use the explicit reset action to "
                        "create a new version"
                    )
            if current_plan is None or current_plan.get("plan_sha256") != plan_sha256:
                plan_record = {
                    "schema_version": 1,
                    "display_name": display_plan,
                    "plan_slug": plan_slug,
                    "plan_sha256": plan_sha256,
                    "shots": shots,
                    "created_at": now,
                }
                if version_path.is_file():
                    try:
                        existing_version = json.loads(
                            version_path.read_text(encoding="utf-8")
                        )
                    except json.JSONDecodeError as exc:
                        raise ValueError(
                            f"H3 shot plan version is invalid: {version_path}"
                        ) from exc
                    if existing_version.get("plan_sha256") != plan_sha256:
                        raise ValueError("H3 shot plan version hash collision")
                else:
                    _atomic_write_json(version_path, plan_record)
                _atomic_write_json(plan_path, plan_record)

            if state_path.is_file():
                try:
                    state = json.loads(state_path.read_text(encoding="utf-8"))
                except json.JSONDecodeError as exc:
                    raise ValueError(
                        f"H3 shot-plan branch state is invalid: {state_path}"
                    ) from exc
                if (
                    state.get("plan_sha256") != plan_sha256
                    and operator_action != "reset"
                ):
                    raise ValueError("H3 shot-plan branch state uses another plan version")
            else:
                state = {
                    "schema_version": 1,
                    "project": display_project,
                    "project_slug": project_slug,
                    "branch": display_branch,
                    "branch_slug": branch_slug,
                    "plan_name": display_plan,
                    "plan_slug": plan_slug,
                    "plan_sha256": plan_sha256,
                    "current_index": 0,
                    "revision": 0,
                    "history": [],
                    "updated_at": now,
                }
                _atomic_write_json(state_path, state)

            if operator_action != "ensure":
                previous_index = int(state.get("current_index", 0))
                previous_hash = str(state.get("plan_sha256", ""))
                revision = int(state.get("revision", 0))
                history = state.get("history")
                if not isinstance(history, list):
                    raise ValueError("H3 shot-plan branch history is invalid")
                if operator_action == "previous":
                    next_index = max(0, min(previous_index, len(shots)) - 1)
                elif operator_action == "next":
                    next_index = min(len(shots) - 1, previous_index + 1)
                elif operator_action == "repeat":
                    next_index = min(previous_index, len(shots) - 1)
                else:
                    next_index = 0
                event = {
                    "revision": revision + 1,
                    "acted_at": now,
                    "result": f"operator_{operator_action}",
                    "previous_index": previous_index,
                    "current_index": next_index,
                    "previous_plan_sha256": previous_hash,
                    "plan_sha256": plan_sha256,
                }
                history.append(event)
                state["history"] = history
                state["current_index"] = next_index
                state["revision"] = revision + 1
                state["plan_sha256"] = plan_sha256
                state["plan_name"] = display_plan
                state["plan_slug"] = plan_slug
                state["updated_at"] = now
                _atomic_write_json(state_path, state)

        current_index = int(state["current_index"])
        complete = current_index >= len(shots)
        position = (
            f"complete {len(shots)}/{len(shots)}"
            if complete
            else f"{current_index + 1}/{len(shots)}"
        )
        token = {
            "schema_version": 1,
            "project": display_project,
            "project_slug": project_slug,
            "branch": display_branch,
            "branch_slug": branch_slug,
            "plan_name": display_plan,
            "plan_slug": plan_slug,
            "plan_sha256": plan_sha256,
        }
        if complete:
            status = (
                f"PLAN COMPLETE — {display_plan} — {display_branch} — "
                f"{len(shots)} of {len(shots)} committed"
            )
            return token, status, position, plan_sha256
        if operator_action == "ensure":
            prefix = "PLAN READY"
        elif operator_action == "repeat":
            prefix = "PLAN REPEAT"
        elif operator_action == "reset":
            prefix = "PLAN RESET"
        else:
            prefix = "PLAN MOVED"
        status = (
            f"{prefix} — {display_plan} — {display_branch} — "
            f"shot {current_index + 1} of {len(shots)}"
        )
        return token, status, position, plan_sha256


class CodexH3ShotPlanReader:
    """Resolve the branch's current shot from disk at execution time."""

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"plan_control": ("H3_SHOT_PLAN_CONTROL",)}}

    RETURN_TYPES = (
        "H3_SHOT_TOKEN",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
        "STRING",
    )
    RETURN_NAMES = (
        "shot_token",
        "project",
        "scene",
        "shot",
        "branch",
        "prompt",
        "exact_dialogue",
        "references_json",
        "profile_override",
        "handoff_notes",
        "status",
    )
    FUNCTION = "read"
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Read the current shot and branch revision at execution time. Exact "
        "dialogue is returned unchanged and no prompt rewriting is performed."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    def read(self, plan_control):
        _, plan_root, state_path = _shot_plan_paths_from_token(plan_control)
        plan_path = plan_root / "plan.json"
        with _STATE_LOCK:
            if not plan_path.is_file() or not state_path.is_file():
                raise ValueError("H3 shot plan or branch state does not exist")
            try:
                plan = json.loads(plan_path.read_text(encoding="utf-8"))
                state = json.loads(state_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                raise ValueError("H3 shot plan or branch state contains invalid JSON") from exc
            expected_hash = str(plan_control.get("plan_sha256", ""))
            if (
                plan.get("plan_sha256") != expected_hash
                or state.get("plan_sha256") != expected_hash
            ):
                raise ValueError(
                    "H3 shot plan changed after queueing; queue again from the "
                    "current explicit plan version"
                )
            shots = plan.get("shots")
            if not isinstance(shots, list) or not shots:
                raise ValueError("H3 shot plan contains no shots")
            current_index = int(state.get("current_index", 0))
            if current_index >= len(shots):
                raise ValueError("H3 shot plan is complete; reset or move previous")
            shot = shots[current_index]
            revision = int(state.get("revision", 0))

        shot_name = f"{shot['shot_id']} {shot['title']}"
        prompt_parts = [shot["action"], f"Camera: {shot['camera']}"]
        if shot["dialogue"]:
            prompt_parts.append(f"Dialogue (exact): {shot['dialogue']}")
        prompt = "\n".join(prompt_parts)
        shot_token = {
            "schema_version": 1,
            "project": str(plan_control["project"]),
            "project_slug": str(plan_control["project_slug"]),
            "branch": str(plan_control["branch"]),
            "branch_slug": str(plan_control["branch_slug"]),
            "plan_name": str(plan_control["plan_name"]),
            "plan_slug": str(plan_control["plan_slug"]),
            "plan_sha256": expected_hash,
            "state_revision": revision,
            "shot_index": current_index,
            "shot_count": len(shots),
            "shot_id": str(shot["shot_id"]),
            "shot_title": str(shot["title"]),
            "scene": str(shot["scene"]),
        }
        status = (
            f"SHOT READY — {shot_name} — {current_index + 1} of {len(shots)} "
            "— plan locked"
        )
        return (
            shot_token,
            str(plan_control["project"]),
            str(shot["scene"]),
            shot_name,
            str(plan_control["branch"]),
            prompt,
            str(shot["dialogue"]),
            json.dumps(shot["references"], ensure_ascii=False, separators=(",", ":")),
            str(shot["profile_override"]),
            str(shot["handoff_notes"]),
            status,
        )


class CodexH3ShotPlanCommit:
    """Advance a plan only from its current revision and a matching take record."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "shot_token": ("H3_SHOT_TOKEN",),
                "accepted": ("BOOLEAN", {"default": False, "forceInput": True}),
                "handoff_path": ("STRING", {"default": "", "forceInput": True}),
                "take_record_json": (
                    "STRING",
                    {"default": "", "forceInput": True},
                ),
            }
        }

    RETURN_TYPES = ("STRING", "STRING", "BOOLEAN")
    RETURN_NAMES = ("status", "position", "plan_complete")
    FUNCTION = "commit"
    OUTPUT_NODE = True
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Commit one accepted or rejected project take against the exact shot-plan "
        "revision read at execution time. Only a matching accepted take advances."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    def commit(self, shot_token, accepted, handoff_path, take_record_json):
        project_root, plan_root, state_path = _shot_plan_paths_from_token(shot_token)
        plan_path = plan_root / "plan.json"
        try:
            take_record = json.loads(str(take_record_json))
        except json.JSONDecodeError as exc:
            raise ValueError("H3 shot-plan commit requires a valid take record") from exc
        if not isinstance(take_record, dict):
            raise ValueError("H3 shot-plan commit take record must be an object")
        identity = take_record.get("identity")
        if not isinstance(identity, dict):
            raise ValueError("H3 shot-plan commit take record has no identity")
        expected_shot = f"{shot_token['shot_id']} {shot_token['shot_title']}"
        expected_identity = {
            "project": shot_token["project"],
            "scene": shot_token["scene"],
            "shot": expected_shot,
            "branch": shot_token["branch"],
        }
        mismatches = [
            name
            for name, expected in expected_identity.items()
            if identity.get(name) != expected
        ]
        if mismatches:
            raise ValueError(
                "H3 shot-plan commit take identity does not match: "
                + ", ".join(mismatches)
            )
        expected_state = "accepted" if bool(accepted) else "rejected"
        if take_record.get("completion_state") != expected_state:
            raise ValueError(
                "H3 shot-plan commit accepted signal conflicts with take state"
            )
        media_path = _resolve_media_path(handoff_path)
        media_descriptor = _media_descriptor(media_path, project_root)
        matching_media = next(
            (
                item
                for item in take_record.get("media", [])
                if isinstance(item, dict)
                and item.get("path") == media_descriptor["path"]
                and item.get("scope") == media_descriptor["scope"]
                and item.get("sha256") == media_descriptor["sha256"]
            ),
            None,
        )
        if matching_media is None:
            raise ValueError(
                "H3 shot-plan commit handoff is not present with the same hash "
                "in the take record"
            )

        with _STATE_LOCK:
            if not plan_path.is_file() or not state_path.is_file():
                raise ValueError("H3 shot plan or branch state does not exist")
            try:
                plan = json.loads(plan_path.read_text(encoding="utf-8"))
                state = json.loads(state_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                raise ValueError("H3 shot plan or branch state contains invalid JSON") from exc
            if (
                plan.get("plan_sha256") != shot_token.get("plan_sha256")
                or state.get("plan_sha256") != shot_token.get("plan_sha256")
            ):
                raise ValueError("H3 shot-plan commit plan version is stale")
            current_index = int(state.get("current_index", 0))
            revision = int(state.get("revision", 0))
            if current_index != int(shot_token.get("shot_index", -1)):
                raise ValueError("H3 shot-plan commit shot position is stale")
            if revision != int(shot_token.get("state_revision", -1)):
                raise ValueError("H3 shot-plan commit branch revision is stale")
            shots = plan.get("shots")
            if not isinstance(shots, list) or current_index >= len(shots):
                raise ValueError("H3 shot-plan commit has no current shot")
            if shots[current_index].get("shot_id") != shot_token.get("shot_id"):
                raise ValueError("H3 shot-plan commit shot identity is stale")

            result = expected_state
            next_index = current_index + 1 if accepted else current_index
            event = {
                "revision": revision + 1,
                "committed_at": datetime.now(timezone.utc).isoformat(),
                "result": result,
                "shot_id": str(shot_token["shot_id"]),
                "shot_index": current_index,
                "take_id": str(take_record.get("take_id", "")),
                "handoff": {
                    "path": media_descriptor["path"],
                    "scope": media_descriptor["scope"],
                    "sha256": media_descriptor["sha256"],
                },
            }
            history = state.get("history")
            if not isinstance(history, list):
                raise ValueError("H3 shot-plan branch history is invalid")
            history.append(event)
            state["history"] = history
            state["current_index"] = next_index
            state["revision"] = revision + 1
            state["updated_at"] = event["committed_at"]
            _atomic_write_json(state_path, state)

        shot_count = len(shots)
        take_id = str(take_record.get("take_id", ""))
        complete = next_index >= shot_count
        if complete:
            status = (
                f"PLAN COMPLETE — accepted {shot_token['shot_id']} via {take_id} — "
                f"{shot_count} of {shot_count} committed"
            )
            position = f"complete {shot_count}/{shot_count}"
        elif accepted:
            status = (
                f"PLAN ADVANCED — accepted {shot_token['shot_id']} via {take_id} — "
                f"next shot {next_index + 1} of {shot_count}"
            )
            position = f"{next_index + 1}/{shot_count}"
        else:
            status = (
                f"PLAN RETAINED — rejected {shot_token['shot_id']} via {take_id} — "
                f"remains shot {current_index + 1} of {shot_count}"
            )
            position = f"{current_index + 1}/{shot_count}"
        return status, position, complete


class CodexH3ContinuityMonitor:
    """Report lightweight continuity measurements without blocking a take."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "previous_image": ("IMAGE",),
                "current_image": ("IMAGE",),
            },
            "optional": {
                "reference_image": ("IMAGE",),
                "take_token": ("H3_PROJECT_TAKE",),
            },
        }

    RETURN_TYPES = ("IMAGE", "IMAGE", "STRING", "STRING", "STRING", "INT")
    RETURN_NAMES = (
        "current_image",
        "difference_image",
        "status",
        "advisory",
        "metrics_json",
        "chain_length",
    )
    FUNCTION = "compare"
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Compare a previous handoff with the current ending frame using small, "
        "advisory-only measurements. This node never blocks storage or loads a "
        "vision model."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    @staticmethod
    def _measure(frame):
        image = frame[-1:].detach().float().cpu().clamp(0, 1)
        luma = (
            image[..., 0] * 0.299
            + image[..., 1] * 0.587
            + image[..., 2] * 0.114
        ).unsqueeze(1)
        laplacian_kernel = torch.tensor(
            [[0.0, 1.0, 0.0], [1.0, -4.0, 1.0], [0.0, 1.0, 0.0]],
            dtype=luma.dtype,
        ).view(1, 1, 3, 3)
        laplacian_variance = float(
            torch.nn.functional.conv2d(
                luma, laplacian_kernel, padding=1
            ).var()
        )
        luma_variance = float(luma.var())
        sharpness = laplacian_variance / max(luma_variance, 1e-9)
        horizontal_edges = (luma[:, :, :, 1:] - luma[:, :, :, :-1]).abs()
        vertical_edges = (luma[:, :, 1:, :] - luma[:, :, :-1, :]).abs()
        edge_density = float(
            torch.cat(
                (
                    horizontal_edges.flatten(),
                    vertical_edges.flatten(),
                )
            ).gt(0.08).float().mean()
        )
        histograms = []
        for channel in range(3):
            histogram = torch.histc(
                image[..., channel], bins=16, min=0.0, max=1.0
            )
            histograms.append((histogram / histogram.sum().clamp_min(1)).tolist())
        hash_sample = torch.nn.functional.interpolate(
            luma, size=(8, 9), mode="bilinear", align_corners=False
        )[0, 0]
        perceptual_hash = (hash_sample[:, 1:] > hash_sample[:, :-1]).flatten()
        height, width = image.shape[1:3]
        return {
            "dimensions": [width, height],
            "aspect_ratio": width / height,
            "brightness": float(luma.mean()),
            "contrast": float(luma.std()),
            "edge_density": edge_density,
            "sharpness": sharpness,
            "histograms": histograms,
            "perceptual_hash": perceptual_hash,
        }

    @staticmethod
    def _histogram_distance(previous, current):
        total = 0.0
        for previous_channel, current_channel in zip(
            previous["histograms"], current["histograms"]
        ):
            total += sum(
                abs(left - right)
                for left, right in zip(previous_channel, current_channel)
            )
        return total / 6.0

    def compare(
        self,
        previous_image,
        current_image,
        reference_image=None,
        take_token=None,
    ):
        previous = previous_image.detach().float().cpu().clamp(0, 1)
        current = current_image.detach().float().cpu().clamp(0, 1)
        if previous.ndim != 4 or current.ndim != 4:
            raise ValueError("H3 continuity images must use IMAGE [B,H,W,C] tensors")
        previous_frame = previous[-1:]
        current_frame = current[-1:]
        previous_metrics = self._measure(previous_frame)
        current_metrics = self._measure(current_frame)
        brightness_delta = abs(
            current_metrics["brightness"] - previous_metrics["brightness"]
        )
        contrast_ratio = current_metrics["contrast"] / max(
            previous_metrics["contrast"], 1e-9
        )
        sharpness_ratio = current_metrics["sharpness"] / max(
            previous_metrics["sharpness"], 1e-9
        )
        edge_density_ratio = current_metrics["edge_density"] / max(
            previous_metrics["edge_density"], 1e-9
        )
        aspect_ratio_delta = abs(
            current_metrics["aspect_ratio"] - previous_metrics["aspect_ratio"]
        )
        histogram_distance = self._histogram_distance(
            previous_metrics, current_metrics
        )
        perceptual_hash_distance = int(
            torch.count_nonzero(
                previous_metrics["perceptual_hash"]
                != current_metrics["perceptual_hash"]
            )
        )
        reference_metrics = None
        reference_histogram_distance = None
        reference_perceptual_hash_distance = None
        if reference_image is not None:
            reference = reference_image.detach().float().cpu().clamp(0, 1)
            if reference.ndim != 4:
                raise ValueError(
                    "H3 continuity reference must use an IMAGE [B,H,W,C] tensor"
                )
            reference_metrics = self._measure(reference[-1:])
            reference_histogram_distance = self._histogram_distance(
                reference_metrics, current_metrics
            )
            reference_perceptual_hash_distance = int(
                torch.count_nonzero(
                    reference_metrics["perceptual_hash"]
                    != current_metrics["perceptual_hash"]
                )
            )
        thresholds = {
            "aspect_ratio_delta": 0.02,
            "brightness_delta": 0.18,
            "contrast_ratio": [0.55, 1.8],
            "histogram_distance": 0.30,
            "sharpness_ratio": [0.55, 1.8],
            "edge_density_ratio": [0.50, 2.0],
            "perceptual_hash_distance": 24,
            "reference_histogram_distance": 0.35,
            "reference_perceptual_hash_distance": 28,
        }
        warnings = []
        dimension_match = (
            previous_metrics["dimensions"] == current_metrics["dimensions"]
        )
        if not dimension_match:
            warnings.append("dimension_match false != required true")
        if aspect_ratio_delta > thresholds["aspect_ratio_delta"]:
            warnings.append(
                f"aspect_ratio_delta {aspect_ratio_delta:.4f} > threshold "
                f"{thresholds['aspect_ratio_delta']:.4f}"
            )
        if brightness_delta > thresholds["brightness_delta"]:
            warnings.append(
                "brightness_delta "
                f"{brightness_delta:.4f} > threshold "
                f"{thresholds['brightness_delta']:.4f}"
            )
        for name, value in (
            ("contrast_ratio", contrast_ratio),
            ("sharpness_ratio", sharpness_ratio),
            ("edge_density_ratio", edge_density_ratio),
        ):
            lower, upper = thresholds[name]
            if value < lower or value > upper:
                warnings.append(
                    f"{name} {value:.4f} outside threshold "
                    f"[{lower:.4f}, {upper:.4f}]"
                )
        if histogram_distance > thresholds["histogram_distance"]:
            warnings.append(
                f"histogram_distance {histogram_distance:.4f} > threshold "
                f"{thresholds['histogram_distance']:.4f}"
            )
        if perceptual_hash_distance > thresholds["perceptual_hash_distance"]:
            warnings.append(
                f"perceptual_hash_distance {perceptual_hash_distance} > threshold "
                f"{thresholds['perceptual_hash_distance']}"
            )
        if (
            reference_histogram_distance is not None
            and reference_histogram_distance
            > thresholds["reference_histogram_distance"]
        ):
            warnings.append(
                "reference_histogram_distance "
                f"{reference_histogram_distance:.4f} > threshold "
                f"{thresholds['reference_histogram_distance']:.4f}"
            )
        if (
            reference_perceptual_hash_distance is not None
            and reference_perceptual_hash_distance
            > thresholds["reference_perceptual_hash_distance"]
        ):
            warnings.append(
                "reference_perceptual_hash_distance "
                f"{reference_perceptual_hash_distance} > threshold "
                f"{thresholds['reference_perceptual_hash_distance']}"
            )

        if previous_frame.shape[1:3] != current_frame.shape[1:3]:
            fitted = torch.nn.functional.interpolate(
                previous_frame.movedim(-1, 1),
                size=current_frame.shape[1:3],
                mode="bilinear",
                align_corners=False,
            ).movedim(1, -1)
        else:
            fitted = previous_frame
        difference = (current_frame - fitted).abs()
        for metrics_for_frame in (
            previous_metrics,
            current_metrics,
            *([reference_metrics] if reference_metrics is not None else []),
        ):
            metrics_for_frame.pop("histograms")
            metrics_for_frame.pop("perceptual_hash")
        comparisons = {
            "dimension_match": dimension_match,
            "aspect_ratio_delta": aspect_ratio_delta,
            "brightness_delta": brightness_delta,
            "contrast_ratio": contrast_ratio,
            "histogram_distance": histogram_distance,
            "sharpness_ratio": sharpness_ratio,
            "edge_density_ratio": edge_density_ratio,
            "perceptual_hash_distance": perceptual_hash_distance,
        }
        if reference_histogram_distance is not None:
            comparisons.update(
                {
                    "reference_histogram_distance": (
                        reference_histogram_distance
                    ),
                    "reference_perceptual_hash_distance": (
                        reference_perceptual_hash_distance
                    ),
                }
            )
        prior_accepted_takes = 0
        chain_length = 0
        take_id = None
        continuity_path = None
        if take_token is not None:
            if not isinstance(take_token, dict):
                raise ValueError("H3 continuity take token must be an object")
            project_root, take_root = _take_root_from_token(take_token)
            take_id = str(take_token.get("take_id", ""))
            branch = str(take_token["identity"]["branch"])
            index_path = project_root / "takes" / "takes.jsonl"
            if index_path.is_file():
                prior_accepted_takes = sum(
                    1
                    for record in _read_jsonl(index_path)
                    if record.get("take_id") != take_id
                    and record.get("completion_state") == "accepted"
                    and isinstance(record.get("identity"), dict)
                    and record["identity"].get("branch") == branch
                )
            chain_length = prior_accepted_takes + 1
            continuity_path = take_root / "continuity.json"
        metrics = {
            "schema_version": 1,
            "measurement_source": {
                "sharpness": (
                    "H3 Multishot contrast-normalised Laplacian texture energy"
                ),
                "other_metrics": "Codex advisory project-history comparison",
            },
            "previous": previous_metrics,
            "current": current_metrics,
            "comparisons": comparisons,
            "thresholds": thresholds,
            "warnings": warnings,
            "blocking": False,
            "chain_length": chain_length,
            "prior_accepted_takes": prior_accepted_takes,
        }
        if reference_metrics is not None:
            metrics["reference"] = reference_metrics
        if take_id is not None:
            metrics["take_id"] = take_id
            metrics["recorded_at"] = datetime.now(timezone.utc).isoformat()
            _atomic_write_json(continuity_path, metrics)
        if warnings:
            status = f"CONTINUITY ADVISORY — {len(warnings)} metric warning(s)"
            advisory = "\n".join(warnings)
        else:
            status = "CONTINUITY CLEAR — no advisory thresholds exceeded"
            advisory = "No advisory thresholds exceeded."
        return (
            current_image,
            difference,
            status,
            advisory,
            json.dumps(metrics, sort_keys=True),
            chain_length,
        )


class CodexH3ReferenceManifest:
    """Build a deterministic typed map for up to nine reference images."""

    MAX_SLOTS = 9
    ROLES = {"character", "creature", "prop", "vehicle", "location", "other"}

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "entries_json": (
                    "STRING",
                    {"default": "[]", "multiline": True},
                )
            },
            "optional": {
                f"image_{index}": ("IMAGE",)
                for index in range(1, cls.MAX_SLOTS + 1)
            },
        }

    RETURN_TYPES = tuple(
        ["IMAGE"] * MAX_SLOTS
        + ["IMAGE", "STRING", "STRING", "STRING", "STRING"]
    )
    RETURN_NAMES = tuple(
        [f"ref_{index}" for index in range(1, MAX_SLOTS + 1)]
        + [
            "reference_batch",
            "reference_subjects",
            "manifest_json",
            "prompt_preamble",
            "status",
        ]
    )
    FUNCTION = "build"
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Compact enabled reference slots into deterministic Picture numbers, "
        "preserve explicit entity roles, and expose both typed provenance and "
        "the existing Multishot reference inputs."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    @staticmethod
    def _image_sha256(image):
        tensor = image.detach().float().cpu().contiguous()
        digest = hashlib.sha256()
        digest.update(json.dumps(list(tensor.shape)).encode("ascii"))
        digest.update(tensor.numpy().tobytes())
        return digest.hexdigest()

    @staticmethod
    def _fit_batch_image(image, target_height, target_width):
        height, width = image.shape[1:3]
        if (height, width) == (target_height, target_width):
            return image
        scale = max(target_height / height, target_width / width)
        resized_height = max(target_height, int(round(height * scale)))
        resized_width = max(target_width, int(round(width * scale)))
        resized = torch.nn.functional.interpolate(
            image.movedim(-1, 1),
            size=(resized_height, resized_width),
            mode="bilinear",
            align_corners=False,
        ).movedim(1, -1)
        top = (resized_height - target_height) // 2
        left = (resized_width - target_width) // 2
        return resized[
            :, top : top + target_height, left : left + target_width, :
        ]

    def build(self, entries_json, **images):
        try:
            entries = json.loads(str(entries_json))
        except json.JSONDecodeError as exc:
            raise ValueError("H3 reference manifest must contain valid JSON") from exc
        if not isinstance(entries, list) or not entries:
            raise ValueError("H3 reference manifest must be a non-empty JSON array")
        required = (
            "slot",
            "enabled",
            "entity_id",
            "display_name",
            "role",
            "view",
            "description",
        )
        by_slot = {}
        for entry_number, entry in enumerate(entries, start=1):
            if not isinstance(entry, dict):
                raise ValueError(
                    f"H3 reference manifest entry {entry_number} must be an object"
                )
            missing = [name for name in required if name not in entry]
            if missing:
                raise ValueError(
                    f"H3 reference manifest entry {entry_number} is missing: "
                    + ", ".join(missing)
                )
            slot = int(entry["slot"])
            if slot < 1 or slot > self.MAX_SLOTS:
                raise ValueError(
                    f"H3 reference manifest entry {entry_number} has invalid slot {slot}"
                )
            if slot in by_slot:
                raise ValueError(f"H3 reference manifest has duplicate slot {slot}")
            role = str(entry["role"]).strip().lower()
            if role not in self.ROLES:
                raise ValueError(
                    f"H3 reference manifest entry {entry_number} has invalid role "
                    f"{role!r}"
                )
            if not isinstance(entry["enabled"], bool):
                raise ValueError(
                    f"H3 reference manifest entry {entry_number} enabled must "
                    "be true or false"
                )
            normalized = {
                "slot": slot,
                "enabled": entry["enabled"],
                "entity_id": str(entry["entity_id"]).strip(),
                "display_name": str(entry["display_name"]).strip(),
                "role": role,
                "view": str(entry["view"]).strip(),
                "description": str(entry["description"]).strip(),
                "group_id": str(entry.get("group_id", "")).strip(),
            }
            if not normalized["entity_id"] or not normalized["display_name"]:
                raise ValueError(
                    f"H3 reference manifest entry {entry_number} needs a stable "
                    "entity_id and display_name"
                )
            by_slot[slot] = normalized

        compact_images = []
        manifest_entries = []
        preamble = []
        entity_order = []
        entity_counts = {}
        entity_metadata = {}
        closed_entities = set()
        active_entity = None
        for slot in sorted(by_slot):
            entry = by_slot[slot]
            if not entry["enabled"]:
                continue
            image = images.get(f"image_{slot}")
            if image is None:
                raise ValueError(
                    f"H3 reference manifest slot {slot} is enabled but has no image"
                )
            if not isinstance(image, torch.Tensor) or image.ndim != 4:
                raise ValueError(
                    f"H3 reference manifest slot {slot} must use an IMAGE tensor"
                )
            if image.shape[0] != 1:
                raise ValueError(
                    f"H3 reference manifest slot {slot} must contain exactly "
                    "one image"
                )
            entity_id = entry["entity_id"]
            metadata = (
                entry["display_name"],
                entry["role"],
                entry["group_id"],
            )
            if (
                entity_id in entity_metadata
                and entity_metadata[entity_id] != metadata
            ):
                raise ValueError(
                    f"H3 reference manifest entity {entity_id!r} has conflicting "
                    "display, role, or group metadata"
                )
            entity_metadata.setdefault(entity_id, metadata)
            if entity_id != active_entity:
                if active_entity is not None:
                    closed_entities.add(active_entity)
                if entity_id in closed_entities:
                    raise ValueError(
                        f"H3 reference manifest views for entity {entity_id!r} "
                        "must be contiguous"
                    )
                active_entity = entity_id
            if entity_id not in entity_counts:
                entity_order.append(entity_id)
                entity_counts[entity_id] = 0
            entity_counts[entity_id] += 1
            picture = len(compact_images) + 1
            compact_images.append(image)
            record = {
                "picture": picture,
                "source_slot": slot,
                "entity_id": entity_id,
                "display_name": entry["display_name"],
                "role": entry["role"],
                "view": entry["view"],
                "description": entry["description"],
                "group_id": entry["group_id"],
                "image_sha256": self._image_sha256(image),
                "source_dimensions": [image.shape[2], image.shape[1]],
            }
            manifest_entries.append(record)
            preamble.append(
                f"Picture {picture} is {entry['role'].title()} "
                f"{entry['display_name']}: {entry['view']} — "
                f"{entry['description']}."
            )
        if not compact_images:
            raise ValueError("H3 reference manifest has no enabled images")
        reference_subjects = (
            ""
            if len(entity_order) <= 1
            else ",".join(str(entity_counts[entity]) for entity in entity_order)
        )
        target_height, target_width = compact_images[0].shape[1:3]
        batch_images = []
        batch_fitted_count = 0
        for image, record in zip(compact_images, manifest_entries):
            fitted = self._fit_batch_image(image, target_height, target_width)
            was_fitted = image.shape[1:3] != (target_height, target_width)
            batch_fitted_count += int(was_fitted)
            record["batch_dimensions"] = [target_width, target_height]
            record["batch_fit"] = "bilinear_center" if was_fitted else "none"
            batch_images.append(fitted)
        manifest = {
            "schema_version": 1,
            "entries": manifest_entries,
            "reference_subjects": reference_subjects,
            "batch_fitted_count": batch_fitted_count,
        }
        canonical = json.dumps(
            manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":")
        )
        manifest["manifest_sha256"] = hashlib.sha256(
            canonical.encode("utf-8")
        ).hexdigest()
        reference_batch = torch.cat(batch_images, dim=0)
        separate = compact_images + [None] * (self.MAX_SLOTS - len(compact_images))
        status = (
            f"MANIFEST READY — {len(compact_images)} pictures, "
            f"{len(entity_order)} entities — "
            f"{manifest['manifest_sha256'][:12]}"
        )
        return tuple(
            separate
            + [
                reference_batch,
                reference_subjects,
                json.dumps(manifest, ensure_ascii=False, sort_keys=True),
                "\n".join(preamble),
                status,
            ]
        )


class CodexH3SequenceAssembler:
    """Assemble immutable project clips only when stream copy is safe."""

    VIDEO_SUFFIXES = {".avi", ".mkv", ".mov", ".mp4", ".webm"}

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "project": ("STRING", {"default": "H3 Production Lab"}),
                "assembly_name": ("STRING", {"default": "Review sequence"}),
                "sources_json": (
                    "STRING",
                    {"default": "[]", "multiline": True},
                ),
                "action": (
                    ["inspect only", "assemble lossless"],
                    {"default": "inspect only"},
                ),
            }
        }

    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING", "STRING")
    RETURN_NAMES = (
        "status",
        "output_path",
        "manifest_path",
        "assembly_manifest_json",
        "transcode_plan_json",
    )
    FUNCTION = "assemble"
    OUTPUT_NODE = True
    CATEGORY = "Codex/H3 Production"
    DESCRIPTION = (
        "Resolve accepted project takes or explicit output-directory clips, "
        "verify their hashes and A/V stream contracts, and use FFmpeg stream "
        "copy only when the ordered sources genuinely match."
    )

    @classmethod
    def IS_CHANGED(cls, *args, **kwargs):
        return float("nan")

    @staticmethod
    def _fraction_text(value):
        if value is None:
            return None
        numerator = getattr(value, "numerator", None)
        denominator = getattr(value, "denominator", None)
        if numerator is not None and denominator is not None:
            return f"{numerator}/{denominator}"
        return str(value)

    @classmethod
    def _probe(cls, path):
        try:
            import av
        except ImportError as exc:
            raise RuntimeError(
                "H3 sequence assembly needs PyAV, which ComfyUI normally bundles"
            ) from exc

        try:
            with av.open(str(path)) as container:
                video_streams = [
                    stream for stream in container.streams if stream.type == "video"
                ]
                audio_streams = [
                    stream for stream in container.streams if stream.type == "audio"
                ]
                unsupported_streams = [
                    stream.type
                    for stream in container.streams
                    if stream.type not in {"video", "audio"}
                ]
                if len(video_streams) != 1:
                    raise ValueError(
                        f"H3 assembly source needs exactly one video stream: {path}"
                    )
                if len(audio_streams) > 1 or unsupported_streams:
                    raise ValueError(
                        "H3 assembly source has an unsupported stream layout: "
                        f"{path}"
                    )
                video = video_streams[0]
                video_codec = video.codec_context
                video_format = video_codec.format
                video_contract = {
                    "codec": video_codec.name,
                    "codec_tag": str(video_codec.codec_tag or ""),
                    "profile": str(video_codec.profile or ""),
                    "pixel_format": (
                        video_format.name if video_format is not None else None
                    ),
                    "width": int(video_codec.width),
                    "height": int(video_codec.height),
                    "frame_rate": cls._fraction_text(video.average_rate),
                    "time_base": cls._fraction_text(video.time_base),
                }
                audio_contract = None
                if audio_streams:
                    audio = audio_streams[0]
                    audio_codec = audio.codec_context
                    audio_format = audio_codec.format
                    audio_layout = audio_codec.layout
                    audio_contract = {
                        "codec": audio_codec.name,
                        "codec_tag": str(audio_codec.codec_tag or ""),
                        "profile": str(audio_codec.profile or ""),
                        "sample_format": (
                            audio_format.name if audio_format is not None else None
                        ),
                        "sample_rate": int(audio_codec.sample_rate),
                        "channels": int(audio_codec.channels),
                        "layout": (
                            audio_layout.name if audio_layout is not None else None
                        ),
                        "time_base": cls._fraction_text(audio.time_base),
                    }
                duration = (
                    float(container.duration / av.time_base)
                    if container.duration is not None
                    else None
                )
                if duration is None:
                    stream_durations = []
                    for stream in (video_streams + audio_streams):
                        if stream.duration is not None and stream.time_base is not None:
                            stream_durations.append(
                                float(stream.duration * stream.time_base)
                            )
                    if stream_durations:
                        duration = max(stream_durations)
                if duration is None or duration <= 0:
                    raise ValueError(
                        f"H3 assembly could not determine source duration: {path}"
                    )
                return {
                    "duration_seconds": round(duration, 6),
                    "stream_contract": {
                        "container": {
                            "format": str(container.format.name),
                            "extension": path.suffix.lower(),
                        },
                        "video": video_contract,
                        "audio": audio_contract,
                    },
                }
        except ValueError:
            raise
        except (OSError, av.error.FFmpegError) as exc:
            raise ValueError(f"H3 assembly could not read video source: {path}") from exc

    @staticmethod
    def _flatten_contract(value, prefix=""):
        flattened = {}
        if isinstance(value, dict):
            for key, child in value.items():
                child_prefix = f"{prefix}.{key}" if prefix else str(key)
                flattened.update(
                    CodexH3SequenceAssembler._flatten_contract(
                        child, child_prefix
                    )
                )
        else:
            flattened[prefix] = value
        return flattened

    @classmethod
    def _compatibility(cls, sources):
        baseline = cls._flatten_contract(sources[0]["stream_contract"])
        mismatches = {}
        for field in baseline:
            values = [
                cls._flatten_contract(source["stream_contract"]).get(field)
                for source in sources
            ]
            if any(value != values[0] for value in values[1:]):
                mismatches[field] = values
        return {
            "stream_copy_safe": not mismatches,
            "baseline_contract": sources[0]["stream_contract"],
            "mismatches": mismatches,
        }

    @staticmethod
    def _ensure_project(project):
        display_project = str(project or "").strip() or "Untitled"
        project_slug = _project_slug(display_project)
        project_root = _output_root() / "H3_Projects" / project_slug
        project_manifest = project_root / "project.json"
        with _STATE_LOCK:
            project_root.mkdir(parents=True, exist_ok=True)
            if project_manifest.is_file():
                try:
                    existing = json.loads(project_manifest.read_text(encoding="utf-8"))
                except json.JSONDecodeError as exc:
                    raise ValueError(
                        f"H3 project manifest is invalid: {project_manifest}"
                    ) from exc
                if existing.get("display_name") != display_project:
                    raise ValueError(
                        "H3 project name collides with an existing filesystem slug: "
                        f"{project_slug}"
                    )
            else:
                _atomic_write_json(
                    project_manifest,
                    {
                        "schema_version": 1,
                        "display_name": display_project,
                        "project_slug": project_slug,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
        return display_project, project_slug, project_root

    @staticmethod
    def _media_from_take(project_root, entry):
        take_id = str(entry.get("take_id", "")).strip()
        if not take_id:
            raise ValueError("H3 accepted-take assembly source needs take_id")
        index_path = project_root / "takes" / "takes.jsonl"
        if not index_path.is_file():
            raise ValueError("H3 project has no recorded takes")
        record = next(
            (
                item
                for item in _read_jsonl(index_path)
                if item.get("take_id") == take_id
            ),
            None,
        )
        if record is None:
            raise ValueError(f"H3 assembly take does not exist: {take_id}")
        if record.get("completion_state") != "accepted":
            raise ValueError(f"H3 assembly take is not accepted: {take_id}")
        media = record.get("media")
        if not isinstance(media, list) or not media:
            raise ValueError(f"H3 accepted take has no recorded media: {take_id}")
        try:
            media_index = int(entry.get("media_index", 0))
            if media_index < 0:
                raise IndexError
            descriptor = media[media_index]
        except (IndexError, TypeError, ValueError) as exc:
            raise ValueError(
                f"H3 assembly take has no media index {entry.get('media_index', 0)}"
            ) from exc
        if not isinstance(descriptor, dict):
            raise ValueError(f"H3 accepted take media is invalid: {take_id}")
        scope = descriptor.get("scope")
        relative_path = Path(str(descriptor.get("path", "")))
        if scope == "project":
            path = (project_root / relative_path).resolve()
            allowed_root = project_root
        elif scope == "output":
            path = (_output_root() / relative_path).resolve()
            allowed_root = _output_root()
        else:
            raise ValueError(f"H3 accepted take media scope is invalid: {take_id}")
        try:
            path.relative_to(allowed_root)
        except ValueError as exc:
            raise ValueError(f"H3 accepted take media path is unsafe: {take_id}") from exc
        expected_hash = str(descriptor.get("sha256", ""))
        actual_hash = _sha256_file(path) if path.is_file() else ""
        if not expected_hash or actual_hash != expected_hash:
            raise ValueError(
                f"H3 accepted take media hash no longer matches: {take_id}"
            )
        return path, take_id, media_index

    @classmethod
    def _resolve_sources(cls, project_root, sources_json):
        try:
            entries = json.loads(str(sources_json))
        except json.JSONDecodeError as exc:
            raise ValueError("H3 assembly sources must contain valid JSON") from exc
        if not isinstance(entries, list) or not entries:
            raise ValueError("H3 assembly sources must be a non-empty JSON array")
        sources = []
        seen_paths = set()
        for order, entry in enumerate(entries, start=1):
            if not isinstance(entry, dict):
                raise ValueError(f"H3 assembly source {order} must be an object")
            take_id = None
            media_index = None
            if str(entry.get("take_id", "")).strip():
                path, take_id, media_index = cls._media_from_take(
                    project_root, entry
                )
                source_type = "accepted_take"
            else:
                raw_path = str(entry.get("path", "")).strip()
                if not raw_path:
                    raise ValueError(
                        f"H3 assembly source {order} needs path or take_id"
                    )
                path = Path(raw_path)
                path = (
                    path if path.is_absolute() else _output_root() / path
                ).resolve()
                try:
                    path.relative_to(_output_root())
                except ValueError as exc:
                    raise ValueError(
                        "H3 assembly sources must stay inside the ComfyUI output "
                        "directory"
                    ) from exc
                source_type = "output_file"
            if path in seen_paths:
                raise ValueError(f"H3 assembly has duplicate source: {path}")
            seen_paths.add(path)
            if not path.is_file():
                raise ValueError(f"H3 assembly source does not exist: {path}")
            if path.suffix.lower() not in cls.VIDEO_SUFFIXES:
                raise ValueError(f"H3 assembly source is not a supported video: {path}")
            probe = cls._probe(path)
            record = {
                "order": order,
                "label": str(entry.get("label", "")).strip() or path.stem,
                "source_type": source_type,
                "path": path.relative_to(_output_root()).as_posix(),
                "sha256": _sha256_file(path),
                "size_bytes": path.stat().st_size,
                **probe,
                "_resolved_path": path,
            }
            if take_id is not None:
                record["take_id"] = take_id
                record["media_index"] = media_index
            sources.append(record)
        return sources

    @staticmethod
    def _public_sources(sources):
        return [
            {key: value for key, value in source.items() if key != "_resolved_path"}
            for source in sources
        ]

    @staticmethod
    def _ffmpeg():
        executable = shutil.which("ffmpeg")
        if executable:
            return executable
        try:
            import imageio_ffmpeg

            return imageio_ffmpeg.get_ffmpeg_exe()
        except Exception as exc:
            raise RuntimeError(
                "H3 sequence assembly needs FFmpeg; ComfyUI normally bundles "
                "imageio-ffmpeg"
            ) from exc

    @staticmethod
    def _transcode_plan(compatibility):
        baseline = compatibility["baseline_contract"]
        video = baseline["video"]
        audio = baseline["audio"]
        arguments = [
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-s",
            f"{video['width']}x{video['height']}",
            "-r",
            str(video["frame_rate"]),
        ]
        if audio is not None:
            arguments += [
                "-c:a",
                "aac",
                "-ar",
                str(audio["sample_rate"]),
                "-ac",
                str(audio["channels"]),
            ]
        return {
            "required_operation": "explicit_normalizing_transcode",
            "mismatches": compatibility["mismatches"],
            "target_contract": baseline,
            "suggested_ffmpeg_arguments": arguments,
            "explanation": (
                "Normalize every source to one declared video/audio contract, "
                "then concatenate the normalized intermediates. No transcode "
                "was run automatically."
            ),
        }

    @staticmethod
    def _reserve_assembly(project_root, assembly_slug):
        root = project_root / "assemblies" / assembly_slug
        with _STATE_LOCK:
            root.mkdir(parents=True, exist_ok=True)
            number = 1
            while True:
                target = root / f"assembly-{number:04d}"
                try:
                    target.mkdir()
                    return number, target
                except FileExistsError:
                    number += 1

    @staticmethod
    def _concat_line(path):
        escaped = path.as_posix().replace("'", "'\\''")
        return f"file '{escaped}'\n"

    def assemble(self, project, assembly_name, sources_json, action):
        if action not in {"inspect only", "assemble lossless"}:
            raise ValueError(f"Unsupported H3 assembly action: {action}")
        display_project, project_slug, project_root = self._ensure_project(project)
        display_assembly = str(assembly_name or "").strip() or "Review sequence"
        assembly_slug = _project_slug(display_assembly)
        sources = self._resolve_sources(project_root, sources_json)
        compatibility = self._compatibility(sources)
        public_sources = self._public_sources(sources)
        base_record = {
            "schema_version": 1,
            "project": display_project,
            "project_slug": project_slug,
            "assembly_name": display_assembly,
            "assembly_slug": assembly_slug,
            "sources": public_sources,
            "compatibility": compatibility,
        }
        if not compatibility["stream_copy_safe"]:
            plan = self._transcode_plan(compatibility)
            record = {**base_record, "operation": "refused_requires_transcode"}
            return (
                "ASSEMBLY REFUSED — stream mismatch requires explicit transcode",
                "",
                "",
                json.dumps(record, sort_keys=True),
                json.dumps(plan, sort_keys=True),
            )
        if action == "inspect only":
            record = {**base_record, "operation": "inspection_only"}
            return (
                f"ASSEMBLY READY — {len(sources)} compatible clips",
                "",
                "",
                json.dumps(record, sort_keys=True),
                "",
            )

        assembly_number, assembly_root = self._reserve_assembly(
            project_root, assembly_slug
        )
        suffix = sources[0]["_resolved_path"].suffix.lower()
        final_path = assembly_root / f"{assembly_slug}{suffix}"
        temporary_path = assembly_root / f".{assembly_slug}.partial{suffix}"
        concat_path = assembly_root / ".sources.ffconcat"
        manifest_path = assembly_root / "assembly.json"
        ffmpeg_arguments = [
            "-y",
            "-v",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_path),
            "-map",
            "0",
            "-c",
            "copy",
        ]
        if suffix in {".mov", ".mp4"}:
            ffmpeg_arguments += ["-movflags", "+faststart"]
        ffmpeg_arguments.append(str(temporary_path))
        try:
            concat_path.write_text(
                "ffconcat version 1.0\n"
                + "".join(
                    self._concat_line(source["_resolved_path"])
                    for source in sources
                ),
                encoding="utf-8",
                newline="\n",
            )
            command = [self._ffmpeg(), *ffmpeg_arguments]
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=600,
                check=False,
            )
            if completed.returncode != 0:
                detail = (completed.stderr or completed.stdout).strip()[-1200:]
                raise RuntimeError(
                    "H3 lossless concat failed with FFmpeg exit "
                    f"{completed.returncode}: {detail}"
                )
            for source in sources:
                if _sha256_file(source["_resolved_path"]) != source["sha256"]:
                    raise RuntimeError(
                        "H3 assembly source changed during concat: "
                        f"{source['path']}"
                    )
            output_probe = self._probe(temporary_path)
            expected_duration = sum(
                source["duration_seconds"] for source in sources
            )
            duration_tolerance = max(0.12, expected_duration * 0.02)
            if (
                abs(output_probe["duration_seconds"] - expected_duration)
                > duration_tolerance
            ):
                raise RuntimeError(
                    "H3 assembled duration does not match the ordered sources: "
                    f"{output_probe['duration_seconds']:.3f}s vs "
                    f"{expected_duration:.3f}s"
                )
            os.replace(temporary_path, final_path)
            output_record = {
                "path": final_path.relative_to(_output_root()).as_posix(),
                "sha256": _sha256_file(final_path),
                "size_bytes": final_path.stat().st_size,
                **output_probe,
            }
            record = {
                **base_record,
                "assembly_id": f"{assembly_slug}/assembly-{assembly_number:04d}",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "operation": "ffmpeg_concat_stream_copy",
                "ffmpeg_arguments": [
                    *ffmpeg_arguments[:8],
                    "<concat_list>",
                    *ffmpeg_arguments[9:-1],
                    "<temporary_output>",
                ],
                "expected_duration_seconds": round(expected_duration, 6),
                "duration_tolerance_seconds": round(duration_tolerance, 6),
                "output": output_record,
            }
            _atomic_write_json(manifest_path, record)
        except Exception:
            for cleanup_path in (temporary_path, concat_path):
                if cleanup_path.exists():
                    cleanup_path.unlink()
            if assembly_root.exists() and not any(assembly_root.iterdir()):
                assembly_root.rmdir()
            raise
        finally:
            if concat_path.exists():
                concat_path.unlink()
        return (
            f"ASSEMBLY COMPLETE — {len(sources)} clips — "
            f"assembly-{assembly_number:04d}",
            str(final_path),
            str(manifest_path),
            json.dumps(record, sort_keys=True),
            "",
        )


NODE_CLASS_MAPPINGS = {
    "CodexH3BenchmarkStart": CodexH3BenchmarkStart,
    "CodexH3BenchmarkRecorder": CodexH3BenchmarkRecorder,
    "CodexH3ProjectControl": CodexH3ProjectControl,
    "CodexH3TakeRecorder": CodexH3TakeRecorder,
    "CodexH3SafeContinuationStore": CodexH3SafeContinuationStore,
    "CodexH3RenderProfileControl": CodexH3RenderProfileControl,
    "CodexH3ShotPlanControl": CodexH3ShotPlanControl,
    "CodexH3ShotPlanReader": CodexH3ShotPlanReader,
    "CodexH3ShotPlanCommit": CodexH3ShotPlanCommit,
    "CodexH3ContinuityMonitor": CodexH3ContinuityMonitor,
    "CodexH3ReferenceManifest": CodexH3ReferenceManifest,
    "CodexH3SequenceAssembler": CodexH3SequenceAssembler,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CodexH3BenchmarkStart": "H3 Benchmark Start (Codex)",
    "CodexH3BenchmarkRecorder": "H3 Benchmark Recorder (Codex)",
    "CodexH3ProjectControl": "H3 Project & Take Control (Codex)",
    "CodexH3TakeRecorder": "H3 Take Recorder (Codex)",
    "CodexH3SafeContinuationStore": "H3 Safe Continuation Store (Codex)",
    "CodexH3RenderProfileControl": "H3 Render Profile Control (Codex)",
    "CodexH3ShotPlanControl": "H3 Shot Plan Control (Codex)",
    "CodexH3ShotPlanReader": "H3 Shot Plan Reader (Codex)",
    "CodexH3ShotPlanCommit": "H3 Shot Plan Commit (Codex)",
    "CodexH3ContinuityMonitor": "H3 Continuity Monitor (Codex)",
    "CodexH3ReferenceManifest": "H3 Reference Manifest (Codex)",
    "CodexH3SequenceAssembler": "H3 Sequence Assembler (Codex)",
}
