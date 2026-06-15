import http from "node:http";
import { readProductionIntegrationsConfig } from "./config.mjs";
import { PostgresAccountRepository } from "./postgresAccountRepository.mjs";
import { PostgresAccountService } from "./postgresAccountService.mjs";
import { createSmtpEmailService } from "./smtpEmailService.mjs";
import {
  StripeBilling,assertCsrf,clearSessionCookies,createSessionCookies,
  readSessionToken,readStripeConfig,
} from "./stripeBilling.mjs";

const config=readProductionIntegrationsConfig(process.env,{strict:true});
const stripeConfig=readStripeConfig(process.env,{strict:true});
const production=config.nodeEnv==="production";
const repository=new PostgresAccountRepository({
  connectionString:config.databaseUrl,ssl:config.databaseSsl,
});
const accounts=new PostgresAccountService(repository);
const email=createSmtpEmailService(config);
const billing=new StripeBilling({
  config:stripeConfig,publicBaseUrl:config.publicBaseUrl,pool:repository.pool,
});

function headers(origin){
  const h={"cache-control":"no-store","x-content-type-options":"nosniff"};
  if(origin===config.publicBaseUrl){
    h["access-control-allow-origin"]=origin;
    h["access-control-allow-credentials"]="true";
    h.vary="origin";
  }
  return h;
}
function json(res,status,value,{origin="",cookies=[]}={}){
  const body=JSON.stringify(value);
  const h={...headers(origin),"content-type":"application/json; charset=utf-8",
    "content-length":Buffer.byteLength(body)};
  if(cookies.length) h["set-cookie"]=cookies;
  res.writeHead(status,h);res.end(body);
}
async function raw(req,max=1024*1024){
  const chunks=[];let total=0;
  for await(const chunk of req){
    total+=chunk.length;if(total>max) throw new Error("Body too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function body(req){
  const b=await raw(req,256*1024);return b.length?JSON.parse(b.toString("utf8")):{};
}
async function auth(req){
  const token=readSessionToken(req,{production});
  const user=await accounts.authenticateSession(token);
  if(!user){const e=new Error("Authentication required.");e.statusCode=401;throw e}
  return {token,user};
}

const server=http.createServer(async(req,res)=>{
  const origin=String(req.headers.origin||"");
  try{
    const url=new URL(req.url||"/",`http://${req.headers.host||"localhost"}`);
    if(req.method==="OPTIONS"){
      if(origin!==config.publicBaseUrl) return json(res,403,{error:"origin-not-allowed"});
      res.writeHead(204,{...headers(origin),
        "access-control-allow-methods":"GET,POST,OPTIONS",
        "access-control-allow-headers":"content-type,authorization,x-uaos-csrf"});
      return res.end();
    }
    if(req.method==="POST"&&url.pathname==="/api/webhooks/stripe"){
      const payload=await raw(req);
      const event = await billing.event(payload,String(req.headers["stripe-signature"]||""));
      return json(res,200,await billing.process(event));
    }
    if(req.method==="GET"&&url.pathname==="/health"){
      await repository.health();await email.verifyConnection();
      return json(res,200,{ok:true,service:"uaos-commerce",stripe:true,cookies:true},{origin});
    }
    if(req.method==="POST"&&url.pathname==="/api/accounts/register"){
      const result=await accounts.register(await body(req));
      await email.sendVerificationEmail({email:result.user.email,token:result.verificationToken});
      return json(res,201,{user:result.user,verificationRequired:true},{origin});
    }
    if(req.method==="POST"&&url.pathname==="/api/accounts/verify-email"){
      const input=await body(req);
      return json(res,200,{verified:true,user:await accounts.verifyEmail(input.token)},{origin});
    }
    if(req.method==="POST"&&url.pathname==="/api/accounts/login"){
      const result=await accounts.login(await body(req));
      const cookies=createSessionCookies(result.sessionToken,{production});
      return json(res,200,{user:result.user,cookieSession:true},{origin,cookies:cookies.headers});
    }
    if(req.method==="GET"&&url.pathname==="/api/accounts/me"){
      const {user}=await auth(req);return json(res,200,{user},{origin});
    }
    if(req.method==="POST"&&url.pathname==="/api/accounts/logout"){
      assertCsrf(req,{origin:config.publicBaseUrl,production});
      const {token}=await auth(req);await accounts.logout(token);
      return json(res,200,{revoked:true},{origin,cookies:clearSessionCookies({production})});
    }
    if(req.method==="POST"&&url.pathname==="/api/accounts/password-reset/request"){
      const input=await body(req);const result=await accounts.requestPasswordReset(input.email);
      if(result.resetToken) await email.sendPasswordResetEmail({email:result.email,token:result.resetToken});
      return json(res,202,{accepted:true},{origin});
    }
    if(req.method==="POST"&&url.pathname==="/api/accounts/password-reset/confirm"){
      const result=await accounts.resetPassword(await body(req));
      return json(res,200,result,{origin,cookies:clearSessionCookies({production})});
    }
    if(req.method==="POST"&&url.pathname==="/api/billing/checkout"){
      assertCsrf(req,{origin:config.publicBaseUrl,production});
      const {user}=await auth(req);const input=await body(req);
      return json(res,200,await billing.checkout({
        user,planId:input.planId,customerId:await billing.customerForUser(user.id),
      }),{origin});
    }
    if(req.method==="POST"&&url.pathname==="/api/billing/portal"){
      assertCsrf(req,{origin:config.publicBaseUrl,production});
      const {user}=await auth(req);
      return json(res,200,await billing.portal(await billing.customerForUser(user.id)),{origin});
    }
    return json(res,404,{error:"not-found"},{origin});
  }catch(error){
    return json(res,error.statusCode||(/CSRF/.test(error.message)?403:400),
      {ok:false,error:error.message},{origin});
  }
});
await repository.health();await email.verifyConnection();
server.listen(config.port,"127.0.0.1",()=>console.log(`UAOS commerce on ${config.port}`));