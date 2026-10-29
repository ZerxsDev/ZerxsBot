/**
 * ZerxsBot - Koneksi database Google Spreadsheet via Apps Script Web App.
 * Semua URL disimpan di config.js (tidak pernah lewat web).
 */
const axios = require("axios");
const config = require("../config");

const client = axios.create({
  baseURL: config.appsScript.url,
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Kirim aksi ke Apps Script.
 * @param {string} action nama aksi (login, listUsers, dst.)
 * @param {object} payload data tambahan
 */
async function api(action, payload = {}) {
  try {
    const res = await client.post("/", {
      action,
      key: config.appsScript.key,
      ...payload,
    });
    const data = res.data || {};
    if (!data.ok) {
      throw new Error(data.error || "Apps Script menolak permintaan");
    }
    return data;
  } catch (err) {
    const msg = err.response
      ? `Apps Script error ${err.response.status}`
      : err.message;
    throw new Error(`Database spreadsheet tidak terjangkau: ${msg}`);
  }
}

/* ------------------------- USERS SHEET ------------------------- */

/** Ambil semua user (header: username,password,phone,role,expired,status,dibuatOleh) */
async function listUsers() {
  const r = await api("listUsers");
  return r.data || [];
}

/** Login: cocokkan username + password + nomor HP dengan spreadsheet. */
async function login(username, phone, password) {
  const r = await api("login", { username, phone, password });
  return r.user || null;
}

/** Tambah akun manual/lewat panel admin. */
async function addUser(user) {
  const r = await api("addUser", { user });
  return r;
}

/** Hapus akun berdasarkan username. */
async function deleteUser(username) {
  return api("deleteUser", { username });
}

/** Ganti password user. */
async function changePassword(username, oldPass, newPass) {
  return api("changePassword", { username, oldPass, newPass });
}

/** Update field arbitrary milik user (quota, status blokir, prefix). */
async function updateUser(username, fields) {
  return api("updateUser", { username, fields });
}

/** Statistik global untuk beranda & panel admin. */
async function stats() {
  const r = await api("stats");
  return r.stats || {};
}

/* ------------------------- BOTS SHEET -------------------------- */

/** Header bots: botNumber,botName,type,status,owner,createdAt */
async function listBots() {
  const r = await api("listBots");
  return r.data || [];
}

async function addBot(bot) {
  return api("addBot", { bot });
}

async function deleteBot(botNumber) {
  return api("deleteBot", { botNumber });
}

async function updateBot(botNumber, fields) {
  return api("updateBot", { botNumber, fields });
}

module.exports = {
  api,
  listUsers,
  login,
  addUser,
  deleteUser,
  changePassword,
  updateUser,
  stats,
  listBots,
  addBot,
  deleteBot,
  updateBot,
};
