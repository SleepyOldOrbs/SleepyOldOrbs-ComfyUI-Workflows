# Flux 2 Klein 9B Outpaint

[Download workflow](../../../../workflows/Pixaroma/Ep27%20Workflows/Flux%202%20Klein%209B%20Outpaint.json) · [Catalogue](../../../../CATALOG.md) · [Setup](../../../../docs/SETUP.md)

Collection: **Pixaroma** · 23 nodes (including subgraphs).

Export checked; not rerun for this publication.

This is a collected template. Original embedded notes and credits have been retained; see [credits](../../../../CREDITS.md).

No matched generated example is included yet.

## Required node types

`CLIPLoader`, `CLIPTextEncode`, `ConditioningZeroOut`, `EmptyFlux2LatentImage`, `KSampler`, `PixaromaCompare`, `PixaromaLabel`, `PixaromaLoadImageMini`, `PixaromaLoraLoader`, `PixaromaMuteSwitch`, `PixaromaNote`, `PixaromaOutpaint`, `PixaromaOutpaintStitch`, `PixaromaPreview`, `PixaromaRunTimer`, `PixaromaSeed`, `PixaromaTextJoinTwo`, `ReferenceLatent`, `UNETLoader`, `VAEDecode`, `VAEEncode`, `VAELoader`

## Referenced model files

These include models in disabled or optional branches.

- `flux2-vae.safetensors`
- `flux2\flux-2-klein-9b-int8-convrot.safetensors`
- `klein9b\pixaoutpaint.safetensors`
- `qwen_3_8b_fp8mixed.safetensors`

## Model links from the workflow notes

- [flux2-vae.safetensors](https://huggingface.co/Comfy-Org/flux2-dev/resolve/main/split_files/vae/flux2-vae.safetensors)
- [Model repository](https://huggingface.co/Comfy-Org/flux2-dev/resolve/main/split_files/vae/flux2-vae.safetensors/)
- [qwen_3_8b_fp8mixed.safetensors](https://huggingface.co/Comfy-Org/flux2-klein-9B/resolve/main/split_files/text_encoders/qwen_3_8b_fp8mixed.safetensors)
- [Model repository](https://huggingface.co/Comfy-Org/flux2-klein-9B/resolve/main/split_files/text_encoders/qwen_3_8b_fp8mixed.safetensors/)
- [pixaoutpaint.safetensors](https://huggingface.co/Pixaroma/experimental_loras/resolve/main/pixaoutpaint.safetensors)
- [Model repository](https://huggingface.co/Pixaroma/experimental_loras/resolve/main/pixaoutpaint.safetensors/)
- [flux-2-klein-9b-int8-convrot.safetensors](https://huggingface.co/Winnougan/Klein9b-Distilled-Base-INT8-Convrot/resolve/main/flux-2-klein-9b-int8-convrot.safetensors)
- [Model repository](https://huggingface.co/Winnougan/Klein9b-Distilled-Base-INT8-Convrot/resolve/main/flux-2-klein-9b-int8-convrot.safetensors/)
- [flux-2-klein-9b-fp8mixed.safetensors](https://huggingface.co/silveroxides/FLUX.2-dev-fp8_scaled/resolve/main/flux-2-klein-9b-fp8mixed.safetensors)
- [Model repository](https://huggingface.co/silveroxides/FLUX.2-dev-fp8_scaled/resolve/main/flux-2-klein-9b-fp8mixed.safetensors/)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Architecture.png`
- `img_00003_.png`
- `pixaroma_compare_pixcmp_wvhga_00001_.png`
- `pixaroma_compare_pixcmp_wvhga_00002_.png`
