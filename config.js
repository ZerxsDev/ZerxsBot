/**
 * ============================================================
 *  ZerxsBot - Konfigurasi Utama
 *  WAJIB: Semua URL/API (Apps Script, OpenRouter) diletakkan
 *  di file ini dan TIDAK PERNAH ditampilkan/diinput di web.
 * ============================================================
 */
module.exports = {
  // ---- Informasi Web & Bot ----
  botName: "ZerxsBot",
  version: "V.1.0.1",
  prefixDefault: "/",
  prefixOwnerAllowed: ["/", ".", "!"],
  prefixDevAllowed: ["/", ".", "!", "#", "?", ">"],

  // ---- Server Web Panel ----
  web: {
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
    sessionSecret: process.env.ZERXS_SECRET || "zerxsbot-secret-ganti-ini",
  },

  // ---- Google Spreadsheet (Database User + Bot) via Apps Script ----
  // Deploy Apps Script (lihat file apps-script/Code.gs) sebagai Web App
  // akses: "Anyone / All users" lalu tempel URL-nya di bawah ini.
  appsScript: {
    url: "https://script.google.com/macros/s/XXXXXXXXXXXX-URL-APPS-SCRIPT-anda/exec",
    key: "ZERXS-INTERNAL-KEY-GANTI-INI", // kunci internal, dikirim di setiap request
  },

  // ---- OpenRouter (AI) ----
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "sk-or-v1-GANTI-DENGAN-API-KEY-OPENROUTER-ANDA",
    modelAi: "deepseek/deepseek-chat", // bot biasa (/ai, /coder, /imageai)
    modelCs: "openai/gpt-4o-mini", // bot CS (business & developer)
    referer: "https://zerxsbot.local",
    title: "ZerxsBot",
  },

  // ---- Kontak Developer / Pembelian ----
  contacts: {
    telegram: "https://t.me/zerxsdev",
    waChannel: "https://whatsapp.com/channel/0029VbDJbtS3bbV24tq9QR1q",
    devNumber: "6281234567890", // nomor developer (untuk perintah khusus bila perlu)
  },

  // ---- Asset Web ----
  assets: {
    welcomeVideo: "/assets/loading.mp4", // letakkan video loading di public/assets/
    favicon: "/assets/logo.png",
  },

  // ---- Aturan Role (benefit, kuota harian, batas bot, command) ----
  roles: {
    member: {
      label: "Member Trial",
      price: 15000,
      trialDays: 30,
      permanent: false,
      dailyQuota: 8,
      maxBots: 1,
      commands: [
        "ai",
        "stickertext",
        "brat",
        "bratvid",
        "iqc",
        "info",
        "menu",
        "tutor",
      ],
      canChangePrefix: false,
      canGroupCommands: false,
      canCsBot: false,
      freeAccountLimit: 0,
      adminPanel: false,
    },
    admin: {
      label: "Admin Permanen",
      price: 30000,
      permanent: true,
      dailyQuota: 16,
      maxBots: 3,
      commands: [
        "ai",
        "stickertext",
        "brat",
        "bratvid",
        "iqc",
        "info",
        "menu",
        "tutor",
        "sticker",
        "quotes",
        "kurs",
        "meme",
        "translate",
      ],
      canChangePrefix: false,
      canGroupCommands: false,
      canCsBot: false,
      freeAccountLimit: 0,
      adminPanel: false,
    },
    partner: {
      label: "Partner Permanen",
      price: 50000,
      permanent: true,
      dailyQuota: 35,
      maxBots: 5,
      commands: [
        "ai",
        "stickertext",
        "brat",
        "bratvid",
        "iqc",
        "info",
        "menu",
        "tutor",
        "sticker",
        "quotes",
        "kurs",
        "meme",
        "translate",
        "coder",
        "imageai",
        "qrcode",
        "send",
        "hash",
        "biner",
      ],
      canChangePrefix: false,
      canGroupCommands: false,
      canCsBot: false,
      freeAccountLimit: 0,
      adminPanel: false,
    },
    owner: {
      label: "Owner Permanen",
      price: 80000,
      permanent: true,
      dailyQuota: 100,
      maxBots: 10,
      commands: ["*"],
      canChangePrefix: true,
      allowedPrefixes: ["/", ".", "!"],
      canGroupCommands: false,
      canCsBot: false,
      freeAccountLimit: 0,
      adminPanel: false,
    },
    business: {
      label: "Business Permanen",
      price: 100000,
      permanent: true,
      dailyQuota: 100,
      maxBots: 20,
      commands: ["*"],
      excludeCommands: [],
      canGroupCommands: false, // role khusus: semua perintah kecuali grup
      canCsBot: true,
      csDailyLimit: 100,
      canChangePrefix: false,
      freeAccountLimit: 0,
      adminPanel: false,
    },
    founder: {
      label: "Founder Permanen",
      price: 110000,
      permanent: true,
      dailyQuota: Infinity,
      maxBots: 100,
      commands: ["*"],
      canChangePrefix: true,
      allowedPrefixes: ["/", ".", "!", "#", "?", ">"],
      canGroupCommands: true,
      canCsBot: true,
      csDailyLimit: 100,
      freeAccountLimit: 5, // 5 akun gratis per minggu
      adminPanel: true,
      adminCreatableRoles: [
        "member",
        "admin",
        "partner",
        "owner",
        "business",
        "founder",
      ],
      adminCanDelete: true,
    },
    developer: {
      label: "Developer",
      price: null, // ROLE KHUSUS - tidak bisa dibeli
      permanent: true,
      dailyQuota: Infinity,
      maxBots: Infinity,
      commands: ["*"],
      canChangePrefix: true,
      allowedPrefixes: ["/", ".", "!", "#", "?", ">"],
      canGroupCommands: true,
      canCsBot: true,
      csDailyLimit: 100,
      freeAccountLimit: Infinity, // unlimited akun gratis
      adminPanel: true,
      adminCreatableRoles: [
        "member",
        "admin",
        "partner",
        "owner",
        "business",
        "founder",
      ],
      adminCanDelete: true,
    },
  },

  // Role yang boleh dibuat lewat panel admin (web)
  adminRoleChoices: [
    "member",
    "admin",
    "partner",
    "owner",
    "business",
    "founder",
  ],

  // ---- Sistem Pairing ----
  pairing: {
    folderSessions: "./sessions",
    qrTtlMs: 45000, // QR diganti tiap 45 detik
    pairingTimeoutSec: 60,
  },

  // ---- Kuota reset jam 00:00 (waktu server) ----
  quotaResetHour: 0,

  // ---- Kata kasar untuk antitoxic ----
  toxicWords: [
    "anjing",
    "babi",
    "bangsat",
    "brengsek",
    "tai",
    "tdg",
    "kontol",
    "memek",
    "jancok",
    "goblok",
    "tolol",
    "asw",
    "ngentod",
    "fuck",
    "shit",
    "bitch",
  ],
};
