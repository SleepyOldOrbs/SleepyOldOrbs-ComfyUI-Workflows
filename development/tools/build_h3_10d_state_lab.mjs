import { requireComfyRoot } from "./local_paths.cjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const workflowName = "10D H3 Safe Project State Lab.json";
const expectedGoldSha256 = "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";
const repoWorkflowRoot = path.join(repoRoot, "workflows", "Codex MCP Demos");
const goldPath = path.join(
  repoWorkflowRoot,
  "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json",
);
const repoWorkflowPath = path.join(repoWorkflowRoot, workflowName);
const liveWorkflowPath = path.join(liveRoot, workflowName);
const normalApiPath = path.join(repoRoot, "tests", "h3_m3_normal_handoff_smoke_api.json");
const rejectionApiPath = path.join(
  repoRoot,
  "tests",
  "h3_m3_rejection_preserves_handoff_smoke_api.json",
);

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

const goldHash = sha256(fs.readFileSync(goldPath));
if (goldHash !== expectedGoldSha256) {
  throw new Error(
    `Protected Gold changed: expected ${expectedGoldSha256}, found ${goldHash}`,
  );
}

function input(name, type, link = null, widget = true) {
  return {
    name,
    type,
    link,
    ...(widget ? { widget: { name } } : {}),
  };
}

function output(name, type, links = []) {
  return { name, type, links };
}

const workflow = {
  id: "10d00000-0000-4000-8000-000000000003",
  revision: 0,
  last_node_id: 8,
  last_link_id: 9,
  nodes: [
    {
      id: 1,
      type: "PixaromaNote",
      pos: [20, 20],
      size: [2520, 250],
      flags: {},
      order: 0,
      mode: 0,
      inputs: [input("note_json", "STRING")],
      outputs: [],
      title: "START HERE — SAFE PROJECT STATE WITHOUT A GENERATION",
      properties: { "Node name for S&R": "PixaromaNote" },
      widgets_values: [
        JSON.stringify({
          version: 1,
          content: "<h2>M3 SAFE PROJECT STATE LAB</h2><ol><li>Choose a human-readable project, scene, shot and branch.</li><li>Load a known-good ending frame; this lab uses the real goat reference by default.</li><li>Run once. The control reserves a unique take, the gate checks the frame, and the recorder writes provenance and hashes.</li></ol><p><b>BLOCK TECHNICAL</b> rejects unreadable, non-finite, wrong-size, almost wholly black or almost wholly white frames. Unusual creative choices are not judged. Gold is not connected to this lab.</p>",
          buttonColor: "#f66744",
          lineColor: "#f66744",
          width: 2520,
          height: 220,
          backgroundColor: "#2a2a2a",
        }),
        "",
      ],
      color: "#1d1d1d",
      bgcolor: "#2a2a2a",
    },
    {
      id: 2,
      type: "LoadImage",
      pos: [900, 340],
      size: [500, 590],
      flags: {},
      order: 1,
      mode: 0,
      inputs: [input("image", "COMBO")],
      outputs: [
        output("IMAGE", "IMAGE", [1]),
        output("MASK", "MASK"),
      ],
      title: "KNOWN-GOOD FRAME — real goat reference",
      properties: { "Node name for S&R": "LoadImage", cnr_id: "comfy-core" },
      widgets_values: ["H3_Long_Form_Test_Start.png", "image"],
      color: "#B45574",
      bgcolor: "#2a2a2a",
    },
    {
      id: 3,
      type: "CodexH3ProjectControl",
      pos: [40, 340],
      size: [780, 980],
      flags: {},
      order: 2,
      mode: 0,
      inputs: [
        input("project", "STRING"),
        input("scene", "STRING"),
        input("shot", "STRING"),
        input("branch", "STRING"),
        input("engine", "STRING"),
        input("model", "STRING"),
        input("lora", "STRING"),
        input("profile", "STRING"),
        input("prompt", "STRING"),
        input("references_json", "STRING"),
        input("parent_handoff", "STRING"),
        input("native_width", "INT"),
        input("native_height", "INT"),
        input("delivery_width", "INT"),
        input("delivery_height", "INT"),
        input("seed", "INT"),
      ],
      outputs: [
        output("take_token", "H3_PROJECT_TAKE", [2, 3]),
        output("take_label", "STRING"),
        output("render_seed", "INT"),
        output("status", "STRING"),
      ],
      title: "1. PROJECT & TAKE — atomic identity and provenance",
      properties: { "Node name for S&R": "CodexH3ProjectControl" },
      widgets_values: [
        "H3 M3 Safe Project State Lab",
        "Reference Validation",
        "Goat handoff",
        "main",
        "state-lab-no-render",
        "(no model loaded)",
        "(none)",
        "technical handoff check",
        "Known-good goat reference used to prove M3 state handling.",
        '[{"id":"goat","path":"input/H3_Long_Form_Test_Start.png"}]',
        "",
        864,
        480,
        864,
        480,
        42,
      ],
      color: "#355C7D",
      bgcolor: "#2a2a2a",
    },
    {
      id: 4,
      type: "CodexH3SafeContinuationStore",
      pos: [1480, 340],
      size: [620, 350],
      flags: {},
      order: 3,
      mode: 0,
      inputs: [
        input("images", "IMAGE", 1, false),
        input("token", "H3_PROJECT_TAKE", 2, false),
        input("mode", "COMBO"),
        input("expected_width", "INT"),
        input("expected_height", "INT"),
        input("continuity_warning", "STRING"),
      ],
      outputs: [
        output("handoff_frame", "IMAGE", [4]),
        output("status", "STRING", [5, 7]),
        output("accepted", "BOOLEAN", [8]),
        output("handoff_path", "STRING", [6]),
        output("gate_record_json", "STRING"),
      ],
      title: "2. SAFETY GATE — only technical failures block",
      properties: { "Node name for S&R": "CodexH3SafeContinuationStore" },
      widgets_values: ["BLOCK TECHNICAL", 864, 480, ""],
      color: "#f66744",
      bgcolor: "#2a2a2a",
    },
    {
      id: 5,
      type: "CodexH3TakeRecorder",
      pos: [1480, 1030],
      size: [620, 390],
      flags: {},
      order: 4,
      mode: 0,
      inputs: [
        input("token", "H3_PROJECT_TAKE", 3, false),
        input("take_state", "COMBO"),
        input("output_paths", "STRING", 6, false),
        input("completion_signal", "STRING", 7, false),
        input("accepted_signal", "BOOLEAN", 8, false),
      ],
      outputs: [
        output("status", "STRING", [9]),
        output("take_record_json", "STRING"),
        output("take_manifest_path", "STRING"),
        output("project_index_path", "STRING"),
      ],
      title: "3. TAKE RECORDER — immutable provenance and media hashes",
      properties: { "Node name for S&R": "CodexH3TakeRecorder" },
      widgets_values: ["auto"],
      color: "#2E7D32",
      bgcolor: "#2a2a2a",
    },
    {
      id: 6,
      type: "PreviewImage",
      pos: [2160, 340],
      size: [380, 520],
      flags: {},
      order: 5,
      mode: 0,
      inputs: [input("images", "IMAGE", 4, false)],
      outputs: [],
      title: "INSPECTED HANDOFF — preview only",
      properties: { "Node name for S&R": "PreviewImage", cnr_id: "comfy-core" },
      widgets_values: [],
      color: "#2E7D32",
      bgcolor: "#2a2a2a",
    },
    {
      id: 7,
      type: "PixaromaShowText",
      pos: [1480, 730],
      size: [620, 220],
      flags: {},
      order: 6,
      mode: 0,
      inputs: [input("source", "*", 5, false)],
      outputs: [output("text", "STRING")],
      title: "GATE STATUS — accepted, warned, or blocked",
      properties: { "Node name for S&R": "PixaromaShowText" },
      widgets_values: [""],
      color: "#f66744",
      bgcolor: "#2a2a2a",
    },
    {
      id: 8,
      type: "PixaromaShowText",
      pos: [2160, 1030],
      size: [380, 260],
      flags: {},
      order: 7,
      mode: 0,
      inputs: [input("source", "*", 9, false)],
      outputs: [output("text", "STRING")],
      title: "TAKE STATUS — project record confirmed",
      properties: { "Node name for S&R": "PixaromaShowText" },
      widgets_values: [""],
      color: "#2E7D32",
      bgcolor: "#2a2a2a",
    },
  ],
  links: [
    [1, 2, 0, 4, 0, "IMAGE"],
    [2, 3, 0, 4, 1, "H3_PROJECT_TAKE"],
    [3, 3, 0, 5, 0, "H3_PROJECT_TAKE"],
    [4, 4, 0, 6, 0, "IMAGE"],
    [5, 4, 1, 7, 0, "*"],
    [6, 4, 3, 5, 2, "STRING"],
    [7, 4, 1, 5, 3, "STRING"],
    [8, 4, 2, 5, 4, "BOOLEAN"],
    [9, 5, 0, 8, 0, "*"],
  ],
  groups: [
    { title: "1 — PROJECT IDENTITY", bounding: [20, 300, 820, 1060], color: "#355C7D", font_size: 22 },
    { title: "2 — KNOWN FRAME", bounding: [880, 300, 540, 670], color: "#B45574", font_size: 22 },
    { title: "3 — TECHNICAL SAFETY", bounding: [1460, 300, 660, 680], color: "#f66744", font_size: 22 },
    { title: "4 — DURABLE EVIDENCE", bounding: [1460, 990, 1100, 470], color: "#2E7D32", font_size: 22 },
    { title: "5 — INSPECTION", bounding: [2140, 300, 420, 600], color: "#2E7D32", font_size: 22 },
  ],
  config: {},
  extra: { ds: { scale: 0.72, offset: [40, 40] } },
  version: 0.4,
};

const commonProjectInputs = {
  project: "H3 M3 Live Validation 2026-08-25",
  scene: "Reference Validation",
  shot: "Goat handoff",
  branch: "main",
  engine: "state-lab-no-render",
  model: "(no model loaded)",
  lora: "(none)",
  profile: "technical handoff check",
  prompt: "Known-good goat reference used to prove M3 state handling.",
  references_json: '[{"id":"goat","path":"input/H3_Long_Form_Test_Start.png"}]',
  parent_handoff: "",
  native_width: 864,
  native_height: 480,
  delivery_width: 864,
  delivery_height: 480,
  seed: 42,
};

function apiGraph(imageNode) {
  return {
    "1": imageNode,
    "2": { class_type: "CodexH3ProjectControl", inputs: commonProjectInputs },
    "3": {
      class_type: "CodexH3SafeContinuationStore",
      inputs: {
        images: ["1", 0],
        token: ["2", 0],
        mode: "BLOCK TECHNICAL",
        expected_width: 864,
        expected_height: 480,
        continuity_warning: "",
      },
    },
    "4": {
      class_type: "CodexH3TakeRecorder",
      inputs: {
        token: ["2", 0],
        take_state: "auto",
        output_paths: ["3", 3],
        completion_signal: ["3", 1],
        accepted_signal: ["3", 2],
      },
    },
    "5": { class_type: "PreviewImage", inputs: { images: ["3", 0] } },
  };
}

const normalApi = apiGraph({
  class_type: "LoadImage",
  inputs: { image: "H3_Long_Form_Test_Start.png" },
});
const rejectionApi = apiGraph({
  class_type: "EmptyImage",
  inputs: { width: 864, height: 480, batch_size: 1, color: 0 },
});

for (const outputPath of [repoWorkflowPath, liveWorkflowPath]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(outputPath);
}
fs.writeFileSync(normalApiPath, `${JSON.stringify(normalApi, null, 2)}\n`);
fs.writeFileSync(rejectionApiPath, `${JSON.stringify(rejectionApi, null, 2)}\n`);
console.log(normalApiPath);
console.log(rejectionApiPath);
console.log(`10D SHA-256: ${sha256(fs.readFileSync(repoWorkflowPath))}`);
console.log(`Gold SHA-256: ${goldHash}`);
