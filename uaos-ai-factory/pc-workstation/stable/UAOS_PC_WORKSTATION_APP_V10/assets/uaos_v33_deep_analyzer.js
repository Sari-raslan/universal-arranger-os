(function(){
  "use strict";
  const snapshot = {
    classifications: {likely_global:3, likely_sound_container:26, likely_songbook:8, likely_style_container:1},
    dsp: {Unknown:27, Pad:10, Drums:1}
  };
  function cards(id, data){
    document.getElementById(id).innerHTML = Object.entries(data).map(([key,value]) => `<article><h3>${key}</h3><strong>${value}</strong></article>`).join("");
  }
  function bindTabs(){
    document.querySelectorAll(".tabs button").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach(item => item.classList.toggle("active", item === button));
      document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.id === button.dataset.panel));
    }));
  }
  document.addEventListener("DOMContentLoaded", () => {
    cards("classificationCards", snapshot.classifications);
    cards("dspCards", snapshot.dsp);
    bindTabs();
  });
})();
