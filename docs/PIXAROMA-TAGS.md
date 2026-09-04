# Pixaroma random prompt tags

Install [ComfyUI-Pixaroma](https://gitlab.com/pixaroma/comfyui-pixaroma). In the Pixaroma Prompt node, open **Tags → Import** and choose one of:

- [William Morris library](../tags/william-morris.json): the 24 Morris tags, including wildlife and seasonal themes.
- [Complete exported library](../tags/pixaroma-library.json): the saved prompt-tag collection used by these workflows.

Export your existing library first if you have matching tag names. Review the import conflict choices before replacing personalised entries. The export contains list definitions, not personal shuffle positions.

`@name` inserts fixed text. `#name` chooses one newline-separated option from a list. `*Category` selects a tag from that category; if it is a list, it then picks one of its entries. Shuffle uses all choices before repeating.

## Wildlife

`#wm_moths`, `#wm_beetles`, `#wm_insects`, `#wm_manylegs`, `#wm_dogs`, `#wm_cats` and `#wm_animals` supply 84 animal motifs. Use `*WilliamMorrisWildlife` for a shuffled family and animal. The general `#wm_motif` pool also includes those animals alongside the botanical motifs.

## Coordinated themes

Use `#wm_christmas`, `#wm_halloween`, `#wm_easter`, `#wm_summer`, `#wm_winter` or `#wm_autumn` for ten coordinated recipes per theme. `*WilliamMorrisThemes` shuffles all six. Each recipe contains its motifs, supporting ornament and five-colour palette.

Use the supplied themed workflows as a starting point. Do not add independently shuffled `#wm_palette`, `#wm_foliage`, `#wm_secondary` or `#wm_ground` to their themed prompts, because those can conflict with the chosen recipe. Layout, scale, surface and drawing treatment can still vary.

Changing batch count queues multiple selections. Prompts already submitted to ComfyUI retain their resolved values.
