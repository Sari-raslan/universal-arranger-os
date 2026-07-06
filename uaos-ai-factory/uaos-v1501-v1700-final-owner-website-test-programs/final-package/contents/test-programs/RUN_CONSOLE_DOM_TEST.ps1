$ErrorActionPreference = 'Stop'

$site = 'E:\keyboard-manager-clean\uaos-ai-factory\uaos-v1501-v1700-final-owner-website-test-programs\final-owner-site'
$app = Join-Path $site 'app.js'
$index = Join-Path $site 'index.html'

if (!(Test-Path $app)) {
    Write-Host 'CONSOLE_DOM_TEST: FAIL missing app.js'
    exit 1
}

if (!(Test-Path $index)) {
    Write-Host 'CONSOLE_DOM_TEST: FAIL missing index.html'
    exit 1
}

$js = Get-Content $app -Raw
$html = Get-Content $index -Raw
$literalBackslashN = [string][char]92 + 'n'

$pass = $true

if ($js -notmatch "document\.createElement\('div'\)") {
    Write-Host 'Missing DOM div line creation'
    $pass = $false
}

if ($js -notmatch 'appendChild\(line\)') {
    Write-Host 'Missing appendChild(line)'
    $pass = $false
}

if ($js.Contains($literalBackslashN)) {
    Write-Host 'Literal backslash-n still exists in app.js'
    $pass = $false
}

if ($html -notmatch 'app\.js\?v=1703') {
    Write-Host 'Index does not reference V1703 cache-busted app.js'
    $pass = $false
}

if ($pass) {
    Write-Host 'CONSOLE_DOM_TEST: PASS'
    exit 0
} else {
    Write-Host 'CONSOLE_DOM_TEST: FAIL'
    exit 1
}
