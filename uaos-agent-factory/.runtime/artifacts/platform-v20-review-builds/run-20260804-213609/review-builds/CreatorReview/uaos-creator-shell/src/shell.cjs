'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readJson(p) {
  let t = fs.readFileSync(p, 'utf8');
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  return JSON.parse(t);
}

function atomicWrite(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, data, 'utf8');
  fs.renameSync(tmp, filePath);
}

class FeatureFlags {
  constructor(flags) { this.flags = { ...flags }; }
  enabled(name) { return !!this.flags[name]; }
  enforce(name) {
    if (!this.enabled(name)) {
      const err = new Error(`FEATURE_FLAG_DISABLED:${name}`);
      err.code = 'FEATURE_FLAG_DISABLED';
      throw err;
    }
  }
}

class Entitlements {
  constructor(tier, contracts) {
    this.tier = tier;
    this.contracts = contracts;
  }
  has(feature) {
    const e = this.contracts.entitlements[this.tier];
    if (!e) return false;
    const expand = (tier, seen = new Set()) => {
      if (seen.has(tier)) return [];
      seen.add(tier);
      const ent = this.contracts.entitlements[tier];
      if (!ent) return [];
      let out = [];
      for (const f of ent.features || []) {
        if (this.contracts.entitlements[f]) out = out.concat(expand(f, seen));
        else out.push(f);
      }
      return out;
    };
    return expand(this.tier).includes(feature);
  }
  enforce(feature) {
    if (!this.has(feature)) {
      const err = new Error(`ENTITLEMENT_REQUIRED:${feature}`);
      err.code = 'ENTITLEMENT_REQUIRED';
      throw err;
    }
  }
}

class CommandBus {
  constructor() { this.handlers = new Map(); this.log = []; }
  register(cmd, fn) { this.handlers.set(cmd, fn); }
  dispatch(cmd, payload = {}) {
    const h = this.handlers.get(cmd);
    if (!h) {
      const err = new Error(`UNKNOWN_COMMAND:${cmd}`);
      err.code = 'UNKNOWN_COMMAND';
      throw err;
    }
    const entry = { cmd, at: new Date().toISOString(), payloadKeys: Object.keys(payload) };
    this.log.push(entry);
    return h(payload);
  }
}

class EvidenceHooks {
  constructor() { this.events = []; }
  emit(type, detail = {}) {
    const ev = { type, at: new Date().toISOString(), detail };
    this.events.push(ev);
    return ev;
  }
}

function createProject({ name = 'Untitled Creator Project' } = {}) {
  const now = new Date().toISOString();
  return {
    schemaVersion: 'uaos.creator.project/v1',
    projectId: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    tracks: [],
    assets: [],
    featureFlags: {},
    entitlements: {}
  };
}

function validateProject(project) {
  if (!project || typeof project !== 'object') return { ok: false, error: 'NOT_OBJECT' };
  if (project.schemaVersion !== 'uaos.creator.project/v1') return { ok: false, error: 'BAD_SCHEMA' };
  if (!project.projectId) return { ok: false, error: 'MISSING_PROJECT_ID' };
  if (!Array.isArray(project.tracks)) return { ok: false, error: 'TRACKS_NOT_ARRAY' };
  if (!Array.isArray(project.assets)) return { ok: false, error: 'ASSETS_NOT_ARRAY' };
  return { ok: true };
}

function saveProject(filePath, project) {
  const v = validateProject(project);
  if (!v.ok) throw new Error(`INVALID_PROJECT:${v.error}`);
  project.updatedAt = new Date().toISOString();
  atomicWrite(filePath, JSON.stringify(project, null, 2));
  return project;
}

function openProject(filePath) {
  const project = readJson(filePath);
  const v = validateProject(project);
  if (!v.ok) throw new Error(`INVALID_PROJECT:${v.error}`);
  return project;
}

const AudioMidiServiceInterface = {
  name: 'AudioMidiService',
  methods: ['listDevices', 'openInput', 'openOutput', 'close'],
  implemented: false
};

const SamplerAdapterInterface = {
  name: 'SamplerAdapter',
  methods: ['load', 'preview', 'unload'],
  implemented: false
};

const GlobalPlayerMixerInterface = {
  name: 'GlobalPlayerMixer',
  methods: ['play', 'stop', 'setGain', 'getMeter'],
  implemented: false
};

module.exports = {
  readJson,
  atomicWrite,
  FeatureFlags,
  Entitlements,
  CommandBus,
  EvidenceHooks,
  createProject,
  validateProject,
  saveProject,
  openProject,
  AudioMidiServiceInterface,
  SamplerAdapterInterface,
  GlobalPlayerMixerInterface
};
