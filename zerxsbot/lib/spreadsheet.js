// ============================================================
// lib/spreadsheet.js - Klien Google Spreadsheet via Apps Script
// ============================================================
const axios = require("axios");
const config = require("../config");

const URL_ = () => config.spreadsheet.appsScriptUrl;
const SECRET = () => config.spreadsheet.secret;

/**
 * Kirim request POST ke Apps Script Web App.
 * Tindakan: "login" | "stats" | "list" | "ping"
 */
async function callScript(action, extra = {}) {
  const payload = { action, secret: SECRET(), ...extra };
  try {
    // Apps Script selalu me-redirect ke script.googleusercontent.com
    const res = await axios.post(URL_(), JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 500
    });
    if (typeof res.data === "string") {
      try { return JSON.parse(res.data); } catch (_) { /* lanjut di bawah */ }
    }
    if (res.data && typeof res.data === "object") return res.data;
    return { status: false, message: "Respons tidak valid dari Apps Script" };
  } catch (err) {
    return { status: false, message: "Gagal menghubungi Apps Script: " + err.message };
  }
}

/**
 * Validasi login user. Data harus ADA di Google Spreadsheet (input manual admin).
 * Mengembalikan { ok, message, data }
 */
async function verifyLogin(username, password, nomor) {
  const res = await callScript("login", { username, password, nomor });
  if (res && res.status === true && res.data) {
    return { ok: true, message: res.message || "Login berhasil", data: res.data };
  }
  return { ok: false, message: (res && res.message) || "Login gagal", data: null };
}

/** Statistik global spreadsheet */
async function getStats() {
  const res = await callScript("stats");
  if (res && res.status === true) return { ok: true, data: res.data };
  return { ok: false, message: res.message, data: { total_accounts: 0, total_logins: 0, unique_logged_users: 0 } };
}

/** Cek apakah backend spreadsheet dapat dihubungi */
async function ping() {
  const res = await callScript("ping");
  return !!(res && res.status === true);
}

module.exports = { verifyLogin, getStats, ping, callScript };
