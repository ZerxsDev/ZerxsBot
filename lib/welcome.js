/**
 * ZerxsBot - Sambutan member baru (event group-participants.update).
 */
const store = require("./store");
const wa = require("./wa");

module.exports = async function welcome(sock, bot, update) {
  const groupId = update.id;
  const settings = store.groupSettings(groupId);
  if (!settings.welcome) return;
  if (!update.participants || !update.participants.length) return;

  if (update.action === "add") {
    let name = "Kakak";
    try {
      name =
        sock.getName(update.participants[0]) ||
        update.participants[0].split("@")[0];
    } catch (_) {}
    const txt = `🎉 *Welcome* @${name.split("@")[0]} ke grup ini!\n\nSilakan baca ${bot.prefixNote || ""}peraturan dengan mengetik /rules. Selamat bergabung 🙌`;
    await wa.sendText(sock, groupId, txt, {
      contextInfo: { mentionedJid: update.participants },
    });
  }

  if (update.action === "remove") {
    await wa.sendText(
      sock,
      groupId,
      `👋 Salah satu member telah meninggalkan grup.`
    );
  }
};
