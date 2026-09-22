import { requireComfyRoot } from "./local_paths.cjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const liveRoot = path.join(requireComfyRoot(), "user", "default", "workflows", "Codex MCP Demos");
const workflowName = "10F H3 Continuity and References Lab.json";
const expectedGoldSha256 = "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";
const repoWorkflowRoot = path.join(repoRoot, "workflows", "Codex MCP Demos");
const goldPath = path.join(
  repoWorkflowRoot,
  "10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json",
);
const repoWorkflowPath = path.join(repoWorkflowRoot, workflowName);
const liveWorkflowPath = path.join(liveRoot, workflowName);
const apiPath = path.join(repoRoot, "tests", "h3_m5_continuity_refs_smoke_api.json");

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

const referenceFiles = [
  "Krea2_Ref2VA_Entity_902163455682300_00001_.png",
  "Krea2_Ref2VA_Entity_4215362728668739_00001_.png",
  "Krea2_Ref2VA_Entity_6068153734194764_00001_.png",
  "Krea2_Ref2VA_Entity_6603758560734249_00001_.png",
  "Krea2_Ref2VA_Entity_6942449730230515_00001_.png",
  "Krea2_Ref2VA_Entity_5227560524876038_00001_.png",
];

const entries = [
  {
    slot: 1,
    enabled: true,
    entity_id: "saxophonist",
    display_name: "Saxophonist",
    role: "character",
    view: "multi-view reference sheet",
    description: "Black woman with braided hair holding a saxophone",
    group_id: "cast",
  },
  {
    slot: 2,
    enabled: true,
    entity_id: "highland-cow",
    display_name: "Highland Cow",
    role: "creature",
    view: "multi-view reference sheet",
    description: "shaggy russet Highland cattle with long horns",
    group_id: "creatures",
  },
  {
    slot: 3,
    enabled: true,
    entity_id: "stone-library",
    display_name: "Stone Library",
    role: "location",
    view: "exterior turnaround",
    description: "small weathered stone library building",
    group_id: "locations",
  },
  {
    slot: 4,
    enabled: true,
    entity_id: "graphite-coupe",
    display_name: "Graphite Coupe",
    role: "vehicle",
    view: "vehicle turnaround",
    description: "graphite sports coupe with bronze wheels",
    group_id: "vehicles",
  },
  {
    slot: 5,
    enabled: true,
    entity_id: "yellow-drone",
    display_name: "Yellow Drone",
    role: "vehicle",
    view: "vehicle turnaround",
    description: "weathered yellow camera drone",
    group_id: "vehicles",
  },
  {
    slot: 6,
    enabled: true,
    entity_id: "amber-lamp",
    display_name: "Amber Lamp",
    role: "prop",
    view: "prop turnaround",
    description: "amber glass table lamp with a cream shade",
    group_id: "props",
  },
];
const entriesJson = JSON.stringify(entries);

const workflow = {
  id: "10f00000-0000-4000-8000-000000000005",
  revision: 0,
  last_node_id: 20,
  last_link_id: 25,
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
      title: "START HERE — ADVISORY CONTINUITY AND TYPED REFERENCES",
      properties: { "Node name for S&R": "PixaromaNote" },
      widgets_values: [
        JSON.stringify({
          version: 1,
          content: "<h2>M5 CONTINUITY + REFERENCES LAB</h2><ol><li>Continuity compares a known previous ending frame, current ending frame, and optional identity reference. Warnings are advisory and never block a take.</li><li>The reference manifest maps each enabled image to an explicit role, stable entity, view, description, and deterministic Picture number.</li><li>Connect the separate images, fitted batch, reference_subjects, and prompt preamble to the existing H3 Multishot inputs as needed.</li></ol><p>This retained lab uses existing local images only. It contains no model, sampler, partner node, paid route, or inferred identity labels. Protected Gold is not connected.</p>",
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
    {
      id: 2,
      type: "CodexH3ProjectControl",
      pos: [40, 340],
      size: [650, 880],
      flags: {},
      order: 1,
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
        output("take_token", "H3_PROJECT_TAKE", [3]),
        output("take_label", "STRING"),
        output("render_seed", "INT"),
        output("status", "STRING"),
      ],
      title: "1. PROJECT TAKE — history record target",
      properties: { "Node name for S&R": "CodexH3ProjectControl" },
      widgets_values: [
        "H3 M5 Continuity References Lab",
        "Continuity",
        "Reference audit",
        "main",
        "m5-state-lab-no-render",
        "(no model loaded)",
        "(none)",
        "Advisory audit",
        "Compare ending frames and build a typed reference manifest.",
        entriesJson,
        "",
        864,
        480,
        864,
        480,
        505,
      ],
      color: "#355C7D",
      bgcolor: "#2a2a2a",
    },
    {
      id: 3,
      type: "LoadImage",
      pos: [760, 340],
      size: [450, 330],
      flags: {},
      order: 2,
      mode: 0,
      inputs: [input("image", "COMBO")],
      outputs: [output("IMAGE", "IMAGE", [1, 5]), output("MASK", "MASK")],
      title: "2A. PREVIOUS ENDING FRAME",
      properties: { "Node name for S&R": "LoadImage", cnr_id: "comfy-core" },
      widgets_values: ["H3_Long_Form_Test_Start.png", "image"],
      color: "#B45574",
      bgcolor: "#2a2a2a",
    },
    {
      id: 4,
      type: "LoadImage",
      pos: [1260, 340],
      size: [450, 330],
      flags: {},
      order: 3,
      mode: 0,
      inputs: [input("image", "COMBO")],
      outputs: [output("IMAGE", "IMAGE", [2]), output("MASK", "MASK")],
      title: "2B. CURRENT ENDING FRAME",
      properties: { "Node name for S&R": "LoadImage", cnr_id: "comfy-core" },
      widgets_values: ["H3_Long_Form_Test_End.png", "image"],
      color: "#B45574",
      bgcolor: "#2a2a2a",
    },
    {
      id: 5,
      type: "CodexH3ContinuityMonitor",
      pos: [1780, 340],
      size: [650, 440],
      flags: {},
      order: 4,
      mode: 0,
      inputs: [
        input("previous_image", "IMAGE", 1, false),
        input("current_image", "IMAGE", 2, false),
        input("reference_image", "IMAGE", 5, false),
        input("take_token", "H3_PROJECT_TAKE", 3, false),
      ],
      outputs: [
        output("current_image", "IMAGE"),
        output("difference_image", "IMAGE", [6]),
        output("status", "STRING", [7]),
        output("advisory", "STRING", [8]),
        output("metrics_json", "STRING", [9]),
        output("chain_length", "INT"),
      ],
      title: "3. CONTINUITY MONITOR — advisory only",
      properties: { "Node name for S&R": "CodexH3ContinuityMonitor" },
      widgets_values: [],
      color: "#6A4C93",
      bgcolor: "#2a2a2a",
    },
    {
      id: 6,
      type: "PreviewImage",
      pos: [2500, 340],
      size: [380, 440],
      flags: {},
      order: 5,
      mode: 0,
      inputs: [input("images", "IMAGE", 6, false)],
      outputs: [],
      title: "ABSOLUTE DIFFERENCE — visual aid",
      properties: { "Node name for S&R": "PreviewImage", cnr_id: "comfy-core" },
      widgets_values: [],
      color: "#6A4C93",
      bgcolor: "#2a2a2a",
    },
    ...referenceFiles.map((file, index) => ({
      id: 7 + index,
      type: "LoadImage",
      pos: [40 + index * 510, 1340],
      size: [450, 330],
      flags: {},
      order: 6 + index,
      mode: 0,
      inputs: [input("image", "COMBO")],
      outputs: [output("IMAGE", "IMAGE", [10 + index]), output("MASK", "MASK")],
      title: `${index + 1}. ${entries[index].role.toUpperCase()} — ${entries[index].display_name}`,
      properties: { "Node name for S&R": "LoadImage", cnr_id: "comfy-core" },
      widgets_values: [file, "image"],
      color: "#B45574",
      bgcolor: "#2a2a2a",
    })),
    {
      id: 13,
      type: "CodexH3ReferenceManifest",
      pos: [40, 1780],
      size: [920, 760],
      flags: {},
      order: 12,
      mode: 0,
      inputs: [
        input("entries_json", "STRING"),
        ...referenceFiles.map((_, index) =>
          input(`image_${index + 1}`, "IMAGE", 10 + index, false),
        ),
      ],
      outputs: [
        ...Array.from({ length: 9 }, (_, index) => output(`ref_${index + 1}`, "IMAGE")),
        output("reference_batch", "IMAGE", [16]),
        output("reference_subjects", "STRING"),
        output("manifest_json", "STRING", [20]),
        output("prompt_preamble", "STRING", [19]),
        output("status", "STRING", [18]),
      ],
      title: "4. REFERENCE MANIFEST — typed deterministic mapping",
      properties: { "Node name for S&R": "CodexH3ReferenceManifest" },
      widgets_values: [entriesJson],
      color: "#2E7D32",
      bgcolor: "#2a2a2a",
    },
    {
      id: 14,
      type: "PreviewImage",
      pos: [1040, 1780],
      size: [520, 760],
      flags: {},
      order: 13,
      mode: 0,
      inputs: [input("images", "IMAGE", 16, false)],
      outputs: [],
      title: "FITTED MULTISHOT REFERENCE BATCH",
      properties: { "Node name for S&R": "PreviewImage", cnr_id: "comfy-core" },
      widgets_values: [],
      color: "#2E7D32",
      bgcolor: "#2a2a2a",
    },
    ...[
      [15, [1780, 860], "CONTINUITY STATUS", 7, "#6A4C93"],
      [16, [2310, 860], "CONTINUITY ADVISORY", 8, "#6A4C93"],
      [17, [2820, 860], "CONTINUITY METRICS JSON", 9, "#6A4C93"],
      [18, [1640, 1780], "MANIFEST STATUS", 18, "#2E7D32"],
      [19, [2190, 1780], "PROMPT PREAMBLE", 19, "#2E7D32"],
      [20, [2740, 1780], "MANIFEST JSON", 20, "#2E7D32"],
    ].map(([id, pos, title, link, color], index) => ({
      id,
      type: "PixaromaShowText",
      pos,
      size: [500, index >= 3 ? 760 : 360],
      flags: {},
      order: 14 + index,
      mode: 0,
      inputs: [input("source", "*", link, false)],
      outputs: [output("text", "STRING")],
      title,
      properties: { "Node name for S&R": "PixaromaShowText" },
      widgets_values: [""],
      color,
      bgcolor: "#2a2a2a",
    })),
  ],
  links: [
    [1, 3, 0, 5, 0, "IMAGE"],
    [2, 4, 0, 5, 1, "IMAGE"],
    [3, 2, 0, 5, 3, "H3_PROJECT_TAKE"],
    [5, 3, 0, 5, 2, "IMAGE"],
    [6, 5, 1, 6, 0, "IMAGE"],
    [7, 5, 2, 15, 0, "*"],
    [8, 5, 3, 16, 0, "*"],
    [9, 5, 4, 17, 0, "*"],
    ...referenceFiles.map((_, index) => [10 + index, 7 + index, 0, 13, 1 + index, "IMAGE"]),
    [16, 13, 9, 14, 0, "IMAGE"],
    [18, 13, 13, 18, 0, "*"],
    [19, 13, 12, 19, 0, "*"],
    [20, 13, 11, 20, 0, "*"],
  ],
  groups: [
    { title: "1 — ADVISORY CONTINUITY", bounding: [20, 300, 2900, 520], color: "#6A4C93", font_size: 22 },
    { title: "2 — CONTINUITY RECORDS", bounding: [20, 820, 3300, 420], color: "#355C7D", font_size: 22 },
    { title: "3 — EXISTING LOCAL REFERENCE ASSETS", bounding: [20, 1300, 3140, 410], color: "#B45574", font_size: 22 },
    { title: "4 — TYPED MANIFEST + MULTISHOT HANDOFF", bounding: [20, 1740, 3300, 840], color: "#2E7D32", font_size: 22 },
  ],
  config: {},
  extra: { ds: { scale: 0.52, offset: [40, 40] } },
  version: 0.4,
};

const apiGraph = {
  "1": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_Start.png" } },
  "2": { class_type: "LoadImage", inputs: { image: "H3_Long_Form_Test_End.png" } },
  "3": {
    class_type: "CodexH3ProjectControl",
    inputs: {
      project: "H3 M5 Live Validation 2026-08-25",
      scene: "Continuity",
      shot: "Reference audit",
      branch: "main",
      engine: "m5-state-lab-no-render",
      model: "(no model loaded)",
      lora: "(none)",
      profile: "Advisory audit",
      prompt: "Compare ending frames and build a typed reference manifest.",
      references_json: entriesJson,
      parent_handoff: "",
      native_width: 864,
      native_height: 480,
      delivery_width: 864,
      delivery_height: 480,
      seed: 505,
    },
  },
  "4": {
    class_type: "CodexH3ContinuityMonitor",
    inputs: {
      previous_image: ["1", 0],
      current_image: ["2", 0],
      reference_image: ["1", 0],
      take_token: ["3", 0],
    },
  },
  ...Object.fromEntries(
    referenceFiles.map((file, index) => [String(5 + index), { class_type: "LoadImage", inputs: { image: file } }]),
  ),
  "11": {
    class_type: "CodexH3ReferenceManifest",
    inputs: {
      entries_json: entriesJson,
      ...Object.fromEntries(referenceFiles.map((_, index) => [`image_${index + 1}`, [String(5 + index), 0]])),
    },
  },
  "12": { class_type: "PreviewImage", inputs: { images: ["4", 1] } },
  "13": { class_type: "PreviewImage", inputs: { images: ["11", 9] } },
  "14": { class_type: "PixaromaShowText", inputs: { source: ["4", 2] } },
  "15": { class_type: "PixaromaShowText", inputs: { source: ["4", 4] } },
  "16": { class_type: "PixaromaShowText", inputs: { source: ["11", 13] } },
  "17": { class_type: "PixaromaShowText", inputs: { source: ["11", 11] } },
  "18": { class_type: "PixaromaShowText", inputs: { source: ["11", 12] } },
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
    (rect) => rect.left < 20 || rect.top < 20 || rect.right > 3340 || rect.bottom > 2600,
  );
  if (overlaps.length || breaches.length) {
    throw new Error(`10F geometry failure: ${JSON.stringify({ overlaps, breaches })}`);
  }
}

assertGeometry();

for (const outputPath of [repoWorkflowPath, liveWorkflowPath]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(workflow, null, 2)}\n`);
  console.log(outputPath);
}
fs.writeFileSync(apiPath, `${JSON.stringify(apiGraph, null, 2)}\n`);
console.log(apiPath);
console.log(`10F SHA-256: ${sha256(fs.readFileSync(repoWorkflowPath))}`);
console.log(`Gold SHA-256: ${goldHash}`);
