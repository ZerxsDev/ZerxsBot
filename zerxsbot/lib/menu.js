// ============================================================
// lib/menu.js - Teks menu & tutorial ZerxsBot
// ============================================================
const config = require("../config");

const COMMANDS = [
  { cmd: "/ai", use: "/ai [prompt]", desc: "Tanya jawab & minta jawaban kepada AI" },
  { cmd: "/imageai", use: "/imageai [prompt gambar]", desc: "Membuat gambar dari AI" },
  { cmd: "/coder", use: "/coder [perintah kode]", desc: "Membuat kode program dari AI" },
  { cmd: "/sticker", use: "Reply media lalu kirim /sticker", desc: "Membuat stiker dari media yang di-reply" },
  { cmd: "/qrcode", use: "/qrcode [teks/url] [qr|barcode]", desc: "Membuat QR Code atau Barcode" },
  { cmd: "/translate", use: "/translate [kode1] [teks] [kode2]", desc: "Terjemahkan teks antar bahasa" },
  { cmd: "/iqc", use: "/iqc [teks]", desc: "Stiker balon chat tiruan WhatsApp iPhone (dengan foto profil & nama Anda)" },
  { cmd: "/brat", use: "/brat [teks]", desc: "Stiker teks gaya Brat (Charli XCX)" },
  { cmd: "/bratvid", use: "/bratvid [teks]", desc: "Versi animasi bergerak dari stiker Brat" },
  { cmd: "/info", use: "/info", desc: "Info rinci tentang bot" },
  { cmd: "/stickertext", use: "/stickertext [teks]", desc: "Membuat stiker teks" },
  { cmd: "/meme", use: "/meme", desc: "Mendapatkan meme random secara rinci" },
  { cmd: "/nosecret", use: "Reply pesan view-once lalu kirim /nosecret", desc: "Melihat & mengunduh pesan sekali lihat" },
  { cmd: "/quotes", use: "/quotes", desc: "Mendapatkan quotes random" },
  { cmd: "/send", use: "/send [pesan] [nomor] [jumlah]", desc: "Mengirim pesan ke nomor lain lewat bot" },
  { cmd: "/kurs", use: "/kurs [matauang1] [matauang2]", desc: "Nilai tukar mata uang antar negara" },
  { cmd: "/menu", use: "/menu", desc: "Membuka menu bot" },
  { cmd: "/hash", use: "/hash [MD5|SHA256] [teks]", desc: "Mengubah teks menjadi hash" },
  { cmd: "/tutor", use: "/tutor", desc: "Tutorial cara memakai semua perintah bot" },
  { cmd: "/subdomain", use: "/subdomain [domain]", desc: "Information gathering: mencari daftar subdomain aktif" },
  { cmd: "/whois", use: "/whois [domain]", desc: "Cek registrasi, kedaluwarsa & kepemilikan domain" },
  { cmd: "/ipinfo", use: "/ipinfo [alamat IP]", desc: "Geolokasi, ISP, organisasi & koordinat sebuah IP" },
  { cmd: "/biner", use: "/biner [teks]", desc: "Mengubah teks menjadi biner (0/1)" },
  { cmd: "/ytdown", use: "/ytdown [url] [mp3|mp4]", desc: "Download video/audio YouTube" },
  { cmd: "/ttdown", use: "/ttdown [url] [mp3|mp4]", desc: "Download video/audio TikTok" },
  { cmd: "/pintdown", use: "/pintdown [url]", desc: "Download media Pinterest" }
];

function menuText(userName) {
  const lines = COMMANDS.map(c => `_${c.cmd}_ : ${c.desc}`);
  return [
    `╭━━━━━━━━━━━━━━━❖`,
    `┃ 🤖 *${config.botName}* v${config.botVersion}`,
    `┃ Halo @${userName || "Pengguna"}! Daftar fitur bot:`,
    `╰━━━━━━━━━━━━━━━❖`,
    ``,
    ...lines,
    ``,
    `Ketik */tutor* untuk panduan lengkap cara pakai.`,
    config.watermark
  ].join("\n");
}

function tutorText() {
  const blocks = COMMANDS.map(c =>
    `*${c.cmd}*\n   Cara pakai: \`${c.use}\`\n   Fungsi: ${c.desc}`
  );
  return [
    `📖 *TUTORIAL ZERXSBOT*`,
    `Gunakan perintah dengan prefix "/" di chat pribadi bot.`,
    ``,
    ...blocks,
    ``,
    config.watermark
  ].join("\n\n");
}

function infoText(stateInfo) {
  return [
    `ℹ️ *INFO ${config.botName.toUpperCase()}*`,
    ``,
    `🤖 Nama      : ${config.botName}`,
    `📦 Versi     : ${config.botVersion}`,
    `⚙️ Library   : @whiskeysockets/baileys`,
    `🧠 AI System : OpenRouter (${config.openrouter.textModel})`,
    `🌐 Web Panel : http://localhost:${config.web.port} (sistem pairing)`,
    `🗄️ Database  : Google Spreadsheet (Apps Script)`,
    `📜 Prefix    : "${config.baileys.prefix}"`,
    ``,
    `📊 Status    : ${stateInfo.status}`,
    `💬 Pesan masuk : ${stateInfo.messages}`,
    `⚡ Perintah dieksekusi : ${stateInfo.commands}`,
    `⏱️ Uptime    : ${stateInfo.uptime}`,
    ``,
    config.donasiText
  ].join("\n");
}

module.exports = { COMMANDS, menuText, tutorText, infoText };
