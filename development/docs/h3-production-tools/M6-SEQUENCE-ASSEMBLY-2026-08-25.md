# M6 Sequence Assembly — 2026-08-25

Status: **M6 complete in the separate delivery lab.** Matching accepted/manual
sources assembled by FFmpeg stream copy; a deliberately mismatched source pair
returned an explicit transcode plan and wrote no media. Gold was not modified.

## Residual gap audit

- Installed H3 Multishot 2.6.5 already owns within-run assembly. `H3ConcatAV`
  concatenates two in-memory IMAGE/AUDIO stages, optionally matches texture,
  and performs a 40 ms audio crossfade.
- Its streaming master stages decoded shots from one active sampler chain and
  emits that chain's encoded master. It does not read Codex project take
  records, accepted/rejected state, branches, external output files, or a
  project delivery order.
- `CodexH3SequenceAssembler` therefore operates only at the file/project seam.
  It neither replaces nor patches either upstream implementation.

## Implemented

- Explicit ordered `sources_json` accepts either:
  - an accepted project `take_id` plus recorded `media_index`; or
  - a manual/external file path beneath the active ComfyUI output directory.
- Accepted take records must exist in `takes/takes.jsonl`, have state
  `accepted`, and retain their recorded media SHA-256. Rejected takes fail
  closed.
- Every source is probed with bundled PyAV. The compatibility contract includes
  container/extension; video codec, tag, profile, pixel format, dimensions,
  frame rate and time base; plus optional audio codec, tag, profile, sample
  format, rate, channels, layout and time base.
- `inspect only` performs all resolution, hash, order, duration, and stream
  checks but creates no assembly directory or media.
- `assemble lossless` reserves a new immutable `assembly-NNNN` directory and
  runs FFmpeg's concat demuxer with `-c copy` only when every contract field
  matches. The source hashes are checked again before the output is committed.
- Mismatches return `ASSEMBLY REFUSED`, no output/manifest path, the exact
  differing fields, and a declared libx264/yuv420p/AAC normalizing target. The
  node never silently transcodes.
- A successful atomic manifest records ordered source paths/hashes/sizes,
  source types and take IDs, durations, complete stream contracts, operation,
  redacted reproducible FFmpeg arguments, output duration/path/hash/size, and
  the accepted tolerance.
- Added `tools/prepare_h3_m6_fixtures.ps1`, deterministic
  `tools/build_h3_10g_sequence_assembly_lab.mjs`, separate
  `10G H3 Sequence Assembly Lab.json`, accepted-take prep API, and retained M6
  assembly smoke API.

## Automated checks

- Five M6 tests use real 0.5-second H.264/AAC FFmpeg clips.
- Coverage proves matching stream-copy assembly, red-then-blue source order,
  output/source duration agreement, output hashing, byte-for-byte source
  preservation, mismatch refusal, concrete transcode planning, inspect-only
  non-mutation, accepted/rejected take enforcement, negative media-index
  rejection, duplicate rejection, and output-root path containment.
- Final focused M2–M6 suite: **41 passed** on system Python 3.14.7.
- Ruff, Python compilation, builder syntax and geometry guard, Gold hash guard,
  and deterministic workflow building passed.

## Live checks

- Three deterministic fixtures were created beneath `output/H3_M6_Fixtures`:
  matching 64 x 48 red/blue clips plus one 48 x 32 mismatch clip. They contain
  generated colour frames and silent stereo audio only.
- The queue was empty before both deployments. Final ComfyUI returned on PID
  10212 with 2,416 classes and all twelve production classes.
- `10G` validation: **valid, 0 errors, 0 warnings, 11 converted nodes, no
  partner nodes, no credit spend**.
- Accepted-take prep API: **valid, 0 errors, 0 warnings, no partner nodes, no
  credit spend**. Prompt `d9b5e8ef-783c-474c-967b-64d092f81fd5` recorded
  `fixture/accepted-red/main/take-0001` with the red fixture's SHA-256.
- Final retained smoke prompt `4eb07bb2-20c7-4957-a28e-661b4f070cd3`
  completed without error:
  - accepted red take plus manual blue segment produced `assembly-0002` using
    `ffmpeg_concat_stream_copy`;
  - output duration was 1.032 seconds for 1.000 seconds of declared sources;
  - output SHA-256 was
    `D14C86425B4E2EB212BC9E61A652F4FEEBF240090F6D84E460CD77B57BEBEB1B`;
  - decoding found 24 frames, with a red first frame and blue last frame;
  - both source hashes remained exactly unchanged;
  - the mismatch lane named only `video.width` and `video.height`, returned the
    64 x 48 H.264/AAC target plan, and wrote no media.
- Gold revalidation remained **valid, 0 errors, 0 warnings, 34 converted nodes,
  no partner nodes, no credit spend**.

## Integrity and boundaries

- Protected Gold SHA-256 remained
  `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.
- Source and live `10G` SHA-256 matched at
  `11AFB7D4705F501D4A2F5D6254F1BEE2F423880CAAA281D3FF460D93D500757B`.
- ComfyUI core, Pixaroma, H3 Multishot, Motion Context, and the Codex H3
  Continuation package were not modified, updated, installed, or patched.
- No model generation, network API, partner node, or Comfy credit was used.
- The tiny generated fixtures and immutable live assembly evidence remain in
  ComfyUI output; no user media was changed or deleted.

M7 is next: a bounded Motion Context compatibility assessment with source,
dependency, patch-ownership, rollback, and benchmark gates before any optional
lab installation or Gold proposal.
