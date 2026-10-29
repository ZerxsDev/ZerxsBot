/**
 * ZerxsBot - Handler utama pesan masuk untuk setiap bot aktif.
 * Alur:
 *  1. Bot CS (type=cs): balas TANPA prefiks memakai AI gpt-4o-mini,
 *     limit 100 pesan/hari per customer.
 *  2. Bot biasa: respon jika pesan diawali prefiks role user
 *     (/ . ! # ? >). Prefiks salah/salah perintah -> peringatan + suruh /menu.
 *  3. Cek: user terdaftar di spreadsheet (nomor = kolom phone), tidak expired,
 *     tidak blokir, kuota harian role, hak akses command.
 */
const fs = require("fs");
const path = require("path");
const config = require("../config");
const db = require("./db");
const roles = require("./roles");
const store = require("./store");
const wa = require("./wa");

const DATA_USERS = path.join(__dirname, "..", "data", "users.json");
const DATA_BOTS = path.join(__dirname, "..", "data", "bots.json");

/* Cache spreadsheet ke file JSON agar bot tetap jalan saat internet DB lambat. */
async function refreshCache() {
  try {
    const users = await db.listUsers();
    fs.writeFileSync(DATA_USERS, JSON.stringify(users, null, 2));
  } catch (_) {}
  try {
    const bots = await db.listBots();
    fs.writeFileSync(DATA_BOTS, JSON.stringify(bots, null, 2));
  } catch (_) {}
}

function readCache(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {
    return [];
  }
}

function findUser(phone) {
  const users = readCache(DATA_USERS);
  const clean = String(phone).replace(/[^0-9]/g, "");
  const alt = clean.startsWith("62") ? clean.slice(2) : "62" + clean;
  return (
    users.find((u) => {
      const p = String(u.phone || "").replace(/[^0-9]/g, "");
      if (!p) return false;
      return p === clean || p === alt;
    }) || null
  );
}

function findBotMeta(botNumber) {
  const bots = readCache(DATA_BOTS);
  const clean = String(botNumber).replace(/[^0-9]/g, "");
  return (
    bots.find((b) => String(b.botNumber).replace(/[^0-9]/g, "") === clean) ||
    null
  );
}

/** Menu bantuan. */
function buildMenu(role, prefix) {
  const list = roles.getAllCommands();
  const allowed = list.filter((c) => roles.canUseCommand(role, c.name));
  const personal = allowed.filter((c) => c.category === "personal");
  const group = allowed.filter((c) => c.category === "group");
  let txt = `╭━━━『 *${config.botName} ${config.version}* 』━━━╮\n`;
  txt += `┃ Role: *${roles.roleLabel(role)}*\n┃ Prefix: *${prefix}*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
  txt += `*— Perintah Personal —*\n`;
  personal.forEach((c) => (txt += `• ${c.usage.replace("/", prefix)}\n`));
  if (group.length) {
    txt += `\n*— Perintah Grup —*\n`;
    group.forEach((c) => (txt += `• ${c.usage.replace("/", prefix)}\n`));
  }
  txt += `\nKetik ${prefix}tutor untuk cara pakai.\nSaluran: ${config.contacts.waChannel}`;
  return txt;
}

/** Balasan default bot CS bila sapaan singkat. */
function csGreeting() {
  const h = new Date().getHours();
  const w =
    h >= 4 && h < 11 ? "Pagi" : h >= 11 && h < 15 ? "Siang" : h >= 15 && h < 18 ? "Sore" : "Malam";
  return `Selamat ${w} Kak 🙏, ada yang bisa kami bantu?`;
}

const GREET_RE = /^(p|halo|hai|hi|hello|assalamualaikum|slmt|pagi|siang|sore|malam|bang|kak|gan|sis|min|otw|maaf|permisi)/i;

/**
 * Handler messages.upsert.
 * @param {object} sock Baileys socket
 * @param {object} bot state bot dari botManager
 * @param {object} m payload messages.upsert
 */
async function handler(sock, bot, m) {
  if (!m || m.type !== "notify") return;
  for (const msg of m.messages || []) {
    try {
      await processOne(sock, bot, msg);
    } catch (err) {
      console.error("[zerxs] proses pesan gagal:", err.message);
    }
  }
}

async function processOne(sock, bot, msg) {
  const key = msg.key || {};
  if (key.fromMe) return; // abaikan pesan sendiri
  const jid = key.remoteJid;
  if (!jid || jid === "status@broadcast" || /@newsletter/.test(jid)) return;

  // Pelindung grup: antilink / antitoxic / mute / filter
  try {
    const guard = require("./guard");
    const handled = await guard(sock, msg);
    if (handled) return;
  } catch (_) {}

  const text = extractText(msg);
  const sender = wa.senderNumber(msg);
  const botMeta = findBotMeta(bot.botNumber) || {
    type: bot.type,
    botName: bot.botName,
    owner: bot.owner,
  };
  const isCs = String(botMeta.type || bot.type).toLowerCase() === "cs";

  /* ==================== BOT CS (tanpa prefiks) ==================== */
  if (isCs) {
    const biz = parseBizConfig(botMeta);
    if (!text) return; // CS hanya teks
    const quota = store.csUse(sender);
    if (!quota.allowed) {
      await wa.sendText(
        sock,
        jid,
        "Maaf Kak, batas layanan 100 pesan hari ini sudah tercapai. Kami bantu kembali besok hari ya 🙏"
      );
      return;
    }
    const history = store.csHistory(sender);
    if (GREET_RE.test(text.trim()) && text.trim().length <= 12) {
      const greet = csGreeting();
      store.csPush(sender, "user", text);
      store.csPush(sender, "assistant", greet);
      await wa.sendText(sock, jid, greet);
      return;
    }
    await wa.sendText(sock, jid, "⏳ Menunggu balasan...");
    try {
      const ai = require("./ai");
      const answer = await ai.askCS(biz, history, text);
      store.csPush(sender, "user", text);
      store.csPush(sender, "assistant", answer);
      await wa.sendText(sock, jid, answer);
    } catch (err) {
      await wa.sendText(
        sock,
        jid,
        "Mohon maaf Kak, sistem kami sedang gangguan. Silakan coba lagi sebentar ya 🙏"
      );
      void err;
    }
    return;
  }

  /* ==================== BOT BIASA (prefiks) ====================== */
  const user = findUser(sender);
  if (!user) {
    await wa.sendText(
      sock,
      jid,
      `⛔ Nomor kamu *tidak terdaftar* sebagai pengguna ${config.botName}.\n` +
        `Silakan login & daftar akses lewat web panel, atau beli akses: ${config.contacts.telegram}`
    );
    return;
  }
  if (String(user.status).toLowerCase() === "blokir") {
    await wa.sendText(
      sock,
      jid,
      "⛔ Akun kamu diblokir oleh developer karena pelanggaran peraturan bot."
    );
    return;
  }
  if (roles.isExpired(user.expired)) {
    await wa.sendText(
      sock,
      jid,
      `⛔ Akses ${config.botName} kamu sudah *expired*. Perpanjang via ${config.contacts.telegram}`
    );
    // penghapusan permanen dilakukan Apps Script saat stats/login berikutnya
    db.stats().catch(() => {});
    return;
  }

  const role = String(user.role || "member").toLowerCase();
  const allowedPrefixes = roles.validPrefixes(role);
  const custom = store.getPrefix(sender);
  if (allowedPrefixes.includes(custom)) allowedPrefixes.unshift(custom);

  if (!text) return;
  const firstChar = text.trim()[0];
  const usedPrefix = allowedPrefixes.includes(firstChar) ? firstChar : null;

  if (!usedPrefix) {
    // Tidak ada prefiks pada bot biasa -> peringatan
    await wa.sendText(
      sock,
      jid,
      `⚠️ Pesan harus diawali *prefiks* perintah.\nContoh: ${config.prefixDefault}menu\n\nGunakan ${config.prefixDefault}menu untuk melihat daftar perintah.`
    );
    return;
  }

  const body = text.trim().slice(1);
  const [cmdRaw, ...argArr] = body.split(/\s+/);
  const cmd = (cmdRaw || "").toLowerCase();

  const loader = require("./commandLoader");
  const mod = cmd ? loader.get("personal", cmd) || loader.get("group", cmd) : null;

  if (!mod) {
    await wa.sendText(
      sock,
      jid,
      `❌ *Perintah salah:* ${usedPrefix}${cmd || "(kosong)"}\n\n` +
        `Bot hanya merespon perintah dengan prefiks ${allowedPrefixes.join(" ")}.\n` +
        `Silakan ketik ${usedPrefix}menu untuk melihat semua perintah yang tersedia.`
    );
    return;
  }

  // Hak akses role terhadap command
  if (!roles.canUseCommand(role, cmd)) {
    await wa.sendText(
      sock,
      jid,
      `🔒 Perintah *${usedPrefix}${cmd}* tidak tersedia untuk role *${roles.roleLabel(role)}*.\nUpgrade akses: ${config.contacts.telegram}`
    );
    return;
  }

  // Perintah grup butuh admin untuk yang bersifat admin-only
  const isAdminOnly = [
    "add",
    "antilink",
    "antitoxic",
    "pin",
    "kick",
    "welcome",
    "mute",
    "unmute",
    "filter",
    "unfilter",
    "tagall",
    "tag",
    "rules",
    "listfilter",
    "showfilter",
  ].includes(cmd);
  if (isAdminOnly && wa.isGroup(jid)) {
    const ok = await ensureAdmin(sock, jid, sender);
    if (!ok) {
      await wa.sendText(
        sock,
        jid,
        "⛔ Perintah ini khusus *admin grup*."
      );
      return;
    }
  }

  // Kuota harian (hanya dihitung untuk perintah yang memakai AI/output)
  const quotaFree = ["menu", "info", "tutor"];
  const dailyQuota = roles.getRole(role).dailyQuota;
  if (!quotaFree.includes(cmd) && Number.isFinite(dailyQuota)) {
    const used = store.useQuota(sender);
    if (used > dailyQuota) {
      await wa.sendText(
        sock,
        jid,
        `📊 *LIMIT HABIS.*\nKuota harian role ${roles.roleLabel(role)} (${dailyQuota}x chat) sudah terpakai semua.\nLimit akan direset besok jam 00.00.`
      );
      return;
    }
  }

  const ctx = {
    sock,
    bot,
    msg,
    jid,
    sender,
    user,
    role,
    prefix: usedPrefix,
    args: argArr,
    text: argArr.join(" "),
    quotedMsg: msg,
    isGroup: wa.isGroup(jid),
    buildMenu: () => buildMenu(role, usedPrefix),
  };

  try {
    await mod.exec(ctx);
  } catch (err) {
    console.error(`[zerxs] command ${cmd} error:`, err.message);
    await wa.sendText(
      sock,
      jid,
      `❌ Terjadi kesalahan saat menjalankan ${usedPrefix}${cmd}: ${err.message}`
    );
  }
}

async function ensureAdmin(sock, groupId, senderNumber) {
  try {
    const meta = await sock.groupMetadata(groupId);
    const participant = meta.participants.find(
      (p) => p.id.split("@")[0] === senderNumber
    );
    if (participant && participant.admin) return true;
    // bot harus admin juga untuk aksi tertentu; cek terpisah di command
    return false;
  } catch (_) {
    return false;
  }
}

function extractText(msg) {
  const m = msg.message || {};
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage && m.extendedTextMessage.text)
    return m.extendedTextMessage.text;
  if (m.imageMessage && m.imageMessage.caption) return m.imageMessage.caption;
  if (m.videoMessage && m.videoMessage.caption) return m.videoMessage.caption;
  return "";
}

function parseBizConfig(botMeta) {
  // botName berisi nama bisnis; deskripsi/produk dapat disimpan di kolom status
  // format opsional: "CS | nama=Warung Kopi | desc=... | produk=Espresso:15000,Kopi Susu:12000"
  const raw = String(botMeta.botName || "Bisnis");
  const out = { nama: raw, deskripsi: "", produk: [], promptCustom: "" };
  try {
    const parts = raw.split("|").map((s) => s.trim());
    parts.forEach((p) => {
      if (p.startsWith("nama=")) out.nama = p.slice(5);
      else if (p.startsWith("desc=")) out.deskripsi = p.slice(5);
      else if (p.startsWith("produk="))
        out.produk = p
          .slice(7)
          .split(",")
          .map((x) => {
            const [n, h] = x.split(":");
            return { nama: (n || "").trim(), harga: (h || "-").trim() };
          });
      else if (p.startsWith("prompt=")) out.promptCustom = p.slice(7);
      else if (!raw.includes("=") && parts.length === 1) out.nama = raw;
    });
  } catch (_) {}
  return out;
}

module.exports = handler;
module.exports.refreshCache = refreshCache;
module.exports.buildMenu = buildMenu;
module.exports.findUser = findUser;
