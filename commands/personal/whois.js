/** /whois [domain] - cek registrasi domain. */
const wa = require("../../lib/wa");

module.exports = {
  name: "whois",
  desc: "Cek informasi registrasi & kepemilikan domain",
  usage: "/whois [domain]",
  async exec(ctx) {
    const net = require("net");
    const dom = (ctx.args[0] || "").replace(/[^a-zA-Z0-9.\-]/g, "");
    if (!dom)
      return wa.sendText(ctx.sock, ctx.jid, `Contoh: ${ctx.prefix}whois example.com`);
    await wa.sendText(ctx.sock, ctx.jid, "📜 Melakukan whois...");
    const out = await new Promise((resolve, reject) => {
      const sock = net.connect(43, "whois.iana.org", () => sock.write(dom + "\r\n"));
      let data = "";
      sock.on("data", (b) => (data += b));
      sock.on("close", () => resolve(data));
      sock.on("error", reject);
      setTimeout(() => {
        sock.destroy();
        resolve(data);
      }, 15000);
    });
    const refer = (out.match(/refer:\s*(.+)/i) || [])[1];
    const lines = out
      .split("\n")
      .filter((l) => /domain|registrar|expir|status|name server|created/i.test(l))
      .slice(0, 20)
      .join("\n");
    await wa.sendText(
      ctx.sock,
      ctx.jid,
      `📎 *WHOIS ${dom}*${refer ? `\nServer: ${refer.trim()}` : ""}\n\n${lines || out.slice(0, 800)}`
    );
  },
};
