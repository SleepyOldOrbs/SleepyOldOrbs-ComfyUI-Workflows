import { requireComfyRoot } from "./local_paths.cjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const workflowRoot = path.join(repoRoot, "workflows", "Codex MCP Demos");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const sourcePath = path.join(
  workflowRoot,
  "Backups",
  "10H H3 Motion Context",
  "MiniMax H3 - fl2va - ref2va - UPSTREAM 0.3.1 - 2026-08-25.json",
);
const workflowName = "10H H3 Motion Context Lab.json";
const repoWorkflowPath = path.join(workflowRoot, workflowName);
const liveWorkflowPath = path.join(liveRoot, workflowName);
const smokeApiPath = path.join(
  repoRoot,
  "tests",
  "h3_m7_motion_context_smoke_api.json",
);
const clip1ApiPath = path.join(
  repoRoot,
  "tests",
  "h3_m7_acceptance_clip1_api.json",
);
const clip2ApiPath = path.join(
  repoRoot,
  "tests",
  "h3_m7_acceptance_clip2_api.json",
);
const reviewAssemblyApiPath = path.join(
  repoRoot,
  "tests",
  "h3_m7_acceptance_review_assembly_api.json",
);
const goldPath = path.join(
  workflowRoot,
  "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json",
);
const expectedGoldSha256 = "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";
const expectedSourceSha256 = "36712d093ed0fc750ea9db38de62a5f5405562ba4f2c22c74ee31d1e6a364d83";
const upstreamCommit = "f80e36bc1d7887a143b12e6645313fd6b9cd2aee";

const models = {
  fl2va: String.raw`H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`,
  ref2va: String.raw`H3\minimax_h3_ref2va_pruned_int8_convrot.safetensors`,
  clip: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
  videoVae: "minimax_h3_video_vae_fp16.safetensors",
  audioVae: "minimax_h3_audio_vae_fp32.safetensors",
};

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

const goldHash = sha256(fs.readFileSync(goldPath));
if (goldHash !== expectedGoldSha256) {
  throw new Error(
    `Protected Gold changed: expected ${expectedGoldSha256}, found ${goldHash}`,
  );
}

const sourceBytes = fs.readFileSync(sourcePath);
const sourceHash = sha256(sourceBytes);
if (sourceHash !== expectedSourceSha256) {
  throw new Error(
    `Upstream checkpoint changed: expected ${expectedSourceSha256}, found ${sourceHash}`,
  );
}

const workflow = JSON.parse(sourceBytes.toString("utf8"));
workflow.id = "10700000-0000-4000-8000-000000000007";
workflow.revision = 0;

function nodeById(id) {
  const node = workflow.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Missing expected upstream node ${id}`);
  return node;
}

function subgraphById(id) {
  const subgraph = workflow.definitions?.subgraphs?.find(
    (candidate) => candidate.id === id,
  );
  if (!subgraph) throw new Error(`Missing expected upstream subgraph ${id}`);
  return subgraph;
}

function configureLoaderNode(node, unet) {
  node.widgets_values = [unet, models.clip, models.videoVae, models.audioVae];
  node.title = unet === models.fl2va
    ? "LOCAL VERIFIED FL2VA MODELS"
    : "LOCAL VERIFIED REF2VA MODELS";
}

function configureLoaderSubgraph(id, unet) {
  const subgraph = subgraphById(id);
  const unetNode = subgraph.nodes.find((node) => node.type === "UNETLoader");
  const clipNode = subgraph.nodes.find((node) => node.type === "CLIPLoader");
  const vaeNodes = subgraph.nodes.filter((node) => node.type === "VAELoader");
  if (!unetNode || !clipNode || vaeNodes.length !== 2) {
    throw new Error(`Unexpected model-loader structure in ${id}`);
  }
  unetNode.widgets_values = [unet, "default"];
  clipNode.widgets_values = [models.clip, "minimax", "default"];
  const videoVae = vaeNodes.find((node) =>
    String(node.widgets_values?.[0]).includes("video_vae"));
  const audioVae = vaeNodes.find((node) =>
    String(node.widgets_values?.[0]).includes("audio_vae"));
  if (!videoVae || !audioVae) {
    throw new Error(`Could not identify both H3 VAEs in ${id}`);
  }
  videoVae.widgets_values = [models.videoVae];
  audioVae.widgets_values = [models.audioVae];
}

configureLoaderNode(nodeById(244), models.ref2va);
configureLoaderNode(nodeById(247), models.fl2va);
configureLoaderSubgraph("c57e31c1-b7b3-42b6-9bbf-d4e33f292a4c", models.ref2va);
configureLoaderSubgraph("ad044397-cdc4-4c25-820c-cfb3a9f00383", models.fl2va);

const provenance = [
  "",
  "CODEX M7 CHECKPOINT",
  "Upstream: ComfyUI-H3-Motion-Context 0.3.1",
  `Commit: ${upstreamCommit}`,
  `Source workflow SHA-256: ${expectedSourceSha256.toUpperCase()}`,
  "Only local model choices, CLIP type, safety labels and these notes differ from the retained upstream copy.",
  "Gold remains unchanged. Do not integrate until both picture and sound are manually accepted.",
].join("\n");

for (const id of [181, 246]) {
  const note = nodeById(id);
  note.title = id === 181
    ? "M7 FL2VA MOTION CONTEXT — START HERE"
    : "M7 REF2VA MOTION CONTEXT — START HERE";
  note.widgets_values[0] = `${note.widgets_values[0]}${provenance}`;
}

for (const id of [121, 220]) {
  const textNode = nodeById(id);
  textNode.type = "PrimitiveStringMultiline";
  textNode.inputs = [
    {
      localized_name: "value",
      name: "value",
      type: "STRING",
      widget: { name: "value" },
      link: null,
    },
  ];
  textNode.outputs[0].localized_name = "STRING";
  textNode.outputs[0].slot_index = 0;
  textNode.properties = {
    cnr_id: "comfy-core",
    "Node name for S&R": "PrimitiveStringMultiline",
  };
}

const groupBypasser = nodeById(185);
groupBypasser.type = "FastGroupsBypasserV2";
groupBypasser.title = "FAST GROUP BYPASSER V2 — FIRST CLIP CONTROL";
groupBypasser.outputs = [];
groupBypasser.properties = {
  "Node name for S&R": "FastGroupsBypasserV2",
};

// The retained upstream graph ships its optional Load Video bypassed while
// leaving this extractor active. Current validation correctly treats the
// resulting dangling required VIDEO input as an error. Disable the extractor
// with the source; users enable both together only when testing a video ref.
const optionalVideoExtractor = nodeById(242);
optionalVideoExtractor.mode = 2;
optionalVideoExtractor.title = "DISABLED WITH OPTIONAL LOAD VIDEO";
optionalVideoExtractor.pos = [-2150, 4590];

// Move the three scalar controls in each lane to a clear strip to the right
// of the large video preview, then widen only the two outer lane groups.
// This removes five overlaps present in the upstream example without changing
// any links, widget values, or the nested Motion Context control groups.
nodeById(216).pos = [-40, 4250];
nodeById(215).pos = [-40, 4330];
nodeById(217).pos = [-40, 4510];
nodeById(162).pos = [-40, 5580];
nodeById(160).pos = [-40, 5660];
nodeById(228).pos = [-40, 5840];
for (const group of workflow.groups.filter((candidate) =>
  candidate.id === 10 || candidate.id === 11)) {
  group.bounding[2] = 3300;
}

for (const node of workflow.nodes.filter(
  (candidate) => candidate.type === "SpectrumApplyMiniMaxH3",
)) {
  node.mode = 4;
  node.title = "BYPASSED — KEEP SPECTRUM OFF FOR M7";
  if (Array.isArray(node.widgets_values) && node.widgets_values.length) {
    node.widgets_values[0] = false;
  }
}

for (const node of workflow.nodes.filter(
  (candidate) => candidate.type === "LoraLoaderModelOnly",
)) {
  node.mode = 4;
  node.title = "BYPASSED — NO TURBO DURING ACCEPTANCE";
}

const motionNodes = workflow.nodes.filter((node) =>
  String(node.type).startsWith("MiniMaxH3MotionContext"));
const requiredMotionTypes = new Set([
  "MiniMaxH3MotionContext",
  "MiniMaxH3MotionContextTrim",
  "MiniMaxH3MotionContextLoadLatent",
  "MiniMaxH3MotionContextSaveLatent",
]);
for (const type of requiredMotionTypes) {
  if (!motionNodes.some((node) => node.type === type)) {
    throw new Error(`Missing required Motion Context type ${type}`);
  }
}

const spectrumNodes = workflow.nodes.filter(
  (node) => node.type === "SpectrumApplyMiniMaxH3");
if (!spectrumNodes.length || spectrumNodes.some((node) => node.mode !== 4)) {
  throw new Error("Spectrum must remain present only as bypassed upstream evidence");
}

const turboNodes = workflow.nodes.filter(
  (node) => node.type === "LoraLoaderModelOnly");
if (!turboNodes.length || turboNodes.some((node) => node.mode !== 4)) {
  throw new Error("Turbo LoRA nodes must remain bypassed during M7 acceptance");
}

function assertGeometry() {
  const rectangles = workflow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    left: Number(node.pos[0]),
    top: Number(node.pos[1]),
    right: Number(node.pos[0]) + Number(node.size[0]),
    bottom: Number(node.pos[1]) + Number(node.size[1]),
  }));
  const overlaps = [];
  for (let aIndex = 0; aIndex < rectangles.length; aIndex += 1) {
    for (let bIndex = aIndex + 1; bIndex < rectangles.length; bIndex += 1) {
      const a = rectangles[aIndex];
      const b = rectangles[bIndex];
      if (
        a.left < b.right && a.right > b.left
        && a.top < b.bottom && a.bottom > b.top
      ) {
        overlaps.push([a.id, b.id]);
      }
    }
  }
  const breaches = [];
  for (const rect of rectangles) {
    const centerX = (rect.left + rect.right) / 2;
    const centerY = (rect.top + rect.bottom) / 2;
    for (const group of workflow.groups) {
      const [left, top, width, height] = group.bounding.map(Number);
      const containsCenter = centerX >= left && centerX <= left + width
        && centerY >= top && centerY <= top + height;
      if (
        containsCenter
        && (rect.left < left || rect.top < top
          || rect.right > left + width || rect.bottom > top + height)
      ) {
        breaches.push([rect.id, group.id]);
      }
    }
  }
  if (overlaps.length || breaches.length) {
    throw new Error(
      `10H geometry failure: ${JSON.stringify({ overlaps, breaches })}`,
    );
  }
}

assertGeometry();

const smokeApi = {
  1: {
    class_type: "EmptyMiniMaxH3LatentAV",
    inputs: { width: 64, height: 64, length: 5 },
  },
  2: {
    class_type: "MiniMaxH3MotionContextSaveLatent",
    inputs: {
      latent: ["1", 0],
      filename_prefix: "H3_M7_Smoke/source",
      clip_index: 1,
    },
  },
  3: {
    class_type: "MiniMaxH3MotionContextLoadLatent",
    inputs: { latent_path: ["2", 0], clip_index: 0 },
  },
  4: {
    class_type: "MiniMaxH3MotionContextSaveLatent",
    inputs: {
      latent: ["3", 0],
      filename_prefix: "H3_M7_Smoke/roundtrip",
      clip_index: 1,
    },
  },
};

const clip1Prompt = `For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.

integrated_multimodal_description: [Shot 1] Live-action, cinematic. The brown-and-black goat begins exactly in the position and composition established by Picture 1 on the sunlit grassy hillside. The camera tracks gently backward at a steady walking pace while the goat walks forward naturally, its head level and its four-legged gait continuous. A small bronze bell at its neck swings and rings in a calm, even rhythm. In the final two seconds the goat keeps walking along the same path, the camera keeps the same distance, and the final motion remains easy to continue without a cut.

overall_soundscape: Continuous light hillside wind, distant birds, soft hoof impacts and the same small bronze neck bell ringing in a calm regular rhythm. The ambience and bell continue through the end without fading.

non_diegetic_music: N/A`;

const clip2Prompt = `integrated_multimodal_description: [Shot 1] This begins as the exact physical continuation of the previous clip: the same brown-and-black goat, same horn shape and dark facial stripe, same sunlit grassy hillside, same camera distance, same backward tracking movement and the same uninterrupted walking gait. For the first two seconds the goat simply continues the ending motion, with a small weight shift and no reframing or cut. The goat then turns its head briefly toward the lens while still walking, returns its gaze to the path and continues forward. Preserve coat colours, body proportions, lighting and landscape throughout.

overall_soundscape: The previous clip's light hillside wind, distant birds, soft hoof impacts and regular bronze neck-bell rhythm continue through the join without a click, pause, tempo change or change of acoustic space.

non_diegetic_music: N/A`;

const clip1Api = {
  1: {
    class_type: "UNETLoader",
    inputs: { unet_name: models.fl2va, weight_dtype: "default" },
  },
  2: {
    class_type: "CLIPLoader",
    inputs: { clip_name: models.clip, type: "minimax", device: "default" },
  },
  3: { class_type: "VAELoader", inputs: { vae_name: models.videoVae } },
  4: { class_type: "VAELoader", inputs: { vae_name: models.audioVae } },
  5: { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  6: {
    class_type: "ImageScale",
    inputs: {
      image: ["5", 0],
      upscale_method: "lanczos",
      width: 608,
      height: 352,
      crop: "disabled",
    },
  },
  7: {
    class_type: "MiniMaxH3ImageToVideo",
    inputs: {
      clip: ["2", 0],
      vae: ["3", 0],
      first_frame: ["6", 0],
      prompt: clip1Prompt,
      width: 608,
      height: 352,
      length: 124,
    },
  },
  8: {
    class_type: "H3FreeTextEncoder",
    inputs: { conditioning: ["7", 0], clip: ["2", 0] },
  },
  9: {
    class_type: "ConditioningZeroOut",
    inputs: { conditioning: ["8", 0] },
  },
  10: {
    class_type: "KSampler",
    inputs: {
      model: ["1", 0],
      positive: ["8", 0],
      negative: ["9", 0],
      latent_image: ["7", 1],
      seed: 2508257001,
      steps: 6,
      cfg: 1,
      sampler_name: "res_multistep",
      scheduler: "simple",
      denoise: 1,
    },
  },
  11: {
    class_type: "VAEDecode",
    inputs: { samples: ["10", 0], vae: ["3", 0] },
  },
  12: {
    class_type: "VAEDecodeAudio",
    inputs: { samples: ["10", 0], vae: ["4", 0] },
  },
  13: {
    class_type: "MiniMaxH3MotionContextSaveLatent",
    inputs: {
      latent: ["10", 0],
      filename_prefix: "H3_M7_Acceptance/context/clip",
      clip_index: 1,
    },
  },
  14: {
    class_type: "PixaromaSaveMp4",
    inputs: {
      video_frames: ["11", 0],
      audio: ["12", 0],
      fps: 24,
      filename_prefix: "H3_M7_Acceptance/clip_01_raw",
      save_mode: "save",
      trim_to_audio: false,
    },
  },
  15: {
    class_type: "SaveAudioAdvanced",
    inputs: {
      audio: ["12", 0],
      filename_prefix: "H3_M7_Acceptance/clip_01_raw_audio",
      format: "flac",
    },
  },
};

const clip2Api = {
  1: {
    class_type: "UNETLoader",
    inputs: { unet_name: models.fl2va, weight_dtype: "default" },
  },
  2: {
    class_type: "CLIPLoader",
    inputs: { clip_name: models.clip, type: "minimax", device: "default" },
  },
  3: { class_type: "VAELoader", inputs: { vae_name: models.videoVae } },
  4: { class_type: "VAELoader", inputs: { vae_name: models.audioVae } },
  5: {
    class_type: "MiniMaxH3ImageToVideo",
    inputs: {
      clip: ["2", 0],
      vae: ["3", 0],
      prompt: clip2Prompt,
      width: 608,
      height: 352,
      length: 124,
    },
  },
  6: {
    class_type: "H3FreeTextEncoder",
    inputs: { conditioning: ["5", 0], clip: ["2", 0] },
  },
  7: {
    class_type: "MiniMaxH3MotionContextLoadLatent",
    inputs: { latent_path: "H3_M7_Acceptance/context", clip_index: 1 },
  },
  8: {
    class_type: "MiniMaxH3MotionContext",
    inputs: {
      conditioning: ["6", 0],
      vae: ["3", 0],
      latent: ["5", 1],
      context_latent: ["7", 0],
      context_length: "22",
      audio_context_length: 24,
    },
  },
  9: {
    class_type: "ConditioningZeroOut",
    inputs: { conditioning: ["8", 0] },
  },
  10: {
    class_type: "KSampler",
    inputs: {
      model: ["1", 0],
      positive: ["8", 0],
      negative: ["9", 0],
      latent_image: ["5", 1],
      seed: 2508257002,
      steps: 6,
      cfg: 1,
      sampler_name: "res_multistep",
      scheduler: "simple",
      denoise: 1,
    },
  },
  11: {
    class_type: "VAEDecode",
    inputs: { samples: ["10", 0], vae: ["3", 0] },
  },
  12: {
    class_type: "VAEDecodeAudio",
    inputs: { samples: ["10", 0], vae: ["4", 0] },
  },
  13: {
    class_type: "MiniMaxH3MotionContextSeamProbe",
    inputs: {
      clip_b_untrimmed: ["12", 0],
      trim_frames: ["8", 1],
      clip_a_latent: ["7", 0],
      audio_vae: ["4", 0],
      fps: 24,
      window_ms: 50,
      search_ms: 40,
    },
  },
  14: {
    class_type: "MiniMaxH3MotionContextTrim",
    inputs: {
      images: ["11", 0],
      trim_frames: ["8", 1],
      audio: ["13", 0],
      fps: 24,
      match_tail: true,
    },
  },
  15: {
    class_type: "MiniMaxH3MotionContextSaveLatent",
    inputs: {
      latent: ["10", 0],
      filename_prefix: "H3_M7_Acceptance/context/clip",
      clip_index: 2,
    },
  },
  16: {
    class_type: "PixaromaSaveMp4",
    inputs: {
      video_frames: ["14", 0],
      audio: ["14", 1],
      fps: 24,
      filename_prefix: "H3_M7_Acceptance/clip_02_trimmed",
      save_mode: "save",
      trim_to_audio: false,
    },
  },
  17: {
    class_type: "SaveAudioAdvanced",
    inputs: {
      audio: ["12", 0],
      filename_prefix: "H3_M7_Acceptance/clip_02_untrimmed_audio",
      format: "flac",
    },
  },
};

const reviewAssemblyApi = {
  1: {
    class_type: "CodexH3SequenceAssembler",
    inputs: {
      project: "H3 M7 Motion Context Acceptance",
      assembly_name: "Motion Context two-clip review",
      sources_json: JSON.stringify([
        {
          path: "H3_M7_Acceptance/clip_01_raw_00001.mp4",
          label: "Clip 1 raw",
        },
        {
          path: "H3_M7_Acceptance/clip_02_trimmed_00001.mp4",
          label: "Clip 2 context-trimmed",
        },
      ]),
      action: "assemble lossless",
    },
  },
  2: { class_type: "PixaromaShowText", inputs: { source: ["1", 0] } },
  3: { class_type: "PixaromaShowText", inputs: { source: ["1", 1] } },
  4: { class_type: "PixaromaShowText", inputs: { source: ["1", 2] } },
  5: { class_type: "PixaromaShowText", inputs: { source: ["1", 3] } },
  6: { class_type: "PixaromaShowText", inputs: { source: ["1", 4] } },
};

for (const outputPath of [repoWorkflowPath, liveWorkflowPath]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(outputPath);
}
fs.writeFileSync(smokeApiPath, `${JSON.stringify(smokeApi, null, 2)}\n`);
console.log(smokeApiPath);
fs.writeFileSync(clip1ApiPath, `${JSON.stringify(clip1Api, null, 2)}\n`);
fs.writeFileSync(clip2ApiPath, `${JSON.stringify(clip2Api, null, 2)}\n`);
fs.writeFileSync(
  reviewAssemblyApiPath,
  `${JSON.stringify(reviewAssemblyApi, null, 2)}\n`,
);
console.log(clip1ApiPath);
console.log(clip2ApiPath);
console.log(reviewAssemblyApiPath);

console.log(`10H SHA-256: ${sha256(fs.readFileSync(repoWorkflowPath))}`);
console.log(`Upstream SHA-256: ${sourceHash}`);
console.log(`Gold SHA-256: ${goldHash}`);
