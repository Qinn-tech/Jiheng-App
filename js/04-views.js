/* =========================================================================
   积衡 Jiheng - 页面渲染 (Views Part 1)
   ========================================================================= */

function render(opts){
  opts = opts || {};
  if(!isUnlocked){ renderLock(); document.getElementById('app').innerHTML = ''; return; }

  const root = document.getElementById('app');
  const oldView = root.querySelector('.view');
  const oldKey = root.dataset.pageKey || '';
  const sy = oldView ? oldView.scrollTop : 0;

  if(oldKey){ scrollMemory[oldKey] = sy; }
  const newKey = currentPageKey();

  root.innerHTML = renderTopbar() + '<main class="view">' + renderView() + '</main>' + renderTabbar();
  root.dataset.pageKey = newKey;

  const newView = root.querySelector('.view');
  if(newView){
    if(opts.top === true){
      newView.scrollTop = 0;
      scrollMemory[newKey] = 0;
    } else if(opts.top === false){
      newView.scrollTop = sy;
    } else {
      const saved = scrollMemory[newKey];
      newView.scrollTop = (saved != null) ? saved : 0;
    }
  }
}
function renderTopbar(){
  if(ui.sub === 'accounts')      return bar(t('setAccounts'), true);
    if(ui.sub === 'reset-jiheng')  return bar(t('resetTitle'), true);
  if(ui.sub === 'settings')      return bar(t('setTitle'), true);
  if(ui.sub === 'achievements')  return bar(t('achTitle'), true);
  if(ui.sub === 'categories')    return bar(t('setCategories'), true);
  if(ui.sub === 'lock-settings') return bar(t('lockSettingsTitle'), true);
  if(ui.sub === 'sentinel')      return bar(t('sentinelTitle'), true);
  if(ui.sub === 'whats-new')     return bar(t('whatsNewTitle'), true);
  if(ui.sub === 'product-guide') return bar(t('productGuideTitle'), true);
  if(ui.sub === 'sys-info')      return bar(t('sysInfoTitle'), true);
  if(ui.sub === 'identity')      return bar(t('setIdentity'), true);
  if(ui.sub === 'debt-defaults') return bar(t('setDebtDefaults'), true);
  if(ui.sub === 'account-detail')return bar(accountDetailTitle(), true);
  if(ui.sub === 'debts')         return bar(t('debtTitle'), true);
  if(ui.sub === 'debt-detail')   return bar(t('debtDetailTitle'), true);
  if(ui.sub === 'money-given')   return bar(t('mgTitle'), true);
  if(ui.sub === 'records')       return bar(t('recordsTitle'), true);
  if(ui.sub === 'secure-transfer') return bar(t('secureTransferPageTitle'), true);
  
  const titles = { home:'', records:t('tabRecords'), goals:t('tabGoals'), assets:t('tabAssets'), stats:t('tabStats'), settings:t('setTitle') };
  if(ui.tab === 'home'){
    return `<header class="topbar brand">
      <div class="jiheng-wordmark"><span class="zh">积衡</span><span class="en">JI HENG</span></div>
      <button class="icon-btn" onclick="openSub('settings')">⚙</button></header>`;
  }
  return `<header class="topbar"><span style="width:38px"></span><h1>${esc(titles[ui.tab]||'')}</h1>
    <button class="icon-btn" onclick="openSub('settings')">⚙</button></header>`;
}
function bar(title, back){
  return `<header class="topbar">${back ? '<button class="icon-btn" onclick="back()">←</button>' : '<span style="width:38px"></span>'}
    <h1>${esc(title)}</h1>
    <button class="icon-btn" onclick="lockApp()" title="${esc(t('lockLockNow'))}">🔒</button></header>`;
}
function accountDetailTitle(){ const a = getAccount(ui.currentAccountId); return a ? a.name : t('allAccounts'); }
function renderTabbar(){
  const items = [
    { k:'home',    i:'🏠', l:t('tabHome') },
    { k:'records', i:'🧾', l:t('tabRecords') },
    { k:'goals',   i:'🎯', l:t('tabGoals') },
    { k:'assets',  i:'📦', l:t('tabAssets') },
    { k:'stats',   i:'📊', l:t('tabStats') },
    { k:'settings',i:'⚙️', l:t('tabSettings') }
  ];
  return `<nav class="tabbar">${items.map(it =>
    `<button class="${ui.tab===it.k && !ui.sub ? 'on':''}" onclick="go('${it.k}')">
      <span class="ti">${it.i}</span><span>${esc(it.l)}</span></button>`
  ).join('')}</nav>`;
}
function renderView(){
  if(ui.sub === 'accounts')      return viewAccounts();
    if(ui.sub === 'reset-jiheng')  return viewResetJiheng();
  if(ui.sub === 'settings')      return viewSettings();
  if(ui.sub === 'achievements')  return viewAchievements();
  if(ui.sub === 'categories')    return viewCategories();
  if(ui.sub === 'lock-settings') return viewLockSettings();
  if(ui.sub === 'sentinel')      return viewSentinel();
  if(ui.sub === 'whats-new')     return viewWhatsNew();
  if(ui.sub === 'product-guide') return viewProductGuide();
  if(ui.sub === 'sys-info')      return viewSystemInfo();
  if(ui.sub === 'identity')      return viewIdentity();
  if(ui.sub === 'debt-defaults') return viewDebtDefaults();
  if(ui.sub === 'account-detail')return viewAccountDetail();
  if(ui.sub === 'debts')         return viewDebtsPage();
  if(ui.sub === 'debt-detail')   return viewDebtDetail();
  if(ui.sub === 'money-given')   return viewMoneyGivenPage();
  if(ui.sub === 'records')       return viewRecordsHub();
  if(ui.sub === 'secure-transfer')return viewSecureTransfer();
  
  switch(ui.tab){
    case 'home':     return viewHome();
    case 'records':  return viewRecords();
    case 'goals':    return viewGoals();
    case 'assets':   return viewAssets();
    case 'stats':    return viewStats();
    case 'settings': return viewSettings();
  }
  return '';
}
function go(tab){ ui.tab = tab; ui.sub = null; ui.subStack = []; render({ top:true }); }
function openSub(name){ if(!Array.isArray(ui.subStack)) ui.subStack = []; ui.subStack.push(ui.sub || null); ui.sub = name; render(); }
function openResetPage(){ if(!Array.isArray(ui.subStack)) ui.subStack = []; ui.subStack.push(ui.sub || null); resetResetUI(); ui.sub = 'reset-jiheng'; render({ top:true }); }
function back(){ if(Array.isArray(ui.subStack) && ui.subStack.length > 0){ ui.sub = ui.subStack.pop(); } else { ui.sub = null; } render(); }
function toggleHide(){ state.settings.hideBalance = !state.settings.hideBalance; saveState(); render(); }

function viewHome(){
  const total  = totalAssets();
  const avail  = availableBalance();
  const locked = lockedBalance();
  const mIn = state.transactions.filter(tx => tx.type === 'income' && inThisMonth(tx.eventAt||tx.date)).reduce((s,tx) => s + Number(tx.amount||0), 0);
  const mOut = state.transactions.filter(tx => tx.type === 'expense' && inThisMonth(tx.eventAt||tx.date)).reduce((s,tx) => s + Number(tx.amount||0), 0);
  const recent = sortedTx().slice(0,5);
  const goalsPreview = state.goals.filter(g => Number(g.saved) > 0 || Number(g.targetAmount) > 0).slice(0,2);

  const totalIOwe  = state.debts.filter(d => d.direction === 'i_owe' && d.status !== 'cancelled').reduce((s,d) => s + debtRemaining(d), 0);
  const totalOweMe = state.debts.filter(d => d.direction === 'owe_me' && d.status !== 'cancelled').reduce((s,d) => s + debtRemaining(d), 0);
  const totalGiven = state.moneyGiven.reduce((s,m) => s + Number(m.amount||0), 0);
  const hasAny = state.accounts.length || state.transactions.length || state.goals.length || state.assets.length || state.debts.length || state.moneyGiven.length;

  return `
  <div class="hero">
    <div class="hero-top">
      <div><span class="hero-label">${esc(t('totalAssets'))}</span><div class="hero-sub">${esc(t('totalAssetsSub'))}</div></div>
      <button class="eye-btn" onclick="toggleHide()">${state.settings.hideBalance ? '🙈' : '👁'}</button>
    </div>
    <div class="hero-amount">${money(total)}</div>
    <div class="hero-split">
      <div class="split-item"><span>${esc(t('availableBalance'))}</span><b>${money(avail)}</b></div>
      <div class="split-div"></div>
      <div class="split-item"><span>${esc(t('lockedSaving'))}</span><b>${money(locked)}</b></div>
    </div>
  </div>
  ${renderProductNotice()}
  <div class="mini-row">
    <div class="mini"><span>${esc(t('monthIncome'))}</span><b class="c-green">${money(mIn)}</b></div>
    <div class="mini"><span>${esc(t('monthExpense'))}</span><b class="c-red">${money(mOut)}</b></div>
  </div>

  <div class="mini-row">
    <div class="mini tappable" onclick="openSub('debts')">
      <span>🤝 ${esc(t('debtTitle'))}</span>
      <b class="c-red">-${money(totalIOwe)}</b>
      <span style="margin-top:2px;font-size:11px">${esc(t('debtOweMe'))} <b style="font-size:12px">+${money(totalOweMe)}</b></span>
    </div>
    <div class="mini tappable" onclick="openSub('money-given')">
      <span>🎁 ${esc(t('moneyGiven'))}</span>
      <b class="c-red">-${money(totalGiven)}</b>
      <span style="margin-top:2px;font-size:11px">${state.moneyGiven.length} ${esc(t('recordsCountSuffix'))}</span>
    </div>
  </div>

  <div class="quick">
    <button onclick="openIncomeForm()"><span class="qi">＋</span>${esc(t('quickIncome'))}</button>
    <button onclick="openExpenseForm()"><span class="qi">－</span>${esc(t('quickExpense'))}</button>
    <button onclick="openTransferForm()"><span class="qi">⇄</span>${esc(t('quickTransfer'))}</button>
    <button onclick="openGoalForm()"><span class="qi">🎯</span>${esc(t('quickGoal'))}</button>
  </div>
  <div class="quick">
    <button onclick="openDebtForm()"><span class="qi">🤝</span>${esc(t('debtNew'))}</button>
    <button onclick="openMGForm()"><span class="qi">🎁</span>${esc(t('mgNew'))}</button>
    <button onclick="go('assets')"><span class="qi">📦</span>${esc(t('tabAssets'))}</button>
    <button onclick="go('stats')"><span class="qi">📊</span>${esc(t('tabStats'))}</button>
  </div>

  <section>
    <div class="section-head"><h3>${esc(t('myAccounts'))}</h3><button class="link" onclick="openSub('accounts')">${esc(t('manage'))}</button></div>
    <div class="list">
      ${ state.accounts.length
          ? `<div class="row" onclick="goAccountDetail(null)">
              <div class="row-icon" style="background:var(--brand-soft);color:var(--brand)">∑</div>
              <div class="row-main"><div class="row-title">${esc(t('allAccounts'))}</div><div class="row-sub">${state.accounts.length} ${esc(t('accountsCountSuffix'))}</div></div>
              <div class="row-amount">${money(availableBalance())}</div>
            </div>` + state.accounts.map(accRow).join('')
          : `<div class="empty"><p>${esc(t('noAccount'))}</p><button class="btn primary sm" onclick="openAccountForm()">${esc(t('addFirstAccount'))}</button></div>` }
    </div>
  </section>

  ${ goalsPreview.length ? `
  <section>
    <div class="section-head"><h3>${esc(t('tabGoals'))}</h3><button class="link" onclick="go('goals')">${esc(t('viewAll'))}</button></div>
    ${ goalsPreview.map(goalCard).join('') }
  </section>` : '' }

  <section>
    <div class="section-head"><h3>${esc(t('recentTx'))}</h3><button class="link" onclick="go('records')">${esc(t('viewAll'))}</button></div>
    <div class="list">${ recent.length ? recent.map(txRow).join('') : `<div class="empty"><p>${esc(t('noTx'))}</p></div>` }</div>
  </section>

  ${ !hasAny ? `
  <div class="empty big">
    <div class="empty-icon">🌱</div>
    <p>${esc(t('welcomeTitle'))}</p>
    <span>${esc(t('welcomeSub'))}</span>
    <button class="btn primary sm" onclick="openAccountForm()">${esc(t('createAccount'))}</button>
  </div>` : '' }`;
}
function goAccountDetail(id){ if(!Array.isArray(ui.subStack)) ui.subStack = []; ui.subStack.push(ui.sub || null); ui.currentAccountId = id; ui.sub = 'account-detail'; render(); }
function goDebtDetail(id){ if(!Array.isArray(ui.subStack)) ui.subStack = []; ui.subStack.push(ui.sub || null); ui.currentDebtId = id; ui.sub = 'debt-detail'; render(); }
function accRow(a){
  const meta = ACC_TYPES[a.type] || ACC_TYPES.other;
  return `<div class="row" onclick="goAccountDetail('${a.id}')">
    <div class="row-icon" style="background:${meta.bg};color:${meta.color}">${a.icon || meta.icon}</div>
       <div class="row-main">
      <div class="row-title">${esc(a.name)}</div>
      <div class="row-sub">${esc(meta.label)}</div>
      ${renderTimeLine(a)}
    </div>
    <div class="row-amount">${money(a.balance || 0)}</div>
  </div>`;
}
const ACC_TYPES = {
  cash   : { label:'Cash / 现金',        icon:'💵', bg:'#e8f5e9', color:'#2e7d32' },
  tng    : { label:'TNG eWallet',        icon:'📱', bg:'#e3f2fd', color:'#1565c0' },
  bank   : { label:'Bank / 银行',        icon:'🏦', bg:'#ede7f6', color:'#5e35b1' },
  saving : { label:'Savings / 储蓄',     icon:'🐖', bg:'#fff3e0', color:'#ef6c00' },
  ewallet: { label:'E-Wallet / 电子钱包',icon:'👛', bg:'#e0f7fa', color:'#00838f' },
  other  : { label:'Other / 其他',       icon:'📦', bg:'#fce4ec', color:'#c2185b' }
};
function txRow(tx){
  let icon = '📌', title = '', sub = '', cls = '', sign = '';
  const acc = getAccount(tx.accountId);
  switch(tx.type){
    case 'income':
      icon = catIcon(tx.category);
      title = incomeDisplayLabel(tx.category) || t('income');
      sub = (acc ? acc.name : '—') + ' · ' + localDateTimeStr(tx.eventAt||tx.date) + (tx.note ? ' · ' + tx.note : '');
      cls = 'c-green'; sign = '+';
      break;
    case 'expense':
      icon = catIcon(tx.category);
      title = tx.subCategory ? `${expenseDisplayLabel(tx.category)} · ${tx.subCategory}` : (expenseDisplayLabel(tx.category) || t('expense'));
      sub = (acc ? acc.name : '—') + ' · ' + localDateTimeStr(tx.eventAt||tx.date) + (tx.note ? ' · ' + tx.note : '');
      cls = 'c-red'; sign = '-';
      break;
    case 'transfer': {
      const to = getAccount(tx.toAccountId);
      icon = '⇄'; title = t('transfer');
      sub = (acc ? acc.name : '—') + ' → ' + (to ? to.name : '—') + ' · ' + localDateTimeStr(tx.eventAt||tx.date) + (tx.note ? ' · ' + tx.note : '');
      cls = 'c-muted'; sign = '';
      break;
    }
    case 'goal_deposit': {
      const g = getGoal(tx.goalId);
      icon = '🎯'; title = t('goalDeposit');
      sub = (acc ? acc.name : '—') + ' → ' + (g ? g.name : '—') + ' · ' + localDateTimeStr(tx.eventAt||tx.date);
      cls = 'c-amber'; sign = '';
      break;
    }
    case 'goal_withdraw': {
      const g2 = getGoal(tx.goalId);
      icon = '🎯'; title = t('goalWithdraw');
      sub = (g2 ? g2.name : '—') + ' → ' + (acc ? acc.name : '—') + ' · ' + localDateTimeStr(tx.eventAt||tx.date);
      cls = 'c-green'; sign = '+';
      break;
    }
  }
  const amountText = sign ? sign + money(tx.amount) : money(tx.amount);
  const recurring = tx.recurring ? ' · 🔁' : '';
  const methodTag = (tx.method || tx.methodCustom) ? ' · ' + (tx.methodCustom || methodDisplay(tx.method)) : '';
  return `<div class="row" onclick="openTxMenu('${tx.id}')">
    <div class="row-icon" style="background:#f5f6fa">${icon}</div>
    <div class="row-main">
      <div class="row-title">${esc(title)}</div>
      <div class="row-sub">${esc(sub)}${esc(methodTag)}${recurring}</div>
         ${renderTimeLine(tx)}
    </div>
    <div class="tx-amt ${cls}">${amountText}</div>
  </div>`;
}

function viewAccountDetail(){
  if(!ui.currentAccountId) return viewAllAccountsDetail();
  const a = getAccount(ui.currentAccountId);
  if(!a) return viewAllAccountsDetail();
  const meta = ACC_TYPES[a.type] || ACC_TYPES.other;
  const bal = accountBalance(a.id);
  const inSum  = accountIncome(a.id, 'all');
  const outSum = accountExpense(a.id, 'all');
  const tIn    = accountTransferIn(a.id, 'all');
  const tOut   = accountTransferOut(a.id, 'all');
  const list = sortedTx().filter(tx => tx.accountId === a.id || tx.toAccountId === a.id);
  return `
  <div class="hero" style="background:linear-gradient(135deg,${meta.color} 0%,var(--brand) 100%)">
    <div class="hero-top">
      <div><span class="hero-label">${esc(meta.label)} · ${esc(a.name)}</span><div class="hero-sub">${esc(t('totalAssetsSub'))}</div></div>
      <button class="eye-btn" onclick="toggleHide()">${state.settings.hideBalance ? '🙈' : '👁'}</button>
    </div>
    <div class="hero-amount">${money(bal)}</div>
    <div class="hero-split">
      <div class="split-item"><span>${esc(t('income'))}</span><b>${money(inSum)}</b></div>
      <div class="split-div"></div>
      <div class="split-item"><span>${esc(t('expense'))}</span><b>${money(outSum)}</b></div>
    </div>
  </div>
  <div class="summary-strip">
    <div><span>${esc(t('toAccount'))}</span><b class="c-green">${money(tIn)}</b></div>
    <div><span>${esc(t('fromAccount'))}</span><b class="c-red">${money(tOut)}</b></div>
  </div>
  <div class="quick">
    <button onclick="openIncomeForm('${a.id}')"><span class="qi">＋</span>${esc(t('quickIncome'))}</button>
    <button onclick="openExpenseForm('${a.id}')"><span class="qi">－</span>${esc(t('quickExpense'))}</button>
    <button onclick="openTransferForm('${a.id}')"><span class="qi">⇄</span>${esc(t('quickTransfer'))}</button>
    <button onclick="openAccountMenu('${a.id}')"><span class="qi">⚙</span>${esc(t('manage'))}</button>
  </div>
  <section>
    <div class="section-head"><h3>${esc(t('recentTx'))}</h3><button class="link" onclick="filterByAccount('${a.id}')">${esc(t('viewAll'))}</button></div>
    <div class="list">${ list.length ? list.slice(0,20).map(txRow).join('') : `<div class="empty"><p>${esc(t('noTx'))}</p></div>` }</div>
  </section>`;
}
function viewAllAccountsDetail(){
  const total = availableBalance();
  const list = state.accounts;
  return `
  <div class="hero">
    <div class="hero-top">
      <div><span class="hero-label">${esc(t('allAccounts'))}</span><div class="hero-sub">${esc(t('totalAssetsSub'))}</div></div>
      <button class="eye-btn" onclick="toggleHide()">${state.settings.hideBalance ? '🙈' : '👁'}</button>
    </div>
    <div class="hero-amount">${money(total)}</div>
    <div class="hero-split">
      <div class="split-item"><span>${esc(t('totalAssets'))}</span><b>${money(totalAssets())}</b></div>
      <div class="split-div"></div>
      <div class="split-item"><span>${esc(t('lockedSaving'))}</span><b>${money(lockedBalance())}</b></div>
    </div>
  </div>
  <div class="list">${ list.length ? list.map(accRow).join('') : `<div class="empty"><p>${esc(t('noAccount'))}</p></div>` }</div>
  <button class="btn primary block" onclick="openAccountForm()">＋ ${esc(t('createAccount'))}</button>`;
}
function filterByAccount(id){ ui.recordAccount = id; ui.tab = 'records'; ui.sub = null; ui.subStack = []; render({ top:true }); }

function viewRecords(){
  return `
  <div class="quick">
    <button onclick="openSub('records')"><span class="qi">🗂</span>${esc(t('recordsTitle'))}</button>
    <button onclick="openDebtForm()"><span class="qi">🤝</span>${esc(t('debtNew'))}</button>
    <button onclick="openMGForm()"><span class="qi">🎁</span>${esc(t('mgNew'))}</button>
    <button onclick="openIncomeForm()"><span class="qi">＋</span>${esc(t('quickIncome'))}</button>
  </div>
  ${renderTxFilters()}
  ${renderTxList()}`;
}
function renderTxFilters(){
  const f = ui.recordFilter;
  const q = ui.searchQuery || '';
  const catFilter = ui.recordCat || '';
  const accFilter = ui.recordAccount || '';
  const segs = [['all', t('filterAll')],['income', t('filterIncome')],['expense', t('filterExpense')],['saving', t('filterSaving')]];
  const accList = state.accounts;
  const catSet = new Set();
  state.transactions.forEach(tx => {
    if(!tx.category) return;
    if(tx.type !== 'income' && tx.type !== 'expense') return;
    catSet.add(tx.category);
  });
  const catList = Array.from(catSet).sort();
  const hasFilter = f !== 'all' || catFilter || accFilter;
  return `
  <div class="search-bar">
    <input class="search-input" id="rec-search" type="search" placeholder="${esc(t('searchPlaceholder'))}" value="${esc(q)}">
    <button class="search-clear" onclick="clearSearch()" title="${esc(t('clearSearch'))}">✕</button>
  </div>
  <div class="seg">${segs.map(([v,l]) => `<button class="${f===v?'on':''}" onclick="setFilter('${v}')">${esc(l)}</button>`).join('')}</div>
  ${ accList.length ? `<div class="seg">
    <button class="${!accFilter?'on':''}" onclick="setRecordAccount('')">${esc(t('allAccounts'))}</button>
    ${accList.slice(0,10).map(a => `<button class="${accFilter===a.id?'on':''}" onclick="setRecordAccount('${a.id}')">${esc(a.name)}</button>`).join('')}
  </div>` : '' }
  ${ catList.length ? `<div class="seg">
    <button class="${!catFilter?'on':''}" onclick="setRecordCat('')">${esc(t('all'))}</button>
    ${catList.slice(0,12).map(c => `<button class="${catFilter===c?'on':''}" onclick="setRecordCat('${esc(c)}')">${catIcon(c)} ${esc(incomeDisplayLabel(c) || expenseDisplayLabel(c) || c)}</button>`).join('')}
  </div>` : '' }
  ${ hasFilter ? `<button class="btn ghost sm block" onclick="resetTxFilters()">${esc(t('resetFilters'))}</button>` : '' }`;
}
function renderTxList(){
  const f = ui.recordFilter;
  const qNorm = normalizeSearchText(ui.searchQuery || '');
  const catFilter = ui.recordCat || '';
  const accFilter = ui.recordAccount || '';
  let list = sortedTx();
  if(f === 'income')       list = list.filter(tx => tx.type === 'income');
  else if(f === 'expense') list = list.filter(tx => tx.type === 'expense');
  else if(f === 'saving')  list = list.filter(tx => tx.type === 'transfer' || tx.type === 'goal_deposit' || tx.type === 'goal_withdraw');
  if(accFilter) list = list.filter(tx => tx.accountId === accFilter || tx.toAccountId === accFilter);
  if(catFilter) list = list.filter(tx => tx.category === catFilter);
  if(qNorm){
    list = list.filter(tx => {
      const acc = getAccount(tx.accountId);
      const to  = getAccount(tx.toAccountId);
      const g   = tx.goalId ? getGoal(tx.goalId) : null;
      const bag = [
        tx.category, tx.subCategory, tx.note, tx.method, tx.methodCustom,
        String(tx.amount), tx.date, tx.eventAt,
        acc ? acc.name : '', to ? to.name : '', g ? g.name : '', tx.type
      ];
      for(let i = 0; i < bag.length; i++){
        if(bag[i] == null) continue;
        if(normalizeSearchText(bag[i]).indexOf(qNorm) !== -1) return true;
      }
      return false;
    });
  }
  const totalIn  = list.filter(tx => tx.type === 'income').reduce((s,tx) => s + Number(tx.amount||0), 0);
  const totalOut = list.filter(tx => tx.type === 'expense').reduce((s,tx) => s + Number(tx.amount||0), 0);
  const groups = new Map();
  list.forEach(tx => { const d = localDateStr(tx.eventAt||tx.date); if(!groups.has(d)) groups.set(d, []); groups.get(d).push(tx); });
  const dates = Array.from(groups.keys()).sort().reverse();
  return `
  <div class="stat-grid">
    <div class="stat-box"><span>${esc(t('filterIncomeTotal'))}</span><b class="c-green">${money(totalIn)}</b></div>
    <div class="stat-box"><span>${esc(t('filterExpenseTotal'))}</span><b class="c-red">${money(totalOut)}</b></div>
  </div>
  ${ dates.length
    ? dates.map(d => {
        const items = groups.get(d);
        const dayIn  = items.filter(tx => tx.type === 'income').reduce((s,tx) => s + Number(tx.amount||0), 0);
        const dayOut = items.filter(tx => tx.type === 'expense').reduce((s,tx) => s + Number(tx.amount||0), 0);
        return `<div class="day-group">
          <div class="day-head"><span>${fmtDateLabel(d)}</span><span>${dayIn ? `<i class="c-green">+${money(dayIn)}</i>` : ''}${dayOut ? ` <i class="c-red">-${money(dayOut)}</i>` : ''}</span></div>
          <div class="list">${items.map(txRow).join('')}</div>
        </div>`;
      }).join('')
    : `<div class="empty big">
        <div class="empty-icon">🔍</div>
        <p>${esc(qNorm || catFilter || accFilter || f !== 'all' ? t('noFilterResult') : t('noRecords'))}</p>
        <span>${esc(qNorm || catFilter || accFilter || f !== 'all' ? t('tryOtherKeyword') : t('noTx'))}</span>
        ${!qNorm && !catFilter && !accFilter && f === 'all' ? `<button class="btn primary sm" onclick="openIncomeForm()">${esc(t('recordFirst'))}</button>` : ''}
      </div>` }`;
}
function setFilter(v){ ui.recordFilter = v; render(); }
function setRecordCat(c){ ui.recordCat = c; render(); }
function setRecordAccount(id){ ui.recordAccount = id; render(); }
function clearSearch(){ ui.searchQuery = ''; const el = document.getElementById('rec-search'); if(el){ el.value = ''; } render(); }
function resetTxFilters(){ ui.recordFilter = 'all'; ui.recordCat = ''; ui.recordAccount = ''; render(); }

let _imeComposing = false;
document.addEventListener('compositionstart', e => {
  if(e.target && (e.target.id === 'rec-search' || e.target.id === 'records-search')){ _imeComposing = true; }
}, true);
document.addEventListener('compositionend', e => {
  if(e.target && (e.target.id === 'rec-search' || e.target.id === 'records-search')){
    _imeComposing = false;
    if(e.target.id === 'rec-search'){ ui.searchQuery = e.target.value; rerenderTxListInPlace(); }
    if(e.target.id === 'records-search'){ ui.recordsSearch = e.target.value; rerenderRecordsInPlace(); }
  }
}, true);
document.addEventListener('input', e => {
  if(!e.target) return;
  if(e.target.id === 'rec-search'){ if(_imeComposing) return; ui.searchQuery = e.target.value; rerenderTxListInPlace(); }
  if(e.target.id === 'records-search'){ if(_imeComposing) return; ui.recordsSearch = e.target.value; rerenderRecordsInPlace(); }
});
function rerenderTxListInPlace(){
  const root = document.getElementById('app'); if(!root) return;
  const view = root.querySelector('.view'); if(!view) { render(); return; }
  const statGrid = view.querySelector('.stat-grid');
  if(statGrid){
    let n = statGrid.nextSibling;
    while(n){ const nx = n.nextSibling; n.remove ? n.remove() : view.removeChild(n); n = nx; }
    statGrid.remove();
    const tmp = document.createElement('div'); tmp.innerHTML = renderTxList();
    while(tmp.firstChild){ view.appendChild(tmp.firstChild); }
    return;
  }
  render();
}
function rerenderRecordsInPlace(){
  const root = document.getElementById('app'); if(!root) return;
  const view = root.querySelector('.view'); if(!view) { render(); return; }
  const el = document.getElementById('records-search'); const val = el ? el.value : ''; const pos = el ? el.selectionStart : 0;
  render();
  const el2 = document.getElementById('records-search'); if(el2){ el2.value = val; el2.focus(); try{ el2.setSelectionRange(pos,pos); }catch(e){} }
}

function viewRecordsHub(){
  return `
  <p class="about" style="margin:0 0 4px">${esc(t('recordsSubtitle'))}</p>
  <div class="records-row" onclick="openSub('debts')">
    <div class="rr-icon" style="background:#fdecec;color:#d9534f">🤝</div>
    <div class="rr-main"><div class="rr-title">${esc(t('recordsDebtsTitle'))}</div><div class="rr-sub">${esc(t('recordsDebtsSub'))}</div></div>
    <div class="rr-amt c-muted">${state.debts.length}</div>
  </div>
  <div class="records-row" onclick="openSub('money-given')">
    <div class="rr-icon" style="background:#fff5e6;color:#c9914b">🎁</div>
    <div class="rr-main"><div class="rr-title">${esc(t('recordsMoneyGivenTitle'))}</div><div class="rr-sub">${esc(t('recordsMoneyGivenSub'))}</div></div>
    <div class="rr-amt c-muted">${state.moneyGiven.length}</div>
  </div>
  ${ (!state.debts.length && !state.moneyGiven.length) ? `
  <div class="empty big">
    <div class="empty-icon">🗂</div>
    <p>${esc(t('recordsNoData'))}</p>
    <span>${esc(t('recordsNoDataSub'))}</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn soft" onclick="openDebtForm()">＋ ${esc(t('debtNew'))}</button>
      <button class="btn soft" onclick="openMGForm()">＋ ${esc(t('mgNew'))}</button>
    </div>
  </div>` : '' }`;
}

function viewDebtsPage(){
  const qNorm = normalizeSearchText(ui.recordsSearch || '');
  const f = ui.debtFilter || 'all';
  let list = state.debts.slice().sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  if(f === 'i_owe')  list = list.filter(d => d.direction === 'i_owe');
  else if(f === 'owe_me') list = list.filter(d => d.direction === 'owe_me');
  if(qNorm){
    list = list.filter(d => {
      const bag = [d.person, d.reason, d.purpose, d.purposeCustom, d.method, d.methodCustom, d.status, String(d.amount), d.date, d.eventAt];
      const reps = debtRepayments(d);
      reps.forEach(r => { bag.push(r.note, r.method, r.methodCustom, String(r.amount), r.eventAt); });
      for(let i = 0; i < bag.length; i++){ if(bag[i] == null) continue; if(normalizeSearchText(bag[i]).indexOf(qNorm) !== -1) return true; }
      return false;
    });
  }
  const totalIOwe = state.debts.filter(d => d.direction === 'i_owe' && d.status !== 'cancelled').reduce((s,d) => s + debtRemaining(d), 0);
  const totalOweMe = state.debts.filter(d => d.direction === 'owe_me' && d.status !== 'cancelled').reduce((s,d) => s + debtRemaining(d), 0);
  return `
  <div class="summary-strip">
    <div><span>${esc(t('debtTotalIOwe'))}</span><b class="c-red">${money(totalIOwe)}</b></div>
    <div><span>${esc(t('debtTotalOweMe'))}</span><b class="c-green">${money(totalOweMe)}</b></div>
  </div>
  <div class="search-bar">
    <input class="search-input" id="records-search" type="search" placeholder="${esc(t('searchPlaceholder'))}" value="${esc(ui.recordsSearch||'')}">
    <button class="search-clear" onclick="ui.recordsSearch=''; render()" title="${esc(t('clearSearch'))}">✕</button>
  </div>
  <div class="seg">
    <button class="${f==='all'?'on':''}" onclick="ui.debtFilter='all';render()">${esc(t('debtAll'))}</button>
    <button class="${f==='i_owe'?'on':''}" onclick="ui.debtFilter='i_owe';render()">${esc(t('debtIOwe'))}</button>
    <button class="${f==='owe_me'?'on':''}" onclick="ui.debtFilter='owe_me';render()">${esc(t('debtOweMe'))}</button>
  </div>
  <button class="btn primary block" onclick="openDebtForm()">＋ ${esc(t('debtNew'))}</button>
  ${ list.length ? list.map(debtCard).join('') : `<div class="empty big"><div class="empty-icon">🤝</div><p>${esc(qNorm ? t('noFilterResult') : t('debtNoRecords'))}</p><span>${esc(qNorm ? t('tryOtherKeyword') : t('debtNoRecordsSub'))}</span></div>` }`;
}

function viewDebtDetail(){
  const d = getDebt(ui.currentDebtId);
  if(!d){ ui.sub = 'debts'; return viewDebtsPage(); }
  const amount = debtOriginalAmount(d);
  const paid = debtTotalPaid(d);
  const remain = debtRemaining(d);
  const pct = amount > 0 ? Math.min(paid / amount * 100, 100) : 0;
  const dirCls = d.direction === 'i_owe' ? 'st-debt-iowe' : 'st-debt-oweme';
  const dirLabel = d.direction === 'i_owe' ? t('debtIOwe') : t('debtOweMe');
  const statusLabel = d.status === 'paid' ? t('debtStatusPaid') : d.status === 'partial' ? t('debtStatusPartial') : d.status === 'cancelled' ? t('debtStatusCancelled') : t('debtStatusUnpaid');
  const statusCls = d.status === 'paid' ? 'st-done' : d.status === 'partial' ? 'st-partial' : d.status === 'cancelled' ? 'st-end' : 'st-active';
  const linkedAcc = d.linkedAccountId ? getAccount(d.linkedAccountId) : null;
  const purposeText = d.purposeCustom ? d.purposeCustom : debtPurposeDisplay(d.purpose);
  const methodText = d.methodCustom ? d.methodCustom : methodDisplay(d.method);
  const reps = debtRepayments(d);
  const sortedReps = reps.slice().sort((a,b) => String(a.eventAt||'').localeCompare(String(b.eventAt||'')));

  return `
  <div class="card">
    <div class="debt-top">
      <div style="min-width:0;flex:1">
        <div class="debt-name" style="font-size:18px">${esc(d.person)} <span class="badge ${dirCls}">${esc(dirLabel)}</span> <span class="badge ${statusCls}">${esc(statusLabel)}</span></div>
      </div>
      <button class="icon-btn sm" onclick="debtMenu('${d.id}')">⋯</button>
    </div>
    <div class="goal-amt" style="margin-top:6px"><b>${money(remain)}</b><span> / ${money(amount)}</span></div>
    <div class="bar-track"><div class="bar-fill ${d.status==='paid'?'alt':'debt'}" style="width:${pct.toFixed(1)}%"></div></div>
    <div class="asset-grid" style="margin-top:8px">
      <div><span>${esc(t('debtOriginalAmount'))}</span><b>${money(amount)}</b></div>
      <div><span>${esc(t('debtTotalPaid'))}</span><b class="c-green">${money(paid)}</b></div>
      <div><span>${esc(t('debtRemaining'))}</span><b class="c-red">${money(remain)}</b></div>
      <div><span>${esc(t('debtRepayCount'))}</span><b>${reps.length}</b></div>
    </div>
  </div>
  <div class="card">
    <div class="section-head" style="margin-bottom:8px"><h3>${esc(t('debtOriginal'))}</h3></div>
    <div class="asset-rows">
      <div class="ar"><span>${esc(t('debtOriginalTime'))}</span><b>${esc(localDateTimeStr(d.originalEventAt || d.eventAt || d.date))}</b></div>
      ${purposeText ? `<div class="ar"><span>${esc(t('debtPurpose'))}</span><b>${esc(purposeText)}</b></div>` : ''}
      ${methodText ? `<div class="ar"><span>${esc(t('debtMethod'))}</span><b>${esc(methodText)}</b></div>` : ''}
      ${linkedAcc ? `<div class="ar"><span>${esc(t('debtLinkedAccount'))}</span><b>${esc(linkedAcc.name)}</b></div>` : ''}
      ${d.dueDate ? `<div class="ar"><span>${esc(t('debtDueDate'))}</span><b>${esc(d.dueDate)}</b></div>` : ''}
    </div>
    ${d.reason ? `<div class="goal-sub" style="margin-top:8px">${esc(d.reason)}</div>` : ''}
  </div>
  <section>
    <div class="repay-history-head" style="margin-bottom:8px">
      <h3>${esc(t('debtRepayHistory'))} · ${reps.length}</h3>
      ${ d.status !== 'cancelled' && d.status !== 'paid' ? `<button class="btn primary sm" onclick="openRepayForm('${d.id}')">＋ ${esc(t('debtAddRepay'))}</button>` : '' }
    </div>
    ${ sortedReps.length ? sortedReps.map((r, i) => repayCard(d, r, i)).join('') : `<div class="empty big"><div class="empty-icon">💰</div><p>${esc(t('debtRecordNoRepay'))}</p><span>${esc(t('debtRecordNoRepaySub'))}</span>${ d.status !== 'cancelled' && d.status !== 'paid' ? `<button class="btn primary sm" onclick="openRepayForm('${d.id}')">＋ ${esc(t('debtAddRepay'))}</button>` : '' }</div>` }
  </section>
  <p class="about">${esc(t('debtImportantNote'))}</p>`;
}

function repayCard(debt, r, idx){
  const acc = r.accountId ? getAccount(r.accountId) : null;
  const methodTxt = r.methodCustom ? r.methodCustom : methodDisplay(r.method);
  const affectTag = r.affectAccount ? `<span class="rp-tag affect">${esc(t('debtRepayAffectLabel'))}</span>` : `<span class="rp-tag record">${esc(t('debtRepayRecordLabel'))}</span>`;
  const dirSign = debt.direction === 'owe_me' ? '+' : '-';
  return `<div class="repay-card" style="margin-bottom:8px">
    <div class="rp-top">
      <div style="min-width:0;flex:1">
        <div class="rp-amt ${debt.direction === 'owe_me' ? 'c-green' : 'c-red'}">${dirSign}${money(r.amount)}</div>
        <div class="rp-meta" style="margin-top:4px">${acc ? '📁 ' + esc(acc.name) : (r.affectAccount ? '' : '📝 ' + esc(t('debtRepayRecordLabel')))}${methodTxt ? ' · 💳 ' + esc(methodTxt) : ''}${affectTag}</div>
        <div class="rp-meta">🕒 ${esc(localDateTimeStr(r.eventAt))}</div>
        ${ r.note ? `<div class="rp-note" style="margin-top:4px">${esc(r.note)}</div>` : '' }
        ${renderTimeLine(r, 'color:var(--brand);font-weight:600;cursor:pointer;user-select:none;margin-top:4px;')}
      </div>
      <button class="rp-menu" onclick="openRepayMenu('${debt.id}','${r.id}')" title="⋯">⋯</button>
    </div>
  </div>`;
}

function viewMoneyGivenPage(){
  const qNorm = normalizeSearchText(ui.recordsSearch || '');
  let list = state.moneyGiven.slice().sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  if(qNorm){
    list = list.filter(m => {
      const bag = [m.person, m.note, m.purpose, m.purposeCustom, m.method, m.methodCustom, String(m.amount), m.date, m.eventAt, m.nature];
      for(let i = 0; i < bag.length; i++){ if(bag[i] == null) continue; if(normalizeSearchText(bag[i]).indexOf(qNorm) !== -1) return true; }
      return false;
    });
  }
  const total = state.moneyGiven.reduce((s,m) => s + Number(m.amount||0), 0);
  return `
  <div class="summary-strip">
    <div><span>${esc(t('mgTitle'))}</span><b>${state.moneyGiven.length}</b></div>
    <div><span>${esc(t('amount'))}</span><b class="c-red">-${money(total)}</b></div>
  </div>
  <div class="search-bar">
    <input class="search-input" id="records-search" type="search" placeholder="${esc(t('searchPlaceholder'))}" value="${esc(ui.recordsSearch||'')}">
    <button class="search-clear" onclick="ui.recordsSearch=''; render()" title="${esc(t('clearSearch'))}">✕</button>
  </div>
  <button class="btn primary block" onclick="openMGForm()">＋ ${esc(t('mgNew'))}</button>
  ${ list.length ? list.map(mgCard).join('') : `<div class="empty big"><div class="empty-icon">🎁</div><p>${esc(qNorm ? t('noFilterResult') : t('mgNoRecords'))}</p><span>${esc(qNorm ? t('tryOtherKeyword') : t('mgNoRecordsSub'))}</span></div>` }`;
}

/* =========================================================================
   积衡 Jiheng - 页面渲染 (Views Part 2)
   ========================================================================= */

function viewGoals(){
  const goals = state.goals;
  const totalTarget = goals.reduce((s,g) => s + Number(g.targetAmount||0), 0);
  return `
  <div class="summary-strip">
    <div><span>${esc(t('lockedSavingAmount'))}</span><b>${money(lockedBalance())}</b></div>
    <div><span>${esc(t('goalTotal'))}</span><b>${money(totalTarget)}</b></div>
  </div>
  ${ goals.length
    ? goals.map(goalCard).join('') + `<button class="btn primary block" onclick="openGoalForm()">＋ ${esc(t('goalNew'))}</button>`
    : `<div class="empty big"><div class="empty-icon">🎯</div><p>${esc(t('goalNoGoals'))}</p><span>${esc(t('goalNoGoalsSub'))}</span><button class="btn primary sm" onclick="openGoalForm()">${esc(t('goalNewBtn'))}</button></div>` }`;
}
function goalCard(g){
  const target = Number(g.targetAmount) || 0;
  const saved  = Number(g.saved) || 0;
  const pct    = target > 0 ? Math.min(saved / target * 100, 100) : 0;
  const remain = Math.max(target - saved, 0);
  const done   = target > 0 && saved >= target;
  let dl = t('goalDeadlineNone');
  if(g.deadline){
    const days = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
    if(days > 0) dl = t('goalDaysLeft', { n: days });
    else if(days === 0) dl = t('goalDueToday');
    else dl = t('goalOverdue', { n: -days });
  }
  const createdLine = g.eventAt ? localDateTimeStr(g.eventAt) : '';
  return `<div class="goal-card">
    <div class="goal-top">
      <div>
        <div class="goal-name">${g.icon ? g.icon + ' ' : ''}${esc(g.name)}${done ? `<span class="badge-done">${esc(t('goalDone'))}</span>` : ''}</div>
        <div class="goal-sub">${esc(dl)}${createdLine ? ' · ' + esc(createdLine) : ''}</div>
        ${g.note ? `<div class="goal-sub">${esc(g.note)}</div>` : ''}
      </div>
      <button class="icon-btn sm" onclick="goalMenu('${g.id}')">⋯</button>
    </div>
    <div class="goal-amt"><b>${money(saved)}</b><span> / ${money(target)}</span></div>
    <div class="bar-track"><div class="bar-fill ${done?'alt':''}" style="width:${pct.toFixed(1)}%"></div></div>
    <div class="goal-foot"><span>${pct.toFixed(1)}%</span><span>${esc(t('goalRemain'))} ${money(remain)}</span></div>
    ${renderTimeLine(g)}  
    <div class="goal-acts">
      <button class="btn soft" onclick="openGoalDeposit('${g.id}')">${esc(t('goalDeposit'))}</button>
      <button class="btn soft" onclick="openGoalWithdraw('${g.id}')">${esc(t('goalWithdraw'))}</button>
      <button class="btn soft" onclick="editGoal('${g.id}')">${esc(t('edit'))}</button>
    </div>
  </div>`;
}
function assetCalc(a){
  const price    = Number(a.price) || 0;
  const totalDays = (Number(a.expectedYears)||0) * 365 + (Number(a.expectedMonths)||0) * 30;
  const dailyValue = totalDays > 0 ? price / totalDays : 0;
  const start = new Date(a.purchaseDate);
  const end   = a.endDate ? new Date(a.endDate) : new Date();
  let usedMs  = end.getTime() - start.getTime();
  if(!isFinite(usedMs) || usedMs < 0) usedMs = 0;
  const usedDays = usedMs / 86400000;
  let systemValue = dailyValue * usedDays;
  if(systemValue < 0) systemValue = 0;
  if(systemValue > price) systemValue = price;
  const hasManual = (a.manualValue !== null && a.manualValue !== undefined && a.manualValue !== '');
  const actualValue = hasManual ? Number(a.manualValue) : systemValue;
  const rate       = price > 0 ? actualValue / price : 0;
  const unreturned = Math.max(price - actualValue, 0);
  return { price, totalDays, dailyValue, usedDays, systemValue, actualValue, rate, unreturned, hasManual };
}
const ASSET_STATUS = {
  active:    { key:'assetStatusActive' },
  completed: { key:'assetStatusCompleted' },
  ended:     { key:'assetStatusEnded' },
  damaged:   { key:'assetStatusDamaged' },
  lost:      { key:'assetStatusLost' },
  sold:      { key:'assetStatusSold' },
  stopped:   { key:'assetStatusStopped' }
};
function assetStatusLabel(s){ return t((ASSET_STATUS[s]||ASSET_STATUS.active).key); }
function viewAssets(){
  const list = state.assets;
  const totalReturned = list.reduce((s,a) => s + assetCalc(a).actualValue, 0);
  const totalUnreturned = list.reduce((s,a) => s + assetCalc(a).unreturned, 0);
  const activeCount = list.filter(a => a.status === 'active').length;
  return `
  <div class="summary-strip">
    <div><span>${esc(t('assetTotal'))}</span><b>${list.length}</b></div>
    <div><span>${esc(t('assetActive'))}</span><b>${activeCount}</b></div>
  </div>
  <div class="product-notice" style="border-width:1.5px;padding:10px 12px">
    <div class="pn-head" style="margin-bottom:0">
      <div class="pn-icon">i</div>
      <div class="pn-title" style="text-transform:none;font-size:12px;letter-spacing:0">${esc(t('assetRecoveryNote'))}</div>
    </div>
  </div>
  ${ list.length
    ? list.map(assetCard).join('') +
      `<div class="summary-strip">
        <div><span>${esc(t('assetReturnedTotal'))}</span><b class="c-green">${money(totalReturned)}</b></div>
        <div><span>${esc(t('assetUnreturnedTotal'))}</span><b class="c-red">${money(totalUnreturned)}</b></div>
      </div>` +
      `<button class="btn primary block" onclick="openAssetForm()">＋ ${esc(t('assetAdd'))}</button>`
    : `<div class="empty big"><div class="empty-icon">📦</div><p>${esc(t('assetNoAssets'))}</p><span>${esc(t('assetNoAssetsSub'))}</span><button class="btn primary sm" onclick="openAssetForm()">${esc(t('assetAddBtn'))}</button></div>` }`;
}
function assetCard(a){
  const c = assetCalc(a);
  const pct = Math.min(c.rate * 100, 100);
  const isActive = a.status === 'active';
  const cls = { active:'st-active', completed:'st-done', ended:'st-end', damaged:'st-bad', lost:'st-bad', sold:'st-done', stopped:'st-end' }[a.status] || 'st-active';
  const createdLine = a.eventAt ? localDateTimeStr(a.eventAt) : '';
  return `<div class="asset-card">
    <div class="asset-top">
      <div>
        <div class="asset-name">${esc(a.name)}</div>
        <div class="goal-sub">${esc(a.purchaseDate)}${a.endDate ? ' · ' + esc(a.endDate) : ''}${createdLine ? ' · ' + esc(createdLine) : ''}</div>
        ${a.note ? `<div class="goal-sub">${esc(a.note)}</div>` : ''}
      </div>
      <span class="badge ${cls}">${esc(assetStatusLabel(a.status))}</span>
    </div>
    <div class="asset-grid">
      <div><span>${esc(t('assetPrice'))}</span><b>${money(c.price)}</b></div>
      <div><span>${esc(t('assetDailyValue'))}</span><b>${money(c.dailyValue)}</b></div>
      <div><span>${esc(t('assetUsedDays'))}</span><b>${c.usedDays.toFixed(1)}</b></div>
      <div><span>${esc(t('assetTotalDays'))}</span><b>${c.totalDays}</b></div>
    </div>
    <div class="bar-track"><div class="bar-fill alt" style="width:${pct.toFixed(1)}%"></div></div>
    <div class="asset-rows">
      <div class="ar"><span>${esc(t('assetSystemValue'))}</span><b>${money(c.systemValue)}</b></div>
      <div class="ar"><span>${esc(t('assetManualValue'))}</span><b>${c.hasManual ? money(a.manualValue) : '—'}</b></div>
      <div class="ar"><span>${esc(t('assetActualValue'))}</span><b class="c-green">${money(c.actualValue)}</b></div>
      <div class="ar"><span>${esc(t('assetUnreturned'))}</span><b class="c-red">${money(c.unreturned)}</b></div>
      <div class="ar"><span>${esc(t('assetRate'))}</span><b>${(c.rate * 100).toFixed(1)}%</b></div>
    </div>
      ${renderTimeLine(a)}
    <div class="asset-acts">
      ${isActive ? `<button class="btn soft" onclick="openAssetEnd('${a.id}')">${esc(t('assetEnd'))}</button>` : ''}
      <button class="btn soft" onclick="openAssetAdjust('${a.id}')">${esc(t('assetAdjust'))}</button>
      <button class="btn soft" onclick="assetMenu('${a.id}')">${esc(t('assetMore'))}</button>
    </div>
  </div>`;
}
function last6Months(){
  const arr = [];
  const now = new Date();
  for(let i = 5; i >= 0; i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({ key: monthKeyFromISO(d.toISOString()), label: `${d.getMonth()+1}月` });
  }
  return arr;
}
function viewStats(){
  const range = ui.statsRange;
  const txs = state.transactions.filter(tx => matchRange(tx.eventAt||tx.date, range));
  const income  = txs.filter(tx => tx.type === 'income').reduce((s,tx) => s + Number(tx.amount||0), 0);
  const expense = txs.filter(tx => tx.type === 'expense').reduce((s,tx) => s + Number(tx.amount||0), 0);
  const net     = income - expense;
  const catMap = {};
  txs.filter(tx => tx.type === 'expense').forEach(tx => { const k = tx.category || 'other_exp'; catMap[k] = (catMap[k] || 0) + Number(tx.amount||0); });
  const cats = Object.entries(catMap).sort((a,b) => b[1] - a[1]);
  const maxCat = cats.length ? cats[0][1] : 0;
  const incMap = {};
  txs.filter(tx => tx.type === 'income').forEach(tx => { const k = tx.category || 'other_income'; incMap[k] = (incMap[k] || 0) + Number(tx.amount||0); });
  const incCats = Object.entries(incMap).sort((a,b) => b[1] - a[1]);
  const maxInc = incCats.length ? incCats[0][1] : 0;
  const months = last6Months().map(m => {
    const inc = state.transactions.filter(tx => tx.type === 'income'  && String(tx.eventAt||tx.date||'').startsWith(m.key)).reduce((s,tx) => s + Number(tx.amount||0), 0);
    const exp = state.transactions.filter(tx => tx.type === 'expense' && String(tx.eventAt||tx.date||'').startsWith(m.key)).reduce((s,tx) => s + Number(tx.amount||0), 0);
    return { key:m.key, label:m.label, inc, exp, net: inc - exp };
  });
  const maxAbs = Math.max.apply(null, months.map(m => Math.abs(m.net)).concat([1]));
  const hasData = txs.length > 0;
  const rangeSegs = [['today', t('statsToday')],['week', t('statsWeek')],['month', t('statsMonth')],['year', t('statsYear')],['all', t('statsAll')]];
  return `
  <div class="seg">${rangeSegs.map(([v,l]) => `<button class="${range===v?'on':''}" onclick="setStatsRange('${v}')">${esc(l)}</button>`).join('')}</div>
  <div class="stat-grid">
    <div class="stat-box"><span>${esc(t('statsIncome'))}</span><b class="c-green">${money(income)}</b></div>
    <div class="stat-box"><span>${esc(t('statsExpense'))}</span><b class="c-red">${money(expense)}</b></div>
    <div class="stat-box"><span>${esc(t('statsNet'))}</span><b class="${net>=0?'c-green':'c-red'}">${money(net)}</b></div>
    <div class="stat-box"><span>${esc(t('statsLocked'))}</span><b>${money(lockedBalance())}</b></div>
  </div>
  <div class="card">
    <div class="section-head" style="margin-bottom:12px"><h3>${esc(t('statsExpenseCat'))}</h3></div>
    ${ cats.length ? cats.map(([name, amt]) => `<div class="cat-row">
      <div class="cat-head"><span>${catIcon(name)} ${esc(expenseDisplayLabel(name))}</span><span>${money(amt)}</span></div>
      <div class="cat-bar"><i style="width:${maxCat>0?(amt/maxCat*100).toFixed(1):0}%"></i></div>
    </div>`).join('') : `<div class="empty"><p>${esc(t('statsNoExpense'))}</p></div>` }
  </div>
  <div class="card">
    <div class="section-head" style="margin-bottom:12px"><h3>${esc(t('statsIncomeCat'))}</h3></div>
    ${ incCats.length ? incCats.map(([name, amt]) => `<div class="cat-row">
      <div class="cat-head"><span>${catIcon(name)} ${esc(incomeDisplayLabel(name))}</span><span>${money(amt)}</span></div>
      <div class="cat-bar"><i class="inc" style="width:${maxInc>0?(amt/maxInc*100).toFixed(1):0}%"></i></div>
    </div>`).join('') : `<div class="empty"><p>${esc(t('statsNoIncome'))}</p></div>` }
  </div>
  <div class="card">
    <div class="section-head" style="margin-bottom:6px"><h3>${esc(t('statsTrend'))}</h3><span style="font-size:12px;color:var(--muted)">${esc(t('statsTrendSub'))}</span></div>
    <div class="trend">
      ${ months.map(m => {
        const h = Math.max(Math.abs(m.net) / maxAbs * 92, m.net === 0 ? 2 : 6);
        return `<div class="trend-col">
          <div class="trend-val">${m.net === 0 ? '' : (m.net>0?'+':'-') + fmtNum(m.net)}</div>
          <div class="trend-bar ${m.net < 0 ? 'neg':''}" style="height:${h.toFixed(1)}%"></div>
          <div class="trend-lbl">${m.label}</div>
        </div>`;
      }).join('') }
    </div>
  </div>
  <p class="about">${esc(t('statsTransferNote'))}</p>
  ${ !hasData ? `<div class="empty big"><div class="empty-icon">📊</div><p>${esc(t('statsNoData'))}</p><span>${esc(t('statsNoDataSub'))}</span></div>` : '' }`;
}
function setStatsRange(v){ ui.statsRange = v; render(); }

function viewAccounts(){
  return `
  <div class="card">
    <div style="font-size:12px;color:var(--muted);margin-bottom:4px">${esc(t('totalAvailable'))}</div>
    <div style="font-size:28px;font-weight:800;font-variant-numeric:tabular-nums">${money(availableBalance())}</div>
  </div>
  <div class="list">
    ${ state.accounts.length
      ? state.accounts.map(a => {
          const meta = ACC_TYPES[a.type] || ACC_TYPES.other;
          return `<div class="row" onclick="openAccountMenu('${a.id}')">
            <div class="row-icon" style="background:${meta.bg};color:${meta.color}">${a.icon || meta.icon}</div>
            <div class="row-main"><div class="row-title">${esc(a.name)}</div><div class="row-sub">${esc(meta.label)}</div></div>
            <div class="row-amount">${money(a.balance||0)}</div>
          </div>`;
        }).join('')
      : `<div class="empty"><p>${esc(t('noAccount'))}</p></div>` }
  </div>
  <button class="btn primary block" onclick="openAccountForm()">＋ ${esc(t('createAccount'))}</button>
  <p class="about">${esc(t('accountDeleteHint'))}</p>`;
}
function viewCategories(){
  return `
  <div class="card">
    <div class="section-head" style="margin-bottom:10px"><h3>${esc(t('catCustomIncome'))}</h3><button class="link" onclick="addCustomCat('income')">${esc(t('catAdd'))}</button></div>
    ${ state.customIncomeCats.length
      ? `<div class="chip-row">${ state.customIncomeCats.map(c => `<button class="chip on" onclick="removeCustomCat('income','${esc(c)}')">${esc(c)} ✕</button>`).join('') }</div>`
      : `<div class="empty" style="padding:12px 0"><p style="font-size:12px">${esc(t('catDebtCustomIncome'))}</p></div>` }
  </div>
  <div class="card">
    <div class="section-head" style="margin-bottom:10px"><h3>${esc(t('catCustomExpense'))}</h3><button class="link" onclick="addCustomCat('expense')">${esc(t('catAdd'))}</button></div>
    ${ state.customExpenseCats.length
      ? `<div class="chip-row">${ state.customExpenseCats.map(c => `<button class="chip on" onclick="removeCustomCat('expense','${esc(c)}')">${esc(c)} ✕</button>`).join('') }</div>`
      : `<div class="empty" style="padding:12px 0"><p style="font-size:12px">${esc(t('catDebtCustomExpense'))}</p></div>` }
  </div>
  <p class="about">${esc(t('catHint'))}</p>`;
}

function viewAchievements(){
  const list = I18N[LANG].achList || I18N.zh.achList;
  return `<div class="ach-grid">
    ${ list.map(a => {
      const got = !!state.achievements[a.id];
      const prog = achievementProgress(a);
      const pct = a.target > 0 ? Math.min(prog / a.target * 100, 100) : 0;
      const progText = a.kind === 'streak'
        ? `${prog} / ${a.target} ${LANG==='zh'?'天':(LANG==='ms'?'hari':'days')}`
        : (a.kind === 'total_saved' ? `${money(prog)} / ${money(a.target)}` : `${prog} / ${a.target}`);
      return `<div class="ach ${got?'got':''}">
        <div class="ach-row">
          <div class="ach-icon">${got ? a.icon : '🔒'}</div>
          <div class="ach-body">
            <div class="ach-name">${esc(a.name)}</div>
            <div class="ach-desc">${esc(a.desc)}</div>
            <div class="ach-how">→ ${esc(t('achHowTo'))}: ${esc(a.how)}</div>
            <div class="ach-progress-row">
              <div class="ach-progress-bar"><i style="width:${pct.toFixed(1)}%"></i></div>
              <div class="ach-progress-text">${esc(progText)}</div>
            </div>
          </div>
          <div class="ach-status ${got?'':'locked'}">${got ? '✓ ' + esc(t('achUnlocked')) : esc(t('achLocked'))}</div>
        </div>
      </div>`;
    }).join('') }
  </div>`;
}
function viewSettings(){
  const unlockedCount = Object.keys(state.achievements).length;
  const autoLock = Number(state.settings.autoLockMinutes) || 0;
  const autoLockLabel = autoLock <= 0 ? t('lockNever') : autoLock + ' ' + t('lockMin');
  const transferCount = state.transactions.filter(tx => tx.type === 'transfer').length;
  const repayCount = debtTotalRepaymentCount();
  return `
  <div class="card">
    <div class="set-row">
      <div><div class="set-title">${esc(t('setHideBalance'))}</div><div class="set-sub">${esc(t('setHideBalanceSub'))}</div></div>
      <button class="switch ${state.settings.hideBalance?'on':''}" onclick="toggleHide()"><i></i></button>
    </div>
    <div class="set-row">
      <div><div class="set-title">${esc(t('setCurrency'))}</div><div class="set-sub">${esc(t('setCurrencySub'))}</div></div>
      <span class="set-val">RM / MYR</span>
    </div>
  </div>
 <div class="card">
  <div class="set-row tap" onclick="openSub('lock-settings')">
    <div><div class="set-title">🔒 ${esc(t('setLock'))}</div><div class="set-sub">${autoLockLabel}</div></div>
    <span class="chev">›</span>
  </div>
  <div class="set-row tap" onclick="openSub('sentinel')">
    <div><div class="set-title">🛡️ ${esc(t('sentinelTitle'))}</div><div class="set-sub">${esc(t('sentinelSub'))}</div></div>
    <span class="chev">›</span>
  </div>
  <div class="set-row tap" onclick="openSub('debt-defaults')">
    <div><div class="set-title">💰 ${esc(t('setDebtDefaults'))}</div><div class="set-sub">${state.settings.debtRepayAffectAccountDefault ? esc(t('debtRepayAffectAccountOn')) : esc(t('debtRepayAffectAccountOff'))}</div></div>
    <span class="chev">›</span>
  </div>
  <div class="set-row tap" onclick="openSub('categories')">
    <div><div class="set-title">🏷️ ${esc(t('setCategories'))}</div><div class="set-sub">${esc(t('setCategoriesSub'))}</div></div>
    <span class="chev">›</span>
  </div>
  <div class="set-row tap" onclick="openSub('accounts')">
    <div><div class="set-title">🏛️ ${esc(t('setAccounts'))}</div><div class="set-sub">${t('setAccountsSub', { n: state.accounts.length })}</div></div>
    <span class="chev">›</span>
  </div>
  <div class="set-row tap" onclick="openSub('achievements')">
    <div><div class="set-title">🏆 ${esc(t('setAchievements'))}</div><div class="set-sub">${t('setAchievementsSub', { a:unlockedCount, b:(I18N[LANG].achList||I18N.zh.achList).length })}</div></div>
    <span class="chev">›</span>
  </div>
</div>
  <div class="card">
    <div class="set-row tap" onclick="openSub('secure-transfer')">
      <div><div class="set-title">🔐 ${esc(t('secureTransferTitle'))}</div><div class="set-sub">${esc(t('secureTransferSub'))}</div></div>
      <span class="chev">›</span>
    </div>
  </div>
  <div class="card">
    <div class="set-row tap" onclick="openSub('product-guide')">
      <div><div class="set-title">📖 ${esc(t('setProductGuide'))}</div><div class="set-sub">${esc(t('setProductGuideSub'))}</div></div>
      <span class="chev">›</span>
    </div>
    <div class="set-row tap" onclick="openSub('sys-info')">
      <div><div class="set-title">ℹ️ ${esc(t('setSystemInfo'))}</div><div class="set-sub">${esc(t('setSystemInfoSub'))}</div></div>
      <span class="chev">›</span>
    </div>
    <div class="set-row tap" onclick="openSub('identity')">
      <div><div class="set-title">🛡️ ${esc(t('setIdentity'))}</div><div class="set-sub">${esc(t('setIdentitySub'))}</div></div>
      <span class="chev">›</span>
    </div>
    <div class="set-row tap" onclick="openSub('whats-new')">
      <div><div class="set-title">📋 ${esc(t('setWhatsNew'))}</div><div class="set-sub">${esc(t('setWhatsNewSub'))}</div></div>
      <span class="chev">›</span>
    </div>
  </div>
  <div class="card">
    <div class="set-row">
      <div><div class="set-title">🌐 ${esc(t('setLanguage'))}</div><div class="set-sub">${esc(t('setLanguageSub'))}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="chip ${LANG==='zh'?'on':''}" onclick="setLang('zh')">中文</button>
        <button class="chip ${LANG==='en'?'on':''}" onclick="setLang('en')">EN</button>
        <button class="chip ${LANG==='ms'?'on':''}" onclick="setLang('ms')">BM</button>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="section-head" style="margin-bottom:10px"><h3>${esc(t('setDataStats'))}</h3></div>
    <div class="asset-grid">
      <div><span>${esc(t('setStatTx'))}</span><b>${state.transactions.length}</b></div>
      <div><span>${esc(t('setStatTransfers'))}</span><b>${transferCount}</b></div>
      <div><span>${esc(t('setStatAcc'))}</span><b>${state.accounts.length}</b></div>
      <div><span>${esc(t('setStatGoal'))}</span><b>${state.goals.length}</b></div>
      <div><span>${esc(t('setStatAsset'))}</span><b>${state.assets.length}</b></div>
      <div><span>${esc(t('setStatDebt'))}</span><b>${state.debts.length}</b></div>
      <div><span>${esc(t('setStatGiven'))}</span><b>${state.moneyGiven.length}</b></div>
      <div><span>${esc(t('setStatRepay'))}</span><b>${repayCount}</b></div>
    </div>
  </div>
   <div class="card" style="border:2px solid var(--red);background:#fff5f5">
    <div class="section-head" style="margin-bottom:8px">
      <h3 style="color:var(--red)">${esc(t('dangerZone'))}</h3>
    </div>
    <p style="font-size:12px;line-height:1.6;color:var(--muted);margin:0 0 12px">${esc(t('dangerZoneSub'))}</p>
    <div class="set-row tap" onclick="openResetPage()" style="border-top:none;padding-top:0">
      <div style="min-width:0;flex:1">
        <div class="set-title" style="color:var(--red);font-weight:800">🔴 ${esc(t('resetTitle'))}</div>
        <div class="set-sub">${esc(t('resetDesc'))}</div>
        <div class="set-sub" style="color:var(--red);font-weight:700;margin-top:6px">${esc(t('resetCannotUndo'))}</div>
      </div>
      <span class="chev" style="color:var(--red)">›</span>
    </div>
  </div>
  <p class="about">${esc(t('setAbout', { av:APP_VERSION, dv:DATA_VERSION_LABEL })).replace(/\n/g,'<br>')}</p>`;
}
function viewSentinel(){
  sentinelState = sentinelLoad();
  const r = sentinelRunChecks();
  const overall = r.overall;
  const statusEmoji = overall === 'ok' ? '🟢' : overall === 'warn' ? '🟡' : overall === 'bad' ? '🔴' : '⚪';
  const statusLabel = overall === 'ok' ? t('sentinelStatusOk') : overall === 'warn' ? t('sentinelStatusWarn') : overall === 'bad' ? t('sentinelStatusBad') : t('sentinelStatusUnknown');
  const statusDesc = overall === 'ok' ? t('sentinelStatusOkDesc') : overall === 'warn' ? t('sentinelStatusWarnDesc') : overall === 'bad' ? t('sentinelStatusBadDesc') : t('sentinelStatusUnknownDesc');
  const itemRow = (key) => {
    const item = r.items[key];
    const icon = item.status === 'ok' ? '✓' : item.status === 'warn' ? '⚠' : item.status === 'bad' ? '✕' : '○';
    const color = item.status === 'ok' ? 'c-green' : item.status === 'warn' ? 'c-amber' : item.status === 'bad' ? 'c-red' : 'c-muted';
    const detail = item.detail ? ' · ' + item.detail : '';
    return '<div class="set-row" style="padding:11px 0"><div><div class="set-title">' + icon + ' ' + esc(item.label) + esc(detail) + '</div></div><span class="set-val ' + color + '">' + esc(item.status === 'ok' ? t('sentinelStatusOk') : item.status === 'warn' ? t('sentinelStatusWarn') : item.status === 'bad' ? t('sentinelStatusBad') : t('sentinelStatusUnknown')) + '</span></div>';
  };
  const lastCheckLine = sentinelState.lastCheckAt ? localDateTimeStr(sentinelState.lastCheckAt) : t('sentinelNeverChecked');
  let logHtml = '';
  if(sentinelState.events.length){
    const sorted = sentinelState.events.slice().sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
    const groups = new Map();
    sorted.forEach(ev => {
      const d = localDateStr(ev.eventAt);
      if(!groups.has(d)) groups.set(d, []);
      groups.get(d).push(ev);
    });
    logHtml = Array.from(groups.keys()).map(d => {
      const rows = groups.get(d).map(ev =>
        '<div style="display:flex;gap:8px;padding:8px 0;border-top:1px dashed var(--line);align-items:flex-start">' +
        '<span style="font-size:11px;color:var(--muted);flex:0 0 auto;min-width:56px">' + esc(localTimeSecStr(ev.eventAt)) + '</span>' +
        '<span style="font-size:12.5px;line-height:1.55;color:var(--text);flex:1">' + esc(ev.label) + '</span>' +
        '</div>'
      ).join('');
      return '<div style="margin-top:8px"><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">' + esc(fmtDateLabel(d)) + '</div>' + rows + '</div>';
    }).join('');
  }else{
    logHtml = '<div class="empty" style="padding:16px 8px"><p style="font-size:12.5px">' + esc(t('sentinelNoLog')) + '</p></div>';
  }
  return '' +
  '<div class="card" style="text-align:center;padding:22px 18px">' +
    '<div style="font-size:44px;line-height:1;margin-bottom:8px">🛡️</div>' +
    '<div style="font-size:19px;font-weight:800;color:var(--brand)">' + esc(t('sentinelTitle')) + '</div>' +
    '<div style="font-size:12px;color:var(--muted);margin-top:4px">' + esc(t('sentinelSub')) + '</div>' +
  '</div>' +
  '<div class="card">' +
    '<div class="section-head" style="margin-bottom:8px"><h3>' + esc(t('sentinelStatus')) + '</h3></div>' +
    '<div style="font-size:15px;font-weight:800;color:var(--brand);margin-bottom:6px">' + statusEmoji + ' ' + esc(statusLabel) + '</div>' +
    '<div style="font-size:13px;line-height:1.65;color:var(--text)">' + esc(statusDesc) + '</div>' +
  '</div>' +
  '<div class="card">' +
    itemRow('appLock') + itemRow('pin') + itemRow('password') + itemRow('localData') +
    itemRow('transfer') + itemRow('settings') + itemRow('schema') +
  '</div>' +
  '<div class="card" style="text-align:center">' +
    '<div style="font-size:11.5px;color:var(--muted);margin-bottom:10px">' + esc(t('sentinelLastCheck')) + ': ' + esc(lastCheckLine) + '</div>' +
    '<button class="btn primary block" onclick="sentinelDoCheck()">🛡️ ' + esc(t('sentinelCheckNow')) + '</button>' +
  '</div>' +
  '<div class="card" style="background:#fff8ec;border:1.5px solid var(--amber)">' +
    '<div style="font-size:12px;line-height:1.7;color:var(--text)">' + esc(t('sentinelBackupReminder')) + '</div>' +
    '<button class="btn ghost block" style="margin-top:10px" onclick="jtGoExport()">' + esc(t('sentinelBackupBtn')) + '</button>' +
  '</div>' +
  '<div class="card">' +
    '<div class="section-head" style="margin-bottom:10px"><h3>' + esc(t('sentinelLog')) + '</h3>' +
      (sentinelState.events.length ? '<button class="link" onclick="sentinelClearLog()">' + esc(t('sentinelLogClear')) + '</button>' : '') +
    '</div>' +
    '<p style="font-size:11.5px;color:var(--muted);margin:0 0 10px">' + esc(t('sentinelLogSub')) + '</p>' +
    logHtml +
  '</div>';
}
function viewLockSettings(){
  const autoLock = Number(state.settings.autoLockMinutes) || 0;
  const kind = currentLockKind();
  const opts = [
    { v:0, l:t('lockNever') }, { v:1, l:'1 ' + t('lockMin') }, { v:5, l:'5 ' + t('lockMin') },
    { v:15, l:'15 ' + t('lockMin') }, { v:30, l:'30 ' + t('lockMin') }
  ];
  return `
  <div class="card">
    <div class="set-row">
      <div><div class="set-title">${esc(t('lockModeLabel'))}</div><div class="set-sub">${kind === 'text' ? esc(t('lockModePasswordSub')) : esc(t('lockModePINSub'))}</div></div>
      <span class="set-val">${kind === 'text' ? esc(t('lockModePassword')) : esc(t('lockModePIN'))}</span>
    </div>
  </div>
  <div class="card">
    <div class="set-row tap" onclick="openSetPIN()">
      <div><div class="set-title">🔢 ${esc(t('lockSetPIN'))}</div><div class="set-sub">${esc(t('lockModePINSub'))}</div></div>
      <span class="chev">›</span>
    </div>
    <div class="set-row tap" onclick="openSetPassword()">
      <div><div class="set-title">🔑 ${esc(t('lockSetPassword'))}</div><div class="set-sub">${esc(t('lockModePasswordSub'))}</div></div>
      <span class="chev">›</span>
    </div>
    <div class="set-row tap" onclick="lockApp()">
      <div><div class="set-title">🔒 ${esc(t('lockLockNow'))}</div></div>
      <span class="chev">›</span>
    </div>
  </div>
  <div class="card">
    <div class="set-row">
      <div><div class="set-title">${esc(t('lockAutoLockLabel'))}</div><div class="set-sub">${esc(t('lockAutoLockSub'))}</div></div>
      <span class="set-val">${autoLock <= 0 ? esc(t('lockNever')) : autoLock + ' ' + t('lockMin')}</span>
    </div>
    <div class="chip-row" style="margin:10px 0 0">
      ${ opts.map(o => `<button class="chip ${autoLock===o.v?'on':''}" onclick="setAutoLock(${o.v})">${esc(o.l)}</button>`).join('') }
    </div>
  </div>
  <div class="card">
    <div class="set-row">
      <div><div class="set-title">🧬 ${esc(t('lockBioTitle'))}</div><div class="set-sub">${esc(t('lockBioSub'))}</div></div>
      <button class="switch" disabled style="opacity:.4"><i></i></button>
    </div>
  </div>
  <p class="about">${esc(t('lockHashNote'))}</p>`;
}
function viewDebtDefaults(){
  const on = !!state.settings.debtRepayAffectAccountDefault;
  return `
  <div class="card">
    <div class="set-row">
      <div style="min-width:0;flex:1">
        <div class="set-title">${esc(t('debtRepayAffectDefaultOn'))}</div>
        <div class="set-sub">${esc(t('debtRepayAffectDefaultSub'))}</div>
      </div>
      <button class="switch ${on?'on':''}" onclick="toggleDebtDefault()"><i></i></button>
    </div>
  </div>
  <div class="card">
    <div class="asset-grid">
      <div><span>${esc(t('setStatDebt'))}</span><b>${state.debts.length}</b></div>
      <div><span>${esc(t('debtRepayCount'))}</span><b>${debtTotalRepaymentCount()}</b></div>
    </div>
  </div>
  <p class="about">${esc(t('debtRepayRestore'))}</p>`;
}
function viewSystemInfo(){
  const transferCount = state.transactions.filter(tx => tx.type === 'transfer').length;
  const lockKind = currentLockKind();
  const repayCount = debtTotalRepaymentCount();
  return `
  <div class="card">
    <div class="asset-grid">
      <div><span>${esc(t('versionLabel'))}</span><b>v${esc(APP_VERSION)}</b></div>
      <div><span>${esc(t('dataVersionLabel'))}</span><b>${esc(DATA_VERSION_LABEL)}</b></div>
      <div><span>${esc(t('schemaSeriesLabel'))}</span><b>${esc(SCHEMA_SERIES)}</b></div>
      <div><span>${esc(t('lastUpdated'))}</span><b style="font-size:12px">${esc(localDateStr(META.lastUpdated))} ${esc(localTimeSecStr(META.lastUpdated))}</b></div>
      <div><span>${esc(t('storageLocal'))}</span><b>localStorage</b></div>
      <div><span>${esc(t('lockModeLabel'))}</span><b>${lockKind === 'text' ? esc(t('lockModePassword')) : esc(t('lockModePIN'))}</b></div>
    </div>
  </div>
  <div class="card">
    <div class="section-head" style="margin-bottom:10px"><h3>${esc(t('setDataStats'))}</h3></div>
    <div class="asset-grid">
      <div><span>${esc(t('setStatAcc'))}</span><b>${state.accounts.length}</b></div>
      <div><span>${esc(t('setStatTx'))}</span><b>${state.transactions.length}</b></div>
      <div><span>${esc(t('setStatTransfers'))}</span><b>${transferCount}</b></div>
      <div><span>${esc(t('setStatGoal'))}</span><b>${state.goals.length}</b></div>
      <div><span>${esc(t('setStatAsset'))}</span><b>${state.assets.length}</b></div>
      <div><span>${esc(t('setStatDebt'))}</span><b>${state.debts.length}</b></div>
      <div><span>${esc(t('setStatGiven'))}</span><b>${state.moneyGiven.length}</b></div>
      <div><span>${esc(t('setStatRepay'))}</span><b>${repayCount}</b></div>
      <div><span>${esc(t('setAchievements'))}</span><b>${Object.keys(state.achievements).length}</b></div>
    </div>
  </div>
  <p class="about">${esc(t('dataVersionNote', { av:APP_VERSION, dv:DATA_VERSION_LABEL }))}</p>`;
}

function viewResetJiheng(){
  const s = resetUI.step;
  if(s === 'done')   return viewResetDone();
  if(s === 'error')  return viewResetError();
  if(s === 'processing') return viewResetProcessing();
  const steps = ['warn','type','verify','backup','hold'];
  const curIdx = steps.indexOf(s);
  const stepBar = `<div style="display:flex;gap:6px;margin-bottom:14px">
    ${steps.map((_, i) => `<div style="flex:1;height:4px;border-radius:99px;background:${i <= curIdx ? 'var(--red)' : '#eee'}"></div>`).join('')}
  </div>`;
  let body = '';
  if(s === 'warn')        body = viewResetWarn();
  else if(s === 'type')   body = viewResetType();
  else if(s === 'verify') body = viewResetVerify();
  else if(s === 'backup') body = viewResetBackup();
  else if(s === 'hold')   body = viewResetHold();
  return stepBar + body;
}
function viewResetWarn(){
  return `
  <div class="card" style="border:2px solid var(--red);background:#fff5f5">
    <div class="section-head" style="margin-bottom:10px"><h3 style="color:var(--red)">${esc(t('warnTitle'))}</h3></div>
    <p style="font-size:13.5px;line-height:1.7;font-weight:700;margin:0 0 8px">${esc(t('warnIntro'))}</p>
    <p style="font-size:13px;line-height:1.7;margin:0 0 12px">${esc(t('warnBody'))}</p>
    <p style="font-size:12.5px;font-weight:700;margin:0 0 6px">${esc(t('warnIncludes'))}</p>
    <ul style="margin:0 0 12px;padding-left:18px;font-size:12.5px;line-height:1.8;color:var(--text)">
      <li>${esc(t('warnItemAccounts'))}</li><li>${esc(t('warnItemIncome'))}</li><li>${esc(t('warnItemExpense'))}</li>
      <li>${esc(t('warnItemTransfer'))}</li><li>${esc(t('warnItemDebt'))}</li><li>${esc(t('warnItemRepay'))}</li>
      <li>${esc(t('warnItemMG'))}</li><li>${esc(t('warnItemGoal'))}</li><li>${esc(t('warnItemAsset'))}</li>
      <li>${esc(t('warnItemAch'))}</li><li>${esc(t('warnItemCat'))}</li><li>${esc(t('warnItemLock'))}</li>
      <li>${esc(t('warnItemSettings'))}</li><li>${esc(t('warnItemOther'))}</li>
    </ul>
    <p style="font-size:13px;line-height:1.7;font-weight:700;margin:0 0 8px">${esc(t('warnFinal'))}</p>
    <p style="font-size:13px;line-height:1.7;font-weight:700;color:var(--red);margin:0 0 8px">${esc(t('warnCantUndo'))}</p>
    <p style="font-size:12.5px;line-height:1.7;color:var(--muted);margin:0">${esc(t('resetNotTransfer'))}</p>
  </div>
  <div style="display:flex;gap:10px">
    <button class="btn ghost" style="flex:1" onclick="resetCancel()">${esc(t('cancel'))}</button>
    <button class="btn danger" style="flex:1" onclick="resetGoStep('type')">${esc(t('continueBtn'))}</button>
  </div>`;
}
function viewResetType(){
  const target = 'RESET JIHENG';
  const ok = String(resetUI.typed || '').trim() === target;
  return `
  <div class="card">
    <div class="section-head" style="margin-bottom:8px"><h3>${esc(t('typeTitle'))}</h3></div>
    <p style="font-size:13px;line-height:1.7;margin:0 0 8px">${esc(t('typePrompt'))}</p>
    <p style="font-size:16px;font-weight:800;color:var(--red);letter-spacing:1px;margin:0 0 12px">${esc(target)}</p>
    <label class="field">
      <span class="field-label">${esc(t('typePlaceholder'))}</span>
      <input id="reset-type-input" type="text" value="${esc(resetUI.typed)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" oninput="resetOnType(this.value)">
    </label>
    <p id="reset-type-err" style="font-size:12px;color:var(--red);margin-top:-8px;min-height:0">${resetUI.typed && !ok ? esc(t('typeMismatch')) : ''}</p>
  </div>
  <div style="display:flex;gap:10px">
    <button class="btn ghost" style="flex:1" onclick="resetGoStep('warn')">${esc(t('back'))}</button>
    <button id="reset-type-continue" class="btn danger" style="flex:1" ${ok ? '' : 'disabled'} onclick="resetGoStep('verify')">${esc(t('continueBtn'))}</button>
  </div>`;
}
function viewResetVerify(){
  const kind = currentLockKind();
  const isText = kind === 'text';
  return `
  <div class="card">
    <div class="section-head" style="margin-bottom:8px"><h3>${esc(t('verifyTitle'))}</h3></div>
    <p style="font-size:13px;line-height:1.7;margin:0 0 12px">${esc(isText ? t('verifyPw') : t('verifyPin'))}</p>
    <label class="field">
      <span class="field-label">${esc(isText ? t('verifyPw') : t('verifyPin'))}</span>
      <input id="reset-verify-input" type="password" inputmode="${isText ? 'text' : 'numeric'}" maxlength="128" value="${esc(resetUI.verifyPw)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" oninput="resetOnVerify(this.value)">
    </label>
    ${resetUI.verifyError ? `<p style="font-size:12px;color:var(--red);margin-top:-8px">${esc(resetUI.verifyError)}</p>` : ''}
  </div>
  <div style="display:flex;gap:10px">
    <button class="btn ghost" style="flex:1" onclick="resetGoStep('type')">${esc(t('back'))}</button>
    <button class="btn danger" style="flex:1" onclick="resetDoVerify()">${esc(t('verifyBtn'))}</button>
  </div>`;
}
function viewResetBackup(){
  const detected = resetUI.exportedInSession ? t('backupDetected') : t('backupNotDetected');
  return `
  <div class="card" style="border:2px solid var(--amber);background:#fff8ec">
    <div class="section-head" style="margin-bottom:8px"><h3 style="color:var(--amber)">${esc(t('backupTitle'))}</h3></div>
    <p style="font-size:13px;line-height:1.7;margin:0 0 12px">${esc(t('backupBody'))}</p>
    <p style="font-size:12px;font-weight:700;color:${resetUI.exportedInSession ? 'var(--green)' : 'var(--muted)'};margin:0">${esc(detected)}</p>
  </div>
  <button class="btn ghost block" onclick="resetExportBackup()">${esc(t('backupExport'))}</button>
  <div style="display:flex;gap:10px;margin-top:10px">
    <button class="btn ghost" style="flex:1" onclick="resetGoStep('verify')">${esc(t('back'))}</button>
    <button class="btn danger" style="flex:1" onclick="resetGoStep('hold')">${esc(t('backupContinue'))}</button>
  </div>`;
}
function viewResetHold(){
  const p = resetUI.holdProgress;
  return `
  <div class="card" style="border:2px solid var(--red);background:#fff5f5;text-align:center;padding:24px 16px">
    <div style="font-size:13px;line-height:1.7;font-weight:700;margin-bottom:8px">${esc(t('finalTitle'))}</div>
    <div style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:16px">${esc(t('finalHoldHint'))}</div>
    <button id="reset-hold-btn" class="btn danger" style="width:100%;padding:22px 16px;font-size:15px;font-weight:800;user-select:none;-webkit-user-select:none;touch-action:none" onmousedown="resetHoldStart(event)" ontouchstart="resetHoldStart(event)" onmouseup="resetHoldEnd()" ontouchend="resetHoldEnd()" onmouseleave="resetHoldEnd()" ontouchcancel="resetHoldEnd()" onblur="resetHoldEnd()" ${resetUI.holding ? 'style="width:100%;padding:22px 16px;font-size:15px;font-weight:800;background:#a33"' : ''}>
      🔴 ${esc(t('finalHold'))}
    </button>
    <div style="margin-top:14px;font-size:12px;color:var(--red);font-weight:700" id="reset-hold-progress">${resetUI.holding ? esc(t('finalHoldProgress', { n: p })) : ''}</div>
  </div>
  <div style="display:flex;gap:10px">
    <button class="btn ghost" style="flex:1" onclick="resetGoStep('backup')">${esc(t('back'))}</button>
  </div>`;
}
function viewResetDone(){
  return `
  <div class="card" style="border:2px solid var(--green);background:#e7f8f1;text-align:center;padding:24px 16px">
    <div style="font-size:40px;line-height:1;margin-bottom:10px">✓</div>
    <div style="font-size:16px;font-weight:800;color:var(--green);margin-bottom:8px">${esc(t('successTitle'))}</div>
    <p style="font-size:13px;line-height:1.7;margin:0">${esc(t('successBody'))}</p>
  </div>
  <button class="btn primary block" onclick="resetCancel()">${esc(t('ok'))}</button>`;
}
function viewResetError(){
  return `
  <div class="card" style="border:2px solid var(--red);background:#fff5f5;text-align:center;padding:24px 16px">
    <div style="font-size:40px;line-height:1;margin-bottom:10px">⚠️</div>
    <div style="font-size:16px;font-weight:800;color:var(--red);margin-bottom:8px">${esc(t('errorTitle'))}</div>
    <p style="font-size:13px;line-height:1.7;margin:0">${esc(t('errorBody'))}</p>
  </div>
  <button class="btn ghost block" onclick="resetCancel()">${esc(t('back'))}</button>`;
}
function viewResetProcessing(){
  return `
  <div class="card" style="text-align:center;padding:32px 16px">
    <div style="font-size:36px;line-height:1;margin-bottom:12px">⏳</div>
    <div style="font-size:15px;font-weight:800;color:var(--brand);margin-bottom:8px">${esc(t('processing'))}</div>
    <p style="font-size:12.5px;line-height:1.7;color:var(--muted);margin:0">${esc(t('processingDoNotClose'))}</p>
  </div>`;
}
function viewIdentity(){
  return `${renderProductNotice()}
  <div class="card"><div style="font-size:13px;line-height:1.7;color:var(--muted)">
    积衡 Jiheng records the user's real-world money.<br>
    积衡 Jiheng does not hold or handle real-world money.<br>
    积衡 Jiheng is not a bank, e-wallet, payment, or remittance service.
  </div></div>`;
}
function viewProductGuide(){
  const items = [
    { icon:'🏛️', title:t('guideAccountsTitle'), desc:t('guideAccountsDesc') }, { icon:'🧾', title:t('guideTxTitle'), desc:t('guideTxDesc') },
    { icon:'⇄', title:t('guideTransferTitle'), desc:t('guideTransferDesc') }, { icon:'🗂', title:t('guideRecordsTitle'), desc:t('guideRecordsDesc') },
    { icon:'🤝', title:t('guideDebtsTitle'), desc:t('guideDebtsDesc') }, { icon:'💰', title:t('guideRepayTitle'), desc:t('guideRepayDesc') },
    { icon:'🎁', title:t('guideMoneyGivenTitle'), desc:t('guideMoneyGivenDesc') }, { icon:'🎯', title:t('guideGoalTitle'), desc:t('guideGoalDesc') },
    { icon:'📦', title:t('guideAssetTitle'), desc:t('guideAssetDesc') }, { icon:'📊', title:t('guideStatsTitle'), desc:t('guideStatsDesc') },
    { icon:'🔎', title:t('guideSearchTitle'), desc:t('guideSearchDesc') }, { icon:'⏱', title:t('guideTimeTitle'), desc:t('guideTimeDesc') },
    { icon:'🏆', title:t('guideAchTitle'), desc:t('guideAchDesc') }, { icon:'🔒', title:t('guideLockTitle'), desc:t('guideLockDesc') },
    { icon:'💾', title:t('guideDataTitle'), desc:t('guideDataDesc') }, { icon:'🌐', title:t('guideLangTitle'), desc:t('guideLangDesc') },
    { icon:'👁', title:t('guidePrivacyTitle'), desc:t('guidePrivacyDesc') }, { icon:'📶', title:t('guideLocalTitle'), desc:t('guideLocalDesc') },
    { icon:'🚀', title:t('guideSplashTitle'), desc:t('guideSplashDesc') }, { icon:'📲', title:t('guidePwaTitle'), desc:t('guidePwaDesc') }
  ];
  return `
  <p class="about" style="margin:0 0 10px">${esc(t('guideIntro'))}</p>
  ${items.map(it => `<div class="guide-item"><div class="guide-icon">${it.icon}</div><div class="guide-body"><div class="guide-title">${esc(it.title)}</div><div class="guide-desc">${esc(it.desc)}</div></div></div>`).join('')}
  <p class="about">${esc(t('dataVersionNote', { av:APP_VERSION, dv:DATA_VERSION_LABEL }))}</p>`;
}
function viewWhatsNew(){
  return `
  ${ CHANGELOG.slice().reverse().map(c => `<div class="version-card"><div class="version-head"><span class="version-no">v${esc(c.version)}</span><span class="version-date">${esc(c.date)}</span></div>${ changelogTitle(c) ? `<div class="version-title">${esc(changelogTitle(c))}</div>` : '' }<ul class="version-list">${ changelogItems(c).map(it => `<li>${esc(it)}</li>`).join('') }</ul></div>`).join('') }
  <p class="about">${esc(t('dataVersionNote', { av:APP_VERSION, dv:DATA_VERSION_LABEL }))}</p>`;
}
function setAutoLock(v){ state.settings.autoLockMinutes = v; saveState(); render(); }
