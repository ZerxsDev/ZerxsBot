/** /ytdown [url] [mp3/mp4] - unduh media YouTube. */
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const wa = require("../../lib/wa");

function yt-dlp() {
  try {
    return require("yt-dlp-exec-bin").path;
  } catch (_) {
    return "yt-dlp";
  }
}

module.exports = {
  name: "ytdown",
  desc: "Download video/audio dari YouTube",
  usage: "/ytdown [url] [mp3/mp4]",
  async exec(ctx) {
    const url = ctx.args[0] || "";
    const fmt = (ctx.args[1] || "mp4").toLowerCase();
    if (!/youtube\.com|youtu\.be/i.test(url))
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Masukkan link YouTube yang valid.\nContoh: ${ctx.prefix}ytdown https://youtu.be/xxxx mp4`
      );
    await wa.sendText(ctx.sock, ctx.jid, "⬇️ Mengunduh dari YouTube...");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zerxs-yt-"));
    const outFile = path.join(tmp, "media." + (fmt === "mp3" ? "mp3" : "mp4"));
    const args =
      fmt === "mp3"
        ? ["-x", "--audio-format", "mp3", "-o", outFile, url]
        : ["-f", "bestvideo+bestaudio/best", "--merge-output-format", "mp4", "-o", outFile, url];
    await new Promise((resolve, reject) => {
      const p = spawn(yt-dlp(), args);
      let err = "";
      p.stderr.on("data", (d) => (err += d));
      p.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error(err.slice(-300) || "yt-dlp gagal"))
      );
      p.on("error", () =>
        reject(new Error("yt-dlp belum terpasang di server. Jalankan: pip install yt-dlp"))
      );
    });
    const buf = fs.readFileSync(outFile);
    if (buf.length > 180 * 1024 * 1024) throw new Error("File terlalu besar (>180MB)");
    if (fmt === "mp3") await wa.sendAudio(ctx.sock, ctx.jid, buf, "audio/mpeg", "ZerxsBot MP3");
    else await wa.sendVideo(ctx.sock, ctx.jid, buf, "🎬 Hasil unduhan YouTube");
    fs.rmSync(tmp, { recursive: true, force: true });
  },
};
