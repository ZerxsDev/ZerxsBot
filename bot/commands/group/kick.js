module.exports = {
  command: 'kick',
  desc: 'Mengeluarkan member dari grup (khusus admin)',
  usage: '/kick [@user / reply pesannya]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Hanya admin grup yang bisa memakai perintah ini.');
    let target = null;
    if (ctx.quoted?.contextInfo?.participant) target = ctx.quoted.contextInfo.participant;
    else if (ctx.args[0]) target = String(ctx.args[0]).replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!target) return ctx.send(`Balas pesan target atau ${ctx.prefix}kick 628xxx`);
    try {
      await ctx.botEntry.sock.groupParticipantsUpdate(ctx.chatJid, [target], 'remove');
      await ctx.send(`👋 ${target.split('@')[0]} telah dikeluarkan dari grup.`);
    } catch (e) { await ctx.send('❌ Gagal kick: ' + e.message); }
  },
};
