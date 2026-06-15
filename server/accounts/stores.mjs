import fs from "node:fs/promises";
import path from "node:path";

function clone(value) {
  return structuredClone(value);
}

function emptyState() {
  return {
    schemaVersion: 1,
    users: [],
    sessions: [],
    verificationTokens: [],
    passwordResetTokens: [],
  };
}

export class MemoryAccountStore {
  constructor(seed = emptyState()) {
    this.state = clone(seed);
  }

  async read() {
    return clone(this.state);
  }

  async write(nextState) {
    this.state = clone(nextState);
  }

  async transaction(callback) {
    const working = await this.read();
    const result = await callback(working);
    await this.write(working);
    return result;
  }
}

export class JsonAccountStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.queue = Promise.resolve();
  }

  async ensure() {
    await fs.mkdir(path.dirname(this.filePath), {
      recursive: true,
    });

    try {
      await fs.access(this.filePath);
    } catch {
      await this.write(emptyState());
    }
  }

  async read() {
    await this.ensure();

    const text = await fs.readFile(this.filePath, "utf8");
    const parsed = JSON.parse(text);

    return {
      ...emptyState(),
      ...parsed,
    };
  }

  async write(nextState) {
    await fs.mkdir(path.dirname(this.filePath), {
      recursive: true,
    });

    const temporary = `${this.filePath}.${process.pid}.tmp`;

    await fs.writeFile(
      temporary,
      JSON.stringify(nextState, null, 2) + "\n",
      {
        encoding: "utf8",
        mode: 0o600,
      },
    );

    await fs.rename(temporary, this.filePath);
  }

  async transaction(callback) {
    const task = async () => {
      const working = await this.read();
      const result = await callback(working);
      await this.write(working);
      return result;
    };

    this.queue = this.queue.then(task, task);
    return this.queue;
  }
}