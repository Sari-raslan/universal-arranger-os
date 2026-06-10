$Base="http://localhost:8090"
$tests=@(
  @{u="/scan";m="GET";b=$null},
  @{u="/open";m="POST";b="{}"},
  @{u="/send";m="POST";b='{"note":60,"velocity":100,"channel":0}'},
  @{u="/chord";m="POST";b='{"chord":"CM"}'},
  @{u="/chord";m="POST";b='{"chord":"F"}'},
  @{u="/chord";m="POST";b='{"chord":"G"}'},
  @{u="/progression";m="POST";b='{"name":"oriental_pop","gap":900}'},
  @{u="/panic";m="POST";b="{}"}
)

foreach($t in $tests){
  try{
    if($t.m -eq "GET"){
      $r=Invoke-WebRequest "$Base$($t.u)" -UseBasicParsing -TimeoutSec 6
    } else {
      $r=Invoke-WebRequest "$Base$($t.u)" -Method POST -ContentType "application/json" -Body $t.b -UseBasicParsing -TimeoutSec 6
    }
    Write-Host "$($t.u) => $($r.StatusCode)" -ForegroundColor Green
  }catch{
    Write-Host "$($t.u) => FAIL" -ForegroundColor Red
  }
}
