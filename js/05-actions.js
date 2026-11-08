/* =========================================================================
   积衡 Jiheng - 表单操作、弹窗、记账逻辑
   ========================================================================= */

function openSheet(opts){
  const root = document.getElementById('sheet-root');
  root.innerHTML = `
    <div class="mask"></div>
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-head"><h3>${esc(opts.title)}</h3><button type="button" class="icon-btn" data-close>✕</button></div>
      <form id="sheet-form" novalidate autocomplete="off">
        <div class="sheet-body">${opts.body}</div>
        <div class="sheet-foot">
          <button type="button" class="btn ghost" data-close>${esc(t('cancel'))}</button>
          <button type="submit" class="btn primary">${esc(opts.submitText || t('save'))}</button>
        </div>
      </form>
    </div>`;
  root.classList.add('show');
  document.body.classList.add('no-scroll');
  root.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeSheet));
  root.querySelector('.mask').addEventListener('click', closeSheet);
  const form = root.querySelector('#sheet-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {};
    new FormData(form).forEach((v,k) => { data[k] = v; });
    let ok = true;
    if(opts.onSubmit){
      try { ok = await opts.onSubmit(data, form); }
      catch(err){ console.error('[Jiheng openSheet] submit error:', err); ok = false; }
    }
    if(ok !== false) closeSheet();
  });
  if(opts.afterRender) opts.afterRender(root);
}
function openActionSheet(title, actions){
  const root = document.getElementById('sheet-root');
  root.innerHTML = `
    <div class="mask"></div>
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close>✕</button></div>
      <div class="sheet-body action-list">
        ${actions.map((a,i) => `<button type="button" class="action-item ${a.danger?'danger':''}" data-i="${i}"><span>${a.icon || ''}</span>${esc(a.label)}</button>`).join('')}
      </div>
    </div>`;
  root.classList.add('show'); document.body.classList.add('no-scroll');
  root.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeSheet));
  root.querySelector('.mask').addEventListener('click', closeSheet);
  root.querySelectorAll('.action-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = actions[Number(btn.dataset.i)];
      closeSheet();
      setTimeout(() => { if(a && a.onClick) a.onClick(); }, 280);
    });
  });
}
function confirmDialog(msg, onYes){
  const root = document.getElementById('sheet-root');
  root.innerHTML = `
    <div class="mask"></div>
    <div class="sheet small">
      <div class="sheet-body">
        <p class="confirm-msg">${esc(msg)}</p>
        <div class="confirm-btns">
          <button type="button" class="btn ghost" data-close>${esc(t('cancel'))}</button>
          <button type="button" class="btn danger" id="cf-yes">${esc(t('confirm'))}</button>
        </div>
      </div>
    </div>`;
  root.classList.add('show'); document.body.classList.add('no-scroll');
  root.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeSheet));
  root.querySelector('.mask').addEventListener('click', closeSheet);
  root.querySelector('#cf-yes').addEventListener('click', () => { closeSheet(); setTimeout(() => onYes(), 280); });
}
function closeSheet(){
  const root = document.getElementById('sheet-root');
  root.classList.remove('show'); document.body.classList.remove('no-scroll');
  const el = root;
  setTimeout(() => { if(!el.classList.contains('show')) el.innerHTML = ''; }, 340);
}
let toastTimer = null;
function toast(msg){
  const root = document.getElementById('toast-root');
  root.innerHTML = `<div class="toast">${esc(msg)}</div>`;
  const el = root.querySelector('.toast');
  requestAnimationFrame(() => el.classList.add('in'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => { if(root.firstChild === el) root.innerHTML = ''; }, 320);
  }, 2200);
}
function openGroupedPicker(opts){
  const sheetRoot = document.getElementById('sheet-root');
  const parentSheet = sheetRoot.querySelector('.sheet');
  let pickerRoot = document.getElementById('picker-root');
  if(!pickerRoot){ pickerRoot = document.createElement('div'); pickerRoot.id = 'picker-root'; pickerRoot.style.cssText = 'position:fixed;inset:0;z-index:150;pointer-events:none;'; document.body.appendChild(pickerRoot); }
  const labelFor = opts.labelFor || (id => id);
  const groupLabelFor = opts.groupLabelFor || (id => id);
  const iconFor = opts.iconFor || (id => '');
  pickerRoot.innerHTML = `
    <div class="mask" id="picker-mask" style="position:absolute;inset:0;background:rgba(28,24,48,.45);opacity:0;transition:opacity .26s;"></div>
    <div class="sheet" style="position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:#fff;border-radius:26px 26px 0 0;max-height:92vh;overflow-y:auto;transform:translateY(100%);transition:transform .32s cubic-bezier(.32,.72,0,1);padding-bottom:calc(16px + var(--safe-b));">
      <div class="sheet-handle"></div>
      <div class="sheet-head" style="display:flex;align-items:center;justify-content:space-between;padding:8px 18px 12px;position:sticky;top:0;background:#fff;z-index:2;border-radius:26px 26px 0 0;">
        <button type="button" class="icon-btn" id="picker-back" style="width:32px;height:32px;font-size:14px;box-shadow:none;background:var(--brand-soft);">←</button>
        <h3 style="margin:0;font-size:16.5px;font-weight:700;color:var(--brand);">${esc(opts.title || t('pickTitle'))}</h3>
        <button type="button" class="icon-btn" id="picker-close" style="width:32px;height:32px;font-size:14px;box-shadow:none;background:var(--brand-soft);">✕</button>
      </div>
      <div class="sheet-body" style="padding:0 18px;">
        ${opts.groups.map(g => `<div class="opt-label">${esc(groupLabelFor(g.group))}</div><div class="opt-group">${g.items.map(id => `<button type="button" class="opt-item ${opts.value===id?'on':''}" data-id="${esc(id)}">${iconFor(id) ? iconFor(id)+' ' : ''}${esc(labelFor(id))}</button>`).join('')}</div>`).join('')}
        ${ opts.allowCustom ? `<div class="opt-label">${esc(t('pickCustom'))}</div><label class="field" style="margin-top:2px"><input type="text" id="picker-custom-input" maxlength="80" placeholder="${esc(opts.customPlaceholder || t('catCustomPlaceholder'))}" value="${esc(opts.customValue || '')}"></label><button type="button" class="btn primary block" id="picker-custom-save">${esc(t('pickOther'))}</button>` : '' }
        <div style="height:8px"></div>
      </div>
    </div>`;
  pickerRoot.style.pointerEvents = 'auto';
  function closePicker(){
    const inner = pickerRoot.querySelector('.sheet'); const mask = pickerRoot.querySelector('#picker-mask');
    if(inner) inner.style.transform = 'translateY(100%)';
    if(mask) mask.style.opacity = '0';
    setTimeout(() => { pickerRoot.innerHTML = ''; pickerRoot.style.pointerEvents = 'none'; const ps = sheetRoot.querySelector('.sheet'); if(ps) ps.style.transform = 'translateY(0)'; }, 320);
  }
  if(parentSheet){ parentSheet.style.transform = 'translateY(100%)'; }
  const pickerSheet = pickerRoot.querySelector('.sheet'); const pickerMask = pickerRoot.querySelector('#picker-mask');
  requestAnimationFrame(() => { if(pickerMask) pickerMask.style.opacity = '1'; if(pickerSheet) pickerSheet.style.transform = 'translateY(0)'; });
  pickerRoot.querySelector('#picker-close').addEventListener('click', closePicker);
  pickerRoot.querySelector('#picker-back').addEventListener('click', closePicker);
  pickerMask.addEventListener('click', closePicker);
  pickerRoot.querySelectorAll('.opt-item').forEach(btn => { btn.addEventListener('click', () => { const id = btn.dataset.id; if(opts.onPick) opts.onPick(id); closePicker(); }); });
  const cs = pickerRoot.querySelector('#picker-custom-save');
  if(cs){ cs.addEventListener('click', () => { const val = (pickerRoot.querySelector('#picker-custom-input').value || '').trim(); if(!val) return; if(opts.onCustom) opts.onCustom(val); closePicker(); }); }
}

/* ============================ 账户表单 ============================ */
function openAccountForm(){
  openSheet({
    title: t('createAccount'), submitText: t('add'),
    body: `
      <label class="field"><span class="field-label">${esc(t('accountName'))}</span><input name="name" type="text" required maxlength="80" placeholder="${esc(t('accountNamePlaceholder'))}"></label>
      <label class="field"><span class="field-label">${esc(t('accountType'))}</span><select name="type">${Object.entries(ACC_TYPES).map(([k,v]) => `<option value="${k}">${v.icon} ${esc(v.label)}</option>`).join('')}</select></label>
      <label class="field"><span class="field-label">${esc(t('initialBalance'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="initial" type="number" step="0.01" min="0" placeholder="0.00" inputmode="decimal"></div></label>
      <p class="hint">${esc(t('initialHint'))}</p>`,
    onSubmit(d){
      const name = (d.name || '').trim();
      if(!name){ toast(t('catEnterName')); return false; }
      const nowIso = nowISO();
      const acc = { id: uid(), name, type: d.type || 'other', balance: 0, note: '', timezone: APP_TZ, eventAt: nowIso, createdAt: Date.now(), updatedAt: Date.now(), editHistory: [] };
      const initial = parseFloat(d.initial);
      if(initial && initial > 0){
        const amt = round2(initial);
        acc.balance = amt;
        state.accounts.push(acc);
        state.transactions.push({ id: uid(), type:'income', amount: amt, eventAt: nowIso, date: nowIso, timezone: APP_TZ, category:'other_income', method:'cash', methodCustom:'', accountId: acc.id, note: t('initialBalanceNote'), linkedDebtId: null, linkedRepaymentId: null, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() });
      }else{ state.accounts.push(acc); }
      afterChange(); toast(t('accountCreated')); return true;
    }
  });
}
function openAccountMenu(id){
  const a = getAccount(id); if(!a) return;
  openActionSheet(a.name, [
    { label: t('renameAccount'), icon:'✏️', onClick: () => renameAccount(id) },
    { label: t('deleteAccount'), danger:true, onClick: () => deleteAccount(id) }
  ]);
}
function renameAccount(id){
  const a = getAccount(id); if(!a) return;
  openSheet({
    title: t('renameAccount'),
    body: `<label class="field"><span class="field-label">${esc(t('accountName'))}</span><input name="name" type="text" required maxlength="80" value="${esc(a.name)}"></label>`,
    onSubmit(d){
      const name = (d.name || '').trim(); if(!name) return false;
      a.name = name; a.updatedAt = Date.now();
      if(!Array.isArray(a.editHistory)) a.editHistory = [];
      a.editHistory.push({ at: nowISO(), action: 'edit' });
      afterChange(); toast(t('accountUpdated')); return true;
    }
  });
}
function deleteAccount(id){
  const a = getAccount(id); if(!a) return;
  if(Math.abs(Number(a.balance)||0) > 0.001){ toast(t('accountHasBalance')); return; }
  const used = state.transactions.some(tx => tx.accountId === id || tx.toAccountId === id) || state.moneyGiven.some(m => m.accountId === id);
  confirmDialog(used ? t('accountDeleteUsed') : t('accountDeleteConfirm'), () => { state.accounts = state.accounts.filter(x => x.id !== id); afterChange(); toast(t('accountDeleted')); });
}
function accountOptions(selected, excludeId){
  return state.accounts.filter(a => a.id !== excludeId).map(a => `<option value="${a.id}" ${selected===a.id?'selected':''}>${esc(a.name)}（${fmtNum(a.balance||0)}）</option>`).join('');
}

/* ============================ 记录表单 ============================ */
function openIncomeForm(presetAccountId){
  if(!state.accounts.length){ toast(t('noAccountWarn')); return; }
  const initialCat = allIncomeIds()[0]; const initialMethod = 'cash';
  openSheet({
    title: t('recordIncome'), submitText: t('saveIncome'),
    body: `
      <label class="field"><span class="field-label">${esc(t('amount'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal"></div></label>
      <div class="field"><span class="field-label">${esc(t('category'))}</span>${renderCategoryPickerButton('income', initialCat, incomeCatLabel(initialCat))}</div>
      <div class="field"><span class="field-label">${esc(t('incomeMethod'))}</span>${renderMethodPickerButton(initialMethod, methodLabel(initialMethod), '')}</div>
      <label class="field"><span class="field-label">${esc(t('account'))}</span><select name="accountId">${accountOptions(presetAccountId)}</select></label>
      <div class="two-col"><label class="field"><span class="field-label">${esc(t('date'))}</span><input name="date" type="date" value="${nowLocalDate()}" required></label><label class="field"><span class="field-label">${esc(t('time'))}</span><input name="time" type="time" step="1" value="${nowLocalTime()}" required></label></div>
      <label class="field"><span class="field-label">${esc(t('note'))}</span><textarea name="note" maxlength="4000" placeholder="${esc(t('notePlaceholder'))}"></textarea></label>
      <label class="field"><span class="field-label">${esc(t('recurringLabel'))}</span><select name="recurring"><option value="">${esc(t('recurringNo'))}</option><option value="1">${esc(t('recurringYes'))}</option></select></label>`,
    onSubmit(d){
      const amount = round2(parseFloat(d.amount)); if(!(amount > 0)){ toast(t('invalidAmount')); return false; }
      const acc = getAccount(d.accountId); if(!acc){ toast(t('accountNotExist')); return false; }
      acc.balance = round2((Number(acc.balance)||0) + amount);
      const eventAt = combineDateTime(d.date || nowLocalDate(), d.time || nowLocalTime());
      state.transactions.push({ id: uid(), type: 'income', amount, eventAt, date: eventAt, timezone: APP_TZ, category: d.category || initialCat, method: d.method || '', methodCustom: d.methodCustom || '', accountId: acc.id, note: (d.note || ''), recurring: !!d.recurring, linkedDebtId: null, linkedRepaymentId: null, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() });
      afterChange(); toast(t('incomeSaved')); return true;
    },
    afterRender(root){ bindCategoryPicker(root, 'income'); bindMethodPicker(root); }
  });
}
function openExpenseForm(presetAccountId){
  if(!state.accounts.length){ toast(t('noAccountWarn')); return; }
  const initialCat = allExpenseIds()[0]; const initialMethod = 'cash';
  openSheet({
    title: t('recordExpense'), submitText: t('saveExpense'),
    body: `
      <label class="field"><span class="field-label">${esc(t('amount'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal"></div></label>
      <div class="field"><span class="field-label">${esc(t('category'))}</span>${renderCategoryPickerButton('expense', initialCat, expenseCatLabel(initialCat))}</div>
      <div class="field"><span class="field-label">${esc(t('expenseMethod'))}</span>${renderMethodPickerButton(initialMethod, methodLabel(initialMethod), '')}</div>
      <label class="field"><span class="field-label">${esc(t('account'))}</span><select name="accountId">${accountOptions(presetAccountId)}</select></label>
      <div class="two-col"><label class="field"><span class="field-label">${esc(t('date'))}</span><input name="date" type="date" value="${nowLocalDate()}" required></label><label class="field"><span class="field-label">${esc(t('time'))}</span><input name="time" type="time" step="1" value="${nowLocalTime()}" required></label></div>
      <label class="field"><span class="field-label">${esc(t('note'))}</span><textarea name="note" maxlength="4000" placeholder="${esc(t('notePlaceholder'))}"></textarea></label>
      <label class="field"><span class="field-label">${esc(t('recurringLabelExp'))}</span><select name="recurring"><option value="">${esc(t('recurringNo'))}</option><option value="1">${esc(t('recurringYes'))}</option></select></label>`,
    onSubmit(d){
      const amount = round2(parseFloat(d.amount)); if(!(amount > 0)){ toast(t('invalidAmount')); return false; }
      const acc = getAccount(d.accountId); if(!acc){ toast(t('accountNotExist')); return false; }
      if(round2(Number(acc.balance)||0) < amount){ toast(t('insufficientBalance')); return false; }
      acc.balance = round2((Number(acc.balance)||0) - amount);
      const eventAt = combineDateTime(d.date || nowLocalDate(), d.time || nowLocalTime());
      state.transactions.push({ id: uid(), type: 'expense', amount, eventAt, date: eventAt, timezone: APP_TZ, category: d.category || initialCat, subCategory: '', method: d.method || '', methodCustom: d.methodCustom || '', accountId: acc.id, note: (d.note || ''), recurring: !!d.recurring, linkedDebtId: null, linkedRepaymentId: null, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() });
      afterChange(); toast(t('expenseSaved')); return true;
    },
    afterRender(root){ bindCategoryPicker(root, 'expense'); bindMethodPicker(root); }
  });
}
function openTransferForm(presetFrom){
  if(state.accounts.length < 2){ toast(t('needTwoAccounts')); return; }
  const toDefault = state.accounts.find(a => a.id !== presetFrom)?.id || state.accounts[1].id;
  openSheet({
    title: t('recordTransfer'), submitText: t('saveTransfer'),
    body: `
      <label class="field"><span class="field-label">${esc(t('fromAccount'))}</span><select name="fromId">${accountOptions(presetFrom)}</select></label>
      <label class="field"><span class="field-label">${esc(t('toAccount'))}</span><select name="toId">${accountOptions(toDefault, presetFrom)}</select></label>
      <label class="field"><span class="field-label">${esc(t('amount'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal"></div></label>
      <div class="two-col"><label class="field"><span class="field-label">${esc(t('date'))}</span><input name="date" type="date" value="${nowLocalDate()}" required></label><label class="field"><span class="field-label">${esc(t('time'))}</span><input name="time" type="time" step="1" value="${nowLocalTime()}" required></label></div>
      <label class="field"><span class="field-label">${esc(t('note'))}</span><textarea name="note" maxlength="4000" placeholder="${esc(t('notePlaceholder'))}"></textarea></label>
      <p class="hint">${esc(t('transferHint'))}</p>`,
    onSubmit(d){
      const amount = round2(parseFloat(d.amount)); if(!(amount > 0)){ toast(t('invalidAmount')); return false; }
      if(d.fromId === d.toId){ toast(t('sameAccount')); return false; }
      const from = getAccount(d.fromId), to = getAccount(d.toId);
      if(!from || !to){ toast(t('accountNotExist')); return false; }
      if(round2(Number(from.balance)||0) < amount){ toast(t('insufficientBalance')); return false; }
      from.balance = round2((Number(from.balance)||0) - amount);
      to.balance   = round2((Number(to.balance)||0)   + amount);
      const eventAt = combineDateTime(d.date || nowLocalDate(), d.time || nowLocalTime());
      state.transactions.push({ id: uid(), type: 'transfer', amount, eventAt, date: eventAt, timezone: APP_TZ, accountId: from.id, toAccountId: to.id, note: (d.note || ''), linkedDebtId: null, linkedRepaymentId: null, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() });
      afterChange(); toast(t('transferDone')); return true;
    }
  });
}

/* ============================ Debt Form (修复算错账 Bug 的地方) ============================ */
function openDebtForm(presetId){
  const editing = presetId ? getDebt(presetId) : null;
  const initialPurpose = 'food_debt'; const initialMethod = 'cash';
  const initialLinkMode = editing ? (editing.linkMode || 'record_only') : 'record_only';
  const initialAccountId = editing ? (editing.linkedAccountId || '') : (state.accounts[0] ? state.accounts[0].id : '');
  openSheet({
    title: editing ? t('debtEdit') : t('debtNew'), submitText: editing ? t('save') : t('add'),
    body: `
      <label class="field"><span class="field-label">${esc(t('debtDirection'))}</span><select name="direction" id="debt-direction"><option value="i_owe" ${editing && editing.direction==='i_owe'?'selected':''}>${esc(t('debtDirIOwe'))}</option><option value="owe_me" ${editing && editing.direction==='owe_me'?'selected':''}>${esc(t('debtDirOweMe'))}</option></select></label>
      <label class="field"><span class="field-label">${esc(t('debtPerson'))}</span><input name="person" type="text" required maxlength="80" placeholder="${esc(t('debtPersonPlaceholder'))}" value="${editing?esc(editing.person):''}"></label>
      <label class="field"><span class="field-label">${esc(t('debtAmount'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal" value="${editing?debtOriginalAmount(editing):''}"></div></label>
      <div class="field"><span class="field-label">${esc(t('debtPurpose'))}</span>${renderPurposePickerButton('debt', editing?editing.purpose:initialPurpose, editing?editing.purposeCustom:'')}</div>
      <div class="field"><span class="field-label">${esc(t('debtMethod'))}</span>${renderMethodPickerButton(editing?editing.method:initialMethod, methodLabel(editing?editing.method:initialMethod), editing?editing.methodCustom:'')}</div>
      <label class="field"><span class="field-label">${esc(t('debtLinkMode'))}</span><select name="linkMode" id="debt-link-mode"><option value="record_only" ${initialLinkMode==='record_only'?'selected':''}>${esc(t('debtLinkRecordOnly'))}</option><option value="account" ${initialLinkMode==='account'?'selected':''}>${esc(t('debtLinkAccount'))}</option></select></label>
      <p class="hint" id="debt-link-hint">${esc(t('debtLinkHintRecordOnly'))}</p>
      <label class="field" id="debt-linked-account-wrap" style="display:${initialLinkMode==='account'?'block':'none'}"><span class="field-label">${esc(t('debtLinkedAccount'))}</span><select name="linkedAccountId">${accountOptions(initialAccountId)}</select></label>
      <div class="two-col"><label class="field"><span class="field-label">${esc(t('debtDate'))}</span><input name="date" type="date" required value="${editing?localDateStr(editing.eventAt||editing.date):nowLocalDate()}"></label><label class="field"><span class="field-label">${esc(t('debtTime'))}</span><input name="time" type="time" step="1" required value="${editing?localTimeSecStr(editing.eventAt||editing.date):nowLocalTime()}"></label></div>
      <label class="field"><span class="field-label">${esc(t('debtDueDate'))}</span><input name="dueDate" type="date" value="${editing && editing.dueDate ? esc(editing.dueDate) : ''}"></label>
      <label class="field"><span class="field-label">${esc(t('debtReason'))}</span><textarea name="reason" maxlength="4000" placeholder="${esc(t('debtReasonPlaceholder'))}">${editing?esc(editing.reason||''):''}</textarea></label>
      <p class="hint">${esc(t('debtImportantNote'))}</p>`,
    onSubmit(d){
      const person = (d.person || '').trim(); const amount = round2(parseFloat(d.amount));
      if(!person){ toast(t('catEnterName')); return false; }
      if(!(amount > 0)){ toast(t('invalidAmount')); return false; }
      const eventAt = combineDateTime(d.date || nowLocalDate(), d.time || nowLocalTime());
      const linkMode = d.linkMode === 'account' ? 'account' : 'record_only';
      const linkedAccountId = linkMode === 'account' ? d.linkedAccountId : null;

      if(editing){
        if(editing.linkMode === 'account' && editing.linkedAccountId){
          const oldAcc = getAccount(editing.linkedAccountId);
          if(oldAcc){ if(editing.direction === 'owe_me') oldAcc.balance = round2((Number(oldAcc.balance)||0) + debtOriginalAmount(editing)); else oldAcc.balance = round2((Number(oldAcc.balance)||0) - debtOriginalAmount(editing)); }
        }
        if(linkMode === 'account'){
          const acc = getAccount(linkedAccountId); if(!acc){ toast(t('accountNotExist')); return false; }
          if(d.direction === 'owe_me'){ if(round2(Number(acc.balance)||0) < amount){ toast(t('insufficientBalance')); return false; } acc.balance = round2((Number(acc.balance)||0) - amount); }else{ acc.balance = round2((Number(acc.balance)||0) + amount); }
        }
        editing.direction = d.direction; editing.person = person; editing.amount = amount; editing.originalAmount = amount;
        editing.purpose = (d.purpose || '').trim(); editing.purposeCustom = (d.purposeCustom || '').trim(); editing.method = (d.method || '').trim(); editing.methodCustom = (d.methodCustom || '').trim();
        editing.eventAt = eventAt; editing.date = eventAt; editing.originalEventAt = eventAt; editing.dueDate = d.dueDate || ''; editing.reason = (d.reason || ''); editing.note = d.reason || '';
        editing.linkMode = linkMode; editing.linkedAccountId = linkedAccountId; editing.updatedAt = Date.now();
        if(!Array.isArray(editing.editHistory)) editing.editHistory = [];
        editing.editHistory.push({ at: nowISO(), action: 'edit' });
        const paid = debtTotalPaid(editing); editing.paid = paid; editing.remainingAmount = round2(Math.max(amount - paid, 0));
        if(editing.status !== 'cancelled'){ if(paid >= amount - 0.001 && amount > 0) editing.status = 'paid'; else if(paid > 0) editing.status = 'partial'; else editing.status = 'unpaid'; }
        afterChange(); toast(t('debtUpdated'));
      }else{
        const acc = linkMode === 'account' ? getAccount(linkedAccountId) : null;
        if(linkMode === 'account'){
          if(!acc){ toast(t('accountNotExist')); return false; }
          if(d.direction === 'owe_me'){ if(round2(Number(acc.balance)||0) < amount){ toast(t('insufficientBalance')); return false; } acc.balance = round2((Number(acc.balance)||0) - amount); }else{ acc.balance = round2((Number(acc.balance)||0) + amount); }
          
          // 🔥 关键修复：联动账户时，自动补一笔流水记录，保证总额对得上
          state.transactions.push({
            id: uid(), type: d.direction === 'owe_me' ? 'expense' : 'income', amount: amount,
            eventAt: eventAt, date: eventAt, timezone: APP_TZ,
            category: d.direction === 'owe_me' ? 'other_exp' : 'other_income',
            subCategory: '', method: (d.method || '').trim(), methodCustom: (d.methodCustom || '').trim(),
            accountId: acc.id, note: '欠款联动记录',
            linkedDebtId: null, linkedRepaymentId: null, editHistory: [],
            createdAt: Date.now(), updatedAt: Date.now()
          });
        }
        const eventId = 'EVT-' + Date.now().toString(36).toUpperCase();
        state.debts.push({
          id: uid(), eventId, direction: d.direction || 'i_owe', person, amount, originalAmount: amount, paid: 0, remainingAmount: amount,
          purpose: (d.purpose || '').trim(), purposeCustom: (d.purposeCustom || '').trim(), method: (d.method || '').trim(), methodCustom: (d.methodCustom || '').trim(),
          eventAt, date: eventAt, originalEventAt: eventAt, timezone: APP_TZ, dueDate: d.dueDate || '', reason: (d.reason || ''), note: d.reason || '',
          repayments: [], payments: [], status: 'unpaid', linkMode, linkedAccountId, originalTransactionId: null, editHistory: [], createdAt: Date.now(), updatedAt: Date.now()
        });
        saveState(); afterChange(); toast(t('debtCreated'));
      }
      return true;
    },
    afterRender(root){
      bindPurposePicker(root, 'debt'); bindMethodPicker(root);
      const sel = root.querySelector('#debt-link-mode'); const hint = root.querySelector('#debt-link-hint'); const wrap = root.querySelector('#debt-linked-account-wrap');
      if(sel && hint && wrap){
        const update = () => { if(sel.value === 'account'){ hint.textContent = t('debtLinkHintLinked'); wrap.style.display = 'block'; }else{ hint.textContent = t('debtLinkHintRecordOnly'); wrap.style.display = 'none'; } };
        sel.addEventListener('change', update); update();
      }
    }
  });
}

function openRepayForm(debtId, presetRepayId){
  const d = getDebt(debtId); if(!d){ toast(t('debtNotExist')); return; }
  if(d.status === 'cancelled'){ toast(t('debtStatusCancelled')); return; }
  const editing = presetRepayId ? debtRepayments(d).find(r => r.id === presetRepayId) : null;
  const remainNow = debtRemaining(d);
  const maxAllow = editing ? round2(remainNow + Number(editing.amount || 0)) : remainNow;
  const defaultAffect = editing ? !!editing.affectAccount : !!state.settings.debtRepayAffectAccountDefault;
  const initialMethod = editing ? (editing.method || 'cash') : 'cash'; const initialMethodCustom = editing ? (editing.methodCustom || '') : '';
  const initialMethodLabel = initialMethodCustom || methodLabel(initialMethod);
  const initialAccountId = editing ? (editing.accountId || '') : (state.accounts[0] ? state.accounts[0].id : '');
  const initialDate = editing ? localDateStr(editing.eventAt) : nowLocalDate(); const initialTime = editing ? localTimeSecStr(editing.eventAt) : nowLocalTime();
  const initialNote = editing ? (editing.note || '') : ''; const initialAmount = editing ? Number(editing.amount || 0) : '';

  openSheet({
    title: editing ? t('debtEditRepay') : t('debtAddRepay'), submitText: editing ? t('save') : t('debtRepayBtn'),
    body: `
      <div class="asset-rows" style="margin-bottom:14px"><div class="ar"><span>${esc(t('debtPerson'))}</span><b>${esc(d.person)}</b></div><div class="ar"><span>${esc(t('debtOriginalAmount'))}</span><b>${money(debtOriginalAmount(d))}</b></div><div class="ar"><span>${esc(t('debtTotalPaid'))}</span><b>${money(debtTotalPaid(d))}</b></div><div class="ar"><span>${esc(t('debtRemaining'))}</span><b>${money(remainNow)}</b></div></div>
      <label class="field"><span class="field-label">${esc(t('debtRepayAmount'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal" value="${initialAmount}"></div><p class="hint" style="margin-top:6px">${esc(t('debtRepayExceed'))}: ${money(maxAllow)}</p></label>
      <label class="field"><span class="field-label">${esc(t('debtRepayAccount'))}</span><select name="accountId">${accountOptions(initialAccountId)}</select><p class="hint" style="margin-top:6px">${esc(t('debtRepayAccountHint'))}</p></label>
      <div class="field"><span class="field-label">${esc(t('debtRepayMethod'))}</span>${renderMethodPickerButton(initialMethod, initialMethodLabel, initialMethodCustom)}<p class="hint" style="margin-top:6px">${esc(t('debtRepayMethodHint'))}</p></div>
      <div class="toggle-line"><div class="tl-label"><div><b>${esc(t('debtRepayAffectAccount'))}</b></div><div class="tl-sub" id="repay-affect-sub">${esc(defaultAffect ? t('debtRepayWillAffectAccount') : t('debtRepayWillRecordOnly'))}</div></div><button type="button" class="switch ${defaultAffect?'on':''}" id="repay-affect-switch"><i></i></button><input type="hidden" name="affectAccount" value="${defaultAffect ? '1' : '0'}"></div>
      <div class="two-col"><label class="field"><span class="field-label">${esc(t('debtRepayTime'))}</span><input name="date" type="date" required value="${initialDate}"></label><label class="field"><span class="field-label">${esc(t('time'))}</span><input name="time" type="time" step="1" required value="${initialTime}"></label></div>
      <label class="field"><span class="field-label">${esc(t('note'))}</span><textarea name="note" maxlength="4000" placeholder="${esc(t('debtRepayNotePlaceholder'))}">${esc(initialNote)}</textarea></label>`,
    onSubmit(form){
      const amount = round2(parseFloat(form.amount)); if(!(amount > 0)){ toast(t('invalidAmount')); return false; }
      const affect = form.affectAccount === '1'; const acc = affect ? getAccount(form.accountId) : null;
      if(affect && !acc){ toast(t('accountNotExist')); return false; }
      const eventAt = combineDateTime(form.date || nowLocalDate(), form.time || nowLocalTime());
      if(editing){
        rollbackRepaymentEffect(d, editing);
        const remainAfterRollback = debtRemaining(d);
        if(amount > remainAfterRollback + 0.001){ toast(t('debtRepayExceed')); return false; }
        editing.amount = amount; editing.accountId = affect ? (form.accountId || null) : null; editing.method = (form.method || '').trim(); editing.methodCustom = (form.methodCustom || '').trim(); editing.eventAt = eventAt; editing.note = (form.note || ''); editing.affectAccount = affect; editing.linkMode = affect ? 'account' : 'record_only'; editing.transactionId = null; editing.updatedAt = Date.now();
        if(!Array.isArray(editing.editHistory)) editing.editHistory = [];
        editing.editHistory.push({ at: nowISO(), action: 'edit' });
        applyRepaymentEffect(d, editing); recalcDebt(d); afterChange(); toast(t('debtRepayUpdated'));
      }else{
        if(amount > remainNow + 0.001){ toast(t('debtRepayExceed')); return false; }
        const r = { id: uid(), debtId: d.id, amount, accountId: affect ? (form.accountId || null) : null, method: (form.method || '').trim(), methodCustom: (form.methodCustom || '').trim(), eventAt, createdAt: Date.now(), updatedAt: Date.now(), timezone: APP_TZ, note: (form.note || ''), affectAccount: affect, linkMode: affect ? 'account' : 'record_only', transactionId: null, editHistory: [] };
        applyRepaymentEffect(d, r);
        if(!Array.isArray(d.repayments)) d.repayments = [];
        d.repayments.push(r); recalcDebt(d); afterChange(); toast(t('debtRepayCreated'));
      }
      return true;
    },
    afterRender(root){
      bindMethodPicker(root);
      const sw = root.querySelector('#repay-affect-switch'); const sub = root.querySelector('#repay-affect-sub'); const hidden = root.querySelector('input[name="affectAccount"]');
      if(sw && hidden){ sw.addEventListener('click', e => { e.preventDefault(); const now = hidden.value === '1' ? '0' : '1'; hidden.value = now; sw.classList.toggle('on', now === '1'); if(sub) sub.textContent = now === '1' ? t('debtRepayWillAffectAccount') : t('debtRepayWillRecordOnly'); }); }
    }
  });
}

function applyRepaymentEffect(debt, r){
  if(!r.affectAccount) { r.transactionId = null; return; }
  const acc = getAccount(r.accountId); if(!acc){ r.transactionId = null; return; }
  if(debt.direction === 'owe_me'){ acc.balance = round2((Number(acc.balance) || 0) + Number(r.amount || 0)); }else{ acc.balance = round2((Number(acc.balance) || 0) - Number(r.amount || 0)); }
  const txId = uid(); r.transactionId = txId;
  state.transactions.push({ id: txId, type: debt.direction === 'owe_me' ? 'income' : 'expense', amount: Number(r.amount || 0), eventAt: r.eventAt, date: r.eventAt, timezone: r.timezone || APP_TZ, category: debt.direction === 'owe_me' ? 'other_income' : 'other_exp', subCategory: '', method: r.method || '', methodCustom: r.methodCustom || '', accountId: r.accountId, note: r.note || '', linkedDebtId: debt.id, linkedRepaymentId: r.id, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() });
}
function rollbackRepaymentEffect(debt, r){
  if(r.affectAccount && r.accountId){ const acc = getAccount(r.accountId); if(acc){ if(debt.direction === 'owe_me'){ acc.balance = round2((Number(acc.balance) || 0) - Number(r.amount || 0)); }else{ acc.balance = round2((Number(acc.balance) || 0) + Number(r.amount || 0)); } } }
  if(r.transactionId){ state.transactions = state.transactions.filter(tx => tx.id !== r.transactionId); r.transactionId = null; }
}
function recalcDebt(d){
  const reps = debtRepayments(d); const sum = round2(reps.reduce((s, r) => s + (Number(r.amount) || 0), 0));
  d.paid = sum; const orig = debtOriginalAmount(d); d.remainingAmount = round2(Math.max(orig - sum, 0));
  if(d.status !== 'cancelled'){ if(sum >= orig - 0.001 && orig > 0) d.status = 'paid'; else if(sum > 0) d.status = 'partial'; else d.status = 'unpaid'; }
  d.updatedAt = Date.now();
}
function openRepayMenu(debtId, repayId){
  const d = getDebt(debtId); if(!d) return;
  const r = debtRepayments(d).find(x => x.id === repayId); if(!r) return;
  openActionSheet(t('debtRepayHistory') + ' · ' + money(r.amount), [
    { label: t('edit'), icon:'✏️', onClick: () => openRepayForm(debtId, repayId) },
    { label: t('viewEditHistory'), icon:'🕓', onClick: () => viewEditHistory('repay', repayId, debtId) },
    { label: t('delete'), danger:true, onClick: () => { confirmDialog(t('debtRepayDeleteConfirm'), () => { rollbackRepaymentEffect(d, r); d.repayments = debtRepayments(d).filter(x => x.id !== repayId); recalcDebt(d); afterChange(); toast(t('debtRepayDeleted')); }); } }
  ]);
}
function debtMenu(id){
  const d = getDebt(id); if(!d) return;
  const acts = [ { label: t('debtAddRepay'), icon:'💰', onClick: () => openRepayForm(id) }, { label: t('edit'), icon:'✏️', onClick: () => openDebtForm(id) }, { label: t('viewEditHistory'), icon:'🕓', onClick: () => viewEditHistory('debt', id) } ];
  if(d.status !== 'cancelled'){ acts.push({ label: t('debtCancel'), danger:true, onClick: () => { confirmDialog(t('debtCancelConfirm'), () => { d.status = 'cancelled'; d.updatedAt = Date.now(); if(!Array.isArray(d.editHistory)) d.editHistory = []; d.editHistory.push({ at: nowISO(), action: 'cancel' }); afterChange(); toast(t('debtCancelled')); }); } }); }
  acts.push({ label: t('delete'), danger:true, onClick: () => { confirmDialog(t('debtDeleteConfirm'), () => { const reps = debtRepayments(d); reps.forEach(r => rollbackRepaymentEffect(d, r)); if(d.linkMode === 'account' && d.linkedAccountId){ const acc = getAccount(d.linkedAccountId); if(acc){ if(d.direction === 'owe_me') acc.balance = round2((Number(acc.balance)||0) + debtOriginalAmount(d)); else acc.balance = round2((Number(acc.balance)||0) - debtOriginalAmount(d)); } } state.debts = state.debts.filter(x => x.id !== id); if(ui.sub === 'debt-detail'){ ui.sub = 'debts'; ui.currentDebtId = null; } afterChange(); toast(t('debtDeleted')); }); } });
  openActionSheet(d.person, acts);
}
function debtCard(d){
  const amount = debtOriginalAmount(d); const paid = debtTotalPaid(d); const remain = debtRemaining(d); const pct = amount > 0 ? Math.min(paid / amount * 100, 100) : 0;
  const dirCls = d.direction === 'i_owe' ? 'st-debt-iowe' : 'st-debt-oweme'; const dirLabel = d.direction === 'i_owe' ? t('debtIOwe') : t('debtOweMe');
  const statusLabel = d.status === 'paid' ? t('debtStatusPaid') : d.status === 'partial' ? t('debtStatusPartial') : d.status === 'cancelled' ? t('debtStatusCancelled') : t('debtStatusUnpaid');
  const statusCls = d.status === 'paid' ? 'st-done' : d.status === 'partial' ? 'st-partial' : d.status === 'cancelled' ? 'st-end' : 'st-active';
  const startMs = dateFromISO(d.eventAt||d.date).getTime(); const days = Math.max(0, Math.round((Date.now() - startMs) / 86400000)); const durText = `${days} ${t('debtDays')}`;
  let dueText = '';
  if(d.dueDate){ const dd = new Date(d.dueDate); const diff = Math.ceil((dd - new Date()) / 86400000); if(diff > 0) dueText = ' · ' + t('debtDueIn', { n: diff }); else if(diff === 0) dueText = ' · ' + t('debtDueToday'); else dueText = ' · ' + t('debtOverdue'); }
  const purposeText = d.purposeCustom ? d.purposeCustom : debtPurposeDisplay(d.purpose); const methodText = d.methodCustom ? d.methodCustom : methodDisplay(d.method);
  const linkedAcc = d.linkedAccountId ? getAccount(d.linkedAccountId) : null; const noteFull = d.reason || ''; const reps = debtRepayments(d);
  return `<div class="debt-card" onclick="goDebtDetail('${d.id}')" style="cursor:pointer">
    <div class="debt-top"><div style="min-width:0;flex:1"><div class="debt-name">${esc(d.person)} <span class="badge ${dirCls}">${esc(dirLabel)}</span> <span class="badge ${statusCls}">${esc(statusLabel)}</span></div><div class="goal-sub">${esc(localDateTimeStr(d.eventAt||d.date))}${dueText} · ${esc(durText)}</div>${purposeText ? `<div class="goal-sub">${esc(purposeText)}${methodText ? ' · ' + esc(methodText) : ''}</div>` : (methodText ? `<div class="goal-sub">${esc(methodText)}</div>` : '')}${linkedAcc ? `<div class="goal-sub">🔗 ${esc(linkedAcc.name)}</div>` : ''}${noteFull ? `<div class="goal-sub note-full">${esc(noteFull)}</div>` : ''}${reps.length ? `<div class="goal-sub">💰 ${esc(t('debtRepayCount'))}: ${reps.length}</div>` : ''}${renderTimeLine(d)}</div><button class="icon-btn sm" onclick="event.stopPropagation();debtMenu('${d.id}')">⋯</button></div>
    <div class="goal-amt"><b>${money(remain)}</b><span> / ${money(amount)}</span></div><div class="bar-track"><div class="bar-fill ${d.status==='paid'?'alt':'debt'}" style="width:${pct.toFixed(1)}%"></div></div><div class="goal-foot"><span>${esc(t('debtTotalPaid'))}: ${money(paid)}</span><span>${esc(t('debtRemaining'))}: ${money(remain)}</span></div>
    <div class="debt-acts">${d.status !== 'paid' && d.status !== 'cancelled' ? `<button class="btn soft" onclick="event.stopPropagation();openRepayForm('${d.id}')">＋ ${esc(t('debtAddRepay'))}</button>` : ''}<button class="btn soft" onclick="event.stopPropagation();goDebtDetail('${d.id}')">${esc(t('debtDetailTitle'))}</button><button class="btn soft" onclick="event.stopPropagation();debtMenu('${d.id}')">${esc(t('assetMore'))}</button></div>
  </div>`;
}

function openMGForm(presetId){
  if(!state.accounts.length){ toast(t('noAccountWarn')); return; }
  const editing = presetId ? getMG(presetId) : null; const initialPurpose = 'to_friend'; const initialMethod = 'cash'; const initialNature = editing ? (editing.nature || 'gift') : 'gift';
  openSheet({
    title: editing ? t('mgEdit') : t('mgNew'), submitText: editing ? t('save') : t('mgSave'),
    body: `
      <label class="field"><span class="field-label">${esc(t('mgPerson'))}</span><input name="person" type="text" required maxlength="80" placeholder="${esc(t('mgPersonPlaceholder'))}" value="${editing?esc(editing.person):''}"></label>
      <label class="field"><span class="field-label">${esc(t('mgAmount'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" inputmode="decimal" value="${editing?editing.amount:''}"></div></label>
      <label class="field"><span class="field-label">${esc(t('mgFromAccount'))}</span><select name="accountId">${accountOptions(editing?editing.accountId:null)}</select><p class="hint" style="margin-top:6px">${esc(t('mgFromAccountHint'))}</p></label>
      <label class="field"><span class="field-label">${esc(t('mgNature'))}</span><select name="nature" id="mg-nature"><option value="gift" ${initialNature==='gift'?'selected':''}>${esc(t('mgNatureGift'))}</option><option value="loan" ${initialNature==='loan'?'selected':''}>${esc(t('mgNatureLoan'))}</option><option value="other" ${initialNature==='other'?'selected':''}>${esc(t('mgNatureOther'))}</option></select></label>
      <p class="hint" id="mg-nature-hint">${esc(initialNature === 'loan' ? t('mgNatureHintLoan') : initialNature === 'other' ? t('mgNatureHintOther') : t('mgNatureHintGift'))}</p>
      <div class="field"><span class="field-label">${esc(t('mgPurpose'))}</span>${renderPurposePickerButton('mg', editing?editing.purpose:initialPurpose, editing?editing.purposeCustom:'')}</div>
      <div class="field"><span class="field-label">${esc(t('mgMethod'))}</span>${renderMethodPickerButton(editing?editing.method:initialMethod, methodLabel(editing?editing.method:initialMethod), editing?editing.methodCustom:'')}<p class="hint" style="margin-top:6px">${esc(t('mgMethodHint'))}</p></div>
      <div class="two-col"><label class="field"><span class="field-label">${esc(t('mgDate'))}</span><input name="date" type="date" required value="${editing?localDateStr(editing.eventAt||editing.date):nowLocalDate()}"></label><label class="field"><span class="field-label">${esc(t('mgTime'))}</span><input name="time" type="time" step="1" required value="${editing?localTimeSecStr(editing.eventAt||editing.date):nowLocalTime()}"></label></div>
      <label class="field"><span class="field-label">${esc(t('mgNote'))}</span><textarea name="note" maxlength="4000">${editing?esc(editing.note||''):''}</textarea></label>
      <p class="hint">${esc(t('mgImportantNote'))}</p>`,
    onSubmit(d){
      const person = (d.person || '').trim(); const amount = round2(parseFloat(d.amount));
      if(!person){ toast(t('catEnterName')); return false; }
      if(!(amount > 0)){ toast(t('invalidAmount')); return false; }
      const acc = getAccount(d.accountId); if(!acc){ toast(t('accountNotExist')); return false; }
      const eventAt = combineDateTime(d.date || nowLocalDate(), d.time || nowLocalTime()); const nature = d.nature || 'gift';
      if(editing){
        const oldAcc = getAccount(editing.accountId); if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) + Number(editing.amount||0));
        if(editing.linkedDebtId){ const oldDebt = getDebt(editing.linkedDebtId); if(oldDebt) oldDebt.linkedMoneyGivenId = null; }
        if(round2(Number(acc.balance)||0) < amount){ if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) - Number(editing.amount||0)); toast(t('insufficientBalance')); return false; }
        acc.balance = round2((Number(acc.balance)||0) - amount);
        editing.person = person; editing.amount = amount; editing.accountId = acc.id; editing.purpose = (d.purpose || '').trim(); editing.purposeCustom = (d.purposeCustom || '').trim(); editing.method = (d.method || '').trim(); editing.methodCustom = (d.methodCustom || '').trim(); editing.giftType = d.purpose || editing.giftType || 'gift'; editing.nature = nature; editing.sourceAccountId = acc.id; editing.eventAt = eventAt; editing.date = eventAt; editing.note = (d.note || ''); editing.updatedAt = Date.now();
        if(!Array.isArray(editing.editHistory)) editing.editHistory = []; editing.editHistory.push({ at: nowISO(), action: 'edit' });
        if(nature !== 'loan' && editing.linkedDebtId){ const oldDebt = getDebt(editing.linkedDebtId); if(oldDebt) oldDebt.linkedMoneyGivenId = null; editing.linkedDebtId = null; }
        if(nature === 'loan' && !editing.linkedDebtId){ const eventId = editing.eventId || ('EVT-' + Date.now().toString(36).toUpperCase()); const debt = { id: uid(), eventId, direction: 'owe_me', person, amount: amount, originalAmount: amount, paid: 0, remainingAmount: amount, purpose: 'friend_borrow', purposeCustom: '', method: (d.method || '').trim(), methodCustom: (d.methodCustom || '').trim(), eventAt, date: eventAt, originalEventAt: eventAt, timezone: APP_TZ, dueDate: '', reason: t('debtCreatedFromMoneyGiven'), note: t('debtCreatedFromMoneyGiven'), repayments: [], payments: [], status: 'unpaid', linkMode: 'record_only', linkedAccountId: null, originalTransactionId: null, linkedMoneyGivenId: editing.id, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() }; state.debts.push(debt); editing.linkedDebtId = debt.id; } else if(nature === 'loan' && editing.linkedDebtId){ const debt = getDebt(editing.linkedDebtId); if(debt){ debt.person = person; debt.amount = amount; debt.originalAmount = amount; debt.eventAt = eventAt; debt.date = eventAt; debt.updatedAt = Date.now(); } }
        afterChange(); toast(t('mgUpdated'));
      }else{
        if(round2(Number(acc.balance)||0) < amount){ toast(t('insufficientBalance')); return false; }
        acc.balance = round2((Number(acc.balance)||0) - amount);
        const eventId = 'EVT-' + Date.now().toString(36).toUpperCase();
        const mg = { id: uid(), eventId, person, amount, accountId: acc.id, sourceAccountId: acc.id, nature, purpose: (d.purpose || '').trim(), purposeCustom: (d.purposeCustom || '').trim(), method: (d.method || '').trim(), methodCustom: (d.methodCustom || '').trim(), giftType: d.purpose || 'gift', eventAt, date: eventAt, timezone: APP_TZ, note: (d.note || ''), linkedDebtId: null, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() };
        if(nature === 'loan'){ const debt = { id: uid(), eventId, direction: 'owe_me', person, amount: amount, originalAmount: amount, paid: 0, remainingAmount: amount, purpose: 'friend_borrow', purposeCustom: '', method: (d.method || '').trim(), methodCustom: (d.methodCustom || '').trim(), eventAt, date: eventAt, originalEventAt: eventAt, timezone: APP_TZ, dueDate: '', reason: t('debtCreatedFromMoneyGiven'), note: t('debtCreatedFromMoneyGiven'), repayments: [], payments: [], status: 'unpaid', linkMode: 'record_only', linkedAccountId: null, originalTransactionId: null, linkedMoneyGivenId: mg.id, editHistory: [], createdAt: Date.now(), updatedAt: Date.now() }; state.debts.push(debt); mg.linkedDebtId = debt.id; }
        state.moneyGiven.push(mg); saveState(); afterChange(); toast(nature === 'loan' ? t('mgCreated') + ' · ' + t('mgLoanDebtCreated') : t('mgCreated'));
      }
      return true;
    },
    afterRender(root){
      bindPurposePicker(root, 'mg'); bindMethodPicker(root);
      const sel = root.querySelector('#mg-nature'); const hint = root.querySelector('#mg-nature-hint');
      if(sel && hint){ const update = () => { hint.textContent = sel.value === 'loan' ? t('mgNatureHintLoan') : sel.value === 'other' ? t('mgNatureHintOther') : t('mgNatureHintGift'); }; sel.addEventListener('change', update); update(); }
    }
  });
}
function mgMenu(id){
  const m = getMG(id); if(!m) return;
  openActionSheet(m.person, [
    { label: t('edit'), icon:'✏️', onClick: () => openMGForm(id) },
    { label: t('viewEditHistory'), icon:'🕓', onClick: () => viewEditHistory('mg', id) },
    { label: t('delete'), danger:true, onClick: () => { confirmDialog(t('mgDeleteConfirm'), () => { const acc = getAccount(m.accountId); if(acc) acc.balance = round2((Number(acc.balance)||0) + Number(m.amount)); if(m.linkedDebtId){ const d = getDebt(m.linkedDebtId); if(d) d.linkedMoneyGivenId = null; } state.moneyGiven = state.moneyGiven.filter(x => x.id !== id); afterChange(); toast(t('mgDeleted')); }); } }
  ]);
}
function mgCard(m){
  const acc = getAccount(m.accountId); const purposeText = m.purposeCustom ? m.purposeCustom : mgPurposeDisplay(m.purpose); const methodText = m.methodCustom ? m.methodCustom : methodDisplay(m.method);
  const natureLabel = m.nature === 'loan' ? '🤝 ' + t('mgNatureLoan') : m.nature === 'other' ? t('mgNatureOther') : '🎁 ' + t('mgNatureGift');
  return `<div class="debt-card"><div class="debt-top"><div style="min-width:0;flex:1"><div class="debt-name">${esc(m.person)} <span class="badge st-bad">${esc(t('moneyGiven'))}</span> <span class="badge st-active">${esc(natureLabel)}</span></div><div class="goal-sub">${esc(localDateTimeStr(m.eventAt||m.date))} · ${esc(acc ? acc.name : '—')}</div>${purposeText ? `<div class="goal-sub">📋 ${esc(purposeText)}${methodText ? ' · ' + esc(methodText) : ''}</div>` : (methodText ? `<div class="goal-sub">💳 ${esc(methodText)}</div>` : '')}${m.note ? `<div class="goal-sub note-full">${esc(m.note)}</div>` : ''}${renderTimeLine(m)}</div><button class="icon-btn sm" onclick="mgMenu('${m.id}')">⋯</button></div><div class="goal-amt"><b class="c-red">-${money(m.amount)}</b></div></div>`;
}

function openTxMenu(id){
  const tx = state.transactions.find(x => x.id === id); if(!tx) return;
  const labelMap = { income:t('income'), expense:t('expense'), transfer:t('transfer'), goal_deposit:t('goalDeposit'), goal_withdraw:t('goalWithdraw') };
  const acts = [];
  if(tx.type === 'income' || tx.type === 'expense'){
    if(tx.linkedRepaymentId){ acts.push({ label: t('viewEditHistory'), icon:'🕓', onClick: () => viewEditHistory('tx', id) }); acts.push({ label: t('debtRepay'), icon:'💰', onClick: () => { if(tx.linkedDebtId) goDebtDetail(tx.linkedDebtId); } }); }
    else{ acts.push({ label: t('edit'), icon:'✏️', onClick: () => editTransaction(id) }); acts.push({ label: t('viewEditHistory'), icon:'🕓', onClick: () => viewEditHistory('tx', id) }); acts.push({ label: t('delete'), danger:true, onClick: () => deleteTransaction(id) }); }
  }else{ acts.push({ label: t('viewEditHistory'), icon:'🕓', onClick: () => viewEditHistory('tx', id) }); acts.push({ label: t('delete'), danger:true, onClick: () => deleteTransaction(id) }); }
  openActionSheet(labelMap[tx.type] || 'Record', acts);
}
function deleteConfirmTitleFor(type){ switch(type){ case 'income': case 'expense': return t('delTxTitle'); case 'transfer': return t('delTransferTitle'); case 'goal_deposit': return t('delGoalDepositTitle'); case 'goal_withdraw': return t('delGoalWithdrawTitle'); default: return t('delTxTitle'); } }
function editTransaction(id){
  const tx = state.transactions.find(x => x.id === id); if(!tx) return;
  if(tx.linkedRepaymentId){ toast(t('debtRepayHint')); return; }
  const isIncome = tx.type === 'income'; const initialCat = tx.category; const initialLabel = isIncome ? incomeDisplayLabel(initialCat) : expenseDisplayLabel(initialCat);
  const initialMethodId = tx.method || ''; const initialMethodCustom = tx.methodCustom || ''; const initialMethodLabel = initialMethodCustom || methodDisplay(initialMethodId);
  openSheet({
    title: isIncome ? t('recordIncome') : t('recordExpense'), submitText: t('save'),
    body: `
      <label class="field"><span class="field-label">${esc(t('amount'))}</span><div class="input-wrap"><span class="prefix">RM</span><input name="amount" type="number" step="0.01" min="0.01" required value="${tx.amount}" inputmode="decimal"></div></label>
      <div class="field"><span class="field-label">${esc(t('category'))}</span>${renderCategoryPickerButton(isIncome?'income':'expense', initialCat, initialLabel)}</div>
      <div class="field"><span class="field-label">${esc(isIncome ? t('incomeMethod') : t('expenseMethod'))}</span>${renderMethodPickerButton(initialMethodId, initialMethodLabel, initialMethodCustom)}</div>
      <label class="field"><span class="field-label">${esc(t('account'))}</span><select name="accountId">${state.accounts.map(a => `<option value="${a.id}" ${a.id===tx.accountId?'selected':''}>${esc(a.name)}（${fmtNum(a.balance||0)}）</option>`).join('')}</select></label>
      <div class="two-col"><label class="field"><span class="field-label">${esc(t('date'))}</span><input name="date" type="date" value="${localDateStr(tx.eventAt||tx.date)}" required></label><label class="field"><span class="field-label">${esc(t('time'))}</span><input name="time" type="time" step="1" value="${localTimeSecStr(tx.eventAt||tx.date)}" required></label></div>
      <label class="field"><span class="field-label">${esc(t('note'))}</span><textarea name="note" maxlength="4000">${esc(tx.note||'')}</textarea></label>`,
    onSubmit(d){
      const newAmount = round2(parseFloat(d.amount)); if(!(newAmount > 0)){ toast(t('invalidAmount')); return false; }
      const oldAcc = getAccount(tx.accountId);
      if(tx.type === 'income'){ if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) - Number(tx.amount)); }else{ if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) + Number(tx.amount)); }
      const newAcc = getAccount(d.accountId);
      if(!newAcc){ if(tx.type === 'income'){ if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) + Number(tx.amount)); } else { if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) - Number(tx.amount)); } toast(t('accountNotExist')); return false; }
      if(tx.type === 'expense' && round2(Number(newAcc.balance)||0) < newAmount){ if(tx.type === 'income'){ if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) + Number(tx.amount)); } else { if(oldAcc) oldAcc.balance = round2((Number(oldAcc.balance)||0) - Number(tx.amount)); } toast(t('insufficientBalance')); return false; }
      if(tx.type === 'income'){ newAcc.balance = round2((Number(newAcc.balance)||0) + newAmount); } else { newAcc.balance = round2((Number(newAcc.balance)||0) - newAmount); }
      tx.amount = newAmount; tx.category = d.category || tx.category; tx.method = d.method || ''; tx.methodCustom = d.methodCustom || ''; tx.accountId = newAcc.id;
      const newEventAt = combineDateTime(d.date || localDateStr(tx.eventAt||tx.date), d.time || localTimeSecStr(tx.eventAt||tx.date)); tx.eventAt = newEventAt; tx.date = newEventAt; tx.note = (d.note || ''); tx.updatedAt = Date.now();
      if(!Array.isArray(tx.editHistory)) tx.editHistory = []; tx.editHistory.push({ at: nowISO(), action: 'edit' });
      afterChange(); toast(t('accountUpdated')); return true;
    },
    afterRender(root){ bindCategoryPicker(root, isIncome?'income':'expense'); bindMethodPicker(root); }
  });
}
function deleteTransaction(id){
  const tx = state.transactions.find(x => x.id === id); if(!tx) return;
  if(tx.linkedRepaymentId){ toast(t('debtRepayHint')); return; }
  confirmDialog(deleteConfirmTitleFor(tx.type), () => {
    try{
      switch(tx.type){
        case 'income': { const a = getAccount(tx.accountId); if(a) a.balance = round2((Number(a.balance)||0) - Number(tx.amount)); break; }
        case 'expense': { const a = getAccount(tx.accountId); if(a) a.balance = round2((Number(a.balance)||0) + Number(tx.amount)); break; }
        case 'transfer': { const f = getAccount(tx.accountId), to = getAccount(tx.toAccountId); if(f) f.balance = round2((Number(f.balance)||0) + Number(tx.amount)); if(to) to.balance = round2((Number(to.balance)||0) - Number(tx.amount)); break; }
        case 'goal_deposit': { const a = getAccount(tx.accountId), g = getGoal(tx.goalId); if(a) a.balance = round2((Number(a.balance)||0) + Number(tx.amount)); if(g) g.saved = round2((Number(g.saved)||0) - Number(tx.amount)); break; }
        case 'goal_withdraw': { const a = getAccount(tx.accountId), g = getGoal(tx.goalId); if(a) a.balance = round2((Number(a.balance)||0) - Number(tx.amount)); if(g) g.saved = round2((Number(g.saved)||0) + Number(tx.amount)); break; }
      }
    }catch(e){}
    state.transactions = state.transactions.filter(x => x.id !== id);
    state.goals.forEach(g => { if(Number(g.saved) < 0) g.saved = 0; });
    afterChange(); toast(t('accountDeleted'));
  });
}
function viewEditHistory(kind, id, parentId){
  let obj = null;
  if(kind === 'tx') obj = state.transactions.find(x => x.id === id);
  else if(kind === 'debt') obj = getDebt(id); else if(kind === 'mg') obj = getMG(id); else if(kind === 'goal') obj = getGoal(id); else if(kind === 'asset') obj = getAsset(id);
  else if(kind === 'repay'){ const d = getDebt(parentId); if(d) obj = debtRepayments(d).find(r => r.id === id); }
  if(!obj) return;
  const fmtSafe = (v) => v ? localDateTimeStr(v) : '—';
  const hist = Array.isArray(obj.editHistory) ? obj.editHistory : [];
  const rows = [
    `<div class="ar"><span>${esc(t('eventTimeLabel'))}</span><b>${esc(fmtSafe(obj.eventAt || obj.date))}</b></div>`,
    `<div class="ar"><span>${esc(t('createdAtLabel'))}</span><b>${esc(fmtSafe(obj.createdAt))}</b></div>`,
    `<div class="ar"><span>${esc(t('updatedAtLabel'))}</span><b>${esc(fmtSafe(obj.updatedAt || obj.createdAt))}</b></div>`
  ];
  if(hist.length){ hist.forEach((h, i) => { rows.push(`<div class="ar"><span>Edit #${i+1}</span><b>${esc(fmtSafe(h.at))}${h.action ? ' · ' + esc(h.action) : ''}</b></div>`); }); }else{ rows.push(`<div class="ar"><span>${esc(t('noEditHistory'))}</span><b>—</b></div>`); }
  openSheet({ title: t('editHistoryTitle'), submitText: t('close'), body: `<div class="asset-rows">${rows.join('')}</div>`, onSubmit(){ return true; } });
}
