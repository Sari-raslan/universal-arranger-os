import fs from "node:fs";
import path from "node:path";
import { canonicalPricing } from "../uaos-live-clean/src/commercial/phase10Commercial.js";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
const pricing = canonicalPricing();
const byId = Object.fromEntries(pricing.map((plan) => [plan.productId, plan]));
const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
const ok = byId.sing.regularAmount === 0 && byId.studio.introAmount === 7.99 && byId.studio.regularAmount === 12.99 && byId.pro.introAmount === 19.99 && byId.pro.regularAmount === 29.99 && byId.ultimate.notForSale === true && app.includes("49.99 EUR/month planned - not for sale");
const result = { schemaVersion: 1, generatedAt: new Date().toISOString(), passed: ok, pricing, checkoutEnabled: false, realPayment: false };
fs.writeFileSync(path.join(reportsDir, "UAOS_PRICING_CHECK.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`UAOS pricing check passed: ${ok}`);
if (!ok) process.exit(1);
