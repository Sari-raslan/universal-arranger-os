(function(){
  "use strict";

  const storageKey = "uaos_v35_owner_confirmations";
  const exportName = "UAOS_OWNER_CONFIRMATIONS_V35.json";
  const items = [
    {
      id:"V35-001",
      file_or_item:"NEWNAME.SET\\GLOBAL\\MXPRESET.MXP",
      current_guess:"likely_global",
      confidence:"low",
      reason:"very small binary/metadata",
      recommended_owner_choice:"confirm_weak",
      dsp_category_guess:"Unknown",
      replacement_suggestion:"review_manually"
    },
    {
      id:"V35-002",
      file_or_item:"NEWNAME.SET\\STYLE\\USER01.STY",
      current_guess:"likely_style_container",
      confidence:"medium",
      reason:"style container is the largest/most useful review target",
      recommended_owner_choice:"unknown",
      dsp_category_guess:"Drums",
      replacement_suggestion:"DSP first, replacement later"
    },
    {
      id:"V35-003",
      file_or_item:"Sampler candidates",
      current_guess:"sampler_zero",
      confidence:"medium",
      reason:"لم تظهر ملفات سامبلر واضحة من الامتدادات أو الأسماء المقروءة. هذا لا يثبت أن الست لا يحتوي سامبلر؛ يعني فقط أن V33 لم يكتشف ملفات sample/multisample مكشوفة.",
      recommended_owner_choice:"unknown",
      dsp_category_guess:"Unknown",
      replacement_suggestion:"needs_full_backup"
    },
    {
      id:"V35-004",
      file_or_item:"DSP plan",
      current_guess:"dsp",
      confidence:"medium",
      reason:"38 metadata DSP assignments available",
      recommended_owner_choice:"confirm_dsp_only",
      dsp_category_guess:"Unknown",
      replacement_suggestion:"dsp_plan_only"
    }
  ];
  const choices = [
    ["confirm_sound","صوت"],
    ["confirm_style","ستايل"],
    ["confirm_sample","سامبلر"],
    ["confirm_weak","ضعيف"],
    ["confirm_keep","احتفظ"],
    ["confirm_replace_later","بدّل لاحقًا"],
    ["confirm_dsp_only","DSP فقط"],
    ["unknown","غير معروف"]
  ];
  let activeId = items[0].id;
  let state = loadState();

  function loadState(){
    try{
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    }catch(error){
      return {};
    }
  }

  function saveState(){
    localStorage.setItem(storageKey, JSON.stringify(state, null, 2));
    renderCounts();
  }

  function activeItem(){
    return items.find(item => item.id === activeId) || items[0];
  }

  function activeRecord(){
    const item = activeItem();
    if(!state[item.id]){
      state[item.id] = {choice:item.recommended_owner_choice, note:"", saved:false};
    }
    return state[item.id];
  }

  function renderItems(){
    const host = document.getElementById("itemButtons");
    host.innerHTML = "";
    items.forEach(item => {
      const record = state[item.id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = item.id === activeId ? "active" : "";
      button.innerHTML = `<span class="itemId">${item.id}</span><span class="itemTitle">${item.file_or_item}</span><span class="itemMeta">${record && record.saved ? "محفوظ" : "قيد المراجعة"}</span>`;
      button.addEventListener("click", () => {
        activeId = item.id;
        render();
      });
      host.appendChild(button);
    });
  }

  function renderChoices(){
    const host = document.getElementById("choiceButtons");
    const record = activeRecord();
    host.innerHTML = "";
    choices.forEach(([value,label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.choice = value;
      button.className = record.choice === value ? "selected" : "";
      button.textContent = label;
      button.addEventListener("click", () => {
        record.choice = value;
        record.saved = false;
        renderChoices();
        renderStatus();
      });
      host.appendChild(button);
    });
  }

  function renderDetail(){
    const item = activeItem();
    const record = activeRecord();
    document.getElementById("activeId").textContent = item.id;
    document.getElementById("activeName").textContent = item.file_or_item;
    document.getElementById("currentGuess").textContent = item.current_guess;
    document.getElementById("confidence").textContent = item.confidence;
    document.getElementById("dspGuess").textContent = item.dsp_category_guess;
    document.getElementById("replacementSuggestion").textContent = item.replacement_suggestion;
    document.getElementById("reasonText").textContent = item.reason;
    document.getElementById("ownerNote").value = record.note || "";
    renderStatus();
  }

  function renderStatus(){
    const record = activeRecord();
    const status = document.getElementById("activeStatus");
    status.textContent = record.saved ? "محفوظ محليًا" : "غير محفوظ";
  }

  function renderCounts(){
    const count = Object.values(state).filter(record => record && record.saved).length;
    document.getElementById("savedCount").textContent = String(count);
    document.getElementById("itemCount").textContent = String(items.length);
  }

  function render(){
    renderItems();
    renderDetail();
    renderChoices();
    renderCounts();
  }

  function bindActions(){
    document.getElementById("ownerNote").addEventListener("input", event => {
      const record = activeRecord();
      record.note = event.target.value;
      record.saved = false;
      renderStatus();
    });
    document.getElementById("saveChoice").addEventListener("click", () => {
      const record = activeRecord();
      record.note = document.getElementById("ownerNote").value;
      record.saved = true;
      record.saved_at = new Date().toISOString();
      saveState();
      render();
    });
    document.getElementById("resetChoices").addEventListener("click", () => {
      state = {};
      saveState();
      render();
    });
    document.getElementById("exportJson").addEventListener("click", () => {
      const payload = {
        workflow:"UAOS PC Workstation V35 Owner Confirmation",
        read_only:true,
        exported_at:new Date().toISOString(),
        items:items.map(item => ({
          ...item,
          owner_confirmation:state[item.id] || {choice:item.recommended_owner_choice,note:"",saved:false}
        }))
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = exportName;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindActions();
    render();
  });
})();
