function applyUaosNeonTheme(){
  document.documentElement.setAttribute("data-uaos-theme","neon-blue-white");
  document.querySelectorAll("button,a,[role='button']").forEach((el)=>{
    const t=(el.textContent||"").toLowerCase();
    if(t.includes("download") || t.includes("تحميل") || t.includes("windows") || t.includes("apk")){
      el.classList.add("uaos-button");
    }
  });
}
applyUaosNeonTheme();
document.addEventListener("DOMContentLoaded", applyUaosNeonTheme);
new MutationObserver(applyUaosNeonTheme).observe(document.documentElement,{childList:true,subtree:true});