# Using the workflows

1. Install and update [ComfyUI](https://docs.comfy.org/). These graphs were collected from a customised ComfyUI installation; choose a workflow before installing its dependencies.
2. Browse the [catalogue](../CATALOG.md). Its detail pages list node types, referenced model filenames, model links and input filenames.
3. Download a workflow JSON using GitHub's **Download raw file** control, or download the repository with **Code → Download ZIP**. Load the JSON through ComfyUI's workflow menu or drag it onto the canvas.
4. Install missing custom nodes using your ComfyUI Manager or the project's installation instructions. The [dependency inventory](DEPENDENCIES.md) links verified local Git origins and flags dependencies without a recorded public URL. Restart ComfyUI after installing nodes.
5. Download the relevant model weights, select them in the loader nodes, and replace reference-image/audio/video inputs with your own files. Optional and disabled branches can reference extra models.
6. For Pixaroma tag-based prompts, [import the tag library](PIXAROMA-TAGS.md) before running. Start with batch count 1 and inspect the result, then increase the batch count.

## William Morris patterns

The Morris family uses Krea 2 and the custom `William-Morris-LoRa_krea2.safetensors` LoRA. The trigger is `William Morris Style`. The weights are not bundled and no verified public download is available in this release; obtain them from the maintainer. The workflows retain the selected strength and sampler settings. Generated examples include their captured settings.

Choose Christmas, Halloween, Easter, Summer, Winter or Autumn for a fixed theme. The mixed-theme workflow shuffles themes. Motifs and colours are bundled together in each theme recipe. These are decorative repeating-pattern prompts; matching tile edges are not mechanically guaranteed.

## What has been checked

All 48 saved workflow exports parse as JSON and retain their node counts and graph links. The 27 example PNGs decode and have pixel data identical to their local originals; private metadata was replaced with sanitised workflow and API data. Local absolute paths and cached run information were removed from the public copies. Original local files were not edited.

The collection has not been rerun on a clean installation. Missing local custom nodes, model variants, reference assets, hardware-specific nodes or runtime requirements can still need attention.

## Adding another example

Add a generated PNG alongside its workflow, record which workflow produced it, and check the embedded metadata for private paths or credentials. Keep original author credits. Update the gallery and catalogue together. The validation script checks the repository's recorded files; it does not run ComfyUI or upload anything.

Personal model subfolder names and preset labels are anonymised in these public exports. Reselect the matching local LoRA files in the loader if your subfolders differ.
