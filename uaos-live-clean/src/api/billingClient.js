import { ACCOUNTS_API_BASE_URL } from "./accountsClient.js";

function cookie(name){
  const prefix=`${name}=`;
  const item=document.cookie.split(";").map(v=>v.trim())
    .find(v=>v.startsWith(prefix));
  return item?decodeURIComponent(item.slice(prefix.length)):"";
}
function csrf(){return cookie("__Host-uaos_csrf")||cookie("uaos_csrf")}
async function post(path,data={}){
  const response=await fetch(`${ACCOUNTS_API_BASE_URL}${path}`,{
    method:"POST",credentials:"include",
    headers:{"content-type":"application/json","x-uaos-csrf":csrf()},
    body:JSON.stringify(data),
  });
  const payload=await response.json().catch(()=>({error:`HTTP ${response.status}`}));
  if(!response.ok) throw new Error(payload.error||"Billing request failed.");
  return payload;
}
export const startCheckout=(planId)=>post("/api/billing/checkout",{planId});
export const openBillingPortal=()=>post("/api/billing/portal");