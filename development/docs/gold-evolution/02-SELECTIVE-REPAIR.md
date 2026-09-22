# Stage 2 — Selective repair

## Purpose

Repair a face, hand, object, texture, or other local defect without regenerating the whole image and risking changes elsewhere.

## Why this route

The installed Pixaroma Krea Edit example references `krea2_identity_edit_v1_2.safetensors`, but that LoRA file is not installed. The gold workflow therefore uses components that are present and validated:

- Pixaroma Inpaint Crop and Inpaint Stitch
- the installed MiniMax H3 FL2VA model and conditioning encoder
- H3's five-frame image-edit pattern
- Image From Batch to recover the repaired still

This avoids a silently broken Krea Edit branch.

## Human controls

- **J1 — Repair source:** raw Krea Pass 2 by default, or the SeedVR2/RCAS final when the still-output branch is enabled.
- **J3 — Selective repair instruction:** a formal I2VA still-edit prompt.
- **I3 — Repair AI:** true bypass; off passes the written instruction unchanged.
- **I4 — Selective repair:** mutes or runs the expensive branch.
- **11B — Paint mask here:** open the Pixaroma crop editor and paint only the defect.

## Repair geometry

The saved defaults use:

- keep-shape crop with 1024 px long side
- dimensions aligned to 32
- 96 px of surrounding context
- 12 px mask growth
- 8 px mask blur
- 32 px stitch softness
- mask-only blending
- subtle colour matching

The model edits the context crop, then Pixaroma restores only the painted mask into the original. Everything outside it remains unchanged.

## Validation

- Internal graph integrity: passed.
- Live ComfyUI node/model validation: passed with zero errors and zero warnings.
- No missing Krea Edit LoRA dependency: confirmed, because this implementation does not pretend that absent file exists.
- No partner/API nodes or cloud spending.
- Human mask painting and aesthetic acceptance remain interactive gates.

## Recovery

- Before-stage backup: `07 GOLD STANDARD - BACKUP before Stage 2 Selective Repair - 2026-08-21.json`
- Teaching checkpoint: `Gold Evolution/Stage 2 - Selective Repair.json`
