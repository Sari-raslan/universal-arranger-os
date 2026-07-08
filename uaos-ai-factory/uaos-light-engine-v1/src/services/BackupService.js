const fs = require("fs");
const path = require("path");

class BackupService {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.backupDir = path.join(projectRoot, "generated", "v4-backups");
    fs.mkdirSync(this.backupDir, { recursive: true });
  }
  exportConfig() {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const out = path.join(this.backupDir, `config-backup-${stamp}.json`);
    const configDir = path.join(this.projectRoot, "src", "config");
    const files = {};
    for (const name of fs.readdirSync(configDir)) {
      if (name.endsWith(".json")) files[name] = fs.readFileSync(path.join(configDir, name), "utf8");
    }
    fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), files }, null, 2), "utf8");
    return out;
  }
}
module.exports = BackupService;
