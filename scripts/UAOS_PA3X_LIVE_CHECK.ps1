$Base="http://localhost:8090"

$tests=@(
  @{u="/scan";m="GET";b=$null},
  @{u="/open";m="POST";b="{}"},
  @{u="/chord";m="POST";b='{"chord":"CM"}'},
  @{u="/chord";m="POST";b='{"chord":"AB"}'},
  @{u="/progression";m="POST";b='{"name":"oriental_pop","gap":900}'},
  @{u="/fill";m="POST";b="{}"},
  @{u="/break";m="POST";b="{}"},
  @{u="/panic";m="POST";b="{}"}
)

foreach($t in $tests){
  try{
    if($t.m -eq "GET"){
      $r=Invoke-WebRequest "$Base$($t.u)" -UseBasicParsing -TimeoutSec 5
    }else{
      $r=Invoke-WebRequest "$Base$($t.u)" -Method POST -ContentType "application/json" -Body $t.b -UseBasicParsing -TimeoutSec 5
    }
    Write-Host "$($t.u) => $($r.StatusCode)" -ForegroundColor Green
  }catch{
    Write-Host "$($t.u) => FAIL" -ForegroundColor Red
  }
}
