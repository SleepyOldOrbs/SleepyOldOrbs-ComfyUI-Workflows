# 3 Z-Image Upscaler

[Download workflow](../../../../workflows/Pixaroma/EP05%20Workflows/3%20Z-Image%20Upscaler.json) · [Catalogue](../../../../CATALOG.md) · [Setup](../../../../docs/SETUP.md)

Collection: **Pixaroma** · 18 nodes (including subgraphs).

Export checked; not rerun for this publication.

This is a collected template. Original embedded notes and credits have been retained; see [credits](../../../../CREDITS.md).

No matched generated example is included yet.

## Required node types

`CLIPLoader`, `CLIPTextEncode`, `ConditioningZeroOut`, `Image Comparer (rgthree)`, `ImageScaleBy`, `ImageScaleToTotalPixels`, `ImageUpscaleWithModel`, `KSampler`, `LoadImage`, `MarkdownNote`, `ModelSamplingAuraFlow`, `SaveImage`, `TiledDiffusion`, `UNETLoader`, `UpscaleModelLoader`, `VAEDecodeTiled`, `VAEEncode`, `VAELoader`

## Referenced model files

These include models in disabled or optional branches.

- `4x_NMKD-Siax_200k.pth`
- `ZImage\z-image-turbo_fp8_scaled_e5m2_KJ.safetensors`
- `ae.safetensors`
- `qwen_3_4b_fp8_mixed.safetensors`

## Model links from the workflow notes

- [4x_NMKD-Siax_200k.pth](https://huggingface.co/Akumetsu971/SD_Anime_Futuristic_Armor/resolve/main/4x_NMKD-Siax_200k.pth?download=true)
- [qwen_3_4b_fp8_mixed.safetensors](https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors)
- [ae.safetensors](https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors)
- [z-image-turbo_fp8_scaled_e5m2_KJ.safetensors](https://huggingface.co/Kijai/Z-Image_comfy_fp8_scaled/resolve/main/z-image-turbo_fp8_scaled_e5m2_KJ.safetensors?download=true)
- [main](https://huggingface.co/Kijai/Z-Image_comfy_fp8_scaled/tree/main)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `poster (5).jpeg`
