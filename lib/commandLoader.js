/**
 * ZerxsBot - Loader command. 1 perintah = 1 file di commands/personal,
 * commands/group, dan commands/cs.
 */
const fs = require("fs");
const path = require("path");

const registry = { personal: {}, group: {}, cs: {} };

function loadDir(dirName, category) {
  const dir = path.join(__dirname, "..", "commands", dirName);
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".js")) continue;
    try {
      const mod = require(path.join(dir, f));
      const name = f.replace(/\.js$/, "");
      registry[category][mod.name || name] = mod;
    } catch (err) {
      console.error(`[zerxs] gagal memuat command ${dirName}/${f}:`, err.message);
    }
  }
}

function loadAll() {
  loadDir("personal", "personal");
  loadDir("group", "group");
  loadDir("cs", "cs");
  const list = [];
  Object.entries(registry.personal).forEach(([name, m]) =>
    list.push({ name, category: "personal", usage: m.usage || `/${name}`, desc: m.desc || "" })
  );
  Object.entries(registry.group).forEach(([name, m]) =>
    list.push({ name, category: "group", usage: m.usage || `/${name}`, desc: m.desc || "" })
  );
  const roles = require("./roles");
  roles.setAllCommands(list);
  return list;
}

function get(category, name) {
  return registry[category] && registry[category][name];
}

function all() {
  return registry;
}

module.exports = { loadAll, get, all };
