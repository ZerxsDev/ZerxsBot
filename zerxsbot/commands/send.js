// /send [pesan] [nomor tujuan] [jumlah 1-10] - Kirim pesan lewat perantara bot
const config = require("../config");
const { replyText } = require("../lib/simple");

module.exports = {
  cmd: "send",
  async handle(sock, m, args) {
    if (args.length < 3) return replyText(sock, m, `Contoh: ${config.baileys.prefix}send halo kak 6281234567890 3`);
    const jumlah = parseInt(args[args.length - 1]);
    const target = args[args.length - 2];
    const pesan = args.slice(0, -2).join(" ");
    if (!Number.isFinite(jumlah) || jumlah < 1 || jumlah > 10) return replyText(sock, m, "Jumlah kirim harus angka 1-10.");
    if (!/^[0-9+]+$/.test(target)) return replyText(sock, m, "Nomor tujuan tidak valid.");
    // cek nomor terdaftar di WhatsApp
    const jid = target.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    try {
      const on = await sock.onWhatsApp(jid);
      if (!on || !on.length || !on[0].exists) return replyText(sock, m, `Nomor ${target} tidak terdaftar di WhatsApp.`);
    } catch (_) {}
    await replyText(sock, m, `📮 Mengirim ${jumlah} pesan ke ${target}...`);
    let ok = 0;
    for (let i = 0; i < jumlah; i++) {
      try {
        await sock.sendMessage(jid, { text: `${pesan}\n\n— dikirim via ${config.botName}` });
        ok++;
        await new Promise(r => setTimeout(r, 1200));
      } catch (e) { break; }
    }
    await replyText(sock, m, `✅ Selesai: ${ok}/${jumlah} pesan terkirim ke ${target}.`);
  }
};
