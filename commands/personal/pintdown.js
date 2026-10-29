/** /pintdown [url] - unduh gambar Pinterest. */
const axios = require("axios");
const wa = require("../../lib/wa");

module.exports = {
  name: "pintdown",
  desc: "Download gambar dari Pinterest",
  usage: "/pintdown [url]",
  async exec(ctx) {
    const url = ctx.args[0] || "";
    if (!/pinterest\./i.test(url))
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Masukkan link Pinterest yang valid.\nContoh: ${ctx.prefix}pintdown https://pin.it/xxxx`
      );
    await wa.sendText(ctx.sock, ctx.jid, "⬇️ Mengambil gambar Pinterest...");
    const page = await axios.get(url, {
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      maxRedirects: 5,
    });
    const match =
      page.data.match(/"content_url":"([^"]+)"/) ||
      page.data.match(/<meta property="og:image" content="([^"]+)"/);
    if (!match) throw new Error("Gambar tidak ditemukan di halaman tersebut");
    const imgUrl = match[1].replace(/\\u002F/g, "/").replace(/\\?/g, "");
    const img = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 60000 });
    await wa.sendImage(ctx.sock, ctx.jid, Buffer.from(img.data), "📌 Hasil Pinterest");
  },
};
