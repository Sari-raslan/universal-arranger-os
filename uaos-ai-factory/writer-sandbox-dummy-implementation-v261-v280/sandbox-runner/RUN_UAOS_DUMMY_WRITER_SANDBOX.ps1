$ErrorActionPreference = "Stop"
$Root = "E:\keyboard-manager-clean\uaos-ai-factory\writer-sandbox-dummy-implementation-v261-v280"
$StyleSource = "E:\keyboard-manager-clean\uaos-ai-factory\style-package-rc"
$OutputDir = Join-Path $Root "dummy-output"
python (Join-Path $Root "src\uaos_writer_sandbox_dummy.py") --style-source $StyleSource --output-dir $OutputDir
