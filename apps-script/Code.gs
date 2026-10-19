// ZerxsBot - Google Apps Script Backend (tempel di Extensions > Apps Script, Deploy as Web App)
// Spreadsheet berisi sheet: USERS, BOTS, DEVLOG

// ====== HEADER USERS ======
// username | password | nama | phone | role | expired | joinDate | lastChatDate | chatCount | createdAccounts | createdWeek
// role: member, permanen, admin, partner, owner, business, developer

// ====== HEADER BOTS ======
// ownerPhone | botNumber | botName | botType(biasa/cs) | status | session | createdAt | csPrompt | businessName | businessDesc | businessProducts

var SHEET_USERS = 'USERS';
var SHEET_BOTS = 'BOTS';
var SHEET_LOG = 'DEVLOG';

function doGet(e){ return handle_(e.parameter); }
function doPost(e){
  var data = {};
  try { data = JSON.parse(e.postData.contents); } catch(err){}
  return handle_(data);
}

function json_(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function getSS_(){ return SpreadsheetApp.getActiveSpreadsheet(); }

function ensureSheet_(name, headers){
  var ss = getSS_();
  var sh = ss.getSheetByName(name);
  if(!sh){ sh = ss.insertSheet(name); }
  if(sh.getLastRow() === 0){ sh.appendRow(headers); }
  return sh;
}

function rows_(sh){
  var last = sh.getLastRow();
  if(last < 2) return [];
  return sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();
}

function findRow_(sh, colIdx, value){
  var last = sh.getLastRow();
  if(last < 2) return -1;
  var vals = sh.getRange(2, colIdx+1, last-1, 1).getValues();
  for(var i=0;i<vals.length;i++){
    if(String(vals[i][0]).toLowerCase() === String(value).toLowerCase()) return i+2;
  }
  return -1;
}

function handle_(p){
  ensureSheet_(SHEET_USERS, ['username','password','nama','phone','role','expired','joinDate','lastChatDate','chatCount','createdAccounts','createdWeek']);
  ensureSheet_(SHEET_BOTS, ['ownerPhone','botNumber','botName','botType','status','session','createdAt','csPrompt','businessName','businessDesc','businessProducts']);
  ensureSheet_(SHEET_LOG, ['username','timestamp','week']);

  var action = p.action;
  try{
    switch(action){
      case 'login':       return json_(doLogin_(p));
      case 'getUser':     return json_(getUser_(p.username));
      case 'getUserByPhone': return json_(getUserByPhone_(p.phone));
      case 'globalInfo':  return json_(globalInfo_());
      case 'addBot':      return json_(addBot_(p));
      case 'removeBot':   return json_(removeBot_(p));
      case 'getBots':     return json_(getBots_(p.ownerPhone));
      case 'allBots':     return json_({ ok:true, bots: rows_(getSS_().getSheetByName(SHEET_BOTS)) });
      case 'updatePassword': return json_(updatePassword_(p));
      case 'createAccount':  return json_(createAccount_(p));
      case 'countUsersByRole': return json_(countUsersByRole_());
      case 'useQuota':   return json_(useQuota_(p));
      case 'resetQuotaIfNeeded': return json_(resetQuotaIfNeeded_(p));
      case 'deleteExpired': return json_(deleteExpired_());
      case 'setBotStatus': return json_(setBotStatus_(p));
      default: return json_({ ok:false, message:'action tidak dikenal' });
    }
  }catch(err){
    return json_({ ok:false, message: String(err) });
  }
}

function normPhone_(v){
  var s = String(v||'').replace(/[^0-9]/g,'');
  if(s.startsWith('0')) s = '62'+s.slice(1);
  if(s.startsWith('8') && s.length<=12) s = '62'+s;
  return s;
}

function doLogin_(p){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var r = findRow_(sh, 0, p.username);
  if(r < 0) return { ok:false, message:'Akun tidak ditemukan. Hubungi developer untuk akses.' };
  var row = sh.getRange(r,1,1,sh.getLastColumn()).getValues()[0];
  if(String(row[1]) !== String(p.password)) return { ok:false, message:'Password salah.' };
  var exp = row[5];
  if(exp && new Date(exp) < new Date()){
    sh.deleteRow(r); // auto hapus akun expired
    return { ok:false, message:'Akun sudah expired dan otomatis dihapus dari database.' };
  }
  return { ok:true, user: toUser_(row) };
}

function toUser_(row){
  return {
    username: row[0], nama: row[2], phone: normPhone_(row[3]),
    role: String(row[4]||'member').toLowerCase(),
    expired: row[5] ? new Date(row[5]).toISOString() : null,
    joinDate: row[6], lastChatDate: row[7], chatCount: Number(row[8]||0),
    createdAccounts: Number(row[9]||0), createdWeek: row[10]
  };
}

function getUser_(u){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var r = findRow_(sh, 0, u);
  if(r<0) return { ok:false, message:'user tidak ada' };
  var row = sh.getRange(r,1,1,sh.getLastColumn()).getValues()[0];
  return { ok:true, user: toUser_(row) };
}

function getUserByPhone_(phone){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var r = findRow_(sh, 3, normPhone_(phone));
  if(r<0) return { ok:false, message:'user tidak ada' };
  var row = sh.getRange(r,1,1,sh.getLastColumn()).getValues()[0];
  var exp = row[5];
  if(exp && new Date(exp) < new Date()){ sh.deleteRow(r); return { ok:false, message:'expired' }; }
  return { ok:true, user: toUser_(row) };
}

function globalInfo_(){
  var users = rows_(getSS_().getSheetByName(SHEET_USERS));
  var bots = rows_(getSS_().getSheetByName(SHEET_BOTS));
  var activeBots = 0;
  for(var i=0;i<bots.length;i++){ if(String(bots[i][4]).toLowerCase()==='online') activeBots++; }
  return { ok:true, totalUsers: users.length, totalBots: bots.length, activeBots: activeBots };
}

function addBot_(p){
  var phone = normPhone_(p.ownerPhone);
  var sh = getSS_().getSheetByName(SHEET_BOTS);
  var existing = rows_(sh);
  var count = 0;
  for(var i=0;i<existing.length;i++){ if(normPhone_(existing[i][0])===phone) count++; }
  if(findRow_(sh,1,normPhone_(p.botNumber))>0) return { ok:false, message:'Nomor bot sudah terdaftar.' };
  sh.appendRow([phone, normPhone_(p.botNumber), p.botName||'ZerxsBot', p.botType||'biasa', 'offline', p.session||String(Date.now()), new Date().toISOString(), p.csPrompt||'', p.businessName||'', p.businessDesc||'', p.businessProducts||'']);
  return { ok:true, message:'Bot ditambahkan.' };
}

function removeBot_(p){
  var sh = getSS_().getSheetByName(SHEET_BOTS);
  var r = findRow_(sh, 1, normPhone_(p.botNumber));
  if(r<0) return { ok:false, message:'Bot tidak ditemukan.' };
  sh.deleteRow(r);
  return { ok:true, message:'Bot dihapus.' };
}

function getBots_(phone){
  var all = rows_(getSS_().getSheetByName(SHEET_BOTS));
  var mine = [];
  phone = normPhone_(phone);
  for(var i=0;i<all.length;i++){ if(normPhone_(all[i][0])===phone) mine.push(all[i]); }
  return { ok:true, bots: mine };
}

function updatePassword_(p){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var r = findRow_(sh, 0, p.username);
  if(r<0) return { ok:false, message:'User tidak ditemukan.' };
  var cur = sh.getRange(r,2).getValue();
  if(String(cur)!==String(p.oldPassword)) return { ok:false, message:'Password lama salah.' };
  sh.getRange(r,2).setValue(p.newPassword);
  return { ok:true, message:'Password berhasil diubah.' };
}

function weekKey_(){
  var d = new Date();
  var onejan = new Date(d.getFullYear(),0,1);
  var wk = Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7);
  return d.getFullYear()+'-W'+wk;
}

function createAccount_(p){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var role = String(p.role||'').toLowerCase();
  if(['member','permanen','admin'].indexOf(role)<0) return { ok:false, message:'Role harus member trial / member permanen / admin.' };
  if(findRow_(sh,0,p.username)>0) return { ok:false, message:'Username sudah dipakai.' };
  var wk = weekKey_();
  var dev = findRow_(sh,0,p.byDeveloper);
  if(dev<0) return { ok:false, message:'Developer tidak valid.' };
  var devRow = sh.getRange(dev,1,1,sh.getLastColumn()).getValues()[0];
  var createdWeek = String(devRow[10]||'');
  var createdCount = (createdWeek===wk)? Number(devRow[9]||0) : 0;
  if(createdCount >= 8) return { ok:false, message:'Limit buat akun gratis habis (8x/minggu). Tunggu minggu depan.' };
  var expired = role==='member' ? new Date(Date.now()+30*86400000).toISOString() : '';
  sh.appendRow([p.username, p.password, p.username, p.phone||'', role, expired, new Date().toISOString(), '', 0, 0, '']);
  sh.getRange(dev,10).setValue(createdCount+1);
  sh.getRange(dev,11).setValue(wk);
  return { ok:true, message:'Akun '+p.username+' ('+role+') berhasil dibuat.' };
}

function countUsersByRole_(){
  var users = rows_(getSS_().getSheetByName(SHEET_USERS));
  var map = {};
  for(var i=0;i<users.length;i++){
    var r = String(users[i][4]||'').toLowerCase();
    map[r] = (map[r]||0)+1;
  }
  return { ok:true, total: users.length, roles: map };
}

function useQuota_(p){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var r = findRow_(sh, 3, normPhone_(p.phone));
  if(r<0) return { ok:false, reason:'noaccount' };
  var today = new Date().toDateString();
  var last = sh.getRange(r,8).getValue();
  var cnt = Number(sh.getRange(r,9).getValue()||0);
  if(String(last)!==today){ cnt = 0; sh.getRange(r,8).setValue(today); }
  cnt++;
  sh.getRange(r,9).setValue(cnt);
  return { ok:true, used: cnt, role: String(sh.getRange(r,5).getValue()).toLowerCase() };
}

function resetQuotaIfNeeded_(p){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var r = findRow_(sh, 3, normPhone_(p.phone));
  if(r<0) return { ok:false };
  var today = new Date().toDateString();
  var last = sh.getRange(r,8).getValue();
  if(String(last)!==today){ sh.getRange(r,9).setValue(0); sh.getRange(r,8).setValue(today); }
  return { ok:true };
}

function setBotStatus_(p){
  var sh = getSS_().getSheetByName(SHEET_BOTS);
  var r = findRow_(sh, 1, normPhone_(p.botNumber));
  if(r<0) return { ok:false, message:'bot tidak ada' };
  sh.getRange(r,5).setValue(p.status);
  return { ok:true };
}

function deleteExpired_(){
  var sh = getSS_().getSheetByName(SHEET_USERS);
  var last = sh.getLastRow();
  if(last<2) return { ok:true, deleted:0 };
  var vals = sh.getRange(1,1,last,6).getValues();
  var now = new Date();
  var deleted = 0;
  for(var i=vals.length-1;i>=1;i--){
    var exp = vals[i][5];
    if(exp && new Date(exp) < now){ sh.deleteRow(i+1); deleted++; }
  }
  return { ok:true, deleted: deleted };
}
