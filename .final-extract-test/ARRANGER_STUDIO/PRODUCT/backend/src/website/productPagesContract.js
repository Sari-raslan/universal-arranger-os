/**
 * Product pages contract — validates 3-SKU website page structure (no deploy).
 */
import fs from "node:fs";
import path from "node:path";

export const PRODUCT_PAGE_SKUS = Object.freeze([
  {
    id: "arranger-studio",
    route: "/products/arranger-studio/",
    i18nNeedle: "arranger"
  },
  {
    id: "midi-toolkit",
    route: "/products/midi-toolkit/",
    i18nNeedle: "midi"
  },
  {
    id: "singy",
    route: "/products/singy/",
    i18nNeedle: "singy"
  }
]);

export function validateProductPagesContract({
  websiteRoot = path.join(process.cwd(), "public-website"),
  stringsEnPath = null
} = {}) {
  const appPath = path.join(websiteRoot, "src", "App.jsx");
  const productPagePath = path.join(websiteRoot, "src", "components", "ProductPage.jsx");
  const enPath = stringsEnPath || path.join(websiteRoot, "src", "i18n", "strings.en.js");
  const missing = [appPath, productPagePath, enPath].filter((p) => !fs.existsSync(p));
  if (missing.length) {
    return { ok: false, errorCode: "MISSING_WEBSITE_FILES", missing };
  }
  const app = fs.readFileSync(appPath, "utf8");
  const productPage = fs.readFileSync(productPagePath, "utf8");
  const en = fs.readFileSync(enPath, "utf8");
  const routeHits = PRODUCT_PAGE_SKUS.filter((s) => app.includes(s.route) || app.includes(s.id));
  const requiredSections = ["howItWorks", "points", "limitations", "faq"];
  const sectionHits = requiredSections.filter((s) => productPage.includes(s));
  const i18nHits = PRODUCT_PAGE_SKUS.filter(
    (s) => en.includes(s.route) || en.includes(`id: '${s.id}'`) || en.includes(s.i18nNeedle)
  );
  const ok =
    routeHits.length === PRODUCT_PAGE_SKUS.length &&
    sectionHits.length === requiredSections.length &&
    i18nHits.length === PRODUCT_PAGE_SKUS.length &&
    productPage.includes("aria-labelledby") &&
    productPage.includes("main-content");
  return {
    schema: "uaos.website.product-pages-contract/v1",
    ok,
    skus: PRODUCT_PAGE_SKUS.map((s) => s.id),
    routeHits: routeHits.map((s) => s.id),
    sectionHits,
    i18nHits: i18nHits.map((s) => s.id),
    productionDeploy: false,
    allowedPaths: ["public-website/src/**", "artifacts/website-v14-3sku-preview/**"],
    humanOnlySteps: []
  };
}
