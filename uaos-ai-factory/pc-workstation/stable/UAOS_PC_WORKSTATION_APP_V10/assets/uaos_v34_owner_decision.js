(function(){
  "use strict";
  function bindTabs(){
    document.querySelectorAll(".tabs button").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach(item => item.classList.toggle("active", item === button));
      document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.id === button.dataset.panel));
    }));
  }
  function bindPathButtons(){
    document.querySelectorAll("[data-path]").forEach(button => {
      button.addEventListener("click", () => {
        button.textContent = button.dataset.path;
      });
    });
  }
  document.addEventListener("DOMContentLoaded", () => { bindTabs(); bindPathButtons(); });
})();
