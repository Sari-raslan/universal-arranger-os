const http = require("http");
const urls = ["http://localhost:8090/","http://localhost:8090/health","http://localhost:8090/scan","http://localhost:8090/api/status"];
function check(url){
  return new Promise(resolve=>{
    http.get(url,res=>resolve(`${url} => ${res.statusCode}`))
    .on("error",err=>resolve(`${url} => FAIL ${err.message}`));
  });
}
(async()=>{ for(const u of urls) console.log(await check(u)); })();
