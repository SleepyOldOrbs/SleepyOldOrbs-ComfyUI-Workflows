# Krea 2 Entity Reference Sheets - Ref2VA Ready

## Purpose

This workflow creates one clear identity reference sheet for each enabled entity description. An entity can be a person, animal, non-humanoid creature, vehicle, building, prop, landscape feature, food item, or any other reusable subject.

The workflow deliberately produces separate images rather than one crowded cast collage. MiniMax H3 Ref2VA can accept up to nine reference images, so separate sheets give each subject a clearer identity and a less ambiguous `<Picture N>` mapping.

## Daily use

1. Open `08 KREA2 ENTITY REFERENCE SHEETS - Ref2VA Ready.json`.
2. In panel 1, replace the example descriptions and leave three or four rows enabled.
3. In panel 2, optionally change the shared style or insert Pixaroma tags.
4. Leave the identity-sheet direction alone for the first experiments.
5. Leave Prompt Multi Pixaroma in **Queue** mode and click **Run** once.
6. One PNG is saved for every enabled row under `ComfyUI/output/Character_Sheets/<date>/`.

## Ref2VA handoff

Load the generated PNGs into Ref2VA in the same order as the entity rows:

- first sheet -> `ref_image_0` -> `<Picture 1>`
- second sheet -> `ref_image_1` -> `<Picture 2>`
- third sheet -> `ref_image_2` -> `<Picture 3>`
- optional fourth sheet -> `ref_image_3` -> `<Picture 4>`

Define each reusable entity as a subject in the H3 prompt, for example:

```text
<Subject 1> is the woman defined by <Picture 1>, preserving her face, clothing, compass, and silhouette.
<Subject 2> is the six-legged creature defined by <Picture 2>, preserving its fur, horns, harness, and proportions.
<Subject 3> is the delivery van defined by <Picture 3>, preserving its colour, body shape, wheels, dents, and roof rails.
```

## Design choices

- Krea 2 Turbo, eight steps, CFG 1, ER-SDE and Simple scheduler match the proven settings from the simpler `07 GOLD STANDARD` workflow.
- The central full view is the authoritative identity.
- Two small detail insets add material and construction information without showing several complete copies that might encourage Ref2VA to duplicate the subject.
- Resolution, seed, prompting, prompt monitoring, notes, groups, and output preview use Pixaroma nodes.
- No LoRA is enabled by default, so a style LoRA cannot silently contaminate every entity reference.

## Validation record

- 17 nodes, 17 links, and four Pixaroma groups.
- Live ComfyUI validation: valid, zero errors, zero warnings, no partner/API nodes, and no credit spending.
- Geometry audit: zero node overlaps and zero group-boundary breaches.
- Installed Krea model, text encoder, and VAE confirmed through the live API.
- A fixed-seed cheese-sandwich smoke test completed successfully and produced a clear central identity with two detail insets.

## Known boundary

The Comfy MCP command-line UI converter does not execute Pixaroma's browser-side state-injection hooks. A direct command-line run of the saved visual workflow can therefore omit hidden fields such as `ResolutionState`. Running it normally from the ComfyUI browser uses Pixaroma's hooks and is the intended operating path. The Krea processing chain was separately execution-tested through an API-format smoke workflow with explicit values.
