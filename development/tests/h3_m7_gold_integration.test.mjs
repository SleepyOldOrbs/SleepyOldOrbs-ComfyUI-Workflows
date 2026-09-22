import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

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
const baselineSha256 =
  "2cd91cfbe51f3d5bd66f43cb2d34417894d18ad46b18ae0360a24b672013d037";

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function nodeById(workflow, id) {
  return workflow.nodes.find((node) => node.id === id);
}

function linkById(workflow, id) {
  return workflow.links.find((link) => link[0] === id);
}

test("accepted M7 route is optional and preserves the Gold spine", () => {
  const backupBytes = fs.readFileSync(backupPath);
  assert.equal(sha256(backupBytes), baselineSha256);

  const baseline = JSON.parse(backupBytes);
  const goldBytes = fs.readFileSync(goldPath);
  const gold = JSON.parse(goldBytes);

  assert.notEqual(sha256(goldBytes), baselineSha256);
  assert.equal(gold.nodes.length, baseline.nodes.length + 10);
  assert.equal(gold.last_node_id, 60);
  assert.equal(gold.last_link_id, 57);

  for (const baselineNode of baseline.nodes) {
    assert.ok(nodeById(gold, baselineNode.id), `missing Gold node ${baselineNode.id}`);
  }

  const expectedTypes = new Map([
    [51, "PixaromaLabel"],
    [52, "PixaromaNote"],
    [53, "FastGroupsBypasserV2"],
    [54, "MiniMaxH3MotionContextLoadLatent"],
    [55, "MiniMaxH3MotionContext"],
    [56, "MiniMaxH3MotionContextSeamProbe"],
    [57, "MiniMaxH3MotionContextTrim"],
    [58, "MiniMaxH3MotionContextSaveLatent"],
    [59, "PixaromaShowText"],
    [60, "PixaromaShowText"],
  ]);
  for (const [id, type] of expectedTypes) {
    assert.equal(nodeById(gold, id)?.type, type, `node ${id}`);
  }

  const applyGroup = gold.groups.find(
    (group) => group.title === "M7 APPLY PRIOR LATENT — BYPASS FOR FIRST CLIP",
  );
  const saveGroup = gold.groups.find(
    (group) => group.title === "M7 SAVE CURRENT LATENT — ENABLE FOR EVERY M7 CLIP",
  );
  assert.ok(applyGroup);
  assert.ok(saveGroup);

  for (const id of [54, 55, 56, 57, 59]) {
    assert.equal(nodeById(gold, id).mode, 4, `apply node ${id} must default bypassed`);
  }
  assert.equal(nodeById(gold, 58).mode, 4, "latent saving must default bypassed");
  assert.equal(nodeById(gold, 60).mode, 4, "latent status must follow the save group");
  assert.equal(nodeById(gold, 53).mode, 0, "group control must remain interactive");

  assert.deepEqual(linkById(gold, 43).slice(1), [36, 0, 55, 0, "CONDITIONING"]);
  assert.deepEqual(linkById(gold, 45).slice(1), [35, 1, 55, 2, "LATENT"]);
  assert.deepEqual(linkById(gold, 46).slice(1), [54, 0, 55, 4, "LATENT"]);
  assert.deepEqual(linkById(gold, 50).slice(1), [38, 0, 58, 0, "LATENT"]);
  assert.deepEqual(linkById(gold, 51).slice(1), [56, 0, 57, 1, "AUDIO"]);
  assert.deepEqual(linkById(gold, 54).slice(1), [57, 0, 49, 0, "IMAGE"]);
  assert.deepEqual(linkById(gold, 55).slice(1), [57, 1, 49, 2, "AUDIO"]);
  assert.deepEqual(linkById(gold, 56).slice(1), [58, 0, 60, 0, "*"]);
  assert.deepEqual(linkById(gold, 37).slice(1), [57, 1, 42, 1, "AUDIO"]);

  assert.deepEqual(nodeById(gold, 58).widgets_values, [
    "H3_Gold_Motion_Context/clip",
    1,
  ]);
  assert.deepEqual(nodeById(gold, 54).widgets_values, [
    "H3_Gold_Motion_Context",
    1,
  ]);
  assert.deepEqual(nodeById(gold, 55).widgets_values, ["22", 24]);

  const acceptanceNote = String(nodeById(gold, 52).widgets_values?.[0] ?? "");
  assert.match(acceptanceNote, /PICTURE PASS/i);
  assert.match(acceptanceNote, /AUDIO PASS/i);
  assert.match(acceptanceNote, /NORMAL GOLD/i);
  assert.match(acceptanceNote, /AUTO CHAIN/i);

  const untouchedIds = baseline.nodes
    .map((node) => node.id)
    .filter((id) => ![32, 33, 35, 36, 37, 38, 40, 41, 42, 49].includes(id));
  for (const id of untouchedIds) {
    assert.deepEqual(nodeById(gold, id), nodeById(baseline, id), `node ${id} drifted`);
  }
});
