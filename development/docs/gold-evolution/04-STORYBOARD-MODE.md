# Stage 4 — Storyboard mode

## Purpose

Turn three still references into a coherent short sequence with a defined opening, middle development, and destination beat.

## Human controls

- **N1 — Story frame 1:** opening beat.
- **N2 — Story frame 2:** middle action beat.
- **N3 — Story frame 3:** destination beat.
- **N4 — Structured three-beat story prompt:** defines what each image contributes and what must not carry over.
- **I7 — Storyboard AI:** true bypass for the dedicated Pixaroma storyboard director.
- **I8 — H3 storyboard:** mutes or runs the Ref2VA branch.

## Prompt structure

The prompt uses full-reference H3 ordering:

1. `subject_definitions`
2. `summary` with `task_type: keyframe completion`
3. `retention_analysis`
4. `detailed_description`
5. `overall_soundscape`
6. `non_diegetic_music`

The template assigns Picture 1 to the opening, Picture 2 to approximately 1.75 seconds, and Picture 3 to approximately 3.50 seconds in a 5.17-second clip.

## Important limitation

Ref2VA treats the three pictures as strong, labelled visual references throughout sampling. It does not mathematically lock them to exact video frames. The prompt provides timing and narrative pressure, but human visual review remains required. For an exact first-and-last-frame constraint, use the existing Pixaroma FFLF workflow.

## Validation

- Internal graph integrity: passed.
- Live ComfyUI node/model validation: passed with zero errors and zero warnings.
- All three default images exist in the local input list.
- No partner/API nodes or cloud spending.

## Recovery

- Before-stage backup: `07 GOLD STANDARD - BACKUP before Stage 4 Storyboard Mode - 2026-08-21.json`
- Teaching checkpoint: `Gold Evolution/Stage 4 - Storyboard Mode.json`
