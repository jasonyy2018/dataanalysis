@echo off
REM 运行可移植 exe（位于同目录的 portable\data_trend_analysis.exe）
if exist "%~dp0portable\data_trend_analysis.exe" (
    pushd "%~dp0portable"
    start "DataTrend" data_trend_analysis.exe %*
    popd
) else (
    echo 未找到 portable\data_trend_analysis.exe，请先运行 make_portable.ps1 以生成可执行文件，或手动放置 exe。
    pause
)
