module.exports = {
  name: 'rules', desc: 'Peraturan grup', usage: '/rules', groupOnly: true,
  async exec(ctx) {
    await ctx.sock.sendMessage(ctx.chatId, { text:
`📜 *PERATURAN GRUP ZERXSBOT*
1. Dilarang spam & mengirim link tanpa izin admin.
2. Dilarang menggunakan kata kasar/toxic (auto-mute 1 hari).
3. Hormati seluruh member, no SARA.
4. Konten 18+ dilarang keras.
5. Gunakan bot dengan bijak, kuota harian berlaku sesuai role.
6. Langgar aturan = kick tanpa peringatan.` });
  },
};
