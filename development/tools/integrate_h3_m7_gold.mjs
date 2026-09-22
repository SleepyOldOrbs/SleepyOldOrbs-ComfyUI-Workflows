import { requireComfyRoot } from "./local_paths.cjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const workflowRoot = path.join(repoRoot, "workflows", "Codex MCP Demos");
const goldPath = path.join(
  workflowRoot,
  "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json",
);
const backupPath = path.join(
  workflowRoot,
  "Backups",
  "10 H3 Long Form",
  "10 H3 LONG FORM - BEFORE M7 MOTION CONTEXT - 2026-08-25.json",
);
const labPath = path.join(workflowRoot, "10H H3 Motion Context Lab.json");
const liveGoldPath = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos", "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json");
const baselineSha256 =
  "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";
const labSha256 =
  "388f48b665d46bba6c4ec622f8716745baa04ee4b91102b31e6124c522f67b42";

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nodeById(workflow, id) {
  const node = workflow.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Missing expected node ${id}`);
  return node;
}

function linkById(workflow, id) {
  const link = workflow.links.find((candidate) => candidate[0] === id);
  if (!link) throw new Error(`Missing expected link ${id}`);
  return link;
}

function setInputLink(node, inputName, link) {
  const input = node.inputs.find((candidate) => candidate.name === inputName);
  if (!input) throw new Error(`Node ${node.id} is missing input ${inputName}`);
  input.link = link;
}

function setOutputLinks(node, outputIndex, links) {
  const output = node.outputs[outputIndex];
  if (!output) throw new Error(`Node ${node.id} is missing output ${outputIndex}`);
  output.links = links;
}

const backupBytes = fs.readFileSync(backupPath);
const backupHash = sha256(backupBytes);
if (backupHash !== baselineSha256) {
  throw new Error(
    `Pre-M7 Gold backup changed: expected ${baselineSha256}, found ${backupHash}`,
  );
}

const labBytes = fs.readFileSync(labPath);
const currentLabHash = sha256(labBytes);
if (currentLabHash !== labSha256) {
  throw new Error(
    `10H template changed: expected ${labSha256}, found ${currentLabHash}`,
  );
}

const workflow = JSON.parse(backupBytes.toString("utf8"));
const lab = JSON.parse(labBytes.toString("utf8"));
if (
  workflow.last_node_id !== 50 ||
  workflow.last_link_id !== 42 ||
  workflow.nodes.length !== 34 ||
  workflow.links.length !== 42
) {
  throw new Error("Protected Gold topology no longer matches the accepted baseline");
}

const humanAcceptance = {
  date: "2026-08-25",
  picture: "pass — smooth and seamless",
  audio: "pass",
  review_sha256:
    "d12efe9e97d4c8e6aa208eaab1441807df02a2b453f7775752c46057c817dc7f",
  motion_context_commit: "f80e36bc1d7887a143b12e6645313fd6b9cd2aee",
};

const label = clone(nodeById(workflow, 1));
label.id = 51;
label.pos = [0, 3160];
label.size = [4260, 92];
label.title = "OPTIONAL M7 — HUMAN-ACCEPTED MOTION + AUDIO CONTEXT";
const labelState = JSON.parse(label.widgets_values[0]);
labelState.text = label.title;
labelState.backgroundColor = "#355C7D";
label.widgets_values = [JSON.stringify(labelState)];
label.color = "#355C7D";

const note = clone(nodeById(workflow, 2));
note.id = 52;
note.pos = [0, 3280];
note.size = [1050, 600];
note.title = "M7 QUICK START — NORMAL GOLD STAYS UNCHANGED";
const noteState = JSON.parse(note.widgets_values[0]);
noteState.width = 1050;
noteState.height = 600;
noteState.buttonColor = "#355C7D";
noteState.lineColor = "#355C7D";
noteState.content = [
  "<h2>OPTIONAL — picture PASS and audio PASS on 25 August 2026</h2>",
  "<p><b>NORMAL GOLD:</b> leave both M7 groups bypassed. No latent is loaded or saved and the original Gold path is unchanged.</p>",
  "<p><b>CLIP 1:</b> keep APPLY PRIOR LATENT bypassed; enable SAVE CURRENT LATENT; use clip index 1. Start from the normal manual image with AUTO CHAIN off.</p>",
  "<p><b>CLIP 2+:</b> enable both M7 groups, turn AUTO CHAIN on so the first-frame anchor agrees with the prior latent tail, load the preceding index and save the new index. Queue one M7 clip at a time.</p>",
  "<p>Keep context 22/audio 24, resolution unchanged, Spectrum and Turbo off. Begin each later prompt by restating the exact ending pose, framing, action and sound before introducing change.</p>",
  "<p>Use a different latent folder for a different film. A missing or wrong prior index must be corrected rather than bypassed silently.</p>",
].join("");
note.widgets_values = [JSON.stringify(noteState), ""];
note.color = "#355C7D";

const bypasser = clone(nodeById(lab, 185));
bypasser.id = 53;
bypasser.pos = [0, 3920];
bypasser.size = [1050, 130];
bypasser.mode = 0;
bypasser.title = "M7 OPTIONAL CONTROLS — NORMAL GOLD = BOTH BYPASSED";

const loadLatent = clone(nodeById(lab, 178));
loadLatent.id = 54;
loadLatent.pos = [1130, 3340];
loadLatent.size = [450, 100];
loadLatent.mode = 4;
loadLatent.title = "LOAD PRIOR AV LATENT — previous clip index";
loadLatent.widgets_values = ["H3_Gold_Motion_Context", 1];
loadLatent.outputs[0].links = [46, 52];

const motionContext = clone(nodeById(lab, 240));
motionContext.id = 55;
motionContext.pos = [1620, 3340];
motionContext.size = [530, 230];
motionContext.mode = 4;
motionContext.title = "APPLY ACCEPTED CONTEXT — video 22 / audio 24";
motionContext.widgets_values = ["22", 24];
setInputLink(motionContext, "conditioning", 43);
setInputLink(motionContext, "vae", 44);
setInputLink(motionContext, "latent", 45);
setInputLink(motionContext, "context_frames", null);
setInputLink(motionContext, "context_latent", 46);
setInputLink(motionContext, "audio_vae", 47);
setInputLink(motionContext, "context_audio", null);
motionContext.outputs[0].links = [23, 25];
motionContext.outputs[1].links = [48, 49];

const seamProbe = {
  id: 56,
  type: "MiniMaxH3MotionContextSeamProbe",
  pos: [2210, 3340],
  size: [520, 250],
  flags: {},
  order: 0,
  mode: 4,
  inputs: [
    { name: "clip_b_untrimmed", type: "AUDIO", link: 34 },
    {
      name: "trim_frames",
      type: "INT",
      link: 48,
      widget: { name: "trim_frames" },
    },
    { name: "clip_a_latent", type: "LATENT", link: 52, shape: 7 },
    { name: "audio_vae", type: "VAE", link: 53, shape: 7 },
  ],
  outputs: [
    { name: "audio", type: "AUDIO", links: [51] },
    { name: "report", type: "STRING", links: [57] },
  ],
  title: "SEAM REPORT — diagnostic; human verdict remains authoritative",
  properties: { "Node name for S&R": "MiniMaxH3MotionContextSeamProbe" },
  widgets_values: [0, 24, 50, 40],
  color: "#355C7D",
  bgcolor: "#2a2a2a",
};

const trim = clone(nodeById(lab, 167));
trim.id = 57;
trim.pos = [2790, 3340];
trim.size = [520, 180];
trim.mode = 4;
trim.title = "TRIM PINNED HEAD — picture and sound together";
setInputLink(trim, "images", 33);
setInputLink(trim, "audio", 51);
setInputLink(trim, "trim_frames", 49);
trim.widgets_values = [0, 24, true];
trim.outputs[0].links = [54];
trim.outputs[1].links = [55, 37];

const saveLatent = clone(nodeById(lab, 179));
saveLatent.id = 58;
saveLatent.pos = [1130, 4000];
saveLatent.size = [1420, 100];
saveLatent.mode = 4;
saveLatent.title = "SAVE CURRENT AV LATENT — enable only for an M7 chain";
setInputLink(saveLatent, "latent", 50);
saveLatent.widgets_values = ["H3_Gold_Motion_Context/clip", 1];
saveLatent.outputs[0].links = [56];

function makeShowText(id, position, size, title, link, mode) {
  const result = clone(nodeById(workflow, 50));
  result.id = id;
  result.pos = position;
  result.size = size;
  result.title = title;
  result.mode = mode;
  result.inputs[0].link = link;
  result.outputs[0].links = [];
  result.widgets_values = ["Status appears after the M7 node executes."];
  result.color = "#355C7D";
  return result;
}

const seamStatus = makeShowText(
  59,
  [3370, 3340],
  [820, 480],
  "M7 SEAM DIAGNOSTIC — inspect alongside the rendered join",
  57,
  4,
);
const latentStatus = makeShowText(
  60,
  [2610, 4000],
  [1580, 100],
  "M7 LATENT STATUS — confirms the saved continuation index",
  56,
  4,
);

workflow.nodes.push(
  label,
  note,
  bypasser,
  loadLatent,
  motionContext,
  seamProbe,
  trim,
  saveLatent,
  seamStatus,
  latentStatus,
);

workflow.groups = [
  {
    id: 1,
    title: "M7 APPLY PRIOR LATENT — BYPASS FOR FIRST CLIP",
    bounding: [1100, 3280, 3120, 650],
    color: "#355C7D",
  },
  {
    id: 2,
    title: "M7 SAVE CURRENT LATENT — ENABLE FOR EVERY M7 CLIP",
    bounding: [1100, 3970, 3120, 180],
    color: "#2E7D32",
  },
];

linkById(workflow, 23).splice(0, 6, 23, 55, 0, 37, 0, "CONDITIONING");
linkById(workflow, 25).splice(0, 6, 25, 55, 0, 38, 1, "CONDITIONING");
linkById(workflow, 33).splice(0, 6, 33, 40, 0, 57, 0, "IMAGE");
linkById(workflow, 34).splice(0, 6, 34, 41, 0, 56, 0, "AUDIO");
linkById(workflow, 37).splice(0, 6, 37, 57, 1, 42, 1, "AUDIO");
workflow.links.push(
  [43, 36, 0, 55, 0, "CONDITIONING"],
  [44, 32, 0, 55, 1, "VAE"],
  [45, 35, 1, 55, 2, "LATENT"],
  [46, 54, 0, 55, 4, "LATENT"],
  [47, 33, 0, 55, 5, "VAE"],
  [48, 55, 1, 56, 1, "INT"],
  [49, 55, 1, 57, 2, "INT"],
  [50, 38, 0, 58, 0, "LATENT"],
  [51, 56, 0, 57, 1, "AUDIO"],
  [52, 54, 0, 56, 2, "LATENT"],
  [53, 33, 0, 56, 3, "VAE"],
  [54, 57, 0, 49, 0, "IMAGE"],
  [55, 57, 1, 49, 2, "AUDIO"],
  [56, 58, 0, 60, 0, "*"],
  [57, 56, 1, 59, 0, "*"],
);

setOutputLinks(nodeById(workflow, 32), 0, [14, 30, 44]);
setOutputLinks(nodeById(workflow, 33), 0, [32, 47, 53]);
setOutputLinks(nodeById(workflow, 35), 1, [27, 45]);
setOutputLinks(nodeById(workflow, 36), 0, [43]);
setOutputLinks(nodeById(workflow, 38), 0, [29, 31, 50]);
setOutputLinks(nodeById(workflow, 41), 0, [34]);
setInputLink(nodeById(workflow, 49), "images", 54);
setInputLink(nodeById(workflow, 49), "audio", 55);

workflow.last_node_id = 60;
workflow.last_link_id = 57;
workflow.revision = 2;
workflow.extra = workflow.extra ?? {};
workflow.extra.codexM7MotionContext = {
  schema_version: 1,
  integrated_at: "2026-08-25",
  source_backup: path.relative(repoRoot, backupPath).replaceAll("\\", "/"),
  source_backup_sha256: baselineSha256,
  default_state: "both M7 groups bypassed; original Gold execution preserved",
  human_acceptance: humanAcceptance,
};

function assertGeometry(candidate) {
  const rectangles = candidate.nodes.map((node) => ({
    id: node.id,
    x: Number(node.pos[0]),
    y: Number(node.pos[1]),
    w: Number(node.size[0]),
    h: Number(node.size[1]),
  }));
  const overlaps = [];
  for (let index = 0; index < rectangles.length; index += 1) {
    for (let other = index + 1; other < rectangles.length; other += 1) {
      const a = rectangles[index];
      const b = rectangles[other];
      if (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      ) {
        overlaps.push([a.id, b.id]);
      }
    }
  }
  const breaches = [];
  for (const group of candidate.groups) {
    const [gx, gy, gw, gh] = group.bounding.map(Number);
    for (const node of rectangles) {
      const intersects =
        node.x < gx + gw &&
        node.x + node.w > gx &&
        node.y < gy + gh &&
        node.y + node.h > gy;
      const contained =
        node.x >= gx &&
        node.y >= gy &&
        node.x + node.w <= gx + gw &&
        node.y + node.h <= gy + gh;
      if (intersects && !contained) breaches.push([group.id, node.id]);
    }
  }
  if (overlaps.length || breaches.length) {
    throw new Error(
      `Integrated Gold geometry failure: ${JSON.stringify({ overlaps, breaches })}`,
    );
  }
  console.log("Integrated Gold geometry: 0 overlaps, 0 group breaches");
}

assertGeometry(workflow);

const outputBytes = Buffer.from(`${JSON.stringify(workflow, null, 2)}\n`, "utf8");
const outputHash = sha256(outputBytes);
for (const target of [goldPath, liveGoldPath]) {
  if (fs.existsSync(target)) {
    const targetHash = sha256(fs.readFileSync(target));
    if (targetHash !== baselineSha256 && targetHash !== outputHash) {
      throw new Error(
        `Refusing to overwrite changed Gold target ${target}: ${targetHash}`,
      );
    }
  }
}

for (const target of [goldPath, liveGoldPath]) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, outputBytes);
  if (sha256(fs.readFileSync(target)) !== outputHash) {
    throw new Error(`Gold write verification failed: ${target}`);
  }
  console.log(target);
}

if (sha256(fs.readFileSync(backupPath)) !== baselineSha256) {
  throw new Error("Pre-M7 backup changed during integration");
}

console.log(`Integrated Gold SHA-256: ${outputHash}`);
console.log(`Pre-M7 backup SHA-256: ${baselineSha256}`);
