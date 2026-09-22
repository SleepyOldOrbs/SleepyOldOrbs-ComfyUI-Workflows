# M3 Safe Project State — 2026-08-25

Status: **M3 complete in the isolated state lab.** Project/take provenance and
the technical accepted-handoff boundary passed automated and live validation.
Gold was not modified.

## Implemented

- `CodexH3ProjectControl` creates the documented
  `output/H3_Projects/<project>/` structure, preserves display names alongside
  safe slugs, and atomically reserves unique per-scene/per-shot/per-branch take
  directories.
- `CodexH3SafeContinuationStore` has `OFF`, `WARN`, and `BLOCK TECHNICAL`
  modes. It records finite-pixel, exact-dimension, near-total-black, and
  near-total-white failures. Exposure, contrast, detail/blur, and supplied
  continuity messages are advisory so the node does not become an art critic.
- Every inspected frame is retained inside its take. Accepted frames use
  `handoff.png`; technical failures use `rejected-handoff.png`; late older
  completions use `out-of-sequence-handoff.png`.
- Accepted take media is immutable. The next-run state is an atomic
  `current.png` plus `current.json` copy, and an older take cannot replace a
  newer accepted handoff.
- `CodexH3TakeRecorder` writes immutable `take.json` records and atomically
  appends `takes/takes.jsonl`. Records include identity, engine, model, LoRA,
  profile, prompt, references, native/delivery dimensions, seed, parent
  handoff, media paths, hashes, timing, completion state, and status text.
- Rollback is represented by a new branch. The allocator never deletes or
  renumbers existing take history.
- Added the reproducible `tools/build_h3_10d_state_lab.mjs` builder, the
  isolated `10D H3 Safe Project State Lab.json`, and retained normal/rejection
  API smoke graphs. The lab loads a known image and does not load an H3 model.

## Automated checks

- Test-first red state: all 13 new tests initially failed because the M3 node
  classes did not exist.
- Focused suite after implementation: **23 passed** on system Python 3.14,
  comprising 13 M3 state tests and all 10 M2 benchmark regressions.
- The concurrency test allocated 32 unique take numbers and directories from
  eight worker threads.
- Unit coverage proves isolated projects, branch-based rollback preservation,
  provenance and parent/media hashes, output-directory containment, normal
  acceptance, black/white/non-finite/dimension rejection, advisory warning
  behavior, byte-for-byte current-handoff preservation, and out-of-sequence
  protection.
- Source compiled successfully with Easy-Install embedded Python 3.12 before
  deployment.

## Live checks

- The existing Easy-Install server was reloaded in place through the installed
  Manager endpoint. It remained ComfyUI 0.33.0 on embedded Python 3.12.10 and
  registered all five production classes under `Codex/H3 Production`.
- `10D` live validation: **valid, 0 errors, 0 warnings, 8 converted nodes, no
  partner nodes, no credit spend**.
- Both retained API smokes: **valid, 0 errors, 0 warnings, no partner nodes, no
  credit spend**.
- Gold revalidation: **valid, 0 errors, 0 warnings, 34 converted nodes, no
  partner nodes, no credit spend**.
- Normal goat prompt `26375064-2eec-4371-a112-5550d833ca40` completed. The real
  864 × 480 goat reference passed with mean exposure `0.44601321`, contrast
  `0.22055648`, detail `0.01520594`, and no failures or warnings.
- Its accepted `current.png` SHA-256 was
  `7E17D1106AD3F73EC8CD0F8B84F4D2F8F8233D0B91838277F51811F205887D84`.
- Black-frame prompt `8dbcaf56-84c6-47cd-998d-a7d841df9ec9` completed as a
  rejected take with `near_total_black`. It retained a separate rejected PNG;
  the accepted `current.png` hash and take-1 metadata remained byte-for-byte
  unchanged.
- The project index then contained exactly two records in order: take 1
  `accepted`, take 2 `rejected`.
- Direct UI-format `10D` prompt
  `c5b6d34f-582e-41ef-9254-6abbfa2ea7a8` completed and exposed the visible
  statuses `HANDOFF ACCEPTED` and `TAKE RECORDED — accepted`.

## Integrity and boundaries

- Protected Gold SHA-256 remained
  `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.
- Source and live `10D` SHA-256 matched at
  `FCEB624BD9EF5B97D8F4342D2AD40244758305EEDEA010A50440736B1D724070`.
- `ComfyUI-Codex-H3-Continuation` was not modified. M3 remains an optional,
  isolated state layer and is not wired into Gold.
- No model generation, network API, partner node, or Comfy credit was used.
- ComfyUI core, Pixaroma, H3 Multishot, and Motion Context state were not
  changed. The frozen baseline remains deliberate even though the control
  interface reports newer core/Pixaroma versions are available.

M4 is now complete in its own isolated lab and is documented in
`M4-THIN-CONTROLS-2026-08-25.md`.
