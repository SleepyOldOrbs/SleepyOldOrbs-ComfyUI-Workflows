# ComfyUI Codex Workflows

Private, versioned collection of the ComfyUI workflows created during the Codex collaboration with the maintainer.

The repository preserves the teaching graphs, Krea 2 experiments, Pixaroma-based Gold Standard workflow, operating modes, recoverable evolution stages, upscaling comparisons, MiniMax H3 branches, type-safe entity reference-sheet workflow, compact H3 Ref2VA Director, first/last-frame long-form shot builder, an isolated Multishot comparison lab, and a separate benchmark-recorder lab.

## Contents

- `workflows/Codex MCP Demos/` - the complete openable ComfyUI collection: 57 JSON workflows plus recovery notes.
- `custom_nodes/ComfyUI-Codex-H3-Continuation/` - the four-node local helper used by workflow 10's optional auto-chain and mutually exclusive delivery-quality control.
- `custom_nodes/ComfyUI-Codex-H3-Production/` - the local Benchmark Start/Recorder package used by the separate 10A and 10C evidence labs.
- `docs/gold-evolution/` - stage-by-stage documentation and recovery index for the Gold Standard evolution.
- `docs/entity-reference-sheets/` - instructions for the Krea 2 Ref2VA-ready entity-sheet workflow.
- `docs/h3-ref-gold/` - daily-use guide, VRAM notes, validation record and recovery instructions for the compact MiniMax H3 Ref2VA Gold workflow.
- `docs/h3-long-form/` - manual and automatic shot-to-shot continuation, measured native/RTX quality choices, ending-frame guidance, state-slot behaviour and recovery instructions for workflow 10.
- `docs/h3-production-tools/` - dated implementation roadmap and milestone evidence for the optional MiniMax H3 production helpers.
- `tag-library/` - the exported Pixaroma library containing the random entity pools, plus its pre-change backup.
- `tools/` - the JavaScript generators, validators and idempotent H3 helper-node installers used to construct the workflow families reproducibly.
- `tests/` - retained API-format Krea 2 and MiniMax H3 prompt/render validation workflows.
- `WORKFLOW_INDEX.md` - human-readable inventory and suggested learning order.

Generated images, ComfyUI logs, model binaries, Python caches, credentials and unrelated machine-local files are intentionally excluded.

## Install in ComfyUI

1. Back up any existing workflow folder with the same name.
2. Copy `workflows/Codex MCP Demos` into:

   ```text
   <ComfyUI>/user/default/workflows/
   ```

3. If using workflow 10's auto-chain or delivery-quality selector, install its four-node helper package (change the path argument for another installation). RTX profiles additionally require NVIDIA RTX Video Super Resolution; NATIVE does not:

   ```powershell
   .\tools\install_h3_continuation_node.ps1 -ComfyUIPath '<ComfyUI>'
   ```

4. To use the separate 10A or 10C production-tools labs, install their dependency-free benchmark package:

   ```powershell
   .\tools\install_h3_production_node.ps1 -ComfyUIPath '<ComfyUI>'
   ```

5. Restart ComfyUI, then refresh the browser.
6. Open a workflow and use ComfyUI's missing-node/model checks before queuing it.

For the random entity-sheet workflow, open any Pixaroma Prompt node, choose **Tags**, then import `tag-library/pixaroma-tag-library-with-entity-mix.json`. Review the import preview and merge it with the existing library; the included export retains the pre-existing categories as well as the four new `Codex...` categories.

The workflows reference locally installed models and custom nodes; model binaries are not stored in Git. Requirements vary by workflow, but the collection principally uses Krea 2, Pixaroma, SeedVR2, MiniMax H3, Krea2T Enhancer, NVIDIA RTX nodes, Easy Use and several standard utility packs.

## Entity reference-sheet markers

The latest `08 KREA2 ENTITY REFERENCE SHEETS - Ref2VA Ready.json` queues two random poseable characters and two random turnaround entities. Its marker-only Prompt Multi rows select the safe route:

- `[TPOSE]` creates the nine-view face, full-body and T-pose sheet for a person or genuinely humanoid subject.
- `[TURNAROUND]` creates a six-view orthographic/product sheet for creatures, vehicles, buildings, props, food and other subjects.

The orange Pixaroma Prompt nodes resolve 54 ten-choice lists from four separate `Codex...` categories: 540 curated choices. The marker is expanded before Krea receives the prompt. The turnaround route contains no face, full-body or T-pose instructions, preventing objects from being forced onto invented people.

One shared Pixaroma LoRA Loader sits in the Krea model and CLIP path. It is disabled by default; when deliberately enabled, one compatible Krea 2 LoRA and its trigger words apply consistently to every queued character and entity sheet.

## Reproducibility notes

- Recovery checkpoints are intentionally retained; they show how the workflows evolved and make regressions reversible.
- Generator scripts contain installation-specific source/output paths and should be reviewed before running on another machine.
- Workflow JSON was copied from the live ComfyUI workflow folder without modifying the originals.
- At repository creation, all copied workflow-tree files matched their sources by relative path, byte count and SHA-256 hash. Later changes are recorded as normal Git commits.

Snapshot created: 24 August 2026.
