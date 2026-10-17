/**
 * ============================================================
 *  ZERXSBOT - GOOGLE APPS SCRIPT BACKEND (DATABASE)
 *  Salin kode ini ke https://script.google.com lalu Deploy ->
 *  New deployment -> Web app
 *    Execute as : Me
 *    Who has access : Anyone
 *  Tempel URL .../exec ke config.js (usersUrl & botsUrl).
 *
 *  SHEET "Users" header (baris 1):
 *  USERNAME | PHONE | PASSWORD | ROLE | EXPIRED | CREATED_AT | LOGIN_COUNT | USED_COMMANDS | LAST_RESET | PREFIKS | CS_MODE | BUSINESS_NAME | BUSINESS_DESC
 *
 *  ROLE yang diakui: MEMBER, ADMIN, PARTNER, OWNER, DEVELOPER, BUSINESS
 *  (role di sheet ditulis mis. "member permanen", "admin permanen", dst;
 *   sistem memetakan kata pertama menjadi role inti.)
 *
 *  SHEET "Bots" header (baris 1):
 *  NO_BOT | NAMA_BOT | JENIS_BOT | STATUS | OWNER_USERNAME | CREATED_AT | SESSION_ID
 * ============================================================
 */

var SHEET_USERS = 'Users';
var SHEET_BOTS = 'Bots';
var SHEET_LOGS = 'DevLogs'; // log pembuatan akun oleh developer (limit 8/minggu)

function doGet(e) {
  var action = (e.parameter.action || '').toLowerCase();
  try {
    switch (action) {
      case 'ping':        return json({ ok: true, service: 'ZerxsBot DB', time: new Date() });
      case 'getuser':     return json(apiGetUser(e.parameter.username));
      case 'listusers':   return json(apiListUsers());
      case 'globalstats': return json(apiGlobalStats());
      case 'listbots':    return json(apiListBots(e.parameter.owner || ''));
      case 'botstats':    return json(apiBotStats());
      case 'getsettings': return json(apiGetSettings(e.parameter.username));
      case 'deleteexpired': return json(apiDeleteExpired());
      default: return json({ ok: false, error: 'Aksi tidak dikenal: ' + action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (x) { body = {}; }
  var action = (body.action || e.parameter.action || '').toLowerCase();
  try {
    switch (action) {
      case 'login':          return json(apiLogin(body));
      case 'createaccount':  return json(apiCreateAccount(body));
      case 'changepassword': return json(apiChangePassword(body));
      case 'addbot':         return json(apiAddBot(body));
      case 'delbot':         return json(apiDelBot(body));
      case 'setprefiks':     return json(apiSetPrefiks(body));
      case 'setcs':          return json(apiSetCS(body));
      case 'usecommand':     return json(apiUseCommand(body));
      case 'setstatus':      return json(apiSetBotStatus(body));
      default: return json({ ok: false, error: 'Aksi tidak dikenal: ' + action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ==================== UTIL ==================== */
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function usersSheet() {
  var sh = ss().getSheetByName(SHEET_USERS);
  if (!sh) {
    sh = ss().insertSheet(SHEET_USERS);
    sh.appendRow(['USERNAME','PHONE','PASSWORD','ROLE','EXPIRED','CREATED_AT','LOGIN_COUNT','USED_COMMANDS','LAST_RESET','PREFIKS','CS_MODE','BUSINESS_NAME','BUSINESS_DESC']);
  }
  return sh;
}
function botsSheet() {
  var sh = ss().getSheetByName(SHEET_BOTS);
  if (!sh) {
    sh = ss().insertSheet(SHEET_BOTS);
    sh.appendRow(['NO_BOT','NAMA_BOT','JENIS_BOT','STATUS','OWNER_USERNAME','CREATED_AT','SESSION_ID']);
  }
  return sh;
}
function logsSheet() {
  var sh = ss().getSheetByName(SHEET_LOGS);
  if (!sh) sh = ss().insertSheet(SHEET_LOGS);
  return sh;
}
function coreRole(roleStr) {
  var r = String(roleStr || '').toLowerCase();
  if (r.indexOf('developer') === 0) return 'DEVELOPER';
  if (r.indexOf('business') === 0) return 'BUSINESS';
  if (r.indexOf('owner') === 0) return 'OWNER';
  if (r.indexOf('partner') === 0) return 'PARTNER';
  if (r.indexOf('admin') === 0) return 'ADMIN';
  return 'MEMBER';
}
function isExpired(expiredStr) {
  if (!expiredStr) return false;
  var s = String(expiredStr).toUpperCase();
  if (s === 'PERMANEN' || s === 'PERMANENT' || s === '-') return false;
  var d = new Date(expiredStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

/* ==================== AUTH / USERS ==================== */
function findUserRow(username) {
  var sh = usersSheet();
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(username).toLowerCase()) {
      return { index: i, values: data[i] };
    }
  }
  return null;
}

function apiLogin(body) {
  var u = body.username, p = body.password, phone = String(body.phone || '').replace(/[^0-9]/g, '');
  if (!u || !p) return { ok: false, error: 'Username/password wajib diisi.' };
  var row = findUserRow(u);
  // Data harus ADA di spreadsheet (input manual). Jika tidak ada -> gagalkan.
  if (!row) return { ok: false, error: 'Akun tidak ditemukan di database. Hubungi admin untuk membeli akses.' };
  var v = row.values;
  if (String(v[2]) !== String(p)) return { ok: false, error: 'Kata sandi salah.' };
  // nomor HP harus cocok dengan data spreadsheet
  var dbPhone = String(v[1]).replace(/[^0-9]/g, '');
  if (phone && dbPhone && dbPhone !== phone) return { ok: false, error: 'Nomor HP tidak cocok dengan akun.' };
  if (isExpired(v[4])) {
    deleteRow(usersSheet(), row.index + 1);
    return { ok: false, error: 'Akun sudah expired dan telah dihapus dari database. Silakan beli ulang akses.' };
  }
  var sh = usersSheet();
  sh.getRange(row.index + 1, 7).setValue(Number(v[6] || 0) + 1); // login count
  return {
    ok: true,
    user: publicUser(v),
  };
}

function publicUser(v) {
  return {
    username: v[0],
    phone: v[1],
    role: v[3],
    coreRole: coreRole(v[3]),
    expired: v[4] ? String(v[4]) : 'PERMANEN',
    createdAt: v[5] ? String(v[5]) : '',
    loginCount: Number(v[6] || 0),
    usedCommands: Number(v[7] || 0),
    prefiks: v[9] || '/',
    csMode: v[10] === 'ON',
    businessName: v[11] || '',
    businessDesc: v[12] || '',
  };
}

function apiGetUser(username) {
  if (!username) return { ok: false, error: 'username wajib' };
  var row = findUserRow(username);
  if (!row) return { ok: false, error: 'User tidak ditemukan' };
  if (isExpired(row.values[4])) {
    deleteRow(usersSheet(), row.index + 1);
    return { ok: false, error: 'Akun expired dan otomatis dihapus dari database.' };
  }
  return { ok: true, user: publicUser(row.values) };
}

function apiListUsers() {
  var data = usersSheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) out.push(publicUser(data[i]));
  return { ok: true, users: out, total: out.length };
}

function apiGlobalStats() {
  var data = usersSheet().getDataRange().getValues();
  var botData = botsSheet().getDataRange().getValues();
  var online = 0;
  for (var b = 1; b < botData.length; b++) if (String(botData[b][3]).toUpperCase() === 'ONLINE') online++;
  var perRole = {};
  var roles = ['MEMBER','ADMIN','PARTNER','OWNER','DEVELOPER','BUSINESS'];
  roles.forEach(function (r) { perRole[r] = 0; });
  for (var i = 1; i < data.length; i++) {
    var c = coreRole(data[i][3]);
    perRole[c] = (perRole[c] || 0) + 1;
  }
  return {
    ok: true,
    totalUsers: Math.max(0, data.length - 1),
    totalBots: Math.max(0, botData.length - 1),
    onlineBots: online,
    perRole: perRole,
    serverTime: new Date().toISOString(),
  };
}

function apiChangePassword(body) {
  var row = findUserRow(body.username);
  if (!row) return { ok: false, error: 'User tidak ditemukan' };
  if (String(row.values[2]) !== String(body.oldPassword)) return { ok: false, error: 'Kata sandi lama salah.' };
  if (!body.newPassword) return { ok: false, error: 'Kata sandi baru wajib diisi.' };
  usersSheet().getRange(row.index + 1, 3).setValue(String(body.newPassword));
  return { ok: true, message: 'Kata sandi berhasil diubah.' };
}

function apiCreateAccount(body) {
  // Hanya boleh dipanggil oleh sesi developer (server sudah mengecek role).
  var allowedRoles = ['member trial', 'member permanen', 'admin permanen'];
  var role = String(body.role || '').toLowerCase();
  if (allowedRoles.indexOf(role) === -1) return { ok: false, error: 'Role hanya: member trial / member permanen / admin permanen.' };
  if (!body.username || !body.password) return { ok: false, error: 'Username & password wajib diisi.' };
  if (findUserRow(body.username)) return { ok: false, error: 'Username sudah dipakai.' };

  // Limit developer: 8 akun / minggu
  var dev = body.developer || '-';
  var logs = logsSheet();
  var weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  var count = 0;
  var ldata = logs.getDataRange().getValues();
  for (var i = 1; i < ldata.length; i++) {
    if (String(ldata[i][0]) === String(dev) && new Date(ldata[i][2]) > weekAgo) count++;
  }
  if (count >= 8) return { ok: false, error: 'Limit buat akun gratis habis (8x/minggu). Tunggu minggu depan.' };

  var expired = 'PERMANEN';
  if (role === 'member trial') {
    var d = new Date(); d.setDate(d.getDate() + 30);
    expired = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  }
  usersSheet().appendRow([
    body.username, body.phone || '-', body.password, role, expired,
    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
    0, 0, '', '/', 'OFF', '', ''
  ]);
  logs.appendRow([dev, body.username, new Date()]);
  return { ok: true, message: 'Akun ' + body.username + ' berhasil dibuat.' };
}

/* ==================== KUOTA HARIAN ==================== */
function apiUseCommand(body) {
  var row = findUserRow(body.username);
  if (!row) return { ok: false, error: 'User tidak ditemukan' };
  var sh = usersSheet();
  var v = row.values;
  var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  var lastReset = String(v[8] || '');
  var used = Number(v[7] || 0);
  if (lastReset !== today) { used = 0; sh.getRange(row.index + 1, 9).setValue(today); } // reset jam 00.00
  used += 1;
  sh.getRange(row.index + 1, 8).setValue(used);
  return { ok: true, used: used };
}

/* ==================== SETTINGS / PREFIKS / CS ==================== */
function apiGetSettings(username) {
  var row = findUserRow(username);
  if (!row) return { ok: false, error: 'User tidak ditemukan' };
  return { ok: true, settings: publicUser(row.values) };
}
function apiSetPrefiks(body) {
  var row = findUserRow(body.username);
  if (!row) return { ok: false, error: 'User tidak ditemukan' };
  usersSheet().getRange(row.index + 1, 10).setValue(String(body.prefiks || '/'));
  return { ok: true, prefiks: body.prefiks };
}
function apiSetCS(body) {
  var row = findUserRow(body.username);
  if (!row) return { ok: false, error: 'User tidak ditemukan' };
  var sh = usersSheet();
  sh.getRange(row.index + 1, 11).setValue(body.csMode ? 'ON' : 'OFF');
  sh.getRange(row.index + 1, 12).setValue(body.businessName || '');
  sh.getRange(row.index + 1, 13).setValue(body.businessDesc || '');
  return { ok: true };
}

/* ==================== BOTS ==================== */
function apiAddBot(body) {
  var owner = body.owner;
  var no = String(body.noBot || '').replace(/[^0-9]/g, '');
  if (!owner || !no) return { ok: false, error: 'noBot & owner wajib diisi.' };
  var urow = findUserRow(owner);
  if (!urow) return { ok: false, error: 'Owner tidak ditemukan.' };
  var role = coreRole(urow.values[3]);
  var maxMap = { MEMBER: 1, ADMIN: 3, PARTNER: 5, OWNER: 10, BUSINESS: 20, DEVELOPER: 999999 };
  var bsh = botsSheet();
  var bd = bsh.getDataRange().getValues();
  var mine = 0;
  for (var i = 1; i < bd.length; i++) {
    if (String(bd[i][4]).toLowerCase() === String(owner).toLowerCase()) mine++;
    if (String(bd[i][0]) === no) return { ok: false, error: 'Nomor bot sudah terdaftar.' };
  }
  if (mine >= maxMap[role]) return { ok: false, error: 'Kuota maksimal bot role ' + role + ' sudah tercapai (' + maxMap[role] + ').' };
  bsh.appendRow([
    no, body.namaBot || ('Bot-' + no), body.jenis || 'biasa', 'OFFLINE',
    owner, Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
    body.sessionId || no
  ]);
  return { ok: true, message: 'Bot ' + no + ' ditambahkan.' };
}

function apiDelBot(body) {
  var bsh = botsSheet();
  var bd = bsh.getDataRange().getValues();
  var no = String(body.noBot || '').replace(/[^0-9]/g, '');
  for (var i = 1; i < bd.length; i++) {
    if (String(bd[i][0]) === no && String(bd[i][4]).toLowerCase() === String(body.owner || '').toLowerCase()) {
      bsh.deleteRow(i + 1);
      return { ok: true, message: 'Bot dihapus.' };
    }
  }
  return { ok: false, error: 'Bot tidak ditemukan / bukan milik anda.' };
}

function apiListBots(owner) {
  var bd = botsSheet().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < bd.length; i++) {
    if (owner && String(bd[i][4]).toLowerCase() !== String(owner).toLowerCase()) continue;
    out.push({
      noBot: bd[i][0], namaBot: bd[i][1], jenis: bd[i][2],
      status: bd[i][3], owner: bd[i][4], createdAt: String(bd[i][5] || '')
    });
  }
  return { ok: true, bots: out };
}

function apiBotStats() {
  var st = apiGlobalStats();
  return { ok: true, totalBots: st.totalBots, onlineBots: st.onlineBots };
}

function apiSetBotStatus(body) {
  var bsh = botsSheet();
  var bd = bsh.getDataRange().getValues();
  var no = String(body.noBot || '').replace(/[^0-9]/g, '');
  for (var i = 1; i < bd.length; i++) {
    if (String(bd[i][0]) === no) {
      bsh.getRange(i + 1, 4).setValue(body.status || 'OFFLINE');
      return { ok: true };
    }
  }
  return { ok: false, error: 'Bot tidak ditemukan' };
}

/* ==================== AUTO DELETE EXPIRED ==================== */
function apiDeleteExpired() {
  var sh = usersSheet();
  var data = sh.getDataRange().getValues();
  var removed = [];
  for (var i = data.length - 1; i >= 1; i--) {
    if (isExpired(data[i][4])) {
      removed.push(data[i][0]);
      sh.deleteRow(i + 1);
    }
  }
  return { ok: true, removed: removed };
}

function deleteRow(sh, rowNum) { sh.deleteRow(rowNum); }

/* Trigger harian untuk hapus expired otomatis */
function setupTriggers() {
  ScriptApp.newTrigger('apiDeleteExpiredCron').timeBased().everyDays(1).atHour(0).create();
}
function apiDeleteExpiredCron() { apiDeleteExpired(); }
