# Custom nodes and models

The catalogue records node types and model filenames from the exported graphs, including disabled branches and LoRA rows. Install only the branches you intend to run. This is an inventory, not a claim that every workflow was executed on a clean installation.

[ComfyUI documentation](https://docs.comfy.org/) · [Pixaroma installation](https://gitlab.com/pixaroma/comfyui-pixaroma)

## Node packages

### [ComfyUI-Codex-H3-Continuation — bundled source](../development/custom_nodes/ComfyUI-Codex-H3-Continuation/README.md)

Copy `development/custom_nodes/ComfyUI-Codex-H3-Continuation` into your ComfyUI `custom_nodes` directory and restart. See the [installation instructions](../development/README.md#install-the-bundled-h3-nodes).

`CodexH3ContinuationControl`, `CodexH3ContinuationInput`, `CodexH3ContinuationStore`, `CodexH3OutputFinish`

### [ComfyUI-Codex-H3-Production — bundled source](../development/custom_nodes/ComfyUI-Codex-H3-Production/README.md)

Copy `development/custom_nodes/ComfyUI-Codex-H3-Production` into your ComfyUI `custom_nodes` directory and restart. See the [installation instructions](../development/README.md#install-the-bundled-h3-nodes).

`CodexH3BenchmarkRecorder`, `CodexH3BenchmarkStart`, `CodexH3ContinuityMonitor`, `CodexH3ProjectControl`, `CodexH3ReferenceManifest`, `CodexH3RenderProfileControl`, `CodexH3SafeContinuationStore`, `CodexH3SequenceAssembler`, `CodexH3ShotPlanCommit`, `CodexH3ShotPlanControl`, `CodexH3ShotPlanReader`, `CodexH3TakeRecorder`

### [ComfyUI-DLSS5-Enhancer](https://github.com/Blueforcer/ComfyUI-DLSS5-Enhancer)

`DLSS5EnhanceImages`, `DLSS5Settings`

### [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use)

`easy simpleMathDual`

### `ComfyUI-Gold-Operating-Modes` — no verified public installation URL recorded; obtain this dependency separately

`GoldCharacterProjectPresets`, `GoldWorkflowModeSelector`

### [ComfyUI-H3-Motion-Context](https://github.com/NikoDemon80/ComfyUI-H3-Motion-Context)

`MiniMaxH3MotionContext`, `MiniMaxH3MotionContextLoadLatent`, `MiniMaxH3MotionContextSaveLatent`, `MiniMaxH3MotionContextSeamProbe`, `MiniMaxH3MotionContextTrim`

### [ComfyUI-Krea2T-Enhancer](https://github.com/capitan01R/ComfyUI-Krea2T-Enhancer)

`ComfyUI-Krea2T-Enhancer`

### [ComfyUI-Pixaroma](https://gitlab.com/pixaroma/ComfyUI-Pixaroma)

`PixaromaAIPrompt`, `PixaromaCompare`, `PixaromaDropdown`, `PixaromaDuration`, `PixaromaFreeVram`, `PixaromaGroupSwitch`, `PixaromaInpaintCrop`, `PixaromaInpaintStitch`, `PixaromaLabel`, `PixaromaLoadImageMini`, `PixaromaLongestSide`, `PixaromaLoraLoader`, `PixaromaMonitor`, `PixaromaMuteSwitch`, `PixaromaNote`, `PixaromaNumber`, `PixaromaPreview`, `PixaromaPrompt`, `PixaromaPromptMulti`, `PixaromaResolution`, `PixaromaRunLog`, `PixaromaRunTimer`, `PixaromaSaveImage`, `PixaromaSaveMp4`, `PixaromaSeed`, `PixaromaShowText`, `PixaromaSizes`, `PixaromaSwitch`, `PixaromaTextJoinFour`, `PixaromaTextJoinTwo`, `PixaromaVideoPrompt`

### `ComfyUI-sol-attn` — no verified public installation URL recorded; obtain this dependency separately

`MiniMaxH3ChunkFeedForward`, `MiniMaxH3MemoryEfficientSolAttentionPatch`

### [Comfyui-MMH3-UltimateUpscale](https://github.com/bbaudio-2025/Comfyui-MMH3-UltimateUpscale)

`MMH3LatentUpscaleWithModelParams`, `MMH3SpatialSplitParams`, `MMH3TemporalSplitParams`, `MMH3UltimateUpscale`

### `Embedded subgraphs`

`042a0b44-1cf9-4a0e-9cfb-a0773ec19e26`, `79dd8a95-ce9d-4c14-b264-2162e8bec5ce`, `7b34ab90-36f9-45ba-a665-71d418f0df18`, `83e6e004-48ea-408e-9024-eb49c3d7dc14`, `8b4f085c-1bb3-4ecd-aeed-603a8d6d3970`, `a67caa28-5f85-4917-8396-36004960dd30`, `ad044397-cdc4-4c25-820c-cfb3a9f00383`, `beb35f5b-0a09-4ac8-9771-dc9514996f49`, `c57e31c1-b7b3-42b6-9bbf-d4e33f292a4c`, `f2fdebf6-dfaf-43b6-9eb2-7f70613cfdc1`

### [Nvidia_RTX_Nodes_ComfyUI](https://github.com/Comfy-Org/Nvidia_RTX_Nodes_ComfyUI)

`RTXVideoSuperResolution`

### `Unresolved` — no verified public installation URL recorded; obtain this dependency separately

`H3AnySwitch`, `H3ReferenceVideo`, `H3StudioSwitches`

### `comfy-core`

`BasicGuider`, `BasicScheduler`, `BuildJsonPromptIdeogram`, `CFGGuider`, `CFGOverride`, `CLIPLoader`, `CLIPTextEncode`, `ComfyMathExpression`, `ComfyNumberConvert`, `ComfySwitchNode`, `ConditioningZeroOut`, `ConvertDictionaryToString`, `CreateBoundingBoxes`, `CreateVideo`, `CustomCombo`, `DualModelGuider`, `EmptyFlux2LatentImage`, `EmptyLTXVLatentVideo`, `EmptyLatentImage`, `EmptySD3LatentImage`, `Flux2Scheduler`, `GetVideoComponents`, `Ideogram4Scheduler`, `ImageBatch`, `ImageFromBatch`, `ImageScale`, `JsonExtractString`, `KSampler`, `KSamplerSelect`, `LTXVAudioVAEDecode`, `LTXVConcatAVLatent`, `LTXVConditioning`, `LTXVDualCFGGuider`, `LTXVEmptyLatentAudio`, `LTXVLatentUpsampler`, `LTXVSeparateAVLatent`, `LatentUpscaleBy`, `LatentUpscaleModelLoader`, `LoadAudio`, `LoadImage`, `LoadVideo`, `LoraLoaderModelOnly`, `ManualSigmas`, `MarkdownNote`, `MiniMaxH3ImageToVideo`, `MiniMaxH3ReferenceToVideo`, `MiniMaxH3SigmaShift`, `ModelSamplingAuraFlow`, `Note`, `PreviewAny`, `PreviewImage`, `PrimitiveBoolean`, `PrimitiveFloat`, `PrimitiveInt`, `PrimitiveStringMultiline`, `RandomNoise`, `ResolutionSelector`, `SamplerCustomAdvanced`, `SaveAudio`, `SaveAudioAdvanced`, `SaveImage`, `SaveVideo`, `StringReplace`, `TextGenerateLTX2Prompt`, `UNETLoader`, `VAEDecode`, `VAEDecodeAudio`, `VAEDecodeTiled`, `VAELoader`

### `comfyui-h3-multishot` — no verified public installation URL recorded; obtain this dependency separately

`H3AutoRefs`, `H3ClipLoaderAny`, `H3FreeTextEncoder`, `H3LastFrame`, `H3LoraStack`, `H3ModelLoaderAny`, `H3MultishotMemorySampler`, `H3MultishotSampler`, `H3OptionalImage`, `H3RemoteTextEncoderClip`, `H3SpeedBoosters`, `H3StudioControls`, `RiftPromptSource`

### [comfyui-kjnodes](https://github.com/kijai/ComfyUI-KJNodes)

`Ideogram4PromptBuilderKJ`, `ImageSharpenKJ`, `MiniMaxH3MemoryEfficientSageAttentionPatch`, `SomethingToString`

### `comfyui-spectrum-minimax-h3` — no verified public installation URL recorded; obtain this dependency separately

`SpectrumApplyMiniMaxH3`

### [comfyui_layerstyle](https://github.com/chflame163/ComfyUI_LayerStyle)

`LayerUtility: PurgeVRAM V2`

### [rgthree-comfy](https://github.com/rgthree/rgthree-comfy)

`Any Switch (rgthree)`, `FastGroupsBypasserV2`, `Image Comparer (rgthree)`, `Power Lora Loader (rgthree)`

### [seedvr2_videoupscaler](https://github.com/numz/ComfyUI-SeedVR2_VideoUpscaler)

`SeedVR2LoadDiTModel`, `SeedVR2LoadVAEModel`, `SeedVR2VideoUpscaler`

## Models

Each workflow guide lists model filenames and the Hugging Face links retained in its source notes. Files for disabled branches are included in that inventory. Model weights are not part of this repository.

The Morris workflows require `William-Morris-LoRa_krea2.safetensors` (trigger: `William Morris Style`). A public download for this custom-trained LoRA has not been verified; request the weights from the maintainer. The LoRA strength is stored in each workflow. Subfolders beneath `models` may need adjusting on your machine.

Some workflows use NVIDIA-specific attention or upscaling nodes. Their hardware and runtime requirements still apply. Video and reference-image workflows also require your own input files; a saved filename is not a bundled asset.

## Dependencies added by the 24 September 2026 sync

These package identifiers come from saved node metadata. They are not a clean-install verification. UUID node types are embedded subgraphs. Inspect each updated workflow guide for its full model list, including optional branches.

- `FaceDetailer` — `comfyui-impact-pack`.
- `H3PromptIDE` — `h3-prompt-ide`.
- `H3PromptReferenceInputs` — `h3-prompt-ide`.
- `H3SLAAttention` — `plaguekind-nodes`.
- `MaskPreview+` — `comfyui_essentials`.
- `MinimaxH3LatentUpscaler3D` — `LBH-123-AI/Comfyui_Minimax_h3_latent_Upscaler`.
- `PixaromaGetNode` — `ComfyUI-Pixaroma`.
- `PixaromaSetNode` — `ComfyUI-Pixaroma`.
- `SAMLoader` — `comfyui-impact-pack`.
- `SamplerCustom` — `comfy-core`.
- `ShowText|pysssss` — `comfyui-custom-scripts`.
- `UltralyticsDetectorProvider` — `comfyui-impact-subpack`.

The new H3 development variant records `plaguekind-nodes` for `MMH3UltimateUpscale`, whereas older library graphs record the earlier MMH3 package. Match the provider and widget schema to the selected workflow; a matching node name alone does not prove compatibility.
