# Krea 2 Entity Reference Sheets - Ref2VA Ready

## Purpose

This workflow creates a random batch of clear identity reference sheets assembled from Pixaroma Tag Library lists. An entity can be a person, humanoid robot, fantasy character, alien, animal, non-humanoid creature, vehicle, building, food item, household prop, tool, machine, furniture item, or artefact.

The workflow deliberately produces separate images rather than one crowded cast collage. MiniMax H3 Ref2VA can accept up to nine reference images, so separate sheets give each subject a clearer identity and a less ambiguous `<Picture N>` mapping.

## Daily use

1. Open `08 KREA2 ENTITY REFERENCE SHEETS - Ref2VA Ready.json`.
2. In panel 1, enable the sheets you want. The supplied batch contains two `[TPOSE]` character rows and two `[TURNAROUND]` entity rows.
3. In panel 2, optionally change the shared visual style.
4. Leave the two orange automatic director boxes alone for the first experiments. Their `*Category` and `#list` tokens perform the random selection.
5. Optionally choose and enable one Krea 2 LoRA in panel 3. The supplied row is disabled by default.
6. Leave Prompt Multi Pixaroma in **Queue** mode and click **Run** once.
7. One PNG is saved for every enabled row under `ComfyUI/output/Character_Sheets/<date>/`.

Each queued row is independently randomised. The character route draws only from `CodexPoseableCharacters`; the turnaround route draws only from `CodexTurnaroundEntities`. The markers are expanded before Krea receives the prompt, so only the selected direction is inserted. This keeps T-pose language away from cars, food and other non-humanoid subjects.

## Installed Pixaroma pools

Four new **List** categories appear in Pixaroma Tag Library:

- `CodexPoseableCharacters`: ten lists covering everyday, adventurous, historical, scientific and performing people plus robots, cybernetic people, fantasy humanoids, mythic humanoids and humanoid aliens; 100 base characters.
- `CodexTurnaroundEntities`: twenty lists covering creatures, animals, vehicles, watercraft, aircraft, buildings, landmark structures, food, household props, tools, machines, non-humanoid robots, furniture, artefacts, instruments, wearable props, containers, plants, toys and science-fiction devices; 200 base entities.
- `CodexCharacterTraits`: twelve mix-and-match lists for palette, silhouette, wardrobe, condition, accessory, personality, head detail, facial marking, hands, footwear, back detail and signature motif; 120 choices. All twelve are active in random character generation.
- `CodexItemTraits`: twelve lists totalling 120 choices. The six original class-specific pools remain available for manual experimentation. Six new type-neutral pools—covering asymmetry, identity feature, surface history, functional cue, edge detail and cross-panel consistency—are automatically mixed into every random turnaround entity.

Every individual list contains exactly ten newline-separated choices. `*CodexPoseableCharacters` or `*CodexTurnaroundEntities` first chooses one list from its category, then one line from that list. A token such as `#character_wardrobe` picks one line directly from that named list. The poseable route combines all twelve compatible character-trait lists. The object route chooses one of 200 internally coherent entity descriptions and adds only the six type-neutral traits. You can edit, export or extend all of them through Pixaroma's normal Tag Library screen.

Each human or humanoid sheet is a square 3 x 3 contact sheet:

1. front face close-up
2. three-quarter face close-up
3. exact profile face close-up
4. full-body front view
5. full-body three-quarter view
6. full-body exact side view
7. full-body front T-pose
8. full-body rear T-pose
9. identity-defining feature or prop detail

Each `[TURNAROUND]` sheet uses Krea's more reliable 2 x 3 product/orthographic layout:

1. complete front view
2. complete three-quarter front view
3. complete left-side view
4. complete right-side view
5. complete rear view
6. the most useful top, plan, underside, or identity-detail view

This route contains no face, full-body, or T-pose vocabulary. It also instructs Krea not to invent a wearer, rider, carrier, handler, mannequin, or supporting figure.

## Ref2VA handoff

Load the generated PNGs into Ref2VA in the same order as the enabled entity rows:

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

## Shared LoRA control

The workflow includes one **LoRA Loader Pixaroma** in the shared Krea model path. It receives both the Krea diffusion model and text encoder, then sends the modified model through the Krea enhancer and the modified CLIP to prompt encoding. Enabled trigger words are automatically appended to the final prompt.

- It is disabled by default, so opening or running the workflow does not silently change established output.
- One LoRA and one strength setting affect every enabled Prompt Multi row in that run.
- The row starts with the installed `krea2\Krea2-realism-V2.safetensors` selected at strength `0.7`; replace it with any compatible Krea 2 LoRA you prefer.
- Keep the LoRA off when building neutral reference sheets, or enable it when a character, project or visual style specifically depends on that LoRA.
- The final prompt monitor shows any enabled trigger words, making it easy to verify what Krea actually receives.

## Design choices

- Krea 2 Turbo, eight steps, CFG 1, ER-SDE and Simple scheduler match the proven settings from the simpler `07 GOLD STANDARD` workflow.
- The 1536 x 1536 canvas supports both the nine-cell humanoid sheet and the six-cell non-human turnaround.
- Three face angles establish facial identity, three full-body angles establish silhouette and wardrobe, and two T-poses expose front/rear construction. The final detail panel preserves a signature prop or marking.
- Two sequential marker-expansion nodes select the prompt safely: `[TPOSE]` is replaced only by a randomly generated humanoid direction and `[TURNAROUND]` only by a randomly generated turnaround direction. This avoids a vague conditional paragraph and ensures unused pose vocabulary never reaches Krea.
- The random subject/item families are intentionally separate. Actor-like `subject_...` lists cannot be selected by the object route, and physical `item_...` lists cannot be selected by the T-pose route.
- Resolution, seed, prompting, prompt monitoring, notes, groups, and output preview use Pixaroma nodes.
- No LoRA is enabled by default, so a style LoRA cannot silently contaminate every entity reference.
- When deliberately enabled, the single shared Pixaroma LoRA applies model, CLIP and trigger words consistently across every queued sheet.

## Validation record

- 23 nodes, 25 links, and four Pixaroma groups.
- Live ComfyUI validation: valid, zero errors, zero warnings, no partner/API nodes, and no credit spending.
- Tag Library validation: 54 list tags, exactly ten choices in every list, 540 total choices, unique tag names, and all list tags assigned to list-side categories.
- Geometry audit: zero node overlaps and zero group-boundary breaches.
- Routing audit: the expanded `[TPOSE]` prompt contains the humanoid direction but no turnaround direction; the expanded `[TURNAROUND]` prompt contains the turnaround direction and no face, full-body, or T-pose vocabulary.
- Installed Krea model, text encoder, and VAE confirmed through the live API.
- The expanded fixed-seed Mara smoke test completed successfully at 1536 x 1536. Visual inspection confirmed all nine requested cells, consistent identity, complete feet, correct face angles, front/rear T-poses, and a separate compass detail.
- A fixed-seed type-safe sandwich smoke test completed successfully at 1536 x 1536. Visual inspection confirmed a clean six-cell object-only product sheet with no invented person, mannequin, limbs, wearer, or T-pose.

## Known boundary

The Comfy MCP command-line UI converter does not execute Pixaroma's browser-side state-injection hooks. A direct command-line run of the saved visual workflow can therefore omit hidden fields such as `ResolutionState`, and it will not perform Tag Library expansion. Running it normally from the ComfyUI browser uses Pixaroma's hooks and is the intended operating path. After installing or importing the new library while a workflow tab is already open, refresh that browser tab once so its cached Tag Library is reloaded.
