# video_ltx2_5_i2v

[Download workflow](../../../workflows/ltx2.5/video_ltx2_5_i2v.json) · [Catalogue](../../../CATALOG.md) · [Setup](../../../docs/SETUP.md)

Collection: **ltx2.5** · 56 nodes (including subgraphs).

Export checked; not rerun for this publication.

No matched generated example is included yet.

## Required node types

`6e397a2b-68f7-48f6-8930-f3a5491a163c`, `CLIPLoader`, `CLIPTextEncode`, `ComfyMathExpression`, `ComfySwitchNode`, `CreateVideo`, `EmptyLTXVLatentVideo`, `FancyTimerNode`, `KSamplerSelect`, `LTXVAudioVAEDecode`, `LTXVConcatAVLatent`, `LTXVConditioning`, `LTXVDualCFGGuider`, `LTXVEmptyLatentAudio`, `LTXVImgToVideoInplace`, `LTXVLatentUpsampler`, `LTXVPreprocess`, `LTXVSeparateAVLatent`, `LatentUpscaleModelLoader`, `LoadImage`, `ManualSigmas`, `MarkdownNote`, `PreviewAny`, `PrimitiveBoolean`, `PrimitiveInt`, `PrimitiveStringMultiline`, `RandomNoise`, `ResizeImageMaskNode`, `ResolutionSelector`, `SamplerCustomAdvanced`, `SaveVideo`, `TextGenerateLTX2Prompt`, `UNETLoader`, `VAEDecodeTiled`, `VAELoader`

## Referenced model files

These include models in disabled or optional branches.

- `LTX2-5\ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`
- `gemma-3-12b-it-qat-q4_0-unquantized_readout_proj/model/model.safetensors`
- `gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors`
- `gemma4_e2b_it_bf16.safetensors`
- `https://huggingface.co/Comfy-Org/gemma-4/resolve/main/text_encoders/gemma4_e2b_it_bf16.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-audio-vae-bf16.safetensors`
- `https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-video-vae-bf16.safetensors`
- `ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors`
- `ltx-2.5-audio-vae-bf16.safetensors`
- `ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors`
- `ltx-2.5-video-vae-bf16.safetensors`
- `ltx-av-step-1751000_vocoder_24K.safetensors`

## Model links from the workflow notes

- [gemma4_e2b_it_bf16.safetensors](https://huggingface.co/Comfy-Org/gemma-4/resolve/main/text_encoders/gemma4_e2b_it_bf16.safetensors)
- [LTX-2.5](https://huggingface.co/Lightricks/LTX-2.5)
- [ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/diffusion_models/ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors)
- [ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/latent_upscale_models/ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors)
- [gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/text_encoders/gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors)
- [ltx-2.5-audio-vae-bf16.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-audio-vae-bf16.safetensors)
- [ltx-2.5-video-vae-bf16.safetensors](https://huggingface.co/Lightricks/LTX-2.5/resolve/main/vae/ltx-2.5-video-vae-bf16.safetensors)

## Referenced media filenames

Supply your own inputs where needed; these files are not included. Some names belong to saved previews rather than required inputs.

- `ipjnrh35itgh1.webp`
