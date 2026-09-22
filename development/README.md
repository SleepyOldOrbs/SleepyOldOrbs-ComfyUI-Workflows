# Workflow development and recovery

This is the development collection consolidated into this repository on 22 September 2026, from `comfyui-codex-workflows` at commit `e286ab0e42555410ddeede6de08d593c48eaaef4` (25 August 2026).

For everyday use, start with the [published workflow catalogue](../CATALOG.md). Those 48 workflows and their galleries remain the current public collection. This folder preserves the older development material without replacing newer public variants.

## Included material

- [64 development and recovery workflows](workflows/Codex%20MCP%20Demos), including dated backups and lab variants.
- [Workflow index](WORKFLOW_INDEX.md) and [original project introduction](SOURCE-README.md).
- [H3 Continuation nodes](custom_nodes/ComfyUI-Codex-H3-Continuation/README.md): four nodes for auto-chain and delivery quality.
- [H3 Production nodes](custom_nodes/ComfyUI-Codex-H3-Production/README.md): twelve nodes for benchmarking, project state, continuity and sequence assembly.
- [Build and installation tools](tools), [tests and API fixtures](tests), [development notes](docs), and [historical tag libraries](tag-library).
- [Import manifest](IMPORT-MANIFEST.json), recording every imported file and its published SHA-256.

31 workflow filenames correspond to public library entries: eight were identical at consolidation and 23 differed. The development snapshot also retains 33 backup/recovery workflows absent from the public library. The public library has 17 additional workflows. The counts describe the two collections separately; they are not a count of unique current recipes.

## Install the bundled H3 nodes

Copy either complete package folder from `development/custom_nodes/` into your installation's `custom_nodes/`, then restart ComfyUI. Copy the individual packages, not the enclosing `development` folder. Models and other upstream node packages are still separate dependencies.

On Windows, the installers accept an explicit installation directory. Run from the repository root after setting `$comfyPath` to your ComfyUI folder:

```powershell
.\development\tools\install_h3_continuation_node.ps1 -ComfyUIPath $comfyPath
.\development\tools\install_h3_production_node.ps1 -ComfyUIPath $comfyPath
```

The installers update files in the selected package directory. Back up local modifications first.

## Historical tools and evidence

The JavaScript builders are development tools, not a one-click installation. They can update workflows and settings in a selected ComfyUI installation. Review their inputs first and set `COMFYUI_PATH` explicitly; they no longer assume the maintainer's machine location. PowerShell tools require `-ComfyUIPath`. The tag-library tool saves its exports beneath this folder's `tag-library/`.

The retained documents, hashes, model availability and acceptance reports describe the August development environment. They do not certify the current public variants or another installation. Referenced generated media and installed third-party node sources are not included. API smoke fixtures require their own inputs and dependencies; they are not automatically queued by repository checks.

The import excludes Git history and replaces machine-specific paths, personal attribution and a remote workstation hostname. Workflow graph structure is preserved. The original private Git history remains in the archived source repository. The source README's count of 57 workflows predates the final 64-file snapshot.

Offline checks from the repository root:

```text
python scripts/validate.py
node --test development/tests/h3_m7_gold_integration.test.mjs
python -m pytest development/tests
```

The Python node tests require pytest, PyTorch, NumPy, Pillow and imageio-ffmpeg. They use temporary output directories and a stub ComfyUI path module; they do not start ComfyUI or generate media with a model.
