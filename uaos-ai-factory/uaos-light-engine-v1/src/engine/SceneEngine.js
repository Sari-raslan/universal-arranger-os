const fs = require("fs");
const path = require("path");

class SceneEngine {
  constructor(configPath) {
    this.configPath = configPath || path.join(__dirname, "..", "config", "scenes-v4.json");
    this.scenes = [];
    this.load();
  }

  load() {
    const raw = fs.readFileSync(this.configPath, "utf8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);
    this.scenes = data.scenes || [];
    return this.scenes;
  }

  list() { return this.scenes; }

  get(id) {
    return this.scenes.find(s => String(s.id) === String(id) || String(s.name).toLowerCase() === String(id).toLowerCase());
  }

  saveFavorite(favoritesPath, slot, sceneId) {
    const raw = fs.existsSync(favoritesPath) ? fs.readFileSync(favoritesPath, "utf8").replace(/^\uFEFF/, "") : '{"slots":{}}';
    const fav = JSON.parse(raw);
    fav.slots = fav.slots || {};
    fav.slots[String(slot)] = sceneId;
    fs.writeFileSync(favoritesPath, JSON.stringify(fav, null, 2), "utf8");
    return fav;
  }
}
module.exports = SceneEngine;
