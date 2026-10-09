// /qrcode [teks/url] [qr|barcode] - Membuat QR Code atau Barcode
const axios = require("axios");
const sharp = require("sharp");
const qrcodeLib = require("qrcode");
const config = require("../config");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "qrcode",
  aliases: ["qr"],
  async handle(sock, m, args) {
    if (!args.length) return replyText(sock, m, `Contoh:\n${config.baileys.prefix}qrcode https://example.com qr\n${config.baileys.prefix}qrcode 123456 barcode`);
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
  }
};
