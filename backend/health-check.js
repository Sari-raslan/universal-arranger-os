const http = require("http");
http.get("http://127.0.0.1:5199/health",res=>{
  console.log("BACKEND HEALTH",res.statusCode);
  process.exit(res.statusCode===200?0:1);
}).on("error",err=>{
  console.error("BACKEND HEALTH FAIL",err.message);
  process.exit(1);
});
