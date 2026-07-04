(function(){
  "use strict";

  const choices = [
    {item:"NEWNAME.SET\\GLOBAL\\MXPRESET.MXP", choice:"confirm_weak", type:"Weak/global metadata candidate"},
    {item:"NEWNAME.SET\\STYLE\\USER01.STY", choice:"confirm_style", type:"Confirmed style source"},
    {item:"Sampler candidates", choice:"unknown", type:"Sampler presence unknown"},
    {item:"DSP plan", choice:"confirm_dsp_only", type:"DSP metadata only"}
  ];
  const actions = [
    {item:"NEWNAME.SET\\GLOBAL\\MXPRESET.MXP", safe:"Review metadata role and mark weak/global metadata candidate", blocked:"Write, replace, or map into keyboard format", next:"Backup completeness check"},
    {item:"NEWNAME.SET\\STYLE\\USER01.STY", safe:"Classify as style source and create metadata tags", blocked:"Direct style editing", next:"Style review JSON in V37"},
    {item:"Sampler candidates", safe:"Explain not detected and request wider backup if available", blocked:"Sample extraction", next:"Full backup check if owner provides it"},
    {item:"DSP plan", safe:"Create category-based DSP metadata plan", blocked:"Assigning DSP to keyboard data", next:"DSP plan JSON in V37"}
  ];
  const dsp = [
    {chain:"Global safe chain", category:"Global/Utility", use:"Neutral metadata chain for global or unclear files"},
    {chain:"Style playback chain", category:"Drums/Style", use:"Style playback review hints for USER01 style source"},
    {chain:"Unknown source neutral chain", category:"Unknown", use:"Light neutral chain for unknown metadata rows"},
    {chain:"Arabic strings chain", category:"Future preset", use:"Future UI/player preset idea only; not assigned unless confirmed"}
  ];

  function bindTabs(){
    document.querySelectorAll(".tabs button").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".tabs button").forEach(item => item.classList.toggle("active", item === button));
        document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.id === button.dataset.panel));
      });
    });
  }

  function renderChoices(){
    const host = document.getElementById("choiceGrid");
    host.innerHTML = choices.map(item => `<article class="choiceCard"><span>${item.item}</span><strong>${item.type}</strong><em>${item.choice}</em></article>`).join("");
  }

  function renderActions(){
    const host = document.getElementById("actionPlan");
    host.innerHTML = actions.map(item => `<article class="row"><b>${item.item}</b><span>Safe now</span><strong>${item.safe}</strong><span>Blocked</span><small>${item.blocked}</small><span>Next</span><small>${item.next}</small></article>`).join("");
  }

  function renderDsp(){
    const host = document.getElementById("dspPlan");
    host.innerHTML = dsp.map(item => `<article class="row"><b>${item.chain}</b><span>${item.category}</span><strong>${item.use}</strong></article>`).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindTabs();
    renderChoices();
    renderActions();
    renderDsp();
  });
})();
