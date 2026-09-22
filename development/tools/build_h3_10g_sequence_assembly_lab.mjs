import { requireComfyRoot } from "./local_paths.cjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const workflowName = "10G H3 Sequence Assembly Lab.json";
const expectedGoldSha256 = "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";
const repoWorkflowRoot = path.join(repoRoot, "workflows", "Codex MCP Demos");
const goldPath = path.join(
  repoWorkflowRoot,
  "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json",
);
const repoWorkflowPath = path.join(repoWorkflowRoot, workflowName);
const liveWorkflowPath = path.join(liveRoot, workflowName);
const prepApiPath = path.join(repoRoot, "tests", "h3_m6_accepted_fixture_take_api.json");
const smokeApiPath = path.join(repoRoot, "tests", "h3_m6_sequence_assembly_smoke_api.json");

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
  return { name, type, link, ...(widget ? { widget: { name } } : {}) };
}

function output(name, type, links = []) {
  return { name, type, links };
}

const project = "H3 M6 Live Validation 2026-08-25";
const acceptedTakeId = "fixture/accepted-red/main/take-0001";
const matchingSources = JSON.stringify([
  { take_id: acceptedTakeId, media_index: 0, label: "Accepted red take" },
  { path: "H3_M6_Fixtures/match_b.mp4", label: "Manual blue segment" },
]);
const mismatchSources = JSON.stringify([
  { path: "H3_M6_Fixtures/match_a.mp4", label: "64x48 source" },
  { path: "H3_M6_Fixtures/mismatch_dimensions.mp4", label: "48x32 source" },
]);

function assemblerNode(id, pos, title, assemblyName, sources, action, links) {
  return {
    id,
    type: "CodexH3SequenceAssembler",
    pos,
    size: [720, 560],
    flags: {},
    order: id - 1,
    mode: 0,
    inputs: [
      input("project", "STRING"),
      input("assembly_name", "STRING"),
      input("sources_json", "STRING"),
      input("action", "COMBO"),
    ],
    outputs: [
      output("status", "STRING", links.status),
      output("output_path", "STRING", links.output || []),
      output("manifest_path", "STRING"),
      output("assembly_manifest_json", "STRING", links.manifest || []),
      output("transcode_plan_json", "STRING", links.transcode || []),
    ],
    title,
    properties: { "Node name for S&R": "CodexH3SequenceAssembler" },
    widgets_values: [project, assemblyName, sources, action],
    color: action === "inspect only" ? "#355C7D" : "#2E7D32",
    bgcolor: "#2a2a2a",
  };
}

function showTextNode(id, pos, title, link, color, height = 360) {
  return {
    id,
    type: "PixaromaShowText",
    pos,
    size: [560, height],
    flags: {},
    order: id - 1,
    mode: 0,
    inputs: [input("source", "*", link, false)],
    outputs: [output("text", "STRING")],
    title,
    properties: { "Node name for S&R": "PixaromaShowText" },
    widgets_values: [""],
    color,
    bgcolor: "#2a2a2a",
  };
}

const workflow = {
  id: "10600000-0000-4000-8000-000000000006",
  revision: 0,
  last_node_id: 11,
  last_link_id: 8,
  nodes: [
    {
      id: 1,
      type: "PixaromaNote",
      pos: [20, 20],
      size: [3300, 250],
      flags: {},
      order: 0,
      mode: 0,
      inputs: [input("note_json", "STRING")],
      outputs: [],
      title: "START HERE — PROJECT-LEVEL DELIVERY ASSEMBLY",
      properties: { "Node name for S&R": "PixaromaNote" },
      widgets_values: [
        JSON.stringify({
          version: 1,
          content: "<h2>M6 SEQUENCE ASSEMBLY LAB</h2><ol><li>Run tools/prepare_h3_m6_fixtures.ps1 once, then run the retained accepted-take prep graph once.</li><li>Inspect resolves the ordered accepted/manual sources, verifies hashes, and compares complete video/audio contracts without writing media.</li><li>Lossless assembly uses FFmpeg stream copy only for a matching contract. The mismatch lane writes nothing and returns the exact fields plus an explicit normalizing-transcode plan.</li></ol><p>This is a separate delivery workflow. It never changes source clips and does not duplicate Multishot's in-memory within-run stitcher. No model, sampler, partner node, or paid route is present.</p>",
          buttonColor: "#f66744",
          lineColor: "#f66744",
          width: 3300,
          height: 220,
          backgroundColor: "#2a2a2a",
        }),
        "",
      ],
      color: "#1d1d1d",
      bgcolor: "#2a2a2a",
    },
    assemblerNode(2, [40, 340], "1. INSPECT ACCEPTED + MANUAL SOURCES", "Accepted plus manual inspection", matchingSources, "inspect only", { status: [1], manifest: [2] }),
    assemblerNode(3, [900, 340], "2. LOSSLESS PROJECT DELIVERY", "Accepted red then manual blue", matchingSources, "assemble lossless", { status: [3], output: [4], manifest: [5] }),
    assemblerNode(4, [1760, 340], "3. MISMATCH REFUSAL", "Dimension mismatch refusal", mismatchSources, "assemble lossless", { status: [6], transcode: [7] }),
    showTextNode(5, [40, 980], "INSPECTION STATUS", 1, "#355C7D"),
    showTextNode(6, [640, 980], "INSPECTION MANIFEST", 2, "#355C7D", 720),
    showTextNode(7, [1240, 980], "ASSEMBLY STATUS", 3, "#2E7D32"),
    showTextNode(8, [1840, 980], "ASSEMBLED OUTPUT PATH", 4, "#2E7D32"),
    showTextNode(9, [2440, 980], "ASSEMBLY MANIFEST", 5, "#2E7D32", 720),
    showTextNode(10, [40, 1740], "REFUSAL STATUS", 6, "#f66744"),
    showTextNode(11, [640, 1740], "EXPLICIT TRANSCODE PLAN", 7, "#f66744", 600),
  ],
  links: [
    [1, 2, 0, 5, 0, "*"],
    [2, 2, 3, 6, 0, "*"],
    [3, 3, 0, 7, 0, "*"],
    [4, 3, 1, 8, 0, "*"],
    [5, 3, 3, 9, 0, "*"],
    [6, 4, 0, 10, 0, "*"],
    [7, 4, 4, 11, 0, "*"],
  ],
  groups: [
    { title: "1 — INSPECT ONLY", bounding: [20, 300, 780, 640], color: "#355C7D", font_size: 22 },
    { title: "2 — MATCHED LOSSLESS DELIVERY", bounding: [860, 300, 800, 640], color: "#2E7D32", font_size: 22 },
    { title: "3 — FAIL-CLOSED MISMATCH", bounding: [1720, 300, 800, 640], color: "#f66744", font_size: 22 },
    { title: "4 — REVIEWABLE RECORDS", bounding: [20, 940, 3040, 1460], color: "#6A4C93", font_size: 22 },
  ],
  config: {},
  extra: { ds: { scale: 0.58, offset: [40, 40] } },
  version: 0.4,
};

const prepApi = {
  "1": {
    class_type: "CodexH3ProjectControl",
    inputs: {
      project,
      scene: "Fixture",
      shot: "Accepted red",
      branch: "main",
      engine: "m6-fixture-no-render",
      model: "(no model loaded)",
      lora: "(none)",
      profile: "Assembly fixture",
      prompt: "Red fixture clip for project-level assembly validation.",
      references_json: "[]",
      parent_handoff: "",
      native_width: 64,
      native_height: 48,
      delivery_width: 64,
      delivery_height: 48,
      seed: 606,
    },
  },
  "2": {
    class_type: "CodexH3TakeRecorder",
    inputs: {
      token: ["1", 0],
      take_state: "accepted",
      output_paths: "H3_M6_Fixtures/match_a.mp4",
      completion_signal: "M6 fixture prepared",
      accepted_signal: true,
    },
  },
};

const smokeApi = {
  "1": {
    class_type: "CodexH3SequenceAssembler",
    inputs: { project, assembly_name: "Accepted red then manual blue", sources_json: matchingSources, action: "assemble lossless" },
  },
  "2": {
    class_type: "CodexH3SequenceAssembler",
    inputs: { project, assembly_name: "Dimension mismatch refusal", sources_json: mismatchSources, action: "assemble lossless" },
  },
  "3": { class_type: "PixaromaShowText", inputs: { source: ["1", 0] } },
  "4": { class_type: "PixaromaShowText", inputs: { source: ["1", 3] } },
  "5": { class_type: "PixaromaShowText", inputs: { source: ["2", 0] } },
  "6": { class_type: "PixaromaShowText", inputs: { source: ["2", 4] } },
};

function assertGeometry() {
  const rectangles = workflow.nodes.map((node) => ({
    id: node.id,
    left: node.pos[0],
    top: node.pos[1],
    right: node.pos[0] + node.size[0],
    bottom: node.pos[1] + node.size[1],
  }));
  const overlaps = [];
  for (let aIndex = 0; aIndex < rectangles.length; aIndex += 1) {
    for (let bIndex = aIndex + 1; bIndex < rectangles.length; bIndex += 1) {
      const a = rectangles[aIndex];
      const b = rectangles[bIndex];
      if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
        overlaps.push([a.id, b.id]);
      }
    }
  }
  const breaches = rectangles.filter(
    (rect) => rect.left < 20 || rect.top < 20 || rect.right > 3340 || rect.bottom > 2420,
  );
  if (overlaps.length || breaches.length) {
    throw new Error(`10G geometry failure: ${JSON.stringify({ overlaps, breaches })}`);
  }
}

assertGeometry();
for (const outputPath of [repoWorkflowPath, liveWorkflowPath]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(outputPath);
}
fs.writeFileSync(prepApiPath, `${JSON.stringify(prepApi, null, 2)}\n`);
fs.writeFileSync(smokeApiPath, `${JSON.stringify(smokeApi, null, 2)}\n`);
console.log(prepApiPath);
console.log(smokeApiPath);
console.log(`10G SHA-256: ${sha256(fs.readFileSync(repoWorkflowPath))}`);
console.log(`Gold SHA-256: ${goldHash}`);
