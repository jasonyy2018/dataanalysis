<#
make_portable.ps1

说明：此脚本在 Windows 上自动创建一个临时虚拟环境，安装依赖与 PyInstaller，
并使用 PyInstaller 将 Flask 应用打包为单个可执行文件（single-file exe）。

使用前提：
- 系统已安装 Python 3.8+ 且在 PATH 中可用
<#
make_portable.ps1

说明：此脚本在 Windows 上自动创建一个临时虚拟环境，安装依赖与 PyInstaller，
并使用 PyInstaller 将 Flask 应用打包为单个可执行文件（single-file exe）。

使用前提：
- 系统已安装 Python 3.8+ 且在 PATH 中可用
- 需要联网以安装 pip 包

运行方法（以管理员或普通 PowerShell 均可）：
PS> .\make_portable.ps1

输出：
- dist\app.exe
- portable\    （包含 app.exe 与运行说明）
- portable.zip  （可分发的压缩包）

注意：
- 打包过程会把 `templates` 和 `static` 目录嵌入 exe。
- 打包时间取决于网络与机器性能。
- 若要显式指定 exe 名称，可修改脚本中的 $ExeName 变量。
#>

set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
Push-Location $Root

$ExeName = 'data_trend_analysis'
$VenvDir = Join-Path $Root '.packenv'
$PortableDir = Join-Path $Root 'portable'

Write-Host "工作目录: $Root"

# Create/refresh venv
if (Test-Path $VenvDir) {
    Write-Host "移除旧的临时虚拟环境: $VenvDir"
    Remove-Item -Recurse -Force $VenvDir
}
python -m venv $VenvDir

$Pip = Join-Path $VenvDir 'Scripts\pip.exe'
$Python = Join-Path $VenvDir 'Scripts\python.exe'

Write-Host "升级 pip 并安装依赖（requirements.txt + pyinstaller）..."
& $Pip install --upgrade pip wheel
& $Pip install -r requirements.txt pyinstaller

# Clean previous build artifacts
if (Test-Path (Join-Path $Root 'build')) { Remove-Item -Recurse -Force (Join-Path $Root 'build') }
if (Test-Path (Join-Path $Root 'dist')) { Remove-Item -Recurse -Force (Join-Path $Root 'dist') }
if (Test-Path (Join-Path $Root "$ExeName.spec")) { Remove-Item -Force (Join-Path $Root "$ExeName.spec") }

# Build with PyInstaller
Write-Host "开始 PyInstaller 打包（这一步可能耗时）..."
# 注意：Windows 上 --add-data 的分隔符为 ';'
$addTemplates = "templates;templates"
$addStatic = "static;static"
$addUploads = "uploads;uploads"

# Ensure uploads directory exists so PyInstaller --add-data won't fail
if (-not (Test-Path (Join-Path $Root 'uploads'))) {
    New-Item -ItemType Directory -Path (Join-Path $Root 'uploads') | Out-Null
}

& $Python -m PyInstaller --noconfirm --onefile --name $ExeName --add-data $addTemplates --add-data $addStatic --add-data $addUploads app.py

if (-not (Test-Path (Join-Path $Root 'dist'))) {
    Write-Error "打包失败：未找到 dist 目录"
    Pop-Location
    exit 1
}

# Prepare portable folder
if (Test-Path $PortableDir) { Remove-Item -Recurse -Force $PortableDir }
New-Item -ItemType Directory -Path $PortableDir | Out-Null

Copy-Item -Path (Join-Path (Join-Path $Root 'dist') ($ExeName + '.exe')) -Destination $PortableDir

# Create a small launcher batch and README in portable dir
$runBat = @"
@echo off
setlocal
REM 直接运行可执行文件
%~dp0\$ExeName.exe %*
"@
Set-Content -Path (Join-Path $PortableDir 'run.bat') -Value $runBat -Encoding UTF8

$portReadme = @"
可移植运行包

说明：双击 run.bat 或 直接运行 data_trend_analysis.exe 来启动应用。
默认监听 127.0.0.1:5000。

注意：首次运行时，exe 会解包到临时目录，启动可能稍慢；请耐心等待。
"@
Set-Content -Path (Join-Path $PortableDir 'README_PORTABLE.txt') -Value $portReadme -Encoding UTF8

# Create ZIP for distribution
$zipPath = Join-Path $Root 'portable.zip'
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path (Join-Path $PortableDir '*') -DestinationPath $zipPath

Write-Host "Done: portable/ directory and portable.zip have been generated."
Write-Host ("Executable path: " + (Join-Path $PortableDir ($ExeName + '.exe')))

Pop-Location
Set-Content -Path (Join-Path $PortableDir 'README_PORTABLE.txt') -Value $portReadme -Encoding UTF8
