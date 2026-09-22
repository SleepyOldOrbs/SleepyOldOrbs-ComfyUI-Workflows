# Stage 5 — VRAM choreography

## Purpose

Make the enlarged gold workflow practical on the local RTX 5080 by ensuring large models take turns instead of accumulating in VRAM.

## Hardware and model pressure

The live local server reports:

- NVIDIA GeForce RTX 5080
- 17,094,934,528 reported VRAM bytes, effectively the 16 GB class
- approximately 64 GB system RAM

The installed H3 diffusion model is about 21 GB and the dedicated 32B conditioning encoder about 15.7 GB. ComfyUI must stream them and release them deliberately.

## Choreography pattern

The stage adds fourteen `LayerUtility: Purge VRAM V2` pass-through barriers, following Pixaroma's supplied low-VRAM H3 workflow:

1. **Still-to-video hand-off:** release Krea or SeedVR models before H3 conditioning.
2. **Conditioning-to-sampling hand-off:** after prompt encoding, release the generative prompt writer and H3 text encoder before diffusion.
3. **Sampling-to-decode hand-off:** release the H3 diffusion model before loading video/audio VAEs for decoding.

The same sequence is applied to:

- the original Krea-to-H3 branch
- Krea-to-SeedVR
- two-image Ref2VA
- selective repair
- H3 continuation
- three-beat storyboard

## Operation

The green V nodes are intentionally always on when their containing branch is on. They pass through IMAGE, CONDITIONING, or LATENT data unchanged while clearing cached models and memory at a dependency boundary.

For diagnosis, an individual V node may be bypassed. The wildcard pass-through preserves the connection, but normal operation should leave all V nodes enabled.

## Validation

- Internal graph integrity after all reroutes: passed.
- Live ComfyUI node/model validation: passed with zero errors and zero warnings.
- Every purge node class is installed and active in the live server.
- No full H3 render was queued automatically; peak-memory and timing behaviour remain runtime observations for the user's chosen branch.

## Recovery

- Before-stage backup: `07 GOLD STANDARD - BACKUP before Stage 5 VRAM Choreography - 2026-08-21.json`
- Teaching checkpoint: `Gold Evolution/Stage 5 - VRAM Choreography.json`
