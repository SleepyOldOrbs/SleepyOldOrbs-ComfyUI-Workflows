# Minimax H3 - Image to video FFLF + Speed Lora

[Download workflow](../../../../workflows/Pixaroma/EP32%20Workflows/Minimax%20H3%20-%20Image%20to%20video%20FFLF%20%2B%20Speed%20Lora.json) · [Catalogue](../../../../CATALOG.md) · [Setup](../../../../docs/SETUP.md)

Collection: **Pixaroma** · 24 nodes (including subgraphs).

Export checked; not rerun for this publication.

This is a collected template. Original embedded notes and credits have been retained; see [credits](../../../../CREDITS.md).

No matched generated example is included yet.

## Required node types

`CLIPLoader`, `ConditioningZeroOut`, `KSampler`, `MiniMaxH3ImageToVideo`, `MiniMaxH3SigmaShift`, `PixaromaDropdown`, `PixaromaDuration`, `PixaromaFreeVram`, `PixaromaLabel`, `PixaromaLoadImageMini`, `PixaromaLongestSide`, `PixaromaLoraLoader`, `PixaromaMonitor`, `PixaromaNote`, `PixaromaPrompt`, `PixaromaRunTimer`, `PixaromaSaveMp4`, `UNETLoader`, `VAEDecode`, `VAEDecodeAudio`, `VAELoader`

## Referenced model files

These include models in disabled or optional branches.

- `H3\TurboLoras\minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors`
- `H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- `minimax_h3_audio_vae_fp32.safetensors`
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

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Video_00061.mp4`
- `WomanPortraitJeans.png`
- `WomanPortraitRed.png`
