# M0-M7 Completion Audit - 25 August 2026

Status: **M0-M7 complete; all technical, human-acceptance, backup,
integration, validation and publication requirements passed.**

This audit derives completion from
`IMPLEMENTATION-PLAN-2026-08-25.md` and checks the current repository, live
Easy-Install server, retained workflows, API graphs, tests, output records and
published Git state. A passing file parse or an earlier status note is not used
as proof by itself.

## Current authority

- Repository:
  `<development>`
- Live ComfyUI:
  `<ComfyUI>`
- Live listener: `http://127.0.0.1:8188`, PID 18356, empty queue.
- Published acceptance package: commit `b1afec5`.
- Selective accepted Gold integration: commit `3c94ae8`.
- Current integrated Gold SHA-256:
  `3FC4003ABBDDFE601119159B31437687A048A76CA12000E7CD82A9EE4C7BD1D7`.
- Dated pre-M7 Gold backup SHA-256:
  `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.
- Live registry: 2,421 classes, including all 16 `CodexH3*` classes and all
  five `MiniMaxH3MotionContext*` classes.
- The repository and installed copies of `ComfyUI-Codex-H3-Production` have
  matching SHA-256 values for `__init__.py`, `nodes.py` and `README.md`.

ComfyUI core and Pixaroma remain deliberately frozen at the versions used by
the milestone evidence. The pre-existing core deletion of
`output/_output_images_will_be_put_here` and untracked core `docs/` directory
remain unrelated and untouched.

## Requirement-by-requirement milestone audit

| Milestone | Required outcome | Current proof | Verdict |
| --- | --- | --- | --- |
| M0 Freeze | Protect Gold, record an exact recovery point, validate the baseline before functional work. | Commit `1411924`; the M0 and dated pre-M7 backups retain the exact protected 34-node baseline and hash. | **Complete** |
| M1 Reuse audit | Inventory Multishot, validate retained examples, create an isolated comparison and classify reuse/adapt/build/reject without installing Motion Context. | Commit `0602480`; Multishot 2.6.5 current; 10B converts 38 nodes with 0 findings; the retained matrix rejects sampler/script/stitch duplication and keeps Motion Context separate. | **Complete** |
| M2 Evidence foundation | Implement benchmark recording, retain API evidence, produce a matched workflow-10/Multishot comparison and record the human result. | Commits `98302c5`, `3f1e281`, `407d061`; 10A and 10C convert 37/16 nodes with 0 findings; all four M2 API graphs validate; the maintainer's recorded overall result is **tie**. | **Complete** |
| M3 Safe project state | Add isolated project/take provenance and fail-closed accepted-handoff state with concurrency and rollback preservation. | Commit `996f324`; 10D converts 8 nodes with 0 findings; both M3 API graphs validate; retained live goat acceptance/rejection proves rejection did not replace the accepted handoff. | **Complete** |
| M4 Thin controls | Add only evidence-cleared render profiles and execution-time versioned shot-plan read/commit/recovery controls. | Commit `797525c`; 10E converts 16 nodes with 0 findings; M4 API validates; tests cover exact dialogue, stale commits, previous/next/repeat/reset and three prequeued shots. Turbo profiles and sampler duplication remain correctly deferred. | **Complete** |
| M5 Continuity and references | Reuse upstream probes and add only missing project-history continuity and deterministic typed reference-manifest functionality. | Commit `147c761`; 10F converts 20 nodes with 0 findings; M5 API validates; live six-picture/six-entity manifest and focused image-change tests are retained. | **Complete** |
| M6 Delivery | Prove the remaining project-level assembly gap, preserve sources, support only exact lossless stream copy, and fail closed with a transcode plan on mismatch. | Commit `2e58219`; 10G converts 11 nodes with 0 findings; both M6 APIs validate; retained real H.264/AAC output, source hashes, manifest, duration and mismatch refusal prove the contract. | **Complete** |
| M7 Optional continuation | Pass source/dependency/patch/rollback gates, assess Motion Context in an isolated lab, then integrate only components that pass technical and human picture/listening acceptance. | Commits `c25584c`, `b1afec5`, `3c94ae8`; Motion Context 0.3.1 at audited commit `f80e36b`; technical probes and two real clips pass; the maintainer returned picture “Smooth and seamless” and separate `Audio Pass`; the dated backup precedes an optional default-bypassed Gold integration that validates with 0 findings. | **Complete** |

## Fresh validation sweep

All validation below was rerun against the current live `/object_info`, not
copied from earlier milestone notes.

| UI workflow | Converted nodes | Errors | Warnings | Partner/credit route |
| --- | ---: | ---: | ---: | --- |
| Gold (accepted M7 integration) | 37 | 0 | 0 | None |
| Pre-M7 Gold backup | 34 | 0 | 0 | None |
| 10A | 37 | 0 | 0 | None |
| 10B | 38 | 0 | 0 | None |
| 10C | 16 | 0 | 0 | None |
| 10D | 8 | 0 | 0 | None |
| 10E | 16 | 0 | 0 | None |
| 10F | 20 | 0 | 0 | None |
| 10G | 11 | 0 | 0 | None |
| 10H | 42 | 0 | 0 | None |

These fourteen retained API graphs also validate with zero errors, zero warnings,
no partner nodes and no credit spending:

1. M2 benchmark recorder smoke;
2. M2 workflow-10 baseline;
3. M2 Multishot matched first frame;
4. M2 workflow-10 matched first frame;
5. M3 normal handoff;
6. M3 rejection-preserves-handoff;
7. M4 thin controls;
8. M5 continuity/references;
9. M6 accepted fixture take;
10. M6 sequence assembly;
11. M7 Motion Context latent round-trip.
12. M7 acceptance clip 1.
13. M7 acceptance clip 2 with loaded context and in-graph seam probe.
14. M7 two-clip lossless review assembly.

The five current production test modules contain 41 tests spanning M2-M6.
All 41 pass on system Python 3.14, and Ruff reports no findings. The M7 Node
artifact test also passes and proves the two optional groups, retained Gold
spine, accepted links and default-bypassed latent I/O. The separate M7
live-core probe passes on ComfyUI's embedded Python and proves that Motion
Context owns the broader layout patch while Multishot retains the compatible
payload wrapper without stacking.

## M7 acceptance evidence now completed

- Clip 1 prompt `00cc45d9-c6f0-4a28-9703-0b12d523481d` completed with
  latent index 1, a 5.175 s MP4 and separate FLAC.
- Clip 2 prompt `63a213d7-4720-4174-a7bf-56944a4fb99d` completed after
  loading index 1 and executing Motion Context at video context 22/audio
  context 24. It saved latent index 2 and a 4.250 s trimmed MP4.
- Assembly prompt `7c804579-f84d-44d2-abb2-f4adf9644e5d` verified matching
  608 x 352, 24 fps, H.264/AAC contracts and produced a source-preserving
  9.457 s review by stream copy. Its SHA-256 is
  `D12EFE9E97D4C8E6AA208EAAB1441807DF02A2B453F7775752C46057C817DC7F`.
- The delivered audio level step is technically clean at 0.5 dB broadband and
  0.7 dB floor. Waveform continuation is weak at mean correlation 0.410 in
  graph and 0.404 in the independent upstream file probe. the maintainer's decisive
  human verdicts were picture **“Smooth and seamless”** and separate
  **`Audio Pass`**.
- Before integration, the exact protected Gold bytes were retained as
  `10 H3 LONG FORM - BEFORE M7 MOTION CONTEXT - 2026-08-25.json`.
- Commit `3c94ae8` added only the optional load/apply/probe/trim/save path as
  two independently bypassable groups. Both default bypassed, so normal Gold
  performs no hidden Motion Context I/O.
- Integrated Gold and its installed copy are byte-identical at SHA-256
  `3FC4003ABBDDFE601119159B31437687A048A76CA12000E7CD82A9EE4C7BD1D7`.
- Integrated Gold validates with 0 errors/0 warnings, no partner nodes or
  credit spend; geometry reports 0 overlaps/0 group breaches.
- Post-integration latent prompt
  `6eb787ce-54e7-49db-bc9f-416a04fde9c2` completed and reproduced the exact
  `7843A74C...C10E` round-trip hash.

## Completion proof

The shared verification contract forbids treating automation as manual picture
or listening acceptance. Completion is proven because:

1. every M0-M6 implementation/evidence requirement is retained and rechecked;
2. M7 passed dependency, ownership, rollback, live-core and real-output gates;
3. picture and audio received separate explicit human passes;
4. the dated byte-identical backup predates the accepted Gold edit;
5. normal Gold keeps all M7 execution and latent-save nodes bypassed;
6. the accepted active path is retained in reproducible API graphs and the
   integrated topology is asserted independently;
7. integrated Gold, the recovery backup and every M7 API graph validate with
   no findings or paid route;
8. proportional post-integration tests and the latent smoke pass; and
9. the implementation and evidence commits are published and remotely
   verified.

Direct MCP execution of the UI-format Gold is not used as runtime proof because
the converter omits the pre-existing frontend-only `PixaromaSeed.SeedState`.
Prompt `94bcfbe9-68ae-4ea1-8c66-594cb19f808c` stopped at that node before
sampling and wrote no media or Gold latent. This limitation is bounded to the
MCP UI-to-API converter; it neither contradicts the live UI validation nor the
accepted executable M7 API path.
