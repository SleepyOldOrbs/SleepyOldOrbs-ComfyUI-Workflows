import { requireComfyRoot } from "./local_paths.cjs";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const workflowName = "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json";
const initialBackupName = "10 H3 LONG FORM - INITIAL VALIDATED - 2026-08-24.json";
const preAutoChainBackupName = "10 H3 LONG FORM - BEFORE AUTO CHAIN - 2026-08-24.json";
const preQualityBackupName = "10 H3 LONG FORM - BEFORE QUALITY PROFILES - 2026-08-24.json";
const preQualityUserStateBackupName = "10 H3 LONG FORM - BEFORE QUALITY PROFILES - LIVE USER SETTINGS - 2026-08-24.json";
const repoWorkflow = path.join(repoRoot, "workflows", "Codex MCP Demos", workflowName);
const liveWorkflow = path.join(liveRoot, workflowName);
const repoInitialBackup = path.join(repoRoot, "workflows", "Codex MCP Demos", "Backups", "10 H3 Long Form", initialBackupName);
const liveInitialBackup = path.join(liveRoot, "Backups", "10 H3 Long Form", initialBackupName);
const repoPreAutoChainBackup = path.join(repoRoot, "workflows", "Codex MCP Demos", "Backups", "10 H3 Long Form", preAutoChainBackupName);
const livePreAutoChainBackup = path.join(liveRoot, "Backups", "10 H3 Long Form", preAutoChainBackupName);
const repoPreQualityBackup = path.join(repoRoot, "workflows", "Codex MCP Demos", "Backups", "10 H3 Long Form", preQualityBackupName);
const livePreQualityBackup = path.join(liveRoot, "Backups", "10 H3 Long Form", preQualityBackupName);
const repoPreQualityUserStateBackup = path.join(repoRoot, "workflows", "Codex MCP Demos", "Backups", "10 H3 Long Form", preQualityUserStateBackupName);
const livePreQualityUserStateBackup = path.join(liveRoot, "Backups", "10 H3 Long Form", preQualityUserStateBackupName);
const promptSmokePath = path.join(repoRoot, "tests", "h3_long_form_prompt_smoke_api.json");
const firstOnlyPromptSmokePath = path.join(repoRoot, "tests", "h3_long_form_first_only_prompt_smoke_api.json");
const renderSmokePath = path.join(repoRoot, "tests", "h3_long_form_render_smoke_api.json");
const autoChainStoreSmokePath = path.join(repoRoot, "tests", "h3_auto_chain_store_smoke_api.json");
const autoChainLoadSmokePath = path.join(repoRoot, "tests", "h3_auto_chain_load_smoke_api.json");
const autoChainManualSmokePath = path.join(repoRoot, "tests", "h3_auto_chain_manual_smoke_api.json");
const qualityNativeSmokePath = path.join(repoRoot, "tests", "h3_quality_native_smoke_api.json");
const qualityBalancedSmokePath = path.join(repoRoot, "tests", "h3_quality_balanced_smoke_api.json");
const qualityBenchmark864Path = path.join(repoRoot, "tests", "h3_quality_benchmark_native_864x480_api.json");
const qualityBenchmark960Path = path.join(repoRoot, "tests", "h3_quality_benchmark_native_960x544_api.json");
const qualityBenchmark1056Path = path.join(repoRoot, "tests", "h3_quality_benchmark_native_1056x608_api.json");
const qualityTurbo8Path = path.join(repoRoot, "tests", "h3_quality_benchmark_turbo_960x544_8step_api.json");
const qualityTurbo12Path = path.join(repoRoot, "tests", "h3_quality_benchmark_turbo_960x544_12step_api.json");

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

const input = (name, type, extra = {}) => ({ name, type, link: null, ...extra });
const output = (name, type) => ({ name, type, links: [] });

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
}

const labelJson = JSON.stringify({
  text: "10 GOLD STANDARD — MiniMax H3 Long Form Shot Builder",
  fontSize: 44,
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

const startNote = [
  "<h2>ONE SHORT SHOT PER RUN — repeat it to build a longer sequence</h2>",
  "<ol>",
  "<li>Load a manual opening image. Leave AUTO CHAIN off to use it directly, or turn AUTO CHAIN on beside the handoff controls.</li>",
  "<li>Type or dictate the action, camera and dialogue in Video Prompt Pixaroma. The 5-second setting is the safest starting point.</li>",
  "<li>Leave USE ENDING FRAME off for an open continuation. Turn it on only when the shot must land on a planned keyframe.</li>",
  "<li>Choose delivery quality: BALANCED RTX 1.5× is the measured everyday default; NATIVE is exact and fastest.</li>",
  "<li>Run. With AUTO CHAIN on, every later queued run reads the final frame saved by the run immediately before it — no manual reloading.</li>",
  "</ol>",
  "<p><b>Reset or change projects:</b> turn AUTO CHAIN off, load the new manual opening frame and run once. Give separate films different slot names. Automatic chaining is convenient but can compound drift, so retain and review the separate MP4 and HANDOFF files.</p>",
].join("");

add(makeNode({
  id: 1,
  type: "PixaromaLabel",
  pos: [0, 0],
  size: [4260, 92],
  title: "10 GOLD STANDARD — MiniMax H3 Long Form Shot Builder",
  properties: pixProps("PixaromaLabel"),
  widgets: [labelJson],
  color: "#f66744",
}));

add(makeNode({
  id: 2,
  type: "PixaromaNote",
  pos: [0, 120],
  size: [4260, 260],
  title: "START HERE — THE FIVE-STEP LOOP",
  properties: pixProps("PixaromaNote", {
    ue_properties: { widget_ue_connectable: {}, version: "7.8", input_ue_unconnectable: {} },
  }),
  widgets: [JSON.stringify({
    version: 1,
    content: startNote,
    buttonColor: "#f66744",
    lineColor: "#f66744",
    width: 4260,
    height: 260,
    backgroundColor: "#2a2a2a",
  }), ""],
  color: "#f66744",
}));

add(makeNode({
  id: 10,
  type: "PixaromaLoadImageMini",
  pos: [40, 480],
  size: [460, 640],
  title: "1. MANUAL OPENING FRAME — used when AUTO CHAIN is off or empty",
  outputs: [output("image", "IMAGE"), output("image_info", "PIX_IMAGE_INFO")],
  properties: pixProps("PixaromaLoadImageMini", { loadImageMiniState: { mode: "off" } }),
  widgets: ["img_00001_.png", "image", ""],
  color: "#B45574",
}));

add(makeNode({
  id: 11,
  type: "PixaromaLoadImageMini",
  pos: [540, 480],
  size: [460, 640],
  title: "OPTIONAL ENDING FRAME — a planned Krea keyframe",
  outputs: [output("image", "IMAGE"), output("image_info", "PIX_IMAGE_INFO")],
  properties: pixProps("PixaromaLoadImageMini", { loadImageMiniState: { mode: "off" } }),
  widgets: ["img_00002_.png", "image", ""],
  color: "#B45574",
}));

add(makeNode({
  id: 12,
  type: "PixaromaLongestSide",
  pos: [40, 1330],
  size: [460, 160],
  title: "NATIVE DETAIL — 864 FAST/GOLD | 960 +40% | 1056 +100% measured",
  inputs: [input("image", "IMAGE")],
  outputs: [output("image", "IMAGE"), output("width", "INT"), output("height", "INT")],
  properties: pixProps("PixaromaLongestSide", {
    longestSideState: {
      size: 864,
      sizes: [608, 864, 960, 1056, 1216, 1344],
      ratio: "keep",
      ratios: ["keep", "16:9", "9:16", "1:1", "2:3"],
      step: 32,
      anchor: "center",
      allow_upscale: true,
      resample: "auto",
    },
  }),
  widgets: [],
  color: "#14436c",
}));

add(makeNode({
  id: 13,
  type: "ImageScale",
  pos: [540, 1330],
  size: [460, 140],
  title: "AUTO — match ending frame to opening frame size",
  inputs: [
    input("image", "IMAGE"),
    input("width", "INT", { widget: { name: "width" } }),
    input("height", "INT", { widget: { name: "height" } }),
  ],
  outputs: [output("IMAGE", "IMAGE")],
  properties: coreProps("ImageScale"),
  widgets: ["lanczos", 864, 480, "disabled"],
  color: "#355C7D",
}));

add(makeNode({
  id: 14,
  type: "H3OptionalImage",
  pos: [540, 1510],
  size: [460, 110],
  title: "USE ENDING FRAME — OFF = continue freely | ON = land exactly",
  inputs: [input("image", "IMAGE", { shape: 7 })],
  outputs: [output("image", "IMAGE")],
  properties: { "Node name for S&R": "H3OptionalImage" },
  widgets: [false],
  color: "#f66744",
}));

add(makeNode({
  id: 15,
  type: "PixaromaNote",
  pos: [40, 1660],
  size: [960, 350],
  title: "WHEN TO USE THE ENDING FRAME",
  properties: pixProps("PixaromaNote"),
  widgets: [JSON.stringify({
    version: 1,
    content: "<h3>OFF — ordinary continuation</h3><p>H3 starts from the opening frame and invents a natural ending. This is the fastest way to extend a sequence.</p><h3>ON — planned transition or drift reset</h3><p>H3 must travel continuously from the opening frame to the supplied ending frame. Use a compatible composition: the same subjects, props and location, with a physically plausible path between them.</p><p>Do not use two unrelated pictures merely because both are attractive.</p>",
    buttonColor: "#B45574",
    lineColor: "#B45574",
    width: 960,
    height: 350,
    backgroundColor: "#2a2a2a",
  }), ""],
  color: "#B45574",
}));

add(makeNode({
  id: 16,
  type: "CodexH3ContinuationInput",
  pos: [40, 1160],
  size: [460, 130],
  title: "AUTO — choose manual image or previous run's HANDOFF",
  inputs: [
    input("manual_image", "IMAGE"),
    input("auto_chain", "BOOLEAN"),
    input("slot", "STRING"),
  ],
  outputs: [output("opening_frame", "IMAGE"), output("source_status", "STRING")],
  properties: { "Node name for S&R": "CodexH3ContinuationInput" },
  color: "#f66744",
}));

add(makeNode({
  id: 17,
  type: "PixaromaShowText",
  pos: [540, 1160],
  size: [460, 130],
  title: "OPENING SOURCE — confirms MANUAL or AUTO after each run",
  inputs: [input("source", "*")],
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaShowText"),
  widgets: ["Source appears after the first run."],
  color: "#2E7D32",
}));

const videoPromptState = {
  idea: "The subject continues naturally from the opening frame, walks forward at a relaxed pace, glances toward the camera, and then looks back along the path. Use one continuous shot with a gentle tracking camera. Preserve identity, clothing, anatomy, props, lighting and the environment. Natural ambience and movement sounds. No non-diegetic music; end the generated prompt with exactly non_diegetic_music: N/A.",
  tier_index: 0,
  tier_name: "5 seconds",
  seed: 2408241001,
  model: "qwen3vl_8b_fp8_scaled.safetensors",
  clip_type: "minimax",
  temperature: 0.3,
  max_length: 768,
  top_k: 64,
  top_p: 0.95,
  min_p: 0.05,
  repetition_penalty: 1.05,
  presence_penalty: 0,
  thinking: false,
  use_default_template: true,
  release_model: true,
  length_block: true,
  fps: 24,
  step: 17,
  plus: 5,
  min_frames: 5,
  seed_mode: "fixed",
  speech_hint: true,
  idea_share: 0.32,
};

add(makeNode({
  id: 20,
  type: "PixaromaVideoPrompt",
  pos: [1140, 480],
  size: [680, 760],
  title: "2. SHOT IDEA + DURATION — dictate here; Tags are available",
  inputs: [
    input("first_frame", "IMAGE", { shape: 7 }),
    input("last_frame", "IMAGE", { shape: 7 }),
    input("clip", "CLIP", { shape: 7 }),
  ],
  outputs: [output("text", "STRING"), output("frames", "INT"), output("seconds", "FLOAT")],
  properties: pixProps("PixaromaVideoPrompt", { videoPromptState }),
  widgets: [],
  color: "#7A3E78",
}));

add(makeNode({
  id: 21,
  type: "PixaromaShowText",
  pos: [1140, 1280],
  size: [680, 400],
  title: "FINAL H3 PROMPT — first-frame or first+last mode is automatic",
  inputs: [input("source", "*")],
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaShowText"),
  widgets: ["Prompt appears after the first run."],
  color: "#2E7D32",
}));

add(makeNode({
  id: 22,
  type: "PixaromaNote",
  pos: [1140, 1720],
  size: [680, 320],
  title: "PROMPTING RULE OF THUMB",
  properties: pixProps("PixaromaNote"),
  widgets: [JSON.stringify({
    version: 1,
    content: "<h3>Describe movement, not a new picture</h3><p>Say who does what, in which order, what the camera does and any exact dialogue. If an ending frame is on, describe the plausible physical path that reaches it. Keep a 5-second shot to one main action; save a second action for the next run.</p><p>The local 8B Qwen model writes the H3 format and releases itself before H3 loads.</p>",
    buttonColor: "#7A3E78",
    lineColor: "#7A3E78",
    width: 680,
    height: 320,
    backgroundColor: "#2a2a2a",
  }), ""],
  color: "#7A3E78",
}));

add(makeNode({
  id: 30,
  type: "UNETLoader",
  pos: [1940, 480],
  size: [440, 90],
  title: "H3 first/last-frame diffusion model",
  outputs: [output("MODEL", "MODEL")],
  properties: coreProps("UNETLoader"),
  widgets: ["H3\\minimax_h3_fl2va_pruned_int8_convrot.safetensors", "default"],
  color: "#f66744",
}));

add(makeNode({
  id: 31,
  type: "CLIPLoader",
  pos: [2420, 480],
  size: [440, 125],
  title: "H3 conditioning encoder — not the prompt writer",
  outputs: [output("CLIP", "CLIP")],
  properties: coreProps("CLIPLoader"),
  widgets: ["qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", "minimax", "default"],
  color: "#f66744",
}));

add(makeNode({
  id: 32,
  type: "VAELoader",
  pos: [1940, 640],
  size: [440, 65],
  title: "H3 video VAE",
  outputs: [output("VAE", "VAE")],
  properties: coreProps("VAELoader"),
  widgets: ["minimax_h3_video_vae_fp16.safetensors"],
  color: "#f66744",
}));

add(makeNode({
  id: 33,
  type: "VAELoader",
  pos: [2420, 640],
  size: [440, 65],
  title: "H3 audio VAE",
  outputs: [output("VAE", "VAE")],
  properties: coreProps("VAELoader"),
  widgets: ["minimax_h3_audio_vae_fp32.safetensors"],
  color: "#f66744",
}));

add(makeNode({
  id: 34,
  type: "PixaromaSeed",
  pos: [1940, 750],
  size: [920, 190],
  title: "3. VIDEO SEED — keep fixed while tuning a shot",
  outputs: [output("seed", "INT")],
  properties: pixProps("PixaromaSeed", {
    seedState: { seed: 2408241001, mode: "fixed", compact: false, digits: 16 },
  }),
  widgets: [{ seed: 2408241001, mode: "fixed", compact: false, digits: 16 }],
  color: "#14436c",
}));

add(makeNode({
  id: 35,
  type: "MiniMaxH3ImageToVideo",
  pos: [1940, 990],
  size: [920, 330],
  title: "H3 SHOT — first frame required; ending frame is switched above",
  inputs: [
    input("clip", "CLIP"),
    input("vae", "VAE"),
    input("first_frame", "IMAGE", { shape: 7 }),
    input("last_frame", "IMAGE", { shape: 7 }),
    input("prompt", "STRING", { widget: { name: "prompt" } }),
    input("width", "INT", { widget: { name: "width" } }),
    input("height", "INT", { widget: { name: "height" } }),
    input("length", "INT", { widget: { name: "length" } }),
  ],
  outputs: [output("positive", "CONDITIONING"), output("LATENT", "LATENT")],
  properties: coreProps("MiniMaxH3ImageToVideo"),
  widgets: ["", 864, 480, 124],
}));

add(makeNode({
  id: 36,
  type: "H3FreeTextEncoder",
  pos: [1940, 1360],
  size: [440, 90],
  title: "VRAM SAFETY — release H3 text encoder",
  inputs: [input("conditioning", "CONDITIONING"), input("clip", "CLIP")],
  outputs: [output("CONDITIONING", "CONDITIONING")],
  properties: { "Node name for S&R": "H3FreeTextEncoder" },
  color: "#355C7D",
}));

add(makeNode({
  id: 37,
  type: "ConditioningZeroOut",
  pos: [2420, 1360],
  size: [440, 90],
  title: "H3 negative conditioning",
  inputs: [input("conditioning", "CONDITIONING")],
  outputs: [output("CONDITIONING", "CONDITIONING")],
  properties: coreProps("ConditioningZeroOut"),
}));

add(makeNode({
  id: 38,
  type: "KSampler",
  pos: [1940, 1490],
  size: [920, 320],
  title: "GOLD SAMPLER — proven 20-step H3 settings",
  inputs: [
    input("model", "MODEL"),
    input("positive", "CONDITIONING"),
    input("negative", "CONDITIONING"),
    input("latent_image", "LATENT"),
    input("seed", "INT", { widget: { name: "seed" } }),
  ],
  outputs: [output("LATENT", "LATENT")],
  properties: coreProps("KSampler"),
  widgets: [2408241001, "fixed", 20, 1, "res_multistep", "simple", 1],
}));

add(makeNode({
  id: 39,
  type: "PixaromaRunTimer",
  pos: [1940, 1850],
  size: [920, 90],
  title: "RUN TIMER — one shot at a time",
  properties: pixProps("PixaromaRunTimer", {
    runTimerState: { version: 1, color: "#f66744", decimals: 0, chime: true, sound: "", volume: 0 },
  }),
  color: "#f66744",
}));

add(makeNode({
  id: 40,
  type: "VAEDecode",
  pos: [3040, 480],
  size: [350, 70],
  title: "Decode video frames",
  inputs: [input("samples", "LATENT"), input("vae", "VAE")],
  outputs: [output("IMAGE", "IMAGE")],
  properties: coreProps("VAEDecode"),
}));

add(makeNode({
  id: 41,
  type: "VAEDecodeAudio",
  pos: [3440, 480],
  size: [350, 70],
  title: "Decode H3 audio",
  inputs: [input("samples", "LATENT"), input("vae", "VAE")],
  outputs: [output("AUDIO", "AUDIO")],
  properties: coreProps("VAEDecodeAudio"),
}));

add(makeNode({
  id: 49,
  type: "CodexH3OutputFinish",
  pos: [3040, 600],
  size: [1180, 150],
  title: "4. DELIVERY QUALITY — BALANCED adds ~2.4 sec; NATIVE is exact",
  inputs: [
    input("images", "IMAGE"),
    input("profile", "COMBO", { widget: { name: "profile" } }),
    input("audio", "AUDIO", { shape: 7 }),
  ],
  outputs: [output("delivery_frames", "IMAGE"), output("quality_status", "STRING")],
  properties: { "Node name for S&R": "CodexH3OutputFinish" },
  widgets: ["BALANCED — RTX 1.5x HIGH (recommended)"],
  color: "#f66744",
}));

add(makeNode({
  id: 50,
  type: "PixaromaShowText",
  pos: [3040, 790],
  size: [1180, 120],
  title: "DELIVERY STATUS — confirms final dimensions and native handoff safety",
  inputs: [input("source", "*")],
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaShowText"),
  widgets: ["Quality status appears after the first run."],
  color: "#2E7D32",
}));

add(makeNode({
  id: 42,
  type: "PixaromaSaveMp4",
  pos: [3040, 950],
  size: [1180, 820],
  title: "5. FINAL SHOT — preview here and save MP4 with audio",
  inputs: [input("video_frames", "IMAGE"), input("audio", "AUDIO", { shape: 7 })],
  properties: pixProps("PixaromaSaveMp4"),
  widgets: [24, "H3_Long_Form/%date:yyyy-MM-dd%/Shot_%Seed Pixaroma.seed%", "save", false, ""],
  color: "#2E7D32",
}));

add(makeNode({
  id: 43,
  type: "H3LastFrame",
  pos: [3040, 1810],
  size: [350, 90],
  title: "AUTO — extract final continuation frame",
  inputs: [input("images", "IMAGE")],
  outputs: [output("IMAGE", "IMAGE")],
  properties: { "Node name for S&R": "H3LastFrame" },
  color: "#355C7D",
}));

add(makeNode({
  id: 46,
  type: "CodexH3ContinuationControl",
  pos: [3440, 1810],
  size: [780, 150],
  title: "AUTO-CHAIN NEXT RUN — OFF = manual | ON = previous HANDOFF",
  inputs: [
    input("auto_chain", "BOOLEAN", { widget: { name: "auto_chain" } }),
    input("slot", "STRING", { widget: { name: "slot" } }),
  ],
  outputs: [output("auto_chain", "BOOLEAN"), output("slot", "STRING")],
  properties: { "Node name for S&R": "CodexH3ContinuationControl" },
  widgets: [false, "workflow_10"],
  color: "#f66744",
}));

add(makeNode({
  id: 47,
  type: "CodexH3ContinuationStore",
  pos: [3040, 2000],
  size: [1180, 120],
  title: "AUTO-CHAIN MEMORY — persist this final frame for the next queued run",
  inputs: [input("images", "IMAGE"), input("slot", "STRING")],
  outputs: [output("handoff_frame", "IMAGE"), output("saved_status", "STRING")],
  properties: { "Node name for S&R": "CodexH3ContinuationStore" },
  color: "#355C7D",
}));

add(makeNode({
  id: 48,
  type: "PixaromaShowText",
  pos: [3040, 2160],
  size: [1180, 140],
  title: "AUTO-CHAIN STATUS — confirms the slot prepared for the next run",
  inputs: [input("source", "*")],
  outputs: [output("text", "STRING")],
  properties: pixProps("PixaromaShowText"),
  widgets: ["Handoff status appears after the first run."],
  color: "#2E7D32",
}));

add(makeNode({
  id: 44,
  type: "SaveImage",
  pos: [3040, 2340],
  size: [1180, 370],
  title: "HANDOFF FRAME — visible recovery copy; AUTO CHAIN also retains it",
  inputs: [input("images", "IMAGE")],
  outputs: [output("images", "IMAGE")],
  properties: coreProps("SaveImage"),
  widgets: ["H3_Long_Form/%date:yyyy-MM-dd%/HANDOFF_%Seed Pixaroma.seed%"],
  color: "#f66744",
}));

add(makeNode({
  id: 45,
  type: "PixaromaNote",
  pos: [3040, 2750],
  size: [1180, 300],
  title: "NEXT SHOT",
  properties: pixProps("PixaromaNote"),
  widgets: [JSON.stringify({
    version: 1,
    content: "<h2>Manual or automatic continuation</h2><p><b>AUTO CHAIN off:</b> each run uses the manual opening image. <b>AUTO CHAIN on:</b> the first run falls back to the manual image when the slot is empty, then every later queued run uses the preceding run's handoff automatically. You may queue several runs in advance; they execute sequentially.</p><p>The MP4 may receive RTX delivery finishing, but the HANDOFF always comes from native H3 frames. This prevents artificial texture accumulating across repeated shots. If drift appears, stop the queue, turn AUTO CHAIN off, load a clean Krea keyframe and run once.</p>",
    buttonColor: "#2E7D32",
    lineColor: "#2E7D32",
    width: 1180,
    height: 260,
    backgroundColor: "#2a2a2a",
  }), ""],
  color: "#2E7D32",
}));

connect(10, 0, 16, "manual_image", "IMAGE");
connect(46, 0, 16, "auto_chain", "BOOLEAN");
connect(46, 1, 16, "slot", "STRING");
connect(16, 1, 17, "source", "*");
connect(16, 0, 12, "image", "IMAGE");
connect(11, 0, 13, "image", "IMAGE");
connect(12, 1, 13, "width", "INT");
connect(12, 2, 13, "height", "INT");
connect(13, 0, 14, "image", "IMAGE");

connect(12, 0, 20, "first_frame", "IMAGE");
connect(14, 0, 20, "last_frame", "IMAGE");
connect(20, 0, 21, "source", "*");

connect(31, 0, 35, "clip", "CLIP");
connect(32, 0, 35, "vae", "VAE");
connect(12, 0, 35, "first_frame", "IMAGE");
connect(14, 0, 35, "last_frame", "IMAGE");
connect(21, 0, 35, "prompt", "STRING");
connect(12, 1, 35, "width", "INT");
connect(12, 2, 35, "height", "INT");
connect(20, 1, 35, "length", "INT");

connect(35, 0, 36, "conditioning", "CONDITIONING");
connect(31, 0, 36, "clip", "CLIP");
connect(36, 0, 37, "conditioning", "CONDITIONING");
connect(30, 0, 38, "model", "MODEL");
connect(36, 0, 38, "positive", "CONDITIONING");
connect(37, 0, 38, "negative", "CONDITIONING");
connect(35, 1, 38, "latent_image", "LATENT");
connect(34, 0, 38, "seed", "INT");

connect(38, 0, 40, "samples", "LATENT");
connect(32, 0, 40, "vae", "VAE");
connect(38, 0, 41, "samples", "LATENT");
connect(33, 0, 41, "vae", "VAE");
connect(40, 0, 49, "images", "IMAGE");
connect(41, 0, 49, "audio", "AUDIO");
connect(49, 0, 42, "video_frames", "IMAGE");
connect(49, 1, 50, "source", "*");
connect(41, 0, 42, "audio", "AUDIO");
connect(40, 0, 43, "images", "IMAGE");
connect(43, 0, 47, "images", "IMAGE");
connect(46, 1, 47, "slot", "STRING");
connect(47, 1, 48, "source", "*");
connect(47, 0, 44, "images", "IMAGE");

const groups = [
  { id: "pg_h3lf_1", title: "1 — OPENING SOURCE, KEYFRAMES & END-FRAME SWITCH", x: 0, y: 430, w: 1050, h: 1630, titleColor: "#B45574", bodyColor: "#38212a", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 18, folded: false, showLinks: true },
  { id: "pg_h3lf_2", title: "2 — PIXAROMA SHOT DIRECTOR", x: 1100, y: 430, w: 760, h: 1660, titleColor: "#7A3E78", bodyColor: "#312132", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 18, folded: false, showLinks: true },
  { id: "pg_h3lf_3", title: "3 — DEPENDABLE H3 RENDER SPINE", x: 1900, y: 430, w: 1050, h: 1560, titleColor: "#355C7D", bodyColor: "#1f2f3a", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 18, folded: false, showLinks: true },
  { id: "pg_h3lf_4", title: "4 — DELIVERY QUALITY, VIDEO, AUDIO & NATIVE NEXT-SHOT HANDOFF", x: 3000, y: 430, w: 1260, h: 2670, titleColor: "#2E7D32", bodyColor: "#1d3020", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 18, folded: false, showLinks: true },
];

const workflow = {
  id: "32a02410-5e49-4c6b-a5c0-0c927f0e1001",
  revision: 1,
  last_node_id: Math.max(...nodes.map((node) => node.id)),
  last_link_id: links.length,
  nodes,
  links,
  groups: [],
  config: {},
  extra: {
    ds: { scale: 0.74, offset: [38, 45] },
    pixaromaGroups: groups,
    workflowRendererVersion: "LG",
  },
  version: 0.4,
};

function assertGeometry(graph) {
  const exempt = new Set([1, 2]);
  const breaches = [];
  const overlaps = [];
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
  if (breaches.length || overlaps.length) throw new Error(`Geometry failure: ${JSON.stringify({ breaches, overlaps }, null, 2)}`);
}

function assertGraph(graph) {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== graph.nodes.length) throw new Error("Duplicate node IDs");
  for (const [id, from, outIndex, to, inIndex] of graph.links) {
    if (!ids.has(from) || !ids.has(to)) throw new Error(`Link ${id} references a missing node`);
    if (!graph.nodes.find((node) => node.id === from).outputs[outIndex]) throw new Error(`Link ${id} has a missing output`);
    if (!graph.nodes.find((node) => node.id === to).inputs[inIndex]) throw new Error(`Link ${id} has a missing input`);
  }
  const prompt = graph.nodes.find((node) => node.id === 20);
  const lastGate = graph.nodes.find((node) => node.id === 14);
  const autoChain = graph.nodes.find((node) => node.id === 46);
  const quality = graph.nodes.find((node) => node.id === 49);
  const oldPath = path.join(liveRoot, "09 GOLD STANDARD - MiniMax H3 Ref2VA Director.json");
  if (prompt.properties.videoPromptState.release_model !== true) throw new Error("The prompt-writing model must release itself before H3");
  if (lastGate.widgets_values[0] !== false) throw new Error("Ending-frame steering must default to OFF");
  if (autoChain.widgets_values[0] !== false) throw new Error("Auto-chain must default to OFF so stale state is never selected unexpectedly");
  if (autoChain.widgets_values[1] !== "workflow_10") throw new Error("Unexpected default auto-chain slot");
  if (quality.widgets_values[0] !== "BALANCED — RTX 1.5x HIGH (recommended)") throw new Error("Balanced RTX 1.5x must remain the measured delivery default");
  const nativeHandoff = graph.links.some(([, from, outputIndex, to]) => from === 40 && outputIndex === 0 && to === 43);
  const finishedHandoff = graph.links.some(([, from, outputIndex, to]) => from === 49 && outputIndex === 0 && to === 43);
  if (!nativeHandoff || finishedHandoff) throw new Error("Auto-chain handoff must use native decoded H3 frames, never delivery-finished frames");
  if (!fs.existsSync(oldPath)) throw new Error("Workflow 09 disappeared; refusing to continue");
  if (!fs.existsSync(repoInitialBackup) || !fs.existsSync(liveInitialBackup)) throw new Error("Initial workflow 10 checkpoint is missing; refusing to continue");
  assertGeometry(graph);
}

const firstLastPrompt = `How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 1) aligns with the 5.00-second mark of the target video.

integrated_multimodal_description: [Shot 1] Live-action, cinematic, the brown-and-black goat begins in the position and composition established by Picture 1 on a sunlit grassy hillside. The camera tracks gently backward at slow speed while the goat walks forward with natural four-legged movement, turns its head briefly toward the lens, then returns its gaze along the path. Its horn shape, dark facial stripe, coat colours, body proportions, lighting and hillside environment remain consistent. The movement gradually narrows the differences between the two keyframes until the goat settles into the pose, spacing, viewpoint and final composition established by Picture 2 at the end of the shot.

overall_soundscape: Light wind moves through hillside grass with distant birds and soft natural hoof impacts.

non_diegetic_music: N/A`;

const promptSmoke = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "2": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_End.png" } },
  "3": {
    class_type: "PixaromaVideoPrompt",
    inputs: {
      first_frame: ["1", 0],
      last_frame: ["2", 0],
      VideoPromptState: JSON.stringify(videoPromptState),
    },
  },
};

const firstOnlyPromptSmoke = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "2": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_End.png" } },
  "3": { class_type: "H3OptionalImage", inputs: { enabled: false, image: ["2", 0] } },
  "4": {
    class_type: "PixaromaVideoPrompt",
    inputs: {
      first_frame: ["1", 0],
      last_frame: ["3", 0],
      VideoPromptState: JSON.stringify(videoPromptState),
    },
  },
};

const renderSmoke = {
  "1": { class_type: "UNETLoader", inputs: { unet_name: "H3\\minimax_h3_fl2va_pruned_int8_convrot.safetensors", weight_dtype: "default" } },
  "2": { class_type: "CLIPLoader", inputs: { clip_name: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors", type: "minimax", device: "default" } },
  "3": { class_type: "VAELoader", inputs: { vae_name: "minimax_h3_video_vae_fp16.safetensors" } },
  "4": { class_type: "VAELoader", inputs: { vae_name: "minimax_h3_audio_vae_fp32.safetensors" } },
  "5": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "6": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_End.png" } },
  "7": { class_type: "ImageScale", inputs: { image: ["5", 0], upscale_method: "lanczos", width: 608, height: 352, crop: "disabled" } },
  "8": { class_type: "ImageScale", inputs: { image: ["6", 0], upscale_method: "lanczos", width: 608, height: 352, crop: "disabled" } },
  "9": { class_type: "MiniMaxH3ImageToVideo", inputs: { clip: ["2", 0], vae: ["3", 0], first_frame: ["7", 0], last_frame: ["8", 0], prompt: firstLastPrompt, width: 608, height: 352, length: 124 } },
  "10": { class_type: "H3FreeTextEncoder", inputs: { conditioning: ["9", 0], clip: ["2", 0] } },
  "11": { class_type: "ConditioningZeroOut", inputs: { conditioning: ["10", 0] } },
  "12": { class_type: "KSampler", inputs: { model: ["1", 0], positive: ["10", 0], negative: ["11", 0], latent_image: ["9", 1], seed: 2408241001, steps: 6, cfg: 1, sampler_name: "res_multistep", scheduler: "simple", denoise: 1 } },
  "13": { class_type: "VAEDecode", inputs: { samples: ["12", 0], vae: ["3", 0] } },
  "14": { class_type: "VAEDecodeAudio", inputs: { samples: ["12", 0], vae: ["4", 0] } },
  "15": { class_type: "PixaromaSaveMp4", inputs: { video_frames: ["18", 0], audio: ["14", 0], fps: 24, filename_prefix: "H3_Long_Form_Smoke/Shot_2408241001", save_mode: "save", trim_to_audio: false } },
  "16": { class_type: "H3LastFrame", inputs: { images: ["13", 0] } },
  "17": { class_type: "SaveImage", inputs: { images: ["16", 0], filename_prefix: "H3_Long_Form_Smoke/HANDOFF_2408241001" } },
  "18": { class_type: "CodexH3OutputFinish", inputs: { images: ["13", 0], audio: ["14", 0], profile: "BALANCED — RTX 1.5x HIGH (recommended)" } },
};

function makeNativeQualityBenchmark(width, height, label) {
  const graph = JSON.parse(JSON.stringify(renderSmoke));
  for (const id of ["7", "8", "9"]) {
    graph[id].inputs.width = width;
    graph[id].inputs.height = height;
  }
  graph["12"].inputs.steps = 20;
  graph["15"].inputs.filename_prefix = `H3_Quality_Bench/${label}`;
  graph["17"].inputs.filename_prefix = `H3_Quality_Bench/${label}_HANDOFF`;
  graph["18"].inputs.profile = "NATIVE — 1.0x (fastest)";
  return graph;
}

const qualityBenchmark864 = makeNativeQualityBenchmark(864, 480, "Native864x480_20step_control");
const qualityBenchmark960 = makeNativeQualityBenchmark(960, 544, "Native960x544_20step");
const qualityBenchmark1056 = makeNativeQualityBenchmark(1056, 608, "Native1056x608_20step_high");

function makeTurboQualityBenchmark(steps, label) {
  const graph = JSON.parse(JSON.stringify(qualityBenchmark960));
  graph["100"] = {
    class_type: "H3LoraStack",
    inputs: {
      model: ["1", 0],
      lora_1: "H3\\TurboLoras\\minimax_h3_turbo_v4_step600_pruned_comfyui.safetensors",
      strength_1: 1,
      lora_2: "None",
      strength_2: 1,
      lora_3: "None",
      strength_3: 1,
      lora_4: "None",
      strength_4: 1,
    },
  };
  graph["12"].inputs.model = ["100", 0];
  graph["12"].inputs.steps = steps;
  graph["12"].inputs.sampler_name = "euler";
  graph["12"].inputs.scheduler = "beta";
  graph["15"].inputs.filename_prefix = `H3_Quality_Bench/${label}`;
  graph["17"].inputs.filename_prefix = `H3_Quality_Bench/${label}_HANDOFF`;
  return graph;
}

const qualityTurbo8 = makeTurboQualityBenchmark(8, "Turbo960x544_8step_euler_beta");
const qualityTurbo12 = makeTurboQualityBenchmark(12, "Turbo960x544_12step_dialogue");

const autoChainStoreSmoke = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_End.png" } },
  "2": { class_type: "CodexH3ContinuationControl", inputs: { auto_chain: true, slot: "workflow_10_smoke" } },
  "3": { class_type: "CodexH3ContinuationStore", inputs: { images: ["1", 0], slot: ["2", 1] } },
  "4": { class_type: "SaveImage", inputs: { images: ["3", 0], filename_prefix: "H3_Long_Form_Smoke/AUTO_CHAIN_STORED" } },
};

const autoChainLoadSmoke = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "2": { class_type: "CodexH3ContinuationControl", inputs: { auto_chain: true, slot: "workflow_10_smoke" } },
  "3": { class_type: "CodexH3ContinuationInput", inputs: { manual_image: ["1", 0], auto_chain: ["2", 0], slot: ["2", 1] } },
  "4": { class_type: "SaveImage", inputs: { images: ["3", 0], filename_prefix: "H3_Long_Form_Smoke/AUTO_CHAIN_SELECTED" } },
};

const autoChainManualSmoke = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "2": { class_type: "CodexH3ContinuationControl", inputs: { auto_chain: false, slot: "workflow_10_smoke" } },
  "3": { class_type: "CodexH3ContinuationInput", inputs: { manual_image: ["1", 0], auto_chain: ["2", 0], slot: ["2", 1] } },
  "4": { class_type: "SaveImage", inputs: { images: ["3", 0], filename_prefix: "H3_Long_Form_Smoke/MANUAL_SELECTED" } },
};

const qualityNativeSmoke = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "2": { class_type: "CodexH3OutputFinish", inputs: { images: ["1", 0], profile: "NATIVE — 1.0x (fastest)" } },
  "3": { class_type: "SaveImage", inputs: { images: ["2", 0], filename_prefix: "H3_Long_Form_Smoke/QUALITY_NATIVE" } },
};

const qualityBalancedSmoke = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "2": { class_type: "CodexH3OutputFinish", inputs: { images: ["1", 0], profile: "BALANCED — RTX 1.5x HIGH (recommended)" } },
  "3": { class_type: "SaveImage", inputs: { images: ["2", 0], filename_prefix: "H3_Long_Form_Smoke/QUALITY_BALANCED" } },
};

assertGraph(workflow);

function preserveCurrentWorkflow(sourcePath, destinationPath) {
  if (fs.existsSync(destinationPath)) return;
  if (!fs.existsSync(sourcePath)) throw new Error(`Cannot create checkpoint; source workflow is missing: ${sourcePath}`);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

preserveCurrentWorkflow(repoWorkflow, repoPreAutoChainBackup);
preserveCurrentWorkflow(liveWorkflow, livePreAutoChainBackup);
preserveCurrentWorkflow(repoWorkflow, repoPreQualityBackup);
preserveCurrentWorkflow(liveWorkflow, livePreQualityBackup);

// The browser-saved live graph carried the maintainer's current images, random seed and
// test slot while the reproducible repo graph carried teaching defaults. Retain
// that live state under an explicit name before standardising the generic
// checkpoint, so both recovery choices exist in both locations.
preserveCurrentWorkflow(livePreQualityBackup, repoPreQualityUserStateBackup);
preserveCurrentWorkflow(livePreQualityBackup, livePreQualityUserStateBackup);
fs.copyFileSync(repoPreQualityBackup, livePreQualityBackup);

const json = `${JSON.stringify(workflow, null, 2)}\n`;
for (const filePath of [repoWorkflow, liveWorkflow]) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, json, "utf8");
}
fs.mkdirSync(path.dirname(promptSmokePath), { recursive: true });
fs.writeFileSync(promptSmokePath, `${JSON.stringify(promptSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(firstOnlyPromptSmokePath, `${JSON.stringify(firstOnlyPromptSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(renderSmokePath, `${JSON.stringify(renderSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(autoChainStoreSmokePath, `${JSON.stringify(autoChainStoreSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(autoChainLoadSmokePath, `${JSON.stringify(autoChainLoadSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(autoChainManualSmokePath, `${JSON.stringify(autoChainManualSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(qualityNativeSmokePath, `${JSON.stringify(qualityNativeSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(qualityBalancedSmokePath, `${JSON.stringify(qualityBalancedSmoke, null, 2)}\n`, "utf8");
fs.writeFileSync(qualityBenchmark864Path, `${JSON.stringify(qualityBenchmark864, null, 2)}\n`, "utf8");
fs.writeFileSync(qualityBenchmark960Path, `${JSON.stringify(qualityBenchmark960, null, 2)}\n`, "utf8");
fs.writeFileSync(qualityBenchmark1056Path, `${JSON.stringify(qualityBenchmark1056, null, 2)}\n`, "utf8");
fs.writeFileSync(qualityTurbo8Path, `${JSON.stringify(qualityTurbo8, null, 2)}\n`, "utf8");
fs.writeFileSync(qualityTurbo12Path, `${JSON.stringify(qualityTurbo12, null, 2)}\n`, "utf8");

// The original builder remains the authority for Gold's dependable image,
// prompt, sampler, delivery and AUTO CHAIN spine. M7 is a separately guarded,
// human-accepted optional layer whose builder reads the exact dated pre-M7
// backup. Always reapply it after rebuilding the spine so a routine rebuild
// cannot silently remove the accepted latent-continuation controls.
const m7IntegrationPath = path.join(
  repoRoot,
  "tools",
  "integrate_h3_m7_gold.mjs",
);
const m7Integration = spawnSync(process.execPath, [m7IntegrationPath], {
  cwd: repoRoot,
  encoding: "utf8",
  windowsHide: true,
});
if (m7Integration.status !== 0) {
  throw new Error(
    `M7 Gold integration failed after base rebuild:\n${m7Integration.stderr || m7Integration.stdout}`,
  );
}
process.stdout.write(m7Integration.stdout);

console.log(JSON.stringify({
  workflowName,
  nodes: nodes.length,
  links: links.length,
  groups: groups.length,
  repoWorkflow,
  liveWorkflow,
  repoInitialBackup,
  liveInitialBackup,
  repoPreAutoChainBackup,
  livePreAutoChainBackup,
  repoPreQualityBackup,
  livePreQualityBackup,
  repoPreQualityUserStateBackup,
  livePreQualityUserStateBackup,
  promptSmokePath,
  firstOnlyPromptSmokePath,
  renderSmokePath,
  autoChainStoreSmokePath,
  autoChainLoadSmokePath,
  autoChainManualSmokePath,
  qualityNativeSmokePath,
  qualityBalancedSmokePath,
  qualityBenchmark864Path,
  qualityBenchmark960Path,
  qualityBenchmark1056Path,
  qualityTurbo8Path,
  qualityTurbo12Path,
}, null, 2));
