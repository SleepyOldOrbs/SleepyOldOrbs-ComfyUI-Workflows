# M1 Reuse Audit - 25 August 2026

Status: the local comparison lab passes structural, live and geometry validation. No Multishot source file, Gold workflow or Motion Context package was changed.

## Audited installation

- ComfyUI: 0.33.0 at `b78cec879b9460d5cb25228a83a942fb78d2cd24`
- H3 Multishot registry/project version: 2.6.5
- H3 Multishot license: MIT
- H3 Multishot package file: `custom_nodes/comfyui-h3-multishot/pyproject.toml`
- Motion Context: not installed
- Live inventory source: `http://127.0.0.1:8188/object_info` with 2,404 registered node classes

The package's README and embedded workflow notes still label the release 2.6.1 even though `pyproject.toml` and ComfyUI registry metadata report 2.6.5. This audit treats 2.6.5 as the installed package version and records the documentation label as upstream drift.

The local Comfy MCP dependency mapper is unavailable because this Easy-Install uses a legacy ComfyUI-Manager clone rather than an importable workspace package. No Manager reinstall was attempted. Live `object_info`, package source and workflow validation supplied the authoritative evidence instead.

## Bundled example validation

All four current bundled examples were validated unchanged before creating 10B. None is directly runnable on this model/node inventory:

| Upstream example | SHA-256 | Errors | Cause |
| --- | --- | ---: | --- |
| `H3_Extend_Take.json` | `504194B458806B11686B5241163F507545A1B270D3B1F288AD243D588A5FA195` | 5 | Missing optional JoyEcho writer, unavailable `beta57`, stale prompt file and unavailable GGUF model name |
| `H3_Keyframes.json` | `4C5CDDFF994125CAADB006016F5DB6AD75F7463EA2C2FF1419EB85069013B137` | 2 | Unavailable GGUF model and text-encoder names |
| `H3_Seamless_Chain_CORE.json` | `EFB0DBBC2C025219B3858C8457E1898CE88E8DC8D43D160D2D4C0A5E3269E9A9` | 1 | Unavailable GGUF model name |
| `H3_Seamless_Chain_v2.json` | `7281C67FE3D489D8C25BE9352E6CC282B79883D9AA79882613BA64978A8C478D` | 5 | Missing optional JoyEcho writer, unavailable `beta57`, stale prompt file and unavailable GGUF model name |

Every upstream result had zero validator warnings and no partner or credit-spending nodes. These are compatibility findings, not reasons to patch the installed Multishot package.

## 10B isolated comparison lab

The full v2 example was copied byte-for-byte to:

`workflows/Codex MCP Demos/Backups/10B H3 Automated Dialogue Chain/H3_Seamless_Chain_v2 - UPSTREAM 2.6.5 - 2026-08-25.json`

Its SHA-256 remains `7281C67FE3D489D8C25BE9352E6CC282B79883D9AA79882613BA64978A8C478D` in both the source and deployed backup locations.

`tools/build_h3_10b_lab.mjs` creates `10B H3 Automated Dialogue Chain Lab.json` from that immutable snapshot. The local adaptations are deliberately narrow:

1. select the installed native Ref2VA model;
2. use core scheduler `beta` instead of unavailable `beta57`;
3. replace the stale prompt-file combo value with the live empty value;
4. route the selected, exact `---`-separated script directly to the sampler because the optional JoyEcho writer is not installed; and
5. clear three small upstream canvas overlaps and include the reference selector inside its intended group.

The direct-script route keeps quoted dialogue under operator control and avoids loading any LLM. `H3AnySwitch` uses ComfyUI lazy inputs, so the unselected file and remote-encoder branches do not execute.

Validation result:

```text
valid: true
converted node count: 38
errors: 0
warnings: 0
partner nodes: 0
spends credits: false
geometry overlaps: 0
group-boundary breaches: 0
source/live SHA-256: 47AED4C4FCED99192239051AE6552F19FD1DBBCD2FC6903A690B73B24372C44F
```

This is an openable technical comparison graph, not a claim that its example dialogue has been rendered or human-accepted.

## Reuse, adapt, build or reject

| Proposal | Decision after live audit | Evidence and remaining gap |
| --- | --- | --- |
| H3 Render Profile Control | **Adapt later, only after benchmark evidence** | `H3StudioControls`, sampler/scheduler overrides, LoRA stack and `H3SpeedBoosters` already expose the engine settings. A future thin adapter may select an atomic named recipe, but must not reimplement either Multishot sampler. |
| Auto-Chain Safety Gate | **Build** | Multishot protects its within-run latent/A/V chain, but it does not own the accepted cross-run handoff used by workflow 10 or preserve a previous accepted image when a later run fails technical checks. |
| Shot List Stepper | **Reuse now; adapt only for cross-run commits** | `H3ScriptSplit`, `RiftPromptSource`, `H3StudioControls` and both samplers already handle `---` shot scripts, shot counts, folder walking and retakes. Only execution-time project-plan commit/recovery may remain after project state exists. |
| Project and Take Manager | **Build** | Multishot can save masters and per-shot files, but has no engine-independent project/scene/shot/take/branch manifest, atomic take allocation or immutable rollback history. |
| Continuity Monitor | **Adapt measurements; add only missing advisory output** | The memory sampler already owns continuity, chain gain, colour leveling, join handling and master luma/contrast normalization. It does not expose the requested per-take metric record or project-history comparison. Do not duplicate its render controls. |
| Reference Manifest Builder | **Build manifest; reuse Multishot inputs** | `H3RefFolder`, `H3AutoRefs`, `H3RefBatch`, `reference_images` and `reference_subjects` cover image delivery and multi-person grouping. They do not provide deterministic typed entities for mixed people, creatures, props, vehicles and locations. |
| Sequence Assembler | **Reuse within-run; defer project-level gap analysis** | Multishot already returns one joined master with audio and supports retakes. Build nothing until accepted takes and branches exist; later add only the residual project-manifest/FFmpeg contract. |
| Benchmark Recorder | **Build first in M2** | Multishot prints timing information internally but exposes no stable start token, deduplicated JSON Lines record, output hash, cached/interrupted status or later human-verdict join. |
| Motion Context | **Reject as an M1 prerequisite** | It is absent and unnecessary for the validated first-frame comparison. Installation remains a separate reversible experiment after benchmark and patch-ownership gates. |
| Optional writer/speed packages | **Keep disabled** | JoyEcho and `beta57` are not required for the direct-script lab. Sol-attention and remote routes remain bypassed/lazily off. No optional package was installed merely to make an upstream example green. |

## Reduced custom-node scope

The first custom package should contain benchmark recording only. Later justified Codex-owned modules are project/take state, accepted-handoff safety and a typed reference manifest. There is no present justification for a Codex sampler, script splitter, retake engine or within-run stitcher.

## Acceptance boundary

Passed in M1:

- exact upstream snapshot and hashes;
- live class/inventory audit;
- isolated 10B build;
- zero-error, zero-warning live workflow validation;
- zero-overlap, zero-boundary-breach geometry guard; and
- no Gold, upstream-package or Motion Context mutation.

Not yet run or claimed:

- an H3 render from 10B;
- goat, prop or three-shot visual comparisons;
- human visual or audio acceptance;
- speed or quality conclusions; and
- any Gold integration.
