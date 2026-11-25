# Windows + NVIDIA GPU setup for the AI video repos.
# Run from the project root in PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-gpu-windows.ps1
#
# What it does (safe to re-run):
#   1. Checks for an NVIDIA GPU via nvidia-smi.
#   2. Checks for Python 3.10+ and Git.
#   3. Installs PyTorch with CUDA 12.4 wheels.
#   4. Shallow-clones the upstream repos into vendor\external\.
#   5. Installs RIFE's Python requirements.
#
# It does NOT install TRELLIS, Hunyuan3D-2, LTX-2 or LivePortrait: those need
# CUDA Toolkit builds and large model downloads. Their READMEs are the guide.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Require-Command($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "$name not found in PATH. Install it first."
    }
}

# 1. GPU
Require-Command "nvidia-smi"
Write-Host "== GPU ==" -ForegroundColor Cyan
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv

# 2. Tools
Require-Command "python"
Require-Command "git"
$pyver = python -c "import sys; print('%d.%d' % sys.version_info[:2])"
Write-Host "Python $pyver" -ForegroundColor Cyan
if ([version]$pyver -lt [version]"3.10") { throw "Python 3.10+ required, found $pyver" }

# 3. PyTorch with CUDA
Write-Host "== PyTorch (CUDA 12.4) ==" -ForegroundColor Cyan
python -m pip install --upgrade pip
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
python -c "import torch; print('cuda available:', torch.cuda.is_available(), '|', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none')"

# 4. Clone upstream repos
$ext = Join-Path $root "vendor\external"
New-Item -ItemType Directory -Force -Path $ext | Out-Null
$repos = @(
    "Tencent-Hunyuan/Hunyuan3D-2",
    "microsoft/TRELLIS",
    "Lightricks/LTX-2",
    "KwaiVGI/LivePortrait",
    "hzwer/ECCV2022-RIFE"
)
Write-Host "== Clone repos ==" -ForegroundColor Cyan
foreach ($r in $repos) {
    $name = Split-Path -Leaf $r
    $dest = Join-Path $ext $name
    if (Test-Path (Join-Path $dest ".git")) {
        Write-Host "skip (exists): $name"
    } else {
        git clone --depth 1 "https://github.com/$r.git" $dest
    }
}

# 5. RIFE dependencies
Write-Host "== RIFE requirements ==" -ForegroundColor Cyan
python -m pip install -r (Join-Path $ext "ECCV2022-RIFE\requirements.txt")

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "RIFE model weights are NOT downloaded by this script. Get them from the RIFE README link"
Write-Host "and place them in vendor\external\ECCV2022-RIFE\train_log\. Then test with:"
Write-Host "  cd vendor\external\ECCV2022-RIFE"
Write-Host "  python inference_video.py --exp=1 --video=<your.mp4>"
