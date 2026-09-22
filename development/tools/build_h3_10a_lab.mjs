import { requireComfyRoot } from "./local_paths.cjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const goldName = "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json";
const workflowName = "10A H3 Production Tools Lab.json";
const backupName = "10A H3 Production Tools Lab - PRE-BENCHMARK - 2026-08-25.json";
const expectedGoldSha256 = "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";

const repoWorkflowRoot = path.join(repoRoot, "workflows", "Codex MCP Demos");
const goldPath = path.join(repoWorkflowRoot, goldName);
const repoWorkflow = path.join(repoWorkflowRoot, workflowName);
const liveWorkflow = path.join(liveRoot, workflowName);
const repoBackup = path.join(
  repoWorkflowRoot,
  "Backups",
  "10A H3 Production Tools",
  backupName,
);
const liveBackup = path.join(
  liveRoot,
  "Backups",
  "10A H3 Production Tools",
  backupName,
);
const smokePath = path.join(repoRoot, "tests", "h3_benchmark_recorder_smoke_api.json");
const baselineRenderPath = path.join(repoRoot, "tests", "h3_long_form_render_smoke_api.json");
const benchmarkRenderPath = path.join(
  repoRoot,
  "tests",
  "h3_benchmark_workflow10_baseline_api.json",
);

const goldBytes = fs.readFileSync(goldPath);
const goldSha256 = crypto.createHash("sha256").update(goldBytes).digest("hex");
if (goldSha256 !== expectedGoldSha256) {
  throw new Error(
    `Protected Gold changed: expected ${expectedGoldSha256}, found ${goldSha256}`,
  );
}

for (const backupPath of [repoBackup, liveBackup]) {
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  if (fs.existsSync(backupPath)) {
    const existing = fs.readFileSync(backupPath);
    const existingHash = crypto.createHash("sha256").update(existing).digest("hex");
    if (existingHash !== expectedGoldSha256) {
      throw new Error(`Refusing to replace drifted 10A pre-benchmark backup: ${backupPath}`);
    }
  } else {
    fs.writeFileSync(backupPath, goldBytes);
  }
}

const workflow = JSON.parse(goldBytes.toString("utf8"));
const byId = new Map(workflow.nodes.map((value) => [value.id, value]));

function node(id) {
  const value = byId.get(id);
  if (!value) throw new Error(`Gold workflow no longer contains node ${id}`);
  return value;
}

function input(name, type, link = null, widget = true) {
  return {
    name,
    type,
    link,
    ...(widget ? { widget: { name } } : {}),
  };
}

function output(name, type) {
  return { name, type, links: [] };
}

function addNode(value) {
  if (byId.has(value.id)) throw new Error(`Duplicate workflow node ${value.id}`);
  workflow.nodes.push(value);
  byId.set(value.id, value);
}

function removeLink(id) {
  workflow.links = workflow.links.filter((link) => link[0] !== id);
  for (const value of workflow.nodes) {
    for (const candidate of value.inputs ?? []) {
      if (candidate.link === id) candidate.link = null;
    }
    for (const candidate of value.outputs ?? []) {
      if (Array.isArray(candidate.links)) {
        candidate.links = candidate.links.filter((linkId) => linkId !== id);
      }
    }
  }
}

function connect(fromId, outputIndex, toId, inputName, type) {
  const from = node(fromId);
  const to = node(toId);
  const targetIndex = to.inputs.findIndex((candidate) => candidate.name === inputName);
  if (targetIndex < 0) throw new Error(`Node ${toId} has no ${inputName} input`);
  const linkId = Math.max(
    workflow.last_link_id ?? 0,
    ...workflow.links.map((link) => link[0]),
  ) + 1;
  workflow.links.push([linkId, fromId, outputIndex, toId, targetIndex, type]);
  to.inputs[targetIndex].link = linkId;
  const source = from.outputs[outputIndex];
  if (!source) throw new Error(`Node ${fromId} has no output ${outputIndex}`);
  source.links ??= [];
  source.links.push(linkId);
  workflow.last_link_id = linkId;
}

const labTitle = "10A H3 PRODUCTION TOOLS LAB — Workflow 10 Benchmark Recorder";
node(1).title = labTitle;
const labelState = JSON.parse(node(1).widgets_values[0]);
labelState.text = labTitle;
node(1).widgets_values[0] = JSON.stringify(labelState);

node(2).title = "START HERE — FIVE-STEP LOOP + LOCAL EVIDENCE";
const noteState = JSON.parse(node(2).widgets_values[0]);
noteState.content += "<p><b>Benchmark lab:</b> the benchmark start is wired into the real sampler seed path. After the decoded handoff is safely written, the recorder appends one local, deduplicated JSONL record. Keep project, model, profile and delivery settings aligned with the visible graph before comparing runs.</p>";
node(2).widgets_values[0] = JSON.stringify(noteState);

node(46).widgets_values = [false, "h3_production_lab"];

addNode({
  id: 51,
  type: "CodexH3BenchmarkStart",
  pos: [1940, 1990],
  size: [920, 560],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [
    input("project", "STRING"),
    input("engine", "STRING"),
    input("model", "STRING"),
    input("lora", "STRING"),
    input("profile", "STRING"),
    input("native_width", "INT"),
    input("native_height", "INT"),
    input("delivery_width", "INT"),
    input("delivery_height", "INT"),
    input("frame_count", "INT"),
    input("steps", "INT"),
    input("cfg", "FLOAT"),
    input("sampler", "STRING"),
    input("scheduler", "STRING"),
    input("seed", "INT"),
  ],
  outputs: [
    output("benchmark_token", "H3_BENCHMARK_TOKEN"),
    output("render_seed", "INT"),
  ],
  title: "BENCHMARK START — exact settings on the sampler dependency path",
  properties: { "Node name for S&R": "CodexH3BenchmarkStart" },
  widgets_values: [
    "H3 Workflow 10 Baseline",
    "workflow-10",
    String.raw`H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`,
    "(none)",
    "BALANCED — RTX 1.5x HIGH (recommended)",
    864,
    480,
    1296,
    720,
    124,
    20,
    1.0,
    "res_multistep",
    "simple",
    2408241001,
  ],
  color: "#355C7D",
  bgcolor: "#2a2a2a",
});

addNode({
  id: 52,
  type: "CodexH3BenchmarkRecorder",
  pos: [3040, 3100],
  size: [1180, 390],
  flags: {},
  order: 0,
  mode: 0,
  inputs: [
    input("token", "H3_BENCHMARK_TOKEN", null, false),
    input("output_path", "STRING"),
    input("completion_state", "COMBO"),
    input("peak_vram_mb", "FLOAT"),
    input("completion_signal", "STRING"),
  ],
  outputs: [
    output("status", "STRING"),
    output("record_json", "STRING"),
    output("manifest_path", "STRING"),
  ],
  title: "BENCHMARK RECORDER — atomic local JSONL after stable handoff",
  properties: { "Node name for S&R": "CodexH3BenchmarkRecorder" },
  widgets_values: [
    "H3_Long_Form/_auto_chain/h3_production_lab.png",
    "auto",
    0.0,
    "",
  ],
  color: "#2E7D32",
  bgcolor: "#2a2a2a",
});

const statusNode = JSON.parse(JSON.stringify(node(48)));
statusNode.id = 53;
statusNode.pos = [3040, 3530];
statusNode.size = [1180, 160];
statusNode.title = "BENCHMARK STATUS — confirms recorded, cached, or duplicate";
statusNode.inputs[0].link = null;
statusNode.outputs[0].links = [];
statusNode.widgets_values = ["Benchmark status appears after the first lab run."];
addNode(statusNode);

removeLink(28);
connect(34, 0, 51, "seed", "INT");
connect(51, 1, 38, "seed", "INT");
connect(12, 1, 51, "native_width", "INT");
connect(12, 2, 51, "native_height", "INT");
connect(20, 1, 51, "frame_count", "INT");
connect(51, 0, 52, "token", "H3_BENCHMARK_TOKEN");
connect(47, 1, 52, "completion_signal", "STRING");
connect(52, 0, 53, "source", "*");

workflow.last_node_id = 53;
const renderGroup = workflow.extra.pixaromaGroups.find((group) => group.id === "pg_h3lf_3");
const deliveryGroup = workflow.extra.pixaromaGroups.find((group) => group.id === "pg_h3lf_4");
if (!renderGroup || !deliveryGroup) throw new Error("Gold Pixaroma groups are missing");
renderGroup.h = 2160;
renderGroup.title = "3 — DEPENDABLE H3 RENDER SPINE & BENCHMARK START";
deliveryGroup.h = 3300;
deliveryGroup.title = "4 — DELIVERY, HANDOFF & LOCAL BENCHMARK RECORD";

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
      if (
        a.x < b.x + b.width && a.x + a.width > b.x
        && a.y < b.y + b.height && a.y + a.height > b.y
      ) {
        overlaps.push([a.id, b.id]);
      }
    }
  }
  const groups = workflow.extra.pixaromaGroups;
  const breaches = rectangles
    .filter((value) => ![1, 2].includes(value.id))
    .filter((value) => {
      const owners = groups.filter((group) => (
        value.x >= group.x && value.y >= group.y
        && value.x + value.width <= group.x + group.w
        && value.y + value.height <= group.y + group.h
      ));
      return owners.length !== 1;
    })
    .map((value) => value.id);
  if (overlaps.length || breaches.length) {
    throw new Error(`10A geometry failure: ${JSON.stringify({ overlaps, breaches })}`);
  }
}

assertGeometry();

const smoke = {
  "1": {
    class_type: "CodexH3BenchmarkStart",
    inputs: {
      project: "H3 Benchmark API Smoke",
      engine: "api-smoke",
      model: "none",
      lora: "(none)",
      profile: "terminal-state-only",
      native_width: 864,
      native_height: 480,
      delivery_width: 864,
      delivery_height: 480,
      frame_count: 1,
      steps: 1,
      cfg: 1.0,
      sampler: "none",
      scheduler: "none",
      seed: 42,
    },
  },
  "2": {
    class_type: "CodexH3BenchmarkRecorder",
    inputs: {
      token: ["1", 0],
      output_path: "H3_Production_Smoke/expected-missing-output.bin",
      completion_state: "interrupted",
      peak_vram_mb: 0.0,
      completion_signal: "retained API smoke terminal state",
    },
  },
};

const benchmarkRender = JSON.parse(fs.readFileSync(baselineRenderPath, "utf8"));
benchmarkRender["19"] = {
  class_type: "CodexH3BenchmarkStart",
  inputs: {
    project: "H3 Workflow 10 Baseline API",
    engine: "workflow-10",
    model: String.raw`H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`,
    lora: "(none)",
    profile: "native handoff; balanced delivery queued separately",
    native_width: 608,
    native_height: 352,
    delivery_width: 912,
    delivery_height: 528,
    frame_count: 124,
    steps: 6,
    cfg: 1.0,
    sampler: "res_multistep",
    scheduler: "simple",
    seed: 2408241001,
  },
};
benchmarkRender["12"].inputs.seed = ["19", 1];
benchmarkRender["20"] = {
  class_type: "CodexH3ContinuationStore",
  inputs: {
    images: ["16", 0],
    slot: "h3_benchmark_workflow10_api",
  },
};
benchmarkRender["21"] = {
  class_type: "CodexH3BenchmarkRecorder",
  inputs: {
    token: ["19", 0],
    output_path: "H3_Long_Form/_auto_chain/h3_benchmark_workflow10_api.png",
    completion_state: "auto",
    peak_vram_mb: 0.0,
    completion_signal: ["20", 1],
  },
};

for (const outputPath of [repoWorkflow, liveWorkflow]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(outputPath);
}
fs.writeFileSync(smokePath, `${JSON.stringify(smoke, null, 2)}\n`);
console.log(smokePath);
fs.writeFileSync(benchmarkRenderPath, `${JSON.stringify(benchmarkRender, null, 2)}\n`);
console.log(benchmarkRenderPath);
console.log(`Gold SHA-256: ${goldSha256}`);
