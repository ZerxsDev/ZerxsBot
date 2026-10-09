// ============================================================
// commands/_loader.js - Memuat otomatis semua file perintah
// 1 perintah = 1 file JS di folder commands/
// Format file: module.exports = { cmd:"ai", aliases:[], handle(sock,m,args){...} }
// ============================================================
const fs = require("fs");
const path = require("path");

const registry = new Map(); // nama -> modul perintah

function loadAll() {
  registry.clear();
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith(".js") && !f.startsWith("_"));
  for (const f of files) {
    try {
      const mod = require(path.join(__dirname, f));
      if (!mod || !mod.cmd || typeof mod.handle !== "function") continue;
      registry.set(String(mod.cmd).toLowerCase(), mod);
      (mod.aliases || []).forEach(a => registry.set(String(a).toLowerCase(), mod));
    } catch (e) {
      console.error(`Gagal memuat perintah ${f}:`, e.message);
    }
  }
  return registry;
}

function get(cmdName) {
  if (registry.size === 0) loadAll();
  return registry.get(String(cmdName).toLowerCase());
}

function all() {
  if (registry.size === 0) loadAll();
  const seen = new Set();
  const out = [];
  for (const mod of registry.values()) {
    if (seen.has(mod.cmd)) continue;
    seen.add(mod.cmd);
    out.push(mod);
  }
  return out;
}

module.exports = { loadAll, get, all };
