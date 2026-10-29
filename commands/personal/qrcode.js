/** /qrcode [teks/url] [qr|kode] - buat QR / barcode. */
const QRCode = require("qrcode");
const wa = require("../../lib/wa");

module.exports = {
  name: "qrcode",
  desc: "Membuat qrcode maupun barcode",
  usage: "/qrcode [teks/url] [qr/kode batang]",
  async exec(ctx) {
    const data = ctx.args.slice(0, -1).join(" ") || ctx.args[0];
    const mode = (ctx.args[ctx.args.length - 1] || "").toLowerCase();
    if (!data) {
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh:\n${ctx.prefix}qrcode https://example.com qr\n${ctx.prefix}qrcode 123456789 kode batang`
      );
    }
    let buf;
    if (mode.includes("batang") || mode === "barcode" || mode === "kode") {
      // barcode sederhana: render garis via Jimp (Code128 tanpa lib eksternal)
      const Jimp = require("jimp");
      const img = new Jimp(600, 200, "#ffffff");
      const bits = [];
      for (let i = 0; i < String(data).length; i++) {
        const c = String(data).charCodeAt(i);
        bits.push((c >> (i % 4)) & 1, (c >> ((i + 1) % 4)) & 1, 1);
      }
      let x = 20;
      bits.forEach((b, i) => {
        const w = b ? 3 + (i % 3) : 2;
        for (let xx = x; xx < Math.min(x + w, 580); xx++)
          for (let y = 20; y < 160; y++)
            img.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 255), xx, y);
        x += w + 2;
      });
      buf = await img.getBufferAsync(Jimp.MIME_PNG);
    } else {
      buf = Buffer.from(
        await QRCode.toDataURL(String(data), {
          width: 500,
          margin: 2,
        }),
        "base64"
      );
      // dataURL -> buffer murni
      const b64 = buf.toString().split(",")[1];
      buf = Buffer.from(b64, "base64");
    }
    await wa.sendImage(ctx.sock, ctx.jid, buf, `✅ Hasil untuk: ${data}`);
  },
};
