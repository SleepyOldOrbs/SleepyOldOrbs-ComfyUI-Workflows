# ComfyUI-Codex-H3-Continuation

Four small nodes provide persistent, local first-frame chaining plus a mutually exclusive delivery-quality finish:

- **H3 Auto-Chain Control (Codex)**: the user-facing on/off switch and independent state-slot name.
- **H3 Auto-Chain Opening Frame (Codex)**: chooses either the manual opening image or the previous handoff at execution time.
- **H3 Auto-Chain Handoff Store (Codex)**: atomically stores the current final frame for the next prompt.
- **H3 Delivery Quality (Codex)**: selects a true native bypass, RTX 1.5x HIGH, or RTX 2x HIGH. Only the selected profile runs.

State is local and lossless. Each slot writes a stable PNG and a JSON sidecar under:

```text
ComfyUI/output/H3_Long_Form/_auto_chain/
```

The opening-frame node deliberately disables ComfyUI caching. This is required when several prompts are queued before earlier prompts finish: each job reads the handoff created by the job immediately ahead of it in the queue.

With auto-chain off, the workflow uses its normal manual opening-frame loader. With auto-chain on and no saved state, the first run safely falls back to that manual image; later runs use the stored handoff.

The quality node is intended only for the saved MP4 branch. Continuation frames should come directly from the native VAE decode so repeated shots never compound upscaler-created texture. Its RTX profiles require the NVIDIA RTX Video Super Resolution custom node and `nvvfx`; the native profile does not import or execute RTX VSR.
