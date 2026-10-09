// ============================================================
// handler/commands.js - Router & eksekutor semua perintah ZerxsBot
// ============================================================
const qrcodeLib = require("qrcode");
const axios = require("axios");
const sharp = require("sharp");
const config = require("../config");
const openrouter = require("../lib/openrouter");
const maker = require("../lib/maker");
const api = require("../lib/api");
const dl = require("../lib/downloader");
const menu = require("../lib/menu");
const pairingState = require("../lib/pairingState");

const PREFIX = config.baileys.prefix;

/** Balas dengan teks */
async function replyText(sock, m, text) {
  await sock.sendMessage(m.chat, {
    text,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: config.botName,
        body: config.watermark,
        sourceUrl: "https://wa.me/" + config.botOwnerNumber
      }
    }
  }, { quoted: m });
}

/** Kirim buffer sebagai stiker */
async function sendSticker(sock, m, buffer) {
  await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
}

/** Ambil media dari pesan yang di-reply */
async function getQuotedMedia(sock, m) {
  const ctx = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo;
  if (!ctx || !ctx.quotedMessage) return null;
  const qm = ctx.quotedMessage;
  const inner = (qm.viewOnceMessage && qm.viewOnceMessage.message) ||
                (qm.viewOnceMessageV2 && qm.viewOnceMessageV2.message) || qm;
  for (const k of ["imageMessage", "videoMessage", "stickerMessage"]) {
    if (inner[k]) {
      const buf = await sock.downloadMediaMessage({ message: inner }, k.replace("Message", ""));
      return { type: k, buffer: buf, message: inner };
    }
  }
  return null;
}

// ------------------- PEMETAAN PERINTAH -------------------
const handlers = {
  // /ai [prompt] - tanya jawab AI
  async ai(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}ai apa itu blockchain?`);
    await replyText(sock, m, "⏳ Menanyakan ke AI...");
    const out = await openrouter.chat(args.join(" "), {
      system: "Kamu adalah ZerxsBot, asisten AI WhatsApp yang membantu. Jawab dalam bahasa yang sama dengan pertanyaan pengguna."
    });
    await replyText(sock, m, out);
  },

  // /coder [perintah] - AI coding
  async coder(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}coder buat fungsi fibonacci dalam javascript`);
    await replyText(sock, m, "⏳ AI sedang menulis kode...");
    const out = await openrouter.chat(args.join(" "), {
      system: "Kamu adalah ZerxsBot-Coder. Tulis kode program bersih, beri penjelasan singkat, gunakan code block markdown."
    });
    await replyText(sock, m, out);
  },

  // /imageai [prompt] - gambar AI
  async imageai(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}imageai kucing astronot di bulan, gaya realistis`);
    await replyText(sock, m, "⏳ Membuat gambar AI...");
    const buf = await openrouter.generateImage(args.join(" "));
    await sock.sendMessage(m.chat, { image: buf, caption: `🖼️ ${config.botName} ImageAI\nPrompt: ${args.join(" ")}` }, { quoted: m });
  },

  // /sticker - reply media jadi stiker
  async sticker(sock, m, args) {
    const media = await getQuotedMedia(sock, m);
    if (!media) return replyText(sock, m, `Reply gambar/video/stiker lalu kirim ${PREFIX}sticker`);
    if (media.type === "videoMessage") {
      const fs = require("fs");
      const input = maker.tmpFile(".mp4");
      fs.writeFileSync(input, media.buffer);
      const webpOut = maker.tmpFile(".webp");
      await maker.runFFmpeg(["-i", input, "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15", "-loop", "0", webpOut]);
      const buf = fs.readFileSync(webpOut);
      fs.unlinkSync(input); fs.unlinkSync(webpOut);
      await sendSticker(sock, m, buf);
    } else {
      const stiker = await maker.makeSticker(media.buffer);
      await sendSticker(sock, m, stiker);
    }
  },

  // /qrcode [teks/url] [qr|barcode]
  async qrcode(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh:\n${PREFIX}qrcode https://example.com qr\n${PREFIX}qrcode 123456 barcode`);
    const mode = (args[args.length - 1] || "").toLowerCase();
    let text = args.join(" ");
    if (mode === "qr" || mode === "barcode") text = args.slice(0, -1).join(" ");
    if (!text) return replyText(sock, m, "Teks/URL tidak boleh kosong.");
    if (mode === "barcode") {
      const res = await axios.get(
        `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(text)}&code=Code128&dpi=96`,
        { responseType: "arraybuffer", timeout: 20000 }
      );
      let img;
      try { img = await sharp(Buffer.from(res.data)).png().toBuffer(); }
      catch (_) { img = Buffer.from(res.data); }
      await sock.sendMessage(m.chat, { image: img, caption: `📊 Barcode (CODE128)\nIsi: ${text}\n${config.watermark}` }, { quoted: m });
    } else {
      const png = await qrcodeLib.toBuffer(text, { width: 500, margin: 2 });
      await sock.sendMessage(m.chat, { image: png, caption: `🔳 QR Code\nIsi: ${text}\n${config.watermark}` }, { quoted: m });
    }
  },

  // /translate [kode1] [teks] [kode2]
  async translate(sock, m, args) {
    if (args.length < 3) return replyText(sock, m, `Contoh: ${PREFIX}translate id halo apa kabar en`);
    const from = args[0].toLowerCase();
    const to = args[args.length - 1].toLowerCase();
    const text = args.slice(1, -1).join(" ");
    const r = await api.translate(text, from, to);
    await replyText(sock, m, `🌐 *HASIL TERJEMAHAN*\nDari (${from}) → Ke (${to})\n\nTeks asli: ${text}\nHasil: ${r.translated}\nDeteksi bahasa: ${r.detectedLang}`);
  },

  // /iqc [teks] - iPhone chat quote sticker
  async iqc(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}iqc halo selamat datang di ZerxsBot`);
    await replyText(sock, m, "⏳ Membuat iPhone Chat Quote...");
    let name = m.pushName || "Pengguna";
    let avatarUrl = null;
    try { avatarUrl = await sock.profilePictureUrl(m.sender, "image"); } catch (_) {}
    const stiker = await maker.iphoneChatQuote(args.join(" "), { username: name, avatarUrl });
    await sendSticker(sock, m, stiker);
  },

  // /brat [teks]
  async brat(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}brat zerxsbot keren`);
    const stiker = await maker.brat(args.join(" "));
    await sendSticker(sock, m, stiker);
  },

  // /bratvid [teks]
  async bratvid(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}bratvid zerxsbot keren`);
    await replyText(sock, m, "⏳ Membuat video Brat animasi...");
    const vid = await maker.bratVideo(args.join(" "));
    await sendSticker(sock, m, vid);
  },

  // /info
  async info(sock, m, args) {
    const s = pairingState.state;
    const uptimeMs = Date.now() - s.stats.startedAt;
    const up = `${Math.floor(uptimeMs / 3600000)}j ${Math.floor((uptimeMs % 3600000) / 60000)}m ${Math.floor((uptimeMs % 60000) / 1000)}d`;
    await replyText(sock, m, menu.infoText({
      status: s.connectionStatus,
      messages: s.stats.messagesReceived,
      commands: s.stats.commandsExecuted,
      uptime: up
    }));
  },

  // /stickertext [teks]
  async stickertext(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}stickertext halo dunia`);
    const stiker = await maker.stickerText(args.join(" "));
    await sendSticker(sock, m, stiker);
  },

  // /meme
  async meme(sock, m, args) {
    const d = await api.randomMeme();
    if (d.nsfw) return replyText(sock, m, "Meme bersifat NSFW, diblokir oleh ZerxsBot.");
    const img = await dl.fetchBuffer(d.url);
    await sock.sendMessage(m.chat, {
      image: img,
      caption: `😂 *MEME RINCI*\n\nJudul: ${d.title}\nSubreddit: r/${d.subreddit}\nOleh: u/${d.author}\nUpvotes: ${d.ups}\nLink: ${d.postLink}\n\n${config.watermark}`
    }, { quoted: m });
  },

  // /nosecret - view once downloader
  async nosecret(sock, m, args) {
    const ctx = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo;
    if (!ctx || !ctx.quotedMessage) return replyText(sock, m, `Reply pesan *sekali lihat* lalu kirim ${PREFIX}nosecret`);
    const qm = ctx.quotedMessage;
    let inner = null;
    for (const t of ["viewOnceMessage", "viewOnceMessageV2"]) {
      if (qm[t]) inner = qm[t].message || qm[t];
    }
    if (!inner) inner = qm;
    const key = Object.keys(inner).find(k => ["imageMessage", "videoMessage"].includes(k));
    if (!key) return replyText(sock, m, "Pesan yang dibalas bukan pesan sekali lihat (view-once).");
    const mediaMsg = inner[key];
    const isVideo = key === "videoMessage";
    const buf = await sock.downloadMediaMessage({ message: inner }, isVideo ? "video" : "image", { timeout: 60000 });
    const caption = `👁️ *Pesan Sekali Lihat berhasil disimpan*\n${mediaMsg.caption || "(tanpa caption)"}\n${config.watermark}`;
    if (isVideo) await sock.sendMessage(m.chat, { video: buf, caption }, { quoted: m });
    else await sock.sendMessage(m.chat, { image: buf, caption }, { quoted: m });
  },

  // /quotes
  async quotes(sock, m, args) {
    const q = await api.randomQuote();
    await replyText(sock, m, `💬 *QUOTES*\n\n"${q.quote}"\n\n— ${q.author} (${q.source})`);
  },

  // /send [pesan] [no tujuan] [jumlah]
  async send(sock, m, args) {
    if (args.length < 3) return replyText(sock, m, `Contoh: ${PREFIX}send halo kak 6281234567890 3`);
    const jumlah = parseInt(args[args.length - 1]);
    const target = args[args.length - 2];
    const pesan = args.slice(0, -2).join(" ");
    if (!Number.isFinite(jumlah) || jumlah < 1 || jumlah > 10) return replyText(sock, m, "Jumlah kirim harus angka 1-10.");
    if (!/^[0-9+]+$/.test(target)) return replyText(sock, m, "Nomor tujuan tidak valid.");
    const jid = target.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    await replyText(sock, m, `📮 Mengirim ${jumlah} pesan ke ${target}...`);
    let ok = 0;
    for (let i = 0; i < jumlah; i++) {
      try {
        await sock.sendMessage(jid, { text: `${pesan}\n\n— dikirim via ${config.botName}` });
        ok++;
        await new Promise(r => setTimeout(r, 1200));
      } catch (e) { break; }
    }
    await replyText(sock, m, `✅ Selesai: ${ok}/${jumlah} pesan terkirim ke ${target}.`);
  },

  // /kurs [matauang1] [matauang2]
  async kurs(sock, m, args) {
    if (args.length < 2) return replyText(sock, m, `Contoh: ${PREFIX}kurs usd idr`);
    const r = await api.kurs(args[0], args[1]);
    await replyText(sock, m, `💱 *KURS ${r.from} → ${r.to}*\n\n1 ${r.from} = ${r.rate.toLocaleString("id-ID", { maximumFractionDigits: 2 })} ${r.to}\n\n${r.examples.join("\n")}\n\nUpdate: ${r.date}\n${config.watermark}`);
  },

  // /menu
  async menu(sock, m, args) {
    await replyText(sock, m, menu.menuText(m.pushName));
  },

  // /hash [MD5|SHA256] [teks]
  async hash(sock, m, args) {
    if (args.length < 2) return replyText(sock, m, `Contoh:\n${PREFIX}hash md5 halozerxs\n${PREFIX}hash sha256 halozerxs`);
    const algo = args[0];
    const text = args.slice(1).join(" ");
    const r = api.hashText(algo, text);
    await replyText(sock, m, `#️⃣ *HASH ${r.algo}*\n\nTeks: ${text}\nHasil: ${r.hash}`);
  },

  // /tutor
  async tutor(sock, m, args) {
    await replyText(sock, m, menu.tutorText());
  },

  // /subdomain [domain]
  async subdomain(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}subdomain example.com`);
    await replyText(sock, m, "⏳ Mengumpulkan subdomain (crt.sh)...");
    const r = await api.subdomains(args[0]);
    const list = r.subdomains.slice(0, 60).map(s => "• " + s).join("\n");
    await replyText(sock, m, `🔎 *SUBDOMAIN ${r.domain}*\nDitemukan ${r.count} subdomain unik (menampilkan ${Math.min(60, r.subdomains.length)}):\n\n${list || "(tidak ada)"}\n\n${config.watermark}`);
  },

  // /whois [domain]
  async whois(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}whois google.com`);
    const r = await api.whois(args[0]);
    await replyText(sock, m, `🗂️ *WHOIS ${r.domain}*\n\nStatus: ${r.status}\nRegistrar: ${r.registrar}\nHandle: ${r.handle}\nNameserver: ${r.nameservers.join(", ") || "-"}\n\nEvent:\n${r.events.map(e => "• " + e).join("\n")}\n\n${config.watermark}`);
  },

  // /ipinfo [alamat IP]
  async ipinfo(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}ipinfo 8.8.8.8`);
    const d = await api.ipinfo(args[0]);
    await replyText(sock, m, `🌍 *IP INFO ${d.query}*\n\nNegara: ${d.country} (${d.countryCode})\nWilayah: ${d.region} ${d.city || ""} ${d.zip || ""}\nISP: ${d.isp}\nOrganisasi: ${d.org}\nAS: ${d.as}\nKoordinat: ${d.lat}, ${d.lon}\nZona waktu: ${d.timezone}\n\n${config.watermark}`);
  },

  // /biner [teks]
  async biner(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}biner halo`);
    const text = args.join(" ");
    const bin = api.toBinary(text);
    await replyText(sock, m, `🔢 *TEKS → BINER*\n\nTeks: ${text}\nBiner: ${bin}`);
  },

  // /ytdown [url] [mp3|mp4]
  async ytdown(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}ytdown https://youtu.be/xxxx mp4`);
    const url = args[0];
    let type = (args[1] || "mp4").toLowerCase();
    if (!["mp3", "mp4"].includes(type)) type = "mp4";
    if (!/youtu\.?be/.test(url)) return replyText(sock, m, "URL harus link YouTube.");
    await replyText(sock, m, `⏳ Mengunduh ${type.toUpperCase()} dari YouTube...`);
    const r = await dl.ytdl(url, type);
    if (type === "mp3") {
      await sock.sendMessage(m.chat, { audio: r.buffer, mimetype: "audio/mpeg", ptt: false, fileName: (r.title || "audio") + ".mp3", caption: `🎵 ${r.title}\n${config.watermark}` }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, { video: r.buffer, caption: `🎬 ${r.title}\nDurasi: ${r.duration}s\n${config.watermark}`, mimetype: "video/mp4" }, { quoted: m });
    }
  },

  // /ttdown [url] [mp3|mp4]
  async ttdown(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}ttdown https://vt.tiktok.com/xxxx mp4`);
    const url = args[0];
    let type = (args[1] || "mp4").toLowerCase();
    if (!["mp3", "mp4"].includes(type)) type = "mp4";
    if (!/tiktok\.com/i.test(url)) return replyText(sock, m, "URL harus link TikTok.");
    await replyText(sock, m, `⏳ Mengunduh ${type.toUpperCase()} dari TikTok...`);
    const r = await dl.ttdl(url, type);
    if (type === "mp3") {
      await sock.sendMessage(m.chat, { audio: r.buffer, mimetype: "audio/mpeg", ptt: false, fileName: "tiktok-audio.mp3", caption: `🎵 ${r.title}\n${config.watermark}` }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, { video: r.buffer, caption: `🎬 ${r.title}\nBy: ${r.author || "-"}\n${config.watermark}`, mimetype: "video/mp4" }, { quoted: m });
    }
  },

  // /pintdown [url]
  async pintdown(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh: ${PREFIX}pintdown https://pin.it/xxxx`);
    const url = args[0];
    if (!/pinterest|pin\.it/i.test(url)) return replyText(sock, m, "URL harus link Pinterest.");
    await replyText(sock, m, "⏳ Mengunduh media Pinterest...");
    const r = await dl.pintdl(url);
    if (r.type === "images") {
      for (const b of r.buffers) {
        await sock.sendMessage(m.chat, { image: b, caption: `📌 Pinterest: ${r.title}\n${config.watermark}` }, { quoted: m });
      }
    } else if (r.type === "video") {
      await sock.sendMessage(m.chat, { video: r.buffer, caption: `📌 Pinterest: ${r.title}\n${config.watermark}` }, { quoted: m });
    } else {
      await sock.sendMessage(m.chat, { image: r.buffer, caption: `📌 Pinterest: ${r.title}\n${config.watermark}` }, { quoted: m });
    }
  }
};

/**
 * Entry point — dipanggil dari index.js saat ada chat teks.
 */
async function handleCommand(sock, m) {
  const text = (m.message && (m.message.conversation ||
    (m.message.extendedTextMessage && m.message.extendedTextMessage.text))) || "";
  if (!text.startsWith(PREFIX)) return false;
  const parts = text.trim().split(/\s+/);
  const cmdRaw = parts[0].slice(PREFIX.length).toLowerCase();
  const args = parts.slice(1);

  // mode decode pada biner: jika arg berupa deretan 0/1
  if (cmdRaw === "biner" && args.length && /^[01\s]+$/.test(args.join(" "))) {
    await replyText(sock, m, `🔤 *BINER → TEKS*\n\nHasil: ${api.fromBinary(args.join(" "))}`);
    pairingState.incrementCommands();
    return true;
  }

  const fn = handlers[cmdRaw];
  if (!fn) {
    await replyText(sock, m, `❓ Perintah tidak dikenal: /${cmdRaw}\nKetik ${PREFIX}menu untuk daftar fitur.`);
    return true;
  }
  try {
    pairingState.incrementCommands();
    await fn(sock, m, args);
  } catch (err) {
    await replyText(sock, m, `⚠️ Terjadi kesalahan:\n${err.message}`);
  }
  return true;
}

module.exports = { handleCommand, replyText, handlers };
