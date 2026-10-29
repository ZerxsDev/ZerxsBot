/**
 * ZerxsBot - Apps Script backend untuk Google Spreadsheet.
 * CARA PAKAI:
 *  1. Buat Google Spreadsheet dengan 2 sheet: "Users" dan "Bots".
 *  2. Header Users : username | password | phone | role | expired | status | dibuatOleh | quotaHari | quotaPakai | lastReset
 *  3. Header Bots  : botNumber | botName | type | status | owner | createdAt
 *     (role: member, admin, partner, owner, business, founder, developer)
 *  4. Extensions > Apps Script > tempel kode ini > Deploy > Web App
 *     Execute as: Me, Who has access: Anyone.
 *  5. Salin URL /exec ke config.js -> appsScript.url (JANGAN lewat web).
 */
const SHEET_USERS = "Users";
const SHEET_BOTS = "Bots";
const USERS_HEADER = [
  "username",
  "password",
  "phone",
  "role",
  "expired",
  "status",
  "dibuatOleh",
  "quotaHari",
  "quotaPakai",
  "lastReset",
];
const BOTS_HEADER = [
  "botNumber",
  "botName",
  "type",
  "status",
  "owner",
  "createdAt",
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const res = handle(body);
    return json(res);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  return json({
    ok: true,
    service: "ZerxsBot Spreadsheet API",
    version: "1.0.1",
  });
}

function handle(b) {
  const action = b.action;
  switch (action) {
    case "login":
      return apiLogin(b);
    case "listUsers":
      return { ok: true, data: readUsers() };
    case "addUser":
      return apiAddUser(b);
    case "deleteUser":
      return apiDeleteUser(b);
    case "changePassword":
      return apiChangePassword(b);
    case "updateUser":
      return apiUpdateUser(b);
    case "stats":
      return apiStats();
    case "listBots":
      return { ok: true, data: readBots() };
    case "addBot":
      return apiAddBot(b);
    case "deleteBot":
      return apiDeleteBot(b);
    case "updateBot":
      return apiUpdateBot(b);
    default:
      return { ok: false, error: "Aksi tidak dikenal: " + action };
  }
}

/* ------------------------- UTIL SHEET -------------------------- */

function ss() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet(name, header) {
  let sh = ss().getSheetByName(name);
  if (!sh) sh = ss().insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(header);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rowsToObjects(sh, header) {
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    header.forEach((h, c) => (obj[h] = values[i][c]));
    obj.__row = i + 1;
    out.push(obj);
  }
  return out;
}

function readUsers() {
  const sh = ensureSheet(SHEET_USERS, USERS_HEADER);
  return rowsToObjects(sh, USERS_HEADER).map(stripRow);
}

function readBots() {
  const sh = ensureSheet(SHEET_BOTS, BOTS_HEADER);
  return rowsToObjects(sh, BOTS_HEADER).map(stripRow);
}

function stripRow(o) {
  const c = Object.assign({}, o);
  delete c.__row;
  return c;
}

function findUserRow(username) {
  const sh = ensureSheet(SHEET_USERS, USERS_HEADER);
  const objs = rowsToObjects(sh, USERS_HEADER);
  const u = String(username || "")
    .trim()
    .toLowerCase();
  return objs.find((x) => String(x.username).trim().toLowerCase() === u);
}

function findBotRow(botNumber) {
  const sh = ensureSheet(SHEET_BOTS, BOTS_HEADER);
  const objs = rowsToObjects(sh, BOTS_HEADER);
  const n = normalizeNum(botNumber);
  return objs.find((x) => normalizeNum(x.botNumber) === n);
}

function normalizeNum(v) {
  return String(v || "").replace(/[^0-9]/g, "");
}

function todayStr() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
}

function isoNow() {
  return new Date().toISOString();
}

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function isExpired(user) {
  if (!user.expired) return false;
  const perm = ["permanent", "permanen", "-"].includes(
    String(user.expired).toLowerCase()
  );
  if (perm) return false;
  return new Date(user.expired).getTime() < Date.now();
}

/** Auto-hapus akun yang sudah expired dari spreadsheet. */
function purgeExpired() {
  const sh = ensureSheet(SHEET_USERS, USERS_HEADER);
  const objs = rowsToObjects(sh, USERS_HEADER);
  const toDelete = objs.filter((u) => isExpired(u));
  // hapus dari baris terbesar agar indeks tidak bergeser
  toDelete
    .sort((a, b) => b.__row - a.__row)
    .forEach((u) => sh.deleteRow(u.__row));
  return toDelete.length;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/* ------------------------- ACTIONS: USERS ---------------------- */

function apiLogin(b) {
  purgeExpired(); // akun expired otomatis dihapus sebelum login
  const user = findUserRow(b.username);
  if (!user) return { ok: false, error: "Akun tidak ditemukan di database" };
  if (String(user.password) !== String(b.password))
    return { ok: false, error: "Password salah" };
  if (normalizeNum(user.phone) !== normalizeNum(b.phone))
    return { ok: false, error: "Nomor HP tidak cocok dengan database" };
  if (String(user.status).toLowerCase() === "blokir")
    return { ok: false, error: "Akun diblokir. Hubungi developer." };
  return { ok: true, user: stripRow(user) };
}

function apiAddUser(b) {
  const u = b.user || {};
  if (!u.username || !u.password || !u.role)
    return { ok: false, error: "username/password/role wajib diisi" };
  if (findUserRow(u.username))
    return { ok: false, error: "Username sudah terdaftar" };
  const sh = ensureSheet(SHEET_USERS, USERS_HEADER);
  const expired =
    String(u.role).toLowerCase() === "member" ? addDays(30) : "permanent";
  sh.appendRow([
    u.username,
    u.password,
    u.phone || "",
    u.role,
    expired,
    "aktif",
    u.dibuatOleh || "manual",
    todayStr(),
    0,
    isoNow(),
  ]);
  return { ok: true };
}

function apiDeleteUser(b) {
  const u = findUserRow(b.username);
  if (!u) return { ok: false, error: "User tidak ditemukan" };
  ensureSheet(SHEET_USERS, USERS_HEADER).deleteRow(u.__row);
  return { ok: true };
}

function apiChangePassword(b) {
  const u = findUserRow(b.username);
  if (!u) return { ok: false, error: "User tidak ditemukan" };
  if (String(u.password) !== String(b.oldPass))
    return { ok: false, error: "Password lama tidak cocok" };
  ensureSheet(SHEET_USERS, USERS_HEADER)
    .getRange(u.__row, 2)
    .setValue(b.newPass);
  return { ok: true };
}

function apiUpdateUser(b) {
  const u = findUserRow(b.username);
  if (!u) return { ok: false, error: "User tidak ditemukan" };
  const sh = ensureSheet(SHEET_USERS, USERS_HEADER);
  const fields = b.fields || {};
  Object.keys(fields).forEach((k) => {
    const idx = USERS_HEADER.indexOf(k);
    if (idx >= 0) sh.getRange(u.__row, idx + 1).setValue(fields[k]);
  });
  return { ok: true };
}

function apiStats() {
  purgeExpired();
  const users = readUsers();
  const bots = readBots();
  const byRole = {};
  users.forEach((u) => {
    const r = String(u.role || "unknown").toLowerCase();
    byRole[r] = (byRole[r] || 0) + 1;
  });
  const online = bots.filter(
    (x) => String(x.status).toLowerCase() === "online"
  ).length;
  return {
    ok: true,
    stats: {
      totalUsers: users.length,
      totalBots: bots.length,
      botsOnline: online,
      status: online > 0 ? "online" : "offline",
      byRole: byRole,
    },
  };
}

/* ------------------------- ACTIONS: BOTS ----------------------- */

function apiAddBot(b) {
  const x = b.bot || {};
  if (!x.botNumber) return { ok: false, error: "Nomor bot wajib diisi" };
  if (findBotRow(x.botNumber))
    return { ok: false, error: "Nomor bot sudah terdaftar" };
  ensureSheet(SHEET_BOTS, BOTS_HEADER).appendRow([
    normalizeNum(x.botNumber),
    x.botName || "ZerxsBot",
    x.type || "biasa",
    x.status || "offline",
    x.owner || "",
    isoNow(),
  ]);
  return { ok: true };
}

function apiDeleteBot(b) {
  const x = findBotRow(b.botNumber);
  if (!x) return { ok: false, error: "Bot tidak ditemukan" };
  ensureSheet(SHEET_BOTS, BOTS_HEADER).deleteRow(x.__row);
  return { ok: true };
}

function apiUpdateBot(b) {
  const x = findBotRow(b.botNumber);
  if (!x) return { ok: false, error: "Bot tidak ditemukan" };
  const sh = ensureSheet(SHEET_BOTS, BOTS_HEADER);
  const fields = b.fields || {};
  Object.keys(fields).forEach((k) => {
    const idx = BOTS_HEADER.indexOf(k);
    if (idx >= 0) sh.getRange(x.__row, idx + 1).setValue(fields[k]);
  });
  return { ok: true };
}
