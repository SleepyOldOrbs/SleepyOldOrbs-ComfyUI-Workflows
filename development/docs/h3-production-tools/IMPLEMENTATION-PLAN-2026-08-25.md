# H3 Production Tools - Implementation Plan for 25 August 2026

Status: **implementation complete; M0 through M7 passed and are published.**
Revised on 25 August 2026 after separate human picture and audio passes, the
dated pre-M7 Gold backup, selective optional integration, live validation and
post-integration smoke verification.

This document turns the eight proposed MiniMax H3 production helpers into a safe build sequence for the next working session. The existing workflow 10 remains the protected, working baseline. Each helper must prove itself in a separate laboratory workflow before any accepted part is introduced into Gold.

## Intended outcome

Build a small optional production layer around the dependable MiniMax H3 long-form workflow so repeated shots are easier to direct, record, compare and assemble without turning the daily-use graph into another enormous workflow.

The tools should preserve the existing Pixaroma-led experience: human-facing controls remain clearly labelled and grouped, prompting remains readable, disabled features do no work, and automation never silently overrides creative decisions.

## New evidence and revised strategy

The [MiniMax H3 lip-sync and automatic long-video demonstration](https://www.reddit.com/r/StableDiffusion/comments/1vx3sdl/minimax_h3_lipsync_automatic_longvideo_chaining/) independently demonstrates several ideas in this plan: one audio track split into promptable clips, optional ending-to-opening continuation, a persistent subject reference, selective clip re-rendering, automatic stitching, and low-VRAM/speed controls.

More importantly, the local ComfyUI installation already contains [ComfyUI-H3-Multishot](https://github.com/jlucasmcrell/ComfyUI-H3-Multishot) 2.6.5 and its four example workflows. That package already covers substantial parts of shot scripting, first-frame chaining, retakes, audio seam handling, stitching and render controls. Its tighter raw-latent continuation mode can use [ComfyUI-H3-Motion-Context](https://github.com/NikoDemon80/ComfyUI-H3-Motion-Context), but that optional dependency is not currently installed.

The implementation policy is therefore **reuse before adaptation, adaptation before invention**:

| Decision | When to use it |
| --- | --- |
| Reuse unchanged | The installed node or workflow already satisfies the functional, safety and usability requirements. |
| Add a thin Pixaroma-facing adapter | The engine is dependable but its controls do not fit the simple human-facing workflow. |
| Build a new Codex node | A real gap remains in persistent state, safety, provenance, manifest construction or benchmarking. |
| Do not adopt | The feature duplicates an existing engine, introduces conflicting runtime patches, performs work while disabled or cannot pass the acceptance gates. |

Likely division after the initial audit:

- **Reuse:** H3 Multishot's splitting, first-frame chaining, prompt-per-shot format, within-chain retakes, audio joining and within-run stitching.
- **Assess as an optional advanced engine:** Motion Context's raw-latent motion/audio handoff. Installation is a separate decision after compatibility and rollback checks.
- **Adapt only if necessary:** render/profile controls, shot-list controls, continuity measurements and assembly controls.
- **Still valuable as Codex-owned gaps:** technical handoff safety, project/take provenance, deterministic reference manifests and benchmark recording.

This discovery reduces the expected amount of custom code. It does not justify replacing the simple workflow 10 or importing a large automated graph into Gold.

## Protected baseline

- Preserve `10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json` as the known-good baseline.
- Keep `ComfyUI-Codex-H3-Continuation` intact while the new tools are developed.
- Create a separate package named `ComfyUI-Codex-H3-Production`.
- Create a separate lab workflow named `10A H3 Production Tools Lab.json`.
- Create a separate comparison workflow named `10B H3 Automated Dialogue Chain Lab.json` only after copying—not editing—the relevant upstream example into a recoverable workspace.
- Make a dated, openable workflow backup before every integration stage.
- Do not modify Gold until the relevant lab workflow, API smoke test and live validation all pass.

## Shared architecture rules

- Store project state beneath `ComfyUI/output/H3_Projects/<project>/` so it travels with rendered work rather than custom-node code.
- Write JSON and handoff images atomically: prepare a temporary file, validate it, then replace the intended state file.
- Never delete or overwrite accepted source media. Corrections create a new take, branch or version.
- Read mutable state at execution time so several pre-queued jobs receive the correct shot and handoff rather than sharing stale queue-time values.
- A disabled route must not load a model, evaluate an AI prompt or perform hidden work.
- Keep native H3 frames separate from delivery copies. Upscaling or finishing must never alter continuation state.
- Prefer Pixaroma controls and prompt-building nodes for the visible workflow experience. Custom nodes should solve state, safety or record-keeping problems that graph wiring cannot solve cleanly.
- Do not duplicate an installed H3 engine merely to rename its controls. Prefer composition or a thin adapter that leaves the tested sampler implementation upstream.
- Do not vendor, fork or patch an upstream package unless a demonstrated gap cannot be solved safely at graph level and its license permits the change.
- Check for duplicate runtime patches and node-class ownership before installing Motion Context or another H3 chaining package.
- Every node must expose a useful status string and fail with an actionable message.

## 1. H3 Render Profile Control

Working class: `CodexH3ProfileSampler`

Purpose: replace the sampler-setting tangle with one deliberate, reproducible choice while keeping image size under the existing Pixaroma controls.

Revised approach: first map H3 Multishot's studio controls, speed-booster controls and verified sampler recipes. Build `CodexH3ProfileSampler` only if a small Pixaroma-facing adapter cannot select those existing controls coherently. The adapter must not reimplement the underlying sampler or conceal which upstream engine executed.

M4 implementation outcome: the smaller `CodexH3RenderProfileControl` adapter was sufficient. It receives only a profile name and an explicit upstream engine name, then emits the atomic primitive settings and a hashable provenance token. It does not receive a model, conditioning or latent and does not sample. Only `Gold Base` and `Quick Preview` are exposed because M2 contains comparable evidence for those recipes. The two proposed Turbo profiles remain deferred rather than presenting unverified settings as accepted profiles.

Initial profiles:

| Profile | Intended use | Sampler contract |
| --- | --- | --- |
| Gold Base | Best dependable final result | 20 steps, `res_multistep`, `simple`, no Turbo LoRA |
| Turbo Action | Faster shots with stronger movement | 8 steps, Turbo LoRA, `euler`, `beta` |
| Turbo Dialogue | Faster restrained performance | 12 steps, Turbo LoRA, `euler`, `beta` |
| Quick Preview | Composition and prompt checking only | deliberately low-cost settings, clearly marked non-final |

Inputs should include model, positive/negative conditioning, latent, seed and profile. Outputs should include sampled latent plus a readable summary of the settings actually used.

Constraints:

- A profile is one coherent recipe; never combine a Turbo LoRA with Gold sampler settings accidentally.
- Do not resize inside the node or conceal native resolution from the user.
- Keep an advanced/manual escape route, but do not make it the default control surface.

Acceptance:

- Gold Base reproduces the existing working path.
- Only the selected profile executes.
- Goat, human dialogue and complex-action tests complete without model/sampler mismatches.
- Recorded settings match the chosen profile exactly.

## 2. Auto-Chain Safety Gate

Working class: `CodexH3SafeContinuationStore`

Purpose: prevent a broken or technically unusable final frame from replacing a known-good continuation handoff.

Revised approach: retain this as a Codex-owned node. Existing chaining engines can pass frames or latents forward, but they do not replace the need for an explicit accepted-state boundary around our cross-run project handoff.

Modes:

- `OFF`: preserve current automatic-store behaviour.
- `WARN`: store the frame but emit clear diagnostics.
- `BLOCK TECHNICAL`: retain the previous handoff when objective technical checks fail.

Initial checks:

- finite pixel values and readable image data;
- expected dimensions and aspect ratio;
- near-total black or white frames;
- conservative exposure and contrast limits;
- blur or lack-of-detail warning;
- optional continuity warning supplied by the monitor.

Failure behaviour:

- Save the rejected frame separately for inspection.
- Leave the previous accepted handoff byte-for-byte unchanged.
- Do not advance the shot plan.
- Explain which test failed and whether the current run can be repeated safely.

This node is a technical safety gate, not an art critic. It must not reject unusual composition, stylisation or deliberate darkness merely because the image looks unconventional.

Acceptance:

- Synthetic black, white and corrupt inputs are rejected in `BLOCK TECHNICAL`.
- A normal goat frame is accepted.
- The previous handoff hash remains unchanged after rejection.
- Several pre-queued jobs cannot overwrite state out of sequence.

## 3. Shot List Stepper

Working classes:

- `CodexH3ShotPlanControl`
- `CodexH3ShotPlanReader`
- `CodexH3ShotPlanCommit`

Purpose: allow a short written sequence to feed one shot instruction at a time into the existing Pixaroma prompt route.

Revised approach: audit and reuse H3 Multishot's per-shot script format, prompt splitting and selective start/end clip controls. A Codex node should be built only for the missing project-state contract: exact-dialogue preservation, execution-time plan reads, accepted-handoff commits and safe recovery after a failed shot.

The control owns project, plan file and operator actions such as previous, next, repeat and reset. The reader resolves the current shot at execution time. The commit node advances only after the current render and handoff have been accepted.

Plan records should support:

- shot ID and short title;
- action and camera instruction;
- exact dialogue text;
- referenced character, prop and location IDs;
- optional profile override;
- notes for the next handoff.

Constraints:

- Preserve quoted dialogue exactly unless the user explicitly enables rewriting.
- Store a plan hash so editing a live script cannot silently change queued work.
- Keep projects and branches isolated.
- A failed or cancelled render must not consume a shot.

Acceptance:

- Queueing three jobs in advance executes shots 1, 2 and 3 in order.
- A failed second shot leaves the plan on shot 2.
- Repeat does not create an accidental plan advance.
- Exact dialogue survives the prompt path unchanged.

## 4. Project and Take Manager

Working classes:

- `CodexH3ProjectControl`
- `CodexH3TakeRecorder`

Purpose: give every render an explicit project, scene, shot, take and branch identity, with enough provenance to reproduce or roll back a sequence.

Revised approach: retain this as Codex-owned infrastructure. It should record whether a take came from workflow 10, H3 Multishot first-frame mode, Motion Context or another accepted engine without trying to own those engines.

Proposed structure:

```text
H3_Projects/<project>/
  project.json
  shot-plan/
  references/
  takes/
  handoffs/
  benchmarks/
  assemblies/
```

Each accepted or rejected take should record model, LoRA, seed, profile, prompt, references, native and delivery dimensions, output files, status, timing, content hashes and parent handoff.

Constraints:

- Use filesystem-safe slugs without losing the human-readable display name.
- Allocate take numbers atomically.
- Record rollback as a new branch; never delete later takes.
- Keep media paths relative to the project root when possible.

Acceptance:

- Two projects with identical shot names never share state.
- Concurrent take allocation cannot produce duplicate names.
- Any recorded take can be traced to its prompt, settings, references and parent frame.
- Rolling back preserves all prior media and history.

## 5. Continuity Monitor

Working class: `CodexH3ContinuityMonitor`

Purpose: warn about likely visual drift between the starting reference, previous handoff and new ending frame without pretending to make a creative judgement.

Revised approach: inspect and, where permitted, reuse the upstream seam-probe, level-step and freeze-detection measurements before writing equivalents. Add only the missing project-history and reference-identity comparisons. The monitor remains advisory; it must not turn upstream measurements into an undocumented artistic rejection rule.

Initial lightweight measurements:

- dimensions and aspect ratio;
- brightness and contrast;
- colour histogram distance;
- edge density and sharpness;
- perceptual hash distance;
- chain length;
- optional lightweight reference similarity when it adds little VRAM cost.

Outputs should include a status label, numeric measurements, a concise advisory and an optional comparison/difference image. The default monitor warns only; the safety gate decides whether an objective technical failure can block storage.

Acceptance:

- Controlled brightness, blur, crop and identity-change tests move the appropriate metrics predictably.
- Ordinary character motion is not reported as a hard failure.
- Default operation does not load a large vision model or disturb H3 VRAM choreography.
- Every warning identifies the metric and threshold responsible.

## 6. Reference Manifest Builder

Working class: `CodexH3ReferenceManifest`

Purpose: turn a mixed set of character sheets, props, vehicles, locations and other entities into a deterministic reference map and prompt preamble.

Revised approach: retain this as a Codex-owned gap and make its outputs feed either the simple Pixaroma workflow or an accepted Multishot reference input. The manifest must remain engine-independent.

Each image entry should have:

- enabled state;
- entity ID and display name;
- role such as character, creature, prop, vehicle or location;
- view or sheet type;
- concise description;
- optional group ID for several views of one entity.

The node should number only enabled images consecutively as `Picture 1`, `Picture 2` and so on, then produce both a machine-readable manifest and clear text such as `Picture 3 is Prop A: a toasted cheese sandwich on a blue plate.`

Constraints:

- Never infer that a non-human object has a face, body or pose.
- Keep several views of one entity grouped under one stable entity ID.
- Make numbering deterministic regardless of disabled slots.
- Preserve a visible mapping so the user can verify every picture reference before rendering.

Acceptance:

- Mixed people, goat, vehicle, building and sandwich references remain correctly typed.
- Gaps caused by disabled slots are renumbered safely.
- Multi-view character sheets do not become several different characters.
- The resulting prompt references match the actual image order exactly.

## 7. Sequence Assembler

Working class: `CodexH3SequenceAssembler`

Purpose: assemble accepted takes into a reviewable long-form video without changing the original clips.

Revised approach: do not duplicate H3 Multishot's within-run stitcher. Scope this node to project-level assembly of accepted takes, manual workflow-10 clips, alternate branches and externally rendered segments. If upstream stitching satisfies that broader contract, replace this proposed node with documentation and a thin project-manifest adapter.

This should live in a separate assembly workflow, not the generation graph. It reads the project manifest, verifies clip order, dimensions, frame rate, codec and audio compatibility, then chooses:

- lossless FFmpeg concatenation when streams genuinely match; or
- one explicit, documented transcode when they do not.

The assembler should write an assembly manifest containing source hashes, order, durations, operation chosen and final output hash.

Later optional features may include short crossfades, basic colour matching, title cards and alternate-take selection, but they are outside the first implementation.

Acceptance:

- Matching clips concatenate without generational re-encoding.
- Mismatched clips refuse unsafe stream-copy and explain the transcode required.
- Source clips remain unchanged.
- Output duration and source-order manifest agree with the assembled file.

## 8. Benchmark Recorder

Working classes:

- `CodexH3BenchmarkStart`
- `CodexH3BenchmarkRecorder`

Purpose: turn future speed and quality discussions into comparable evidence rather than recollection.

Revised approach: retain this as the first new Codex-owned implementation after the compatibility audit. It supplies the evidence needed to compare workflow 10, Multishot first-frame chaining and any later Motion Context trial fairly.

The start node must sit in the true render dependency path so its timestamp reflects actual execution. The recorder appends one JSON Lines record after the output exists.

Record at least:

- model and LoRA identity;
- native and delivery dimensions;
- frame count, steps, CFG, sampler and scheduler;
- seed and profile;
- elapsed time and, where obtainable without destabilising the run, peak VRAM;
- output path, content hash and completion state;
- optional later human verdict for motion, identity, prompt adherence and overall preference.

Constraints:

- Append locally with no network dependency.
- Identify cached, interrupted and failed runs rather than mixing them with clean measurements.
- Do not count the same output twice.
- Keep timing overhead negligible.

Acceptance:

- Known 864, 960, 1056 and Turbo comparisons produce believable records.
- Cached runs are clearly distinguishable.
- An interrupted render never appears as a successful benchmark.
- Replaying a recorded configuration is straightforward.

## Shared verification contract

Every implementation stage requires:

1. focused Python unit tests for state and file operations;
2. a retained API-format smoke graph;
3. live ComfyUI workflow validation with zero errors and zero warnings;
4. a visual layout check for overlaps and group-boundary breaches;
5. a real goat test, human dialogue test, prop/reference test and three-shot continuation test where relevant;
6. manual viewing and listening for any milestone that claims visual or audio quality.

Passing automated tests is not the same as human acceptance. The documentation must state which of those gates has and has not happened.

## Revised build order

The recommended order is now:

1. **Compatibility and overlap audit** - compare workflow 10 with the installed H3 Multishot nodes and example workflows; classify every proposed feature as reuse, adapt, build or reject.
2. **Benchmark Recorder** - creates comparable evidence for every later engine and setting choice.
3. **Project and Take Manager** - establishes engine-independent names, provenance and storage.
4. **Auto-Chain Safety Gate** - protects the structured cross-run handoff state.
5. **Render Profile adapter, only if a gap remains** - expose accepted existing recipes through simple Pixaroma-facing controls without duplicating a sampler.
6. **Shot List adapter, only if a gap remains** - add safe project commits and recovery around the upstream script/retake facilities.
7. **Continuity and Reference Manifest work** - reuse upstream technical probes, then add missing project-history and deterministic entity mapping.
8. **Sequence assembly gap analysis** - build only the project-level functionality not already handled by upstream stitching.
9. **Optional Motion Context trial** - only after dependency, patch-ownership, rollback and benchmark gates have passed; never as an unreviewed prerequisite for Gold.

## Milestones and backups

- **M0 - Freeze (complete):** verify Gold, record hashes and create the first dated backup.
- **M1 - Reuse audit (complete):** inventory the live H3 Multishot classes, validate copies of its example workflows in isolation, create `10B`, and produce the reuse/adapt/build/reject matrix. Do not install Motion Context during this milestone.
- **M2 - Evidence foundation (complete):** scaffold `10A`, implement Benchmark Recorder, and compare the current workflow-10 baseline with an equivalent Multishot first-frame test.
- **M3 - Safe project state (complete):** implement Project/Take Manager and the Auto-Chain Safety Gate.
- **M4 - Thin controls (complete):** add only the evidence-cleared render-profile selector plus execution-time, versioned shot-plan read/commit and recovery controls still justified by the M1 findings. Turbo, sampler duplication and script splitting remain deferred/rejected pending evidence of a real gap.
- **M5 - Continuity and references (complete):** integrated permitted upstream measurements and implemented the engine-independent Reference Manifest Builder in isolated workflow `10F` without modifying Gold.
- **M6 - Delivery (complete):** confirmed upstream stitching stops at within-run frame/audio joins and implemented only the residual accepted-take/manual-file Sequence Assembler in isolated workflow `10G`.
- **M7 - Optional advanced continuation (complete):** Motion Context passed dependency, patch-ownership, rollback, live-core, latent round-trip and real two-clip execution gates in isolated workflow `10H`. the maintainer judged the picture join “Smooth and seamless” and separately returned `Audio Pass`. Commit `3c94ae8` created the dated pre-M7 Gold backup and integrated only the accepted load/apply/probe/trim/save path as two independently bypassable groups; normal Gold leaves both bypassed and performs no hidden latent I/O.

Each milestone should end with an openable workflow checkpoint, a short validation note and a Git commit. Gold integration should remain a series of small reversible commits rather than one large replacement.

## Tomorrow's restart checklist

1. Confirm local `main`, `origin/main` and the worktree are synchronized.
2. Confirm the intended ComfyUI installation is listening on port 8188 and inspect its live node inventory.
3. Validate workflow 10 and compare its SHA-256 hash with the committed protected baseline.
4. Create the M0 dated backup before making functional changes.
5. Record the installed H3 Multishot version, node classes, example-workflow hashes, dependencies and current availability of Motion Context.
6. Copy the smallest relevant upstream workflow into an isolated, dated comparison area; do not edit the installed original.
7. Validate and inspect Multishot's first-frame chaining, audio split/weld, prompt splitting, start/end retake controls, reference handling, stitching and lazy speed/VRAM gates.
8. Produce the reuse/adapt/build/reject matrix for all eight proposals and confirm the remaining custom-node scope.
9. Decide separately whether a reversible Motion Context lab installation is justified. Check runtime-patch ownership and compatibility before requesting or performing it.
10. Scaffold `ComfyUI-Codex-H3-Production`, `10A H3 Production Tools Lab.json` and `10B H3 Automated Dialogue Chain Lab.json` only after the audit.
11. Implement Benchmark Recorder first, including tests and a retained smoke graph.
12. Stop after its technical checks and review the first comparable records before moving to another node.

## Pause conditions

Stop and investigate before continuing if:

- the current Gold workflow stops validating or opening cleanly;
- a disabled feature triggers an inactive model or AI branch;
- any state operation can overwrite accepted media without a recoverable version;
- ComfyUI's execution-time or queue behaviour differs from the assumed contract;
- two H3 packages attempt to own the same runtime patch or node-class contract;
- an upstream node already satisfies a proposed feature and a new node would only duplicate it;
- Turbo settings fail human quality acceptance despite passing technical tests.

## Explicit non-goals

- No all-in-one autonomous director node.
- No automatic artistic accept/reject decision.
- No deletion of source assets or rejected takes.
- No programmatic Blabbermouth integration; dictated text remains a normal text input.
- No attempt to implement or integrate all eight tools in one pass.
- No fork, vendored copy or local patch of an upstream H3 package merely to change labels or layout.
