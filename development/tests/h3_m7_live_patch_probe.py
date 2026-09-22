"""Probe Motion Context and Multishot patch ownership against live core code.

This runs in a disposable Python process. It imports the installed sources and
applies their runtime patches only inside that process; the ComfyUI server is
not modified. No model is loaded and no media or project state is written.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path
from types import ModuleType


PAYLOAD_MARKER = "_h3_motion_context_payload_patch"
LAYOUT_MARKER = "_h3_motion_context_layout_patch"


def load_module(name: str, path: Path, *, package: bool = False) -> ModuleType:
    kwargs = {"submodule_search_locations": [str(path.parent)]} if package else {}
    spec = importlib.util.spec_from_file_location(name, path, **kwargs)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not create import spec for {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--comfy-root", type=Path, required=True)
    args = parser.parse_args()

    comfy_root = args.comfy_root.resolve()
    custom_nodes = comfy_root / "custom_nodes"
    motion_root = custom_nodes / "ComfyUI-H3-Motion-Context"
    multishot_root = custom_nodes / "comfyui-h3-multishot"
    for required in (
        comfy_root / "comfy" / "model_base.py",
        motion_root / "__init__.py",
        multishot_root / "h3_avbank_probe.py",
        multishot_root / "h3_interior_patch.py",
    ):
        if not required.is_file():
            raise FileNotFoundError(required)

    os.chdir(comfy_root)
    sys.path.insert(0, str(comfy_root))
    sys.path.insert(0, str(custom_nodes))

    import comfy.ldm.minimax.model as minimax_model
    import comfy.model_base as model_base

    multishot_payload = load_module(
        "h3_m7_multishot_payload",
        multishot_root / "h3_avbank_probe.py",
    )
    del multishot_payload
    payload_owner = model_base.MiniMaxH3.extra_conds
    if not getattr(payload_owner, PAYLOAD_MARKER, False):
        raise AssertionError("Multishot did not publish the shared payload marker")

    motion_package = load_module(
        "ComfyUI-H3-Motion-Context",
        motion_root / "__init__.py",
        package=True,
    )
    del motion_package
    from importlib import import_module

    patch_layout = import_module("ComfyUI-H3-Motion-Context.patch_layout")
    patch_payload = import_module("ComfyUI-H3-Motion-Context.patch_payload")

    if not patch_payload.apply_patch() or not patch_payload.is_applied():
        raise AssertionError("Motion Context did not accept Multishot payload ownership")
    if model_base.MiniMaxH3.extra_conds is not payload_owner:
        raise AssertionError("Motion Context stacked a second payload wrapper")

    if not patch_layout.apply_patch() or not patch_layout.is_applied():
        raise AssertionError("Motion Context live-core layout self-test failed")
    if not getattr(minimax_model.PackedLayout.__init__, LAYOUT_MARKER, False):
        raise AssertionError("Motion Context did not publish its layout marker")

    multishot_layout = load_module(
        "h3_m7_multishot_layout",
        multishot_root / "h3_interior_patch.py",
    )
    ok, message = multishot_layout.ensure_interior_keyframes(verbose=False)
    if not ok or "standing down" not in message.lower():
        raise AssertionError(f"Multishot did not stand down: {message}")

    print(
        json.dumps(
            {
                "valid": True,
                "comfy_root": str(comfy_root),
                "payload_owner": payload_owner.__module__,
                "payload_shared_marker": True,
                "payload_wrapper_stacked": False,
                "layout_owner": minimax_model.PackedLayout.__init__.__module__,
                "layout_self_test": "passed",
                "multishot_layout": message,
                "model_loaded": False,
                "media_written": False,
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
