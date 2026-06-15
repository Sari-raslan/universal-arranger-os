import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  StripeBilling,assertCsrf,createSessionCookies,readStripeConfig,
} from "../server/production/stripeBilling.mjs";

test("strict Stripe config rejects missing secrets",()=>{
  assert.throws(()=>readStripeConfig({}, {strict:true}),/Missing required/);
});
test("cookie session is HttpOnly Secure SameSite and CSRF protected",()=>{
  const s=createSessionCookies("abc",{production:true});
  assert.match(s.headers[0],/HttpOnly/);assert.match(s.headers[0],/Secure/);
  assert.match(s.headers[0],/SameSite=Lax/);
  assert.equal(assertCsrf({headers:{origin:"https://uaos.test",
    cookie:`__Host-uaos_csrf=${s.csrf}`,"x-uaos-csrf":s.csrf}},
    {origin:"https://uaos.test",production:true}),undefined);
});
test("Checkout uses subscription mode and approved price",async()=>{
  let input;
  const fake={
    checkout:{sessions:{create:async(v)=>(input=v,{id:"cs_1",url:"https://checkout.test"})}},
    billingPortal:{sessions:{create:async()=>({id:"bp_1",url:"https://portal.test"})}},
    webhooks:{constructEvent(){}},
  };
  const b=new StripeBilling({config:{secretKey:"sk",webhookSecret:"wh",
    creatorPriceId:"price_c",professionalPriceId:"price_p",
    automaticTax:false,allowPromotionCodes:true},
    publicBaseUrl:"https://uaos.test",pool:{},stripe:fake});
  const out=await b.checkout({user:{id:"u1",email:"u@test.de"},planId:"professional"});
  assert.equal(out.url,"https://checkout.test");
  assert.equal(input.mode,"subscription");assert.equal(input.line_items[0].price,"price_p");
});
test("migration and frontend billing endpoints exist",()=>{
  const sql=fs.readFileSync("migrations/002_stripe_billing.sql","utf8");
  const client=fs.readFileSync("uaos-live-clean/src/api/billingClient.js","utf8");
  assert.match(sql,/uaos_payment_events/);assert.match(sql,/stripe_customer_id/);
  assert.match(client,/api\/billing\/checkout/);assert.match(client,/api\/billing\/portal/);
});