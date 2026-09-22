# M4 Thin Controls — 2026-08-25

Status: **M4 complete in the isolated thin-controls lab.** The evidence-cleared
render-profile selector and execution-time shot-plan state passed automated
and live validation. Gold was not modified.

## Implemented

- `CodexH3RenderProfileControl` exposes a transparent, atomic recipe for an
  explicitly named upstream engine. It does not receive a model,
  conditioning, latent, or resolution and never samples.
- `Gold Base` emits 20 steps, CFG 1, `res_multistep`, `simple`, and no LoRA.
  `Quick Preview` emits 6 steps with the same sampler contract and is labelled
  non-final. Every token contains the evidence source, resolution owner, and
  recipe SHA-256.
- Turbo options are intentionally absent. M2 did not record a comparable
  Turbo recipe, so M4 does not promote an unverified profile.
- `CodexH3ShotPlanControl` validates and canonicalises a non-empty JSON plan,
  preserves immutable SHA-addressed versions, and keeps independent branch
  position/revision/history. Changed plan text requires the explicit `reset`
  action.
- `CodexH3ShotPlanReader` resolves the current shot at execution time, not at
  queue time. It preserves exact dialogue and performs no prompt rewriting.
- `CodexH3ShotPlanCommit` verifies plan hash, branch revision, current shot,
  take identity, acceptance result, handoff path, and handoff content hash.
  Accepted takes advance; rejected takes stay on the same shot; stale or
  mismatched commits fail closed.
- `CodexH3ProjectControl` accepts the optional profile token and records the
  complete verified recipe in each take's provenance.
- Added deterministic `tools/build_h3_10e_thin_controls_lab.mjs`, isolated
  `10E H3 Thin Controls Lab.json`, and retained
  `tests/h3_m4_thin_controls_smoke_api.json`. The lab uses one known image to
  exercise state and contains no H3 model or sampler.

## Automated checks

- Test-first profile red state failed because the profile class did not exist;
  shot-plan red states then failed for each missing control/reader/commit seam.
- Final focused M2–M4 suite: **29 passed** on system Python 3.14.7.
- Coverage includes exact Gold/Quick recipes, full profile provenance and hash
  rejection, plan versioning, exact dialogue, reference and handoff metadata,
  accepted/rejected commits, previous/next/repeat/reset recovery, stale commit
  rejection, and execution-time S01 → S02 → S03 sequencing for pre-queued work.
- Ruff, system-Python compilation, Easy-Install embedded-Python 3.12.10
  compilation, Node syntax checking, and deterministic double-build passed.

## Live checks

- The queue was empty before deployment. Easy-Install ComfyUI restarted from
  PID 22004 to PID 16560 and registered all nine production classes.
- Live runtime remained ComfyUI 0.33.0 on Python 3.12.10 and PyTorch
  2.11.0+cu130 with the RTX 5080.
- `10E` validation: **valid, 0 errors, 0 warnings, 16 converted nodes, no
  partner nodes, no credit spend**.
- Retained M4 API graph: **valid, 0 errors, 0 warnings, no partner nodes, no
  credit spend**.
- Gold revalidation: **valid, 0 errors, 0 warnings, 34 converted nodes, no
  partner nodes, no credit spend**.
- Three copies of the same state-only graph were queued before inspecting the
  final state. Prompt IDs were:
  - `c6070df7-05dd-4ce4-8271-bd19aeb12e5a`
  - `667f2ee3-d842-4e01-881d-e10a4299d7c3`
  - `51894688-7338-4dc6-a5de-cea33f045c7f`
- All three completed. The branch finished at `current_index: 3`,
  `revision: 3`, with three accepted history records in exact order:
  `S01`, `S02`, `S03`.
- Each shot created `take-0001` with the exact Gold Base recipe, recipe hash
  `A4CE371C8B90AD4A5C0BC0A22D7AF5A5AFD3A945B553CF1C7C2DE962CEFD0EEF`,
  exact shot dialogue in the recorded prompt, and a content-hashed handoff.

## Integrity and boundaries

- Protected Gold SHA-256 remained
  `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.
- Source and live `10E` SHA-256 matched at
  `F379E85CF31CA74BC42F757F2CDD3B6D897745869DE0F8A4E7986E473ECB5221`.
- `ComfyUI-Codex-H3-Continuation` was not modified. ComfyUI core, Pixaroma,
  H3 Multishot, and Motion Context were not updated, installed, or patched.
- No model generation, network API, partner node, or Comfy credit was used.
- Gold Base and Quick Preview settings are evidence-backed by earlier real M2
  and Gold acceptance runs. M4 validated selection, provenance, state, and
  sequencing; it did not rerun goat, dialogue, or complex-action generation,
  so it makes no new human visual-quality claim.

M5 is next: permitted upstream continuity measurements plus the
engine-independent Reference Manifest Builder, again isolated from Gold first.
