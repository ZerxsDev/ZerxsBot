// State & utilitas role/kwota/prefix per sesi bot
const config = require('../config');

// Map: phone -> { lastChatDate:'2026-10-19', chatCount: 0 }
const quotaCache = new Map();

function todayStr() { return new Date().toDateString(); }

function normalizePhone(p) {
  let s = String(p || '').replace(/[^0-9]/g, '');
  if (s.startsWith('0')) s = '62' + s.slice(1);
  else if (s.startsWith('8') && s.length <= 12) s = '62' + s;
  return s;
}

function getRoleConfig(role) {
  return config.roles[role] || config.roles.member;
}

function allowedCommands(role) {
  const list = config.commandsByRole[String(role).toLowerCase()] || config.commandsByRole.member;
  return list;
}

function canUseCommand(role, cmd) {
  const list = allowedCommands(role);
  if (list.includes('*')) return true;
  return list.includes(cmd);
}

function isGroupCommandAllowed(role) {
  return config.groupCommandsAllowedRoles.includes(String(role).toLowerCase());
}

// Cek & tambah kwota harian. Return {allowed, used, quota}
function useQuota(phone, role) {
  const rc = getRoleConfig(role);
  const key = normalizePhone(phone);
  let st = quotaCache.get(key);
  if (!st || st.date !== todayStr()) {
    st = { date: todayStr(), chatCount: 0 };
    quotaCache.set(key, st);
  }
  if (rc.quota === Infinity) {
    st.chatCount++;
    return { allowed: true, used: st.chatCount, quota: Infinity };
  }
  if (st.chatCount >= rc.quota) {
    return { allowed: false, used: st.chatCount, quota: rc.quota };
  }
  st.chatCount++;
  return { allowed: true, used: st.chatCount, quota: rc.quota };
}

// Prefix yang bisa dipakai sesuai role (owner/developer bisa multi prefix)
function prefixesForRole(role) {
  const r = String(role).toLowerCase();
  if (r === 'developer') return config.bot.maxMultiPrefix;
  if (r === 'owner') return ['/', '.', '!'];
  return ['/'];
}

module.exports = { normalizePhone, getRoleConfig, allowedCommands, canUseCommand, isGroupCommandAllowed, useQuota, prefixesForRole };
