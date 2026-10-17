module.exports = {
  command: 'tag',
  desc: 'Tag 1 user di grup',
  usage: '/tag [@user atau nomor]',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    let target = ctx.sender;
    // dari pesan yang di-reply
    if (ctx.quoted?.contextInfo?.participant) target = ctx.quoted.contextInfo.participant;
    else if (ctx.args[0]) {
      const num = String(ctx.args[0]).replace(/[^0-9]/g, '');
      if (num) target = num + '@s.whatsapp.net';
    }
    await ctx.send({ text: `👉 Tag: @${target.split('@')[0]} ${ctx.args.slice(1).join(' ')}`.trim(), mentions: [target] });
  },
};
