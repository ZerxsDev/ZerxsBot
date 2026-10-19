module.exports = {
  name: 'kurs', desc: 'Nilai tukar mata uang', usage: '/kurs [matauang1] [matauang2]',
  async exec(ctx) {
    const a = ctx.args.map(x => x.toUpperCase());
    if (a.length < 2) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}kurs IDR USD` });
    try {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${a[0]}`);
      const d = await res.json();
      const rate = d?.rates?.[a[1]];
      if (!rate) return ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Mata uang tidak ditemukan.' });
      await ctx.sock.sendMessage(ctx.chatId, { text: `💱 Kurs ${a[0]} → ${a[1]}\n1 ${a[0]} = ${rate.toLocaleString()} ${a[1]}\n(sumber: exchangerate-api)` });
    } catch (e) { ctx.sock.sendMessage(ctx.chatId, { text: '⚠️ Error: ' + e.message }); }
  },
};
