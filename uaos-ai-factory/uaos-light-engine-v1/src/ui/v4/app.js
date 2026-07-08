const scenes = [
  "Party Mode","Oriental Live","Calm","Candle","Fireplace","Romantic Warm",
  "Cinema","Blue Club","Purple Wave","Bass Pulse","Wall Wash","Kitchen Warm","Mirror Glow"
];

function showTab(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function renderModes(){
  const box = document.getElementById("quickModes");
  box.innerHTML = "";
  scenes.forEach((name,i)=>{
    const d = document.createElement("div");
    d.className = "mode";
    d.innerHTML = `<h3>${name}</h3><p>Scene ${i+1}</p><button class="ok" onclick="runScene('${name}')">Run</button>`;
    box.appendChild(d);
  });
}

function runScene(name){
  alert(`Scene command placeholder: ${name}\nUse V3.1/V3 launcher for reliable physical output.`);
}

async function emergencyStop(){
  try{
    await fetch("/api/music/emergency-stop",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
    alert("Emergency Stop sent.");
  }catch(e){ alert("Emergency Stop failed: "+e.message); }
}

async function load(){
  renderModes();
  try{
    const s = await fetch("../../config/scenes-v4.json").then(r=>r.text());
    document.getElementById("sceneData").textContent = s;
  }catch{ document.getElementById("sceneData").textContent = "scenes-v4.json available under src/config."; }
  try{
    const f = await fetch("../../config/favorites-v4.json").then(r=>r.text());
    document.getElementById("favoritesData").textContent = f;
  }catch{ document.getElementById("favoritesData").textContent = "favorites-v4.json available under src/config."; }
}
load();
