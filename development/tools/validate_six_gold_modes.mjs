import { requireComfyRoot } from "./local_paths.cjs";
import fs from "node:fs";
import path from "node:path";

const root = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const cases = [
  ["07 GOLD STANDARD - Complete Krea2 Pipeline.json", "quick_draft", 1, false, 768, 4, false, 1, 2],
  ["Operating Modes/01 Quick Draft.json", "quick_draft", 1, false, 768, 4, false, 1, 2],
  ["Operating Modes/02 Prompt Exploration - Batch of 10.json", "prompt_exploration", 2, true, 768, 6, false, 1, 2],
  ["Operating Modes/03 Gold Still - Double Sampler + SeedVR2.json", "gold_still", 1, true, 1024, 8, false, 1, 2],
  ["Operating Modes/04 H3 Preview - Pass 1 + Turbo.json", "h3_preview", 1, false, 768, 4, true, 2, 1],
  ["Operating Modes/05 H3 Final - Pass 2 + Base Quality.json", "h3_final", 1, true, 1024, 8, true, 1, 2],
  ["Operating Modes/06 Comparison Lab - All Still Paths.json", "comparison_lab", 1, false, 1024, 8, false, 1, 2],
];

function assert(ok, message) { if (!ok) throw new Error(message); }
function node(g, id) { return g.nodes.find((n) => n.id === id); }

function validateGraph(g, label) {
  const nodes = new Map();
  for (const n of g.nodes) {
    assert(!nodes.has(n.id), `${label}: duplicate node ${n.id}`);
    nodes.set(n.id, n);
  }
  const links = new Map();
  for (const l of g.links) {
    assert(!links.has(l[0]), `${label}: duplicate link ${l[0]}`);
    links.set(l[0], l);
    const origin = nodes.get(l[1]);
    const target = nodes.get(l[3]);
    assert(origin, `${label}: link ${l[0]} missing origin ${l[1]}`);
    assert(target, `${label}: link ${l[0]} missing target ${l[3]}`);
    assert(origin.outputs?.[l[2]], `${label}: link ${l[0]} bad origin slot`);
    assert(target.inputs?.[l[4]], `${label}: link ${l[0]} bad target slot`);
    assert(target.inputs[l[4]].link === l[0], `${label}: link ${l[0]} not recorded by target`);
    assert(origin.outputs[l[2]].links?.includes(l[0]), `${label}: link ${l[0]} not recorded by origin`);
  }
  for (const n of g.nodes) {
    for (const input of n.inputs || []) if (input.link != null) assert(links.has(input.link), `${label}: node ${n.id} input refers to missing link ${input.link}`);
    for (const output of n.outputs || []) for (const id of output.links || []) assert(links.has(id), `${label}: node ${n.id} output refers to missing link ${id}`);
  }
  assert(node(g, 206)?.type === "PixaromaSwitch", `${label}: H3 first-frame switch missing`);
  assert(node(g, 207)?.type === "GoldWorkflowModeSelector", `${label}: operating-mode controller missing`);
  assert(node(g, 208)?.type === "PixaromaNote", `${label}: operating-mode guide missing`);
  const modeGroup = g.extra?.pixaromaGroups?.find((x) => x.id === "pg_gold_9_modes");
  assert(modeGroup, `${label}: operating-mode group missing`);
  for (const id of [207, 208]) {
    const n = node(g, id);
    assert(n.pos[0] >= modeGroup.x && n.pos[1] >= modeGroup.y, `${label}: node ${id} breaches mode group top/left`);
    assert(n.pos[0] + n.size[0] <= modeGroup.x + modeGroup.w, `${label}: node ${id} breaches mode group right`);
    assert(n.pos[1] + n.size[1] <= modeGroup.y + modeGroup.h, `${label}: node ${id} breaches mode group bottom`);
  }
  const a = node(g, 207), b = node(g, 208);
  assert(a.pos[1] + a.size[1] < b.pos[1], `${label}: mode selector overlaps mode guide`);
}

const report = [];
for (const [relative, mode, prompt, ai, size, steps, h3, h3Path, firstFrame] of cases) {
  const file = path.join(root, relative);
  const g = JSON.parse(fs.readFileSync(file, "utf8"));
  validateGraph(g, relative);
  assert(node(g, 207).properties.goldModeState.activeMode === mode, `${relative}: wrong active mode`);
  assert(node(g, 177).properties.switchState.activeIndex === prompt, `${relative}: wrong prompt route`);
  assert((node(g, 178).mode === 0) === ai, `${relative}: wrong Krea AI state`);
  assert(node(g, 169).widgets_values.w === size, `${relative}: wrong resolution`);
  assert(node(g, 149).widgets_values[2] === steps, `${relative}: wrong Pass 1 steps`);
  assert((node(g, 200).mode === 0) === h3, `${relative}: wrong H3 saver state`);
  assert(node(g, 205).properties.switchState.activeIndex === h3Path, `${relative}: wrong H3 quality path`);
  assert(node(g, 206).properties.switchState.activeIndex === firstFrame, `${relative}: wrong H3 first-frame path`);
  report.push({ file: relative, mode, nodes: g.nodes.length, links: g.links.length, prompt, ai, size, steps, h3, h3Path, firstFrame });
}

console.log(JSON.stringify({ ok: true, workflows: report }, null, 2));
