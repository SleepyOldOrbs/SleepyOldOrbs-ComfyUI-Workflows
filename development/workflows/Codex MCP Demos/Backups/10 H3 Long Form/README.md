# Recovery note - workflow 10

`10 H3 LONG FORM - INITIAL VALIDATED - 2026-08-24.json` is the independently openable initial checkpoint for the simple MiniMax H3 long-form shot builder.

`10 H3 LONG FORM - BEFORE AUTO CHAIN - 2026-08-24.json` is the independently openable checkpoint immediately before persistent cross-run handoff storage and its user-facing switch were added.

`10 H3 LONG FORM - BEFORE QUALITY PROFILES - 2026-08-24.json` is the independently openable checkpoint after auto-chain validation and immediately before native-detail choices and the isolated RTX delivery-quality selector were added.

`10 H3 LONG FORM - BEFORE QUALITY PROFILES - LIVE USER SETTINGS - 2026-08-24.json` preserves the browser-saved input state from the same moment: the maintainer's selected opening image, random seed mode and `workflow_test` slot. It is separate so those inputs are recoverable without replacing the reproducible teaching defaults.

The active workflow is `../../10 GOLD STANDARD - MiniMax H3 Long Form Shot Builder.json`. The generator is `tools/build_h3_long_form.mjs`, and the full operating guide is `docs/h3-long-form/README.md` in the repository root.

Workflow 09 is deliberately outside this builder's write set. Restore a workflow 10 checkpoint only over workflow 10, never over the Ref2VA Director. The builder preserves all four dated recovery choices and writes only the active workflow plus retained API smoke graphs.
