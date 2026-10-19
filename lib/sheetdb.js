// Klien Google Apps Script (database spreadsheet) - dipanggil dari server node.js
const config = require('../config');

async function api(action, payload = {}) {
  const url = config.appsScript.url;
  if (!url || url.includes('GANTI_DENGAN')) {
    return { ok: false, message: 'URL Apps Script belum diatur di config.js' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
    });
    // Apps script selalu redirect ke googleusercontent, fetch node18+ mengikuti redirect
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { ok: false, message: 'Respons tidak valid dari apps script: ' + text.slice(0, 200) }; }
  } catch (e) {
    return { ok: false, message: 'Gagal terhubung ke database: ' + e.message };
  }
}

module.exports = { api };
