/** /ttdown [url] [mp3/mp4] - unduh media TikTok. */
const axios = require("axios");
const wa = require("../../lib/wa");

module.exports = {
  name: "ttdown",
  desc: "Download video/audio dari TikTok",
  usage: "/ttdown [url] [mp3/mp4]",
  async exec(ctx) {
    const url = ctx.args[0] || "";
    const fmt = (ctx.args[1] || "mp4").toLowerCase();
    if (!/tiktok\.com/i.test(url))
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Masukkan link TikTok yang valid.\nContoh: ${ctx.prefix}ttdown https://vt.tiktok.com/xxxx mp4`
      );
    await wa.sendText(ctx.sock, ctx.jid, "⬇️ Memproses TikTok...");
    // API publik tikwm.com (tanpa key wajib)
    const { data } = await axios.get("https://www.tikwm.com/api/", {
      params: { url, hd: 1 },
      timeout: 30000,
    });
    const d = data && data.data;
    if (!d || !d.play) throw new Error("Gagal mengambil media TikTok");
    const mediaUrl = fmt === "mp3" ? d.music : d.hdplay || d.play;
    const res = await axios.get(mediaUrl, { responseType: "arraybuffer", timeout: 60000 });
    const buf = Buffer.from(res.data);
    if (fmt === "mp3") await wa.sendAudio(ctx.sock, ctx.jid, buf, "audio/mpeg", d.title || "TikTok MP3");
    else await wa.sendVideo(ctx.sock, ctx.jid, buf, `🎬 ${d.title || "TikTok"}`);
  },
};
