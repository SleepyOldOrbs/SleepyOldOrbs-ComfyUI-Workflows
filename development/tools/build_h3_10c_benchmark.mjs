import { requireComfyRoot } from "./local_paths.cjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const workflowName = "10C H3 Matched First Frame Benchmark Lab.json";
const snapshotName = "H3_Seamless_Chain_CORE - UPSTREAM 2.6.5 - 2026-08-25.json";
const expectedSnapshotSha256 = "efb0dbbc2c025219b3858c8457e1898ce88e8dc8d43d160d2d4c0a5e3269e9a9";
const expectedGoldSha256 = "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";

const workflowRoot = path.join(repoRoot, "workflows", "Codex MCP Demos");
const snapshotPath = path.join(
  workflowRoot,
  "Backups",
  "10C H3 Matched First Frame Benchmark",
  snapshotName,
);
const liveSnapshotPath = path.join(
  liveRoot,
  "Backups",
  "10C H3 Matched First Frame Benchmark",
  snapshotName,
);
const repoWorkflowPath = path.join(workflowRoot, workflowName);
const liveWorkflowPath = path.join(liveRoot, workflowName);
const goldPath = path.join(
  workflowRoot,
  "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json",
);
const baselineSourcePath = path.join(
  repoRoot,
  "tests",
  "h3_benchmark_workflow10_baseline_api.json",
);
const workflow10ApiPath = path.join(
  repoRoot,
  "tests",
  "h3_m2_workflow10_first_frame_api.json",
);
const multishotApiPath = path.join(
  repoRoot,
  "tests",
  "h3_m2_multishot_first_frame_api.json",
);

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function requireHash(filePath, expected, label) {
  const bytes = fs.readFileSync(filePath);
  const actual = sha256(bytes);
  if (actual !== expected) {
    throw new Error(`${label} changed: expected ${expected}, found ${actual}`);
  }
  return bytes;
}

const snapshotBytes = requireHash(
  snapshotPath,
  expectedSnapshotSha256,
  "Protected Multishot CORE snapshot",
);
requireHash(goldPath, expectedGoldSha256, "Protected Gold");

fs.mkdirSync(path.dirname(liveSnapshotPath), { recursive: true });
if (fs.existsSync(liveSnapshotPath)) {
  requireHash(liveSnapshotPath, expectedSnapshotSha256, "Live Multishot CORE snapshot");
} else {
  fs.writeFileSync(liveSnapshotPath, snapshotBytes);
}

const operatorPrompt = [
  "integrated_multimodal_description: [Shot 1] Live-action, cinematic, the brown-and-black goat begins in the position and composition established by the opening frame on a sunlit grassy hillside. The camera tracks gently backward at slow speed while the goat walks forward with natural four-legged movement, turns its head briefly toward the lens, then returns its gaze along the path. Preserve its horn shape, dark facial stripe, coat colours, body proportions, lighting and hillside environment throughout the shot.",
  "",
  "overall_soundscape: Light wind moves through hillside grass with distant birds and soft natural hoof impacts.",
  "",
  "non_diegetic_music: N/A",
].join("\n");
const alignmentHeader = "For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.\n\n";
const effectivePrompt = `${alignmentHeader}${operatorPrompt}`;
const settings = {
  width: 608,
  height: 352,
  frames: 124,
  steps: 6,
  cfg: 1.0,
  sampler: "res_multistep",
  scheduler: "simple",
  seed: 2408241001,
  model: String.raw`H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`,
  clip: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
  videoVae: "minimax_h3_video_vae_fp16.safetensors",
  audioVae: "minimax_h3_audio_vae_fp32.safetensors",
  inputImage: "H3_Long_Form_Test_Start.png",
};

const workflow = JSON.parse(snapshotBytes.toString("utf8"));
workflow.nodes = workflow.nodes.filter((value) => value.id <= 11);
workflow.links = [];
workflow.last_link_id = 0;
workflow.last_node_id = 20;
workflow.extra = {
  ...(workflow.extra ?? {}),
  h3_m2_comparison: {
    purpose: "Matched workflow-10 versus upstream Multishot first-frame evidence",
    upstream_snapshot_sha256: expectedSnapshotSha256,
    gold_sha256: expectedGoldSha256,
    operator_prompt: operatorPrompt,
    effective_prompt: effectivePrompt,
    settings,
  },
};

const byId = new Map(workflow.nodes.map((value) => [value.id, value]));

function node(id) {
  const value = byId.get(id);
  if (!value) throw new Error(`10C template is missing node ${id}`);
  return value;
}

function addNode(value) {
  if (byId.has(value.id)) throw new Error(`Duplicate 10C node ${value.id}`);
  workflow.nodes.push(value);
  byId.set(value.id, value);
}

function input(name, type, widget = false) {
  return { name, type, link: null, ...(widget ? { widget: { name } } : {}) };
}

function output(name, type) {
  return { name, type, links: [] };
}

function resetLinks(value) {
  for (const candidate of value.inputs ?? []) candidate.link = null;
  for (const candidate of value.outputs ?? []) candidate.links = [];
}

for (const value of workflow.nodes) resetLinks(value);

function connect(fromId, outputIndex, toId, inputName, type) {
  const from = node(fromId);
  const to = node(toId);
  const targetIndex = to.inputs.findIndex((candidate) => candidate.name === inputName);
  if (targetIndex < 0) throw new Error(`Node ${toId} has no ${inputName} input`);
  const source = from.outputs[outputIndex];
  if (!source) throw new Error(`Node ${fromId} has no output ${outputIndex}`);
  const linkId = workflow.last_link_id + 1;
  workflow.last_link_id = linkId;
  workflow.links.push([linkId, fromId, outputIndex, toId, targetIndex, type]);
  to.inputs[targetIndex].link = linkId;
  source.links ??= [];
  source.links.push(linkId);
}

node(1).title = "10C START HERE — queue this matched comparison once unchanged";
node(1).pos = [-2740, -640];
node(1).size = [580, 430];
node(1).widgets_values = [
  "M2 MATCHED FIRST-FRAME BENCHMARK\n\nThis graph uses the installed upstream H3MultishotSampler. It matches the retained workflow-10 comparison graph on opening image, operator prompt, FL2VA model, seed, native size, frame count, steps, CFG-equivalent basic guider, sampler and scheduler.\n\nQueue once without changing settings. The video saves under output/video/H3_M2_COMPARISON/ and the local benchmark record waits for the final-frame handoff before it is appended. No Motion Context package is used.",
];
node(1).color = "#355C7D";
node(1).bgcolor = "#2a2a2a";

node(2).pos = [-1220, -640];
node(2).size = [920, 240];
node(2).widgets_values = [
  settings.width,
  settings.height,
  settings.frames,
  settings.steps,
  settings.sampler,
  settings.scheduler,
];
node(2).color = "#322";

node(3).pos = [-1940, -640];
node(3).size = [520, 100];
node(3).widgets_values = [settings.model, 0.0];
node(4).pos = [-1940, -500];
node(4).size = [520, 120];
node(4).widgets_values = [settings.clip, "minimax", "(auto)"];
node(5).pos = [-1940, -330];
node(5).size = [520, 240];
node(5).widgets_values = ["None", 0.0, "None", 1.0, "None", 1.0, "None", 1.0];
node(6).pos = [-1940, -40];
node(6).size = [520, 100];
node(6).widgets_values = [settings.videoVae];
node(7).pos = [-1940, 100];
node(7).size = [520, 100];
node(7).widgets_values = [settings.audioVae];

node(8).title = "UPSTREAM MULTISHOT FIRST-FRAME SAMPLER — one matched shot";
node(8).pos = [-100, -640];
node(8).size = [880, 900];
node(8).widgets_values = [
  operatorPrompt,
  1,
  settings.width,
  settings.height,
  settings.frames,
  settings.seed,
  "fixed",
  settings.steps,
  false,
  settings.sampler,
  settings.scheduler,
  false,
  1.0,
  false,
];
node(8).properties ??= {};
node(8).properties.h3_widget_values = {
  script: operatorPrompt,
  shot_count: 1,
  width: settings.width,
  height: settings.height,
  frames_per_shot: settings.frames,
  seed: settings.seed,
  control_after_generate: "fixed",
  steps: settings.steps,
  seed_per_shot: false,
  sampler_name: settings.sampler,
  scheduler: settings.scheduler,
  self_anchor_voice: false,
  output_scale: 1.0,
  save_every_shot: false,
};
if (!node(8).inputs.some((candidate) => candidate.name === "seed")) {
  node(8).inputs.push(input("seed", "INT", true));
}

node(9).title = "WHAT IS MATCHED";
node(9).pos = [-100, 310];
node(9).size = [880, 300];
node(9).widgets_values = [
  "Both engines receive the same goat opening frame and operator prompt. The stock workflow-10 graph receives the documented I2VA alignment line explicitly; Multishot prepends that same line internally. Both use FL2VA, seed 2408241001, 608x352, 124 frames, 6 steps, CFG/basic-guider 1, res_multistep and simple. Judge the two completed native MP4s; timing and hashes are recorded automatically.",
];

node(10).pos = [980, -640];
node(10).size = [520, 150];
node(10).widgets_values = [24.0, 8, "sRGB"];
node(11).pos = [980, -440];
node(11).size = [520, 140];
node(11).widgets_values = ["video/H3_M2_COMPARISON/multishot_first_frame", "auto", "auto"];

addNode({
  id: 14,
  type: "LoadImage",
  pos: [-2740, -150],
  size: [580, 430],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [],
  outputs: [output("IMAGE", "IMAGE"), output("MASK", "MASK")],
  title: "MATCHED OPENING FRAME — do not change for the M2 comparison",
  properties: { "Node name for S&R": "LoadImage", cnr_id: "comfy-core", ver: "0.33.0" },
  widgets_values: [settings.inputImage, "image"],
  color: "#B45574",
  bgcolor: "#2a2a2a",
});

addNode({
  id: 15,
  type: "ImageScale",
  pos: [-2740, 330],
  size: [580, 150],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [input("image", "IMAGE"), input("width", "INT", true), input("height", "INT", true)],
  outputs: [output("IMAGE", "IMAGE")],
  title: "MATCH INPUT TO THE SHARED NATIVE CANVAS",
  properties: { "Node name for S&R": "ImageScale", cnr_id: "comfy-core", ver: "0.33.0" },
  widgets_values: ["lanczos", settings.width, settings.height, "disabled"],
  color: "#355C7D",
  bgcolor: "#2a2a2a",
});

addNode({
  id: 16,
  type: "CodexH3BenchmarkStart",
  pos: [-1220, -350],
  size: [920, 700],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [
    input("project", "STRING", true), input("engine", "STRING", true),
    input("model", "STRING", true), input("lora", "STRING", true),
    input("profile", "STRING", true), input("native_width", "INT", true),
    input("native_height", "INT", true), input("delivery_width", "INT", true),
    input("delivery_height", "INT", true), input("frame_count", "INT", true),
    input("steps", "INT", true), input("cfg", "FLOAT", true),
    input("sampler", "STRING", true), input("scheduler", "STRING", true),
    input("seed", "INT", true),
  ],
  outputs: [output("benchmark_token", "H3_BENCHMARK_TOKEN"), output("render_seed", "INT")],
  title: "BENCHMARK START — exact matched settings on the sampler seed path",
  properties: { "Node name for S&R": "CodexH3BenchmarkStart" },
  widgets_values: [
    "H3 M2 Multishot First Frame", "h3-multishot-first-frame", settings.model,
    "(none)", "NATIVE — matched 1.0x", settings.width, settings.height,
    settings.width, settings.height, settings.frames, settings.steps, settings.cfg,
    settings.sampler, settings.scheduler, settings.seed,
  ],
  color: "#355C7D",
  bgcolor: "#2a2a2a",
});

addNode({
  id: 17,
  type: "H3LastFrame",
  pos: [980, -250],
  size: [520, 100],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [input("images", "IMAGE")],
  outputs: [output("IMAGE", "IMAGE")],
  title: "EXTRACT THE STABLE NATIVE HANDOFF",
  properties: { "Node name for S&R": "H3LastFrame" },
  widgets_values: [],
  color: "#355C7D",
  bgcolor: "#2a2a2a",
});

addNode({
  id: 18,
  type: "CodexH3ContinuationStore",
  pos: [980, -100],
  size: [520, 140],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [input("images", "IMAGE"), input("slot", "STRING", true)],
  outputs: [output("handoff_frame", "IMAGE"), output("saved_status", "STRING")],
  title: "SAVE MATCHED HANDOFF FOR HASHED EVIDENCE",
  properties: { "Node name for S&R": "CodexH3ContinuationStore" },
  widgets_values: ["h3_m2_multishot_first_frame"],
  color: "#355C7D",
  bgcolor: "#2a2a2a",
});

addNode({
  id: 19,
  type: "CodexH3BenchmarkRecorder",
  pos: [980, 100],
  size: [1180, 420],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [
    input("token", "H3_BENCHMARK_TOKEN"), input("output_path", "STRING", true),
    input("completion_state", "COMBO", true), input("peak_vram_mb", "FLOAT", true),
    input("completion_signal", "STRING"),
  ],
  outputs: [output("status", "STRING"), output("record_json", "STRING"), output("manifest_path", "STRING")],
  title: "BENCHMARK RECORDER — atomic JSONL after the stable handoff exists",
  properties: { "Node name for S&R": "CodexH3BenchmarkRecorder" },
  widgets_values: [
    "H3_Long_Form/_auto_chain/h3_m2_multishot_first_frame.png",
    "auto",
    0.0,
  ],
  color: "#2E7D32",
  bgcolor: "#2a2a2a",
});

addNode({
  id: 20,
  type: "PixaromaShowText",
  pos: [980, 570],
  size: [1180, 180],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [input("source", "*")],
  outputs: [output("text", "STRING")],
  title: "BENCHMARK STATUS — recorded, cached, or duplicate",
  properties: { "Node name for S&R": "PixaromaShowText", cnr_id: "ComfyUI-Pixaroma" },
  widgets_values: ["Benchmark status appears after the matched lab run."],
  color: "#2E7D32",
  bgcolor: "#2a2a2a",
});

connect(3, 0, 5, "model", "MODEL");
connect(5, 0, 8, "model", "MODEL");
connect(4, 0, 8, "clip", "CLIP");
connect(6, 0, 8, "video_vae", "VAE");
connect(7, 0, 8, "audio_vae", "VAE");
connect(14, 0, 15, "image", "IMAGE");
connect(2, 0, 15, "width", "INT");
connect(2, 1, 15, "height", "INT");
connect(15, 0, 8, "start_image", "IMAGE");
connect(2, 0, 8, "width", "INT");
connect(2, 1, 8, "height", "INT");
connect(2, 2, 8, "frames_per_shot", "INT");
connect(2, 3, 8, "steps", "INT");
connect(2, 4, 8, "sampler_override", "STRING");
connect(2, 5, 8, "scheduler_override", "STRING");
connect(2, 0, 16, "native_width", "INT");
connect(2, 1, 16, "native_height", "INT");
connect(2, 2, 16, "frame_count", "INT");
connect(2, 3, 16, "steps", "INT");
connect(16, 1, 8, "seed", "INT");
connect(8, 0, 10, "images", "IMAGE");
connect(8, 1, 10, "audio", "AUDIO");
connect(10, 0, 11, "video", "VIDEO");
connect(8, 0, 17, "images", "IMAGE");
connect(17, 0, 18, "images", "IMAGE");
connect(16, 0, 19, "token", "H3_BENCHMARK_TOKEN");
connect(18, 1, 19, "completion_signal", "STRING");
connect(19, 0, 20, "source", "*");

workflow.groups = [
  { title: "1 — READ ME & MATCHED INPUT", bounding: [-2800, -700, 700, 1600], color: "#8154a1", font_size: 24 },
  { title: "2 — INSTALLED MODELS", bounding: [-2000, -700, 650, 1600], color: "#3f5159", font_size: 24 },
  { title: "3 — MATCHED SETTINGS & BENCHMARK START", bounding: [-1280, -700, 1040, 1600], color: "#b06634", font_size: 24 },
  { title: "4 — UPSTREAM MULTISHOT FIRST-FRAME ENGINE", bounding: [-160, -700, 1000, 2000], color: "#A88", font_size: 24 },
  { title: "5 — OUTPUT & LOCAL EVIDENCE", bounding: [920, -700, 1320, 2000], color: "#3f8e5f", font_size: 24 },
];

function assertGeometry() {
  const rectangles = workflow.nodes.map((value) => ({
    id: value.id,
    x: value.pos[0],
    y: value.pos[1],
    width: value.size[0],
    height: value.size[1],
  }));
  const overlaps = [];
  for (let i = 0; i < rectangles.length; i += 1) {
    for (let j = i + 1; j < rectangles.length; j += 1) {
      const a = rectangles[i];
      const b = rectangles[j];
      if (a.x < b.x + b.width && a.x + a.width > b.x
        && a.y < b.y + b.height && a.y + a.height > b.y) {
        overlaps.push([a.id, b.id]);
      }
    }
  }
  const breaches = rectangles.filter((value) => {
    const owners = workflow.groups.filter((group) => {
      const [x, y, width, height] = group.bounding;
      return value.x >= x && value.y >= y
        && value.x + value.width <= x + width
        && value.y + value.height <= y + height;
    });
    return owners.length !== 1;
  }).map((value) => value.id);
  if (overlaps.length || breaches.length) {
    throw new Error(`10C geometry failure: ${JSON.stringify({ overlaps, breaches })}`);
  }
}

assertGeometry();

const workflow10Api = JSON.parse(fs.readFileSync(baselineSourcePath, "utf8"));
delete workflow10Api["6"];
delete workflow10Api["8"];
delete workflow10Api["9"].inputs.last_frame;
workflow10Api["9"].inputs.prompt = effectivePrompt;
workflow10Api["15"].inputs.filename_prefix = "H3_M2_Comparison/workflow10_first_frame";
workflow10Api["17"].inputs.filename_prefix = "H3_M2_Comparison/workflow10_first_frame_HANDOFF";
workflow10Api["18"].inputs.profile = "NATIVE — 1.0x (fastest)";
workflow10Api["19"].inputs = {
  project: "H3 M2 Workflow 10 First Frame",
  engine: "workflow-10-first-frame",
  model: settings.model,
  lora: "(none)",
  profile: "NATIVE — matched 1.0x",
  native_width: settings.width,
  native_height: settings.height,
  delivery_width: settings.width,
  delivery_height: settings.height,
  frame_count: settings.frames,
  steps: settings.steps,
  cfg: settings.cfg,
  sampler: settings.sampler,
  scheduler: settings.scheduler,
  seed: settings.seed,
};
workflow10Api["20"].inputs.slot = "h3_m2_workflow10_first_frame";
workflow10Api["21"].inputs.output_path = "H3_Long_Form/_auto_chain/h3_m2_workflow10_first_frame.png";

const multishotApi = {
  "1": {
    class_type: "H3ModelLoaderAny",
    inputs: { model_name: settings.model, activation_reserve_gb: 0.0 },
  },
  "2": {
    class_type: "H3ClipLoaderAny",
    inputs: { clip_name: settings.clip, type: "minimax", mmproj_name: "(auto)" },
  },
  "3": {
    class_type: "H3LoraStack",
    inputs: {
      model: ["1", 0],
      lora_1: "None", strength_1: 0.0,
      lora_2: "None", strength_2: 1.0,
      lora_3: "None", strength_3: 1.0,
      lora_4: "None", strength_4: 1.0,
    },
  },
  "4": { class_type: "VAELoader", inputs: { vae_name: settings.videoVae } },
  "5": { class_type: "VAELoader", inputs: { vae_name: settings.audioVae } },
  "6": { class_type: "LoadImage", inputs: { image: settings.inputImage } },
  "7": {
    class_type: "ImageScale",
    inputs: {
      image: ["6", 0], upscale_method: "lanczos",
      width: settings.width, height: settings.height, crop: "disabled",
    },
  },
  "8": {
    class_type: "CodexH3BenchmarkStart",
    inputs: {
      project: "H3 M2 Multishot First Frame",
      engine: "h3-multishot-first-frame",
      model: settings.model,
      lora: "(none)",
      profile: "NATIVE — matched 1.0x",
      native_width: settings.width,
      native_height: settings.height,
      delivery_width: settings.width,
      delivery_height: settings.height,
      frame_count: settings.frames,
      steps: settings.steps,
      cfg: settings.cfg,
      sampler: settings.sampler,
      scheduler: settings.scheduler,
      seed: settings.seed,
    },
  },
  "9": {
    class_type: "H3MultishotSampler",
    inputs: {
      model: ["3", 0], clip: ["2", 0], video_vae: ["4", 0], audio_vae: ["5", 0],
      script: operatorPrompt, shot_count: 1,
      width: settings.width, height: settings.height,
      frames_per_shot: settings.frames, seed: ["8", 1], steps: settings.steps,
      seed_per_shot: false, start_image: ["7", 0],
      sampler_name: settings.sampler, scheduler: settings.scheduler,
      self_anchor_voice: false, output_scale: 1.0, save_every_shot: false,
    },
  },
  "10": {
    class_type: "CreateVideo",
    inputs: { images: ["9", 0], audio: ["9", 1], fps: 24.0, bit_depth: 8, color_space: "sRGB" },
  },
  "11": {
    class_type: "SaveVideo",
    inputs: {
      video: ["10", 0], filename_prefix: "video/H3_M2_COMPARISON/multishot_first_frame",
      format: "auto", "format.codec": "auto", codec: "auto",
    },
  },
  "12": { class_type: "H3LastFrame", inputs: { images: ["9", 0] } },
  "13": {
    class_type: "CodexH3ContinuationStore",
    inputs: { images: ["12", 0], slot: "h3_m2_multishot_first_frame" },
  },
  "14": {
    class_type: "CodexH3BenchmarkRecorder",
    inputs: {
      token: ["8", 0],
      output_path: "H3_Long_Form/_auto_chain/h3_m2_multishot_first_frame.png",
      completion_state: "auto", peak_vram_mb: 0.0,
      completion_signal: ["13", 1],
    },
  },
};

for (const outputPath of [repoWorkflowPath, liveWorkflowPath]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(outputPath);
}
fs.writeFileSync(workflow10ApiPath, `${JSON.stringify(workflow10Api, null, 2)}\n`);
fs.writeFileSync(multishotApiPath, `${JSON.stringify(multishotApi, null, 2)}\n`);
console.log(workflow10ApiPath);
console.log(multishotApiPath);
console.log(`10C SHA-256: ${sha256(fs.readFileSync(repoWorkflowPath))}`);
console.log(`Gold SHA-256: ${expectedGoldSha256}`);
