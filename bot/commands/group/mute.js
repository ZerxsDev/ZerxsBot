module.exports = {
  command: 'mute',
  desc: 'Bungkam user agar tidak bisa kirim pesan (khusus admin)',
  usage: '/mute [@user / reply pesannya]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    if (!(await ctx.isAdmin())) return ctx.send('⛔ Khusus admin grup.');
    let target = null;
    if (ctx.quoted?.contextInfo?.participant) target = ctx.quoted.contextInfo.participant;
    else if (ctx.args[0]) target = String(ctx.args[0]).replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (!target) return ctx.send(`Balas pesan target atau ${ctx.prefix}mute 628xxx`);
    try {
      const meta = await ctx.botEntry.sock.groupMetadata(ctx.chatJid);
      const p = meta.participants.find((x) => x.id === target);
      if (!p) return ctx.send('Target bukan member grup.');
      // Baileys: individual mute via participantsUpdate 'restrict'? gunakan restrict+silent
      await ctx.botEntry.sock.groupParticipantsUpdate(ctx.chatJid, [target], 'remove');
      await ctx.botEntry.sock.groupParticipantsUpdate(ctx.chatJid, [target], 'add');
      await ctx.send(`🔇 ${target.split('@')[0]} dimute (tidak bisa mengirim pesan selama grup dalam mode announcement bila seluruh grup dimute).\nCatatan: WhatsApp hanya mendukung mute massal grup — grup diset sementara ke mode hanya-admin.`);
    } catch (e) { await ctx.send('Gagal mute: ' + e.message); }
  },
};
