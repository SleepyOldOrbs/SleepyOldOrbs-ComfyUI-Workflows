# Stage 6 — Character and project presets

## Purpose

Make the enlarged control desk reusable without copying nodes or maintaining separate near-duplicate workflows.

## Preset bank

The new **Q1 — Character & Project Preset Bank** provides:

- four named character slots
- four named project slots
- Save and Apply controls for each slot
- Export preset backup
- Import preset backup

Slots are stored in `goldPresetState` on the controller node. Saving the workflow therefore saves the presets inside the workflow JSON.

## Character scope

A character slot captures the identity-centred controls:

- Quick Prompt / Pixaroma Tag state
- Krea Pass 1 and Pass 2 seeds
- Krea LoRA selection and strengths
- primary identity/character reference image
- opening storyboard reference image

It deliberately avoids capturing scene-specific repair, continuation, and storyboard destination instructions.

## Project scope

A project slot captures the complete human-control desk above the canvas, excluding instructional notes and controller nodes. That includes prompts, AI formulas/settings, images, switches, resolutions, durations, seeds, LoRAs, and optional-branch states.

The capture is keyed by stable node title rather than generated node number, so a preset remains usable if later maintenance renumbers the graph.

## External preset backup

`Export preset backup` downloads a small `Gold-Character-Project-Presets-YYYY-MM-DD.json` file. `Import preset backup` restores it. No image/model files are embedded; the backup stores control values and local image/model selections.

## Controller-package backup

The exact pre-stage controller package is preserved at:

`backups/Stage 6 - before Character and Project Presets/ComfyUI-Gold-Operating-Modes`

The stage also updates the earlier six-mode controller so H3 Preview and H3 Final enable the three new main-H3 VRAM barriers along with the original H3 nodes.

## Validation

- ComfyUI restarted successfully after the custom-node update.
- `GoldCharacterProjectPresets` appears in live `/object_info`.
- The browser renders four character slots, four project slots, Save/Apply buttons, and Export/Import controls.
- The complete workflow passes live validation with zero errors and zero warnings.
- Geometry audit: zero node overlaps and zero group-boundary breaches among all 89 added nodes.

## Recovery

- Workflow backup: `07 GOLD STANDARD - BACKUP before Stage 6 Character and Project Presets - 2026-08-21.json`
- Controller backup: `backups/Stage 6 - before Character and Project Presets/ComfyUI-Gold-Operating-Modes`
- Teaching checkpoint: `Gold Evolution/Stage 6 - Character and Project Presets.json`

Restore both the workflow and controller backup, then restart ComfyUI, to return completely to Stage 5 behaviour.
