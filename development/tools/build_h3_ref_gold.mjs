import { requireComfyRoot } from "./local_paths.cjs";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const workflowName = "09 GOLD STANDARD - MiniMax H3 Ref2VA Director.json";
const repoWorkflow = path.join(repoRoot, "workflows", "Codex MCP Demos", workflowName);
const liveWorkflow = path.join(liveRoot, workflowName);
const smokePath = path.join(repoRoot, "tests", "h3_ref_gold_smoke_api.json");
const aiSmokePath = path.join(repoRoot, "tests", "h3_ref_gold_ai_prompt_smoke_api.json");
const acceptancePath = path.join(repoRoot, "tests", "h3_ref_gold_acceptance_api.json");

const PIX_VER = "72516552d286901accf5a10fe9619c89b6784932";
const CORE_VER = "0.33.0";

const pixProps = (type, extra = {}) => ({
  aux_id: "pixaroma/ComfyUI-Pixaroma",
  ver: PIX_VER,
  "Node name for S&R": type,
  cnr_id: "ComfyUI-Pixaroma",
  ...extra,
});

const coreProps = (type) => ({
  cnr_id: "comfy-core",
  ver: CORE_VER,
  "Node name for S&R": type,
});

const makeNode = ({
  id,
  type,
  pos,
  size,
  title,
  inputs = [],
  outputs = [],
  widgets = [],
  properties = {},
  flags = {},
  mode = 0,
  color = "#1d1d1d",
  bgcolor = "#2a2a2a",
}) => ({
  id,
  type,
  pos,
  size,
  flags,
  order: 0,
  mode,
  inputs,
  outputs,
  ...(title ? { title } : {}),
  properties,
  widgets_values: widgets,
  color,
  bgcolor,
});

const input = (name, type, extra = {}) => ({ name, type, link: null, ...extra });
const output = (name, type) => ({ name, type, links: [] });

const nodes = [];
const byId = new Map();
const links = [];
let nextLink = 1;

function add(node) {
  nodes.push(node);
  byId.set(node.id, node);
  return node;
}

function connect(fromId, outputIndex, toId, inputName, type) {
  const from = byId.get(fromId);
  const to = byId.get(toId);
  if (!from || !to) throw new Error(`Missing node in link ${fromId} -> ${toId}`);
  const targetIndex = to.inputs.findIndex((candidate) => candidate.name === inputName);
  if (targetIndex < 0) throw new Error(`Missing input ${inputName} on node ${toId}`);
  const id = nextLink++;
  links.push([id, fromId, outputIndex, toId, targetIndex, type]);
  to.inputs[targetIndex].link = id;
  const out = from.outputs[outputIndex];
  if (!out) throw new Error(`Missing output ${outputIndex} on node ${fromId}`);
  out.links ??= [];
  out.links.push(id);
  return id;
}

const labelJson = JSON.stringify({
  text: "09 GOLD STANDARD — MiniMax H3 Ref2VA Director",
  fontSize: 46,
  fontFamily: "Arial",
  fontColor: "#ffffff",
  textAlign: "center",
  backgroundColor: "#f66744",
  padding: 14,
  borderRadius: 0,
  opacity: 1,
  fontWeight: "bold",
  lineHeight: 1,
});

const noteHtml = [
  "<h2>START HERE — a compact character-sheet-to-video workflow</h2>",
  "<ol>",
  "<li>Load one to six references from left to right with no gaps. Picture numbering follows enabled order.</li>",
  "<li>Edit the reference manifest and the four director boxes. Quoted dialogue must be preserved exactly.</li>",
  "<li>AI ON expands the director boxes into H3's six-section Ref2VA format. AI OFF uses the manual full prompt.</li>",
  "<li>Start at 864 × 480, 5 seconds and 20 steps. Increase duration or size only after a successful short test.</li>",
  "<li>Review the final prompt monitor, then Run. The generative Qwen model releases itself before H3 loads.</li>",
  "</ol>",
  "<p><b>Reference rule:</b> do not leave an enabled gap. If Picture 2 is off, Pictures 3–6 must also be off. One subject may use several pictures; explain that in the manifest.</p>",
].join("");

add(makeNode({
  id: 1,
  type: "PixaromaLabel",
  pos: [0, 0],
  size: [5400, 92],
  title: "09 GOLD STANDARD — MiniMax H3 Ref2VA Director",
  properties: pixProps("PixaromaLabel"),
  widgets: [labelJson],
  color: "#f66744",
}));

add(makeNode({
  id: 2,
  type: "PixaromaNote",
  pos: [0, 120],
  size: [5400, 260],
  title: "START HERE — FIVE STEPS",
  properties: pixProps("PixaromaNote", {
    ue_properties: { widget_ue_connectable: {}, version: "7.8", input_ue_unconnectable: {} },
  }),
  widgets: [JSON.stringify({
    version: 1,
    content: noteHtml,
    buttonColor: "#f66744",
    lineColor: "#f66744",
    width: 5400,
    height: 260,
    backgroundColor: "#2a2a2a",
  }), ""],
  color: "#f66744",
}));

const promptNode = (id, title, pos, size, text) => add(makeNode({
  id,
  type: "PixaromaPrompt",
  pos,
  size,
  title,
  inputs: [input("text_in", "STRING", { shape: 7 })],
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaPrompt", {
    promptState: { text, order: "mine", sep: "\n\n", accent: null, showExpanded: true },
  }),
  widgets: [""],
  color: "#7A3E78",
}));

promptNode(10, "SCENE + ACTION + REFERENCE MANIFEST — dictate here; Tags supports #scene", [40, 470], [970, 520], [
  "REFERENCE MANIFEST (enabled references are consecutive, with no gaps):",
  "Picture 1, Picture 2 and Picture 3 are three views of Character 1, the same brown-and-black goat. Preserve the goat's horns, face markings, coat colours and proportions.",
  "",
  "SCENE AND ACTION:",
  "Character 1 walks naturally toward the camera across a sunlit hillside, stops, stamps one front hoof, looks directly toward the lens and gives one short bleat.",
].join("\n"));

promptNode(11, "DIALOGUE — anything in quotation marks is exact; Tags supports #dialogue", [40, 1030], [970, 300], [
  "DIALOGUE:",
  "No spoken dialogue. The goat gives one natural short bleat.",
].join("\n"));

promptNode(12, "CAMERA DIRECTION — plain language or #shot", [40, 1370], [970, 280], [
  "CAMERA DIRECTION:",
  "A stable eye-level medium tracking shot moves gently backwards as the goat approaches, then settles into a locked close medium composition when it stops.",
].join("\n"));

promptNode(13, "SOUND + MUSIC — physical sound first; use N/A for no score", [40, 1690], [970, 280], [
  "SOUND AND MUSIC:",
  "Natural hillside ambience, light wind through grass, soft hoof impacts and one clean goat bleat. No non-diegetic music.",
].join("\n"));

add(makeNode({
  id: 14,
  type: "PixaromaDuration",
  pos: [40, 2010],
  size: [455, 120],
  title: "DURATION — 5 seconds first",
  outputs: [output("frames", "INT"), output("seconds", "FLOAT")],
  properties: pixProps("PixaromaDuration", {
    durationState: {
      seconds: 5,
      fps: 24,
      step: 17,
      plus: 5,
      minFrames: 5,
      mode: "recipe",
      formula: "",
      pick: "chips",
      values: [5, 10, 15],
      min: 1,
      max: 15,
      stepSec: 0.5,
      recipeName: "MiniMax H3",
    },
  }),
  color: "#14436c",
}));

const sizesState = {
  version: 1,
  sizes: [[608, 352], [736, 416], [864, 480], [960, 544], [1056, 608], [1152, 640], [1216, 672], [1280, 736], [1344, 768]],
  selected: 2,
  orientation: "landscape",
  snap: 32,
  accent: null,
  collapsed: false,
  starred: ["352x608", "480x864", "768x1344"],
  w: 864,
  h: 480,
};

add(makeNode({
  id: 15,
  type: "PixaromaSizes",
  pos: [535, 2010],
  size: [435, 260],
  title: "SIZE — Gold starting point 864 × 480",
  outputs: [output("width", "INT"), output("height", "INT")],
  properties: pixProps("PixaromaSizes", { sizesState: JSON.stringify(sizesState) }),
  widgets: [sizesState],
  color: "#14436c",
}));

add(makeNode({
  id: 20,
  type: "PixaromaTextJoinFour",
  pos: [1140, 500],
  size: [440, 300],
  title: "AUTO — Combine director boxes",
  inputs: [1, 2, 3, 4].map((n) => input(`text_${n}`, "STRING", { shape: 7 })),
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaTextJoinFour"),
  widgets: ["", "", "", ""],
  color: "#7A3E78",
}));

add(makeNode({
  id: 21,
  type: "SomethingToString",
  pos: [1140, 840],
  size: [440, 100],
  title: "AUTO — Tell the prompt writer the true duration",
  inputs: [input("input", "*")],
  outputs: [output("STRING", "STRING")],
  properties: { "Node name for S&R": "SomethingToString" },
  widgets: ["TARGET DURATION: ", " seconds."],
  color: "#355C7D",
}));

add(makeNode({
  id: 22,
  type: "PixaromaTextJoinTwo",
  pos: [1140, 980],
  size: [440, 180],
  title: "AUTO — Director brief + duration",
  inputs: [input("text_1", "STRING", { shape: 7 }), input("text_2", "STRING", { shape: 7 })],
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaTextJoinTwo"),
  widgets: ["", ""],
  color: "#7A3E78",
}));

const aiFormula = [
  "You are a MiniMax H3 Ref2VA director. Rewrite the supplied director brief as one complete H3 full-reference prompt.",
  "Return only this literal six-heading skeleton, including each colon: subject_definitions:, summary:, retention_analysis:, detailed_description:, overall_soundscape:, non_diegetic_music:. Put useful content beneath every heading and nothing before subject_definitions: or after the music section.",
  "Use the supplied reference manifest to define reusable content as <Subject N> and cite its image sources as <Picture N>. Never invent a reference or leave an unresolved Character, Prop, Location or Picture alias.",
  "The summary must begin with [reference generation] and summarise the event without reproducing complete dialogue. In retention_analysis, use one line per active subject in this exact shape: <Subject 1> (appears in [Shot 1]): fully_preserved - concise identity details. The only allowed relationship markers are fully_preserved, partially_preserved, attribute_transfer and weak_reference.",
  "Write the detailed_description in playback order. Begin with one or two concrete style sentences, then [Shot 1]. Later cuts, if genuinely needed, use a real numeric timestamp such as [Shot 2] At 00:03.000; never output MM or SS placeholders. Fit every action and line inside TARGET DURATION. Five seconds normally means one shot; ten seconds no more than two; fifteen seconds no more than three.",
  "For each shot state composition, subject position, visible action, camera behaviour, lighting, physical sound and the exact moment references apply. Prefer concrete directions over vague words such as cinematic or beautiful.",
  "Dialogue is a hard contract. Complete dialogue may appear exactly once and only in detailed_description. Copy the words and ordinary punctuation between the input quotation marks byte-for-byte, but do not copy quotation marks. Assign a stable speaker ID. Example: input 'Subject 1 says exactly \"Good morning.\"' must become '<Subject 1> (S1) says, <d>[English] Good morning.</d>'. The [English] token inside <d> is mandatory. Never use curly quotation marks, nest a subject label inside the speech tag, paraphrase, add words, or repeat complete dialogue in summary or soundscape. If there is no speech, do not invent any.",
  "overall_soundscape summarises ambience and physical sounds. non_diegetic_music describes audience-only music, or N/A when none was requested.",
  "Write in English, without Markdown fences, commentary or an introductory sentence. Aim for 350 to 500 words when the scene supports it, while always respecting the requested duration.",
].join("\n");

const aiState = {
  idea: "",
  formula: aiFormula,
  model: "qwen3vl_8b_fp8_scaled.safetensors",
  clip_type: "krea2",
  order: "wired",
  sep: "newline",
  seed: 2408240901,
  temperature: 0.45,
  max_length: 1536,
  top_k: 48,
  top_p: 0.9,
  min_p: 0.05,
  repetition_penalty: 1.08,
  presence_penalty: 0,
  do_sample: false,
  thinking: false,
  use_default_template: true,
  release_model: true,
  seed_mode: "random",
  idea_share: 0.36,
};

add(makeNode({
  id: 23,
  type: "PixaromaAIPrompt",
  pos: [1630, 500],
  size: [650, 700],
  title: "AI DIRECTOR — local Qwen; releases itself before H3",
  inputs: [
    input("clip", "CLIP", { shape: 7 }),
    input("image", "IMAGE", { shape: 7 }),
    input("video", "IMAGE", { shape: 7 }),
    input("audio", "AUDIO", { shape: 7 }),
    input("text", "STRING", { shape: 7 }),
  ],
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaAIPrompt", {
    aiPromptState: aiState,
  }),
  color: "#7A3E78",
}));

const manualPrompt = `subject_definitions:
<Subject 1> is the same brown-and-black goat defined jointly by <Picture 1>, <Picture 2>, and <Picture 3>, preserving its curved horns, dark facial stripe, brown coat, black lower legs, compact proportions, and natural animal anatomy.

summary:
[reference generation] The target video shows <Subject 1> walking toward the camera on a sunlit grassy hillside, stopping close to the lens, stamping one front hoof, looking directly forward, and giving one short natural bleat.

retention_analysis:
<Subject 1> (appears throughout [Shot 1]): fully_preserved - the goat's identity, horn shape, face markings, coat colours, body proportions, four-legged anatomy, and natural movement remain consistent with <Picture 1>, <Picture 2>, and <Picture 3>.

detailed_description:
The target video uses realistic live-action wildlife photography with warm late-afternoon sunlight, natural colour, and restrained depth of field.
[Shot 1] An eye-level medium tracking shot opens on <Subject 1>, the brown-and-black goat from <Picture 1>, <Picture 2>, and <Picture 3>, walking calmly toward the camera across a gently sloping grassy hillside. The camera moves smoothly backwards at the goat's walking pace while keeping its head, shoulders, horns, and front legs sharply framed. The goat's four legs carry its weight naturally; its coat shifts subtly with each step and a light breeze. Around 00:03.200, the camera settles into a locked close-medium composition as <Subject 1> stops, plants all four hooves, stamps its front-right hoof once against the earth, raises its head, and looks directly toward the lens. The hoof makes a soft compact impact in the grass. The goat gives one short, clean natural bleat, then closes its mouth and remains alert through the final frame. No human posture, speech, clothing, extra limbs, or anthropomorphic behaviour appears.

overall_soundscape:
Light wind moves through hillside grass with distant birds and restrained rural ambience. Natural hoof impacts accompany the approach, followed by one close hoof stamp and one short goat bleat.

non_diegetic_music:
N/A`;

promptNode(24, "MANUAL FULL H3 PROMPT — used only when AI is OFF", [1140, 1220], [1140, 660], manualPrompt);

add(makeNode({
  id: 25,
  type: "PixaromaSwitch",
  pos: [1140, 1920],
  size: [600, 110],
  title: "AI PROMPT MODE — OFF: Manual Full Prompt | ON: Build from Director Boxes",
  inputs: [
    input("input_1", "*"),
    input("input_2", "*"),
    input("input_3", "*"),
  ],
  outputs: [output("output", "STRING")],
  properties: pixProps("PixaromaSwitch", {
    switchState: {
      activeIndex: 2,
      labels: { "1": "OFF — Manual full H3 prompt", "2": "ON — AI Director" },
      visibleCount: 3,
    },
  }),
  color: "#f66744",
}));

add(makeNode({
  id: 26,
  type: "PixaromaShowText",
  pos: [1780, 1920],
  size: [500, 340],
  title: "FINAL H3 PROMPT MONITOR — inspect before a long run",
  inputs: [input("source", "*")],
  outputs: [output("text", "*")],
  properties: pixProps("PixaromaShowText"),
  widgets: [manualPrompt],
  color: "#2E7D32",
}));

const referenceFiles = [
  "img_00001_.png",
  "img_00002_.png",
  "img_00003_.png",
  "img_00004_.png",
  "img_00005_.png",
  "img_00006_.png",
];

for (let i = 0; i < 6; i += 1) {
  const loaderId = 30 + i;
  const gateId = 40 + i;
  const x = 40 + i * 570;
  add(makeNode({
    id: loaderId,
    type: "PixaromaLoadImageMini",
    pos: [x, 2430],
    size: [520, 420],
    title: `PICTURE ${i + 1} — replace with a character sheet, prop, vehicle or location`,
    outputs: [output("image", "IMAGE"), output("image_info", "PIX_IMAGE_INFO")],
    properties: pixProps("PixaromaLoadImageMini", {
      loadImageMiniState: { mode: "off" },
    }),
    widgets: [referenceFiles[i], "image", ""],
    color: "#B45574",
  }));
  add(makeNode({
    id: gateId,
    type: "H3OptionalImage",
    pos: [x, 2890],
    size: [520, 110],
    title: `USE PICTURE ${i + 1}${i < 3 ? " — ON" : " — OFF by default"}`,
    inputs: [input("image", "IMAGE", { shape: 7 })],
    outputs: [output("image", "IMAGE")],
    properties: { "Node name for S&R": "H3OptionalImage" },
    widgets: [i < 3],
    color: i < 3 ? "#2E7D32" : "#5D4037",
  }));
  connect(loaderId, 0, gateId, "image", "IMAGE");
}

add(makeNode({
  id: 50,
  type: "UNETLoader",
  pos: [2440, 500],
  size: [570, 90],
  title: "H3 Ref2VA diffusion model",
  outputs: [output("MODEL", "MODEL")],
  properties: coreProps("UNETLoader"),
  widgets: ["H3\\minimax_h3_ref2va_pruned_int8_convrot.safetensors", "default"],
  color: "#f66744",
}));

add(makeNode({
  id: 51,
  type: "CLIPLoader",
  pos: [2440, 630],
  size: [570, 125],
  title: "H3 conditioning encoder — not the AI Prompt model",
  outputs: [output("CLIP", "CLIP")],
  properties: coreProps("CLIPLoader"),
  widgets: ["qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", "minimax", "default"],
  color: "#f66744",
}));

add(makeNode({
  id: 52,
  type: "VAELoader",
  pos: [2440, 795],
  size: [570, 65],
  title: "H3 video VAE",
  outputs: [output("VAE", "VAE")],
  properties: coreProps("VAELoader"),
  widgets: ["minimax_h3_video_vae_fp16.safetensors"],
  color: "#f66744",
}));

add(makeNode({
  id: 53,
  type: "VAELoader",
  pos: [2440, 900],
  size: [570, 65],
  title: "H3 audio VAE",
  outputs: [output("VAE", "VAE")],
  properties: coreProps("VAELoader"),
  widgets: ["minimax_h3_audio_vae_fp32.safetensors"],
  color: "#f66744",
}));

add(makeNode({
  id: 54,
  type: "PixaromaSeed",
  pos: [2440, 1010],
  size: [570, 240],
  title: "SEED — shared and visible",
  outputs: [output("seed", "INT")],
  properties: pixProps("PixaromaSeed", {
    seedState: { seed: 2408240901, mode: "fixed", compact: false, digits: 16 },
  }),
  widgets: [{ seed: 2408240901, mode: "fixed", compact: false, digits: 16 }],
  color: "#14436c",
}));

const refInputs = [
  input("clip", "CLIP"),
  input("vae", "VAE"),
  input("audio_vae", "VAE"),
];
for (let i = 0; i < 6; i += 1) {
  refInputs.push(input(`ref_images.ref_image_${i}`, "IMAGE", { shape: 7, label: `ref_image_${i}` }));
}
refInputs.push(input("ref_images.ref_image_6", "IMAGE", { shape: 7, label: "ref_image_6" }));
refInputs.push(input("ref_videos.ref_video_0", "IMAGE", { shape: 7, label: "ref_video_0" }));
refInputs.push(input("ref_video_audios.ref_video_audio_0", "AUDIO", { shape: 7, label: "ref_video_audio_0" }));
refInputs.push(input("ref_audios.ref_audio_0", "AUDIO", { shape: 7, label: "ref_audio_0" }));
refInputs.push(input("prompt", "STRING", { widget: { name: "prompt" } }));
refInputs.push(input("width", "INT", { widget: { name: "width" } }));
refInputs.push(input("height", "INT", { widget: { name: "height" } }));
refInputs.push(input("length", "INT", { widget: { name: "length" } }));

add(makeNode({
  id: 55,
  type: "MiniMaxH3ReferenceToVideo",
  pos: [3060, 500],
  size: [590, 620],
  title: "H3 REF2VA — references + prompt + duration",
  inputs: refInputs,
  outputs: [output("positive", "CONDITIONING"), output("LATENT", "LATENT")],
  properties: coreProps("MiniMaxH3ReferenceToVideo"),
  widgets: ["", 864, 480, 124, "match"],
}));

add(makeNode({
  id: 56,
  type: "H3FreeTextEncoder",
  pos: [3060, 1160],
  size: [300, 90],
  title: "VRAM SAFETY — release H3 text encoder before sampling",
  inputs: [input("conditioning", "CONDITIONING"), input("clip", "CLIP")],
  outputs: [output("CONDITIONING", "CONDITIONING")],
  properties: { "Node name for S&R": "H3FreeTextEncoder" },
  color: "#355C7D",
}));

add(makeNode({
  id: 57,
  type: "ConditioningZeroOut",
  pos: [3400, 1160],
  size: [250, 90],
  title: "H3 negative conditioning",
  inputs: [input("conditioning", "CONDITIONING")],
  outputs: [output("CONDITIONING", "CONDITIONING")],
  properties: coreProps("ConditioningZeroOut"),
}));

add(makeNode({
  id: 58,
  type: "KSampler",
  pos: [3060, 1300],
  size: [590, 320],
  title: "GOLD SAMPLER — proven Pixaroma H3 settings",
  inputs: [
    input("model", "MODEL"),
    input("positive", "CONDITIONING"),
    input("negative", "CONDITIONING"),
    input("latent_image", "LATENT"),
    input("seed", "INT", { widget: { name: "seed" } }),
  ],
  outputs: [output("LATENT", "LATENT")],
  properties: coreProps("KSampler"),
  widgets: [2408240901, "fixed", 20, 1, "res_multistep", "simple", 1],
}));

add(makeNode({
  id: 59,
  type: "VAEDecode",
  pos: [3060, 1670],
  size: [280, 70],
  title: "Decode video frames",
  inputs: [input("samples", "LATENT"), input("vae", "VAE")],
  outputs: [output("IMAGE", "IMAGE")],
  properties: coreProps("VAEDecode"),
}));

add(makeNode({
  id: 60,
  type: "VAEDecodeAudio",
  pos: [3370, 1670],
  size: [280, 70],
  title: "Decode H3 audio",
  inputs: [input("samples", "LATENT"), input("vae", "VAE")],
  outputs: [output("AUDIO", "AUDIO")],
  properties: coreProps("VAEDecodeAudio"),
}));

add(makeNode({
  id: 61,
  type: "PixaromaRunTimer",
  pos: [2440, 1300],
  size: [570, 90],
  title: "RUN TIMER — H3 can take a while",
  properties: pixProps("PixaromaRunTimer", {
    runTimerState: { version: 1, color: "#f66744", decimals: 0, chime: true, sound: "", volume: 0 },
  }),
  color: "#f66744",
}));

add(makeNode({
  id: 70,
  type: "PixaromaSaveMp4",
  pos: [3800, 500],
  size: [1500, 1220],
  title: "FINAL VIDEO + AUDIO — preview here and save MP4",
  inputs: [
    input("video_frames", "IMAGE"),
    input("audio", "AUDIO", { shape: 7 }),
  ],
  properties: pixProps("PixaromaSaveMp4"),
  widgets: [24, "H3_Gold_Ref/%date:yyyy-MM-dd%/H3_Gold_%Seed Pixaroma.seed%", "save", false, ""],
  color: "#2E7D32",
}));

add(makeNode({
  id: 71,
  type: "PixaromaNote",
  pos: [3800, 1760],
  size: [1500, 460],
  title: "WHAT IS DELIBERATELY NOT IN VERSION 1",
  properties: pixProps("PixaromaNote", {
    ue_properties: { widget_ue_connectable: {}, version: "7.8", input_ue_unconnectable: {} },
  }),
  widgets: [JSON.stringify({
    version: 1,
    content: "<h2>Version 1 stays dependable</h2><p>No Blabbermouth integration, automatic casting, continuation, chained multishot, motion video, voice reference, retake, Turbo LoRA, upscale or repair branch is hidden here. Those become separate, reviewable additions only after this Ref2VA spine is accepted.</p><p><b>Gold principle:</b> change one thing at a time, keep the short 5-second test available, and preserve the prompt shown in the monitor with every accepted output.</p>",
    buttonColor: "#2E7D32",
    lineColor: "#2E7D32",
    width: 1500,
    height: 460,
    backgroundColor: "#2a2a2a",
  }), ""],
  color: "#2E7D32",
}));

connect(10, 0, 20, "text_1", "STRING");
connect(11, 0, 20, "text_2", "STRING");
connect(12, 0, 20, "text_3", "STRING");
connect(13, 0, 20, "text_4", "STRING");
connect(14, 1, 21, "input", "*");
connect(20, 0, 22, "text_1", "STRING");
connect(21, 0, 22, "text_2", "STRING");
connect(22, 0, 23, "text", "STRING");
connect(24, 0, 25, "input_1", "*");
connect(23, 0, 25, "input_2", "*");
connect(25, 0, 26, "source", "*");

connect(50, 0, 58, "model", "MODEL");
connect(51, 0, 55, "clip", "CLIP");
connect(51, 0, 56, "clip", "CLIP");
connect(52, 0, 55, "vae", "VAE");
connect(52, 0, 59, "vae", "VAE");
connect(53, 0, 55, "audio_vae", "VAE");
connect(53, 0, 60, "vae", "VAE");
connect(15, 0, 55, "width", "INT");
connect(15, 1, 55, "height", "INT");
connect(14, 0, 55, "length", "INT");
connect(26, 0, 55, "prompt", "STRING");
for (let i = 0; i < 6; i += 1) connect(40 + i, 0, 55, `ref_images.ref_image_${i}`, "IMAGE");
connect(55, 0, 56, "conditioning", "CONDITIONING");
connect(56, 0, 57, "conditioning", "CONDITIONING");
connect(56, 0, 58, "positive", "CONDITIONING");
connect(57, 0, 58, "negative", "CONDITIONING");
connect(55, 1, 58, "latent_image", "LATENT");
connect(54, 0, 58, "seed", "INT");
connect(58, 0, 59, "samples", "LATENT");
connect(58, 0, 60, "samples", "LATENT");
connect(59, 0, 70, "video_frames", "IMAGE");
connect(60, 0, 70, "audio", "AUDIO");

// Stable topological order is useful for reading API conversion diagnostics.
const orderById = [1, 2, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 26,
  30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44, 45,
  50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 70, 71];
orderById.forEach((id, index) => { byId.get(id).order = index; });

const workflow = {
  last_node_id: 71,
  last_link_id: nextLink - 1,
  nodes,
  links,
  groups: [],
  config: {},
  extra: {
    ds: { scale: 0.68, offset: [40, 60] },
    pixaromaGroups: [
      { id: "pg_h3_controls", title: "1 — DIRECTOR'S DESK — HUMAN INPUT", x: 0, y: 420, w: 1050, h: 1870, titleColor: "#B45574", bodyColor: "#38212a", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 20, folded: false, showLinks: true },
      { id: "pg_h3_prompt", title: "2 — PIXAROMA PROMPT WORKSHOP", x: 1100, y: 420, w: 1240, h: 1870, titleColor: "#7A3E78", bodyColor: "#312132", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 20, folded: false, showLinks: true },
      { id: "pg_h3_render", title: "3 — DEPENDABLE H3 REF2VA RENDER CORE", x: 2400, y: 420, w: 1300, h: 1870, titleColor: "#355C7D", bodyColor: "#1f2f3a", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 20, folded: false, showLinks: true },
      { id: "pg_h3_output", title: "4 — PREVIEW, AUDIO & SAVE", x: 3750, y: 420, w: 1650, h: 1870, titleColor: "#2E7D32", bodyColor: "#1d3020", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 20, folded: false, showLinks: true },
      { id: "pg_h3_refs", title: "5 — REFERENCE CAST — ENABLE CONSECUTIVELY FROM PICTURE 1", x: 0, y: 2360, w: 3440, h: 690, titleColor: "#B45574", bodyColor: "#38212a", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 20, folded: false, showLinks: true },
    ],
  },
  version: 0.4,
};

function assertGeometry(graph) {
  const groups = graph.extra.pixaromaGroups;
  const exempt = new Set([1, 2]);
  const overlaps = [];
  const breaches = [];

  for (const node of graph.nodes) {
    if (exempt.has(node.id)) continue;
    const [x, y] = node.pos;
    const [w, h] = node.size;
    const owners = groups.filter((group) => x >= group.x && y >= group.y && x + w <= group.x + group.w && y + h <= group.y + group.h);
    if (owners.length !== 1) breaches.push({ id: node.id, title: node.title, owners: owners.map((owner) => owner.id) });
  }

  for (let i = 0; i < graph.nodes.length; i += 1) {
    const a = graph.nodes[i];
    if (exempt.has(a.id)) continue;
    for (let j = i + 1; j < graph.nodes.length; j += 1) {
      const b = graph.nodes[j];
      if (exempt.has(b.id)) continue;
      const intersects = a.pos[0] < b.pos[0] + b.size[0]
        && a.pos[0] + a.size[0] > b.pos[0]
        && a.pos[1] < b.pos[1] + b.size[1]
        && a.pos[1] + a.size[1] > b.pos[1];
      if (intersects) overlaps.push([a.id, b.id]);
    }
  }

  if (breaches.length || overlaps.length) {
    throw new Error(`Geometry failure: ${JSON.stringify({ breaches, overlaps }, null, 2)}`);
  }
}

function assertGraph(graph) {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== graph.nodes.length) throw new Error("Duplicate node IDs");
  for (const [id, from, outIndex, to, inIndex] of graph.links) {
    if (!ids.has(from) || !ids.has(to)) throw new Error(`Link ${id} references missing node`);
    if (!graph.nodes.find((node) => node.id === from).outputs[outIndex]) throw new Error(`Link ${id} has missing output`);
    if (!graph.nodes.find((node) => node.id === to).inputs[inIndex]) throw new Error(`Link ${id} has missing input`);
  }
  const ai = graph.nodes.find((node) => node.id === 23);
  const promptSwitch = graph.nodes.find((node) => node.id === 25);
  if (ai.properties.aiPromptState.release_model !== true) throw new Error("AI model release must remain enabled");
  if (promptSwitch.properties.switchState.activeIndex !== 2) throw new Error("AI Director must be the documented default");
  assertGeometry(graph);
}

const smokePrompt = manualPrompt;
const smoke = {
  "1": { class_type: "UNETLoader", inputs: { unet_name: "H3\\minimax_h3_ref2va_pruned_int8_convrot.safetensors", weight_dtype: "default" } },
  "2": { class_type: "CLIPLoader", inputs: { clip_name: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", type: "minimax", device: "default" } },
  "3": { class_type: "VAELoader", inputs: { vae_name: "minimax_h3_video_vae_fp16.safetensors" } },
  "4": { class_type: "VAELoader", inputs: { vae_name: "minimax_h3_audio_vae_fp32.safetensors" } },
  "5": { class_type: "LoadImage", inputs: { image: "img_00001_.png" } },
  "6": { class_type: "LoadImage", inputs: { image: "img_00002_.png" } },
  "7": { class_type: "LoadImage", inputs: { image: "img_00003_.png" } },
  "8": {
    class_type: "MiniMaxH3ReferenceToVideo",
    inputs: {
      clip: ["2", 0], vae: ["3", 0], audio_vae: ["4", 0], prompt: smokePrompt,
      width: 608, height: 352, length: 124, ref_image_size: "match",
      "ref_images.ref_image_0": ["5", 0], "ref_images.ref_image_1": ["6", 0], "ref_images.ref_image_2": ["7", 0],
    },
  },
  "9": { class_type: "H3FreeTextEncoder", inputs: { conditioning: ["8", 0], clip: ["2", 0] } },
  "10": { class_type: "ConditioningZeroOut", inputs: { conditioning: ["9", 0] } },
  "11": { class_type: "KSampler", inputs: { model: ["1", 0], positive: ["9", 0], negative: ["10", 0], latent_image: ["8", 1], seed: 2408240901, steps: 6, cfg: 1, sampler_name: "res_multistep", scheduler: "simple", denoise: 1 } },
  "12": { class_type: "VAEDecode", inputs: { samples: ["11", 0], vae: ["3", 0] } },
  "13": { class_type: "VAEDecodeAudio", inputs: { samples: ["11", 0], vae: ["4", 0] } },
  "14": { class_type: "PixaromaSaveMp4", inputs: { video_frames: ["12", 0], audio: ["13", 0], fps: 24, filename_prefix: "H3_Gold_Ref_Smoke/H3_Goat_2408240901", save_mode: "save", trim_to_audio: false } },
};

const aiSmokeBrief = `SCENE / ACTION:
The brown-and-black goat defined by Pictures 1, 2 and 3 walks towards the camera, stamps one front hoof and speaks the supplied dialogue. Keep all anatomy natural and non-human.

REFERENCE MANIFEST:
Picture 1 = Subject 1 front three-quarter identity view. Picture 2 = Subject 1 side identity view. Picture 3 = Subject 1 alternate front identity view. All three pictures jointly define the same goat.

DIALOGUE:
Subject 1 says exactly "Lovely weather for climbing."

CAMERA:
One eye-level tracking shot, smoothly moving backwards, then settling as the goat stops.

SOUND / MUSIC:
Light wind, distant birds, hoof impacts and one natural goat voice. No music.

TARGET DURATION: 5 seconds.`;

const aiSmoke = {
  "1": {
    class_type: "PixaromaAIPrompt",
    inputs: {
      text: aiSmokeBrief,
      AIPromptState: JSON.stringify({ ...aiState, seed_mode: undefined, idea_share: undefined }),
    },
  },
};

const acceptance = structuredClone(smoke);
acceptance["8"].inputs.width = 864;
acceptance["8"].inputs.height = 480;
acceptance["11"].inputs.steps = 20;
acceptance["14"].inputs.filename_prefix = "H3_Gold_Ref_Acceptance/H3_Goat_2408240901";

assertGraph(workflow);
for (const target of [repoWorkflow, liveWorkflow, smokePath, aiSmokePath, acceptancePath]) fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(repoWorkflow, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
fs.writeFileSync(liveWorkflow, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
fs.writeFileSync(smokePath, `${JSON.stringify(smoke, null, 2)}\n`, "utf8");
fs.writeFileSync(aiSmokePath, `${JSON.stringify(aiSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(acceptancePath, `${JSON.stringify(acceptance, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  repoWorkflow,
  liveWorkflow,
  smokePath,
  aiSmokePath,
  acceptancePath,
  nodeCount: nodes.length,
  linkCount: links.length,
  groups: workflow.extra.pixaromaGroups.length,
  geometry: "passed",
}, null, 2));
