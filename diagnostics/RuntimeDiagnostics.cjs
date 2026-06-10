
class RuntimeDiagnostics {
constructor(modules){
this.modules = modules;
}

run(){
const checks = {};

```
for(const [name,module] of Object.entries(this.modules)){
  try{
    checks[name] = {
      ok:true,
      available:!!module,
      status:typeof module.status === "function" ? module.status() : "no status method"
    };
  }catch(err){
    checks[name] = {
      ok:false,
      error:err.message
    };
  }
}

return {
  ok:Object.values(checks).every(c=>c.ok),
  checkedAt:Date.now(),
  checks
};
```

}
}

module.exports = { RuntimeDiagnostics };
