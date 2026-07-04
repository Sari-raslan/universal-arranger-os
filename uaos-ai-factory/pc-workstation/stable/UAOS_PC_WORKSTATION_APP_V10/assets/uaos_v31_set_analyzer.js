(function(){
  "use strict";
  const fallbackStats = {
    totalFiles: "WAITING",
    sounds: "WAITING",
    samples: "WAITING",
    styles: "WAITING",
    unknown: "WAITING",
    duplicates: "WAITING",
    empty: "WAITING"
  };
  const dsp = {
    "Arabic Strings": ["EQ gentle high shelf", "low cut", "light compression", "short room reverb", "optional stereo width"],
    "Bass": ["low control", "compression", "no wide stereo"],
    "Drums": ["punch EQ", "bus compression hint", "room send"],
    "Pads": ["high cut", "wide reverb", "slow attack"],
    "Unknown": ["safe neutral chain"]
  };
  function cell(value){return value === undefined || value === null ? "WAITING" : String(value);}
  function renderStats(stats){
    document.getElementById("stats").innerHTML = Object.entries(stats).map(([key,value]) => `<div><span>${key}</span><strong>${cell(value)}</strong></div>`).join("");
  }
  function renderRows(id, rows, cols){
    document.getElementById(id).innerHTML = rows.length ? rows.map(row => `<tr>${cols.map(col => `<td>${cell(row[col])}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}">WAITING_FOR_OWNER_SET</td></tr>`;
  }
  function renderDsp(){
    document.getElementById("dspCards").innerHTML = Object.entries(dsp).map(([category, steps]) => `<article><h3>${category}</h3><ul>${steps.map(step => `<li>${step}</li>`).join("")}</ul><p>METADATA_ONLY</p></article>`).join("");
  }
  function init(){
    renderStats(fallbackStats);
    renderRows("emptyRows", [], ["slot_or_file","reason","confidence","suggested_action"]);
    renderRows("samplerRows", [], ["file","size","duplicate_hash","likely_category","used_unused_hypothesis"]);
    renderRows("replacementRows", [], ["empty_or_weak_item","suggested_replacement","confidence","reason"]);
    renderDsp();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
