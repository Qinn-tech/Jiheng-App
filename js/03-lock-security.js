/* =========================================================================
   积衡 Jiheng - 锁屏渲染、密码验证、开屏动画
   ========================================================================= */

function renderLock(){
  const root = document.getElementById('lock-root');
  if(!root) return;
  const hasLock = !!(lockRecord && lockRecord.hash);
  const hasData = state.accounts.length || state.transactions.length || state.goals.length || state.assets.length || state.debts.length || state.moneyGiven.length;
  if(isUnlocked){ root.innerHTML = ''; return; }
  if(lockUI.mode === 'unlock'){ lockUI.useTextMode = currentLockKind() === 'text'; }
  
  let title = shouldUseTextMode() ? t('lockEnterPassword') : t('lockEnterPin');
  if(lockUI.mode === 'create')        title = t('lockCreatePin');
  else if(lockUI.mode === 'confirm')  title = t('lockConfirmPin');
  else if(lockUI.mode === 'changeOld')title = t('lockChangeOld');
  else if(lockUI.mode === 'changeNew')title = t('lockChangeNew');
  else if(lockUI.mode === 'changeConfirm') title = t('lockChangeConfirm');
  
  if(!hasLock && lockUI.mode === 'unlock') lockUI.mode = 'create';
  const infoText = (hasLock && hasData) ? t('lockDataPreserved') : '';
  const showToggle = (lockUI.mode === 'create' || lockUI.mode === 'confirm' || lockUI.mode === 'changeNew' || lockUI.mode === 'changeConfirm');
  
  root.innerHTML = `
  <div class="lock-screen" id="lock-screen">
    <div class="lock-header">
      <div class="jiheng-wordmark light"><span class="zh">积衡</span><span class="en">JI HENG</span></div>
      <div class="lock-sub">${esc(t('brandTagline'))}</div>
    </div>
    <div class="lock-mid">
      <div class="lock-title">${esc(title)}</div>
      ${infoText ? `<div class="lock-info">${esc(infoText)}</div>` : ''}
      <div id="lock-dynamic"></div>
    </div>
    <div class="lock-notice-scroll" id="lock-notice-scroll">
      <div class="ln-title">${esc(t('lockNoticeTitle'))}</div>
      ${PRODUCT_NOTICE_LANGS.map(l => `<div class="ln-row"><span class="ln-flag">${l.code}</span><span class="ln-text">${l.text}</span></div>`).join('')}
    </div>
    <div class="lock-footer">
      ${ showToggle
          ? (shouldUseTextMode()
              ? `<button type="button" id="lock-toggle-pin">${esc(t('lockUsePin'))}</button>`
              : `<button type="button" id="lock-toggle-text">${esc(t('lockUseText'))}</button>`)
          : '' }
    </div>
  </div>`;
  updateLockDynamic();
  
  const togglePin = document.getElementById('lock-toggle-pin');
  const toggleText = document.getElementById('lock-toggle-text');
  if(togglePin)  togglePin.addEventListener('click', e => { e.preventDefault(); lockUI.useTextMode = false; lockUI.msg=''; lockUI.error=false; lockUI.pin=''; renderLock(); });
  if(toggleText) toggleText.addEventListener('click', e => { e.preventDefault(); lockUI.useTextMode = true; lockUI.msg=''; lockUI.error=false; lockUI.pin=''; renderLock(); });
}

function updateLockDynamic(){
  const dyn = document.getElementById('lock-dynamic');
  if(!dyn) return;
  const pinLen = 6;
  if(shouldUseTextMode()){
    dyn.innerHTML = `
      <div class="lock-input-wrap">
        <input class="lock-input" id="lock-text" type="password" inputmode="text"
               placeholder="${esc(t('lockTextPlaceholder'))}" value="${esc(lockUI.pin)}" maxlength="128"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      </div>
      <div class="lock-msg" id="lock-msg-el">${esc(lockUI.msg)}</div>
      <button type="button" class="lock-ok-btn" id="lock-ok">${esc(t('lockOk'))}</button>`;
    const txt = document.getElementById('lock-text');
    if(txt){
      txt.focus();
      try{ txt.setSelectionRange(txt.value.length, txt.value.length); }catch(e){}
      txt.addEventListener('input', e => { lockUI.pin = e.target.value; lockUI.error = false; });
      txt.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); handleTextConfirm(); } });
    }
    const ok = document.getElementById('lock-ok');
    if(ok) ok.addEventListener('click', e => { e.preventDefault(); handleTextConfirm(); });
  }else{
    dyn.innerHTML = `
      <div class="pin-dots" id="pin-dots">
        ${Array.from({length: pinLen}).map((_,i) => `<div class="pin-dot ${i < lockUI.pin.length ? 'filled':''} ${lockUI.error && i < lockUI.pin.length ? 'error':''}"></div>`).join('')}
      </div>
      <div class="lock-msg" id="lock-msg-el">${esc(lockUI.msg)}</div>
      <div class="keypad" id="keypad">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button type="button" class="key" data-k="${n}">${n}</button>`).join('')}
        <button type="button" class="key fn" data-k="clear">${esc(t('lockClear'))}</button>
        <button type="button" class="key" data-k="0">0</button>
        <button type="button" class="key fn" data-k="del">${esc(t('lockDel'))}</button>
        <button type="button" class="key enter" data-k="ok" style="grid-column:span 3">${esc(t('lockOk'))}</button>
      </div>`;
    dyn.querySelectorAll('#keypad .key').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); handleKey(btn.dataset.k); });
    });
  }
}

function handleTextConfirm(){
  const txt = document.getElementById('lock-text');
  if(txt) lockUI.pin = txt.value;
  submitPin();
}

function handleKey(k){
  if(k === 'del'){ lockUI.pin = lockUI.pin.slice(0,-1); lockUI.error = false; updateLockDynamic(); return; }
  if(k === 'clear'){ lockUI.pin = ''; lockUI.error = false; lockUI.msg = ''; updateLockDynamic(); return; }
  if(k === 'ok'){ submitPin(); return; }
  if(/^\d$/.test(k)){
    if(lockUI.pin.length < 12){ lockUI.pin += k; lockUI.error = false; lockUI.msg = ''; }
    updateLockDynamic();
    if(!shouldUseTextMode() && lockUI.pin.length === 6) setTimeout(submitPin, 120);
  }
}

async function submitPin(){
  try{
    const pin = String(lockUI.pin == null ? '' : lockUI.pin);
    const usingText = shouldUseTextMode();
    const hasLock = !!(lockRecord && lockRecord.hash);
    if(!pin){ lockUI.msg = t('lockErrEmpty'); lockUI.error = true; updateLockDynamic(); return; }
    
    if(lockUI.mode === 'create'){
      if(!usingText && !/^\d{6}$/.test(pin)){ lockUI.msg = t('lockErrPin6'); lockUI.error = true; updateLockDynamic(); return; }
      if(usingText && pin.length < 4){ lockUI.msg = t('lockErrText4'); lockUI.error = true; updateLockDynamic(); return; }
      lockUI.firstPin = pin; lockUI.pin = ''; lockUI.mode = 'confirm'; lockUI.msg = ''; renderLock(); return;
    }
    if(lockUI.mode === 'confirm'){
      if(pin !== lockUI.firstPin){
        lockUI.msg = t('lockErrMismatch'); lockUI.error = true; lockUI.pin = ''; lockUI.firstPin = ''; lockUI.mode = 'create'; renderLock(); return;
      }
      const hash = await sha256(pin);
      lockRecord = { hash, type: usingText ? 'text' : 'pin', createdAt: Date.now() };
      saveLock(lockRecord);
      lockUI.pin = ''; lockUI.firstPin = ''; lockUI.mode = 'unlock'; lockUI.msg = ''; lockUI.error = false;
      isUnlocked = true; markActivity(); renderLock(); render({ top:true });
      toast(t('lockWelcome')); return;
    }
    if(lockUI.mode === 'changeOld'){
      const hash = await sha256(pin);
      if(!lockRecord || hash !== lockRecord.hash){ lockUI.msg = t('lockVerifyFailed'); lockUI.error = true; lockUI.pin = ''; updateLockDynamic(); return; }
      lockUI.mode = 'changeNew'; lockUI.pin = ''; lockUI.msg = '';
      lockUI.useTextMode = (lockUI._targetKind === 'text');
      renderLock(); return;
    }
    if(lockUI.mode === 'changeNew'){
      if(!usingText && !/^\d{6}$/.test(pin)){ lockUI.msg = t('lockErrPin6'); lockUI.error = true; updateLockDynamic(); return; }
      if(usingText && pin.length < 4){ lockUI.msg = t('lockErrText4'); lockUI.error = true; updateLockDynamic(); return; }
      lockUI.firstPin = pin; lockUI.pin = ''; lockUI.mode = 'changeConfirm'; lockUI.msg = ''; renderLock(); return;
    }
    if(lockUI.mode === 'changeConfirm'){
      if(pin !== lockUI.firstPin){
        lockUI.msg = t('lockErrMismatch'); lockUI.error = true; lockUI.pin = ''; lockUI.firstPin = ''; lockUI.mode = 'changeNew'; renderLock(); return;
      }
      const hash = await sha256(pin);
      lockRecord = { hash, type: usingText ? 'text' : 'pin', createdAt: Date.now() };
      saveLock(lockRecord);
      lockUI.pin = ''; lockUI.firstPin = ''; lockUI.mode = 'unlock'; lockUI.msg = ''; lockUI.error = false;
      isUnlocked = true; markActivity(); renderLock(); render({ top:true });
      toast(t('lockUpdated')); return;
    }
    if(!hasLock){ lockUI.mode = 'create'; renderLock(); return; }
    
    const hash = await sha256(pin);
    if(hash === lockRecord.hash){
      isUnlocked = true; lockUI.pin = ''; lockUI.msg = ''; lockUI.error = false;
      markActivity(); renderLock(); render({ top:true });
    }else{
      lockUI.msg = t('lockErrWrong'); lockUI.error = true; lockUI.pin = '';
      updateLockDynamic();
      if(navigator.vibrate) navigator.vibrate(60);
    }
  }catch(err){
    console.error('[Jiheng submitPin] exception:', err);
    lockUI.msg = t('lockErrGeneric'); lockUI.error = true; lockUI.pin = '';
    try{ updateLockDynamic(); }catch(e2){}
  }
}

function lockApp(msg){
  isUnlocked = false;
  lockUI.mode = 'unlock'; lockUI.pin = ''; lockUI.firstPin = '';
  lockUI.msg = msg || ''; lockUI.error = false;
  lockUI.useTextMode = (lockRecord && lockRecord.type === 'text') ? true : false;
  renderLock();
}

setInterval(() => {
  if(!isUnlocked) return;
  const mins = Number(state.settings.autoLockMinutes) || 0;
  if(mins <= 0) return;
  if(Date.now() - lastActivity > mins * 60000) lockApp(t('lockAutoLocked'));
}, 5000);

['click','touchstart','keydown','scroll'].forEach(ev => { window.addEventListener(ev, markActivity, { passive:true }); });
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible') markActivity(); });

/* ============================ Splash ============================ */
let _splashPlayed = false;
function showSplash(cb){
  if(_splashPlayed){ if(cb) cb(); return; }
  _splashPlayed = true;
  const root = document.getElementById('splash-root');
  if(!root){ if(cb) cb(); return; }
  const lang = LANG;
  const pack = I18N[lang] || I18N.zh;
  root.innerHTML = `
    <div class="sp-word">
      <span class="sp-zh">积衡</span>
      <span class="sp-en">JI HENG</span>
    </div>
    <div class="sp-slogan">${esc(pack.slogan || '积累，亦有衡。')}</div>
    <div class="sp-dot"><i></i><i></i><i></i></div>`;
  root.classList.remove('hide');
  setTimeout(() => {
    root.classList.add('hide');
    setTimeout(() => { if(cb) cb(); }, 550);
  }, 1500);
}

window.openSetPIN = function(){
  isUnlocked = false; lockUI.mode = 'changeOld'; lockUI.pin = ''; lockUI.firstPin = ''; lockUI.msg = ''; lockUI.error = false; lockUI.useTextMode = false; lockUI._targetKind = 'pin';
  closeSheet(); renderLock();
};
window.openSetPassword = function(){
  isUnlocked = false; lockUI.mode = 'changeOld'; lockUI.pin = ''; lockUI.firstPin = ''; lockUI.msg = ''; lockUI.error = false; lockUI.useTextMode = true; lockUI._targetKind = 'text';
  closeSheet(); renderLock();
};
