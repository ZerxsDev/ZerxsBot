module.exports = {
  name: 'translate', desc: 'Terjemahkan teks antar bahasa', usage: '/translate [kode1] [teks] [kode2]',
  async exec(ctx) {
    const a = ctx.args;
    if (a.length < 3) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}translate id halo apa kabar en` });
    const from = a[0].toLowerCase(), to = a[a.length - 1].toLowerCase();
    const text = a.slice(1, -1).join(' ');
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
      const d = await res.json();
      const out = d?.responseData?.translatedText;
      ctx.sock.sendMessage(ctx.chatId, { text: out ? `🌐 ${from.toUpperCase()} → ${to.toUpperCase()}\n${out}` : '⚠️ Gagal menerjemahkan.' });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};
