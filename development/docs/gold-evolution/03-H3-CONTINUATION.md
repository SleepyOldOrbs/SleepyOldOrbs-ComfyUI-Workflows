# Stage 3 — H3 continuation

## Purpose

Generate a second MiniMax H3 clip that begins from the actual final decoded frame of the first clip.

## Human controls

- **L1 — H3 continuation idea/action:** describes what happens next.
- **I5 — Continuation AI:** true bypass for the dedicated Pixaroma continuation director.
- **I6 — H3 continuation:** mutes or enables only the second-clip branch.

The normal H3 branch must also be enabled with E4, because it supplies clip one's decoded frames.

## Hand-off design

1. `ImageFromBatch` selects index `-1`, the final decoded frame of clip one.
2. Pixaroma Longest Side preserves its aspect ratio and supplies matching H3 dimensions.
3. The frame becomes `<Picture 1>` and the exact 0.00-second first frame of clip two.
4. A separate FL2VA model path generates clip two with its own fixed seed and 20-step sampler.
5. Clip two is saved separately as `Codex_GOLD_H3_Continuation_Clip_02`.

Separate files make retries safe and cheap: an imperfect continuation cannot overwrite the approved first clip.

## Prompt structure

The continuation director uses the formal H3 I2VA structure:

1. exact picture-alignment instruction
2. `integrated_multimodal_description`
3. `overall_soundscape`
4. `non_diegetic_music`

Its formula explicitly preserves identity, clothing, environment, light, lens, camera side, and motion direction, while rejecting pose resets and discontinuous cuts.

## Validation

- Internal graph integrity: passed.
- Live ComfyUI node/model validation: passed with zero errors and zero warnings.
- No partner/API nodes or cloud spending.
- Visual continuity and the final edit between the two MP4 files remain human acceptance gates.

## Recovery

- Before-stage backup: `07 GOLD STANDARD - BACKUP before Stage 3 H3 Continuation - 2026-08-21.json`
- Teaching checkpoint: `Gold Evolution/Stage 3 - H3 Continuation.json`
