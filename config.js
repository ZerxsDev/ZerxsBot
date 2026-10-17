/**
 * ============================================================
 *  ZERXSBOT - KONFIGURASI UTAMA
 *  Semua URL API / Apps Script / OpenRouter WAJIB di sini.
 *  DILARANG menampilkan nilai ini ke web (hanya dipakai server).
 * ============================================================
 */
module.exports = {
  /* ================= WEB SERVER ================= */
  web: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    sessionSecret: 'ZerxsBot-Secret-Change-Me-2026',
    siteName: 'ZerxsBot',
    siteTagline: 'WhatsApp Bot Multi Device dengan sistem pairing & manajemen akun berbasis Google Spreadsheet.',
  },

  /* ================= GOOGLE APPS SCRIPT (DATABASE) =================
   * Deploy Web App (Execute as: Me, Who has access: Anyone)
   * Endpoint yang tersedia (lihat file apps-script/Code.gs):
   *   ?action=login            (POST json)
   *   ?action=getuser          (GET username)
   *   ?action=listusers        (GET)
   *   ?action=globalstats      (GET)
   *   ?action=createaccount    (POST, khusus developer)
   *   ?action=changepassword   (POST)
   *   ?action=deleteexpired    (GET)
   *   ?action=addbot           (POST)
   *   ?action=delbot           (POST)
   *   ?action=listbots         (GET)
   *   ?action=setprefiks       (POST)
   *   ?action=getsettings      (GET username)
   */
  appsScript: {
    // Users database (username, phone, password, role, expired)
    usersUrl: 'https://script.google.com/macros/s/AKfycbXXXXXXXXUSERS_DEPLOY_ID/exec',
    // Bot database (no_bot, nama_bot, jenis_bot, status, owner)
    botsUrl: 'https://script.google.com/macros/s/AKfycbXXXXXXXXBOTS_DEPLOY_ID/exec',
  },

  /* ================= OPENROUTER (AI SYSTEM) ================= */
  openrouter: {
    apiKey: 'sk-or-v1-XXXXXXXXGANTI_DENGAN_API_KEY_OPENROUTER',
    baseUrl: 'https://openrouter.ai/api/v1',
    // Bot biasa -> DeepSeek
    mainModel: 'deepseek/deepseek-chat',
    // Bot CS (business/developer) -> GPT-4o mini
    csModel: 'openai/gpt-4o-mini',
    // Image generation (melalui model image openrouter)
    imageModel: 'stabilityai/stable-diffusion-3',
  },

  /* ================= BOT WHATSAPP ================= */
  bot: {
    name: 'ZerxsBot',
    author: 'ZerxsDev',
    version: '1.0.0',
    prefixDefault: '/',
    // prefiks yang boleh diganti sesuai role (lihat ROLE_LIMITS di lib/roles.js)
    telegram: 'https://t.me/zerxsdev',
    donasiText: 'Silakan hubungi admin untuk membeli akses bot.',
    // folder session bailey per nomor bot
    sessionDir: './data/sessions',
    // media sementara
    tmpDir: './data/tmp',
    // interval pengecekan akun expired (auto delete dari spreadsheet)
    expireCheckIntervalMs: 60 * 60 * 1000, // 1 jam
    // limit pembuatan akun gratis oleh developer: 8x / minggu
    devAccountLimitPerWeek: 8,
  },

  /* ================= DATA KONTAK / SOSIAL ================= */
  social: {
    telegram: 'https://t.me/zerxsdev',
    github: 'https://github.com/zerxsdev',
  },

  /* ================= ROLE & HARGA ================= */
  roles: {
    'member trial':     { price: 15000,  durationDays: 30, label: 'Member Trial' },
    'member permanen':  { price: 25000,  durationDays: null, label: 'Member Permanen' },
    'admin permanen':   { price: 30000,  durationDays: null, label: 'Admin Permanen' },
    'partner permanen': { price: 50000,  durationDays: null, label: 'Partner Permanen' },
    'owner permanen':   { price: 80000,  durationDays: null, label: 'Owner Permanen' },
    'business permanen':{ price: 100000, durationDays: null, label: 'Business Permanen' },
    'developer permanen': { price: 120000, durationDays: null, label: 'Developer Permanen' },
  },

  /* ================= MANFAAT ROLE (dipakai web & bot) ================= */
  roleBenefits: {
    member:     { quota: 8,   maxBots: 1,  commands: ['/ai','/stickertext','/brat','/bratvid','/iqc','/info','/menu','/tutor'], prefiks: ['/'] },
    admin:      { quota: 16,  maxBots: 3,  commands: ['/ai','/stickertext','/brat','/bratvid','/iqc','/info','/menu','/tutor','/sticker','/quotes','/kurs','/meme','/translate'], prefiks: ['/'] },
    partner:    { quota: 35,  maxBots: 5,  commands: ['/ai','/stickertext','/brat','/bratvid','/iqc','/info','/menu','/tutor','/sticker','/quotes','/kurs','/meme','/translate','/coder','/imageai','/qrcode','/send','/hash','/biner'], prefiks: ['/'] },
    owner:      { quota: 100, maxBots: 10, commands: ['ALL'], prefiks: ['/', '.', '!'] },
    business:   { quota: Infinity, maxBots: 20, commands: ['ALL_EXCEPT_GROUP'], prefiks: ['/', '.', '!'], cs: true },
    developer:  { quota: Infinity, maxBots: Infinity, commands: ['ALL'], prefiks: ['/', '.', '!', '#', '?', '>'], group: true, cs: true, devPanel: true },
  },

  /* ================= KATA KASAR (antitoxic) ================= */
  toxicWords: ['anjing','babi','monyet','bangsat','brengsek','tolol','idiot','goblok','asu','kontol','memek','tai','sampah','bodoh'],

  /* ================= LAIN-LAIN ================= */
  api: {
    // endpoint publik pihak ketiga (aman ditampilkan, bukan secret)
    qr: 'https://api.qrserver.com/v1/create-qr-code/',
    barcode: 'https://barcode.tec-it.com/barcode.ashx',
    exchangeRate: 'https://api.exchangerate-api.com/v4/latest/',
    whois: 'https://radarwhois.com/domain/',
    ipApi: 'http://ip-api.com/json/',
    subdomainApi: 'https://crt.sh/?q=',
    quotesApi: 'https://zenquotes.io/api/random',
    memeApi: 'https://meme-api.com/gimme/memes',
    ytdlHint: 'Gunakan layanan pihak ketiga (mis. cobalt/dl-faster) — lihat file command masing-masing.',
  },
};
