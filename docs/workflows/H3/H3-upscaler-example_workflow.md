# H3-upscaler-example_workflow

[Download workflow](../../../workflows/H3/H3-upscaler-example_workflow.json) · [Catalogue](../../../CATALOG.md) · [Setup](../../../docs/SETUP.md)

Collection: **H3** · 44 nodes (including subgraphs).

Export checked; not rerun for this publication.

No matched generated example is included yet.

## Required node types

`BasicGuider`, `BasicScheduler`, `CLIPLoader`, `CLIPLoaderGGUF`, `ComfyMathExpression`, `CreateVideo`, `INTConstant`, `KSamplerSelect`, `LoadImage`, `LoraLoaderModelOnly`, `MMH3LatentUpscaleWithModelParams`, `MMH3SpatialSplitParams`, `MMH3TemporalSplitParams`, `MMH3UltimateUpscale`, `MarkdownNote`, `MiniMaxH3ReferenceToVideo`, `MiniMaxH3SigmaShift`, `ModelAttentionBackend`, `Note`, `PrimitiveFloat`, `PrimitiveStringMultiline`, `RandomNoise`, `ResolutionSelector`, `SamplerCustomAdvanced`, `SaveVideo`, `UNETLoader`, `VAEDecode`, `VAEDecodeAudio`, `VAELoader`

## Referenced model files

These include models in disabled or optional branches.

- `H3\TurboLoras\minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors`
- `H3\minimax_h3_ref2va_pruned_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors`
- `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors`
- `minimax_h3_audio_vae_fp32.safetensors`
- `minimax_h3_latent_upscaler_3d_fp16.safetensors`
- `minimax_h3_ref2va_pruned_int8_convrot.safetensors`
- `minimax_h3_video_vae_fp16.safetensors`
- `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`

## Model links from the workflow notes

- [minimax_h3_ref2va_pruned_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors)
- [minimax_h3_audio_vae_fp32.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors)
- [minimax_h3_video_vae_fp16.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Geisha.png`
- `img_00003_.png`
