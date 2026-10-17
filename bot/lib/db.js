/**
 * ZerxsBot - Klien Google Apps Script (database users & bots).
 * Semua URL ada di config.js, tidak pernah dikirim ke web.
 */
const axios = require('axios');
const config = require('../../config');

const USERS = config.appsScript.usersUrl;
const BOTS = config.appsScript.botsUrl;

// Apps Script selalu redirect -> perlu follow redirect (browser default axios ikut)
async function get(url, params = {}) {
  const res = await axios.get(url, { params, timeout: 30000 });
  return res.data;
}
async function post(url, body = {}) {
  // Apps Script menolak content-type json -> pakai text/plain lalu ikuti redirect
  const res = await axios.post(url, JSON.stringify(body), {
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    maxRedirects: 5,
    timeout: 30000,
  });
  return res.data;
}

module.exports = {
  /* ---------- Users ---------- */
  login: (d) => post(USERS, { action: 'login', ...d }),
  getUser: (username) => get(USERS, { action: 'getuser', username }),
  listUsers: () => get(USERS, { action: 'listusers' }),
  globalStats: () => get(USERS, { action: 'globalstats' }),
  createAccount: (d) => post(USERS, { action: 'createaccount', ...d }),
  changePassword: (d) => post(USERS, { action: 'changepassword', ...d }),
  useCommand: (username) => post(USERS, { action: 'usecommand', username }),
  getSettings: (username) => get(USERS, { action: 'getsettings', username }),
  setPrefiks: (d) => post(USERS, { action: 'setprefiks', ...d }),
  setCS: (d) => post(USERS, { action: 'setcs', ...d }),
  deleteExpired: () => get(USERS, { action: 'deleteexpired' }),

  /* ---------- Bots ---------- */
  addBot: (d) => post(BOTS, { action: 'addbot', ...d }),
  delBot: (d) => post(BOTS, { action: 'delbot', ...d }),
  listBots: (owner = '') => get(BOTS, { action: 'listbots', owner }),
  botStats: () => get(BOTS, { action: 'botstats' }),
  setBotStatus: (d) => post(BOTS, { action: 'setstatus', ...d }),
};
