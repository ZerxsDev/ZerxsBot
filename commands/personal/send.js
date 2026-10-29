/** /send [message] [no tujuan] [jumlah kirim] - kirim pesan via bot. */
const wa = require("../../lib/wa");

module.exports = {
  name: "send",
  desc: "Kirim pesan ke nomor lain lewat bot",
  usage: "/send [message] [no sent] [jumlah kirim pesan]",
  async exec(ctx) {
    const n = ctx.args.length;
    if (n < 3)
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        `Contoh: ${ctx.prefix}send halo kak 6281234567890 3`
      );
    const jumlah = parseInt(ctx.args[n - 1], 10);
    const tujuan = String(ctx.args[n - 2]).replace(/[^0-9]/g, "");
    const pesan = ctx.args.slice(0, n - 2).join(" ");
    if (!tujuan || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > 10)
      return wa.sendText(
        ctx.sock,
        ctx.jid,
        "Nomor tidak valid atau jumlah kirim harus 1-10."
      );
    const jid = tujuan.includes("@") ? tujuan : `${tujuan}@s.whatsapp.net`;
    for (let i = 0; i < jumlah; i++) {
      await wa.sendText(
        ctx.sock,
        jid,
        `📩 Pesan dari ${ctx.sender}:\n\n${pesan}`
      );
      if (i < jumlah - 1) await new Promise((r) => setTimeout(r, 800));
    }
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      `✅ Berhasil mengirim ${jumlah} pesan ke ${tujuan}.`
    );
  },
};
