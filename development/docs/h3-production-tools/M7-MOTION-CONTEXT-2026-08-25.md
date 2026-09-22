# M7 - Optional Advanced Continuation

Date: 25 August 2026

Status: **complete; technical, picture, audio and selective Gold-integration
gates passed**

## Outcome so far

`ComfyUI-H3-Motion-Context` 0.3.1 is installed only as an optional lab
engine at upstream commit `f80e36bc1d7887a143b12e6645313fd6b9cd2aee`.
The isolated `10H H3 Motion Context Lab.json` checkpoint is openable and
validated. A matched two-clip FL2VA review completed through the real Motion
Context, seam-trim and lossless assembly paths. the maintainer judged the picture join
“Smooth and seamless” and separately returned `Audio Pass`. The accepted
optional path is now integrated into Gold behind two default-bypassed groups.

The upstream project is GPL-3.0, requires Python 3.10 or newer, adds no Python
package dependencies, and registers five classes. Its two runtime patches are
not installed at ComfyUI startup; they are requested on the first execution of
the main Motion Context node and self-test before committing.

## Compatibility and ownership result

The installed H3 Multishot 2.6.5 and Motion Context 0.3.1 have explicit,
compatible ownership hand-offs:

- Multishot owns `MiniMaxH3.extra_conds` first and sets Motion Context's shared
  `_h3_motion_context_payload_patch` marker. Motion Context recognises the
  marker, accepts the existing superset wrapper and does not stack another
  wrapper.
- Multishot detects the `ComfyUI-H3-Motion-Context` folder before applying its
  narrower interior-keyframe layout patch and stands down. Motion Context then
  owns `PackedLayout.__init__` and supplies the broader keyframe/reference/audio
  timeline handling.
- `tests/h3_m7_live_patch_probe.py` imported the installed sources in a
  disposable process against this exact ComfyUI core. The live-core layout
  self-test passed, no payload wrapper was stacked, and Multishot returned its
  explicit `standing down` status. No model was loaded and no media was
  written.

The source files used for the ownership check had these installed SHA-256
hashes:

| File | SHA-256 |
| --- | --- |
| Motion Context `patch_layout.py` | `A489FB5D9BDF3F67FF6B847BAAB04CE2D4FFBA62F7095ED1E262A11BDEDE210B` |
| Motion Context `patch_payload.py` | `0DA2D1D6D718A6AA8349C52CB530EAA15CDB5D771B984D8678FAAF00B035C4BF` |
| Multishot `h3_interior_patch.py` | `91FBAFB062402C83C9536B4776ADAA075EE3038B875BA89180460708ED3B9737` |
| Multishot `h3_avbank_probe.py` | `E66075474DAC2C942D8506A561D62686D1A25B7E27A3291ED84F18A350E68E64` |

## Installation and rollback boundary

Installed path:

```text
<ComfyUI>\custom_nodes\ComfyUI-H3-Motion-Context
```

The folder is a clean Git checkout whose `origin` is the official upstream
repository and whose `HEAD` is the audited commit above. The queue was empty
and Gold's hash matched the protected baseline before installation. ComfyUI was
rebooted only through Manager, from PID 10212 to PID 18356.

Recoverable rollback procedure, if the lab fails human acceptance:

1. Confirm the queue is empty and the package checkout is still clean at the
   audited commit.
2. Move the complete package folder outside `ComfyUI/custom_nodes`; merely
   renaming it inside `custom_nodes` does not disable loading.
3. Reboot through `POST /manager/reboot` with JSON body `{}`.
4. Confirm the five `MiniMaxH3MotionContext*` classes are absent and Multishot
   again owns its normal layout path.

No rollback has been performed because all current technical gates pass.

## Upstream and lab checkpoint

The untouched upstream example is retained at:

```text
workflows/Codex MCP Demos/Backups/10H H3 Motion Context/
  MiniMax H3 - fl2va - ref2va - UPSTREAM 0.3.1 - 2026-08-25.json
```

Its SHA-256 is
`36712D093ED0FC750EA9DB38DE62A5F5405562BA4F2C22C74EE31D1E6A364D83`.
`tools/build_h3_10h_motion_context_lab.mjs` verifies that hash and the protected
Gold hash before producing the active 10H copy. Its adaptations are limited to:

- the installed FL2VA, Ref2VA, Qwen, video-VAE and audio-VAE choices;
- current `PrimitiveStringMultiline` and `FastGroupsBypasserV2` class names;
- disabling the optional video extractor with its bypassed video loader;
- explicit Spectrum/Turbo bypass labels for the acceptance run;
- five layout corrections and provenance notes.

10H SHA-256:
`388F48B665D46BBA6C4EC622F8716745BAA04EE4B91102B31E6124C522F67B42`.

## Verification record

- Upstream deterministic checks: `_mock_harness.py`, `_node_smoke_test.py`,
  `_payload_gate_test.py` and `_probe_node_test.py` passed. The level-step and
  freeze-detection self-tests also passed.
- Live listener: ComfyUI 0.33.0-45 at `127.0.0.1:8188`, PID 18356.
- Live registry: 2,421 classes; all five Motion Context classes present.
- 10H validation: **valid, 0 errors, 0 warnings, 42 converted nodes, no partner
  nodes, no credit spend**.
- Geometry guard: **0 node overlaps and 0 group-boundary breaches**.
- Retained API smoke: **valid, 0 errors, 0 warnings, no partner nodes, no
  credit spend**.
- Smoke prompt `dc8ca473-7d3f-4796-b4db-9644f034690c` completed in 0.02
  seconds. It saved, loaded and resaved a tiny synthetic joint AV latent.
  `source_00001.safetensors` and `roundtrip_00001.safetensors` were both 5,320
  bytes with identical SHA-256
  `7843A74CE144513E0681F6853B31AA5A6D641B1FE0000633F66510522A9BC10E`.
  Their `video` and `audio` tensors were exactly equal.
- Pre-integration Gold revalidation: **valid, 0 errors, 0 warnings, 34
  converted nodes, no partner nodes, no credit spend**.
- Pre-integration Gold SHA-256:
  `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.

## Two-clip acceptance render

The retained API graphs make the acceptance run reproducible without relying
on unsaved browser state:

- `tests/h3_m7_acceptance_clip1_api.json` generated the first 608 x 352,
  124-frame FL2VA clip with Motion Context bypassed and saved latent index 1.
  Prompt `00cc45d9-c6f0-4a28-9703-0b12d523481d` completed successfully.
- `tests/h3_m7_acceptance_clip2_api.json` loaded latent index 1, ran the main
  Motion Context node with video context 22 and audio context 24, saved latent
  index 2, and delivered the context-trimmed second clip. Prompt
  `63a213d7-4720-4174-a7bf-56944a4fb99d` completed successfully.
- Spectrum and Turbo were absent from both executable graphs. Both graphs
  validate with 0 errors, 0 warnings, no partner nodes and no credit spend.
- `tests/h3_m7_acceptance_review_assembly_api.json` losslessly assembled the
  two compatible H.264/AAC sources. Prompt
  `7c804579-f84d-44d2-abb2-f4adf9644e5d` completed as assembly 0001.

The immutable evidence files are:

| Evidence | Bytes | SHA-256 |
| --- | ---: | --- |
| Clip 1 MP4 | 1,417,572 | `ECE49CE5AF0B8254E75B8C25FBBDA77B92880C52B5C0726B5351A461DF4A40F0` |
| Clip 1 FLAC | 290,941 | `B736352F83CD97F74C53E882EC1DAB6633C549AA3A92F4897A743F91213C0B4A` |
| Latent index 1 | 3,022,680 | `AFADF400ECB0A7748E8AEEE0AF2C98CBB32422185F27AC92E89A7F9A880D5B17` |
| Clip 2 trimmed MP4 | 931,011 | `57B48F420ACAC9900B152FA72E22FB8D79A05D3FDDE911DBD04FD517218FF600` |
| Clip 2 untrimmed FLAC | 289,799 | `705C22E38608CC5BF6514A691F31032AF5C437BFE823F23C411B7F08CEF6630E` |
| Latent index 2 | 3,022,680 | `E08D94BF9D7E953165B6A349DB91C40363220BCA4D9940CC2054FC1EE3B21AE9` |
| Two-clip review MP4 | 2,340,649 | `D12EFE9E97D4C8E6AA208EAAB1441807DF02A2B453F7775752C46057C817DC7F` |

The assembler verified identical 608 x 352, 24 fps, H.264 High/yuv420p and
stereo AAC/32 kHz stream contracts before stream-copying. Its manifest records
5.175 s plus 4.250 s of source material, 9.425 s expected and 9.457 s in the
assembled container, within the declared 0.1885 s tolerance. Both source
hashes were rechecked during assembly.

The in-graph seam probe reported a clean delivered level step: 0.5 dB
broadband and 0.7 dB floor over 500 ms either side of the cut. Its waveform
continuation correlation was weak (mean 0.410; 5 of 35 windows above 0.6).
The retained upstream file probe independently reported mean correlation
0.404 with 4 of 35 windows above 0.6. This means the regenerated head imitates
rather than phase-tracks the earlier tail. It is a diagnostic warning, not a
human listening verdict. the maintainer's separate listening verdict was `Audio Pass`.

## Human verdict and selective Gold integration

The two required human gates are explicit:

- picture: **Pass** — “Smooth and seamless”;
- audio: **Pass**.

Before Gold changed, its exact 41,746-byte baseline was copied to:

```text
workflows/Codex MCP Demos/Backups/10 H3 Long Form/
  10 H3 LONG FORM - BEFORE M7 MOTION CONTEXT - 2026-08-25.json
```

The backup retains SHA-256
`2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.
Commit `3c94ae8` then integrated only the accepted Motion Context load, apply,
seam-probe, synchronized trim and latent-save path. It did not replace Gold's
prompt writer, model loaders, sampler, delivery finishing, MP4 output, native
handoff or existing image AUTO CHAIN.

Two standard groups keep the feature explicit:

1. `M7 APPLY PRIOR LATENT` contains load/apply/probe/trim and remains bypassed
   for the first clip;
2. `M7 SAVE CURRENT LATENT` contains saving/status and is enabled only while
   producing an M7 chain.

Both groups default to bypassed, so normal Gold performs no Motion Context
load, probe, trim or latent write. The deterministic
`tools/integrate_h3_m7_gold.mjs` builder refuses to overwrite a Gold file that
is neither the protected baseline nor its exact generated result. The artifact
test `tests/h3_m7_gold_integration.test.mjs` proves all original node IDs remain,
the accepted links are present, and every M7 execution node defaults bypassed.

Post-integration proof:

- integrated Gold SHA-256:
  `3FC4003ABBDDFE601119159B31437687A048A76CA12000E7CD82A9EE4C7BD1D7`;
- repository and installed workflow copies are byte-identical at 54,878 bytes;
- integrated Gold: **valid, 0 errors, 0 warnings, 37 converted nodes, no
  partner nodes and no credit spend**;
- pre-M7 backup: **valid, 0 errors, 0 warnings, 34 converted nodes**;
- geometry: **0 node overlaps, 0 group-boundary breaches**;
- Node artifact test: **1 passed**;
- M2-M6 Python suite: **41 passed**; Ruff: **passed**;
- live-core patch ownership probe: **passed**, with no wrapper stacking;
- post-integration latent prompt
  `6eb787ce-54e7-49db-bc9f-416a04fde9c2`: **completed**; source and roundtrip
  remain byte-identical at SHA-256
  `7843A74CE144513E0681F6853B31AA5A6D641B1FE0000633F66510522A9BC10E`.

One direct MCP attempt to execute the UI-format Gold stopped before sampling at
the pre-existing frontend-only `PixaromaSeed` node because the UI-to-API
converter omitted its hidden `SeedState`. Prompt
`94bcfbe9-68ae-4ea1-8c66-594cb19f808c` wrote no media or Gold latent. This is
not an M7 node or browser-workflow failure: the UI validator passes, the
accepted executable API path completed, and the integration topology/default
bypass behavior is independently asserted. The interactive ComfyUI canvas
remains the supported route for the Pixaroma seed control.

ComfyUI core 0.33.0 and Pixaroma 1.4.120 have newer versions available. They
remain deliberately frozen during this milestone because the audited package
targets the installed core contract and updating either would broaden the
change under test.

## Accepted Gold usage

The completed review copy remains retained as acceptance evidence; its join is
at about 5.18 seconds:

```text
<ComfyUI>\output\H3_Projects\
  h3-m7-motion-context-acceptance\assemblies\
  motion-context-two-clip-review\assembly-0001\
  motion-context-two-clip-review.mp4
```

Normal Gold: leave both M7 groups bypassed.

For an M7 chain:

1. Clip 1: leave `APPLY PRIOR LATENT` bypassed, enable `SAVE CURRENT LATENT`,
   use save index 1 and start from the normal manual image with AUTO CHAIN off.
2. Clip 2 and later: enable both M7 groups and turn AUTO CHAIN on so Gold's
   first-frame anchor agrees with the latent tail. Load the preceding index and
   save the new index.
3. Keep context 22/audio 24 and resolution unchanged. Queue one M7 clip at a
   time, and begin each later prompt by restating the preceding ending state.

## Acceptance state

| Gate | State |
| --- | --- |
| Dependency/source review | Passed |
| Patch ownership | Passed |
| Reversible installation | Passed |
| Upstream deterministic tests | Passed |
| Live-core self-test | Passed |
| Openable isolated checkpoint | Passed |
| Live API smoke | Passed |
| Real two-clip FL2VA execution | Passed |
| Lossless review assembly/source preservation | Passed |
| Automated delivered level-step check | Passed |
| Automated waveform continuation check | Warning: weak correlation |
| Pre-integration Gold backup/revalidation | Passed |
| Two-clip visual continuity | **Passed — “Smooth and seamless”** |
| Two-clip audio continuity | **Passed — `Audio Pass`** |
| Selective Gold integration | **Passed — commit `3c94ae8`** |
| Integrated Gold validation/topology/geometry | Passed |
| Post-integration latent smoke | Passed |
