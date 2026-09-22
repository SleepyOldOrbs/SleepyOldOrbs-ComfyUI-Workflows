const { requireComfyRoot } = require("./local_paths.cjs");
const fs = require('fs');
const path = require('path');

const comfy = requireComfyRoot();
const demos = path.join(comfy, 'user', 'default', 'workflows', 'Codex MCP Demos');
const goldPath = path.join(demos, '07 GOLD STANDARD - Complete Krea2 Pipeline.json');
const evolutionDir = path.join(demos, 'Gold Evolution');
const pix = path.join(comfy, 'user', 'default', 'workflows', 'Pixaroma');

const sources = {
  ref2: path.join(pix, 'Ep29 Workflows', '2. Generate Video H3 (ref2va)', 'Minimax H3 - Reference Two Images.json'),
  ref3: path.join(pix, 'Ep29 Workflows', '2. Generate Video H3 (ref2va)', 'Minimax H3 - Reference Three Images.json'),
  fflf: path.join(pix, 'Ep29 Workflows', '1. Generate Video H3 (fl2va)', 'Minimax H3 - Image to video FFLF.json'),
  lowvram: path.join(pix, 'Ep29 Workflows', 'Low Vram', 'Minimax H3 - Text to video (Low VRAM 8GB).json'),
  h3edit: path.join(pix, 'Ep29 Workflows', '4. Generate Image H3 (fl2va)', 'Minimax H3 - Image Edit.json'),
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function byId(workflow, id) {
  const node = workflow.nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Node ${id} not found`);
  return node;
}

function findByTitle(workflow, title) {
  return workflow.nodes.find((item) => item.title === title);
}

function nodeInputIndex(node, name) {
  const index = (node.inputs || []).findIndex((input) => input.name === name);
  if (index < 0) throw new Error(`Input ${name} not found on ${node.title || node.type}`);
  return index;
}

function cleanNodeLinks(node) {
  for (const input of node.inputs || []) input.link = null;
  for (const output of node.outputs || []) output.links = null;
}

function addNode(ctx, templateNode, options = {}) {
  const node = clone(templateNode);
  node.id = ++ctx.workflow.last_node_id;
  node.pos = options.pos || node.pos;
  if (options.size) node.size = options.size;
  if (options.title) node.title = options.title;
  if (options.mode !== undefined) node.mode = options.mode;
  node.order = ctx.workflow.nodes.length;
  cleanNodeLinks(node);
  ctx.workflow.nodes.push(node);
  return node;
}

function addLink(ctx, source, sourceSlot, target, targetInputName, type) {
  const targetSlot = typeof targetInputName === 'number'
    ? targetInputName
    : nodeInputIndex(target, targetInputName);
  const id = ++ctx.workflow.last_link_id;
  ctx.workflow.links.push([id, source.id, sourceSlot, target.id, targetSlot, type]);
  target.inputs[targetSlot].link = id;
  if (!source.outputs[sourceSlot].links) source.outputs[sourceSlot].links = [];
  source.outputs[sourceSlot].links.push(id);
  return id;
}

function removeLink(ctx, linkId) {
  const index = ctx.workflow.links.findIndex((link) => link[0] === linkId);
  if (index < 0) throw new Error(`Link ${linkId} not found`);
  const [link] = ctx.workflow.links.splice(index, 1);
  const source = byId(ctx.workflow, link[1]);
  const target = byId(ctx.workflow, link[3]);
  const output = source.outputs[link[2]];
  if (output.links) {
    output.links = output.links.filter((id) => id !== linkId);
    if (!output.links.length) output.links = null;
  }
  if (target.inputs[link[4]].link === linkId) target.inputs[link[4]].link = null;
  return { source, sourceSlot: link[2], target, targetSlot: link[4], type: link[5] };
}

function detachInput(ctx, target, inputName) {
  const slot = nodeInputIndex(target, inputName);
  const linkId = target.inputs[slot].link;
  if (linkId === null || linkId === undefined) throw new Error(`No link on ${target.title || target.type}.${inputName}`);
  return removeLink(ctx, linkId);
}

function setPrompt(node, text) {
  node.properties = node.properties || {};
  node.properties.promptState = node.properties.promptState || {};
  node.properties.promptState.text = text;
  node.widgets_values = [''];
}

function setAiPrompt(node, idea, formula, seed) {
  node.properties = node.properties || {};
  node.properties.aiPromptState = {
    ...(node.properties.aiPromptState || {}),
    idea,
    formula,
    model: '',
    clip_type: 'krea2',
    order: 'wired',
    sep: 'newline',
    seed,
    temperature: 0.55,
    max_length: 1400,
    top_k: 64,
    top_p: 0.95,
    min_p: 0.05,
    repetition_penalty: 1.05,
    presence_penalty: 0,
    do_sample: true,
    thinking: false,
    use_default_template: true,
    release_model: false,
    seed_mode: 'fixed',
    idea_share: 0.3,
  };
  node.properties.aiPromptLast = {
    text: '',
    meta: 'Ready — branch is off and AI is bypassed by default',
    error: false,
    muted: true,
    seed,
  };
  node.widgets_values = [];
  node.widgets_values_named = {};
}

function setNote(node, html) {
  const value = { version: 1, content: html };
  node.widgets_values = [JSON.stringify(value)];
  node.properties = node.properties || {};
  node.properties.noteState = value;
}

function setGroupSwitch(node, picked, action = 'mute') {
  const state = { version: 1, action, scope: 'pick', picked, sort: 'position', restriction: 'any' };
  node.properties = node.properties || {};
  node.properties.groupSwitchState = clone(state);
  node.widgets_values = [clone(state)];
  node.widgets_values_named = { group_switch_ui: clone(state) };
}

function addPixaromaGroup(workflow, group) {
  workflow.extra = workflow.extra || {};
  workflow.extra.pixaromaGroups = workflow.extra.pixaromaGroups || [];
  if (!workflow.extra.pixaromaGroups.some((item) => item.id === group.id)) {
    workflow.extra.pixaromaGroups.push({
      titleColor: '#B7472A',
      bodyColor: '#3a241e',
      titleAlpha: 0.96,
      bodyAlpha: 0.42,
      fontSize: 18,
      folded: false,
      showLinks: true,
      ...group,
    });
  }
}

function makeInpaintCropNode() {
  return {
    id: 0,
    type: 'PixaromaInpaintCrop',
    pos: [0, 0],
    size: [520, 520],
    flags: {},
    order: 0,
    mode: 0,
    inputs: [
      { name: 'size_mode', type: 'COMBO', widget: { name: 'size_mode' }, link: null },
      { name: 'target', type: 'INT', widget: { name: 'target' }, link: null },
      { name: 'multiple', type: 'COMBO', widget: { name: 'multiple' }, link: null },
      { name: 'context_px', type: 'INT', widget: { name: 'context_px' }, link: null },
      { name: 'mask_grow', type: 'INT', widget: { name: 'mask_grow' }, link: null },
      { name: 'mask_blur', type: 'INT', widget: { name: 'mask_blur' }, link: null },
      { name: 'softness', type: 'INT', widget: { name: 'softness' }, link: null },
      { name: 'blend_mode', type: 'COMBO', widget: { name: 'blend_mode' }, link: null },
      { name: 'invert_mask', type: 'BOOLEAN', widget: { name: 'invert_mask' }, link: null },
      { name: 'image', shape: 7, type: 'IMAGE', link: null },
      { name: 'mask', shape: 7, type: 'MASK', link: null },
    ],
    outputs: [
      { name: 'image', type: 'IMAGE', links: null },
      { name: 'mask', type: 'MASK', links: null },
      { name: 'crop_info', type: 'PIXAROMA_CROP_INFO', links: null },
      { name: 'width', type: 'INT', links: null },
      { name: 'height', type: 'INT', links: null },
    ],
    properties: { cnr_id: 'ComfyUI-Pixaroma', 'Node name for S&R': 'PixaromaInpaintCrop' },
    widgets_values: ['keep shape (long side)', 1024, 32, 96, 12, 8, 32, 'mask', false],
  };
}

function makeInpaintStitchNode() {
  return {
    id: 0,
    type: 'PixaromaInpaintStitch',
    pos: [0, 0],
    size: [420, 240],
    flags: {},
    order: 0,
    mode: 0,
    inputs: [
      { name: 'image', type: 'IMAGE', link: null },
      { name: 'mask', shape: 7, type: 'MASK', link: null },
      { name: 'crop_info', shape: 7, type: 'PIXAROMA_CROP_INFO', link: null },
      { name: 'softness', type: 'INT', widget: { name: 'softness' }, link: null },
      { name: 'blend_mode', type: 'COMBO', widget: { name: 'blend_mode' }, link: null },
      { name: 'color_match', type: 'COMBO', widget: { name: 'color_match' }, link: null },
    ],
    outputs: [
      { name: 'image', type: 'IMAGE', links: null },
      { name: 'original', type: 'IMAGE', links: null },
    ],
    properties: { cnr_id: 'ComfyUI-Pixaroma', 'Node name for S&R': 'PixaromaInpaintStitch' },
    widgets_values: [-1, 'from crop', 'subtle'],
  };
}

function addStage1(ctx) {
  const w = ctx.workflow;
  if (findByTitle(w, 'R1 — PRIMARY IDENTITY / CHARACTER REFERENCE')) return false;

  const ref = ctx.ref2;
  const goldAi = byId(w, 187);
  const goldSwitch = byId(w, 186);
  const goldNote = byId(w, 201);
  const sharedAiClip = byId(w, 183);
  const h3Clip = byId(w, 188);
  const h3VideoVae = byId(w, 189);
  const h3AudioVae = byId(w, 190);
  const h3Duration = byId(w, 192);
  const h3Size = byId(w, 193);

  addPixaromaGroup(w, {
    id: 'pg_adv_1_ref_inputs',
    title: 'ADVANCED CONTROLS G — REFERENCE IMAGES & REF2VA PROMPT',
    x: -3800, y: -6200, w: 1600, h: 2750,
    titleColor: '#4E7D6A', bodyColor: '#20342c',
  });
  addPixaromaGroup(w, {
    id: 'pg_adv_1_ref_ai',
    title: 'ADVANCED CONTROLS H — REFERENCE AI DIRECTOR',
    x: -2150, y: -6200, w: 850, h: 1150,
    titleColor: '#7A3E78', bodyColor: '#312132',
  });
  addPixaromaGroup(w, {
    id: 'pg_adv_master',
    title: 'ADVANCED CONTROLS I — OPTIONAL BRANCH SWITCHES',
    x: -1250, y: -6200, w: 1050, h: 2750,
    titleColor: '#8A6D1D', bodyColor: '#352f18',
  });
  addPixaromaGroup(w, {
    id: 'pg_gold_10_reference',
    title: '10 — H3 REF2VA — TWO-IMAGE REFERENCE PASS',
    x: 50, y: 4250, w: 4100, h: 1550,
    titleColor: '#4E7D6A', bodyColor: '#20342c',
  });

  const guide = addNode(ctx, goldNote, {
    title: 'G0 — REFERENCE CONTROLS — READ ME', pos: [-3750, -6100], size: [1500, 330], mode: 0,
  });
  setNote(guide,
    '<h2>Reference-image controls</h2><p><b>Picture 1</b> is the identity/character anchor. <b>Picture 2</b> is the world, wardrobe, prop or visual-style anchor.</p><ol><li>Load both pictures.</li><li>Describe what must be retained in the structured prompt.</li><li>Turn on <b>I1 Reference AI</b> only when you want the prompt rewritten.</li><li>Turn on <b>I2 Reference Video</b> to run the expensive Ref2VA branch.</li></ol><p>The branch is genuinely dormant while off. Use <b>match</b> reference sizing for normal work; the processing node documents where to change to <b>max</b> for maximum identity fidelity at a substantial speed cost.</p>');

  const refOne = addNode(ctx, byId(ref, 236), {
    title: 'R1 — PRIMARY IDENTITY / CHARACTER REFERENCE', pos: [-3750, -5700], size: [700, 430], mode: 0,
  });
  const refTwo = addNode(ctx, byId(ref, 238), {
    title: 'R2 — WORLD / WARDROBE / PROP REFERENCE', pos: [-3000, -5700], size: [700, 430], mode: 0,
  });
  // The Pixaroma example names an image that is not present in this install.
  // Use a known local image so every saved checkpoint validates immediately.
  refTwo.widgets_values = ['Architecture.png', 'image', ''];
  const prompt = addNode(ctx, byId(ref, 239), {
    title: 'R3 — STRUCTURED H3 REFERENCE PROMPT', pos: [-3750, -5200], size: [1500, 1200], mode: 0,
  });
  setPrompt(prompt,
`subject_definitions:
- <Picture 1>: The primary person or character. Preserve recognisable identity, face, hair, age, build, clothing and distinctive details.
- <Picture 2>: The supporting environment, wardrobe, prop or visual treatment. Preserve only the elements named below.

summary:
- task_type: reference generation
- intent: Create one coherent five-second shot that keeps the identity from <Picture 1> and integrates the requested elements from <Picture 2>.

retention_analysis:
- Preserve identity and anatomy from <Picture 1>.
- Preserve the named environment, clothing, prop or palette from <Picture 2>.
- Do not copy unwanted background clutter or introduce extra people.

detailed_description:
[Shot 1]
The subject performs one restrained, physically plausible action in a continuous shot. Describe the exact action, camera movement, lighting, environment and final pose here.

overall_soundscape:
Natural location sound matching the visible action; no invented speech.

non_diegetic_music:
N/A`);

  const ai = addNode(ctx, goldAi, {
    title: 'H1 — PIXAROMA AI — H3 REFERENCE DIRECTOR', pos: [-2100, -6100], size: [750, 1000], mode: 2,
  });
  setAiPrompt(ai,
    'Preserve the primary subject from Picture 1. Use Picture 2 only for the environment, wardrobe, prop or visual elements explicitly requested. Prefer one continuous, realistic shot with restrained motion.',
    'Rewrite the wired draft as a MiniMax H3 full-reference Ref2VA prompt using exactly these top-level sections and this order: subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music. Keep the labels <Picture 1> and <Picture 2> stable. In summary use task_type: reference generation. Define what each picture contributes, explicitly reject unwanted carry-over, and describe a coherent 5.17-second shot with concrete action, camera, lighting and sound. The first shot has no timestamp. Later shots, only if essential, must use strictly increasing timestamps inside 5.17 seconds. Do not invent dialogue, lyrics, people or changing on-screen text. Return only the finished structured prompt.',
    20260831);

  const aiSwitch = addNode(ctx, goldSwitch, {
    title: 'I1 — REFERENCE AI: TRUE OFF / ON', pos: [-1200, -6100], size: [950, 110], mode: 0,
  });
  setGroupSwitch(aiSwitch, ['pg_adv_1_ref_ai'], 'bypass');
  const branchSwitch = addNode(ctx, goldSwitch, {
    title: 'I2 — H3 REFERENCE VIDEO: MUTE / RUN', pos: [-1200, -5920], size: [950, 120], mode: 0,
  });
  setGroupSwitch(branchSwitch, ['pg_gold_10_reference'], 'mute');
  const switchGuide = addNode(ctx, goldNote, {
    title: 'I3 — OPTIONAL BRANCH SAFETY', pos: [-1200, -5720], size: [950, 630], mode: 0,
  });
  setNote(switchGuide,
    '<h2>Safe defaults</h2><p>Both controls begin off.</p><ul><li><b>I1 off:</b> the AI node is bypassed and the structured prompt passes through unchanged.</li><li><b>I2 off:</b> no Ref2VA model, conditioning, sampling, decode or save work is requested.</li></ul><p>Turn I1 on only when you want help writing. Turn I2 on only when you want to render.</p>');

  const branchGuide = addNode(ctx, goldNote, {
    title: '10A — REF2VA BRANCH GUIDE', pos: [100, 4350], size: [650, 1200], mode: 4,
  });
  setNote(branchGuide,
    '<h2>Two-image H3 reference pass</h2><p>This is a distinct optional output, not a hidden replacement for the normal Krea-to-H3 pass.</p><ol><li>The generative 4B Qwen model writes the prompt only when enabled.</li><li>The dedicated MiniMax 32B encoder performs H3 conditioning.</li><li>The Ref2VA model receives both reference images at <b>match</b> size.</li><li>Base sampling uses 20 steps and preserves the reference labels in the prompt.</li></ol><p>For the slowest, strongest identity conditioning, change ref_image_size on 10F from <b>match</b> to <b>max</b>.</p>');
  const model = addNode(ctx, byId(ref, 194), {
    title: '10B — Load H3 Ref2VA Model', pos: [850, 4350], size: [600, 110], mode: 4,
  });
  const conditioning = addNode(ctx, byId(ref, 237), {
    title: '10F — H3 Ref2VA Conditioning — Picture 1 + Picture 2', pos: [1550, 4350], size: [650, 360], mode: 4,
  });
  conditioning.widgets_values = ['', 1344, 768, 124, 'match'];
  const negative = addNode(ctx, byId(ref, 224), {
    title: '10G — Zero H3 Negative Conditioning', pos: [1550, 4850], size: [650, 60], mode: 4,
  });
  const sampler = addNode(ctx, byId(ref, 225), {
    title: '10H — Ref2VA Base Sampler — 20 Steps', pos: [2350, 4350], size: [500, 306], mode: 4,
  });
  sampler.widgets_values = [20260831, 'fixed', 20, 1, 'res_multistep', 'simple', 1];
  const decodeVideo = addNode(ctx, byId(ref, 226), {
    title: '10I — Decode Reference Video', pos: [2350, 4850], size: [500, 80], mode: 4,
  });
  const decodeAudio = addNode(ctx, byId(ref, 227), {
    title: '10J — Decode Reference Audio', pos: [2350, 5000], size: [500, 80], mode: 4,
  });
  const save = addNode(ctx, byId(ref, 228), {
    title: '10K — PREVIEW + SAVE H3 REFERENCE VIDEO', pos: [3000, 4350], size: [1000, 1100], mode: 4,
  });
  save.widgets_values = [24, 'Codex_GOLD_H3_Ref2VA_Two_Image', 'save', false, ''];

  addLink(ctx, sharedAiClip, 0, ai, 'clip', 'CLIP');
  addLink(ctx, refOne, 0, ai, 'image', 'IMAGE');
  addLink(ctx, prompt, 0, ai, 'text', 'STRING');
  addLink(ctx, h3Clip, 0, conditioning, 'clip', 'CLIP');
  addLink(ctx, h3VideoVae, 0, conditioning, 'vae', 'VAE');
  addLink(ctx, h3AudioVae, 0, conditioning, 'audio_vae', 'VAE');
  addLink(ctx, ai, 0, conditioning, 'prompt', 'STRING');
  addLink(ctx, h3Size, 1, conditioning, 'width', 'INT');
  addLink(ctx, h3Size, 2, conditioning, 'height', 'INT');
  addLink(ctx, h3Duration, 0, conditioning, 'length', 'INT');
  addLink(ctx, refOne, 0, conditioning, 'ref_images.ref_image_0', 'IMAGE');
  addLink(ctx, refTwo, 0, conditioning, 'ref_images.ref_image_1', 'IMAGE');
  addLink(ctx, conditioning, 0, negative, 'conditioning', 'CONDITIONING');
  addLink(ctx, model, 0, sampler, 'model', 'MODEL');
  addLink(ctx, conditioning, 0, sampler, 'positive', 'CONDITIONING');
  addLink(ctx, negative, 0, sampler, 'negative', 'CONDITIONING');
  addLink(ctx, conditioning, 1, sampler, 'latent_image', 'LATENT');
  addLink(ctx, sampler, 0, decodeVideo, 'samples', 'LATENT');
  addLink(ctx, h3VideoVae, 0, decodeVideo, 'vae', 'VAE');
  addLink(ctx, sampler, 0, decodeAudio, 'samples', 'LATENT');
  addLink(ctx, h3AudioVae, 0, decodeAudio, 'vae', 'VAE');
  addLink(ctx, decodeVideo, 0, save, 'video_frames', 'IMAGE');
  addLink(ctx, decodeAudio, 0, save, 'audio', 'AUDIO');

  return true;
}

function addStage2(ctx) {
  const w = ctx.workflow;
  if (findByTitle(w, 'J1 — REPAIR SOURCE: PASS 2 / GOLD FINAL')) return false;

  const h3edit = ctx.h3edit;
  const goldAi = byId(w, 187);
  const goldSwitch = byId(w, 186);
  const dataSwitchTemplate = byId(w, 206);
  const goldNote = byId(w, 201);
  const promptTemplate = byId(ctx.ref2, 239);
  const sharedAiClip = byId(w, 183);
  const pass2Image = byId(w, 148);
  const goldFinalImage = byId(w, 166);

  addPixaromaGroup(w, {
    id: 'pg_adv_2_repair_inputs',
    title: 'ADVANCED CONTROLS J — SELECTIVE REPAIR',
    x: -100, y: -6200, w: 1500, h: 2750,
    titleColor: '#C97B34', bodyColor: '#39291d',
  });
  addPixaromaGroup(w, {
    id: 'pg_adv_2_repair_ai',
    title: 'ADVANCED CONTROLS K — REPAIR AI DIRECTOR',
    x: 1450, y: -6200, w: 850, h: 1150,
    titleColor: '#7A3E78', bodyColor: '#312132',
  });
  addPixaromaGroup(w, {
    id: 'pg_gold_11_repair',
    title: '11 — SELECTIVE REPAIR — PIXAROMA CROP / H3 EDIT / STITCH',
    x: 50, y: 5900, w: 4950, h: 1550,
    titleColor: '#C97B34', bodyColor: '#39291d',
  });

  const sourceSwitch = addNode(ctx, dataSwitchTemplate, {
    title: 'J1 — REPAIR SOURCE: PASS 2 / GOLD FINAL', pos: [-50, -6100], size: [1400, 120], mode: 0,
  });
  sourceSwitch.properties.switchState = {
    activeIndex: 1,
    labels: { '1': 'FAST — Raw Krea Pass 2', '2': 'FINAL — SeedVR2 + RCAS (requires still-output branch)' },
    visibleCount: 3,
  };
  sourceSwitch.outputs[0].type = 'IMAGE';

  const repairGuide = addNode(ctx, goldNote, {
    title: 'J2 — HOW TO PAINT A REPAIR', pos: [-50, -5920], size: [1400, 520], mode: 0,
  });
  setNote(repairGuide,
    '<h2>Selective repair</h2><ol><li>Choose the raw Pass 2 image or the finished SeedVR2 image.</li><li>Turn on <b>I4 Selective Repair</b>.</li><li>Open <b>11B Inpaint Crop</b> and paint only the defect.</li><li>Describe the replacement in J3. State what must remain unchanged.</li><li>Queue the workflow.</li></ol><p>Only the crop is regenerated. Stitch restores it into the untouched original and preserves everything outside the painted mask pixel-for-pixel.</p>');
  const prompt = addNode(ctx, promptTemplate, {
    title: 'J3 — SELECTIVE REPAIR INSTRUCTION', pos: [-50, -5320], size: [1400, 850], mode: 0,
  });
  setPrompt(prompt,
`For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.

integrated_multimodal_description:
[Shot 1]
This is a still-image repair. Replace only the painted defect with [describe the correct anatomy, object, texture or detail]. Preserve the surrounding pose, identity, lighting, colour, perspective, depth of field and composition exactly. Do not redesign anything outside the requested repair.

overall_soundscape:
N/A

non_diegetic_music:
N/A`);

  const ai = addNode(ctx, goldAi, {
    title: 'K1 — PIXAROMA AI — SELECTIVE REPAIR WRITER', pos: [1500, -6100], size: [750, 1000], mode: 2,
  });
  setAiPrompt(ai,
    'Describe one precise local correction. Preserve everything outside the painted area, especially identity, pose, lighting, perspective and colour.',
    'Rewrite the wired draft as a MiniMax H3 I2VA still-image repair prompt. Begin exactly with: For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced. Then leave one blank line and provide, in this exact order: integrated_multimodal_description, overall_soundscape, non_diegetic_music. In Shot 1 describe only the requested local correction and explicitly preserve surrounding identity, pose, lighting, colour, perspective and composition. Use overall_soundscape: N/A and non_diegetic_music: N/A. Return only the finished structured prompt.',
    20260901);

  const aiSwitch = addNode(ctx, goldSwitch, {
    title: 'I3 — REPAIR AI: TRUE OFF / ON', pos: [-1200, -4920], size: [950, 110], mode: 0,
  });
  setGroupSwitch(aiSwitch, ['pg_adv_2_repair_ai'], 'bypass');
  const branchSwitch = addNode(ctx, goldSwitch, {
    title: 'I4 — SELECTIVE REPAIR: MUTE / RUN', pos: [-1200, -4740], size: [950, 120], mode: 0,
  });
  setGroupSwitch(branchSwitch, ['pg_gold_11_repair'], 'mute');

  const branchGuide = addNode(ctx, goldNote, {
    title: '11A — REPAIR PIPELINE GUIDE', pos: [100, 6000], size: [600, 1200], mode: 4,
  });
  setNote(branchGuide,
    '<h2>Crop, repair, stitch</h2><p>The model never needs to regenerate the full image.</p><ol><li>Pixaroma finds the painted mask and makes a 1024-pixel, 32-aligned crop with context.</li><li>H3 receives the crop as its exact first frame and produces a five-frame edit latent.</li><li>Frame zero is selected as the repaired still.</li><li>Pixaroma stitches only the painted mask back into the original.</li></ol><p>The crop uses 96 px context, 12 px mask growth, 8 px blur and a 32 px seam. Change stitch softness or colour matching after sampling; that reuses the cached repair.</p>');
  const crop = addNode(ctx, makeInpaintCropNode(), {
    title: '11B — PAINT MASK HERE — PIXAROMA INPAINT CROP', pos: [800, 6000], size: [650, 900], mode: 4,
  });
  const h3Clip = addNode(ctx, byId(h3edit, 195), {
    title: '11C — Load H3 Conditioning Encoder', pos: [1550, 6000], size: [600, 136], mode: 4,
  });
  const h3Vae = addNode(ctx, byId(h3edit, 196), {
    title: '11D — Load H3 Video VAE', pos: [1550, 6190], size: [600, 84], mode: 4,
  });
  const h3Model = addNode(ctx, byId(h3edit, 194), {
    title: '11E — Load H3 FL2VA Edit Model', pos: [1550, 6330], size: [600, 110], mode: 4,
  });
  const conditioning = addNode(ctx, byId(h3edit, 222), {
    title: '11F — H3 Five-Frame Repair Conditioning', pos: [2250, 6000], size: [600, 330], mode: 4,
  });
  conditioning.widgets_values = ['', 1024, 1024, 5];
  const negative = addNode(ctx, byId(h3edit, 224), {
    title: '11G — Zero Repair Negative Conditioning', pos: [2250, 6440], size: [600, 60], mode: 4,
  });
  const sampler = addNode(ctx, byId(h3edit, 225), {
    title: '11H — H3 Selective Repair Sampler', pos: [2950, 6000], size: [500, 306], mode: 4,
  });
  sampler.widgets_values = [20260901, 'fixed', 20, 1, 'res_multistep', 'beta', 1];
  const decode = addNode(ctx, byId(h3edit, 226), {
    title: '11I — Decode Repaired Crop', pos: [2950, 6410], size: [500, 80], mode: 4,
  });
  const frame = addNode(ctx, byId(h3edit, 236), {
    title: '11J — Select Repaired Still Frame', pos: [2950, 6570], size: [500, 110], mode: 4,
  });
  frame.widgets_values = [0, 1];
  const stitch = addNode(ctx, makeInpaintStitchNode(), {
    title: '11K — PIXAROMA INPAINT STITCH', pos: [3550, 6000], size: [550, 360], mode: 4,
  });
  const compare = addNode(ctx, byId(w, 172), {
    title: '11L — PIXAROMA COMPARE — ORIGINAL / REPAIRED', pos: [4200, 6000], size: [650, 600], mode: 4,
  });
  const preview = addNode(ctx, byId(w, 155), {
    title: '11M — PREVIEW + SAVE SELECTIVE REPAIR', pos: [3550, 6500], size: [550, 500], mode: 4,
  });
  preview.widgets_values = ['Codex_MCP_GOLD_Selective_Repair', 'save'];

  addLink(ctx, pass2Image, 0, sourceSwitch, 'input_1', '*');
  addLink(ctx, goldFinalImage, 0, sourceSwitch, 'input_2', '*');
  addLink(ctx, sharedAiClip, 0, ai, 'clip', 'CLIP');
  addLink(ctx, sourceSwitch, 0, ai, 'image', 'IMAGE');
  addLink(ctx, prompt, 0, ai, 'text', 'STRING');
  addLink(ctx, sourceSwitch, 0, crop, 'image', 'IMAGE');
  addLink(ctx, h3Clip, 0, conditioning, 'clip', 'CLIP');
  addLink(ctx, h3Vae, 0, conditioning, 'vae', 'VAE');
  addLink(ctx, ai, 0, conditioning, 'prompt', 'STRING');
  addLink(ctx, crop, 3, conditioning, 'width', 'INT');
  addLink(ctx, crop, 4, conditioning, 'height', 'INT');
  addLink(ctx, crop, 0, conditioning, 'first_frame', 'IMAGE');
  addLink(ctx, conditioning, 0, negative, 'conditioning', 'CONDITIONING');
  addLink(ctx, h3Model, 0, sampler, 'model', 'MODEL');
  addLink(ctx, conditioning, 0, sampler, 'positive', 'CONDITIONING');
  addLink(ctx, negative, 0, sampler, 'negative', 'CONDITIONING');
  addLink(ctx, conditioning, 1, sampler, 'latent_image', 'LATENT');
  addLink(ctx, sampler, 0, decode, 'samples', 'LATENT');
  addLink(ctx, h3Vae, 0, decode, 'vae', 'VAE');
  addLink(ctx, decode, 0, frame, 'image', 'IMAGE');
  addLink(ctx, frame, 0, stitch, 'image', 'IMAGE');
  addLink(ctx, crop, 1, stitch, 'mask', 'MASK');
  addLink(ctx, crop, 2, stitch, 'crop_info', 'PIXAROMA_CROP_INFO');
  addLink(ctx, stitch, 1, compare, 'image1', 'IMAGE');
  addLink(ctx, stitch, 0, compare, 'image2', 'IMAGE');
  addLink(ctx, stitch, 0, preview, 'image', 'IMAGE');

  return true;
}

function addStage3(ctx) {
  const w = ctx.workflow;
  if (findByTitle(w, 'L1 — H3 CONTINUATION IDEA / ACTION')) return false;

  const fflf = ctx.fflf;
  const goldAi = byId(w, 187);
  const goldSwitch = byId(w, 186);
  const goldNote = byId(w, 201);
  const promptTemplate = byId(ctx.ref2, 239);
  const sharedAiClip = byId(w, 183);
  const firstH3Frames = byId(w, 198);
  const h3Duration = byId(w, 192);

  addPixaromaGroup(w, {
    id: 'pg_adv_3_continue_inputs',
    title: 'ADVANCED CONTROLS L — H3 CONTINUATION',
    x: 2350, y: -6200, w: 1500, h: 2750,
    titleColor: '#355C7D', bodyColor: '#1f2f3a',
  });
  addPixaromaGroup(w, {
    id: 'pg_adv_3_continue_ai',
    title: 'ADVANCED CONTROLS M — CONTINUATION AI DIRECTOR',
    x: 3900, y: -6200, w: 850, h: 1150,
    titleColor: '#7A3E78', bodyColor: '#312132',
  });
  addPixaromaGroup(w, {
    id: 'pg_gold_12_continuation',
    title: '12 — H3 CONTINUATION — LAST FRAME TO NEXT CLIP',
    x: 50, y: 7600, w: 4100, h: 1550,
    titleColor: '#355C7D', bodyColor: '#1f2f3a',
  });

  const guide = addNode(ctx, goldNote, {
    title: 'L0 — CONTINUATION CONTROLS — READ ME', pos: [2400, -6100], size: [1400, 550], mode: 0,
  });
  setNote(guide,
    '<h2>H3 continuation</h2><p>This stage creates a real second clip from the last decoded frame of the normal H3 output.</p><ol><li>Enable the normal H3 branch with E4.</li><li>Write the next action in L1.</li><li>Optionally enable I5 for an AI rewrite.</li><li>Enable I6 to render clip two.</li></ol><p>The hand-off frame is selected automatically. Keep identity, camera direction, lighting and motion momentum consistent. The two MP4 files remain separate so a bad continuation never damages the first clip.</p>');
  const prompt = addNode(ctx, promptTemplate, {
    title: 'L1 — H3 CONTINUATION IDEA / ACTION', pos: [2400, -5470], size: [1400, 980], mode: 0,
  });
  setPrompt(prompt,
`For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.

integrated_multimodal_description:
[Shot 1]
Continue immediately from <Picture 1>, which is the exact final frame of the preceding clip. Preserve the same subject identity, clothing, environment, lighting, camera side, lens character and direction of motion. The current action continues naturally: [describe the next physical action and the intended end state]. Use one continuous shot and avoid a visible restart, pose reset or lighting jump.

overall_soundscape:
Continue the natural location sound and action sounds seamlessly; do not invent speech.

non_diegetic_music:
N/A`);

  const ai = addNode(ctx, goldAi, {
    title: 'M1 — PIXAROMA AI — H3 CONTINUATION DIRECTOR', pos: [3950, -6100], size: [750, 1000], mode: 2,
  });
  setAiPrompt(ai,
    'Continue the exact visible action from the supplied last frame. Preserve identity, clothing, environment, light, lens, camera side and motion direction. Avoid any pose reset or visual jump.',
    'Rewrite the wired idea as a MiniMax H3 I2VA continuation prompt for a 5.17-second second clip. The supplied image is <Picture 1>, the exact final frame of the previous clip and exact first frame at 0.00 seconds. Begin exactly with: For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced. Then leave one blank line and provide, in this exact order: integrated_multimodal_description, overall_soundscape, non_diegetic_music. In Shot 1 continue the visible action without a pose reset, cut, identity change, camera-side reversal, lighting jump or new object. Describe continuous action, camera motion and a natural end state. The first shot has no timestamp. Do not invent dialogue, lyrics or extra people. Return only the finished structured prompt.',
    20260902);

  const aiSwitch = addNode(ctx, goldSwitch, {
    title: 'I5 — CONTINUATION AI: TRUE OFF / ON', pos: [-1200, -4560], size: [950, 110], mode: 0,
  });
  setGroupSwitch(aiSwitch, ['pg_adv_3_continue_ai'], 'bypass');
  const branchSwitch = addNode(ctx, goldSwitch, {
    title: 'I6 — H3 CONTINUATION: MUTE / RUN', pos: [-1200, -4380], size: [950, 120], mode: 0,
  });
  setGroupSwitch(branchSwitch, ['pg_gold_12_continuation'], 'mute');

  const branchGuide = addNode(ctx, goldNote, {
    title: '12A — CONTINUATION PIPELINE GUIDE', pos: [100, 7700], size: [600, 1200], mode: 4,
  });
  setNote(branchGuide,
    '<h2>Last-frame continuation</h2><ol><li>12B selects the final frame from the first H3 decode batch.</li><li>12C sizes it while preserving aspect ratio.</li><li>12G uses it as the exact first frame of clip two.</li><li>A fresh 20-step FL2VA pass makes the continuation.</li></ol><p>This branch requires the original H3 branch to be enabled. It intentionally saves clip two separately. That makes retries cheap, preserves the approved first clip, and gives an editor a clean joining point.</p>');
  const lastFrame = addNode(ctx, byId(ctx.h3edit, 236), {
    title: '12B — Select Last Frame of First H3 Clip', pos: [800, 7700], size: [550, 110], mode: 4,
  });
  lastFrame.widgets_values = [-1, 1];
  const longest = addNode(ctx, byId(fflf, 237), {
    title: '12C — Preserve Continuation Frame Aspect', pos: [800, 7880], size: [550, 190], mode: 4,
  });
  const h3Model = addNode(ctx, byId(fflf, 194), {
    title: '12D — Load H3 FL2VA Continuation Model', pos: [1450, 7700], size: [600, 110], mode: 4,
  });
  const h3Clip = addNode(ctx, byId(fflf, 195), {
    title: '12E — Load H3 Conditioning Encoder', pos: [1450, 7880], size: [600, 136], mode: 4,
  });
  const h3Vae = addNode(ctx, byId(fflf, 196), {
    title: '12F — Load H3 Video VAE', pos: [1450, 8070], size: [600, 84], mode: 4,
  });
  const h3AudioVae = addNode(ctx, byId(fflf, 213), {
    title: '12F2 — Load H3 Audio VAE', pos: [1450, 8210], size: [600, 84], mode: 4,
  });
  const conditioning = addNode(ctx, byId(fflf, 222), {
    title: '12G — H3 Continuation Conditioning', pos: [2150, 7700], size: [600, 330], mode: 4,
  });
  conditioning.widgets_values = ['', 1344, 768, 124];
  const negative = addNode(ctx, byId(fflf, 224), {
    title: '12H — Zero Continuation Negative', pos: [2150, 8140], size: [600, 60], mode: 4,
  });
  const sampler = addNode(ctx, byId(fflf, 225), {
    title: '12I — H3 Continuation Sampler — 20 Steps', pos: [2850, 7700], size: [500, 306], mode: 4,
  });
  sampler.widgets_values = [20260902, 'fixed', 20, 1, 'res_multistep', 'simple', 1];
  const decodeVideo = addNode(ctx, byId(fflf, 226), {
    title: '12J — Decode Continuation Video', pos: [2850, 8110], size: [500, 80], mode: 4,
  });
  const decodeAudio = addNode(ctx, byId(fflf, 227), {
    title: '12K — Decode Continuation Audio', pos: [2850, 8260], size: [500, 80], mode: 4,
  });
  const save = addNode(ctx, byId(fflf, 228), {
    title: '12L — PREVIEW + SAVE H3 CONTINUATION', pos: [3450, 7700], size: [550, 1100], mode: 4,
  });
  save.widgets_values = [24, 'Codex_GOLD_H3_Continuation_Clip_02', 'save', false, ''];

  addLink(ctx, sharedAiClip, 0, ai, 'clip', 'CLIP');
  addLink(ctx, lastFrame, 0, ai, 'image', 'IMAGE');
  addLink(ctx, prompt, 0, ai, 'text', 'STRING');
  addLink(ctx, firstH3Frames, 0, lastFrame, 'image', 'IMAGE');
  addLink(ctx, lastFrame, 0, longest, 'image', 'IMAGE');
  addLink(ctx, h3Clip, 0, conditioning, 'clip', 'CLIP');
  addLink(ctx, h3Vae, 0, conditioning, 'vae', 'VAE');
  addLink(ctx, ai, 0, conditioning, 'prompt', 'STRING');
  addLink(ctx, longest, 1, conditioning, 'width', 'INT');
  addLink(ctx, longest, 2, conditioning, 'height', 'INT');
  addLink(ctx, h3Duration, 0, conditioning, 'length', 'INT');
  addLink(ctx, longest, 0, conditioning, 'first_frame', 'IMAGE');
  addLink(ctx, conditioning, 0, negative, 'conditioning', 'CONDITIONING');
  addLink(ctx, h3Model, 0, sampler, 'model', 'MODEL');
  addLink(ctx, conditioning, 0, sampler, 'positive', 'CONDITIONING');
  addLink(ctx, negative, 0, sampler, 'negative', 'CONDITIONING');
  addLink(ctx, conditioning, 1, sampler, 'latent_image', 'LATENT');
  addLink(ctx, sampler, 0, decodeVideo, 'samples', 'LATENT');
  addLink(ctx, h3Vae, 0, decodeVideo, 'vae', 'VAE');
  addLink(ctx, sampler, 0, decodeAudio, 'samples', 'LATENT');
  addLink(ctx, h3AudioVae, 0, decodeAudio, 'vae', 'VAE');
  addLink(ctx, decodeVideo, 0, save, 'video_frames', 'IMAGE');
  addLink(ctx, decodeAudio, 0, save, 'audio', 'AUDIO');

  return true;
}

function addStage4(ctx) {
  const w = ctx.workflow;
  if (findByTitle(w, 'N1 — STORY FRAME 1 — OPENING BEAT')) return false;

  const ref3 = ctx.ref3;
  const goldAi = byId(w, 187);
  const goldSwitch = byId(w, 186);
  const goldNote = byId(w, 201);
  const sharedAiClip = byId(w, 183);
  const h3Duration = byId(w, 192);
  const h3Size = byId(w, 193);

  addPixaromaGroup(w, {
    id: 'pg_adv_4_story_inputs',
    title: 'ADVANCED CONTROLS N — THREE-FRAME STORYBOARD',
    x: 4800, y: -6200, w: 1700, h: 2750,
    titleColor: '#B45574', bodyColor: '#38212a',
  });
  addPixaromaGroup(w, {
    id: 'pg_adv_4_story_ai',
    title: 'ADVANCED CONTROLS O — STORYBOARD AI DIRECTOR',
    x: 6550, y: -6200, w: 850, h: 1150,
    titleColor: '#7A3E78', bodyColor: '#312132',
  });
  addPixaromaGroup(w, {
    id: 'pg_gold_13_storyboard',
    title: '13 — H3 STORYBOARD — THREE REFERENCE BEATS',
    x: 50, y: 9300, w: 4300, h: 1650,
    titleColor: '#B45574', bodyColor: '#38212a',
  });

  const guide = addNode(ctx, goldNote, {
    title: 'N0 — STORYBOARD MODE — READ ME', pos: [4850, -6100], size: [1600, 360], mode: 0,
  });
  setNote(guide,
    '<h2>Three-frame storyboard</h2><p>Picture 1 is the opening beat, Picture 2 is the middle beat, and Picture 3 is the destination beat.</p><p>These are strong Ref2VA visual references, not mathematically locked animation keyframes. Describe the transition and what must be retained from each picture. Use the normal H3 duration control; the supplied template is written for 5.17 seconds.</p>');
  const frame1 = addNode(ctx, byId(ref3, 236), {
    title: 'N1 — STORY FRAME 1 — OPENING BEAT', pos: [4850, -5660], size: [500, 420], mode: 0,
  });
  frame1.widgets_values = ['BunnySitting.jpg', 'image', ''];
  const frame2 = addNode(ctx, byId(ref3, 238), {
    title: 'N2 — STORY FRAME 2 — MIDDLE BEAT', pos: [5400, -5660], size: [500, 420], mode: 0,
  });
  frame2.widgets_values = ['BallerinaBunny.png', 'image', ''];
  const frame3 = addNode(ctx, byId(ref3, 240), {
    title: 'N3 — STORY FRAME 3 — DESTINATION BEAT', pos: [5950, -5660], size: [500, 420], mode: 0,
  });
  frame3.widgets_values = ['Architecture.png', 'image', ''];
  const prompt = addNode(ctx, byId(ref3, 239), {
    title: 'N4 — STRUCTURED THREE-BEAT STORY PROMPT', pos: [4850, -5160], size: [1600, 1580], mode: 0,
  });
  setPrompt(prompt,
`subject_definitions:
- <Picture 1>: Opening composition and initial subject state. Preserve the named identity, costume, objects and camera side.
- <Picture 2>: Middle action beat. Preserve only the subject pose, interaction or visual development named below.
- <Picture 3>: Destination composition and final state. Preserve the named setting, pose and important objects.

summary:
- task_type: keyframe completion
- intent: Connect three storyboard beats in one coherent 5.17-second audiovisual sequence.

retention_analysis:
- Keep subject identity, wardrobe, lighting logic and screen direction consistent across all beats.
- Use Picture 1 as the opening, Picture 2 as the middle development, and Picture 3 as the final destination.
- Do not import unwanted background clutter or extra people from any reference.

detailed_description:
[Shot 1]
Begin in the composition and state described by <Picture 1>. The subject starts [opening action].

[Shot 2] (1.75s)
Move naturally into the action beat described by <Picture 2>, preserving motion direction and camera continuity.

[Shot 3] (3.50s)
Resolve into the final composition and end state described by <Picture 3>. Hold a readable final pose through 5.17 seconds.

overall_soundscape:
One continuous, natural sound bed whose action sounds follow the visible transitions; no invented dialogue.

non_diegetic_music:
N/A`);

  const ai = addNode(ctx, goldAi, {
    title: 'O1 — PIXAROMA AI — THREE-BEAT STORYBOARD DIRECTOR', pos: [6600, -6100], size: [750, 1000], mode: 2,
  });
  setAiPrompt(ai,
    'Connect Picture 1 as the opening, Picture 2 as the middle action beat, and Picture 3 as the destination. Preserve identity, wardrobe, lighting logic, camera side and motion direction.',
    'Rewrite the wired storyboard as a MiniMax H3 full-reference Ref2VA prompt using exactly these top-level sections and this order: subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music. Keep <Picture 1>, <Picture 2> and <Picture 3> stable. In summary use task_type: keyframe completion. Treat Picture 1 as the opening beat, Picture 2 as the middle development around 1.75 seconds, and Picture 3 as the destination around 3.50 seconds. Preserve identity, wardrobe, lighting logic, camera side and motion direction. The first shot has no timestamp; later shots use strictly increasing timestamps within 5.17 seconds. Reject unwanted clutter and extra people. Return only the finished structured prompt.',
    20260903);

  const aiSwitch = addNode(ctx, goldSwitch, {
    title: 'I7 — STORYBOARD AI: TRUE OFF / ON', pos: [-1200, -4200], size: [950, 110], mode: 0,
  });
  setGroupSwitch(aiSwitch, ['pg_adv_4_story_ai'], 'bypass');
  const branchSwitch = addNode(ctx, goldSwitch, {
    title: 'I8 — H3 STORYBOARD: MUTE / RUN', pos: [-1200, -4020], size: [950, 120], mode: 0,
  });
  setGroupSwitch(branchSwitch, ['pg_gold_13_storyboard'], 'mute');

  const branchGuide = addNode(ctx, goldNote, {
    title: '13A — STORYBOARD PIPELINE GUIDE', pos: [100, 9400], size: [600, 1300], mode: 4,
  });
  setNote(branchGuide,
    '<h2>Three-reference story pass</h2><p>The Ref2VA model receives all three storyboard images on every sampling step.</p><ol><li>Opening, middle and destination references remain separately labelled.</li><li>The formal prompt assigns each picture a role and rejects unwanted carry-over.</li><li>The saved 20-step sampler favours quality and continuity.</li></ol><p>Reference sizing is <b>match</b>. Changing 13F to <b>max</b> can strengthen visual identity but is substantially slower. For an exact first-and-last-frame lock, use the Pixaroma FFLF teaching workflow; this storyboard branch prioritises three-beat narrative guidance.</p>');
  const model = addNode(ctx, byId(ref3, 194), {
    title: '13B — Load H3 Ref2VA Storyboard Model', pos: [800, 9400], size: [600, 110], mode: 4,
  });
  const clip = addNode(ctx, byId(ref3, 195), {
    title: '13C — Load H3 Conditioning Encoder', pos: [800, 9570], size: [600, 136], mode: 4,
  });
  const videoVae = addNode(ctx, byId(ref3, 196), {
    title: '13D — Load H3 Video VAE', pos: [800, 9760], size: [600, 84], mode: 4,
  });
  const audioVae = addNode(ctx, byId(ref3, 213), {
    title: '13E — Load H3 Audio VAE', pos: [800, 9900], size: [600, 84], mode: 4,
  });
  const conditioning = addNode(ctx, byId(ref3, 237), {
    title: '13F — H3 Storyboard Conditioning — Three Pictures', pos: [1500, 9400], size: [700, 400], mode: 4,
  });
  conditioning.widgets_values = ['', 1344, 768, 124, 'match'];
  const negative = addNode(ctx, byId(ref3, 224), {
    title: '13G — Zero Storyboard Negative', pos: [1500, 9910], size: [700, 60], mode: 4,
  });
  const sampler = addNode(ctx, byId(ref3, 225), {
    title: '13H — H3 Storyboard Sampler — 20 Steps', pos: [2300, 9400], size: [500, 306], mode: 4,
  });
  sampler.widgets_values = [20260903, 'fixed', 20, 1, 'res_multistep', 'simple', 1];
  const decodeVideo = addNode(ctx, byId(ref3, 226), {
    title: '13I — Decode Storyboard Video', pos: [2300, 9810], size: [500, 80], mode: 4,
  });
  const decodeAudio = addNode(ctx, byId(ref3, 227), {
    title: '13J — Decode Storyboard Audio', pos: [2300, 9960], size: [500, 80], mode: 4,
  });
  const save = addNode(ctx, byId(ref3, 228), {
    title: '13K — PREVIEW + SAVE H3 STORYBOARD VIDEO', pos: [2900, 9400], size: [1250, 1200], mode: 4,
  });
  save.widgets_values = [24, 'Codex_GOLD_H3_Storyboard_Three_Beat', 'save', false, ''];

  addLink(ctx, sharedAiClip, 0, ai, 'clip', 'CLIP');
  addLink(ctx, frame1, 0, ai, 'image', 'IMAGE');
  addLink(ctx, prompt, 0, ai, 'text', 'STRING');
  addLink(ctx, clip, 0, conditioning, 'clip', 'CLIP');
  addLink(ctx, videoVae, 0, conditioning, 'vae', 'VAE');
  addLink(ctx, audioVae, 0, conditioning, 'audio_vae', 'VAE');
  addLink(ctx, ai, 0, conditioning, 'prompt', 'STRING');
  addLink(ctx, h3Size, 1, conditioning, 'width', 'INT');
  addLink(ctx, h3Size, 2, conditioning, 'height', 'INT');
  addLink(ctx, h3Duration, 0, conditioning, 'length', 'INT');
  addLink(ctx, frame1, 0, conditioning, 'ref_images.ref_image_0', 'IMAGE');
  addLink(ctx, frame2, 0, conditioning, 'ref_images.ref_image_1', 'IMAGE');
  addLink(ctx, frame3, 0, conditioning, 'ref_images.ref_image_2', 'IMAGE');
  addLink(ctx, conditioning, 0, negative, 'conditioning', 'CONDITIONING');
  addLink(ctx, model, 0, sampler, 'model', 'MODEL');
  addLink(ctx, conditioning, 0, sampler, 'positive', 'CONDITIONING');
  addLink(ctx, negative, 0, sampler, 'negative', 'CONDITIONING');
  addLink(ctx, conditioning, 1, sampler, 'latent_image', 'LATENT');
  addLink(ctx, sampler, 0, decodeVideo, 'samples', 'LATENT');
  addLink(ctx, videoVae, 0, decodeVideo, 'vae', 'VAE');
  addLink(ctx, sampler, 0, decodeAudio, 'samples', 'LATENT');
  addLink(ctx, audioVae, 0, decodeAudio, 'vae', 'VAE');
  addLink(ctx, decodeVideo, 0, save, 'video_frames', 'IMAGE');
  addLink(ctx, decodeAudio, 0, save, 'audio', 'AUDIO');

  return true;
}

function addPurgeNode(ctx, title, pos, mode = 4) {
  const node = addNode(ctx, byId(ctx.lowvram, 300), { title, pos, size: [500, 100], mode });
  node.widgets_values = [true, true];
  return node;
}

function rerouteInputsThrough(ctx, source, sourceSlot, destinations, purge, type) {
  for (const [target, inputName] of destinations) {
    const detached = detachInput(ctx, target, inputName);
    if (detached.source.id !== source.id || detached.sourceSlot !== sourceSlot) {
      throw new Error(`Unexpected source while inserting ${purge.title}`);
    }
  }
  addLink(ctx, source, sourceSlot, purge, 'anything', type);
  for (const [target, inputName] of destinations) addLink(ctx, purge, 0, target, inputName, type);
}

function addStage5(ctx) {
  const w = ctx.workflow;
  if (findByTitle(w, 'V1 — RELEASE KREA BEFORE MAIN H3')) return false;

  const goldNote = byId(w, 201);
  addPixaromaGroup(w, {
    id: 'pg_adv_5_vram',
    title: 'ADVANCED CONTROLS P — VRAM CHOREOGRAPHY GUIDE',
    x: 7450, y: -6200, w: 1250, h: 1700,
    titleColor: '#2E7D32', bodyColor: '#1d3020',
  });
  const guide = addNode(ctx, goldNote, {
    title: 'P1 — VRAM CHOREOGRAPHY — ALWAYS-ON SAFETY', pos: [7500, -6100], size: [1150, 1500], mode: 0,
  });
  setNote(guide,
    '<h2>VRAM choreography</h2><p>The RTX 5080 has 16 GB VRAM, while the installed H3 diffusion model is about 21 GB and its 32B text encoder about 15.7 GB. They must take turns.</p><ol><li><b>Still hand-off:</b> finish Krea or SeedVR, then release those models before H3.</li><li><b>Prompt hand-off:</b> finish H3 conditioning, then release the text encoder before sampling.</li><li><b>Decode hand-off:</b> finish diffusion, then release the H3 model before VAE decode.</li></ol><p>The green V nodes use the same Purge VRAM V2 pattern as Pixaroma\'s tested 8 GB H3 workflow. They are embedded in every expensive optional branch. Leave them enabled. For troubleshooting, an individual V node can be bypassed and the wildcard connection will pass through.</p>');

  // Main Krea -> H3 branch.
  const mainConditioning = byId(w, 194);
  const mainBaseSampler = byId(w, 197);
  const mainTurboSampler = byId(w, 204);
  const mainQualitySwitch = byId(w, 205);
  const mainDecodeVideo = byId(w, 198);
  const mainDecodeAudio = byId(w, 199);
  const mainFrameSource = byId(w, 193);
  const mainFramePurge = addPurgeNode(ctx, 'V1 — RELEASE KREA BEFORE MAIN H3', [2200, 3100]);
  rerouteInputsThrough(ctx, mainFrameSource, 0, [[mainConditioning, 'first_frame']], mainFramePurge, 'IMAGE');
  const mainPromptPurge = addPurgeNode(ctx, 'V2 — RELEASE H3 TEXT ENCODER BEFORE SAMPLING', [2200, 3250]);
  rerouteInputsThrough(ctx, mainConditioning, 0, [[mainBaseSampler, 'positive'], [mainTurboSampler, 'positive']], mainPromptPurge, 'CONDITIONING');
  const mainModelPurge = addPurgeNode(ctx, 'V3 — RELEASE H3 MODEL BEFORE DECODING', [2800, 3500]);
  rerouteInputsThrough(ctx, mainQualitySwitch, 0, [[mainDecodeVideo, 'samples'], [mainDecodeAudio, 'samples']], mainModelPurge, 'LATENT');

  // Krea -> SeedVR hand-off.
  const pass2 = byId(w, 148);
  const seedUpscaler = byId(w, 164);
  const seedPurge = addPurgeNode(ctx, 'V4 — RELEASE KREA BEFORE SEEDVR2', [3200, 1315]);
  rerouteInputsThrough(ctx, pass2, 0, [[seedUpscaler, 'image']], seedPurge, 'IMAGE');

  // Stage 1 Ref2VA branch.
  const refConditioning = findByTitle(w, '10F — H3 Ref2VA Conditioning — Picture 1 + Picture 2');
  const refSampler = findByTitle(w, '10H — Ref2VA Base Sampler — 20 Steps');
  const refDecodeVideo = findByTitle(w, '10I — Decode Reference Video');
  const refDecodeAudio = findByTitle(w, '10J — Decode Reference Audio');
  const refPromptPurge = addPurgeNode(ctx, 'V5 — RELEASE REF2VA ENCODER BEFORE SAMPLING', [2250, 4750]);
  rerouteInputsThrough(ctx, refConditioning, 0, [[refSampler, 'positive']], refPromptPurge, 'CONDITIONING');
  const refModelPurge = addPurgeNode(ctx, 'V6 — RELEASE REF2VA MODEL BEFORE DECODING', [2850, 5200]);
  rerouteInputsThrough(ctx, refSampler, 0, [[refDecodeVideo, 'samples'], [refDecodeAudio, 'samples']], refModelPurge, 'LATENT');

  // Stage 2 selective repair branch.
  const repairSource = findByTitle(w, 'J1 — REPAIR SOURCE: PASS 2 / GOLD FINAL');
  const repairAi = findByTitle(w, 'K1 — PIXAROMA AI — SELECTIVE REPAIR WRITER');
  const repairCrop = findByTitle(w, '11B — PAINT MASK HERE — PIXAROMA INPAINT CROP');
  const repairConditioning = findByTitle(w, '11F — H3 Five-Frame Repair Conditioning');
  const repairSampler = findByTitle(w, '11H — H3 Selective Repair Sampler');
  const repairDecode = findByTitle(w, '11I — Decode Repaired Crop');
  const repairSourcePurge = addPurgeNode(ctx, 'V7 — RELEASE STILL MODELS BEFORE REPAIR', [800, 7050]);
  rerouteInputsThrough(ctx, repairSource, 0, [[repairAi, 'image'], [repairCrop, 'image']], repairSourcePurge, 'IMAGE');
  const repairPromptPurge = addPurgeNode(ctx, 'V8 — RELEASE REPAIR ENCODER BEFORE SAMPLING', [2850, 6330]);
  rerouteInputsThrough(ctx, repairConditioning, 0, [[repairSampler, 'positive']], repairPromptPurge, 'CONDITIONING');
  const repairModelPurge = addPurgeNode(ctx, 'V9 — RELEASE REPAIR MODEL BEFORE DECODING', [3450, 6400]);
  rerouteInputsThrough(ctx, repairSampler, 0, [[repairDecode, 'samples']], repairModelPurge, 'LATENT');

  // Stage 3 continuation branch.
  const continueLastFrame = findByTitle(w, '12B — Select Last Frame of First H3 Clip');
  const continueLongest = findByTitle(w, '12C — Preserve Continuation Frame Aspect');
  const continueAi = findByTitle(w, 'M1 — PIXAROMA AI — H3 CONTINUATION DIRECTOR');
  const continueConditioning = findByTitle(w, '12G — H3 Continuation Conditioning');
  const continueSampler = findByTitle(w, '12I — H3 Continuation Sampler — 20 Steps');
  const continueDecodeVideo = findByTitle(w, '12J — Decode Continuation Video');
  const continueDecodeAudio = findByTitle(w, '12K — Decode Continuation Audio');
  const continueSourcePurge = addPurgeNode(ctx, 'V10 — RELEASE CLIP ONE MODELS BEFORE CONTINUATION', [800, 8400]);
  rerouteInputsThrough(ctx, continueLastFrame, 0, [[continueLongest, 'image'], [continueAi, 'image']], continueSourcePurge, 'IMAGE');
  const continuePromptPurge = addPurgeNode(ctx, 'V11 — RELEASE CONTINUATION ENCODER BEFORE SAMPLING', [2750, 8100]);
  rerouteInputsThrough(ctx, continueConditioning, 0, [[continueSampler, 'positive']], continuePromptPurge, 'CONDITIONING');
  const continueModelPurge = addPurgeNode(ctx, 'V12 — RELEASE CONTINUATION MODEL BEFORE DECODING', [3350, 8400]);
  rerouteInputsThrough(ctx, continueSampler, 0, [[continueDecodeVideo, 'samples'], [continueDecodeAudio, 'samples']], continueModelPurge, 'LATENT');

  // Stage 4 storyboard branch.
  const storyConditioning = findByTitle(w, '13F — H3 Storyboard Conditioning — Three Pictures');
  const storySampler = findByTitle(w, '13H — H3 Storyboard Sampler — 20 Steps');
  const storyDecodeVideo = findByTitle(w, '13I — Decode Storyboard Video');
  const storyDecodeAudio = findByTitle(w, '13J — Decode Storyboard Audio');
  const storyPromptPurge = addPurgeNode(ctx, 'V13 — RELEASE STORYBOARD ENCODER BEFORE SAMPLING', [2200, 10200]);
  rerouteInputsThrough(ctx, storyConditioning, 0, [[storySampler, 'positive']], storyPromptPurge, 'CONDITIONING');
  const storyModelPurge = addPurgeNode(ctx, 'V14 — RELEASE STORYBOARD MODEL BEFORE DECODING', [2850, 10200]);
  rerouteInputsThrough(ctx, storySampler, 0, [[storyDecodeVideo, 'samples'], [storyDecodeAudio, 'samples']], storyModelPurge, 'LATENT');

  return true;
}

function makePresetControllerNode() {
  return {
    id: 0,
    type: 'GoldCharacterProjectPresets',
    pos: [0, 0],
    size: [1250, 1100],
    flags: {},
    order: 0,
    mode: 0,
    inputs: [],
    outputs: [],
    title: 'Q1 — CHARACTER & PROJECT PRESET BANK',
    properties: {
      'Node name for S&R': 'GoldCharacterProjectPresets',
      goldPresetState: {
        version: 1,
        character: [null, null, null, null],
        project: [null, null, null, null],
        lastMessage: '',
      },
    },
  };
}

function addStage6(ctx) {
  const w = ctx.workflow;
  if (findByTitle(w, 'Q1 — CHARACTER & PROJECT PRESET BANK')) return false;
  const goldNote = byId(w, 201);
  addPixaromaGroup(w, {
    id: 'pg_adv_6_presets',
    title: 'ADVANCED CONTROLS Q — CHARACTER & PROJECT PRESETS',
    x: 8750, y: -6200, w: 1400, h: 1900,
    titleColor: '#8A6D1D', bodyColor: '#352f18',
  });
  const guide = addNode(ctx, goldNote, {
    title: 'Q0 — PRESET BANK — READ ME', pos: [8800, -6100], size: [1300, 360], mode: 0,
  });
  setNote(guide,
    '<h2>Character and project presets</h2><p>Each of the four character slots remembers the primary identity reference, quick-prompt/tag state, Krea LoRAs and image seeds. Each of the four project slots remembers the whole human-control desk.</p><p><b>Save</b> stores a slot inside this workflow JSON. <b>Apply</b> restores it. Use <b>Export preset backup</b> before major experiments; Import restores that small JSON backup later.</p>');
  addNode(ctx, makePresetControllerNode(), {
    title: 'Q1 — CHARACTER & PROJECT PRESET BANK', pos: [8800, -5660], size: [1250, 1250], mode: 0,
  });
  return true;
}

function normalizeFinalLayout(workflow) {
  const placements = {
    'V4 — RELEASE KREA BEFORE SEEDVR2': { pos: [4450, 1315], size: [450, 60] },
    'V6 — RELEASE REF2VA MODEL BEFORE DECODING': { pos: [2350, 5350], size: [500, 100] },
    'V8 — RELEASE REPAIR ENCODER BEFORE SAMPLING': { pos: [2250, 6330], size: [500, 100] },
    'V11 — RELEASE CONTINUATION ENCODER BEFORE SAMPLING': { pos: [2150, 8210], size: [500, 100] },
    'V12 — RELEASE CONTINUATION MODEL BEFORE DECODING': { pos: [2850, 8400], size: [500, 100] },
    'V14 — RELEASE STORYBOARD MODEL BEFORE DECODING': { pos: [1500, 10200], size: [500, 100] },
  };
  for (const [title, placement] of Object.entries(placements)) {
    const node = findByTitle(workflow, title);
    if (!node) continue;
    node.pos = placement.pos;
    node.size = placement.size;
  }
}

function validateStructure(workflow) {
  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  const linkIds = new Set();
  for (const link of workflow.links) {
    if (linkIds.has(link[0])) throw new Error(`Duplicate link id ${link[0]}`);
    linkIds.add(link[0]);
    if (!nodeIds.has(link[1]) || !nodeIds.has(link[3])) throw new Error(`Link ${link[0]} references a missing node`);
  }
  for (const node of workflow.nodes) {
    for (const input of node.inputs || []) {
      if (input.link !== null && input.link !== undefined && !linkIds.has(input.link)) {
        throw new Error(`Node ${node.id} input ${input.name} references missing link ${input.link}`);
      }
    }
    for (const output of node.outputs || []) {
      for (const linkId of output.links || []) {
        if (!linkIds.has(linkId)) throw new Error(`Node ${node.id} output references missing link ${linkId}`);
      }
    }
  }
}

function main() {
  if (process.argv[2] === 'normalize') {
    const target = process.argv[3];
    if (!target) throw new Error('normalize requires a workflow path');
    const workflow = readJson(target);
    normalizeFinalLayout(workflow);
    validateStructure(workflow);
    fs.writeFileSync(target, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
    process.stdout.write(JSON.stringify({ normalized: target, nodes: workflow.nodes.length }, null, 2));
    return;
  }
  const stage = Number(process.argv[2] || 1);
  if (![1, 2, 3, 4, 5, 6].includes(stage)) throw new Error('Supported stages: 1, 2, 3, 4, 5, 6');
  const workflow = readJson(goldPath);
  const ctx = {
    workflow,
    ref2: readJson(sources.ref2),
    ref3: readJson(sources.ref3),
    fflf: readJson(sources.fflf),
    lowvram: readJson(sources.lowvram),
    h3edit: readJson(sources.h3edit),
  };
  addStage1(ctx);
  if (stage >= 2) addStage2(ctx);
  if (stage >= 3) addStage3(ctx);
  if (stage >= 4) addStage4(ctx);
  if (stage >= 5) addStage5(ctx);
  const changed = stage >= 6 ? addStage6(ctx) : false;
  normalizeFinalLayout(workflow);
  const installedRefTwo = findByTitle(workflow, 'R2 — WORLD / WARDROBE / PROP REFERENCE');
  if (installedRefTwo) installedRefTwo.widgets_values = ['Architecture.png', 'image', ''];
  validateStructure(workflow);
  fs.mkdirSync(evolutionDir, { recursive: true });
  fs.writeFileSync(goldPath, `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
  const checkpoint = stage === 1
    ? 'Stage 1 - Reference Image Controls.json'
    : stage === 2
      ? 'Stage 2 - Selective Repair.json'
      : stage === 3
        ? 'Stage 3 - H3 Continuation.json'
        : stage === 4
          ? 'Stage 4 - Storyboard Mode.json'
          : stage === 5
            ? 'Stage 5 - VRAM Choreography.json'
            : 'Stage 6 - Character and Project Presets.json';
  fs.writeFileSync(path.join(evolutionDir, checkpoint), `${JSON.stringify(workflow, null, 2)}\n`, 'utf8');
  process.stdout.write(JSON.stringify({ stage, changed, nodes: workflow.nodes.length, links: workflow.links.length, groups: workflow.extra.pixaromaGroups.length }, null, 2));
}

main();
