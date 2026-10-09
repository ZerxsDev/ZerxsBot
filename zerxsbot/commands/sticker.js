// /sticker - Reply media (gambar/video/stiker) lalu jadikan stiker
const fs = require("fs");
const config = require("../config");
const maker = require("../lib/maker");
const { replyText, sendSticker, getQuotedMedia } = require("../lib/simple");

module.exports = {
  cmd: "sticker",
  aliases: ["stiker", "s"],
  async handle(sock, m) {
    const media = await getQuotedMedia(sock, m);
    if (!media) return replyText(sock, m, `Reply gambar/video/stiker lalu kirim ${config.baileys.prefix}sticker`);
    if (media.type === "videoMessage") {
      const input = maker.tmpFile(".mp4");
      fs.writeFileSync(input, media.buffer);
      const webpOut = maker.tmpFile(".webp");
      await maker.runFFmpeg(["-i", input, "-vf", "scale=512:512:force_original_aspect_ratio=decrease,fps=15", "-loop", "0", webpOut]);
      const buf = fs.readFileSync(webpOut);
      try { fs.unlinkSync(input); fs.unlinkSync(webpOut); } catch (_) {}
      await sendSticker(sock, m, buf);
    } else {
      const stiker = await maker.makeSticker(media.buffer);
      await sendSticker(sock, m, stiker);
    }
  }
};
