/**
 * ZerxsBot - Local JSON store untuk data runtime bot:
 * quota harian, filter grup, welcome/antilink/antitoxic per grup,
 * CS state (riwayat + limit 100 pesan/hari), prefix custom.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "data", "botdata.json");

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (_) {
    cache = {};
  }
  cache.quota = cache.quota || {};
  cache.cs = cache.cs || {};
  cache.groups = cache.groups || {};
  cache.prefix = cache.prefix || {};
  return cache;
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(cache, null, 2));
    } catch (_) {}
  }, 400);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/* ------------------------- KUOTA HARIAN ------------------------ */

/** Naikkan pemakaian kuota; return jumlah pakai setelah naik. Reset jam 00.00. */
function useQuota(phone) {
  const s = load();
  const k = String(phone);
  const t = todayKey();
  if (!s.quota[k] || s.quota[k].day !== t) {
    s.quota[k] = { day: t, used: 0 };
  }
  s.quota[k].used += 1;
  save();
  return s.quota[k].used;
}

function getQuota(phone) {
  const s = load();
  const k = String(phone);
  const t = todayKey();
  if (!s.quota[k] || s.quota[k].day !== t) return 0;
  return s.quota[k].used;
}

/* ------------------------- CS STATE ---------------------------- */

/** Return { allowed, count } — limit CS 100 pesan/hari per nomor customer. */
function csUse(phone) {
  const s = load();
  const k = String(phone);
  const t = todayKey();
  if (!s.cs[k] || s.cs[k].day !== t) s.cs[k] = { day: t, count: 0, history: [] };
  s.cs[k].count += 1;
  save();
  return { allowed: s.cs[k].count <= 100, count: s.cs[k].count };
}

function csHistory(phone) {
  const s = load();
  const k = String(phone);
  const t = todayKey();
  if (!s.cs[k] || s.cs[k].day !== t) return [];
  return s.cs[k].history || [];
}

function csPush(phone, role, content) {
  const s = load();
  const k = String(phone);
  const t = todayKey();
  if (!s.cs[k] || s.cs[k].day !== t) s.cs[k] = { day: t, count: 0, history: [] };
  s.cs[k].history.push({ role, content });
  if (s.cs[k].history.length > 16) s.cs[k].history.shift();
  save();
}

/* ------------------------- GROUP SETTINGS ---------------------- */

function groupSettings(groupId) {
  const s = load();
  s.groups[groupId] = s.groups[groupId] || {
    antilink: false,
    antitoxic: false,
    welcome: false,
    rules:
      "1. Jaga sopan santun.\n2. No spam.\n3. No link promosi.\n4. Dilarang kata kasar.\n5. Langgar = mute/kick oleh bot.",
    filters: {}, // name -> text
    mutes: {}, // jid -> until timestamp
  };
  return s.groups[groupId];
}

function saveGroupSettings() {
  save();
}

/* ------------------------- PREFIX CUSTOM ----------------------- */

function getPrefix(userKey) {
  const s = load();
  return s.prefix[String(userKey)] || "/";
}

function setPrefix(userKey, pfx) {
  const s = load();
  s.prefix[String(userKey)] = pfx;
  save();
}

module.exports = {
  useQuota,
  getQuota,
  csUse,
  csHistory,
  csPush,
  groupSettings,
  saveGroupSettings,
  getPrefix,
  setPrefix,
};
