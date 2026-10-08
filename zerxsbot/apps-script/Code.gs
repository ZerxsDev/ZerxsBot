// ============================================================
// ZERXSBOT - GOOGLE APPS SCRIPT (Backend Google Spreadsheet)
// ============================================================
// CARA PAKAI:
// 1. Buka https://sheets.google.com -> buat spreadsheet baru
// 2. Extensions -> Apps Script -> hapus isi default, paste kode ini
// 3. Buat sheet dengan nama "Users" dengan header kolom A-G:
//    username | password | nomor | nama_profil | expired | login_count | last_login
//    Contoh baris data (ditambah MANUAL oleh admin):
//    zerxs    | rahasia123 | 6281234567890 | Zerxs     | 2026-12-31 | 0 |
// 4. Deploy -> New deployment -> Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Salin URL /exec ke config.js pada zerxsbot/spreadsheet/appsScriptUrl
// ============================================================

const SHEET_NAME = "Users";
// Secret harus SAMA dengan config.js -> spreadsheet.secret
const SHARED_SECRET = "zerxsbot-spreadsheet-secret-ganti-ini";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let params = {};
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    const action = params.action || "ping";
    const secret = params.secret || "";

    if (secret !== SHARED_SECRET) {
      return json({ status: false, message: "Unauthorized: secret salah" });
    }

    switch (action) {
      case "login":
        return doLogin(params);
      case "stats":
        return doStats();
      case "list":
        return doList();
      case "ping":
      default:
        return json({ status: true, message: "ZerxsBot Apps Script aktif", time: new Date().toISOString() });
    }
  } catch (err) {
    return json({ status: false, message: "Error: " + err.message });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["username", "password", "nomor", "nama_profil", "expired", "login_count", "last_login"]);
  }
  return sheet;
}

/**
 * Validasi login: username+password+nomor HARUS ada di spreadsheet.
 * Data user hanya bisa ditambah manual oleh admin di spreadsheet.
 */
function doLogin(params) {
  const username = String(params.username || "").trim();
  const password = String(params.password || "").trim();
  const nomor = normalizeNomor(params.nomor || "");

  if (!username || !password || !nomor) {
    return json({ status: false, message: "Username, password, dan nomor wajib diisi" });
  }

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const u = String(row[0]).trim();
    const p = String(row[1]).trim();
    const n = normalizeNomor(String(row[2]));

    if (u === username && p === password && n === nomor) {
      // update login count & last login
      let count = Number(row[5]) || 0;
      count += 1;
      sheet.getRange(r + 1, 6).setValue(count);
      sheet.getRange(r + 1, 7).setValue(new Date());

      return json({
        status: true,
        message: "Login berhasil",
        data: {
          username: u,
          nomor: n,
          nama_profil: String(row[3] || u).trim(),
          expired: String(row[4] || "").trim(),
          login_count: count
        }
      });
    }
  }

  // tidak ditemukan -> GAGALKAN login
  return json({ status: false, message: "Login gagal: data tidak ditemukan atau salah di Google Spreadsheet" });
}

/**
 * Statistik global: jumlah akun & total login
 */
function doStats() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  let totalAccounts = 0;
  let totalLogins = 0;
  let uniqueLoggedUsers = 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!String(row[0]).trim()) continue;
    totalAccounts++;
    const c = Number(row[5]) || 0;
    totalLogins += c;
    if (c > 0) uniqueLoggedUsers++;
  }

  return json({
    status: true,
    data: {
      total_accounts: totalAccounts,
      total_logins: totalLogins,
      unique_logged_users: uniqueLoggedUsers
    }
  });
}

function doList() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!String(row[0]).trim()) continue;
    users.push({
      username: row[0],
      nomor: row[2],
      nama_profil: row[3],
      expired: row[4]
    });
  }
  return json({ status: true, data: users });
}

function normalizeNomor(n) {
  n = String(n).replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.substring(1);
  return n;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
