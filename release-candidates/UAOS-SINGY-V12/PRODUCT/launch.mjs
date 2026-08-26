import{spawn}from"node:child_process";import fs from"node:fs";import http from"node:http";import path from"node:path";import{fileURLToPath}from"node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const PORT=Number(process.env.UAOS_PILOT_PORT||5201);
process.env.UAOS_PILOT_ROOT=ROOT;process.env.UAOS_PILOT_DATA=path.join(ROOT,"DATA");process.env.PORT=String(PORT);
fs.mkdirSync(process.env.UAOS_PILOT_DATA,{recursive:true});
const child=spawn(process.execPath,[path.join(ROOT,"PRODUCT","pilot-server.cjs")],{cwd:ROOT,env:process.env,stdio:"inherit"});
function wait(n=30){return new Promise((res,rej)=>{let i=0;const t=()=>{http.get("http://127.0.0.1:"+PORT+"/api/pilot/health",r=>{r.resume();r.statusCode===200?res():go()}).on("error",go).setTimeout(500,function(){this.destroy();go()})};const go=()=>{++i>=n?rej(new Error("timeout")):setTimeout(t,250)};t()})}
wait().then(()=>{const u="http://127.0.0.1:"+PORT+"/";if(process.platform==="win32")spawn("cmd",["/c","start","",u],{detached:true,stdio:"ignore"}).unref();}).catch(e=>{console.error(e.message);child.kill();process.exit(1)});
child.on("exit",c=>process.exit(c??0));