param(
    [string]$Repo = "$PSScriptRoot\.."
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Repo = [IO.Path]::GetFullPath($Repo)
$ReportsDir = Join-Path $Repo "reports"
$JsonPath = Join-Path $ReportsDir "UAOS_HARDWARE_SCAN_REPORT.json"
$MarkdownPath = Join-Path $ReportsDir "UAOS_HARDWARE_SCAN_REPORT.md"
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[IO.Directory]::CreateDirectory($ReportsDir) | Out-Null

function Safe-Cim {
    param([string]$ClassName, [string]$Filter = "")
    try {
        if ($Filter) {
            return @(Get-CimInstance -ClassName $ClassName -Filter $Filter -ErrorAction Stop)
        }
        return @(Get-CimInstance -ClassName $ClassName -ErrorAction Stop)
    }
    catch {
        return @()
    }
}

function Command-Version {
    param([string]$CommandLine)
    try {
        return ((cmd.exe /d /s /c $CommandLine 2>&1 | Select-Object -First 1) | Out-String).Trim()
    }
    catch {
        return $null
    }
}

$Computer = Safe-Cim "Win32_ComputerSystem" | Select-Object -First 1
$Os = Safe-Cim "Win32_OperatingSystem" | Select-Object -First 1
$Cpu = Safe-Cim "Win32_Processor"
$Disks = Safe-Cim "Win32_LogicalDisk" "DriveType=3"
$Gpu = Safe-Cim "Win32_VideoController"
$Sound = Safe-Cim "Win32_SoundDevice"
$PnP = Safe-Cim "Win32_PnPEntity"
$UsbControllers = Safe-Cim "Win32_USBController"

$RelevantDevices = @(
    $PnP |
        Where-Object {
            $_.Name -match "audio|sound|midi|keyboard|korg|yamaha|roland|ketron|native instruments|usb"
        } |
        Select-Object Name, Manufacturer, PNPClass, Status, DeviceID
)

$PowerPlan = $null
try {
    $PowerPlan = (powercfg /getactivescheme 2>$null | Out-String).Trim()
}
catch {
}

$Inventory = [ordered]@{
    schemaVersion = 1
    collectedAt = (Get-Date).ToUniversalTime().ToString("o")
    scanMode = "read-only"
    computer = [ordered]@{
        manufacturer = $Computer.Manufacturer
        model = $Computer.Model
        totalPhysicalMemoryBytes = [int64]$Computer.TotalPhysicalMemory
    }
    operatingSystem = [ordered]@{
        caption = $Os.Caption
        version = $Os.Version
        buildNumber = $Os.BuildNumber
        architecture = $Os.OSArchitecture
        freePhysicalMemoryKb = [int64]$Os.FreePhysicalMemory
    }
    processors = @(
        $Cpu | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed
    )
    storage = @(
        $Disks | Select-Object DeviceID, VolumeName, FileSystem, Size, FreeSpace
    )
    graphics = @(
        $Gpu | Select-Object Name, DriverVersion, AdapterRAM, VideoProcessor, Status
    )
    soundDevices = @(
        $Sound | Select-Object Name, Manufacturer, Status, DeviceID
    )
    relevantPnpDevices = $RelevantDevices
    usbControllers = @(
        $UsbControllers | Select-Object Name, Manufacturer, Status, DeviceID
    )
    powerPlan = $PowerPlan
    runtimes = [ordered]@{
        node = Command-Version "node --version"
        npm = Command-Version "npm --version"
        git = Command-Version "git --version"
        python = Command-Version "python --version"
        java = Command-Version "java -version"
        ollama = Command-Version "ollama --version"
        aider = Command-Version "aider --version"
    }
    safety = [ordered]@{
        settingsChanged = $false
        driversChanged = $false
        midiMessagesSent = $false
        destructiveTestsRun = $false
    }
}

[IO.File]::WriteAllText(
    $JsonPath,
    ($Inventory | ConvertTo-Json -Depth 20),
    $Utf8NoBom
)

$Markdown = New-Object System.Collections.Generic.List[string]
$Markdown.Add("# UAOS Hardware Scan Report")
$Markdown.Add("")
$Markdown.Add("- Collected: $($Inventory.collectedAt)")
$Markdown.Add("- Mode: read-only")
$Markdown.Add("- Computer: $($Inventory.computer.manufacturer) $($Inventory.computer.model)")
$Markdown.Add("- RAM: $([math]::Round($Inventory.computer.totalPhysicalMemoryBytes / 1GB, 2)) GB")
$Markdown.Add("- Windows: $($Inventory.operatingSystem.caption) $($Inventory.operatingSystem.version)")
$Markdown.Add("")
$Markdown.Add("## Processors")
foreach ($Item in $Inventory.processors) {
    $Markdown.Add("- $($Item.Name) â€” cores $($Item.NumberOfCores), logical $($Item.NumberOfLogicalProcessors)")
}
$Markdown.Add("")
$Markdown.Add("## Storage")
foreach ($Item in $Inventory.storage) {
    $Size = if ($Item.Size) { [math]::Round($Item.Size / 1GB, 2) } else { 0 }
    $Free = if ($Item.FreeSpace) { [math]::Round($Item.FreeSpace / 1GB, 2) } else { 0 }
    $Markdown.Add("- $($Item.DeviceID) $($Item.VolumeName) â€” $Free GB free / $Size GB")
}
$Markdown.Add("")
$Markdown.Add("## Audio, MIDI, keyboard, and USB related devices")
foreach ($Item in $Inventory.relevantPnpDevices) {
    $Markdown.Add("- $($Item.Name) â€” $($Item.Manufacturer) â€” $($Item.Status)")
}
$Markdown.Add("")
$Markdown.Add("## Safety")
$Markdown.Add("- No device setting was changed.")
$Markdown.Add("- No driver was changed.")
$Markdown.Add("- No MIDI message was sent.")
$Markdown.Add("- No destructive benchmark was run.")
$Markdown.Add("")
$Markdown.Add("NOT MERGED / NOT DEPLOYED")

[IO.File]::WriteAllText(
    $MarkdownPath,
    ($Markdown -join [Environment]::NewLine),
    $Utf8NoBom
)

Write-Host "UAOS hardware scan complete"
Write-Host "JSON: $JsonPath"
Write-Host "Report: $MarkdownPath"