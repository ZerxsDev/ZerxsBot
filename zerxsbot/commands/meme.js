// /meme - Meme random secara rinci (judul, subreddit, author, upvotes)
const config = require("../config");
const api = require("../lib/api");
const dl = require("../lib/downloader");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "meme",
  async handle(sock, m) {
    const d = await api.randomMeme();
    if (d.nsfw) return replyText(sock, m, "Meme bersifat NSFW, diblokir oleh ZerxsBot.");
    const img = await dl.fetchBuffer(d.url);
    await sock.sendMessage(m.chat, {
      image: img,
      caption: `😂 *MEME RINCI*\n\nJudul: ${d.title}\nSubreddit: r/${d.subreddit}\nOleh: u/${d.author}\nUpvotes: ${d.ups}\nLink: ${d.postLink}\n\n${config.watermark}`
    }, { quoted: m });
  }
};
