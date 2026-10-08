// ============================================================
// KONFIGURASI ZERXSBOT
// WhatsApp Bot - Node.js + @whiskeysockets/baileys
// ============================================================

const config = {
  // ---------- IDENTITAS BOT ----------
  botName: "ZerxsBot",
  botOwnerNumber: "6281234567890", // nomor owner (untuk perintah admin, tanpa tanda + / spasi)
  botVersion: "1.0.0",
  language: "id",

  // ---------- AI SYSTEM (OPENROUTER) ----------
  // Daftar API key bisa lebih dari satu (dipilih bergantian / rotasi)
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeys: [
      "sk-or-v1-GANTI_DENGAN_API_KEY_OPENROUTER_ANDA"
    ],
    // Model teks (untuk /ai dan /coder)
    textModel: "meta-llama/llama-3.1-8b-instruct",
    // Model gambar (untuk /imageai) - model yang mendukung image generation di OpenRouter
    imageModel: "stabilityai/stable-diffusion-3-medium",
    referer: "https://zerxsbot.local",
    title: "ZerxsBot"
  },

  // ---------- WEBSITE / PAIRING SERVER ----------
  web: {
    port: 3000,
    host: "0.0.0.0",
    sessionSecret: "zerxsbot-secret-key-ganti-yang-acak",
    title: "ZerxsBot - Pairing Panel",
    faviconEmoji: "🤖"
  },

  // ---------- GOOGLE SPREADSHEET (via Apps Script Web App) ----------
  // Deploy Apps Script (lihat file apps-script/Code.gs) sebagai Web App
  // dengan akses "Anyone" lalu salin URL /exec ke sini.
  spreadsheet: {
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbx_GANTI_DENGAN_URL_APPS_SCRIPT_ANDA/exec",
    // token rahasia sederhana untuk melindungi endpoint (harus sama dengan di Apps Script)
    secret: "zerxsbot-spreadsheet-secret-ganti-ini",
    sheetName: "Users"
  },

  // ---------- BAILEYS SESSION ----------
  baileys: {
    sessionFolder: "./sessions",
    // prefix perintah bot
    prefix: "/"
  },

  // ---------- MEDIA / DOWNLOAD ----------
  media: {
    tmpFolder: "./tmp",
    maxMediaSizeMB: 50
  },

  // ---------- Teks tampilan ----------
  watermark: "© ZerxsBot",
  donasiText: "Donasi: hubungi owner ZerxsBot"
};

module.exports = config;
