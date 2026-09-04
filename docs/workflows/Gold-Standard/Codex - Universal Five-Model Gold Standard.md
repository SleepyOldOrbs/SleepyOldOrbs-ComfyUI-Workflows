# Codex - Universal Five-Model Gold Standard

[Download workflow](../../../workflows/Gold-Standard/Codex%20-%20Universal%20Five-Model%20Gold%20Standard.json) · [Catalogue](../../../CATALOG.md) · [Setup](../../../docs/SETUP.md)

Collection: **Gold-Standard** · 173 nodes (including subgraphs).

Export checked; not rerun for this publication.

No matched generated example is included yet.

## Required node types

`79dd8a95-ce9d-4c14-b264-2162e8bec5ce`, `7b34ab90-36f9-45ba-a665-71d418f0df18`, `83e6e004-48ea-408e-9024-eb49c3d7dc14`, `8b4f085c-1bb3-4ecd-aeed-603a8d6d3970`, `BasicGuider`, `BasicScheduler`, `CFGGuider`, `CFGOverride`, `CLIPLoader`, `CLIPTextEncode`, `ComfyMathExpression`, `ComfyNumberConvert`, `ComfySwitchNode`, `ConditioningZeroOut`, `CreateVideo`, `CustomCombo`, `DualModelGuider`, `EmptyFlux2LatentImage`, `EmptyLTXVLatentVideo`, `EmptySD3LatentImage`, `Flux2Scheduler`, `Ideogram4Scheduler`, `ImageSharpenKJ`, `JsonExtractString`, `KSampler`, `KSamplerSelect`, `LTXVAudioVAEDecode`, `LTXVConcatAVLatent`, `LTXVConditioning`, `LTXVDualCFGGuider`, `LTXVEmptyLatentAudio`, `LTXVLatentUpsampler`, `LTXVSeparateAVLatent`, `LatentUpscaleModelLoader`, `LoraLoaderModelOnly`, `ManualSigmas`, `MiniMaxH3ImageToVideo`, `ModelSamplingAuraFlow`, `PixaromaAIPrompt`, `PixaromaCompare`, `PixaromaGroupSwitch`, `PixaromaLoraLoader`, `PixaromaNote`, `PixaromaPreview`, `PixaromaPrompt`, `PixaromaPromptMulti`, `PixaromaResolution`, `PixaromaRunLog`, `PixaromaRunTimer`, `PixaromaSeed`, `PixaromaShowText`, `PixaromaSwitch`, `PreviewAny`, `PrimitiveBoolean`, `PrimitiveFloat`, `PrimitiveInt`, `PrimitiveStringMultiline`, `RandomNoise`, `SamplerCustomAdvanced`, `SaveVideo`, `SeedVR2LoadDiTModel`, `SeedVR2LoadVAEModel`, `SeedVR2VideoUpscaler`, `StringReplace`, `TextGenerateLTX2Prompt`, `UNETLoader`, `VAEDecode`, `VAEDecodeAudio`, `VAEDecodeTiled`, `VAELoader`, `f2fdebf6-dfaf-43b6-9eb2-7f70613cfdc1`

## Referenced model files

These include models in disabled or optional branches.

- `H3\TurboLoras\minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors`
- `H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- `Huihui-Qwen3-VL-4B-Instruct-abliterated-fp8_scaled.safetensors`
- `Ideogram4\ideogram4_int8_convrot.safetensors`
- `Ideogram4\ideogram4_unconditional_int8_convrot.safetensors`
- `LTX2-5\ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`
- `ZImage\z-image-turbo_fp8_scaled_e5m2_KJ.safetensors`
- `ae.safetensors`
- `ema_vae_fp16.safetensors`
- `flux-2-klein-4b.safetensors`
- `flux-2-klein-base-4b.safetensors`
- `flux2-vae.safetensors`
- `gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors`
- `gemma4_e2b_it_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/Ideogram-4/resolve/main/diffusion_models/ideogram4_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/Ideogram-4/resolve/main/diffusion_models/ideogram4_unconditional_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`
- `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors`
- `https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors`
- `https://huggingface.co/Comfy-Org/Qwen3-VL/resolve/main/text_encoders/qwen3vl_8b_fp8_scaled.safetensors`
- `https://huggingface.co/Comfy-Org/flux2-dev/resolve/main/split_files/vae/flux2-vae.safetensors`
- `https://huggingface.co/Comfy-Org/flux2-klein/resolve/main/split_files/diffusion_models/flux-2-klein-4b.safetensors`
- `https://huggingface.co/Comfy-Org/flux2-klein/resolve/main/split_files/diffusion_models/flux-2-klein-base-4b.safetensors`
- `https://huggingface.co/Comfy-Org/flux2-klein/resolve/main/split_files/text_encoders/qwen_3_4b.safetensors`
- `https://huggingface.co/Comfy-Org/gemma-4/resolve/main/text_encoders/gemma4_e2b_it_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/diffusion_models/z_image_turbo_int8_convrot.safetensors`
- `https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors`
- `https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-audio-vae-bf16.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-video-vae-bf16.safetensors`
- `https://huggingface.co/lightx2v/Minimax-h3-Turbo/resolve/main/minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors`
- `ideogram4_int8_convrot.safetensors`
- `ideogram4_unconditional_int8_convrot.safetensors`
- `ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`
- `ltx-2.5-audio-vae-bf16.safetensors`
- `ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors`
- `ltx-2.5-video-vae-bf16.safetensors`
- `minimax_h3_audio_vae_fp32.safetensors`
- `minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors`
- `minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- `minimax_h3_video_vae_fp16.safetensors`
- `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`
- `qwen3vl_8b_fp8_scaled.safetensors`
- `qwen_3_4b.safetensors`
- `qwen_3_4b_fp8_mixed.safetensors`
- `seedvr2_ema_3b_fp8_e4m3fn.safetensors`
- `z_image_turbo_int8_convrot.safetensors`

## Model links from the workflow notes

- [ideogram4_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/Ideogram-4/resolve/main/diffusion_models/ideogram4_int8_convrot.safetensors)
- [ideogram4_unconditional_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/Ideogram-4/resolve/main/diffusion_models/ideogram4_unconditional_int8_convrot.safetensors)
- [minimax_h3_fl2va_pruned_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors)
- [qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors)
- [minimax_h3_audio_vae_fp32.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors)
- [minimax_h3_video_vae_fp16.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors)
- [qwen3vl_8b_fp8_scaled.safetensors](https://huggingface.co/Comfy-Org/Qwen3-VL/resolve/main/text_encoders/qwen3vl_8b_fp8_scaled.safetensors)
- [flux2-vae.safetensors](https://huggingface.co/Comfy-Org/flux2-dev/resolve/main/split_files/vae/flux2-vae.safetensors)
- [flux-2-klein-4b.safetensors](https://huggingface.co/Comfy-Org/flux2-klein/resolve/main/split_files/diffusion_models/flux-2-klein-4b.safetensors)
- [flux-2-klein-base-4b.safetensors](https://huggingface.co/Comfy-Org/flux2-klein/resolve/main/split_files/diffusion_models/flux-2-klein-base-4b.safetensors)
- [qwen_3_4b.safetensors](https://huggingface.co/Comfy-Org/flux2-klein/resolve/main/split_files/text_encoders/qwen_3_4b.safetensors)
- [gemma4_e2b_it_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/gemma-4/resolve/main/text_encoders/gemma4_e2b_it_int8_convrot.safetensors)
- [z_image_turbo_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/diffusion_models/z_image_turbo_int8_convrot.safetensors)
- [qwen_3_4b_fp8_mixed.safetensors](https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/text_encoders/qwen_3_4b_fp8_mixed.safetensors)
- [ae.safetensors](https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors)
- [ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors)
- [ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors)
- [gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors)
- [ltx-2.5-audio-vae-bf16.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-audio-vae-bf16.safetensors)
- [ltx-2.5-video-vae-bf16.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-video-vae-bf16.safetensors)
- [minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors](https://huggingface.co/lightx2v/Minimax-h3-Turbo/resolve/main/minimax_h3_fl2v_turbo_8step_v1.0_comfyui_bf16.safetensors)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Echo.mp3`
- `friedrich_00003_.png`
- `pixaroma_compare_pixcmp_iiwjc_00001_.png`
- `pixaroma_compare_pixcmp_iiwjc_00002_.png`
