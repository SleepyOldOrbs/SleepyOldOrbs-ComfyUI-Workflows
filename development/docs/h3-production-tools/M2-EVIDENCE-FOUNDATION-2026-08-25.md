# M2 Evidence Foundation — 2026-08-25

Status: **M2 matched comparison review complete; workflow 10 and Multishot are
an overall human tie.** Both technical records passed, and the maintainer also confirmed
that 10A works well in practical browser use. Gold was not modified.

## Implemented

- Added the dependency-free `ComfyUI-Codex-H3-Production` package.
- `CodexH3BenchmarkStart` captures project, engine, model, LoRA, profile,
  native/delivery dimensions, frame count, steps, CFG, sampler, scheduler and
  seed. Its unchanged seed output is the sampler dependency.
- `CodexH3BenchmarkRecorder` writes under
  `output/H3_Projects/<project>/benchmarks/benchmark.jsonl` only after a stable
  output or explicit failed/interrupted terminal state is available.
- Added the reproducible `tools/build_h3_10a_lab.mjs` builder and idempotent
  `tools/install_h3_production_node.ps1` installer.
- Added `10A H3 Production Tools Lab.json` without changing Gold.
- Added the reproducible `tools/build_h3_10c_benchmark.mjs` builder and
  `10C H3 Matched First Frame Benchmark Lab.json` without changing 10B or
  Gold.
- Retained a terminal-state API smoke and an API-native workflow-10 benchmark
  graph under `tests/`, plus the matched M2 workflow-10 and Multishot API
  graphs.

Recorder protections include output-directory containment, safe project slugs,
fresh/cached classification, no false success for missing files, no invented
hash for interrupted/failed runs, output/settings/state deduplication, a
process-wide write lock, full JSONL validation and atomic replacement. Peak
VRAM is explicitly `0.0` when no dependable non-disruptive measurement is
available; it is not guessed.

## Backups and hashes

- Protected Gold SHA-256:
  `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`
- Source and live pre-benchmark 10A backup SHA-256: the same protected Gold
  hash above.
- Source and live 10A lab SHA-256:
  `15573D1E64D2511229885B5F4B177AC3081C53A6436213190D4E4005B199D94C`
- Source and live Multishot CORE snapshot SHA-256:
  `EFB0DBBC2C025219B3858C8457E1898CE88E8DC8D43D160D2D4C0A5E3269E9A9`
- Source and live 10C lab SHA-256:
  `125E339FB4DEC2EC8A4EB54AB4E27276D2D3632F4F3A24D06AEE09F6FA6674C0`
- Builder geometry assertion: zero node overlaps and zero Pixaroma
  group-boundary breaches.

## Automated and live checks

- Focused unit tests: **10 passed** on system Python 3.14.
- Source compiled with system Python and Easy-Install embedded Python 3.12.
- Live import: `ComfyUI-Codex-H3-Production` loaded in 0.0 seconds.
- Live node inventory: exactly `CodexH3BenchmarkStart` and
  `CodexH3BenchmarkRecorder` under `Codex/H3 Production`.
- 10A live validation: **valid, 0 errors, 0 warnings, 37 converted nodes, no
  partner nodes, no credit spend**.
- 10C live validation: **valid, 0 errors, 0 warnings, 16 converted nodes, no
  partner nodes, no credit spend**.
- Both matched M2 API graphs: **valid, 0 errors, 0 warnings, no partner nodes,
  no credit spend**.
- Gold revalidation: **valid, 0 errors, 0 warnings, 34 converted nodes, no
  partner nodes, no credit spend**.
- Retained terminal-state smoke: **valid, 0 errors, 0 warnings**.
- Terminal-state smoke prompt `470d0a01-5edc-48a5-8234-e2a7cb5f934b`
  completed and wrote one `interrupted` record with no output hash.
- Replay prompt `3b61619e-9496-4d0a-859a-cdd65a90da54` completed; the manifest
  remained byte-for-byte unchanged at one line and left no temporary file.

Directly submitting the UI-format 10A graph through comfy-cli stopped before
sampling at prompt `33421955-6abc-4a1f-940a-ee59f32d1fa1`. The converter cannot
serialize PixaromaSeed's front-end-only `SeedState` object and called that node
without its required argument. Gold has the same API-conversion limitation.
This does not invalidate browser queueing. the maintainer subsequently confirmed that
10A works well in practical browser use; that clears the 10A browser/practical
gate without claiming a separate audio-listening verdict.

## First real workflow-10 record

Prompt `8924770f-cba7-4595-8ad6-d4257cf2b9d9` completed successfully using the
known short control: 608 × 352 native, 124 frames, six steps, CFG 1,
`res_multistep`, `simple`, seed `2408241001`, no LoRA.

- Recorder elapsed time to stable native handoff: **30.058768 seconds**.
- Recorder completion state: `success`.
- Stable handoff content SHA-256 recorded by the node:
  `8c7d63bf3c4e2dbf4d6694824ee55aefac76ed01804d58a1997c54c707d6b761`.
- Saved recovery PNG: 608 × 352 RGB; file SHA-256
  `4238E48B737FBF4E7D9E07093992314E8C901A1AE7DE97681888A50DBC3BAE9E`.
- Balanced delivery MP4: H.264/AAC, 912 × 528, 24 fps, 5.175 seconds; file
  SHA-256
  `46156E6D7A9509B91881C3AF85A034F8955B8708C8C5A48D2337D4546C0540EC`.

The final goat handoff was inspected as a valid image. This is technical
evidence only: it is not the maintainer's visual or listening acceptance verdict.

## Matched workflow-10 versus Multishot first-frame record

The dedicated comparison uses `H3_Long_Form_Test_Start.png` as the common goat
opening frame and one common operator prompt. Workflow 10 receives the
documented I2VA alignment line explicitly; upstream `H3MultishotSampler`
prepends that same line internally. Both graphs use the installed FL2VA model,
no LoRA, seed `2408241001`, 608 × 352 native/delivery dimensions, 124 frames,
six steps, CFG/basic guider 1, `res_multistep` and `simple`. Both began after an
idle ComfyUI model-cache unload.

Controlled workflow-10 prompt `96ca7de9-9d7a-4dc0-b6a8-5b11cb6155c4`
completed successfully:

- recorder elapsed time: **26.801536 seconds**;
- stable handoff SHA-256:
  `848F6CCD57AE53811BD3A591F7B6E1260CA9813A1152CBB9251C35842F8B5A0B`;
- native H.264/AAC MP4: 608 × 352, 24 fps, 124 frames, 5.175 seconds;
- MP4 SHA-256:
  `EFB53C973C5E3DB4996628A94475331AA5F3138EB97351679AFCC7D5CF216966`.

Multishot prompt `6c729502-be60-4cc4-8bef-1bfc1821b233` completed
successfully:

- recorder elapsed time: **27.098956 seconds**;
- stable handoff SHA-256:
  `EA76262F09AA07A511A1E35EE305560F0D8A8B55B26BB5908382462CEADF34FD`;
- native H.264/AAC MP4: 608 × 352, 24 fps, 124 frames, 5.167 seconds;
- MP4 SHA-256:
  `7FEDCDC8DE6582BD00CEE6C24A21D87AFD56E6EF19771AC54976E7ED5F008882`.

The measured elapsed difference is 0.297420 seconds, approximately 1.1%, so
this single short run supports a technical timing tie rather than a speed
claim. Decoded first frames were close to the common resized input (mean
absolute pixel differences 6.72 for workflow 10 and 6.69 for Multishot). The
two complete decoded videos were also close but not identical (mean absolute
pixel difference 2.73); decoded audio had equal length and a mean absolute
difference of 0.00032. The final handoffs were visually inspected as coherent
goat frames. the maintainer reviewed the pair and reported an overall **tie**. That
closes the M2 engine-preference gate without inventing separate visual-pass or
audio-pass wording that the maintainer did not provide.

The earlier browser run of unmodified 10B saved its first-shot preview and
then stopped safely because that dialogue example was still set to
`continuity=context_pin`, which explicitly requires the absent optional Motion
Context package. 10C uses upstream `H3MultishotSampler` first-frame I2V and has
no Motion Context dependency.

## Gates still open

- Separate explicit visual-pass and audio-pass verdicts were not requested
  again after the overall tie; do not cite them as independently passed.
- The broader 864/960/1056/Turbo comparison set is not yet recorded by this
  package.
- Human dialogue, prop/reference and three-shot continuation gates have not
  been rerun for this milestone.

Known unrelated startup noise remains: the pre-existing Nunchaku package is
absent and legacy extensions emit deprecation warnings. ComfyUI core 0.33.0 and
Pixaroma 1.4.120 were deliberately left on the frozen baseline during M2.
