# Motion studio: 20 open-source repos

Source list: [@e1genqq on X](https://x.com/e1genqq/status/2116270712390316375) (31 Oct 2026). All 20 URLs were checked and exist.
Flow: **concept → scene → motion → sound → final cut.**

Install with `bash scripts/setup-motion-studio.sh [2d] [3d] [audio] [apps]`.

| # | Repo | Job | Group | How it is installed |
|---|---|---|---|---|
| 01 | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | React video engine | 2d | npm `remotion`, `@remotion/cli` |
| 02 | [remotion-dev/skills](https://github.com/remotion-dev/skills) | Official agent skills for Remotion | 2d | `npx skills add remotion-dev/skills` |
| 03 | [juliangarnier/anime](https://github.com/juliangarnier/anime) | Timeline choreography | 2d | npm `animejs` |
| 04 | [motiondivision/motion](https://github.com/motiondivision/motion) | UI animation, layout transitions | 2d | npm `motion` |
| 05 | [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | Animated diagrams, equations, explainers | 2d | pip `manim` (motion-studio/.venv) |
| 06 | [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | Lightweight vector animation | 2d | npm `lottie-web` |
| 07 | [ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender) | Claude builds and edits 3D scenes in Blender | 3d | `uvx mcp-for-blender setup` on the PC with Blender |
| 08 | [mrdoob/three.js](https://github.com/mrdoob/three.js) | 3D scenes, camera moves | 3d | npm `three` |
| 09 | [gkjohnson/three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer) | Realistic lighting, reflections | 3d | npm `three-gpu-pathtracer` |
| 10 | [jrouwe/JoltPhysics](https://github.com/jrouwe/JoltPhysics) | Collisions, rigid and soft bodies | 3d | npm `jolt-physics` (the JoltPhysics.js WASM build) |
| 11 | [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | Bloom, depth of field, colour grading | 3d | npm `postprocessing` |
| 12 | [Alchemist0823/three.quarks](https://github.com/Alchemist0823/three.quarks) | Particles, trails, VFX | 3d | npm `three.quarks` |
| 13 | [cocopon/tweakpane](https://github.com/cocopon/tweakpane) | Live controls for scene parameters | 3d | npm `tweakpane` |
| 14 | [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Node-based image/video generation | audio | clone to `~/motion-studio/ComfyUI`, own venv |
| 15 | [QwenAudio/CosyVoice](https://github.com/QwenAudio/CosyVoice) | Multilingual voiceover, voice cloning | audio | clone to `~/motion-studio/CosyVoice`, own venv (Python 3.10) |
| 16 | [librosa/librosa](https://github.com/librosa/librosa) | Beat detection for music-synced animation | audio | pip `librosa` |
| 17 | [m-bain/whisperX](https://github.com/m-bain/whisperX) | Word-level caption timing | audio | pip `whisperx` |
| 18 | [obsproject/obs-studio](https://github.com/obsproject/obs-studio) | Screen capture | apps | apt `obs-studio` / `winget install OBSProject.OBSStudio` |
| 19 | [mifi/lossless-cut](https://github.com/mifi/lossless-cut) | Fast cuts without re-encoding | apps | AppImage to `~/motion-studio` / `winget install mifi.losslesscut` |
| 20 | [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | Encoding and delivery | apps | apt `ffmpeg` / `winget install Gyan.FFmpeg` |

## Notes before using them for client work

- **Remotion licence:** free for individuals and companies with up to 3 employees (Ammarcreava qualifies). A company licence is needed above that.
- **CosyVoice languages:** Chinese, English, Japanese, Korean, German, Spanish, French, Italian, Russian. **No Malay.** For Bahasa Melayu voiceovers keep using ElevenLabs or VoiceStudio.
- **WhisperX vs whisper-cli:** whisper-cli (already in `setup.sh`) stays the default for Malay talking-head captions. Use WhisperX when you need tighter word alignment or speaker labels.
- **GPU:** ComfyUI, CosyVoice and WhisperX run on CPU but are slow. A CUDA GPU is recommended.
- **Licences of the repos themselves:** ComfyUI, LosslessCut and OBS are GPL, FFmpeg is LGPL/GPL, Remotion has its own licence, the rest are permissive (MIT, Apache-2.0, BSD, ISC, Zlib). This repo only installs them; it does not copy their code.
