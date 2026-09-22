import { requireComfyRoot } from "./local_paths.cjs";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const backupName = "H3_Seamless_Chain_v2 - UPSTREAM 2.6.5 - 2026-08-25.json";
const workflowName = "10B H3 Automated Dialogue Chain Lab.json";
const backupPath = path.join(
  repoRoot,
  "workflows",
  "Codex MCP Demos",
  "Backups",
  "10B H3 Automated Dialogue Chain",
  backupName,
);
const repoWorkflow = path.join(repoRoot, "workflows", "Codex MCP Demos", workflowName);
const liveWorkflow = path.join(liveRoot, workflowName);

const workflow = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const byId = new Map(workflow.nodes.map((node) => [node.id, node]));

function node(id) {
  const value = byId.get(id);
  if (!value) throw new Error(`Upstream workflow no longer contains node ${id}`);
  return value;
}

function replaceWithNote(id, title, text) {
  const value = node(id);
  value.type = "Note";
  value.title = title;
  value.mode = 0;
  value.inputs = [];
  value.outputs = [];
  value.widgets_values = text;
  value.properties = { "Node name for S&R": "Note" };
}

function removeLinks(ids) {
  const removed = new Set(ids);
  workflow.links = workflow.links.filter((link) => !removed.has(link[0]));
  for (const value of workflow.nodes) {
    for (const input of value.inputs ?? []) {
      if (removed.has(input.link)) input.link = null;
    }
    for (const output of value.outputs ?? []) {
      if (Array.isArray(output.links)) {
        output.links = output.links.filter((linkId) => !removed.has(linkId));
      }
    }
  }
}

function connect(fromId, outputIndex, toId, inputName, type) {
  const from = node(fromId);
  const to = node(toId);
  const targetIndex = to.inputs.findIndex((input) => input.name === inputName);
  if (targetIndex < 0) throw new Error(`Node ${toId} has no ${inputName} input`);
  const linkId = Math.max(workflow.last_link_id ?? 0, ...workflow.links.map((link) => link[0])) + 1;
  workflow.links.push([linkId, fromId, outputIndex, toId, targetIndex, type]);
  to.inputs[targetIndex].link = linkId;
  from.outputs[outputIndex].links ??= [];
  from.outputs[outputIndex].links.push(linkId);
  workflow.last_link_id = linkId;
}

const upstreamScript = node(30).widgets_values[0];

for (const id of [2, 30]) {
  node(id).widgets_values = node(id).widgets_values.map((value) =>
    value === "beta57" ? "beta" : value,
  );
}
node(15).widgets_values[0] = String.raw`H3\minimax_h3_ref2va_pruned_int8_convrot.safetensors`;
node(32).widgets_values[0] = "(no prompt files found)";
node(45).title = "MANUAL SHOT SCRIPT (selected while file prompts are OFF)";
node(45).widgets_values[0] = upstreamScript;
node(8).widgets_values = [
  "M1 LOCAL COMPATIBILITY ROUTE\n\nOFF = the manual --- separated script below.\nON = RiftPromptSource after a local prompt file is selected.\n\nThe optional JoyEcho writer is not installed, so this lab routes the selected script directly into the Multishot sampler. The exact upstream v2 graph is retained in the 10B backup folder.",
];

removeLinks([26, 27, 63, 67, 71, 97]);
replaceWithNote(
  6,
  "M1 COMPATIBILITY NOTE — JoyEcho intentionally omitted",
  "The optional JoyEcho writer shipped inside the Multishot release but is not installed as a node pack here. This lab keeps exact dialogue under direct operator control and routes the selected --- separated script straight to the sampler.",
);
replaceWithNote(
  7,
  "SCRIPT PREVIEW — use the manual script widget",
  "The optional pysssss text preview is not required. Review the complete script in MANUAL SHOT SCRIPT before queueing.",
);
connect(46, 0, 30, "script", "STRING");

// The upstream 2.6.5 canvas has three small node overlaps and leaves the
// reference selector just outside its group. Keep the lab mechanically clear.
node(4).pos[1] = 366;
node(11).pos[1] = 1825;
node(55).pos[1] = 2068;
const referenceGroup = workflow.groups.find((group) =>
  group.title === "REFERENCE IMAGES (ref2va)",
);
if (!referenceGroup) throw new Error("Upstream reference group is missing");
referenceGroup.bounding[3] = 1085;

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
    throw new Error(`10B geometry failure: ${JSON.stringify({ overlaps, breaches })}`);
  }
}

assertGeometry();

for (const outputPath of [repoWorkflow, liveWorkflow]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(outputPath);
}
