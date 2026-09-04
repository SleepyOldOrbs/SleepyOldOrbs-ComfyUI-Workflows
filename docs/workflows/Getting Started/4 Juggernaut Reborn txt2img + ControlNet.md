# 4 Juggernaut Reborn txt2img + ControlNet

[Download workflow](../../../workflows/Getting%20Started/4%20Juggernaut%20Reborn%20txt2img%20%2B%20ControlNet.json) · [Catalogue](../../../CATALOG.md) · [Setup](../../../docs/SETUP.md)

Collection: **Getting Started** · 13 nodes (including subgraphs).

Export checked; not rerun for this publication.

This is a collected template. Original embedded notes and credits have been retained; see [credits](../../../CREDITS.md).

No matched generated example is included yet.

## Required node types

`AIO_Preprocessor`, `CLIPTextEncode`, `CheckpointLoaderSimple`, `ControlNetApplyAdvanced`, `ControlNetLoader`, `EmptyLatentImage`, `KSampler`, `LoadImage`, `MarkdownNote`, `PreviewImage`, `SaveImage`, `VAEDecode`

## Referenced model files

These include models in disabled or optional branches.

- `sd15\control_v11p_sd15_canny_fp16.safetensors`
- `sd15\juggernaut_reborn.safetensors`

## Model links from the workflow notes

- [juggernaut_reborn.safetensors](https://huggingface.co/HyperX-Sentience/Juggernaut-Reborn/resolve/main/juggernaut_reborn.safetensors?download=true)
- [control_v11f1p_sd15_depth_fp16.safetensors](https://huggingface.co/comfyanonymous/ControlNet-v1-1_fp16_safetensors/resolve/main/control_v11f1p_sd15_depth_fp16.safetensors?download=true)
- [control_v11p_sd15_canny_fp16.safetensors](https://huggingface.co/comfyanonymous/ControlNet-v1-1_fp16_safetensors/resolve/main/control_v11p_sd15_canny_fp16.safetensors?download=true)
- [control_v11p_sd15_openpose_fp16.safetensors](https://huggingface.co/comfyanonymous/ControlNet-v1-1_fp16_safetensors/resolve/main/control_v11p_sd15_openpose_fp16.safetensors?download=true)
- [main](https://huggingface.co/comfyanonymous/ControlNet-v1-1_fp16_safetensors/tree/main)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Sketch.jpeg`
