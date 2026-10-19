module.exports = {
  name: 'send', desc: 'Kirim pesan ke nomor lain lewat bot', usage: '/send [pesan] [nomor] [jumlah]',
  async exec(ctx) {
    const a = ctx.args;
    if (a.length < 2) return ctx.sock.sendMessage(ctx.chatId, { text: `Contoh: ${ctx.prefix}send halo kak 628123456789 1` });
    // format: /send [message] [no sent] [jumlah kirim] -> ambil no & jumlah dari argumen terakhir yang numerik
    let count = 1, phone = null, msgParts = [...a];
    if (/^\d+$/.test(a[a.length-1]) && a.length >= 3) { count = Math.min(parseInt(a.pop()), 10); }
    if (/^[\d+]{8,}$/.test(a[a.length-1])) { phone = a.pop().replace(/\D/g,''); }
    const message = a.join(' ');
    if (!phone || !message) return ctx.sock.sendMessage(ctx.chatId, { text: `Format: ${ctx.prefix}send [pesan] [nomor] [jumlah]\nContoh: ${ctx.prefix}send halo 6281234567890 3` });
    if (count > 10) count = 10;
    const jid = phone + '@s.whatsapp.net';
    for (let i = 0; i < count; i++) {
      await ctx.sock.sendMessage(jid, { text: `📩 Pesan dari user ZerxsBot:\n\n${message}` });
    }
    await ctx.sock.sendMessage(ctx.chatId, { text: `✅ Berhasil mengirim ${count}x pesan ke ${phone}.` });
  },
};
