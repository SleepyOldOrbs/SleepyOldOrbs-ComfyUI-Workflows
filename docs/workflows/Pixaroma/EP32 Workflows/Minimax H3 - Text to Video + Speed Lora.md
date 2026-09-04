# Minimax H3 - Text to Video + Speed Lora

[Download workflow](../../../../workflows/Pixaroma/EP32%20Workflows/Minimax%20H3%20-%20Text%20to%20Video%20%2B%20Speed%20Lora.json) · [Catalogue](../../../../CATALOG.md) · [Setup](../../../../docs/SETUP.md)

Collection: **Pixaroma** · 35 nodes (including subgraphs).

Export checked; not rerun for this publication.

This is a collected template. Original embedded notes and credits have been retained; see [credits](../../../../CREDITS.md).

No matched generated example is included yet.

## Required node types

`BasicScheduler`, `CLIPLoader`, `ConditioningZeroOut`, `CreateVideo`, `KSampler`, `KSamplerSelect`, `MMH3LatentUpscaleWithModelParams`, `MMH3SpatialSplitParams`, `MMH3TemporalSplitParams`, `MMH3UltimateUpscale`, `MiniMaxH3ImageToVideo`, `MiniMaxH3SigmaShift`, `Note`, `PixaromaDropdown`, `PixaromaDuration`, `PixaromaFreeVram`, `PixaromaLabel`, `PixaromaLoraLoader`, `PixaromaMonitor`, `PixaromaNote`, `PixaromaNumber`, `PixaromaPrompt`, `PixaromaRunTimer`, `PixaromaSaveMp4`, `PixaromaSizes`, `RandomNoise`, `SaveVideo`, `UNETLoader`, `VAEDecode`, `VAEDecodeAudio`, `VAELoader`, `easy simpleMathDual`

## Referenced model files

These include models in disabled or optional branches.

- `H3\TurboLoras\minimax_h3_turbo_v4_step600_pruned_comfyui.safetensors`
- `H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- `minimax_h3_audio_vae_fp32.safetensors`
- `minimax_h3_latent_upscaler_3d_fp16.safetensors`
- `minimax_h3_video_vae_fp16.safetensors`
- `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`

## Model links from the workflow notes

- [minimax_h3_fl2va_pruned_int8_convrot.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors)
- [Model repository](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors/)
- [qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors)
- [Model repository](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors/)
- [minimax_h3_audio_vae_fp32.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors)
- [Model repository](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors/)
- [minimax_h3_video_vae_fp16.safetensors](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors)
- [Model repository](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors/)
- [diffusion_models](https://huggingface.co/Comfy-Org/MiniMax-H3/tree/main/diffusion_models)
- [Model repository](https://huggingface.co/Comfy-Org/MiniMax-H3/tree/main/diffusion_models/)
- [LICENSE](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE)
- [Model repository](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE/)
- [QA-about-License.md](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/docs/QA-about-License.md)
- [Model repository](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/docs/QA-about-License.md/)
- [minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors](https://huggingface.co/lightx2v/Minimax-h3-Turbo/resolve/main/minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors)
- [Model repository](https://huggingface.co/lightx2v/Minimax-h3-Turbo/resolve/main/minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors/)
- [main](https://huggingface.co/lightx2v/Minimax-h3-Turbo/tree/main)
- [Model repository](https://huggingface.co/lightx2v/Minimax-h3-Turbo/tree/main/)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Video_00001.mp4`
