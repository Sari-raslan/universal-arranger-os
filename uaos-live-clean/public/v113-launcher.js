(() => {
  const id = "uaos-v113-control-center-launcher";

  function mount() {
    if (document.getElementById(id)) return;

    const anchor = document.createElement("a");
    anchor.id = id;
    anchor.href = "/v113-control-center.html";
    anchor.textContent = "UAOS 11.3 Control Center";
    anchor.setAttribute("aria-label", "Open UAOS 11.3 Control Center");
    anchor.style.cssText = [
      "position:fixed",
      "right:18px",
      "bottom:18px",
      "z-index:2147483000",
      "padding:12px 16px",
      "border:1px solid rgba(34,211,238,.65)",
      "border-radius:14px",
      "background:rgba(3,7,18,.92)",
      "color:#e6fbff",
      "font:700 13px/1.2 system-ui,sans-serif",
      "text-decoration:none",
      "box-shadow:0 0 26px rgba(34,211,238,.22)",
      "backdrop-filter:blur(12px)"
    ].join(";");
    document.body.appendChild(anchor);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();