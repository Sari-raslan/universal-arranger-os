// UAOS_FORCE_VISUAL_REDESIGN_V1

function uaosForceVisualRedesign() {
  document.documentElement.setAttribute("data-uaos-force-theme", "neon-blue-white-v1");
  document.body.classList.add("uaos-force-body");

  if (!document.querySelector(".uaos-force-banner")) {
    const banner = document.createElement("div");
    banner.className = "uaos-force-banner";
    banner.textContent = "UAOS • NEON BLUE / WHITE DESIGN ACTIVE";
    document.body.prepend(banner);
  }

  const ctaPattern = /(download|apk|windows|desktop|open|demo|support|تحميل|تنزيل|ويندوز|دعم|öffnen|herunterladen|desktop)/i;

  document.querySelectorAll("a, button, [role='button']").forEach((el) => {
    const text = (el.textContent || "").trim();
    if (ctaPattern.test(text)) {
      el.classList.add("uaos-button");
    }
  });

  document.querySelectorAll("section, article, [class*='card'], [class*='panel']").forEach((el) => {
    el.classList.add("uaos-force-card");
  });
}

uaosForceVisualRedesign();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", uaosForceVisualRedesign);
}

new MutationObserver(uaosForceVisualRedesign).observe(document.documentElement, {
  childList: true,
  subtree: true
});