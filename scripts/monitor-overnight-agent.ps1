while ($true) {
    Clear-Host
    Write-Host "UAOS OVERNIGHT AGENT MONITOR"
    Write-Host "==========================="

    Get-ScheduledTask -TaskName "UAOS Overnight Launch Agent" | Format-List TaskName,State

    Write-Host ""
    Write-Host "LAST LOG LINES:"

    if (Test-Path "launch\overnight-agent-log.txt") {
        Get-Content "launch\overnight-agent-log.txt" -Tail 30
    } else {
        Write-Host "Log file not created yet."
    }

    Start-Sleep -Seconds 5
}
