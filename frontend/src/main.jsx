import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

const modules = [
  ["Runtime Agent","Playing, tempo, chord and section state.","runtime/src/UaosRuntime.js"],
  ["MIDI Agent","MIDI notes, CC, program change router.","midi-router/src/MidiRouter.js"],
  ["Sampler Agent","Feel sampler selection by note, velocity, articulation and maqam.","sampler-engine/src/feelSampler.js"],
  ["Keyboard Runtime Agent","Keyboard profiles and pack loading foundation.","keyboard-runtime/src/KeyboardRuntime.js"],
  ["Pack System Agent",".uaos-pack validation and manifest direction.","pack-system/src/UaosPack.js"],
  ["Library Manager Agent","Oriental expansion and future library catalog.","library-manager/src/LibraryManager.js"],
  ["AI/Ollama Planner Agent","Safe local planning scaffold with manual review.","ai-features/src/AiMission.js"],
  ["Desktop/Android Agent","Packaging notes for desktop and Android.","desktop-packaging / android-packaging"],
  ["QA Agent","Build, Pages, payments, mobile and runtime checklist.","qa/src/qaChecklist.js"]
];

function App(){
  return React.createElement("main",{className:"page"},
    React.createElement("section",{className:"hero"},
      React.createElement("div",{className:"pill"},"SAFE MODULE UI INTEGRATION"),
      React.createElement("h1",null,"UAOS"),
      React.createElement("h2",null,"Universal Arranger OS - Module UI"),
      React.createElement("p",null,"Agents are scaffolded and visible as product modules. This is the safe UI layer before wiring real runtime behavior."),
      React.createElement("div",{className:"actions"},
        React.createElement("a",{href:"./launch/payment.html"},"Premium"),
        React.createElement("a",{href:"./status-ar.html"},"Arabic Status"),
        React.createElement("a",{href:"#modules"},"Modules")
      )
    ),
    React.createElement("section",{id:"modules",className:"grid"},
      modules.map(([title,desc,path]) =>
        React.createElement("article",{className:"card",key:title},
          React.createElement("h3",null,title),
          React.createElement("p",null,desc),
          React.createElement("code",null,path),
          React.createElement("span",{className:"badge"},"SAFE SCAFFOLD")
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));