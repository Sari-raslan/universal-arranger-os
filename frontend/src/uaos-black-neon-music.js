// UAOS_BLACK_NEON_MUSIC_V1

function uaosBlackNeonMusicTheme(){
  document.documentElement.setAttribute("data-uaos-theme","black-neon-music-v1");
  document.body.classList.add("uaos-black-neon-body");

  if(!document.querySelector(".uaos-force-banner")){
    const banner=document.createElement("div");
    banner.className="uaos-force-banner";
    banner.textContent="UAOS • BLACK NEON MUSIC MODE • LED / MIDI / OMR";
    document.body.prepend(banner);
  }

  if(!document.querySelector(".uaos-led-orbit")){
    const orbit=document.createElement("div");
    orbit.className="uaos-led-orbit";
    document.body.appendChild(orbit);
  }

  if(!document.querySelector(".uaos-note-layer")){
    const layer=document.createElement("div");
    layer.className="uaos-note-layer";
    const notes=["♪","♫","♬","♩","♭","♯","𝄞","𝄢"];
    for(let i=0;i<18;i++){
      const s=document.createElement("span");
      s.textContent=notes[i % notes.length];
      s.style.left=(Math.random()*100)+"%";
      s.style.animationDelay=(Math.random()*12)+"s";
      s.style.animationDuration=(10+Math.random()*10)+"s";
      s.style.fontSize=(22+Math.random()*42)+"px";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
  }

  const ctaPattern=/(download|apk|windows|desktop|open|demo|support|تحميل|تنزيل|ويندوز|دعم|öffnen|herunterladen|desktop)/i;

  document.querySelectorAll("a,button,[role='button']").forEach((el)=>{
    const text=(el.textContent||"").trim();
    if(ctaPattern.test(text)){
      el.classList.add("uaos-button");
    }
  });
}

uaosBlackNeonMusicTheme();

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",uaosBlackNeonMusicTheme);
}

new MutationObserver(uaosBlackNeonMusicTheme).observe(document.documentElement,{
  childList:true,
  subtree:true
});