export const CONTENT_CATEGORIES = Object.freeze([
  "uaos-original",
  "licensed-song-program",
  "public-domain-traditional",
  "user-private-project"
]);

export const PRODUCT_TIERS = Object.freeze([
  "essential",
  "pro",
  "signature",
  "official-artist-edition"
]);

export function createCatalogItem(input = {}) {
  if (!CONTENT_CATEGORIES.includes(input.category)) {
    throw new Error("Invalid rights category.");
  }
  const publishable = input.category !== "user-private-project" &&
    input.rightsApproved === true &&
    input.demoApproved === true;

  return {
    id: String(input.id || `catalog-${Date.now()}`),
    title: String(input.title || "Untitled"),
    category: input.category,
    tier: PRODUCT_TIERS.includes(input.tier) ? input.tier : "essential",
    status: publishable ? "approved" : "draft",
    rights: {
      rightsApproved: input.rightsApproved === true,
      demoApproved: input.demoApproved === true,
      redistributionAllowed: input.redistributionAllowed === true,
      proofRefs: Array.isArray(input.proofRefs) ? input.proofRefs : []
    },
    compatibility: Array.isArray(input.compatibility) ? input.compatibility : [],
    assets: {
      audioDemo: null,
      videoDemo: null,
      packages: []
    },
    pricingKey: input.pricingKey || null,
    createdAt: new Date().toISOString()
  };
}
