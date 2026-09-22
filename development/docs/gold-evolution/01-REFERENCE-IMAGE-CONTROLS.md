# Stage 1 — Reference-image controls

## Purpose

Add a separate, optional MiniMax H3 Ref2VA output without disturbing the existing Krea still path or Krea-to-H3 first-frame path.

## Human controls

- **R1 — Primary identity / character reference:** the person or character to preserve.
- **R2 — World / wardrobe / prop reference:** a second image whose explicitly named elements may be borrowed.
- **R3 — Structured H3 reference prompt:** a full-reference prompt with the formal H3 section order.
- **I1 — Reference AI:** a true bypass. Off passes the structured prompt through unchanged; on asks the Pixaroma AI node to rewrite it.
- **I2 — H3 reference video:** mutes or enables the entire expensive Ref2VA branch.

Both switches are off in the saved checkpoint.

## Processing design

The branch uses the installed local components:

- `minimax_h3_ref2va_pruned_int8_convrot.safetensors`
- the dedicated MiniMax H3 32B conditioning encoder
- MiniMax H3 video and audio VAEs
- a 20-step `res_multistep` base sampler
- Pixaroma MP4 preview/save

The small generative Qwen model is used only by the optional AI prompt writer. It is not substituted for the H3 conditioning encoder.

Reference sizing defaults to `match`, which is the sensible balance on the 16 GB RTX 5080. `max` is available on the conditioning node for stronger identity fidelity, but carries a substantial runtime and memory cost.

## Validation

- Internal graph integrity: passed.
- Live ComfyUI node/model validation: passed with zero errors and zero warnings.
- No partner/API nodes: confirmed; this branch spends no cloud credits.
- Full generation: deliberately not queued as part of structural implementation because it is a long local H3 render.

## Recovery

- Before-stage backup: `07 GOLD STANDARD - BACKUP before Stage 1 Reference Image Controls - 2026-08-21.json`
- Teaching checkpoint: `Gold Evolution/Stage 1 - Reference Image Controls.json`

To undo Stage 1, close or replace the live workflow with the before-stage backup. The teaching checkpoint remains available for inspection.
