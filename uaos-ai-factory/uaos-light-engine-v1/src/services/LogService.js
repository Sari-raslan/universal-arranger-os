const fs = require("fs");
const path = require("path");

class LogService {
  constructor(baseDir) {
    this.baseDir = baseDir || path.join(__dirname, "..", "..", "generated", "v4-logs");
    fs.mkdirSync(this.baseDir, { recursive: true });
  }
  write(event, data = {}) {
    const row = { at: new Date().toISOString(), event, data };
    const file = path.join(this.baseDir, "uaos-light-engine-v4-events.jsonl");
    fs.appendFileSync(file, JSON.stringify(row) + "\n", "utf8");
    return row;
  }
}
module.exports = LogService;
