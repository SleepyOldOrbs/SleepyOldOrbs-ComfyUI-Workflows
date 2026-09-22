# Workflow index

## Suggested learning order

1. `01 Krea2 Manual Prompt.json`
2. `02 Krea2 Structured Prompt.json`
3. `03 Krea2 Double Sampler.json`
4. `04 Krea2 Double Sampler + KGodRays LoRA.json`
5. `05 RTX 2x ULTRA Upscale.json`
6. `06 SeedVR2 2048 Upscale.json`
7. `07 GOLD STANDARD.json`
8. `08 KREA2 ENTITY REFERENCE SHEETS - Ref2VA Ready.json`
9. `09 GOLD STANDARD - MiniMax H3 Ref2VA Director.json`
10. `10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json`
11. `10A H3 Production Tools Lab.json` (workflow-10 benchmark lab)
12. `10B H3 Automated Dialogue Chain Lab.json` (technical comparison lab)
13. `10C H3 Matched First Frame Benchmark Lab.json` (matched M2 evidence lab)
14. `10D H3 Safe Project State Lab.json` (accepted/rejected project-state lab)
15. `10E H3 Thin Controls Lab.json` (profile and shot-plan control lab)
16. `10F H3 Continuity and References Lab.json` (continuity/reference lab)
17. `10G H3 Sequence Assembly Lab.json` (source-preserving delivery lab)
18. `10H H3 Motion Context Lab.json` (accepted advanced continuation lab)

## Current primary workflows

- `07 GOLD STANDARD.json` - simpler Krea-focused working workflow.
- `07 GOLD STANDARD - Complete Krea2 Pipeline.json` - complete evolved Krea/Pixaroma/H3 pipeline.
- `08 KREA2 ENTITY REFERENCE SHEETS - Ref2VA Ready.json` - one-click random batch of two poseable characters and two type-safe creature/object/prop turnarounds, assembled from Pixaroma tags with one optional shared Krea 2 LoRA.
- `09 GOLD STANDARD - MiniMax H3 Ref2VA Director.json` - compact six-reference H3 video director with dictation-friendly Pixaroma controls, Tags, a lazy local-AI/manual prompt switch and one dependable audio/video render path.
- `10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json` - one-shot-per-run H3 continuation workflow with a manual opening frame, optional planned ending frame, Pixaroma Video Prompt controls, native-detail size chips, a measured RTX 1.5x delivery default, native handoff recovery files and a safe image AUTO CHAIN. Its human-accepted M7 Motion Context path is optional: normal Gold leaves both latent groups bypassed, while M7 chains deliberately enable current-latent saving and then prior-latent apply/probe/trim.
- `10A H3 Production Tools Lab.json` - protected copy of workflow 10 with a Benchmark Start in the real sampler seed path and an atomic local JSONL Recorder after the stable native handoff. It is an evidence lab, not a Gold replacement.
- `10B H3 Automated Dialogue Chain Lab.json` - isolated Multishot 2.6.5 comparison graph using the installed native Ref2VA model, core `beta` scheduler and exact manual dialogue scripts without the optional JoyEcho writer. It is a lab, not a Gold replacement.
- `10C H3 Matched First Frame Benchmark Lab.json` - one-shot FL2VA comparison graph built around the installed upstream `H3MultishotSampler`. It matches the retained workflow-10 control on opening image, operator prompt, seed, native size, frame count, steps, CFG-equivalent guider, sampler and scheduler, then records a stable handoff locally. It is an evidence lab, not a Gold replacement.

## Gold Evolution

- `Stage 1 - Reference Image Controls.json`
- `Stage 2 - Selective Repair.json`
- `Stage 3 - H3 Continuation.json`
- `Stage 4 - Storyboard Mode.json`
- `Stage 5 - VRAM Choreography.json`
- `Stage 6 - Character and Project Presets.json`

Read `docs/gold-evolution/00-ROADMAP.md` and `docs/gold-evolution/RECOVERY-INDEX.md` alongside these stages.

## Operating Modes

- `01 Quick Draft.json`
- `02 Prompt Exploration - Batch of 10.json`
- `03 Gold Still - Double Sampler + SeedVR2.json`
- `04 H3 Preview - Pass 1 + Turbo.json`
- `05 H3 Final - Pass 2 + Base Quality.json`
- `06 Comparison Lab - All Still Paths.json`

## Recovery checkpoints

The root contains twelve dated `07 GOLD STANDARD - BACKUP before ...` files covering major architectural transitions.

`Backups/08 KREA2 Entity Reference Sheets/` contains eleven openable checkpoints:

- initial validated
- before expanded views
- expanded views validated
- before type-safe routing
- type-safe routing validated
- before random tag mix
- random tag mix validated
- before shared LoRA
- shared LoRA validated
- before 540-tag expansion
- 540-tag expansion validated

These files are deliberately versioned as teaching and recovery artefacts, not disposable duplicates.

`Backups/09 H3 Ref Gold/` contains the initial validated compact H3 Ref2VA Director checkpoint and its recovery note. Read `docs/h3-ref-gold/README.md` for the daily route and measured acceptance record.

`Backups/10 H3 Long Form/` contains both the exact M0 freeze and the byte-identical `BEFORE M7 MOTION CONTEXT` recovery checkpoint created immediately before the accepted optional Gold integration. Read `docs/h3-long-form/README.md` for the manual/automatic continuation loop, state-slot behaviour, measured resolution trade-offs and the rules for compatible ending frames; read `docs/h3-production-tools/M7-MOTION-CONTEXT-2026-08-25.md` for the accepted latent-continuation route.

`Backups/10B H3 Automated Dialogue Chain/` contains the exact installed Multishot 2.6.5 v2 example used to generate the local comparison lab. Read `docs/h3-production-tools/M1-REUSE-AUDIT-2026-08-25.md` for upstream validation failures, local compatibility changes and the reuse/adapt/build/reject decisions.

`Backups/10A H3 Production Tools/` contains the exact protected Gold bytes copied before Benchmark Start/Recorder integration. Read `docs/h3-production-tools/M2-EVIDENCE-FOUNDATION-2026-08-25.md` for the implementation and live proof record.

`Backups/10C H3 Matched First Frame Benchmark/` contains the exact installed Multishot 2.6.5 CORE example used to generate the matched first-frame evidence lab.

## Complete inventory

The repository contains 64 ComfyUI workflow JSON files:

- 30 at the collection root
- 11 entity-reference-sheet backup workflows
- 1 H3 Ref Gold backup workflow
- 6 H3 Long Form backup workflows
- 1 H3 Production Tools pre-integration backup
- 1 H3 Automated Dialogue Chain upstream snapshot
- 1 H3 Matched First Frame upstream snapshot
- 1 H3 Motion Context upstream snapshot
- 6 Gold Evolution workflows
- 6 Operating Mode workflows

The accompanying recovery notes bring the copied live workflow tree to 60 files total.
