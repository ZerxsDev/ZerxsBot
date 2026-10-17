module.exports = {
  command: 'rules',
  desc: 'Menampilkan peraturan grup',
  usage: '/rules',
  async handler(ctx) {
    if (!ctx.isGroup) return ctx.send('Hanya untuk grup.');
    await ctx.send(
      `📜 *PERATURAN GRUP*\n\n` +
      `1. Dilaraang menyebar link spam / judi / pornografi.\n` +
      `2. Dilarang menggunakan kata kasar / toxic (antitoxic aktif -> mute 1 hari).\n` +
      `3. Saling menghormati antar member.\n` +
      `4. Tidak boleh spam lebih dari 5 pesan berturut-turut.\n` +
      `5. Konten harus sesuai topik grup.\n` +
      `6. Langgar aturan = kick oleh admin.\n` +
      `7. Ikuti perintah bot dengan benar (${ctx.prefix}menu).\n\n` +
      `_Dikelola otomatis oleh ${ctx.config.bot.name}_`
    );
  },
};
