$ports = @(3001,3002,3010,3020,3030,5173)

foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  foreach ($conn in $conns) {
    $processId = $conn.OwningProcess
    if ($processId) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped process $processId on port $port"
    }
  }
}
