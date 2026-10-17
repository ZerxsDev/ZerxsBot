/**
 * ZerxsBot - Loader perintah: 1 perintah = 1 file di folder commands/.
 */
const fs = require('fs');
const path = require('path');

function loadCommands() {
  const cmds = {};
  for (const dir of ['personal', 'group']) {
    const p = path.join(__dirname, 'commands', dir);
    if (!fs.existsSync(p)) continue;
    for (const f of fs.readdirSync(p).filter((x) => x.endsWith('.js'))) {
      try {
        const mod = require(path.join(p, f));
        if (mod && mod.command) {
          cmds[mod.command] = { ...mod, type: dir };
        }
      } catch (e) {
        console.error(`[ZerxsBot] Gagal memuat command ${f}: ${e.message}`);
      }
    }
  }
  return cmds;
}

module.exports = { loadCommands };
