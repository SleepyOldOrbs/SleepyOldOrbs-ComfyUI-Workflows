# DEV - MiniMax H3 Gold Standard

[Download workflow](../../../workflows/Gold-Standard/DEV%20-%20MiniMax%20H3%20Gold%20Standard.json) · [Catalogue](../../../CATALOG.md) · [Setup](../../../docs/SETUP.md)

Collection: **Gold-Standard** · 90 nodes (including subgraphs).

Saved workflow synced on 2026-09-24; export checked, not rerun for this sync.

No matched generated example is included for this saved version.

This is the separately saved development variant. It includes H3 Prompt IDE, reference inputs, SLA attention and latent upscaling; it has not been rendered or tested on a clean installation for publication.

## Required node types

`5782f1c1-9127-4f1e-9794-c29316d76352`, `BasicScheduler`, `CLIPLoader`, `ConditioningZeroOut`, `H3PromptIDE`, `H3PromptReferenceInputs`, `H3SLAAttention`, `KSamplerSelect`, `LTXVConcatAVLatent`, `LTXVSeparateAVLatent`, `MMH3UltimateUpscale`, `MiniMaxH3ReferenceToVideo`, `MiniMaxH3SigmaShift`, `MinimaxH3LatentUpscaler3D`, `PixaromaAIPrompt`, `PixaromaDuration`, `PixaromaGetNode`, `PixaromaGroupSwitch`, `PixaromaLabel`, `PixaromaLoadImageMini`, `PixaromaLoraLoader`, `PixaromaNote`, `PixaromaPrompt`, `PixaromaPromptMulti`, `PixaromaResolution`, `PixaromaRunLog`, `PixaromaRunTimer`, `PixaromaSaveMp4`, `PixaromaSeed`, `PixaromaSetNode`, `PixaromaSwitch`, `RandomNoise`, `SamplerCustom`, `ShowText|pysssss`, `UNETLoader`, `VAEDecode`, `VAEDecodeAudio`, `VAELoader`

UUID node types identify embedded subgraphs. Install the custom node packages used inside those subgraphs as well.

## Referenced model files

These include models in disabled or optional branches. Reselect files to match your installation.

- `H3\TurboLoras\minimax_h3_fl2v_lightx2v_turbo_8step_v1.0_resized_avg_rank_24_bf16.safetensors`
- `H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- `Huihui-Qwen3-VL-4B-Instruct-abliterated-fp8_scaled.safetensors`
- `fastvideo_fasth3_8step_v2_pruned_int8_convrot.safetensors`
- `minimax_h3_audio_vae_fp32.safetensors`
- `minimax_h3_latent_upscaler_3d_fp16.safetensors`
- `minimax_h3_video_vae_int8_convrot.safetensors`
- `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`

## Model links from the workflow notes

- [Model reference](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors)
- [Model reference](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors)
- [Model reference](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors)
- [Model reference](https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors)
- [Model reference](https://huggingface.co/Comfy-Org/MiniMax-H3/tree/main/diffusion_models)
- [Model reference](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/LICENSE)
- [Model reference](https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/main/docs/QA-about-License.md)
- [Model reference](https://huggingface.co/lightx2v/Minimax-h3-Turbo/resolve/main/minimax_h3_fl2v_turbo_4step_v1.1_768p_comfyui_bf16.safetensors)
- [Model reference](https://huggingface.co/lightx2v/Minimax-h3-Turbo/tree/main)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `%03e-SeedControl.seed%-output.jpg`
- `39878-output.jpg_00001.mp4`
- `4976-output.jpg_00002.mp4`
- `Flowers.jpg`
- `InfiniteTalkMan.jpg`
- `img_00010_.png`
- `img_00019_.png`
