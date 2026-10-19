const QUOTES = [
  'Kode itu seperti humor — kalau perlu dijelaskan, berarti kurang bagus.',
  'Kesulitan adalah jalan menuju kemajuan.',
  'Jangan takut gagal, takutlah tidak mencoba.',
  'Disiplin adalah jembatan antara cita-cita dan pencapaian.',
  'Belajar hari ini, memimpin besok.',
  'Kesempurnaan bukan tujuan, progress adalah jalannya.',
  'Orang sukses adalah orang yang memberi nilai sebelum meminta.',
  'Mimpi tidak punya tanggal kedaluwarsa.',
];
module.exports = {
  name: 'quotes', desc: 'Quotes random', usage: '/quotes',
  async exec(ctx) {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    await ctx.sock.sendMessage(ctx.chatId, { text: `💬 "${q}"\n\n— ZerxsBot Quotes` });
  },
};
