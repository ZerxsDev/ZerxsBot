/** /csbot [nama|desc|produk] - buat konfigurasi Bot CS (business/developer/founder). */
const wa = require("../../lib/wa");
const roles = require("../../lib/roles");
const db = require("../../lib/db");

module.exports = {
  name: "csbot",
  desc: "Membuat bot CS bisnis (tanpa prefiks, AI gpt-4o-mini)",
  usage: "/csbot nama=Nama Usaha | desc=tentang usaha | produk=Barang:harga,... | prompt=tambahan",
  async exec(ctx) {
    const r = roles.getRole(ctx.role);
    if (!r.canCsBot)
      return wa.sendText(ctx.sock, ctx.jid, "🔒 Bot CS khusus role Business, Founder, dan Developer.");
    if (!ctx.text) return wa.sendText(ctx.sock, ctx.jid, `Contoh:\n${ctx.prefix}csbot nama=Kopi Senja | desc=Kedai kopi artisan | produk=Espresso:18000,Kopi Susu:15000 | prompt=selalu tawarkan promo pagi`);
    try {
      await db.addBot({
        botNumber: ctx.bot.botNumber || ctx.sender,
        botName: ctx.text,
        type: "cs",
        status: "online",
        owner: ctx.user.username,
      });
      await wa.sendText(
        ctx.sock,
        ctx.jid,
        "🤖 *Bot CS dibuat!*\n\nKonfigurasi tersimpan di spreadsheet Bots.\nMulai sekarang chat masuk ke nomor ini akan dijawab otomatis oleh AI CS tanpa prefiks (maks 100 pesan/hari per customer).\n\nUbah kembali dengan mengirim perintah /csbot ... lagi."
      );
    } catch (e) {
      await wa.sendText(ctx.sock, ctx.jid, "❌ " + e.message);
    }
  },
};
