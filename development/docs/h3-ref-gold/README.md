# 09 GOLD STANDARD - MiniMax H3 Ref2VA Director

This is the compact H3 companion to the Krea 2 character-sheet workflow. It is designed for turning one or more character, object, vehicle, food, prop or location reference images into a short MiniMax H3 video without recreating the very large all-purpose Gold graph.

The workflow is deliberately a director's desk followed by one dependable render path. Blabbermouth is not coupled to ComfyUI: dictate into whichever purple text box is appropriate, exactly as if you had typed there.

## The five-step daily route

1. Load consecutive reference pictures from left to right. Slots 1-3 start enabled; slots 4-6 start disabled.
2. Describe the scene/action, then make the reference manifest agree with the enabled picture slots.
3. Add dialogue, camera and sound/music instructions. Quoted dialogue is treated as exact wording.
4. Choose 5, 10 or 15 seconds and a size. Start with 5 seconds at 864 x 480.
5. Leave **AI PROMPT MODE** on for vague director notes, or turn it off to use the editable full H3 prompt. Read **FINAL H3 PROMPT** before queuing.

## Reference contract

MiniMax numbers references in the order they reach its reference input. Therefore enabled slots must be consecutive:

- valid: 1, or 1-2, or 1-3, through 1-6
- invalid: 1 and 3 with slot 2 disabled

The manifest should say what each picture contributes. Several pictures may jointly define one subject, as in the supplied goat example. References can represent people, animals, vehicles, buildings, props, food, environments or other reusable visual subjects; nothing in the graph forces human anatomy.

## Director controls

- **Scene + Action + Reference Manifest**: the main idea and the identity map between `Picture N` and `Subject N`.
- **Dialogue**: exact lines and speaker ownership. Put complete spoken wording in quotation marks here rather than repeating it in the scene box.
- **Camera Direction**: framing, movement, pacing and cuts in ordinary language.
- **Sound + Music**: physical sound first, then audience-only music. Use `N/A` or say no music when appropriate.
- **Duration**: 5, 10 and 15 second Pixaroma choices. The selected duration is also injected into the AI director brief.
- **Size**: Pixaroma sizes, with 864 x 480 as the Gold starting point.
- **AI Prompt Mode**: a lazy Pixaroma switch. When OFF, the unselected AI branch is not executed; when ON, the local Qwen director expands the four boxes into H3's six-section full-reference format.

All purple Pixaroma prompt boxes retain the normal Tags button. This allows `@tag`, `#list` and category-based variation alongside dictation.

## Prompt and VRAM choreography

The AI director uses the installed `qwen3vl_8b_fp8_scaled.safetensors`. It is deterministic by default and explicitly releases its model before H3 starts. The H3 text encoder then passes through `H3FreeTextEncoder`, which releases that large conditioning encoder before sampling. This sequencing is intentional for the 16 GB RTX 5080.

The final prompt monitor remains important. The measured 8B prompt test produced all six sections, stable reference labels, real timestamps, correct retention markers and the exact `<d>[English] ...</d>` spoken line. A small local model may still echo that line in `summary`; if it does, remove the duplicate in the manual prompt or use AI OFF. The dialogue in `detailed_description` is the authoritative spoken event.

## Render defaults

- H3 model: `H3/minimax_h3_ref2va_pruned_int8_convrot.safetensors`
- H3 text encoder: `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`
- Video/audio VAEs: MiniMax H3 video FP16 and audio FP32
- Sampler: `res_multistep`
- Scheduler: `simple`
- Steps: 20
- CFG: 1
- Reference image size: `match`
- Output: 24 fps MP4 with H.264 video and AAC audio

## Deliberately excluded from version 1

The first version does not include multi-shot automation, H3 continuation, Turbo LoRA, motion/video/audio references, lip-sync replacement, selective repair, upscale, automatic casting or programmatic Blabbermouth integration. Those are sensible future modules, but none are required to make this reference-to-video path dependable.

## Validation record - 24 August 2026

The visual workflow contains 41 nodes, 44 links and five Pixaroma groups. Automated layout checks found zero node overlaps and zero group-boundary breaches. Live ComfyUI validation reported zero errors, zero warnings and no paid partner nodes.

Three measured local tests were retained in `tests/`:

1. **Prompt director** (`h3_ref_gold_ai_prompt_smoke_api.json`): the installed 8B Qwen produced the six Ref2VA sections and correct detailed-dialogue markup in 16.55 seconds. Final prompt ID: `ecdf1f13-8d61-41b8-846f-7b3a13d6dc0f`.
2. **Fast render smoke** (`h3_ref_gold_smoke_api.json`): 608 x 352, 124 frames, six steps, completed in 18.46 seconds. Output SHA-256: `3F84F7DBF57CE192B68E379DA998F604EBB0F630A190A277C2601D31C57A1DD3`.
3. **Gold acceptance render** (`h3_ref_gold_acceptance_api.json`): 864 x 480, 124 frames, 20 steps, completed in 156.342 seconds. It produced a 5.175-second H.264/AAC MP4 with non-silent stereo audio (mean -29.4 dB, peak -7.3 dB). Output SHA-256: `48466F5729D29221F98DE66C43648BC305E937048B7FD130DEC0C65B57D60894`. Prompt ID: `2173c8a9-3b43-40a9-b8e1-8b9273cce408`.

Frame inspection found the supplied goat identity, coat, horn shape and four-legged anatomy coherent at the beginning, middle and end of the Gold render. The final human viewing/listening verdict remains a separate acceptance gate.

One brief server reconnect followed the first small smoke run. No crash log survived, the server returned automatically, and it did not recur during the prompt-director or full Gold acceptance runs. Preserve this observation if the behaviour returns.

## Recovery and rebuilding

The initial validated graph is stored as an openable JSON checkpoint under `workflows/Codex MCP Demos/Backups/09 H3 Ref Gold/`. The generator is `tools/build_h3_ref_gold.mjs`; it writes the visual workflow to both the repository and the active ComfyUI workflow folder, then writes the three API test graphs to `tests/`.

Before changing a future stage, make a new dated checkpoint rather than overwriting the initial validated file. Never treat a successful JSON parse as the only proof: rebuild, run the geometry audit, validate against live ComfyUI, and perform a proportional render test.
