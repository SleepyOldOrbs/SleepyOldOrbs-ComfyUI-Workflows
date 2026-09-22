import { requireComfyRoot } from "./local_paths.cjs";
import fs from "node:fs";
import path from "node:path";

const root = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const sourcePath = path.join(root, "07 GOLD STANDARD - Complete Krea2 Pipeline.json");
const backupPath = path.join(root, "07 GOLD STANDARD - BACKUP before Six Operating Modes - 2026-08-21.json");
const modesDir = path.join(root, "Operating Modes");

const modeDefs = {
  quick_draft: { file: "01 Quick Draft.json", prompt: 1, ai: false, size: 768, steps: 4, still: [155], h3: false, h3Path: 1, firstFrame: 2 },
  prompt_exploration: { file: "02 Prompt Exploration - Batch of 10.json", prompt: 2, ai: true, size: 768, steps: 6, still: [155], h3: false, h3Path: 1, firstFrame: 2 },
  gold_still: { file: "03 Gold Still - Double Sampler + SeedVR2.json", prompt: 1, ai: true, size: 1024, steps: 8, still: [162, 163, 164, 166, 167, 168], h3: false, h3Path: 1, firstFrame: 2 },
  h3_preview: { file: "04 H3 Preview - Pass 1 + Turbo.json", prompt: 1, ai: false, size: 768, steps: 4, still: [], h3: true, h3Path: 2, firstFrame: 1 },
  h3_final: { file: "05 H3 Final - Pass 2 + Base Quality.json", prompt: 1, ai: true, size: 1024, steps: 8, still: [], h3: true, h3Path: 1, firstFrame: 2 },
  comparison_lab: { file: "06 Comparison Lab - All Still Paths.json", prompt: 1, ai: false, size: 1024, steps: 8, still: [12, 141, 155, 156, 160, 161, 162, 163, 164, 165, 166, 167, 168, 172, 173], h3: false, h3Path: 1, firstFrame: 2 },
};

const CORE_IDS = [40, 53, 54, 82, 143, 146, 147, 148, 149, 150, 151, 153, 154, 169, 170, 171, 177, 179, 181, 182, 183];
const STILL_IDS = [12, 141, 155, 156, 160, 161, 162, 163, 164, 165, 166, 167, 168, 172, 173];
const H3_IDS = [187, 202, 192, 193, 196, 191, 188, 189, 190, 194, 195, 197, 198, 199, 200, 201, 203, 204, 205, 206];

function clone(x) { return JSON.parse(JSON.stringify(x)); }
function node(g, id) { return g.nodes.find((n) => n.id === id); }
function setMode(g, ids, mode) { for (const id of ids) { const n = node(g, id); if (n) n.mode = mode; } }
function setSwitch(g, id, active) { const n = node(g, id); if (n) n.properties.switchState.activeIndex = active; }

function makePixaromaSwitch(id, order) {
  return {
    id, type: "PixaromaSwitch", pos: [600, -1020], size: [500, 100], flags: {}, order, mode: 2,
    inputs: [
      { label: "​", name: "input_1", type: "*", link: 85 },
      { label: "​", name: "input_2", type: "*", link: 86 },
      { label: "​", name: "input_3", type: "*", link: null },
    ],
    outputs: [{ localized_name: "output", name: "output", type: "IMAGE", links: [51, 56] }],
    title: "D7 — H3 FIRST FRAME: PASS 1 / GOLD PASS 2",
    properties: {
      aux_id: "pixaroma/ComfyUI-Pixaroma", ver: "72516552d286901accf5a10fe9619c89b6784932",
      "Node name for S&R": "PixaromaSwitch", cnr_id: "ComfyUI-Pixaroma",
      switchState: { activeIndex: 2, labels: { "1": "PREVIEW — Krea Pass 1", "2": "FINAL — Refined Pass 2" }, visibleCount: 3 },
    },
  };
}

function makeModeSelector(id, order) {
  return {
    id, type: "GoldWorkflowModeSelector", pos: [2350, -2150], size: [850, 330], flags: {}, order, mode: 0,
    inputs: [], outputs: [], title: "F1 — SIX ONE-CLICK OPERATING MODES",
    properties: { "Node name for S&R": "GoldWorkflowModeSelector", goldModeState: { version: 1, activeMode: "quick_draft" } },
  };
}

function makeNote(id, order) {
  const content = "<h2>Six operating modes</h2><ol><li><b>Quick Draft:</b> one fast 768 px Pass 1 image.</li><li><b>Prompt Exploration:</b> the ten-prompt Pixaroma batch, AI-enhanced, at draft quality.</li><li><b>Gold Still:</b> full 1024 px double-sampler image finished through SeedVR2.</li><li><b>H3 Preview:</b> Krea Pass 1 becomes the first frame; MiniMax uses the Turbo LoRA and 8-step route.</li><li><b>H3 Final:</b> refined Pass 2 becomes the first frame; MiniMax uses the 20-step Base route.</li><li><b>Comparison Lab:</b> saves Pass 1, Pass 2, RCAS, RTX and SeedVR2 outputs plus both Pixaroma comparisons.</li></ol><p>Choose a mode first, then edit prompts, tags, seeds or LoRAs. The existing switches remain available as manual overrides.</p>";
  return {
    id, type: "PixaromaNote", pos: [2350, -1740], size: [850, 820], flags: {}, order, mode: 0,
    inputs: [{ localized_name: "note_json", name: "note_json", type: "STRING", widget: { name: "note_json" }, link: null }], outputs: [],
    title: "F2 — MODE GUIDE & MANUAL OVERRIDES",
    properties: { aux_id: "pixaroma/ComfyUI-Pixaroma", ver: "72516552d286901accf5a10fe9619c89b6784932", "Node name for S&R": "PixaromaNote", cnr_id: "ComfyUI-Pixaroma" },
    widgets_values: [JSON.stringify({ version: 1, content, buttonColor: "#f6b944", lineColor: "#f6b944", width: 850, height: 820, backgroundColor: "#2a2a2a" }), ""],
  };
}

function extendStartNote(g) {
  const n = node(g, 158);
  if (!n) return;
  n.size = [7050, 480];
  const state = JSON.parse(n.widgets_values[0]);
  state.width = 7050;
  state.height = 480;
  state.content = "<h1>Pixaroma Gold Standard — Central Human Control Desk</h1><p>Start with <b>F — Operating Modes</b>: one click configures the workflow for Quick Draft, Prompt Exploration, Gold Still, H3 Preview, H3 Final or Comparison Lab.</p><p>Then use A–E to edit prompts and tags, AI instructions, image settings, MiniMax settings and manual overrides. The processing graph remains below; inactive expensive branches are muted or made unreachable.</p>";
  n.widgets_values[0] = JSON.stringify(state);
}

function addInfrastructure(g) {
  if (!node(g, 206)) g.nodes.push(makePixaromaSwitch(206, 64));
  if (!node(g, 207)) g.nodes.push(makeModeSelector(207, 65));
  if (!node(g, 208)) g.nodes.push(makeNote(208, 66));
  g.last_node_id = Math.max(g.last_node_id || 0, 208);

  // Rewire H3 image consumers through the lazy Pass 1 / Pass 2 selector.
  const l51 = g.links.find((l) => l[0] === 51); if (l51) { l51[1] = 206; l51[2] = 0; }
  const l56 = g.links.find((l) => l[0] === 56); if (l56) { l56[1] = 206; l56[2] = 0; }
  const n148 = node(g, 148); if (n148?.outputs?.[0]?.links) n148.outputs[0].links = n148.outputs[0].links.filter((id) => id !== 51 && id !== 56);
  const n154 = node(g, 154); if (n154?.outputs?.[0]?.links && !n154.outputs[0].links.includes(85)) n154.outputs[0].links.push(85);
  if (n148?.outputs?.[0]?.links && !n148.outputs[0].links.includes(86)) n148.outputs[0].links.push(86);
  if (!g.links.some((l) => l[0] === 85)) g.links.push([85, 154, 0, 206, 0, "IMAGE"]);
  if (!g.links.some((l) => l[0] === 86)) g.links.push([86, 148, 0, 206, 1, "IMAGE"]);
  g.last_link_id = Math.max(g.last_link_id || 0, 86);

  g.extra ||= {};
  g.extra.pixaromaGroups ||= [];
  if (!g.extra.pixaromaGroups.some((x) => x.id === "pg_gold_9_modes")) {
    g.extra.pixaromaGroups.push({
      id: "pg_gold_9_modes", title: "HUMAN CONTROLS F — SIX OPERATING MODES", x: 2300, y: -2250, w: 950, h: 2050,
      titleColor: "#8A6D1D", bodyColor: "#352f18", titleAlpha: 0.96, bodyAlpha: 0.42, fontSize: 18, folded: false, showLinks: true,
    });
  }
  extendStartNote(g);
}

function applyMode(g, id) {
  const d = modeDefs[id];
  setMode(g, CORE_IDS, 0);
  setMode(g, STILL_IDS, 2);
  setMode(g, H3_IDS, 2);
  node(g, 178).mode = d.ai ? 0 : 4;
  setSwitch(g, 177, d.prompt);
  setSwitch(g, 205, d.h3Path);
  setSwitch(g, 206, d.firstFrame);
  setMode(g, d.still, 0);
  if (d.h3) setMode(g, H3_IDS, 0);
  const res = node(g, 169);
  const rs = { mode: "preset", ratio: "1:1", w: d.size, h: d.size, custom_w: d.size, custom_h: d.size, custom_ratio_w: 1, custom_ratio_h: 1, snap: 16 };
  res.widgets_values = rs;
  res.properties.resolutionState = JSON.stringify(rs);
  node(g, 149).widgets_values[2] = d.steps;
  node(g, 207).properties.goldModeState.activeMode = id;
}

const original = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (!fs.existsSync(backupPath)) fs.copyFileSync(sourcePath, backupPath);
const gold = clone(original);
addInfrastructure(gold);
applyMode(gold, "quick_draft");
fs.writeFileSync(sourcePath, JSON.stringify(gold, null, 2) + "\n", "utf8");

fs.mkdirSync(modesDir, { recursive: true });
for (const [id, def] of Object.entries(modeDefs)) {
  const wf = clone(gold);
  applyMode(wf, id);
  fs.writeFileSync(path.join(modesDir, def.file), JSON.stringify(wf, null, 2) + "\n", "utf8");
}

console.log(JSON.stringify({ sourcePath, backupPath, modesDir, nodes: gold.nodes.length, links: gold.links.length, modes: Object.keys(modeDefs) }, null, 2));
