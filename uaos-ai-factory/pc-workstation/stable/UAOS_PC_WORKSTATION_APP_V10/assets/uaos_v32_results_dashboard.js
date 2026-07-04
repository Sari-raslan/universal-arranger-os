(function(){
  "use strict";
  const summary = {
    files: 38,
    suggestions: 0,
    extensionCounts: {".mxp":1,".gbl":1,".voc":1,".pad":10,".prf":16,".sbl":1,".sty":1,".sbd":7},
    categoryCounts: {"possible_unknown_binary":11,"possible_performance_file":26,"possible_style_file":1},
    dsp: {
      "Arabic Strings":["EQ gentle high shelf","low cut","light compression","short room reverb","optional stereo width"],
      "Bass":["low control","compression","no wide stereo"],
      "Drums":["punch EQ","bus compression hint","room send"],
      "Pads":["high cut","wide reverb","slow attack"],
      "Unknown":["safe neutral chain","gain trim","no destructive processing"]
    }
  };
  function renderMap(targetId, map){
    document.getElementById(targetId).innerHTML = Object.entries(map).map(([key,value]) => `<article><h3>${key}</h3><strong>${Array.isArray(value) ? value.length : value}</strong>${Array.isArray(value) ? `<ul>${value.map(item => `<li>${item}</li>`).join("")}</ul>` : ""}</article>`).join("");
  }
  function renderExtensions(){
    document.getElementById("extensionRows").innerHTML = Object.entries(summary.extensionCounts).map(([ext,count]) => `<tr><td>${ext}</td><td>${count}</td></tr>`).join("");
  }
  function bindTabs(){
    document.querySelectorAll(".tabs button").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tabs button").forEach(item => item.classList.toggle("active", item === button));
        document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.id === button.dataset.panel));
      });
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filesCount").textContent = summary.files;
    document.getElementById("suggestionsCount").textContent = summary.suggestions;
    renderMap("categoryCards", summary.categoryCounts);
    renderExtensions();
    renderMap("dspCards", summary.dsp);
    bindTabs();
  });
})();
