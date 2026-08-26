export const templates = [
  {
    id: "oriental-live",
    name: "Oriental Live Setup",
    tempo: 120,
    chord: "Cm",
    style: "Oriental Pop",
    sections: ["Intro", "Main A", "Main B", "Fill", "Ending"]
  },
  {
    id: "dabke-stage",
    name: "Dabke Stage Setup",
    tempo: 132,
    chord: "Dm",
    style: "Dabke Live",
    sections: ["Intro", "Main A", "Main B", "Break", "Ending"]
  },
  {
    id: "studio-ballad",
    name: "Studio Ballad Setup",
    tempo: 76,
    chord: "Am",
    style: "Slow Ballad",
    sections: ["Intro", "Main A", "Main B", "Fill", "Ending"]
  }
];

export function listTemplates() {
  return templates;
}

export function getTemplate(id) {
  return templates.find(t => t.id === id) || templates[0];
}