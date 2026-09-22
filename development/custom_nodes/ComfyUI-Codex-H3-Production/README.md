# ComfyUI-Codex-H3-Production

This package provides twelve deliberately small H3 production-state nodes.

## Benchmark evidence

- **H3 Benchmark Start (Codex)** captures the exact render settings and returns
  the same seed. Wire its `render_seed` output directly into the real sampler so
  the start time is part of the render dependency path.
- **H3 Benchmark Recorder (Codex)** runs after a stable output exists (or after
  an explicit interrupted/failed terminal signal) and atomically updates one
  local JSON Lines manifest.

## Project and take state

- **H3 Project & Take Control (Codex)** creates an isolated project directory,
  preserves the human-readable project/scene/shot/branch names, and atomically
  reserves the next take directory. Its unchanged `render_seed` can drive the
  real sampler.
- **H3 Safe Continuation Store (Codex)** writes an immutable ending frame into
  the reserved take. In `BLOCK TECHNICAL`, non-finite, wrong-size, nearly all
  black, and nearly all white frames are retained for inspection without
  changing the accepted-current handoff. Exposure, contrast, detail, and an
  optional continuity message remain advisory.
- **H3 Take Recorder (Codex)** writes `take.json` plus the project-level
  `takes/takes.jsonl` index with identity, prompt, engine, model, LoRA, profile,
  dimensions, seed, references, parent handoff, output-relative media paths,
  hashes, timing, and accepted/rejected/failed/interrupted state.

Project state is stored beneath the active ComfyUI output directory:

```text
H3_Projects/<safe-project-slug>/
  project.json
  shot-plan/
  references/
  takes/<scene>/<shot>/<branch>/take-0001/
  handoffs/<scene>/<shot>/<branch>/current.png
  benchmarks/
  assemblies/
```

Accepted and rejected media remain immutable inside their take directories.
Only the atomic `current.png`/`current.json` state copy advances, and an older
take cannot replace a newer accepted handoff. A rollback is represented by a
new branch name; existing takes are never deleted.

## Thin render and shot controls

- **H3 Render Profile Control (Codex)** exposes only benchmark-cleared atomic
  settings for an existing H3 sampler. `Gold Base` is 20 steps at CFG 1 with
  `res_multistep`/`simple` and no LoRA. `Quick Preview` is the same recipe at
  6 steps and is explicitly non-final. It receives no model, conditioning,
  latent, or resolution and never samples. Turbo profiles remain absent until
  their exact recipes have comparable recorded evidence.
- **H3 Shot Plan Control (Codex)** stores a canonical versioned JSON shot plan
  plus per-branch position and recovery history. A changed plan is rejected
  until the operator chooses the explicit `reset` action.
- **H3 Shot Plan Reader (Codex)** resolves the current shot from disk at
  execution time. This makes pre-queued runs consume the next committed shot,
  while dialogue is returned and embedded in the prompt unchanged.
- **H3 Shot Plan Commit (Codex)** checks the exact plan hash, branch revision,
  shot/take identity, acceptance state, handoff path, and handoff SHA-256. An
  accepted matching take advances; a rejected matching take remains on the
  current shot; stale or mismatched commits fail closed.

Shot plan state is stored beneath the project directory:

```text
shot-plan/<safe-plan-slug>/
  plan.json
  versions/<plan-sha256>.json
  branches/<safe-branch-slug>.json
```

## Continuity and references

- **H3 Continuity Monitor (Codex)** compares the previous handoff, current
  ending frame, and optional identity reference using lightweight dimensions,
  luma/contrast, colour histogram, edge-density, contrast-normalised
  Laplacian sharpness, and perceptual-hash measurements. It emits named
  thresholds, a difference image, and an advisory record; it never blocks a
  take or loads a vision model. With a project take token, `continuity.json`
  is written atomically beside that take.
- **H3 Reference Manifest (Codex)** compacts up to nine enabled images into
  deterministic `Picture N` order while retaining explicit character,
  creature, prop, vehicle, location, or other roles. It returns the original
  separate images, an H3 Multishot-compatible fitted batch,
  `reference_subjects`, a content-hashed machine manifest, and a literal
  prompt preamble. Entity descriptions are supplied by the operator and are
  never inferred from the image.

## Project delivery assembly

- **H3 Sequence Assembler (Codex)** resolves an explicit ordered list of
  accepted take media and/or manual clips beneath the active ComfyUI output
  directory. It verifies recorded hashes, source immutability, duration, and
  complete container/video/audio stream contracts.
- `inspect only` writes no media. `assemble lossless` invokes FFmpeg concat
  with stream copy only when every stream field matches. A mismatch returns no
  output and supplies the exact conflicting fields plus an explicit target
  transcode contract; the node never silently normalizes or re-encodes.
- Successful assemblies and content-hashed manifests are stored immutably at
  `H3_Projects/<project>/assemblies/<assembly>/assembly-NNNN/`. Source clips
  are never modified.

## Benchmark records

Records are stored under the active ComfyUI output directory:

```text
H3_Projects/<safe-project-slug>/benchmarks/benchmark.jsonl
```

Each record includes model and LoRA identity, native and delivery dimensions,
frame count, sampler settings, seed, profile, elapsed time, supplied peak VRAM,
completion state, output-relative path, and output SHA-256. The full settings
object is retained so a recorded configuration can be replayed without relying
on memory.

## Benchmark safety behaviour

- `auto` classifies a newly written file as `success` and an older file as
  `cached`.
- `success`, `cached`, and `auto` refuse a missing output.
- `interrupted` and `failed` may record a missing output but never invent a
  content hash.
- Output paths must remain inside ComfyUI's output directory.
- Project slugs cannot be replaced with paths.
- Matching output, settings, and terminal state are retained only once.
- Existing malformed JSONL is reported and left unchanged.
- Manifest updates are serialized and replaced atomically.

The package has no network calls and adds no dependencies beyond ComfyUI's
existing PyTorch, NumPy, Pillow, PyAV, and FFmpeg/imageio-ffmpeg runtime.
