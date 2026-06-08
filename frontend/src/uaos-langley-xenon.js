// UAOS_LANGLEY_XENON_DARK_V1
function uaosLangleyXenon(){
  document.documentElement.setAttribute("data-uaos-theme","langley-xenon-dark-v1");

  if(!document.querySelector(".uaos-xenon-banner")){
    const b=document.createElement("div");
    b.className="uaos-xenon-banner";
    b.textContent="UAOS • LANGLEY XENON DARK 3D MODE";
    document.body.prepend(b);
  }

  if(!document.querySelector(".uaos-xenon-orb")){
    const o=document.createElement("div");
    o.className="uaos-xenon-orb";
    document.body.appendChild(o);
  }

  if(!document.querySelector(".uaos-note-layer")){
    const layer=document.createElement("div");
    layer.className="uaos-note-layer";
    const notes=["♪","♫","♬","♩","♭","♯","𝄞","𝄢"];
    for(let i=0;i<16;i++){
      const s=document.createElement("span");
      s.textContent=notes[i%notes.length];
      s.style.left=(Math.random()*100)+"%";
      s.style.fontSize=(20+Math.random()*38)+"px";
      s.style.animationDelay=(Math.random()*12)+"s";
      s.style.animationDuration=(11+Math.random()*10)+"s";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
  }

  const re=/(download|apk|windows|desktop|open|demo|support|تحميل|تنزيل|ويندوز|دعم|öffnen|herunterladen)/i;
  document.querySelectorAll("a,button,[role='button']").forEach(el=>{
    if(re.test((el.textContent||"").trim())) el.classList.add("uaos-button");
  });
}
uaosLangleyXenon();
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",uaosLangleyXenon);
new MutationObserver(uaosLangleyXenon).observe(document.documentElement,{childList:true,subtree:true});