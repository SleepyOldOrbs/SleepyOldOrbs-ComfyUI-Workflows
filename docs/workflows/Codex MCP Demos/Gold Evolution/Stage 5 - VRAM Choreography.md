# Stage 5 - VRAM Choreography

[Download workflow](../../../../workflows/Codex%20MCP%20Demos/Gold%20Evolution/Stage%205%20-%20VRAM%20Choreography.json) · [Catalogue](../../../../CATALOG.md) · [Setup](../../../../docs/SETUP.md)

Collection: **Codex MCP Demos** · 154 nodes (including subgraphs).

Export checked; not rerun for this publication.

No matched generated example is included yet.

## Required node types

`CLIPLoader`, `CLIPTextEncode`, `ComfyUI-Krea2T-Enhancer`, `ConditioningZeroOut`, `EmptyLatentImage`, `GoldWorkflowModeSelector`, `ImageFromBatch`, `ImageSharpenKJ`, `KSampler`, `LayerUtility: PurgeVRAM V2`, `MiniMaxH3ImageToVideo`, `MiniMaxH3ReferenceToVideo`, `PixaromaAIPrompt`, `PixaromaCompare`, `PixaromaDuration`, `PixaromaGroupSwitch`, `PixaromaInpaintCrop`, `PixaromaInpaintStitch`, `PixaromaLoadImageMini`, `PixaromaLongestSide`, `PixaromaLoraLoader`, `PixaromaNote`, `PixaromaPreview`, `PixaromaPrompt`, `PixaromaPromptMulti`, `PixaromaResolution`, `PixaromaRunLog`, `PixaromaRunTimer`, `PixaromaSaveMp4`, `PixaromaSeed`, `PixaromaShowText`, `PixaromaSwitch`, `PixaromaTextJoinTwo`, `RTXVideoSuperResolution`, `SeedVR2LoadDiTModel`, `SeedVR2LoadVAEModel`, `SeedVR2VideoUpscaler`, `UNETLoader`, `VAEDecode`, `VAEDecodeAudio`, `VAELoader`

## Referenced model files

These include models in disabled or optional branches.

- `H3\TurboLoras\minimax_h3_turbo_v4_step600_pruned_comfyui.safetensors`
- `H3\minimax_h3_fl2va_pruned_int8_convrot.safetensors`
- `H3\minimax_h3_ref2va_pruned_int8_convrot.safetensors`
- `Huihui-Qwen3-VL-4B-Instruct-abliterated-fp8_scaled.safetensors`
- `Krea2\krea2_turbo_fp8_scaled.safetensors`
- `ema_vae_fp16.safetensors`
- `krea2\RealisticSnapshotKrea2.safetensors`
- `krea2\ultra_real_krea2_v2.safetensors`
- `minimax_h3_audio_vae_fp32.safetensors`
- `minimax_h3_video_vae_fp16.safetensors`
- `qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors`
- `qwen3vl_4b_fp8_scaled.safetensors`
- `qwen_image_vae.safetensors`
- `seedvr2_ema_3b_fp8_e4m3fn.safetensors`

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `Architecture.png`
- `BallerinaBunny.png`
- `BunnySitting.jpg`
- `Codex_MCP_GOLD_FINAL_SeedVR2_2048_RCAS_00002_.png`
- `Codex_MCP_GOLD_Pass1_Base_00002_.png`
- `Codex_MCP_GOLD_Pass2_Raw_1x_00002_.png`
- `Codex_MCP_GOLD_Pass2_Sharpened_1x_00002_.png`
- `Codex_MCP_GOLD_RTX_2x_ULTRA_00002_.png`
- `Codex_MCP_GOLD_SeedVR2_2048_Raw_00002_.png`
- `Echo.mp3`
- `Video_00008.mp4`
- `Video_00074.mp4`
- `Video_00085.mp4`
- `WomanPortraitRed.png`
- `pixaroma_compare_pixcmp_udaxi_00045_.png`
- `pixaroma_compare_pixcmp_udaxi_00046_.png`
- `pixaroma_compare_pixcmp_udaxi_00047_.png`
- `pixaroma_compare_pixcmp_udaxi_00048_.png`
