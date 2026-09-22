const fs = require("node:fs");
const path = require("node:path");

exports.requireComfyRoot = function requireComfyRoot() {
  const root = process.env.COMFYUI_PATH;
  if (!root || !path.isAbsolute(root) || !fs.existsSync(path.join(root, "custom_nodes"))) {
    throw new Error("Set COMFYUI_PATH to the absolute path of your ComfyUI installation before running this historical development tool.");
  }
  return root;
};
