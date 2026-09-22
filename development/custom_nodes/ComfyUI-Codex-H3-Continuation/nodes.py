"""Persistent first-frame handoff nodes for sequential MiniMax H3 runs.

ComfyUI queues prompts before executing them.  A browser-side image-widget update
therefore cannot make a stack of already queued prompts continue one another.
These nodes keep the latest decoded final frame in a stable local PNG and load it
at execution time, so each queued job sees the frame written by the preceding job.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import folder_paths
import numpy as np
import torch
from PIL import Image, PngImagePlugin


_DEFAULT_SLOT = "workflow_10"
_SLOT_RE = re.compile(r"[^A-Za-z0-9._-]+")

_QUALITY_NATIVE = "NATIVE — 1.0x (fastest)"
_QUALITY_BALANCED = "BALANCED — RTX 1.5x HIGH (recommended)"
_QUALITY_LARGE = "LARGE — RTX 2.0x HIGH"
_QUALITY_PROFILES = (_QUALITY_NATIVE, _QUALITY_BALANCED, _QUALITY_LARGE)


def _safe_slot(value: object) -> str:
    slot = _SLOT_RE.sub("_", str(value or "").strip()).strip("._-")
    return (slot or _DEFAULT_SLOT)[:96]


def _state_paths(slot: object) -> tuple[Path, Path]:
    state_dir = (
        Path(folder_paths.get_output_directory())
        / "H3_Long_Form"
        / "_auto_chain"
    )
    state_dir.mkdir(parents=True, exist_ok=True)
    name = _safe_slot(slot)
    return state_dir / f"{name}.png", state_dir / f"{name}.json"


def _last_frame_to_pil(images: torch.Tensor) -> tuple[Image.Image, torch.Tensor]:
    if not isinstance(images, torch.Tensor) or images.ndim != 4 or images.shape[0] < 1:
        raise ValueError("images must be a non-empty ComfyUI IMAGE batch")
    last = images[-1:]
    pixels = (
        last[0]
        .detach()
        .to(device="cpu", dtype=torch.float32)
        .clamp(0.0, 1.0)
        .mul(255.0)
        .round()
        .to(torch.uint8)
        .numpy()
    )
    if pixels.shape[-1] == 4:
        mode = "RGBA"
    elif pixels.shape[-1] == 3:
        mode = "RGB"
    else:
        raise ValueError(f"unsupported IMAGE channel count: {pixels.shape[-1]}")
    return Image.fromarray(pixels, mode=mode), last


def _load_image(path: Path) -> torch.Tensor:
    with Image.open(path) as opened:
        rgb = opened.convert("RGB")
        pixels = np.asarray(rgb, dtype=np.float32) / 255.0
    return torch.from_numpy(pixels).unsqueeze(0)


def _atomic_save_png(image: Image.Image, destination: Path, metadata: dict[str, str]) -> None:
    pnginfo = PngImagePlugin.PngInfo()
    for key, value in metadata.items():
        pnginfo.add_text(key, value)
    handle, temporary_name = tempfile.mkstemp(
        prefix=f".{destination.stem}.", suffix=".tmp.png", dir=destination.parent
    )
    os.close(handle)
    temporary = Path(temporary_name)
    try:
        image.save(temporary, format="PNG", pnginfo=pnginfo, compress_level=4)
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def _atomic_save_json(payload: dict[str, object], destination: Path) -> None:
    handle, temporary_name = tempfile.mkstemp(
        prefix=f".{destination.stem}.", suffix=".tmp.json", dir=destination.parent
    )
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            json.dump(payload, stream, indent=2, sort_keys=True)
            stream.write("\n")
        os.replace(temporary_name, destination)
    finally:
        Path(temporary_name).unlink(missing_ok=True)


def _rtx_video_super_resolution(images: torch.Tensor, scale: float) -> torch.Tensor:
    """Run NVIDIA RTX VSR without forcing an inactive upscale branch to execute."""

    try:
        import nvvfx
    except ImportError as error:
        raise RuntimeError(
            "RTX finishing requires the installed NVIDIA RTX Video Super Resolution "
            "custom node. Select NATIVE to bypass it."
        ) from error

    if not isinstance(images, torch.Tensor) or images.ndim != 4 or images.shape[0] < 1:
        raise ValueError("images must be a non-empty ComfyUI IMAGE batch")

    # Release allocator cache after H3 video/audio decode, but retain the managed H3
    # models so an auto-chained next run does not pay an unnecessary full reload.
    try:
        import comfy.model_management as model_management

        model_management.soft_empty_cache()
    except Exception as error:
        print(f"[CodexH3OutputFinish] VRAM cache cleanup skipped: {error}", flush=True)

    _, height, width, channels = images.shape
    output_width = max(8, round((width * scale) / 8) * 8)
    output_height = max(8, round((height * scale) / 8) * 8)

    # Match NVIDIA's reference node: keep each CUDA batch under 16 megapixels.
    max_pixels = 1024 * 1024 * 16
    batch_size = max(1, max_pixels // (output_width * output_height))
    quality = nvvfx.effects.QualityLevel.HIGH

    with nvvfx.VideoSuperRes(quality) as super_resolution:
        super_resolution.output_width = output_width
        super_resolution.output_height = output_height
        super_resolution.load()
        result = torch.empty(
            (images.shape[0], output_height, output_width, channels),
            device=images.device,
            dtype=images.dtype,
        )
        for start in range(0, images.shape[0], batch_size):
            batch = images[start : start + batch_size]
            cuda_batch = batch.cuda().permute(0, 3, 1, 2).float().contiguous()
            for offset in range(cuda_batch.shape[0]):
                dlpack_output = super_resolution.run(cuda_batch[offset]).image
                frame = torch.from_dlpack(dlpack_output).movedim(0, -1).unsqueeze(0)
                result[start + offset : start + offset + 1] = frame

    return result


class CodexH3OutputFinish:
    """Apply only the selected delivery finish after native H3 decoding."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "profile": (
                    _QUALITY_PROFILES,
                    {
                        "default": _QUALITY_BALANCED,
                        "tooltip": (
                            "NATIVE preserves H3 pixels exactly. BALANCED adds an RTX "
                            "1.5x delivery finish for very little extra time. LARGE uses "
                            "RTX 2x, creating a larger file but not new H3 scene detail."
                        ),
                    },
                ),
            },
            "optional": {
                # Connecting decoded audio makes ComfyUI finish both native decodes
                # before RTX VSR begins; the value itself is intentionally untouched.
                "audio": ("AUDIO",),
            },
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("delivery_frames", "quality_status")
    FUNCTION = "finish"
    CATEGORY = "Codex/H3 Continuation"
    DESCRIPTION = (
        "A mutually exclusive delivery-quality selector. Only the chosen RTX profile "
        "runs, so NATIVE is a true zero-upscale bypass. This node belongs on the MP4 "
        "branch; keep continuation/handoff frames connected to the native VAE decode."
    )

    def finish(self, images: torch.Tensor, profile: str, audio=None):
        del audio
        if profile == _QUALITY_NATIVE:
            height, width = images.shape[1:3]
            status = f"NATIVE DELIVERY — {width}×{height}; no finishing pass"
            print(f"[CodexH3OutputFinish] {status}", flush=True)
            return images, status

        if profile == _QUALITY_BALANCED:
            scale = 1.5
            label = "BALANCED RTX 1.5× HIGH"
        elif profile == _QUALITY_LARGE:
            scale = 2.0
            label = "LARGE RTX 2× HIGH"
        else:
            raise ValueError(f"Unknown H3 delivery profile: {profile}")

        result = _rtx_video_super_resolution(images, scale)
        height, width = result.shape[1:3]
        status = (
            f"{label} — delivery {width}×{height}; native handoff remains untouched"
        )
        print(f"[CodexH3OutputFinish] {status}", flush=True)
        return result, status


class CodexH3ContinuationControl:
    """One visible switch and slot name shared by both ends of the graph."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "auto_chain": (
                    "BOOLEAN",
                    {
                        "default": False,
                        "label_on": "AUTO CHAIN ON",
                        "label_off": "MANUAL START",
                        "tooltip": (
                            "On: each run starts from the preceding run's saved handoff. "
                            "Off: use the manually loaded opening frame."
                        ),
                    },
                ),
                "slot": (
                    "STRING",
                    {
                        "default": _DEFAULT_SLOT,
                        "multiline": False,
                        "tooltip": (
                            "State name. Change it to keep independent films or projects "
                            "from sharing a handoff."
                        ),
                    },
                ),
            }
        }

    RETURN_TYPES = ("BOOLEAN", "STRING")
    RETURN_NAMES = ("auto_chain", "slot")
    FUNCTION = "values"
    CATEGORY = "Codex/H3 Continuation"
    DESCRIPTION = (
        "Controls whether the opening-frame selector reads the last handoff saved "
        "for this slot. The switch is deliberately separate from the state reader, "
        "so it can live beside the handoff controls."
    )

    def values(self, auto_chain: bool, slot: str):
        return bool(auto_chain), _safe_slot(slot)


class CodexH3ContinuationInput:
    """Choose manual input or the newest persisted handoff at execution time."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "manual_image": ("IMAGE",),
                "auto_chain": ("BOOLEAN", {"forceInput": True}),
                "slot": ("STRING", {"forceInput": True}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("opening_frame", "source_status")
    FUNCTION = "select"
    CATEGORY = "Codex/H3 Continuation"
    DESCRIPTION = (
        "When auto-chain is on, load the previous run's stable handoff PNG. If no "
        "handoff exists yet, safely fall back to the manual opening image."
    )

    @classmethod
    def IS_CHANGED(cls, manual_image, auto_chain, slot):
        # The stable filename does not change between shots. Force an execution-time
        # read so several prompts queued in advance chain in execution order.
        return float("nan")

    def select(self, manual_image: torch.Tensor, auto_chain: bool, slot: str):
        image_path, _ = _state_paths(slot)
        safe_slot = _safe_slot(slot)
        if bool(auto_chain) and image_path.is_file():
            try:
                selected = _load_image(image_path)
                status = f"AUTO CHAIN — previous handoff loaded from slot '{safe_slot}'"
                print(f"[CodexH3Continuation] {status}: {image_path}", flush=True)
                return selected, status
            except Exception as error:
                status = (
                    f"AUTO CHAIN FALLBACK — saved handoff could not be read "
                    f"({error}); using manual opening frame"
                )
                print(f"[CodexH3Continuation] {status}", flush=True)
                return manual_image, status

        if bool(auto_chain):
            status = (
                f"AUTO CHAIN READY — no previous handoff in slot '{safe_slot}'; "
                "using manual opening frame for this first run"
            )
        else:
            status = "MANUAL START — using the opening-frame loader"
        print(f"[CodexH3Continuation] {status}", flush=True)
        return manual_image, status


class CodexH3ContinuationStore:
    """Atomically persist the latest decoded final frame for the next run."""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "slot": ("STRING", {"forceInput": True}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("handoff_frame", "saved_status")
    FUNCTION = "store"
    OUTPUT_NODE = True
    CATEGORY = "Codex/H3 Continuation"
    DESCRIPTION = (
        "Save the final decoded frame to a stable, per-slot PNG after every "
        "successful shot. The next queued run reads this file when auto-chain is on."
    )

    @classmethod
    def IS_CHANGED(cls, images, slot):
        return float("nan")

    def store(self, images: torch.Tensor, slot: str):
        image, last = _last_frame_to_pil(images)
        image_path, metadata_path = _state_paths(slot)
        safe_slot = _safe_slot(slot)
        updated = datetime.now(timezone.utc).isoformat()
        pixel_sha256 = hashlib.sha256(image.tobytes()).hexdigest()
        metadata = {
            "slot": safe_slot,
            "updated_utc": updated,
            "width": str(image.width),
            "height": str(image.height),
            "pixel_sha256": pixel_sha256,
        }
        _atomic_save_png(image, image_path, metadata)
        _atomic_save_json(
            {
                "slot": safe_slot,
                "updated_utc": updated,
                "width": image.width,
                "height": image.height,
                "pixel_sha256": pixel_sha256,
                "image": str(image_path),
            },
            metadata_path,
        )
        status = f"NEXT RUN READY — saved handoff to slot '{safe_slot}'"
        print(f"[CodexH3Continuation] {status}: {image_path}", flush=True)
        return last, status


NODE_CLASS_MAPPINGS = {
    "CodexH3OutputFinish": CodexH3OutputFinish,
    "CodexH3ContinuationControl": CodexH3ContinuationControl,
    "CodexH3ContinuationInput": CodexH3ContinuationInput,
    "CodexH3ContinuationStore": CodexH3ContinuationStore,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CodexH3OutputFinish": "H3 Delivery Quality (Codex)",
    "CodexH3ContinuationControl": "H3 Auto-Chain Control (Codex)",
    "CodexH3ContinuationInput": "H3 Auto-Chain Opening Frame (Codex)",
    "CodexH3ContinuationStore": "H3 Auto-Chain Handoff Store (Codex)",
}
