/**
 * ZerxsBot - Role definitions & permission helpers.
 * Digunakan oleh web server maupun bot WhatsApp.
 */
const config = require('../../config');

/** Petakan string role spreadsheet -> role inti (uppercase) */
function coreRole(roleStr) {
  const r = String(roleStr || '').toLowerCase();
  if (r.startsWith('developer')) return 'DEVELOPER';
  if (r.startsWith('business')) return 'BUSINESS';
  if (r.startsWith('owner')) return 'OWNER';
  if (r.startsWith('partner')) return 'PARTNER';
  if (r.startsWith('admin')) return 'ADMIN';
  return 'MEMBER';
}

/** Benefit per role inti */
function benefits(core) {
  return config.roleBenefits[core.toLowerCase()] || config.roleBenefits.member;
}

/** Cek apakah user boleh memakai command (nama tanpa prefiks, mis. 'ai') */
function canUseCommand(user, cmd) {
  const b = benefits(coreRole(user.role));
  if (b.commands.includes('ALL')) return true;
  const list = b.commands.map((c) => c.replace(/^\//, ''));
  if (b.commands.includes('ALL_EXCEPT_GROUP')) {
    // business: semua kecuali perintah grup
    return !GROUP_COMMANDS.includes(cmd);
  }
  return list.includes(cmd);
}

const GROUP_COMMANDS = [
  'tagall', 'tag', 'add', 'antilink', 'antitoxic', 'infogroup', 'pin',
  'kick', 'welcome', 'mute', 'unmute', 'rules', 'filter', 'listfilter',
  'unfilter', 'showfilter',
];

/** Semua command personal yang terdaftar */
const PERSONAL_COMMANDS = [
  'ai', 'imageai', 'coder', 'sticker', 'qrcode', 'translate', 'iqc', 'brat',
  'bratvid', 'info', 'stickertext', 'meme', 'nosecret', 'quotes', 'send',
  'kurs', 'menu', 'hash', 'tutor', 'subdomain', 'whois', 'ipinfo', 'biner',
  'ytdown', 'ttdown', 'pintdown',
];

/** Prefiks valid untuk role tertentu */
function allowedPrefixes(user) {
  const b = benefits(coreRole(user.role));
  return b.prefiks;
}

/** Kuota chat harian per role */
function dailyQuota(user) {
  return benefits(coreRole(user.role)).quota;
}

/** Maksimal jumlah bot yang boleh ditambahkan */
function maxBots(user) {
  return benefits(coreRole(user.role)).maxBots;
}

function isDeveloper(user) { return coreRole(user.role) === 'DEVELOPER'; }
function isBusiness(user) { return coreRole(user.role) === 'BUSINESS'; }
function canGroup(user) { return coreRole(user.role) === 'DEVELOPER'; }
function canCS(user) { const b = benefits(coreRole(user.role)); return !!b.cs; }

module.exports = {
  coreRole, benefits, canUseCommand, allowedPrefixes, dailyQuota, maxBots,
  isDeveloper, isBusiness, canGroup, canCS, GROUP_COMMANDS, PERSONAL_COMMANDS,
};
