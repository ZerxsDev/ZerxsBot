// ============================================================
// ZerxsBot - Konfigurasi Utama
// SEMUA URL / API KEY WAJIB diletakkan di file ini.
// File ini TIDAK BOLEH ditampilkan / diakses dari web.
// ============================================================

module.exports = {
  // ---------- Identitas Web & Bot ----------
  web: {
    port: process.env.PORT || 3000,
    title: "ZerxsBot",
    secret: process.env.ZX_SECRET || "zerxsbot-secret-change-me", // token session
  },

  bot: {
    name: "ZerxsBot",
    ownerNumber: "6281234567890", // nomor owner (tanpa +, tanpa 0 di depan)
    defaultPrefix: "/",
    maxMultiPrefix: ["/", ".", "!", "#", "?", ">"], // prefix utk owner/developer
    language: "id",
    donasi: "https://t.me/zerxsdev",
  },

  // ---------- Konfigurasi yang HARUS diisi manual di sini ----------
  telegram: {
    url: "https://t.me/zerxsdev",
  },

  // Google Apps Script Web App (deploy "Anyone" / "Executable by anyone")
  // Endpoint menerima POST JSON { action: "...", ... } dan GET ?action=...
  appsScript: {
    url: "GANTI_DENGAN_URL_APPS_SCRIPT_WEB_APP_DISINI",
    // Contoh: "https://script.google.com/macros/s/AKfycbx....../exec"
  },

  // OpenRouter (AI system)
  openrouter: {
    apiKey: "sk-or-v1-GANTI_DENGAN_API_KEY_OPENROUTER_DISINI",
    baseUrl: "https://openrouter.ai/api/v1",
    model: {
      ai: "deepseek/deepseek-chat",          // /ai, /coder, umum
      image: "openai/dall-e-3",              // /imageai (via openrouter proxy bila tersedia)
      cs: "openai/gpt-4o-mini",              // bot CS (business/developer)
    },
  },

  // ---------- Role & Harga ----------
  roles: {
    member:       { label: "Member Trial",     price: 15000,  quota: 8,    maxBots: 1,  expiredDays: 30 },
    permanen:     { label: "Member Permanen",  price: 25000,  quota: 8,    maxBots: 1,  expiredDays: null },
    admin:        { label: "Admin Permanen",   price: 30000,  quota: 16,   maxBots: 3,  expiredDays: null },
    partner:      { label: "Partner Permanen", price: 50000,  quota: 35,   maxBots: 5,  expiredDays: null },
    owner:        { label: "Owner Permanen",   price: 80000,  quota: 100,  maxBots: 10, expiredDays: null },
    business:     { label: "Business Permanen",price: 100000, quota: 100,  maxBots: 20, expiredDays: null },
    developer:    { label: "Developer Permanen", price: 120000, quota: Infinity, maxBots: Infinity, expiredDays: null },
  },

  // Perintah yang diizinkan per role
  commandsByRole: {
    member:    ["ai","stickertext","brat","bratvid","iqc","info","menu","tutor"],
    admin:     ["ai","stickertext","brat","bratvid","iqc","info","menu","tutor","sticker","quotes","kurs","meme","translate"],
    partner:   ["ai","stickertext","brat","bratvid","iqc","info","menu","tutor","sticker","quotes","kurs","meme","translate","coder","imageai","qrcode","send","hash","biner"],
    owner:     ["*"], // seluruh perintah personal
    business:  ["*"], // seluruh perintah personal (tanpa grup)
    developer: ["*"], // seluruh perintah termasuk grup & CS
  },

  groupCommandsAllowedRoles: ["developer"],

  // Limit membuat akun gratis dari menu developer: 8x seminggu
  devAccountLimitPerWeek: 8,

  // Folder penyimpanan sesi baileys
  sessionFolder: "./data/sessions",
};
