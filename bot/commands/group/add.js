module.exports = {
  command: 'add',
  desc: 'Menambah member baru ke grup (khusus admin)',
  usage: '/add [number]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Hanya admin grup yang bisa memakai perintah ini.');
    const num = String(ctx.args[0] || '').replace(/[^0-9]/g, '');
    if (!/^\d{9,15}$/.test(num)) return ctx.send(`Contoh: ${ctx.prefix}add 6281234567890`);
    try {
      await ctx.botEntry.sock.groupParticipantsUpdate(ctx.chatJid, [num + '@s.whatsapp.net'], 'add');
      await ctx.send(`✅ ${num} berhasil ditambahkan ke grup.`);
    } catch (e) { await ctx.send('❌ Gagal menambah member: ' + (e.message || 'nomor tidak dapat ditambahkan')); }
  },
};
