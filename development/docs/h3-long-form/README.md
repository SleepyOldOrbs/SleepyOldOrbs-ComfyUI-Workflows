# 10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder

This workflow is the deliberately small long-form companion to workflow 09. It does not automate an entire film inside one graph. Instead, it makes one dependable audiovisual shot per run and saves the exact final video frame as the opening keyframe for the next shot. An opt-in **AUTO-CHAIN NEXT RUN** switch can select that saved frame automatically when the next queued prompt begins. A separately accepted M7 route can also carry short video/audio latent context across clips; both of its groups default to bypassed, so the ordinary Gold loop remains unchanged.

Workflow 09 is not an input, dependency or parent graph. The two workflows remain independent, and creating workflow 10 does not overwrite workflow 09.

## The daily loop

1. Load a clean Krea opening frame in the manual opening node.
2. Type or dictate one short action into **SHOT IDEA + DURATION**. Include camera movement, exact dialogue and sound when needed.
3. Leave **USE ENDING FRAME** off for an open continuation, or turn it on and load a planned Krea keyframe when the shot must land at a specific composition.
4. Choose the continuation mode beside the handoff controls:
   - **MANUAL START**: every run uses the image in the manual opening node.
   - **AUTO CHAIN ON**: the first run uses the manual image when the slot is empty; every later queued run starts from the preceding run's stored final frame.
5. Start at 5 seconds and an 864-pixel native long edge. Leave **DELIVERY QUALITY** on **BALANCED — RTX 1.5x HIGH** for the measured everyday compromise, or select **NATIVE** for an exact zero-upscale output.
6. Queue the workflow and review the separately saved MP4 and native `HANDOFF` PNG.

This repeated loop is the long-form method. Manual mode is still the careful review-after-each-shot route. Auto-chain mode is the convenience route when several comprehensively connected but separately saved shots are wanted. Editing and final assembly remain separate.

## Automatic handoff chaining

The orange **AUTO-CHAIN NEXT RUN** control lives in the final handoff group and defaults to off. It drives an opening-frame selector at the start of the graph and a stable per-slot handoff store at the end.

The state is read when a queued job actually begins, not when the Queue button is clicked. ComfyUI executes the queue serially, so several already queued prompts behave like this:

```text
manual opening -> shot 1 -> handoff 1 -> shot 2 -> handoff 2 -> shot 3
```

This execution-time read is what makes repeated queue clicks work. A browser-only update of the image widget would be too late for prompts already waiting in the queue.

The `slot` field defaults to `workflow_10`. Give unrelated films or experiments different short slot names so they do not share continuation state. Invalid filename characters are sanitized. Each slot is stored atomically as a lossless PNG plus a small JSON sidecar under:

```text
ComfyUI/output/H3_Long_Form/_auto_chain/
```

Useful operating rules:

- Turning auto-chain on with an empty slot safely uses the manual opening image for that first run.
- Turning it off makes the current run use the manual image immediately.
- Every successful run refreshes the slot, even while manual mode is selected. Turning auto-chain on later therefore continues from the most recently completed shot in that slot.
- To start a clean sequence, turn auto-chain off, load the new opening image, choose a new slot name if the old sequence must remain independently resumable, and run once.
- Stop or clear an already queued chain if a generated shot is unacceptable. Automatic continuation is intentionally dependable, but it cannot judge whether drift should be propagated.

## Optional M7 motion and audio context

The two grey M7 groups are an advanced, deliberate route for carrying a short tail of joint video/audio latent context into the next clip. They are independent of image AUTO CHAIN and default to bypassed. Leave both bypassed for normal Gold use; no latent is loaded, probed, trimmed or saved in that state.

For an M7 chain:

1. **Clip 1:** leave `M7 APPLY PRIOR LATENT` bypassed, enable `M7 SAVE CURRENT LATENT`, use save index `1`, and leave image AUTO CHAIN off so the normal manual opening image starts the sequence.
2. **Clip 2 and later:** enable both M7 groups and turn image AUTO CHAIN on. Load the preceding latent index and save to the next index so the opening-frame anchor agrees with the retained latent tail.
3. Keep `context frames` at `22`, `audio frames` at `24`, and the native resolution unchanged. Queue one M7 clip at a time and begin each later prompt by restating the preceding ending state.

M7 working latents are stored under:

```text
ComfyUI/output/H3_Gold_Motion_Context/
```

The accepted two-clip review and complete technical record are documented in `docs/h3-production-tools/M7-MOTION-CONTEXT-2026-08-25.md`.

## First-frame versus first-and-last-frame mode

The Pixaroma **Video Prompt** node and the MiniMax H3 conditioning node share the same optional ending-frame gate:

- **Ending frame off**: first-frame-to-video mode. The opening image is anchored at 0.00 seconds and H3 invents a compatible ending.
- **Ending frame on**: first-and-last-frame mode. The first image anchors the opening and the second anchors the end; the prompt writer describes the continuous path between them.

The switch defaults to off. Turning it off causes the optional image gate to emit no image, so downstream nodes genuinely behave as though the ending-frame input were unconnected.

## Choosing a good ending frame

A usable pair shows the same world before and after one physically plausible piece of movement. Keep these stable unless the transition itself explicitly changes them:

- subject identity, anatomy and clothing
- important props and their ownership
- location and broad lighting direction
- camera side, lens family and spatial geography

Good pairs include a seated character becoming standing, a hand moving toward a prop, a vehicle advancing along the same road, or a door changing from closed to open. Two unrelated attractive images are not a transition plan; forcing H3 to reconcile them encourages morphing and identity drift.

## Prompting the Pixaroma director

Keep a five-second shot to one principal action. A useful dictation pattern is:

```text
Character 1 walks to the desk, picks up the red notebook with the right hand and says exactly "I found it." The camera tracks gently left and settles into a medium close shot. Preserve the room, clothing and notebook design. Quiet room tone, footsteps and paper movement; no music.
```

The node automatically sees whether it received only a first frame or both endpoints, chooses the correct H3 prompt formula, and keeps its selected duration synchronized with H3's frame count. Tags remain available in the Pixaroma panel.

The internal prompt writer uses the installed `qwen3vl_8b_fp8_scaled.safetensors`, not the H3 conditioning encoder. It is configured to release itself before the large H3 model runs. The conditioning encoder separately passes through `H3FreeTextEncoder` before sampling to reduce peak VRAM pressure.

## Native detail and delivery quality

There are two deliberately separate controls:

- **NATIVE DETAIL** in the opening group changes the resolution H3 actually generates. This can create real scene detail, but sampling time rises sharply.
- **DELIVERY QUALITY** in the final group runs after H3 and only affects the saved MP4. It can make a cleaner, larger delivery file very quickly, but it cannot recover texture or anatomy that H3 never generated.

The selected delivery profile is mutually exclusive. **NATIVE** is a true bypass: no inactive RTX branch executes. **BALANCED** runs RTX Video Super Resolution once at 1.5x / HIGH. **LARGE** runs RTX once at 2x / HIGH. HIGH was retained instead of aggressive sharpening because the controlled goat crops looked natural and conservative; sharpened Lanczos made edges crisper but also emphasized halos and jaggies. Conventional `.pth` and SeedVR2 upscalers remain outside this everyday path: the former can invent conspicuous texture, while SeedVR2 is the quality-master option when a much longer finishing time is acceptable.

Most importantly, auto-chain and visible `HANDOFF` files are connected directly to the native VAE decode. RTX finishing exists only on the MP4 branch, so repeated shots never feed upscaler-created texture back into H3.

### Measured 5-second goat comparison

All native rows used the same two keyframes, prompt, seed `2408241001`, 124 frames, 20 steps, `res_multistep` / `simple`, model and VAEs on the RTX 5080 16 GB installation. These are single-run measurements, not promises for every prompt:

| Profile | H3 native size | Saved size | Measured time | Change from 864 native | Use |
| --- | ---: | ---: | ---: | ---: | --- |
| Native control | 864 x 480 | 864 x 480 | 137.499 s | baseline | Exact H3 pixels and fastest file |
| Gold balanced | 864 x 480 | 1296 x 720 | about 139.911 s | +1.8% | Default: RTX 1.5x HIGH added 2.412 s |
| Higher native | 960 x 544 | 960 x 544 before optional finish | 193.119 s | +40.5% | More genuine fur/horn detail when the extra minute is justified |
| High native | 1056 x 608 | 1056 x 608 before optional finish | 274.512 s | +99.6% | Deliberate high-quality render, almost twice the time |

RTX 2x HIGH produced 1728 x 960 from an 864 x 480 goat clip in 2.384 seconds during the finishing benchmark. It is useful for a larger delivery canvas, not as evidence of twice the true detail. The current default therefore stays at 864 native plus balanced 1.5x finishing; 960 and 1056 are exposed as explicit native-detail choices rather than silently slowing every shot.

The exact 20-step native comparison graphs are retained in `tests/h3_quality_benchmark_native_864x480_api.json`, `tests/h3_quality_benchmark_native_960x544_api.json` and `tests/h3_quality_benchmark_native_1056x608_api.json`. They hold the model, keyframes, prompt, seed, duration, sampler and scheduler constant and change only native dimensions.

### Turbo investigation

The installed `minimax_h3_turbo_v4_step600_pruned_comfyui.safetensors` LoRA was also tested at 960 x 544 with Euler / beta while every scene input remained matched:

- 8 steps completed in 94.485 seconds. The five-frame goat strip retained coherent horns, face, four-legged anatomy, coat and endpoint composition.
- 12 steps, the more conservative dialogue-oriented setting, completed in 130.330 seconds and was likewise coherent.

Those results are promising: 8-step Turbo generated more native pixels in 31.3% less time than the 864 x 480 base control, while 12-step Turbo was 5.2% faster. Turbo is nevertheless not wired into this simple Gold workflow yet. One goat shot does not prove dependable speech, complex human motion or long auto-chains, and exposing it correctly would require a coupled model/steps/sampler control rather than a misleading LoRA-only toggle. The proven graphs are retained as `tests/h3_quality_benchmark_turbo_960x544_8step_api.json` and `tests/h3_quality_benchmark_turbo_960x544_12step_api.json` for a later focused acceptance round.

## Drift control

The saved handoff frame preserves motion continuity, but every generative continuation can accumulate small errors. Do not continue from a visibly flawed frame. Instead:

1. return to the original character, prop and location reference sheets;
2. generate a clean Krea keyframe for the next important beat;
3. use that clean image as an enabled ending frame for the preceding shot, or as the next shot's opening frame;
4. resume the handoff loop from the corrected state.

This periodic keyframe reset is more reliable than asking a long automatic chain to remember identities indefinitely.

## Render defaults

- Diffusion model: `H3/minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- H3 text encoder: `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`
- Video/audio VAEs: MiniMax H3 video FP16 and audio FP32
- Sampler: `res_multistep`
- Scheduler: `simple`
- Steps: 20
- CFG: 1
- Duration: 5 seconds by default
- Native size: 864-pixel long edge by default, preserving the opening frame's ratio; 960 and 1056 are measured higher-detail choices
- Delivery default: RTX 1.5x HIGH, producing 1296 x 720 from the usual 864 x 480 landscape render
- Output: 24 fps MP4 with H.264 video and AAC audio, plus one native-resolution PNG handoff frame
- M7 default: both latent-context groups bypassed; normal Gold performs no M7 latent I/O

## Output locations

Ordinary workflow runs save under:

```text
ComfyUI/output/H3_Long_Form/<date>/
```

Each accepted shot has an MP4 beginning with `Shot_` and a matching continuation PNG beginning with `HANDOFF_`.

Auto-chain additionally maintains one stable internal PNG and JSON sidecar per slot under `_auto_chain`. These are working state, not replacements for the timestamped visible recovery copies.

## Validation record - 24 August 2026

The quality-profile graph contains 34 nodes, 42 links and four Pixaroma groups. The generator performs structural, native-handoff and geometry audits before writing either active copy. Live ComfyUI validation on 24 August 2026 converted all 34 nodes and reported zero errors, zero warnings and no paid partner nodes.

Three local regression checks are retained in `tests/`:

1. **First-and-last prompt mode** (`h3_long_form_prompt_smoke_api.json`): the Pixaroma optional image was present, so Video Prompt selected `first_last`, emitted the exact 0.00/5.00-second alignment line, returned all three H3 sections, ended with `non_diegetic_music: N/A`, and selected 124 frames / 5.1667 seconds. Prompt ID: `e1138484-0ad8-4d21-a37c-666e23b0f7ce`; measured execution: 14.835 seconds.
2. **First-frame-only switch-off** (`h3_long_form_first_only_prompt_smoke_api.json`): an ending image was connected through `H3OptionalImage` with its switch off. The downstream prompt writer correctly received no ending image, selected `first_frame`, emitted the required Picture 1 opening instruction, made no reference to Picture 2, and retained the 124-frame duration. Prompt ID: `0a515bd2-1d1d-4ef0-8b07-71f47ef14d33`; measured execution: 10.268 seconds.
3. **Integrated first-and-last video, audio, balanced RTX and native handoff** (`h3_long_form_render_smoke_api.json`): 608 x 352 native, 124 frames and six steps completed in 30.984 seconds. It produced a 912 x 528, 24 fps H.264/AAC MP4 while the recovery handoff remained 608 x 352. This proves the quality node can coexist with the just-completed H3 render and that its output is not fed into continuation. MP4 SHA-256: `886054AC035A36F6D0E47FBD2439181C252B6BF3619C6DB3C3BD3E7153D44E98`. Handoff SHA-256: `12D193475A472D70ACB01DB9CFC4252A0ADFE5CF921DBBE527751C9928E79C5B`. Prompt ID: `821c8710-1406-4831-a3a0-8f5d65531f5b`.

Three fast cross-run checks are also retained:

4. **Store the prior ending** (`h3_auto_chain_store_smoke_api.json`): wrote the known ending frame atomically to slot `workflow_10_smoke`. Prompt ID: `8cf63a20-6030-4a50-a8bb-18d3269dd94f`.
5. **AUTO selects stored state** (`h3_auto_chain_load_smoke_api.json`): supplied a deliberately different manual image while auto-chain was on. The output matched the stored ending at pixel SHA-256 `a995f36b37004b81db787b84e9b3e1802995d76c00e16c03b3e93bd20aee6fe8` and differed from the manual image. Prompt ID: `f43b093b-2290-4d5a-a037-6980a2c4ad37`.
6. **OFF selects manual state** (`h3_auto_chain_manual_smoke_api.json`): with the same stored ending present, manual mode output matched the manual source at pixel SHA-256 `13c6eef647e762b606f103b77d19a17ea1579e3ae9ac9733163d9c1dcf9ec729`. Prompt ID: `82266b18-dae2-4414-be3e-09dd832d1e14`.

Two delivery-branch checks are retained as well:

7. **Native is a true bypass** (`h3_quality_native_smoke_api.json`): completed in 0.055 seconds, retained 864 x 480 dimensions and matched the source pixels exactly. Prompt ID: `14c4deb9-32c0-4d93-94b0-b2bec7dfe311`.
8. **Balanced invokes only RTX 1.5x** (`h3_quality_balanced_smoke_api.json`): completed in 0.700 seconds for one still frame and produced 1296 x 720. Prompt ID: `4f25aa8d-9bf9-4af0-8ee5-dad3001a6dfa`.

Visual inspection of the first, middle, last and handoff frames found one coherent brown-and-black goat with stable horn shape, coat markings, four-legged anatomy, hillside location and lighting. The motion travelled cleanly between the two supplied keyframes, and the handoff image visually matched the final frame.

## M7 validation record - 25 August 2026

After a matched two-clip FL2VA run, the maintainer judged the picture join **“Smooth and seamless”** and separately returned **`Audio Pass`**. The accepted optional route was then integrated behind two default-bypassed groups. Integrated Gold converts 37 nodes with zero errors, zero warnings and no paid partner route; its SHA-256 is `3FC4003ABBDDFE601119159B31437687A048A76CA12000E7CD82A9EE4C7BD1D7`.

The integration artifact test passes, all 41 retained M2-M6 Python tests pass, Ruff reports no findings, the live-core patch-ownership probe passes, and the post-integration latent round-trip remains byte-identical at SHA-256 `7843A74CE144513E0681F6853B31AA5A6D641B1FE0000633F66510522A9BC10E`. The complete M0-M7 result is recorded in `docs/h3-production-tools/M0-M7-COMPLETION-AUDIT-2026-08-25.md`.

## Recovery

The independently openable initial checkpoint is stored at:

```text
workflows/Codex MCP Demos/Backups/10 H3 Long Form/10 H3 LONG FORM - INITIAL VALIDATED - 2026-08-24.json
```

The immediately pre-auto-chain checkpoint is stored at:

```text
workflows/Codex MCP Demos/Backups/10 H3 Long Form/10 H3 LONG FORM - BEFORE AUTO CHAIN - 2026-08-24.json
```

The immediately pre-quality-profile checkpoint, including the already validated auto-chain feature, is stored at:

```text
workflows/Codex MCP Demos/Backups/10 H3 Long Form/10 H3 LONG FORM - BEFORE QUALITY PROFILES - 2026-08-24.json
```

The live canvas also contained the maintainer's then-current opening image, random seed and `workflow_test` slot. That recoverable user-input state is preserved separately rather than being mistaken for the reproducible teaching defaults:

```text
workflows/Codex MCP Demos/Backups/10 H3 Long Form/10 H3 LONG FORM - BEFORE QUALITY PROFILES - LIVE USER SETTINGS - 2026-08-24.json
```

The exact immediately pre-M7 Gold is retained at:

```text
workflows/Codex MCP Demos/Backups/10 H3 Long Form/10 H3 LONG FORM - BEFORE M7 MOTION CONTEXT - 2026-08-25.json
```

It is byte-identical to the protected 34-node baseline at SHA-256 `2CD91CFBE51F3D5BD66F43CB2D34417894D18AD46B18AE0360A24B672013D037`.

The reusable helper package is `custom_nodes/ComfyUI-Codex-H3-Continuation/`; install or refresh it with `tools/install_h3_continuation_node.ps1`, then restart ComfyUI. The canonical `tools/build_h3_long_form.mjs` builder writes the dependable image/prompt/sampler/delivery spine and its retained API smoke graphs, then invokes the separately guarded `tools/integrate_h3_m7_gold.mjs` builder to reapply the accepted optional layer from the exact dated pre-M7 backup. This two-stage rebuild prevents routine regeneration from silently removing M7 while retaining an independently recoverable baseline. It never writes workflow 09. Before a future change, create another dated checkpoint rather than replacing a validated copy.
