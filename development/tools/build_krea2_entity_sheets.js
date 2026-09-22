const { requireComfyRoot } = require("./local_paths.cjs");
const fs = require("fs");
const path = require("path");

const comfy = requireComfyRoot();
const demos = path.join(comfy, "user", "default", "workflows", "Codex MCP Demos");
const sourcePath = path.join(demos, "07 GOLD STANDARD.json");
const outputPath = path.join(demos, "08 KREA2 ENTITY REFERENCE SHEETS - Ref2VA Ready.json");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const sourceById = new Map(source.nodes.map((node) => [node.id, node]));
const clone = (value) => JSON.parse(JSON.stringify(value));

function template(id) {
  const node = sourceById.get(id);
  if (!node) throw new Error(`Missing source node ${id}`);
  return clone(node);
}

function cleanLinks(node) {
  for (const input of node.inputs || []) input.link = null;
  for (const output of node.outputs || []) output.links = null;
}

const workflow = {
  id: "0d26d4e8-89cb-4a56-9475-fc4d8bc55a74",
  revision: 0,
  last_node_id: 0,
  last_link_id: 0,
  nodes: [],
  links: [],
  groups: [],
  config: {},
  extra: {
    ds: { scale: 0.78, offset: [60, 80] },
    pixaromaGroups: [],
  },
  version: 0.4,
};

function addNode(templateId, title, pos, size) {
  const node = template(templateId);
  cleanLinks(node);
  node.id = ++workflow.last_node_id;
  node.order = workflow.nodes.length;
  node.mode = 0;
  node.title = title;
  node.pos = pos;
  if (size) node.size = size;
  workflow.nodes.push(node);
  return node;
}

function addRawNode(type, title, pos, size, inputs, outputs, widgetsValues = []) {
  const node = {
    id: ++workflow.last_node_id,
    type,
    pos,
    size,
    flags: {},
    order: workflow.nodes.length,
    mode: 0,
    inputs,
    outputs,
    properties: {},
    widgets_values: widgetsValues,
  };
  node.title = title;
  workflow.nodes.push(node);
  return node;
}

function inputIndex(node, name) {
  const index = (node.inputs || []).findIndex((input) => input.name === name);
  if (index < 0) throw new Error(`Input ${name} missing on ${node.title}`);
  return index;
}

function connect(sourceNode, sourceSlot, targetNode, targetInput, type) {
  const targetSlot = inputIndex(targetNode, targetInput);
  const linkId = ++workflow.last_link_id;
  workflow.links.push([linkId, sourceNode.id, sourceSlot, targetNode.id, targetSlot, type]);
  targetNode.inputs[targetSlot].link = linkId;
  if (!sourceNode.outputs[sourceSlot].links) sourceNode.outputs[sourceSlot].links = [];
  sourceNode.outputs[sourceSlot].links.push(linkId);
}

function setPrompt(node, text, order = "mine", separator = "\n\n") {
  node.properties = node.properties || {};
  node.properties.promptState = {
    text,
    order,
    sep: separator,
    accent: null,
    showExpanded: true,
  };
  node.widgets_values = [""];
  node.widgets_values_named = { pix_prompt_ui: "" };
}

function setPromptMulti(node) {
  node.properties = node.properties || {};
  node.properties.promptMultiState = {
    version: 2,
    mode: "queue",
    rows: [
      {
        id: "entity_1",
        enabled: true,
        label: "RANDOM CHARACTER A - poseable",
        text: "[TPOSE]",
      },
      {
        id: "entity_2",
        enabled: true,
        label: "RANDOM CHARACTER B - poseable",
        text: "[TPOSE]",
      },
      {
        id: "entity_3",
        enabled: true,
        label: "RANDOM ENTITY A - creature/object/prop",
        text: "[TURNAROUND]",
      },
      {
        id: "entity_4",
        enabled: true,
        label: "RANDOM ENTITY B - creature/object/prop",
        text: "[TURNAROUND]",
      },
    ],
    activeIndex: 0,
  };
  node.widgets_values = [""];
  node.widgets_values_named = { promptmulti: "" };
}

function setNote(node, html, width, height) {
  const state = {
    version: 1,
    content: html,
    buttonColor: "#f66744",
    lineColor: "#f66744",
    width,
    height,
    backgroundColor: "#2a2a2a",
  };
  node.widgets_values = [JSON.stringify(state), ""];
  node.widgets_values_named = { note_json: JSON.stringify(state), note_dom: "" };
  node.size = [width, height];
}

function addGroup(id, title, x, y, w, h, titleColor, bodyColor) {
  workflow.extra.pixaromaGroups.push({
    id,
    title,
    x,
    y,
    w,
    h,
    titleColor,
    bodyColor,
    titleAlpha: 0.96,
    bodyAlpha: 0.42,
    fontSize: 18,
    folded: false,
    showLinks: true,
  });
}

const note = addNode(158, "START HERE - KREA 2 ENTITY REFERENCE SHEETS", [0, 0], [5240, 380]);
setNote(
  note,
  "<h1>Krea 2 Surprise-Me Entity Sheets - Type-Safe Ref2VA Ready</h1><p><b>Click Run once to queue four independently randomised sheets.</b> Rows 1-2 select only people or genuinely humanoid characters and use the nine-panel face/body/T-pose layout. Rows 3-4 select animals, creatures, vehicles, buildings, food, furniture, tools, machines and props and use the six-panel turnaround layout. Disable any row you do not want.</p><ol><li>Leave Prompt Multi in <b>Queue</b> mode. Its four marker-only rows deliberately choose the safe route.</li><li>The two orange director boxes contain the live Pixaroma tags. Every <b>*Category</b> selects a random ten-choice list, then a line; every <b>#tag</b> selects one random line from a specific list.</li><li>Edit or extend the four <b>Codex...</b> List categories in Pixaroma Tag Library. All 54 lists contain exactly ten choices.</li><li>Optionally choose one Krea 2 LoRA in the shared Pixaroma LoRA Loader. It is <b>OFF by default</b>; when enabled, its model, CLIP and trigger words apply to every queued sheet.</li><li>The marker expander inserts exactly one route. Objects never receive face, full-body or T-pose instructions.</li><li>Load the resulting PNGs into Ref2VA as ref_image_0, ref_image_1, and so on.</li></ol><p>Expanded pools: 100 poseable character bases, 200 complete non-humanoid/entity bases, 120 compatible character-trait choices and 120 item-trait choices. The automatic object route uses only the 60 type-neutral item traits; the more class-specific 60 remain available for optional manual experiments.</p>",
  5240,
  380,
);

const entities = addNode(179, "RUN CONTROL - 2 RANDOM CHARACTERS + 2 RANDOM ENTITIES", [40, 470], [850, 1326]);
setPromptMulti(entities);

const sharedStyle = addNode(143, "OPTIONAL - ONE SHARED VISUAL STYLE", [1000, 470], [620, 350]);
setPrompt(
  sharedStyle,
  "photorealistic production design, physically plausible construction and materials, coherent proportions, neutral colour rendering, crisp identity-defining detail",
  "wired",
  "\n\n",
);

const humanDirector = addNode(143, "AUTO ROUTE A - [TPOSE] HUMANS & HUMANOIDS", [1000, 860], [620, 720]);
setPrompt(
  humanDirector,
  "The randomly selected poseable character is: *CodexPoseableCharacters. Mix-and-match identity details: #character_palette; #character_silhouette; #character_wardrobe; #character_condition; #character_accessory; #character_personality; #character_head_detail; #character_face_marking; #character_hand_detail; #character_footwear; #character_back_detail; #character_signature_motif. Create a professional production model sheet for exactly this one person or genuinely humanoid subject. The page layout is strict: exactly nine separate equal square panels arranged as three columns by three rows. Never merge, enlarge, omit or subdivide a panel. Every panel shows the exact same identity, facial features, silhouette, proportions, colours, materials, clothing, wear, markings and accessories. Row 1: front face close-up with neutral expression; three-quarter face close-up; exact left-profile face close-up. Row 2, each completely visible head to feet: full-body front neutral stance; full-body three-quarter stance; full-body exact side profile. Row 3: full-body front T-pose facing camera with arms perfectly straight and horizontal and palms down; full-body rear T-pose with arms perfectly straight and horizontal; close-up of the most identity-defining feature or accessory. Use a plain warm-grey studio background, soft even lighting, gentle contact shadows and consistent scale. Put a clear black gutter around every panel. No setting, unrelated subjects, alternate designs, labels, captions, text or decorative outer border.",
  "mine",
  "\n\n",
);

const turnaroundDirector = addNode(143, "AUTO ROUTE B - [TURNAROUND] OBJECTS & CREATURES", [1660, 470], [780, 820]);
setPrompt(
  turnaroundDirector,
  "The randomly selected non-humanoid entity is: *CodexTurnaroundEntities. Type-neutral identity details: #item_universal_asymmetry; #item_universal_identity_feature; #item_universal_surface_story; #item_universal_function_cue; #item_universal_edge_detail; #item_universal_consistency_rule. Preserve that selected description as one coherent design; do not borrow anatomy, materials, scale or fittings from a different entity class. Create a professional orthographic turnaround reference sheet for exactly this one described subject. Use a strict visible two-column by three-row grid containing exactly six separate equal cells. Never merge, enlarge, omit or subdivide a cell. Every cell shows the exact same subject with identical geometry, silhouette, proportions, colours, materials, construction, wear, markings and accessories. Cell 1: complete front view. Cell 2: complete three-quarter front view. Cell 3: complete exact left-side view. Cell 4: complete exact right-side view. Cell 5: complete rear view. Cell 6: the most useful top, plan, underside or identity-detail view for this particular subject. Keep the subject itself complete and uncropped wherever an overall view is requested. Preserve only anatomy explicitly belonging to a described creature. Keep the described subject as the sole subject; never add a wearer, rider, carrier, handler, mannequin or supporting figure. Never anthropomorphize an object. Use a plain warm-grey studio background, soft even lighting, gentle contact shadows and consistent scale. Put a clear black gutter around every cell so all six cells are visibly distinct. No setting, unrelated subjects, alternate designs, labels, captions, text or decorative outer border.",
  "mine",
  "\n\n",
);

const expandTpose = addRawNode(
  "StringReplace",
  "AUTO - EXPAND [TPOSE] ONLY WHEN PRESENT",
  [1660, 1330],
  [350, 190],
  [
    { localized_name: "string", name: "string", type: "STRING", widget: { name: "string" }, link: null },
    { localized_name: "find", name: "find", type: "STRING", widget: { name: "find" }, link: null },
    { localized_name: "replace", name: "replace", type: "STRING", widget: { name: "replace" }, link: null },
  ],
  [{ localized_name: "STRING", name: "STRING", type: "STRING", links: null }],
  ["", "[TPOSE]", ""],
);
expandTpose.widgets_values_named = { string: "", find: "[TPOSE]", replace: "" };

const expandTurnaround = addRawNode(
  "StringReplace",
  "AUTO - EXPAND [TURNAROUND] ONLY WHEN PRESENT",
  [2050, 1330],
  [350, 190],
  [
    { localized_name: "string", name: "string", type: "STRING", widget: { name: "string" }, link: null },
    { localized_name: "find", name: "find", type: "STRING", widget: { name: "find" }, link: null },
    { localized_name: "replace", name: "replace", type: "STRING", widget: { name: "replace" }, link: null },
  ],
  [{ localized_name: "STRING", name: "STRING", type: "STRING", links: null }],
  ["", "[TURNAROUND]", ""],
);
expandTurnaround.widgets_values_named = { string: "", find: "[TURNAROUND]", replace: "" };

const entityAndStyle = addNode(181, "AUTO - ADD ONE SHARED STYLE", [1840, 1580], [380, 162]);
entityAndStyle.widgets_values = ["", ""];
entityAndStyle.widgets_values_named = { text_1: "", text_2: "" };

const promptWithLora = addNode(181, "AUTO - ADD ENABLED LORA TRIGGER WORDS", [1840, 1800], [380, 162]);
promptWithLora.widgets_values = ["", ""];
promptWithLora.widgets_values_named = { text_1: "", text_2: "" };

const unet = addNode(54, "KREA 2 TURBO MODEL", [2540, 470], [720, 110]);
unet.widgets_values = ["Krea2\\krea2_turbo_fp8_scaled.safetensors", "default"];
unet.widgets_values_named = { unet_name: "Krea2\\krea2_turbo_fp8_scaled.safetensors", weight_dtype: "default" };

const clip = addNode(53, "KREA 2 TEXT ENCODER", [2540, 620], [720, 136]);
clip.widgets_values = ["qwen3vl_4b_fp8_scaled.safetensors", "krea2", "default"];
clip.widgets_values_named = { clip_name: "qwen3vl_4b_fp8_scaled.safetensors", type: "krea2", device: "default" };

const vae = addNode(40, "KREA 2 VAE", [2540, 810], [720, 84]);
vae.widgets_values = ["qwen_image_vae.safetensors"];
vae.widgets_values_named = { vae_name: "qwen_image_vae.safetensors" };

const lora = addNode(82, "OPTIONAL - ONE SHARED KREA 2 LORA (OFF BY DEFAULT)", [2940, 940], [320, 180]);
const loraState = {
  version: 1,
  loras: [
    {
      id: "entity_shared_lora",
      name: "krea2\\Krea2-realism-V2.safetensors",
      on: false,
      sm: 0.7,
      sc: 0.7,
      triggers: [],
      custom: [],
      at: true,
    },
  ],
  sep: ", ",
  step: 0.05,
  defStrength: 0.7,
  linkStrength: true,
  civitai: true,
  thumbs: true,
  hideExt: true,
  accent: null,
  cacheMode: "last",
};
lora.properties.loraLoaderState = JSON.stringify(loraState);
lora.widgets_values = [clone(loraState)];
lora.widgets_values_named = { loras_ui: clone(loraState) };

const enhancer = addNode(146, "KREA 2 MODEL ENHANCER", [2540, 940], [340, 136]);
enhancer.widgets_values = [true, 1, false];
enhancer.widgets_values_named = { enabled: true, strength: 1, debug: false };

const resolution = addNode(169, "EDIT THIS - SQUARE SHEET RESOLUTION", [2540, 1120], [240, 435]);
const resolutionState = {
  mode: "preset",
  ratio: "1:1",
  w: 1536,
  h: 1536,
  custom_w: 1536,
  custom_h: 1536,
  custom_ratio_w: 1,
  custom_ratio_h: 1,
  snap: 16,
};
resolution.properties.resolutionState = JSON.stringify(resolutionState);
resolution.widgets_values = [clone(resolutionState)];
resolution.widgets_values_named = { resolution_ui: clone(resolutionState) };

const seed = addNode(170, "Sheet Seed Pixaroma", [2860, 1120], [390, 254]);
const seedState = { seed: 20260823, mode: "random", compact: false, digits: 16 };
seed.properties.seedState = JSON.stringify(seedState);
seed.widgets_values = [clone(seedState)];
seed.widgets_values_named = { seed_ui: clone(seedState) };

const latent = addNode(150, "CREATE 1:1 REFERENCE SHEET LATENT", [3420, 470], [320, 136]);
latent.widgets_values = [1536, 1536, 1];
latent.widgets_values_named = { width: 1536, height: 1536, batch_size: 1 };

const encode = addNode(151, "ENCODE FINAL TYPE-SAFE SHEET PROMPT", [3780, 470], [280, 106]);
encode.widgets_values = [""];
encode.widgets_values_named = { text: "" };

const negative = addNode(147, "ZERO NEGATIVE CONDITIONING", [3780, 610], [280, 60]);
negative.flags = { collapsed: true };

const sampler = addNode(149, "KREA 2 TYPE-SAFE SHEET GENERATION", [4100, 470], [310, 348]);
sampler.widgets_values = [20260823, "randomize", 8, 1, "er_sde", "simple", 1];
sampler.widgets_values_named = {
  seed: 20260823,
  control_after_generate: "randomize",
  steps: 8,
  cfg: 1,
  sampler_name: "er_sde",
  scheduler: "simple",
  denoise: 1,
};

const decode = addNode(154, "DECODE ENTITY SHEET", [4450, 470], [280, 80]);
decode.flags = { collapsed: true };

const preview = addNode(155, "PREVIEW + SAVE TYPE-SAFE REF2VA SHEET", [4770, 470], [430, 600]);
preview.widgets_values = ["Character_Sheets/%date:yyyy-MM-dd%/Krea2_Ref2VA_Entity_%Sheet Seed Pixaroma.seed%", "save"];
preview.widgets_values_named = {
  filename_prefix: "Character_Sheets/%date:yyyy-MM-dd%/Krea2_Ref2VA_Entity_%Sheet Seed Pixaroma.seed%",
  save_mode: "save",
};
delete preview.properties.pixaromaFrames;
delete preview.properties.pixaromaSelected;

const monitor = addNode(182, "FINAL PROMPT MONITOR - VERIFY THE SELECTED ROUTE", [3420, 870], [970, 650]);
monitor.widgets_values = [""];
monitor.widgets_values_named = { text: "" };

connect(entities, 0, expandTpose, "string", "STRING");
connect(humanDirector, 0, expandTpose, "replace", "STRING");
connect(expandTpose, 0, expandTurnaround, "string", "STRING");
connect(turnaroundDirector, 0, expandTurnaround, "replace", "STRING");
connect(expandTurnaround, 0, entityAndStyle, "text_1", "STRING");
connect(sharedStyle, 0, entityAndStyle, "text_2", "STRING");
connect(entityAndStyle, 0, promptWithLora, "text_1", "STRING");
connect(lora, 2, promptWithLora, "text_2", "STRING");
connect(promptWithLora, 0, monitor, "source", "*");
connect(monitor, 0, encode, "text", "STRING");
connect(clip, 0, lora, "clip", "CLIP");
connect(lora, 1, encode, "clip", "CLIP");
connect(encode, 0, negative, "conditioning", "CONDITIONING");
connect(unet, 0, lora, "model", "MODEL");
connect(lora, 0, enhancer, "model", "MODEL");
connect(enhancer, 0, sampler, "model", "MODEL");
connect(encode, 0, sampler, "positive", "CONDITIONING");
connect(negative, 0, sampler, "negative", "CONDITIONING");
connect(resolution, 0, latent, "width", "INT");
connect(resolution, 1, latent, "height", "INT");
connect(latent, 0, sampler, "latent_image", "LATENT");
connect(seed, 0, sampler, "seed", "INT");
connect(sampler, 0, decode, "samples", "LATENT");
connect(vae, 0, decode, "vae", "VAE");
connect(decode, 0, preview, "image", "IMAGE");

addGroup("pg_entity_inputs", "1 - RANDOM BATCH CONTROL - ENABLE 1 TO 4 SHEETS", 0, 420, 920, 1800, "#B45574", "#38212a");
addGroup("pg_entity_direction", "2 - SHARED STYLE + AUTOMATIC TYPE-SAFE ROUTING", 960, 420, 1500, 1800, "#7A3E78", "#312132");
addGroup("pg_entity_settings", "3 - KREA 2 SETTINGS + ONE SHARED LORA", 2500, 420, 800, 1800, "#355C7D", "#1f2f3a");
addGroup("pg_entity_generate", "4 - GENERATE, INSPECT & SAVE", 3380, 420, 1860, 1800, "#2E7D32", "#1d3020");

fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, nodes: workflow.nodes.length, links: workflow.links.length, groups: workflow.extra.pixaromaGroups.length }, null, 2));
