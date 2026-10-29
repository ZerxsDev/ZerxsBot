/**
 * ZerxsBot - Data role & utilitas benefit (dipakai web + bot).
 */
const config = require("../config");

const ROLE_ORDER = [
  "member",
  "admin",
  "partner",
  "owner",
  "business",
  "founder",
  "developer",
];

function getRole(role) {
  const r = String(role || "member").toLowerCase();
  return config.roles[r] || config.roles.member;
}

function roleLabel(role) {
  return getRole(role).label || role;
}

/** Cek apakah role boleh memakai command tertentu. */
function canUseCommand(role, cmd) {
  const r = getRole(role);
  const isGroupCmd = groupCommands().includes(cmd);
  if (isGroupCmd && !r.canGroupCommands) return false;
  if (r.commands.includes("*")) {
    // business: semua perintah kecuali grup
    if (cmd === "csbot") return !!r.canCsBot;
    return true;
  }
  return r.commands.includes(cmd);
}

/** Daftar nama command yang tersedia (diisi oleh loader). */
let allCommands = [];
function setAllCommands(list) {
  allCommands = list;
}
function getAllCommands() {
  return allCommands;
}

function personalCommands() {
  return allCommands.filter((c) => c.category === "personal").map((c) => c.name);
}
function groupCommands() {
  return allCommands.filter((c) => c.category === "group").map((c) => c.name);
}

/** Prefix yang sah untuk role tertentu. */
function validPrefixes(role) {
  const r = getRole(role);
  if (r.allowedPrefixes) return r.allowedPrefixes;
  return [config.prefixDefault];
}

/** Normalisasi expired -> teks tampilan. */
function expiredText(expired) {
  const s = String(expired || "").toLowerCase();
  if (!s || s === "permanent" || s === "permanen" || s === "-")
    return "Permanent";
  try {
    return new Date(expired).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (_) {
    return String(expired);
  }
}

function isExpired(expired) {
  const s = String(expired || "").toLowerCase();
  if (!s || s === "permanent" || s === "permanen" || s === "-") return false;
  return new Date(expired).getTime() < Date.now();
}

module.exports = {
  ROLE_ORDER,
  getRole,
  roleLabel,
  canUseCommand,
  setAllCommands,
  getAllCommands,
  personalCommands,
  groupCommands,
  validPrefixes,
  expiredText,
  isExpired,
};
