# 4 Nunchaku Fluxmania Upscaler

[Download workflow](../../../../workflows/Pixaroma/EP05%20Workflows/4%20Nunchaku%20Fluxmania%20Upscaler.json) · [Catalogue](../../../../CATALOG.md) · [Setup](../../../../docs/SETUP.md)

Collection: **Pixaroma** · 18 nodes (including subgraphs).

Export checked; not rerun for this publication.

This is a collected template. Original embedded notes and credits have been retained; see [credits](../../../../CREDITS.md).

No matched generated example is included yet.

## Required node types

`CLIPTextEncode`, `ConditioningZeroOut`, `DualCLIPLoaderGGUF`, `FluxGuidance`, `Image Comparer (rgthree)`, `ImageScaleBy`, `ImageScaleToTotalPixels`, `ImageUpscaleWithModel`, `KSampler`, `LoadImage`, `MarkdownNote`, `NunchakuFluxDiTLoader`, `SaveImage`, `TiledDiffusion`, `UpscaleModelLoader`, `VAEDecodeTiled`, `VAEEncode`, `VAELoader`

## Referenced model files

These include models in disabled or optional branches.

- `4x_NMKD-Siax_200k.pth`
- `ae.safetensors`
- `clip_l.safetensors`
- `fluxmania\svdq-int4_r32-fluxmania-legacy.safetensors`
- `t5-v1_1-xxl-encoder-Q8_0.gguf`

## Model links from the workflow notes

- [4x_NMKD-Siax_200k.pth](https://huggingface.co/Akumetsu971/SD_Anime_Futuristic_Armor/resolve/main/4x_NMKD-Siax_200k.pth?download=true)
- [ae.safetensors](https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors)
- [t5-v1_1-xxl-encoder-Q8_0.gguf](https://huggingface.co/city96/t5-v1_1-xxl-encoder-gguf/resolve/main/t5-v1_1-xxl-encoder-Q8_0.gguf?download=true)
- [main](https://huggingface.co/city96/t5-v1_1-xxl-encoder-gguf/tree/main)
- [clip_l.safetensors](https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors?download=true)
- [svdq-fp4_r32-fluxmania-legacy.safetensors](https://huggingface.co/spooknik/Fluxmania-SVDQ/resolve/main/svdq-fp4_r32-fluxmania-legacy.safetensors)
- [svdq-int4_r32-fluxmania-legacy.safetensors](https://huggingface.co/spooknik/Fluxmania-SVDQ/resolve/main/svdq-int4_r32-fluxmania-legacy.safetensors)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Woman1.jpg`
