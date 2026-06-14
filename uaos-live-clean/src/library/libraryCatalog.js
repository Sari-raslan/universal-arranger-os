import { createLibraryManifest, validateManifest } from "./libraryManifest.js";

export const LIBRARY_CATALOG_SCHEMA_VERSION = 2;
export const LIBRARY_CATEGORIES = Object.freeze([
  "Oriental",
  "Gulf",
  "Turkish",
  "Western",
  "Drums",
  "Bass",
  "Pads",
  "Phrases",
]);

export function createLibraryItem(input) {
  const manifest = createLibraryManifest(input);
  return Object.freeze({
    ...manifest,
    stableInstrumentId: input.stableInstrumentId || manifest.libraryId,
    category: LIBRARY_CATEGORIES.includes(input.category) ? input.category : "Western",
    favorite: Boolean(input.favorite),
    lastUsedAt: input.lastUsedAt || null,
    presetMetadata: Object.freeze({
      presetId: input.presetMetadata?.presetId || manifest.libraryId,
      samplerPresetRef: input.presetMetadata?.samplerPresetRef || null,
      arrangerRole: input.presetMetadata?.arrangerRole || "instrument",
    }),
    legal: Object.freeze({
      source: input.legal?.source || manifest.licenseStatus,
      fileReferenceOnly: input.legal?.fileReferenceOnly !== false,
      notes: input.legal?.notes || "Metadata reference only. No commercial files are copied.",
    }),
  });
}

export function validateCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== "object") return ["catalog must be an object"];
  if (catalog.schemaVersion !== LIBRARY_CATALOG_SCHEMA_VERSION) errors.push("schemaVersion must be 2");
  if (!Array.isArray(catalog.items)) errors.push("items must be an array");
  for (const item of catalog.items || []) {
    errors.push(...validateManifest(item));
    if (!item.stableInstrumentId) errors.push(`${item.libraryId} stableInstrumentId is required`);
    if (!LIBRARY_CATEGORIES.includes(item.category)) errors.push(`${item.libraryId} category is invalid`);
  }
  return errors;
}

export function createLibraryCatalog(items = []) {
  return {
    schemaVersion: LIBRARY_CATALOG_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    items: items.map(createLibraryItem),
    favorites: items.filter((item) => item.favorite).map((item) => item.libraryId),
    recentPresets: items.filter((item) => item.lastUsedAt).map((item) => item.libraryId),
  };
}

export function searchLibrary(catalog, { query = "", category = "all", tag = "", favoritesOnly = false } = {}) {
  const normalized = query.trim().toLowerCase();
  return (catalog.items || []).filter((item) => {
    const matchesQuery = !normalized || [
      item.name,
      item.vendor,
      item.instrumentFamily,
      item.category,
      ...item.tags,
    ].join(" ").toLowerCase().includes(normalized);
    const matchesCategory = category === "all" || item.category === category;
    const matchesTag = !tag || item.tags.includes(tag);
    const matchesFavorite = !favoritesOnly || item.favorite;
    return matchesQuery && matchesCategory && matchesTag && matchesFavorite;
  });
}

export function markFavorite(catalog, libraryId, favorite = true) {
  return {
    ...catalog,
    items: catalog.items.map((item) =>
      item.libraryId === libraryId ? createLibraryItem({ ...item, favorite }) : item,
    ),
  };
}

export function markRecent(catalog, libraryId, at = new Date().toISOString()) {
  return {
    ...catalog,
    items: catalog.items.map((item) =>
      item.libraryId === libraryId ? createLibraryItem({ ...item, lastUsedAt: at }) : item,
    ),
  };
}
