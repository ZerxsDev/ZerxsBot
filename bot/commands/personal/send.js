module.exports = {
  command: 'send',
  desc: 'Mengirim pesan kepada pengguna lain dengan perantara bot',
  usage: '/send [pesan] [no tujuan] [jumlah kirim]',
  async handler(ctx) {
    // contoh: /send halo kak 6281234567890 3
    const n = ctx.args.length;
    if (n < 3) return ctx.send(`Contoh: ${ctx.prefix}send halo kak 6281234567890 3`);
    const jumlah = parseInt(ctx.args[n - 1], 10);
    const target = String(ctx.args[n - 2]).replace(/[^0-9]/g, '');
    const pesan = ctx.args.slice(0, n - 2).join(' ');
    if (!Number.isFinite(jumlah) || jumlah < 1 || jumlah > 10) return ctx.send('Jumlah kirim harus 1-10.');
    if (!/^\d{9,15}$/.test(target)) return ctx.send('Nomor tujuan tidak valid (contoh 6281234567890).');
    const jid = target + '@s.whatsapp.net';
    let ok = 0;
    for (let i = 0; i < jumlah; i++) {
      try {
        await ctx.botEntry.sock.sendMessage(jid, { text: `📩 Pesan dari ${ctx.user.username} via ${ctx.config.bot.name}:\n\n${pesan}` });
        ok++;
      } catch (e) {}
    }
    await ctx.send(ok ? `✅ Pesan terkirim ${ok}/${jumlah} ke ${target}` : '❌ Gagal mengirim pesan.');
  },
};
