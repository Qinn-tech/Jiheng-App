/* =========================================================================
   积衡 Jiheng - 数据存储、底层工具、核心计算、全局状态
   ========================================================================= */

const APP_VERSION  = '1.05';
const DATA_VERSION = 5;
const DATA_VERSION_LABEL = 'V1.05';
const SCHEMA_SERIES = 'V1';

const STORAGE_KEY       = 'jiheng_state_v1';
const LEGACY_KEYS       = ['jiheng_state_v1','savewise_state_v1'];
const LOCK_KEY          = 'jiheng_lock_v1';
const LEGACY_LOCK_KEYS  = ['jiheng_lock_v1','savewise_lock_v1'];
const LANG_KEY          = 'jiheng_lang_v1';
const LEGACY_LANG_KEYS  = ['jiheng_lang_v1','savewise_lang_v1'];
const META_KEY          = 'jiheng_meta_v1';
const LEGACY_META_KEYS  = ['jiheng_meta_v1','savewise_meta_v1'];
const BACKUP_KEY        = 'jiheng_backup_v1';
const CHANGELOG_KEY     = 'jiheng_changelog_v1';
const APP_TZ            = 'Asia/Kuala_Lumpur';
const SENTINEL_KEY = 'jiheng_sentinel_v1';
const SENTINEL_MAX_EVENTS = 200;

// 重新计算语言，确保和前面 01 文件兼容
LANG = detectLang();

/* ============================ Metadata ============================ */
function loadMeta(){
  try{
    const raw = localStorage.getItem(META_KEY) || (LEGACY_META_KEYS.map(k=>localStorage.getItem(k)).find(Boolean));
    if(!raw) return { appVersion: APP_VERSION, dataVersion: DATA_VERSION, lastUpdated: new Date().toISOString() };
    const m = JSON.parse(raw);
    return {
      appVersion: m.appVersion || APP_VERSION,
      dataVersion: Number(m.dataVersion) || DATA_VERSION,
      lastUpdated: m.lastUpdated || new Date().toISOString()
    };
  }catch(e){
    return { appVersion: APP_VERSION, dataVersion: DATA_VERSION, lastUpdated: new Date().toISOString() };
  }
}
function saveMeta(m){ try{ localStorage.setItem(META_KEY, JSON.stringify(m)); }catch(e){} }
let META = loadMeta();

/* ============================ Changelog ============================ */
const CHANGELOG_SEED = [
  {
    version:'1.00', date:'2026-09-12',
    title:{ zh:'积衡 Jiheng — 初始发布', en:'Jiheng — Initial Release', ms:'Jiheng — Keluaran Awal' },
    items:{ zh:['品牌正式升级为「积衡 Jiheng」','产品定位：个人财务记录工具','保留并延续所有 V1.00 前的用户数据','首页、交易、储蓄、资产、统计、设置适配新品牌视觉','新增「产品功能讲解 Product Guide」'], en:['Brand upgraded to Jiheng (积衡)','Positioning: Personal Finance Record Tool','All prior user data preserved','Home, Records, Goals, Assets, Stats, Settings redesigned around new brand','NEW: Product Guide'], ms:['Jenama dinaik taraf kepada Jiheng (积衡)','Kedudukan: Alat Rekod Kewangan Peribadi','Semua data pengguna sebelumnya dikekalkan','Utama, Rekod, Sasaran, Aset, Statistik, Tetapan disesuaikan','BAHARU: Panduan Produk'] }
  },
  {
    version:'1.01', date:'2026-09-12',
    title:{ zh:'积衡 Jiheng — Records & Search Improvements', en:'Jiheng — Records & Search Improvements', ms:'Jiheng — Penambahbaikan Rekod & Carian' },
    items:{ zh:['修复欠款记录无法真正保存的问题','修复转给他人无法真正保存的问题','新增独立的 Records / 记录页面','新增 Debts / 欠款记录（I Owe / Owed to Me）','新增 Money Given / 转给他人','新增欠款状态追踪：未偿还 / 部分偿还 / 已还清','改进数据持久化：所有记录立即写入本地存储','修复中文 / Unicode 搜索','搜索支持部分匹配','扩展可搜索字段','支持 Search + Filter 组合筛选','改进长备注显示：自动换行，完整显示，不截断','更新 Product Guide','保留所有 V1.00 数据、PIN、自定义分类与成就'], en:['Fixed Debt record persistence','Fixed Money Given persistence','Added dedicated Records section','Added Debts (I Owe / Owed to Me)','Added Money Given','Added Debt status tracking','Improved data persistence','Fixed Chinese / Unicode search','Search supports partial matching','Expanded searchable fields','Search + Filter combination','Improved long-note display: auto-wrap, no truncation','Updated Product Guide','All V1.00 data, PIN, custom categories and achievements preserved'], ms:['Betulkan rekod hutang tidak disimpan dengan betul','Betulkan rekod wang diberi tidak disimpan dengan betul','Tambah seksyen Rekod khas','Tambah Rekod Hutang (Saya Berhutang / Orang Berhutang)','Tambah Wang Diberi','Tambah penjejakan status hutang','Tambah baik persistensi data','Betulkan carian Cina / Unicode','Carian menyokong padanan separa','Perluas medan carian','Sokongan Carian + Penapis bersama','Tambah baik paparan nota panjang: auto-bungkus, tiada pemotongan','Kemas kini Panduan Produk','Semua data V1.00, PIN, kategori tersuai dan pencapaian dikekalkan'] }
  },
  {
    version:'1.02', date:'2026-09-13',
    title:{ zh:'积衡 Jiheng — 资金流、记录与系统优化', en:'Jiheng — Financial Flow, Records & System Optimization', ms:'Jiheng — Aliran Kewangan, Rekod & Pengoptimuman Sistem' },
    items:{ zh:['优化收入、支出、转账、欠款与转给他人的数据结构','欠款与实际资金流联动','Money Given 支持资金来源账户','Money Given 支持性质','借给他人时自动建立欠款','支持实际还款资金流','支持部分还款','防止 Debt / Money Given 重复扣款','优化日期与时间系统','保存完整编辑时间历史 editHistory','优化 Records 统一记录架构','修复搜索输入框失焦问题','语言切换不修改用户文字','优化数据迁移与升级安全'], en:['Optimized data structures','Debt linked to real fund flow','Money Given supports source account','Money Given supports Nature','Choosing Loan auto-creates debt','Repayment linked to real fund flow','Supports partial repayment','Prevents double-deduction','Improved time system','Saves full editHistory','Optimized Records unified architecture','Fixed search input losing focus','Language switch does not modify user text','Improved migration safety'], ms:['Mengoptimumkan struktur data','Hutang berpaut dengan aliran dana sebenar','Wang Diberi menyokong akaun sumber','Wang Diberi menyokong sifat','Memilih Pinjaman cipta hutang','Bayaran balik berpaut dengan aliran dana','Sokong bayaran sebahagian','Cegah tolak dua kali','Tambah baik sistem masa','Simpan editHistory penuh','Optimumkan seni bina Rekod bersatu','Betulkan medan carian hilang fokus','Tukar bahasa tidak mengubah teks pengguna','Tambah baik keselamatan migrasi'] }
  },
  {
    version:'1.03', date:'2026-09-13',
    title:{ zh:'积衡 Jiheng — 系统、时间与开屏体验优化', en:'Jiheng — System, Time & Launch Experience Improvements', ms:'Jiheng — Penambahbaikan Sistem, Masa & Pengalaman Pelancaran' },
    items:{ zh:['修复分类筛选 i18n','修复首页硬编码','明确区分版本号','全 App 日期系统检查','时间精度保存到秒','编辑历史结构化','区分事件发生与创建时间','时区统一','新增开屏动画','跨平台 CSS 修复','保留全部数据'], en:['Fixed filter i18n','Fixed hardcoded text','Clarified versioning','Full-app date audit','Time to second','Structured edit history','Distinguished time types','Timezone unified','Added Splash Screen','Cross-platform CSS fixes','All data preserved'], ms:['Betulkan penapis i18n','Betulkan teks hardcoded','Jelaskan versi','Audit tarikh','Ketepatan masa saat','Sejarah edit berstruktur','Bezakan jenis masa','Zon masa disatukan','Tambah Splash Screen','Pembaikan CSS','Semua data dikekalkan'] }
  },
  {
    version:'1.04', date:'2026-09-13',
    title:{ zh:'积衡 Jiheng — 欠款多次还款与资金流系统升级', en:'Jiheng — Advanced Debt & Repayment System', ms:'Jiheng — Sistem Hutang & Bayaran Berbilang Lanjutan' },
    items:{ zh:['支持一笔欠款多次还款','每次独立记录','独立账户、方式、时间、备注','独立选择影响账户','支持部分还款','双向一致逻辑','支持编辑删除还原','完整 editHistory','保留全部数据'], en:['Unlimited repayments','Independent records','Independent account/method/time/note','Independent affect-account choice','Partial repayment','Consistent logic','Edit/delete restore','Full editHistory','All data preserved'], ms:['Bayaran tanpa had','Rekod bebas','Akaun/cara/masa/nota bebas','Pilihan kesan akaun bebas','Bayaran sebahagian','Logik konsisten','Edit/padam pulih','editHistory penuh','Semua data dikekalkan'] }
  },
  {
    version:'1.05', date:'2026-09-14',
    title:{ zh:'积衡 Jiheng — 跨平台 PWA 体验', en:'Jiheng — Cross-Platform PWA Experience', ms:'Jiheng — Pengalaman PWA Merentas Platform' },
    items:{ zh:['支持跨平台 PWA 安装','Android 一键安装','iPhone 添加到主屏幕','独立 App 窗口运行','新增 Web App Manifest','新增 Service Worker','自动版本更新检测','在线/离线提示','保留全部数据'], en:['Cross-platform PWA','Android one-tap','iPhone add to home','Standalone window','Web App Manifest','Service Worker','Auto update detection','Online/offline indicator','All data preserved'], ms:['PWA merentas platform','Android satu ketikan','iPhone tambah ke skrin','Tetingkap berdiri sendiri','Web App Manifest','Service Worker','Pengesanan kemas kini','Penunjuk talian','Semua data dikekalkan'] }
  }
];
function loadChangelog(){
  try{ const raw = localStorage.getItem(CHANGELOG_KEY); if(!raw) return CHANGELOG_SEED.slice(); const arr = JSON.parse(raw); if(!Array.isArray(arr)) return CHANGELOG_SEED.slice(); const seen = new Set(arr.map(x => x.version)); CHANGELOG_SEED.forEach(c => { if(!seen.has(c.version)) arr.push(c); }); return arr; }catch(e){ return CHANGELOG_SEED.slice(); }
}
let CHANGELOG = loadChangelog();
function saveChangelog(){ try{ localStorage.setItem(CHANGELOG_KEY, JSON.stringify(CHANGELOG)); }catch(e){} }
function changelogTitle(entry){ if(!entry || !entry.title) return ''; if(typeof entry.title === 'string') return entry.title; return entry.title[LANG] || entry.title.zh || entry.title.en || ''; }
function changelogItems(entry){ if(!entry || !entry.items) return []; if(Array.isArray(entry.items)) return entry.items; return entry.items[LANG] || entry.items.zh || entry.items.en || []; }

/* ============================ 核心工具函数 ============================ */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function round2(n){ return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function fmtNum(n){ return Math.abs(round2(n)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function money(n){
  if(state.settings.hideBalance) return state.settings.currency + ' ••••••';
  const neg = Number(n) < -0.004;
  return (neg ? '-' : '') + state.settings.currency + fmtNum(n);
}
function nowISO(){ return new Date().toISOString(); }
function nowLocalDate(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function nowLocalTime(){ const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; }
function dateFromISO(iso){ try{ const d = new Date(iso); return isNaN(d.getTime()) ? new Date() : d; } catch(e){ return new Date(); } }
function localDateStr(iso){ const d = dateFromISO(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function localTimeStr(iso){ const d = dateFromISO(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function localTimeSecStr(iso){ const d = dateFromISO(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; }
function localDateTimeStr(iso){ const d = dateFromISO(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; }
function combineDateTime(dateStr, timeStr){
  const parts = String(dateStr).split('-').map(Number);
  const timeParts = String(timeStr||'00:00:00').split(':').map(Number);
  const dt = new Date(parts[0]||1970, (parts[1]||1)-1, parts[2]||1, timeParts[0]||0, timeParts[1]||0, timeParts[2]||0);
  if(isNaN(dt.getTime())) return nowISO();
  return dt.toISOString();
}
function fmtDateLabel(iso){
  if(!iso) return '';
  const d = dateFromISO(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((today - that)/86400000);
  if(diff === 0) return t('today');
  if(diff === 1) return t('yesterday');
  const w = ['日','一','二','三','四','五','六'][d.getDay()];
  const langW = LANG === 'zh' ? ` 周${w}` : '';
  return `${d.getMonth()+1}月${d.getDate()}日${langW}`;
}
function monthKeyFromISO(iso){ const d = dateFromISO(iso); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function inThisMonth(iso){ return monthKeyFromISO(iso) === monthKeyFromISO(nowISO()); }
function inThisYear(iso){ return dateFromISO(iso).getFullYear() === new Date().getFullYear(); }
function inThisWeek(iso){ const d = dateFromISO(iso); const now = new Date(); const day = (now.getDay() + 6) % 7; const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day); monday.setHours(0,0,0,0); return d >= monday; }
function inToday(iso){ const d = dateFromISO(iso); const n = new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate(); }
function normalizeSearchText(s){ if(s == null) return ''; let str = String(s); try{ if(str.normalize) str = str.normalize('NFKC'); }catch(e){} str = str.toLowerCase(); str = str.replace(/[\u200B-\u200D\uFEFF]/g, ''); str = str.replace(/\s+/g, ' ').trim(); return str; }
function matchRange(iso, range){ if(!range || range === 'all') return true; if(range === 'today') return inToday(iso); if(range === 'week') return inThisWeek(iso); if(range === 'month') return inThisMonth(iso); if(range === 'year') return inThisYear(iso); return true; }
function accountIncome(id, range){ return state.transactions.filter(tx => tx.type === 'income' && tx.accountId === id && matchRange(tx.eventAt||tx.date, range)).reduce((s,tx) => s + Number(tx.amount||0), 0); }
function accountExpense(id, range){ return state.transactions.filter(tx => tx.type === 'expense' && tx.accountId === id && matchRange(tx.eventAt||tx.date, range)).reduce((s,tx) => s + Number(tx.amount||0), 0); }
function accountTransferIn(id, range){ return state.transactions.filter(tx => tx.type === 'transfer' && tx.toAccountId === id && matchRange(tx.eventAt||tx.date, range)).reduce((s,tx) => s + Number(tx.amount||0), 0); }
function accountTransferOut(id, range){ return state.transactions.filter(tx => tx.type === 'transfer' && tx.accountId === id && matchRange(tx.eventAt||tx.date, range)).reduce((s,tx) => s + Number(tx.amount||0), 0); }
function allIncomeIds(){ const ids = []; INCOME_GROUPS.forEach(g => g.items.forEach(i => ids.push(i))); return ids; }
function allExpenseIds(){ const ids = []; EXPENSE_GROUPS.forEach(g => g.items.forEach(i => ids.push(i))); return ids; }
function allMethodIds(){ const ids = []; MONEY_METHOD_GROUPS.forEach(g => g.items.forEach(i => ids.push(i))); return ids; }
function incomeCats(){ return allIncomeIds(); }
function expenseCats(){ return allExpenseIds(); }
function getAccount(id){ return state.accounts.find(a => a.id === id) || null; }
function getGoal(id){ return state.goals.find(g => g.id === id) || null; }
function getAsset(id){ return state.assets.find(a => a.id === id) || null; }
function getDebt(id){ return state.debts.find(d => d.id === id) || null; }
function getMG(id){ return state.moneyGiven.find(m => m.id === id) || null; }
function sortedTx(){ return state.transactions.slice().sort((a,b) => String(b.eventAt||b.date||'').localeCompare(String(a.eventAt||a.date||'')) || (b.createdAt||0) - (a.createdAt||0)); }
function availableBalance(){ return round2(state.accounts.reduce((s,a) => s + (Number(a.balance)||0), 0)); }
function lockedBalance(){ return round2(state.goals.reduce((s,g) => s + (Number(g.saved)||0), 0)); }
function totalAssets(){ return round2(availableBalance() + lockedBalance()); }
function accountBalance(id){ const a = getAccount(id); return a ? round2(Number(a.balance)||0) : 0; }

/* 时间来源系统 */
const TIME_SOURCE_ORDER = ['edited','created','event','updated','due'];
const TIME_SOURCES = {
  edited: { labelKey: 'timeSourceEdited', get: o => { const hist = Array.isArray(o && o.editHistory) ? o.editHistory : []; if(hist.length === 0) return null; const last = hist[hist.length - 1]; return (last && last.at) ? last.at : null; } },
  created: { labelKey: 'timeSourceCreated', get: o => (o && (o.createdAt || o.eventAt)) || null },
  event: { labelKey: 'timeSourceEvent', get: o => (o && (o.eventAt || o.date)) || null },
  updated: { labelKey: 'timeSourceUpdated', get: o => (o && (o.updatedAt || o.createdAt)) || null },
  due: { labelKey: 'timeSourceDue', get: o => (o && o.dueDate) ? (o.dueDate + 'T23:59:59') : null }
};
const TIME_SOURCE_KEY = 'jiheng_time_source_v1';
let currentTimeSource = (function(){ try{ const v = localStorage.getItem(TIME_SOURCE_KEY); if(v && TIME_SOURCES[v]) return v; }catch(e){} return 'edited'; })();
function cycleTimeSource(){ const i = TIME_SOURCE_ORDER.indexOf(currentTimeSource); const next = TIME_SOURCE_ORDER[(i + 1) % TIME_SOURCE_ORDER.length]; currentTimeSource = next; try{ localStorage.setItem(TIME_SOURCE_KEY, next); }catch(e){} render(); toast('🕒 ' + t(TIME_SOURCES[next].labelKey)); }
function timeLineFor(obj){ if(!obj) return null; const src = TIME_SOURCES[currentTimeSource]; let at = src ? src.get(obj) : null; let key = currentTimeSource; if(!at){ at = TIME_SOURCES.created.get(obj); key = 'created'; } if(!at){ at = TIME_SOURCES.event.get(obj); key = 'event'; } if(!at) return null; return { text: '🕒 ' + t(TIME_SOURCES[key].labelKey) + ' · ' + localDateTimeStr(at), key: key }; }
function renderTimeLine(obj, extraStyle){ const line = timeLineFor(obj); if(!line) return ''; const style = extraStyle || 'color:var(--brand);font-weight:600;cursor:pointer;user-select:none;'; return '<div class="meta-line" style="' + style + '" onclick="event.stopPropagation();cycleTimeSource()" title="' + esc(t('timeSourceTapHint')) + '">' + esc(line.text) + '</div>'; }

/* Debt helpers */
function debtRepayments(d){ return Array.isArray(d && d.repayments) ? d.repayments : []; }
function debtTotalPaid(d){ const list = debtRepayments(d); if(list.length > 0) return round2(list.reduce((s, r) => s + (Number(r.amount) || 0), 0)); return round2(Number(d && d.paid) || 0); }
function debtOriginalAmount(d){ if(!d) return 0; return round2(Number(d.originalAmount) || Number(d.amount) || 0); }
function debtRemaining(d){ const orig = debtOriginalAmount(d); const paid = debtTotalPaid(d); return round2(Math.max(orig - paid, 0)); }
function debtTotalRepaymentCount(){ let c = 0; state.debts.forEach(d => { c += debtRepayments(d).length; }); return c; }

/* 成就与安全检查 */
function currentStreak(){ const days = new Set(state.transactions.map(tx => localDateStr(tx.eventAt||tx.date))); if(!days.size) return 0; let streak = 0; let d = new Date(); if(!days.has(nowLocalDate())) d.setDate(d.getDate() - 1); while(days.has(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)){ streak++; d.setDate(d.getDate() - 1); if(streak > 3650) break; } return streak; }
function totalSavedEver(){ return state.transactions.filter(tx => tx.type === 'goal_deposit').reduce((s,tx) => s + (Number(tx.amount)||0), 0); }
function goalDepositCount(){ return state.transactions.filter(tx => tx.type === 'goal_deposit').length; }
function goalDoneCount(){ return state.goals.filter(g => Number(g.targetAmount) > 0 && Number(g.saved) >= Number(g.targetAmount)).length; }
function achievementProgress(a){
  switch(a.kind){
    case 'income_count':       return Math.min(state.transactions.filter(tx => tx.type === 'income').length, a.target);
    case 'expense_count':      return Math.min(state.transactions.filter(tx => tx.type === 'expense').length, a.target);
    case 'goal_count':         return Math.min(state.goals.length, a.target);
    case 'goal_deposit_count': return Math.min(goalDepositCount(), a.target);
    case 'asset_count':        return Math.min(state.assets.length, a.target);
    case 'account_count':      return Math.min(state.accounts.length, a.target);
    case 'debt_count':         return Math.min(state.debts.length, a.target);
    case 'money_given_count':  return Math.min(state.moneyGiven.length, a.target);
    case 'repayment_count':    return Math.min(debtTotalRepaymentCount(), a.target);
    case 'goal_done_count':    return Math.min(goalDoneCount(), a.target);
    case 'streak':             return Math.min(currentStreak(), a.target);
    case 'total_saved':        return Math.min(totalSavedEver(), a.target);
  }
  return 0;
}

/* ============================ 数据层 (State) ============================ */
function defaultState(){
  return {
    dataVersion: DATA_VERSION,
    settings: { currency:'RM', hideBalance:false, autoLockMinutes:5, lang:LANG, lastUpdated:new Date().toISOString(), debtRepayAffectAccountDefault: true },
    accounts: [], transactions: [], goals: [], assets: [], debts: [], moneyGiven: [],
    customIncomeCats: [], customExpenseCats: [], customMethods: [],
    achievements: {}, createdAt: new Date().toISOString()
  };
}
function migrate(p){
  if(!p || typeof p !== 'object') return { ok:false, reason:'invalid', data:null };
  const original = JSON.parse(JSON.stringify(p));
  if(!Array.isArray(p.accounts)) p.accounts = [];
  if(!Array.isArray(p.transactions)) p.transactions = [];
  if(!Array.isArray(p.goals)) p.goals = [];
  if(!Array.isArray(p.assets)) p.assets = [];
  if(!Array.isArray(p.debts)) p.debts = [];
  if(!Array.isArray(p.moneyGiven)) p.moneyGiven = [];
  if(!Array.isArray(p.customIncomeCats)) p.customIncomeCats = [];
  if(!Array.isArray(p.customExpenseCats)) p.customExpenseCats = [];
  if(!Array.isArray(p.customMethods)) p.customMethods = [];
  if(!p.settings || typeof p.settings !== 'object') p.settings = {};
  if(p.settings.debtRepayAffectAccountDefault === undefined){ p.settings.debtRepayAffectAccountDefault = true; }
  const TZ = APP_TZ;
  const _toISO = (v) => { if(!v) return nowISO(); if(typeof v === 'number'){ try{ return new Date(v).toISOString(); }catch(e){ return nowISO(); } } const s = String(v); if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00').toISOString(); if(/^\d{4}-\d{2}-\d{2}T/.test(s)) return s; const d = new Date(s); return isNaN(d.getTime()) ? nowISO() : d.toISOString(); };
  const _normHistory = (arr) => { if(!Array.isArray(arr)) return []; return arr.map(x => { if(x && typeof x === 'object' && x.at) return { at: x.at, action: x.action || 'edit' }; if(typeof x === 'number') return { at: new Date(x).toISOString(), action: 'edit' }; if(typeof x === 'string') return { at: _toISO(x), action: 'edit' }; return null; }).filter(Boolean); };
  
  p.transactions.forEach(tx => { if(tx.method === undefined) tx.method = ''; if(tx.methodCustom === undefined) tx.methodCustom = ''; if(!tx.timezone) tx.timezone = TZ; tx.editHistory = _normHistory(tx.editHistory); if(!tx.eventAt) tx.eventAt = _toISO(tx.date); if(!tx.createdAt) tx.createdAt = new Date(tx.eventAt).getTime(); if(!tx.updatedAt) tx.updatedAt = tx.createdAt; if(tx.linkedDebtId === undefined) tx.linkedDebtId = null; if(tx.linkedRepaymentId === undefined) tx.linkedRepaymentId = null; });
  p.accounts.forEach(a => { if(a.note === undefined) a.note = ''; if(!a.timezone) a.timezone = TZ; if(!a.eventAt) a.eventAt = _toISO(a.createdAt); if(!a.createdAt) a.createdAt = new Date(a.eventAt).getTime(); if(!a.updatedAt) a.updatedAt = a.createdAt; a.editHistory = _normHistory(a.editHistory); });
  p.goals.forEach(g => { if(g.note === undefined) g.note = ''; if(!g.timezone) g.timezone = TZ; if(!g.eventAt) g.eventAt = _toISO(g.createdAt); if(!g.createdAt) g.createdAt = new Date(g.eventAt).getTime(); if(!g.updatedAt) g.updatedAt = g.createdAt; g.editHistory = _normHistory(g.editHistory); });
  p.assets.forEach(a => { if(a.note === undefined) a.note = ''; if(a.manualNote === undefined) a.manualNote = ''; if(!a.timezone) a.timezone = TZ; if(!a.eventAt) a.eventAt = _toISO(a.purchaseDate || a.createdAt); if(!a.createdAt) a.createdAt = new Date(a.eventAt).getTime(); if(!a.updatedAt) a.updatedAt = a.createdAt; a.editHistory = _normHistory(a.editHistory); });
  
  p.debts.forEach(d => {
    if(d.purpose === undefined) d.purpose = '';
    if(d.purposeCustom === undefined) d.purposeCustom = '';
    if(d.method === undefined) d.method = '';
    if(d.methodCustom === undefined) d.methodCustom = '';
    if(d.reason === undefined) d.reason = '';
    if(d.paid === undefined) d.paid = 0;
    if(!d.status) d.status = 'unpaid';
    if(d.linkMode === undefined) d.linkMode = 'record_only';
    if(d.linkedAccountId === undefined) d.linkedAccountId = null;
    if(!d.timezone) d.timezone = TZ;
    if(!d.eventAt) d.eventAt = _toISO(d.date);
    if(!d.date) d.date = d.eventAt;
    if(!d.createdAt) d.createdAt = new Date(d.eventAt).getTime();
    if(!d.updatedAt) d.updatedAt = d.createdAt;
    if(!d.eventId) d.eventId = d.id;
    d.editHistory = _normHistory(d.editHistory);
    if(d.originalAmount === undefined) d.originalAmount = round2(Number(d.amount) || 0);
    if(d.note === undefined) d.note = d.reason || '';
    if(d.originalEventAt === undefined) d.originalEventAt = d.eventAt || _toISO(d.date);
    if(d.originalTransactionId === undefined) d.originalTransactionId = null;
    const oldPayments = Array.isArray(d.payments) ? d.payments : [];
    const existingRepayments = Array.isArray(d.repayments) ? d.repayments : [];
    if(existingRepayments.length === 0 && oldPayments.length > 0){
      d.repayments = oldPayments.map(pay => { const payEventAt = _toISO(pay.eventAt || pay.createdAt || d.eventAt); const payCreatedAt = Number(pay.createdAt) || new Date(payEventAt).getTime(); return { id: pay.id || uid(), debtId: d.id, amount: round2(Number(pay.amount) || 0), accountId: pay.accountId || null, method: '', methodCustom: '', eventAt: payEventAt, createdAt: payCreatedAt, updatedAt: payCreatedAt, timezone: pay.timezone || TZ, note: pay.note || '', affectAccount: true, linkMode: 'account', transactionId: null, editHistory: [] }; });
    } else if(existingRepayments.length === 0){
      d.repayments = [];
    } else {
      d.repayments.forEach(r => { if(r.debtId === undefined) r.debtId = d.id; if(!Array.isArray(r.editHistory)) r.editHistory = _normHistory(r.editHistory); if(r.method === undefined) r.method = ''; if(r.methodCustom === undefined) r.methodCustom = ''; if(r.affectAccount === undefined) r.affectAccount = true; if(r.linkMode === undefined) r.linkMode = r.affectAccount ? 'account' : 'record_only'; if(r.transactionId === undefined) r.transactionId = null; if(!r.timezone) r.timezone = TZ; if(!r.eventAt) r.eventAt = _toISO(r.createdAt || d.eventAt); if(!r.createdAt) r.createdAt = new Date(r.eventAt).getTime(); if(!r.updatedAt) r.updatedAt = r.createdAt; if(r.note === undefined) r.note = ''; if(r.amount === undefined) r.amount = 0; if(r.accountId === undefined) r.accountId = null; });
    }
    if(!Array.isArray(d.payments)) d.payments = [];
    const sumRepay = d.repayments.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const oldPaid = Number(d.paid) || 0;
    if(Math.abs(sumRepay - oldPaid) > 0.01){ d.paid = round2(sumRepay); } else { d.paid = round2(oldPaid); }
    const origAmt = round2(Number(d.originalAmount) || Number(d.amount) || 0);
    d.originalAmount = origAmt;
    d.amount = origAmt;
    d.remainingAmount = round2(Math.max(origAmt - d.paid, 0));
    if(d.status !== 'cancelled'){ if(d.paid >= origAmt - 0.001 && origAmt > 0) d.status = 'paid'; else if(d.paid > 0) d.status = 'partial'; else d.status = 'unpaid'; }
  });

  p.moneyGiven.forEach(m => { if(m.purpose === undefined) m.purpose = m.giftType || ''; if(m.purposeCustom === undefined) m.purposeCustom = ''; if(m.method === undefined) m.method = ''; if(m.methodCustom === undefined) m.methodCustom = ''; if(m.note === undefined) m.note = ''; if(m.nature === undefined) m.nature = 'gift'; if(m.sourceAccountId === undefined) m.sourceAccountId = m.accountId || null; if(!m.timezone) m.timezone = TZ; m.editHistory = _normHistory(m.editHistory); if(!m.eventAt) m.eventAt = _toISO(m.date); if(!m.createdAt) m.createdAt = new Date(m.eventAt).getTime(); if(!m.updatedAt) m.updatedAt = m.createdAt; if(!m.eventId) m.eventId = m.id; if(m.linkedDebtId === undefined) m.linkedDebtId = null; });
  p.dataVersion = DATA_VERSION;
  const checks = [ Array.isArray(p.accounts), Array.isArray(p.transactions), Array.isArray(p.goals), Array.isArray(p.assets), Array.isArray(p.debts), Array.isArray(p.moneyGiven), (p.settings && typeof p.settings === 'object') ];
  if(checks.some(x => !x)) return { ok:false, reason:'shape', data:original };
  return { ok:true, data:p };
}

function loadState(){
  const base = defaultState();
  try{
    let raw = localStorage.getItem(STORAGE_KEY);
    let cameFromLegacy = false;
    if(!raw){
      for(const k of LEGACY_KEYS){ const old = localStorage.getItem(k); if(old){ raw = old; cameFromLegacy = true; break; } }
    }
    if(!raw) return { state:base, fresh:true };
    let p = JSON.parse(raw) || {};
    if(p && p.state && p.state.accounts) p = p.state;
    const r = migrate(p);
    if(!r.ok){ return { state:base, fresh:false, migrationFailed:true, original:r.data }; }
    const merged = {
      dataVersion: DATA_VERSION,
      settings: Object.assign({}, base.settings, r.data.settings || {}),
      accounts: Array.isArray(r.data.accounts) ? r.data.accounts : [],
      transactions: Array.isArray(r.data.transactions) ? r.data.transactions : [],
      goals: Array.isArray(r.data.goals) ? r.data.goals : [],
      assets: Array.isArray(r.data.assets) ? r.data.assets : [],
      debts: Array.isArray(r.data.debts) ? r.data.debts : [],
      moneyGiven: Array.isArray(r.data.moneyGiven) ? r.data.moneyGiven : [],
      customIncomeCats: Array.isArray(r.data.customIncomeCats) ? r.data.customIncomeCats : [],
      customExpenseCats: Array.isArray(r.data.customExpenseCats) ? r.data.customExpenseCats : [],
      customMethods: Array.isArray(r.data.customMethods) ? r.data.customMethods : [],
      achievements: (r.data.achievements && typeof r.data.achievements === 'object') ? r.data.achievements : {},
      createdAt: r.data.createdAt || new Date().toISOString()
    };
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); }catch(e){}
    return { state:merged, fresh:false, cameFromLegacy };
  }catch(e){
    console.error('[Jiheng loadState] error:', e);
    return { state:base, fresh:true, parseError:true };
  }
}
let loadResult = loadState();
let state = loadResult.state;
LANG = state.settings.lang || LANG;

function saveState(){
  try{
    state.settings.lang = LANG;
    state.settings.lastUpdated = new Date().toISOString();
    state.dataVersion = DATA_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){ toast(t('saveFail')); }
}

/* 安全哨兵 */
function sentinelLoad(){ try{ const raw = localStorage.getItem(SENTINEL_KEY); if(!raw) return { lastCheckAt:null, lastStatus:'unknown', events:[] }; const obj = JSON.parse(raw); return { lastCheckAt: obj.lastCheckAt || null, lastStatus: obj.lastStatus || 'unknown', events: Array.isArray(obj.events) ? obj.events : [] }; }catch(e){ return { lastCheckAt:null, lastStatus:'unknown', events:[] }; } }
function sentinelSave(obj){ try{ const trimmed = { lastCheckAt: obj.lastCheckAt || null, lastStatus: obj.lastStatus || 'unknown', events: (obj.events || []).slice(-SENTINEL_MAX_EVENTS) }; localStorage.setItem(SENTINEL_KEY, JSON.stringify(trimmed)); }catch(e){} }
function sentinelLogEvent(type, label){ if(!label) return; try{ const s = sentinelLoad(); const now = new Date().toISOString(); s.events.push({ id: 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6), type: type || 'info', label: label, eventAt: now, createdAt: Date.now(), timezone: APP_TZ, status: 'ok' }); if(s.events.length > SENTINEL_MAX_EVENTS) s.events = s.events.slice(-SENTINEL_MAX_EVENTS); sentinelSave(s); }catch(e){} }
let sentinelState = sentinelLoad();
function createBackup(reason){ try{ localStorage.setItem(BACKUP_KEY, JSON.stringify({ app:'Jiheng', appVersion:APP_VERSION, dataVersion:DATA_VERSION, exportedAt:new Date().toISOString(), reason:reason||'auto', state })); return true; }catch(e){ return false; } }

function sentinelRunChecks(){
  const result = { appLock:{ status:'ok', label:t('sentinelItemAppLock') }, pin:{ status:'ok', label:t('sentinelItemPin'), detail:'' }, password:{ status:'ok', label:t('sentinelItemCustomPassword'), detail:'' }, localData:{ status:'ok', label:t('sentinelItemLocalData') }, transfer:{ status:'ok', label:t('sentinelItemTransfer') }, settings:{ status:'ok', label:t('sentinelItemSecuritySettings') }, schema:{ status:'ok', label:t('sentinelItemSchema') } };
  try{ if(typeof sha256 !== 'function' || typeof renderLock !== 'function' || typeof lockApp !== 'function'){ result.appLock.status = 'bad'; } }catch(e){ result.appLock.status = 'bad'; }
  if(lockRecord && lockRecord.hash){ result.pin.detail = t('sentinelPinSet'); if(!lockRecord.type || (lockRecord.type !== 'pin' && lockRecord.type !== 'text')){ result.pin.status = 'warn'; } }else{ result.pin.detail = t('sentinelPinNotSet'); result.pin.status = 'warn'; }
  if(lockRecord && lockRecord.type === 'text'){ result.password.detail = t('sentinelPasswordSet'); }else{ result.password.detail = t('sentinelPasswordNotSet'); }
  try{ const checks = [ Array.isArray(state.accounts), Array.isArray(state.transactions), Array.isArray(state.goals), Array.isArray(state.assets), Array.isArray(state.debts), Array.isArray(state.moneyGiven), (state.settings && typeof state.settings === 'object') ]; if(checks.some(x => !x)) result.localData.status = 'bad'; const probeKey = '__jiheng_probe__'; localStorage.setItem(probeKey, '1'); localStorage.removeItem(probeKey); }catch(e){ result.localData.status = 'bad'; }
  try{ if(typeof jtBuildAndEncryptPackage !== 'function' || typeof jtDecryptPackage !== 'function' || typeof crypto === 'undefined' || !crypto.subtle){ result.transfer.status = 'warn'; } }catch(e){ result.transfer.status = 'warn'; }
  try{ if(!state.settings || typeof state.settings !== 'object'){ result.settings.status = 'bad'; }else{ if(Number(state.settings.autoLockMinutes) < 0) result.settings.status = 'warn'; } }catch(e){ result.settings.status = 'bad'; }
  try{ if(typeof migrate !== 'function'){ result.schema.status = 'bad'; }else{ const probe = migrate(JSON.parse(JSON.stringify(state))); if(!probe.ok) result.schema.status = 'bad'; } }catch(e){ result.schema.status = 'warn'; }
  const statuses = Object.values(result).map(x => x.status); let overall = 'ok';
  if(statuses.indexOf('bad') !== -1) overall = 'bad'; else if(statuses.indexOf('warn') !== -1) overall = 'warn';
  return { items: result, overall };
}
function sentinelExecuteCheck(){
  sentinelLogEvent('check_start', t('sentinelEventCheckStart'));
  const r = sentinelRunChecks();
  const st = sentinelLoad();
  st.lastCheckAt = new Date().toISOString();
  st.lastStatus = r.overall;
  sentinelSave(st);
  sentinelLogEvent('check_done', r.overall === 'ok' ? t('sentinelEventCheckDone') : t('sentinelEventCheckIssue'));
  sentinelState = sentinelLoad();
  return r;
}
function checkAchievements(){
  const list = I18N[LANG].achList || I18N.zh.achList;
  const newly = [];
  const unlock = (id) => { if(!state.achievements[id]){ state.achievements[id] = Date.now(); const a = list.find(x => x.id === id); if(a) newly.push(a); } };
  if(state.accounts.length > 0) unlock('first_account');
  if(state.transactions.some(tx => tx.type === 'income'))  unlock('first_income');
  if(state.transactions.some(tx => tx.type === 'expense')) unlock('first_expense');
  if(state.goals.length > 0) unlock('first_goal');
  if(state.assets.length > 0) unlock('first_asset');
  if(state.transactions.some(tx => tx.type === 'goal_deposit')) unlock('first_save');
  if(state.debts.length > 0) unlock('first_debt');
  if(state.moneyGiven.length > 0) unlock('first_given');
  if(debtTotalRepaymentCount() > 0) unlock('first_repay');
  if(goalDoneCount() > 0) unlock('goal_done');
  if(currentStreak() >= 7)  unlock('streak_7');
  if(currentStreak() >= 30) unlock('streak_30');
  const ts = totalSavedEver();
  if(ts >= 100)  unlock('save_100');
  if(ts >= 500)  unlock('save_500');
  if(ts >= 1000) unlock('save_1000');
  if(newly.length) saveState();
  return newly;
}
function afterChange(){
  saveState();
  const unlocked = checkAchievements();
  render();
  unlocked.forEach((a,i) => setTimeout(() => toast(t('achUnlockToast', { name:a.name })), 300 + i*900));
}

/* ============================ 安全 / 锁 ============================ */
function _syncHash(text){
  const str = String(text == null ? '' : text);
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0x1000193 >>> 0;
  for(let i = 0; i < str.length; i++){ const c = str.charCodeAt(i); h1 = (h1 ^ c) >>> 0; h1 = (h1 * 0x01000193) >>> 0; h2 = ((h2 << 5) + h2 + c) >>> 0; }
  return 'jh10_' + h1.toString(16).padStart(8,'0') + h2.toString(16).padStart(8,'0') + '_' + str.length.toString(16);
}
async function sha256(text){
  const str = String(text == null ? '' : text);
  if(window.crypto && crypto.subtle && typeof crypto.subtle.digest === 'function'){
    try{ const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)); const arr = Array.from(new Uint8Array(buf)); let out = ''; for(let i = 0; i < arr.length; i++){ out += arr[i].toString(16).padStart(2,'0'); } return out; }catch(err){ console.warn('[Jiheng sha256] crypto.subtle.digest failed, using sync fallback:', err); }
  }
  return _syncHash(str);
}
function loadLock(){
  try{ let raw = localStorage.getItem(LOCK_KEY); let fromLegacy = false; if(!raw){ for(const k of LEGACY_LOCK_KEYS){ const old = localStorage.getItem(k); if(old){ raw = old; fromLegacy = true; break; } } } if(!raw) return null; const obj = JSON.parse(raw); if(obj && obj.hash && !obj.type) obj.type = 'pin'; if(fromLegacy){ try{ localStorage.setItem(LOCK_KEY, JSON.stringify(obj)); }catch(e){} } return obj; }catch(e){ console.error('[Jiheng loadLock] failed:', e); return null; }
}
function saveLock(obj){ try{ localStorage.setItem(LOCK_KEY, JSON.stringify(obj)); }catch(e){ console.error(e); toast(t('saveFail')); } }
function clearLock(){ try{ localStorage.removeItem(LOCK_KEY); }catch(e){} }
let lockRecord = loadLock();
let isUnlocked  = false;
let lastActivity = Date.now();
function markActivity(){ lastActivity = Date.now(); }

/* ============================ 全局 UI 状态 ============================ */
let ui = { tab: 'home', sub: null, subStack: [], recordFilter: 'all', statsRange: 'month', searchQuery: '', recordCat: '', recordAccount: '', currentAccountId: null, debtFilter: 'all', currentDebtId: null, recordsView: 'home', recordsSearch: '', recordsType: 'all', recordsStatus: 'all', recordsDate: 'all', expandedNotes: {}, expandedRepayNotes: {} };
let scrollMemory = {};
function currentPageKey(){ if(ui.sub) return 'sub:' + ui.sub + ':' + (ui.currentAccountId || '') + ':' + (ui.currentDebtId || ''); return 'tab:' + ui.tab; }
let lockUI = { mode:'unlock', pin:'', firstPin:'', useTextMode:false, msg:'', error:false, _targetKind:null };
function currentLockKind(){ return (lockRecord && lockRecord.type === 'text') ? 'text' : 'pin'; }
function shouldUseTextMode(){ if(lockUI.mode === 'unlock') return currentLockKind() === 'text'; return lockUI.useTextMode; }
let resetUI = { step:'warn', typed:'', verifyPw:'', verifyError:'', busy:false, error:'', holding:false, holdProgress:0, holdStartAt:0, holdTimer:null, holdRaf:null, done:false, exportedInSession:false };
function resetResetUI(){ if(resetUI.holdTimer) clearTimeout(resetUI.holdTimer); if(resetUI.holdRaf) cancelAnimationFrame(resetUI.holdRaf); resetUI = { step:'warn', typed:'', verifyPw:'', verifyError:'', busy:false, error:'', holding:false, holdProgress:0, holdStartAt:0, holdTimer:null, holdRaf:null, done:false, exportedInSession:false }; }
let jtUI = { mode: 'menu', exportPassword: '', exportPasswordConfirm: '', exportBusy: false, exportDone: false, exportFileName: '', importFile: null, importContainer: null, importPassword: '', importBusy: false, importStep: '', importPreview: null, importPackageId: '', importError: '', importDone: false, importDoneSnapshot: null, duplicateWarning: false, existingDataWarning: false, showPassword: false };
function jtResetUI(){ jtUI = { mode: 'menu', exportPassword: '', exportPasswordConfirm: '', exportBusy: false, exportDone: false, exportFileName: '', importFile: null, importContainer: null, importPassword: '', importBusy: false, importStep: '', importPreview: null, importPackageId: '', importError: '', importDone: false, importDoneSnapshot: null, duplicateWarning: false, existingDataWarning: false, showPassword: false }; }
