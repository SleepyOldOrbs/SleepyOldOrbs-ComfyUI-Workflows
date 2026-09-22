# M5 Continuity and References — 2026-08-25

Status: **M5 complete in the isolated continuity/reference lab.** The two new
classes passed test-first, deterministic-build, live-runtime, workflow, and
state-record checks. Protected Gold was not modified.

## Reuse boundary

- H3 Multishot remains the owner of within-run reference delivery and existing
  image-level seam measurements. Its contrast-normalised Laplacian texture
  energy was adapted with attribution instead of inventing a second unnamed
  sharpness rule.
- The Codex continuity node adds only advisory project-history, reference, and
  difference-image reporting. It has no sampler, model, render control, or
  artistic rejection output.
- The typed entity manifest is a genuine project-level gap. Its outputs feed
  the existing Multishot contract: separate references, fitted reference
  batch, `reference_subjects`, and prompt preamble.

## Implemented

- `CodexH3ContinuityMonitor` measures dimensions/aspect ratio, brightness,
  contrast, colour histogram distance, edge density, contrast-normalised
  Laplacian sharpness, dHash distance, optional reference distances, and
  accepted same-branch chain length.
- Every advisory names its metric, actual value, and fixed threshold. The
  serialized record always contains `blocking: false`. With a project take
  token it atomically writes `continuity.json` in the reserved take directory.
- `CodexH3ReferenceManifest` validates explicit typed entries for up to nine
  images. Enabled slots compact to consecutive Picture numbers; disabled slots
  disappear without changing the remaining order.
- Stable entity ID/display/role/group metadata must agree. Multiple views of
  one entity must remain contiguous, so the existing comma-count
  `reference_subjects` contract cannot silently describe the wrong batch.
- Original reference tensors remain separate and unchanged. The returned batch
  transparently records any bilinear centre fit to the first reference size,
  plus source dimensions and per-image SHA-256 values.
- The canonical manifest has its own content hash. Prompt sentences are built
  only from supplied role, name, view, and description; the node performs no
  image-to-text inference or anthropomorphic rewriting.
- Added deterministic `tools/build_h3_10f_continuity_refs_lab.mjs`, retained
  `10F H3 Continuity and References Lab.json`, and retained
  `tests/h3_m5_continuity_refs_smoke_api.json`. The lab uses six existing local
  assets: character, Highland cattle, building, car, drone, and lamp.

## Automated checks

- Seven M5 tests cover controlled brightness, blur, crop and identity changes;
  advisory-only ordinary motion; optional reference and accepted-take history;
  people/goat/vehicle/building/sandwich typing; disabled-slot compaction;
  multi-view grouping; mixed-size batch fitting; stable hashes; and fail-closed
  ambiguous mappings.
- Final focused M2–M5 suite: **36 passed** on system Python 3.14.7.
- Ruff, Python compilation, the builder geometry guard, Gold hash guard, and a
  deterministic double-build passed.

## Live checks

- The execution queue was empty before deployment. ComfyUI restarted through
  the Manager endpoint and returned on PID 19600 using embedded Python 3.12.10,
  PyTorch 2.11.0+cu130, ComfyUI 0.33.0, and the RTX 5080.
- Raw `/object_info` contained 2,415 classes. Both M5 classes were present and
  all eleven production package classes were registered.
- `10F` validation: **valid, 0 errors, 0 warnings, 20 converted nodes, no
  partner nodes, no credit spend**.
- Retained M5 API graph: **valid, 0 errors, 0 warnings, no partner nodes, no
  credit spend**.
- Gold revalidation: **valid, 0 errors, 0 warnings, 34 converted nodes, no
  partner nodes, no credit spend**.
- Final state-only prompt `eae0096b-e577-4b26-9dbc-c5744564b948`
  completed without error. It returned the difference image plus six reference
  previews and wrote `take-0002/continuity.json`.
- Live continuity output reported two named dHash advisories for the selected
  start/end pair, retained `blocking: false`, and recorded exact thresholds,
  source attribution, dimensions, reference comparison, and chain length.
- Live manifest output reported six pictures and six entities,
  `reference_subjects: 1,1,1,1,1,1`, and manifest SHA-256
  `9280ADA8CB1B566A0AC3312E33CD151D7F4278C22C2C4D2936228C745866DB44`.
  The captured prompt preamble matched Picture 1–6 order exactly.

## Integrity and boundaries

- Protected Gold SHA-256 remained
  `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.
- Source and live `10F` SHA-256 matched at
  `DDED4623A03209FF7407A8967FD9A7E726F0ABD8D0CFDBD545051E5A776F752F`.
- Existing input assets were read only. No model generation, network API,
  partner node, or Comfy credit was used.
- `ComfyUI-Codex-H3-Continuation`, ComfyUI core, Pixaroma, H3 Multishot, and
  Motion Context were not modified, updated, installed, or patched.
- The live six-sheet batch happened to share 1536 x 1536 dimensions;
  mixed-dimension fitting is covered by the retained unit test and its explicit
  provenance assertions.

M6 is next: confirm the exact project-level gap left by upstream within-run
stitching, then implement only that delivery adapter in a separate workflow.
