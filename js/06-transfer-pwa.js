/* =========================================================================
   积衡 Jiheng - 加密转移、PWA 及启动引擎 (最终文件)
   ========================================================================= */

const JT_TRANSFER_FORMAT = 'jiheng-transfer-package';
const JT_TRANSFER_FORMAT_VERSION = 1;
const JT_PBKDF2_ITERATIONS = 600000;
const JT_PBKDF2_HASH = 'SHA-256';
const JT_AES_ALGO = 'AES-GCM';
const JT_AES_KEY_LENGTH = 256;
const JT_SALT_LENGTH = 16;
const JT_IV_LENGTH = 12;
const JT_TRANSFER_PW_MIN_LENGTH = 10;
const JT_TRANSFER_STATE_KEY = 'jiheng_transfer_state_v1';
const JT_IMPORTED_PACKAGES_KEY = 'jiheng_imported_packages_v1';

function jtBufToBase64(buf){ const bytes = new Uint8Array(buf); let bin = ''; for(let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]); return btoa(bin); }
function jtBase64ToBuf(b64){ const bin = atob(b64); const bytes = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes.buffer; }
function jtBufToHex(buf){ const bytes = new Uint8Array(buf); let out = ''; for(let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2,'0'); return out; }
function jtRandomBytes(len){ const bytes = new Uint8Array(len); crypto.getRandomValues(bytes); return bytes; }
function jtGeneratePackageId(){ return 'jhp-' + jtBufToHex(jtRandomBytes(16)); }

const JT_COMMON_PASSWORDS = ['password','password1','password123','passw0rd','p@ssw0rd','12345678','123456789','1234567890','0123456789','9876543210','qwerty','qwertyuiop','qwerty123','qwerty1234','asdfghjkl','abcdefgh','abcdefghij','aaaaaaaa','aaaaaaaaaa','1111111111','0000000000','2222222222','iloveyou','admin','admin123','root','letmein','welcome','monkey','dragon','jiheng','jiheng123','jiheng2024','jiheng2025','jiheng2026','jih3ng'];
function jtDetectWeakPassword(pw){
  const reasons = []; const p = String(pw || ''); if(!p){ reasons.push('empty'); return reasons; }
  if(p.length < JT_TRANSFER_PW_MIN_LENGTH) reasons.push('too_short');
  const lower = p.toLowerCase(); if(JT_COMMON_PASSWORDS.indexOf(lower) !== -1) reasons.push('common_password');
  if(/0{4,}|1{4,}|2{4,}|3{4,}|4{4,}|5{4,}|6{4,}|7{4,}|8{4,}|9{4,}/.test(p)) reasons.push('repeated_digit');
  if(/([a-zA-Z])\1{3,}/.test(p)) reasons.push('repeated_char');
  if(/qwerty|asdf|zxcv|1234|abcd|4321|dcba/i.test(p)) reasons.push('keyboard_pattern');
  for(let i = 0; i + 4 <= p.length; i++){ const a = p.charCodeAt(i), b = p.charCodeAt(i+1), c = p.charCodeAt(i+2), d = p.charCodeAt(i+3); if(b - a === 1 && c - b === 1 && d - c === 1){ reasons.push('sequential_pattern'); break; } if(a - b === 1 && b - c === 1 && c - d === 1){ reasons.push('sequential_pattern'); break; } }
  if(/^\d+$/.test(p)) reasons.push('digits_only'); if(/^[a-zA-Z]+$/.test(p)) reasons.push('letters_only'); if(/jiheng|积衡/i.test(p)) reasons.push('contains_app_name'); if(/^01\d{8,9}$/.test(p.replace(/[-\s]/g,''))) reasons.push('phone_like');
  return reasons;
}
function jtScorePassword(pw){
  const p = String(pw || ''); if(!p) return { score: 0, label: 'weak', reasons: ['empty'] };
  const weak = jtDetectWeakPassword(p);
  const hardReject = weak.some(r => r === 'too_short' || r === 'common_password' || r === 'repeated_digit' || r === 'repeated_char' || r === 'keyboard_pattern' || r === 'sequential_pattern' || r === 'digits_only' || r === 'letters_only' || r === 'contains_app_name' || r === 'phone_like' || r === 'empty');
  if(hardReject) return { score: 0, label: 'weak', reasons: weak };
  let score = 1; const hasUpper = /[A-Z]/.test(p); const hasLower = /[a-z]/.test(p); const hasDigit = /\d/.test(p); const hasSymbol = /[^A-Za-z0-9]/.test(p);
  if(p.length >= 10) score++; if(p.length >= 14) score++; if(hasUpper && hasLower) score++; if(hasDigit) score++; if(hasSymbol) score++; if(score > 4) score = 4;
  const label = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'strong' : 'very_strong';
  return { score, label, reasons: [] };
}
async function jtCheckAppLockSimilarity(pw){
  try { const p = String(pw || ''); if(!p || !lockRecord || !lockRecord.hash) return { similar: false }; const h = await sha256(p); if(h === lockRecord.hash) return { similar: true, reason: 'identical' }; const v1 = await sha256(p.toLowerCase()); if(v1 === lockRecord.hash) return { similar: true, reason: 'case_variant' }; const v2 = await sha256(p.trim()); if(v2 === lockRecord.hash) return { similar: true, reason: 'trim_variant' }; if(lockRecord.type === 'pin'){ if(/^\d+$/.test(p) && p.length >= 4 && p.length <= 8){ return { similar: true, reason: 'pin_like' }; } const pinVar = [p + '0', p + '00', p + '1', '0' + p, '1' + p]; for(const v of pinVar){ const hh = await sha256(v); if(hh === lockRecord.hash) return { similar: true, reason: 'pin_variant' }; } } return { similar: false }; } catch(e){ return { similar: false }; }
}

function jtLoadTransferState(){ try { const raw = localStorage.getItem(JT_TRANSFER_STATE_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } }
function jtSaveTransferState(s){ try { localStorage.setItem(JT_TRANSFER_STATE_KEY, JSON.stringify(s)); } catch(e){} }
function jtClearTransferState(){ try { localStorage.removeItem(JT_TRANSFER_STATE_KEY); } catch(e){} }
function jtStartTransferState(kind, meta){ const s = { kind, startedAt: Date.now(), status: 'in_progress', meta: meta || {} }; jtSaveTransferState(s); return s; }
function jtMarkTransferComplete(kind, meta){ const prev = jtLoadTransferState() || {}; const s = { kind, startedAt: prev.startedAt || Date.now(), completedAt: Date.now(), status: 'complete', meta: meta || {} }; jtSaveTransferState(s); return s; }

function jtLoadImportedPackages(){ try { const raw = localStorage.getItem(JT_IMPORTED_PACKAGES_KEY); return raw ? JSON.parse(raw) : {}; } catch(e){ return {}; } }
function jtSaveImportedPackages(obj){ try { localStorage.setItem(JT_IMPORTED_PACKAGES_KEY, JSON.stringify(obj)); } catch(e){} }
function jtMarkPackageImported(packageId, meta){ if(!packageId) return; const obj = jtLoadImportedPackages(); obj[packageId] = Object.assign({ importedAt: Date.now() }, meta || {}); jtSaveImportedPackages(obj); }
function jtHasPackageBeenImported(packageId){ if(!packageId) return false; const obj = jtLoadImportedPackages(); return !!obj[packageId]; }

async function jtDeriveKey(password, salt, usage){
  const enc = new TextEncoder(); const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  return await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: JT_PBKDF2_ITERATIONS, hash: JT_PBKDF2_HASH }, keyMaterial, { name: JT_AES_ALGO, length: JT_AES_KEY_LENGTH }, false, [usage]);
}

async function jtBuildAndEncryptPackage(password, snapshot){
  const payload = { dataVersion: DATA_VERSION, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), timezone: APP_TZ, state: snapshot };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const salt = jtRandomBytes(JT_SALT_LENGTH); const iv = jtRandomBytes(JT_IV_LENGTH);
  const key = await jtDeriveKey(password, salt, 'encrypt');
  const cipherBuf = await crypto.subtle.encrypt({ name: JT_AES_ALGO, iv: iv, tagLength: 128 }, key, payloadBytes);
  const packageId = jtGeneratePackageId();
  const container = { format: JT_TRANSFER_FORMAT, formatVersion: JT_TRANSFER_FORMAT_VERSION, packageId: packageId, kdf: { name: 'PBKDF2', hash: JT_PBKDF2_HASH, iterations: JT_PBKDF2_ITERATIONS, salt: jtBufToBase64(salt) }, cipher: { name: JT_AES_ALGO, keyLength: JT_AES_KEY_LENGTH, iv: jtBufToBase64(iv), tagLength: 128 }, createdAt: new Date().toISOString(), payload: jtBufToBase64(cipherBuf) };
  return { container, packageId };
}

async function jtDecryptPackage(password, container){
  if(!container || container.format !== JT_TRANSFER_FORMAT){ throw new Error('JT_ERR_INVALID_FORMAT'); }
  if(container.formatVersion !== JT_TRANSFER_FORMAT_VERSION){ throw new Error('JT_ERR_VERSION_UNSUPPORTED'); }
  if(!container.kdf || !container.cipher || !container.payload){ throw new Error('JT_ERR_INVALID_FORMAT'); }
  const salt = jtBase64ToBuf(container.kdf.salt); const iv = jtBase64ToBuf(container.cipher.iv); const cipherBuf = jtBase64ToBuf(container.payload);
  const key = await jtDeriveKey(password, salt, 'decrypt');
  let plainBuf;
  try { plainBuf = await crypto.subtle.decrypt({ name: JT_AES_ALGO, iv: iv, tagLength: 128 }, key, cipherBuf); } catch(e){ throw new Error('JT_ERR_DECRYPT_FAILED'); }
  let parsed;
  try { parsed = JSON.parse(new TextDecoder().decode(plainBuf)); } catch(e){ throw new Error('JT_ERR_CORRUPTED'); }
  return parsed;
}

function jtBuildSnapshot(){
  return JSON.parse(JSON.stringify({ dataVersion: state.dataVersion, settings: state.settings, accounts: state.accounts, transactions: state.transactions, goals: state.goals, assets: state.assets, debts: state.debts, moneyGiven: state.moneyGiven, customIncomeCats: state.customIncomeCats, customExpenseCats: state.customExpenseCats, customMethods: state.customMethods, achievements: state.achievements, createdAt: state.createdAt }));
}
function jtValidateSnapshot(snap){
  if(!snap || typeof snap !== 'object') return false;
  if(!Array.isArray(snap.accounts) || !Array.isArray(snap.transactions) || !Array.isArray(snap.goals) || !Array.isArray(snap.assets) || !Array.isArray(snap.debts) || !Array.isArray(snap.moneyGiven)) return false;
  return true;
}
function jtApplySnapshotToState(snap){
  const currentLang = state.settings.lang;
  state.accounts = Array.isArray(snap.accounts) ? snap.accounts : []; state.transactions = Array.isArray(snap.transactions) ? snap.transactions : []; state.goals = Array.isArray(snap.goals) ? snap.goals : []; state.assets = Array.isArray(snap.assets) ? snap.assets : []; state.debts = Array.isArray(snap.debts) ? snap.debts : []; state.moneyGiven = Array.isArray(snap.moneyGiven) ? snap.moneyGiven : [];
  state.customIncomeCats = Array.isArray(snap.customIncomeCats) ? snap.customIncomeCats : []; state.customExpenseCats = Array.isArray(snap.customExpenseCats) ? snap.customExpenseCats : []; state.customMethods = Array.isArray(snap.customMethods) ? snap.customMethods : [];
  state.achievements = (snap.achievements && typeof snap.achievements === 'object') ? snap.achievements : {};
  if(snap.settings && typeof snap.settings === 'object'){ state.settings = Object.assign({}, state.settings, snap.settings); state.settings.lang = currentLang; }
  const r = migrate(state); if(r.ok) state = r.data;
  saveState();
}
function jtCountSnapshot(snap){
  if(!snap || typeof snap !== 'object') return {};
  const transferCount = Array.isArray(snap.transactions) ? snap.transactions.filter(tx => tx.type === 'transfer').length : 0;
  let repaymentCount = 0; if(Array.isArray(snap.debts)){ snap.debts.forEach(d => { if(Array.isArray(d.repayments)) repaymentCount += d.repayments.length; }); }
  return { accounts: Array.isArray(snap.accounts) ? snap.accounts.length : 0, transactions: Array.isArray(snap.transactions) ? snap.transactions.length : 0, transfers: transferCount, goals: Array.isArray(snap.goals) ? snap.goals.length : 0, assets: Array.isArray(snap.assets) ? snap.assets.length : 0, debts: Array.isArray(snap.debts) ? snap.debts.length : 0, repayments: repaymentCount, moneyGiven: Array.isArray(snap.moneyGiven) ? snap.moneyGiven.length : 0 };
}

function viewSecureTransfer(){
  const pendingState = jtLoadTransferState();
  const hasPending = pendingState && pendingState.status === 'in_progress';
  if(hasPending && jtUI.mode === 'menu' && !jtUI.importDone && !jtUI.exportDone){
    return `<div class="card" style="border:2px solid var(--amber);background:#fff8ec"><div class="section-head" style="margin-bottom:8px"><h3 style="color:var(--amber)">⚠️ ${esc(t('secureTransferInProgressTitle'))}</h3></div><p style="font-size:13px;line-height:1.7;color:var(--text);margin:0 0 12px">${esc(t('secureTransferInProgressDesc'))}</p><button class="btn ghost block" onclick="jtAcknowledgePending()">${esc(t('ok'))}</button></div>${jtUI.mode === 'menu' ? jtRenderMenu() : ''}`;
  }
  if(jtUI.mode === 'export') return jtRenderExport();
  if(jtUI.mode === 'import') return jtRenderImport();
  return jtRenderMenu();
}
function jtAcknowledgePending(){ jtUI.mode = 'menu'; render(); }
function jtRenderMenu(){
  return `<p class="about" style="margin:0 0 10px;text-align:left">${esc(t('secureTransferIntro'))}</p>
  <div class="card" style="border-left:4px solid var(--brand)">
    <div class="set-row tap" onclick="jtGoExport()" style="cursor:pointer"><div><div class="set-title">📤 ${esc(t('secureExportTab'))}</div><div class="set-sub">${esc(t('secureExportBtn'))}</div></div><span class="chev">›</span></div>
    <div class="set-row tap" onclick="jtGoImport()" style="cursor:pointer"><div><div class="set-title">📥 ${esc(t('secureImportTab'))}</div><div class="set-sub">${esc(t('secureImportBtn'))}</div></div><span class="chev">›</span></div>
  </div>
  <div class="card"><div class="section-head" style="margin-bottom:8px"><h3>🔒 ${esc(t('secureBackupReminderTitle'))}</h3></div><p style="font-size:12px;line-height:1.7;color:var(--muted);margin:0">${esc(t('secureBackupReminderDesc'))}</p></div>`;
}
function jtGoExport(){ jtResetUI(); jtUI.mode = 'export'; ui.sub = 'secure-transfer'; render({ top:true }); }
function jtGoImport(){ jtResetUI(); jtUI.mode = 'import'; ui.sub = 'secure-transfer'; render({ top:true }); }
function jtBackToMenu(){
  jtResetUI();
  if(resetUI && resetUI.exportedInSession){ ui.sub = 'reset-jiheng'; resetUI.step = 'backup'; render({ top:true }); return; }
  ui.sub = 'settings'; render({ top:true });
}
function jtRenderExport(){
  if(jtUI.exportDone){
    return `<div class="card" style="border-left:4px solid var(--green)"><div class="section-head" style="margin-bottom:10px"><h3 style="color:var(--green)">✅ ${esc(t('secureExportSuccessTitle'))}</h3></div><p style="font-size:13px;line-height:1.7;margin:0 0 12px">${esc(t('secureExportSuccess'))}</p><div class="asset-rows" style="margin-bottom:12px"><div class="ar"><span>${esc(t('secureExportFilePrefix'))}</span><b style="font-size:11px">${esc(jtUI.exportFileName)}</b></div></div><div class="card" style="background:#fff8ec;border:1.5px solid var(--amber);margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:6px">⚠️ ${esc(t('secureExportWarningTitle'))}</div><div style="font-size:12px;line-height:1.7;color:var(--text)">${esc(t('secureExportWarning'))}</div></div><button class="btn primary block" onclick="jtBackToMenu()">${esc(t('ok'))}</button></div>`;
  }
  const pw = jtUI.exportPassword; const pw2 = jtUI.exportPasswordConfirm; const strength = jtScorePassword(pw); const weakReasons = strength.reasons || [];
  const strengthLabel = strength.label === 'weak' ? t('secureStrengthWeak') : strength.label === 'fair' ? t('secureStrengthFair') : strength.label === 'strong' ? t('secureStrengthStrong') : t('secureStrengthVeryStrong');
  const strengthColor = strength.label === 'weak' ? 'var(--red)' : strength.label === 'fair' ? 'var(--amber)' : strength.label === 'strong' ? 'var(--green)' : '#0e9b6b';
  const match = pw && pw2 && pw === pw2;
  return `<div class="card"><div class="section-head" style="margin-bottom:8px"><h3>📤 ${esc(t('secureExportTitle'))}</h3><button class="link" onclick="jtBackToMenu()">${esc(t('back'))}</button></div><p style="font-size:12px;line-height:1.65;color:var(--muted);margin:0 0 14px">${esc(t('securePasswordHint'))}</p>
    <label class="field"><span class="field-label">${esc(t('securePasswordLabel'))}</span><div style="position:relative"><input type="password" id="jt-exp-pw" value="${esc(pw)}" maxlength="128" placeholder="${esc(t('securePasswordPlaceholder'))}" oninput="jtOnExportPwInput(this.value)" autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false" style="padding-right:52px"><button type="button" class="icon-btn sm" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;font-size:16px" onclick="jtTogglePasswordVisibility('jt-exp-pw', this)">🙈</button></div></label>
    ${pw ? `<div style="display:flex;gap:8px;align-items:center;margin-top:-8px;margin-bottom:12px;flex-wrap:wrap"><span style="font-size:12px;color:var(--muted);font-weight:600">${esc(t('secureStrengthLabel'))}</span><span style="font-size:12px;font-weight:800;color:${strengthColor}">${esc(strengthLabel)}</span></div>${weakReasons.length ? `<div style="background:#fdecec;border-radius:10px;padding:10px 12px;margin-bottom:14px">${weakReasons.map(r => `<div style="font-size:12px;color:var(--red);line-height:1.6">• ${esc(jtWeakReasonLabel(r))}</div>`).join('')}</div>` : `<div style="background:#e7f8f1;border-radius:10px;padding:10px 12px;margin-bottom:14px"><div style="font-size:12px;color:var(--green);line-height:1.6;font-weight:600">${esc(t('secureStrengthNote'))}</div></div>`}` : ''}
    <label class="field"><span class="field-label">${esc(t('securePasswordConfirmLabel'))}</span><div style="position:relative"><input type="password" id="jt-exp-pw2" value="${esc(pw2)}" maxlength="128" placeholder="${esc(t('securePasswordPlaceholder'))}" oninput="jtOnExportPw2Input(this.value)" autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false" style="padding-right:52px"><button type="button" class="icon-btn sm" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;font-size:16px" onclick="jtTogglePasswordVisibility('jt-exp-pw2', this)">🙈</button></div></label>
    ${pw2 && pw && pw !== pw2 ? `<div style="font-size:12px;color:var(--red);margin-top:-8px;margin-bottom:10px">${esc(t('securePasswordMismatch'))}</div>` : ''}
    <div class="card" style="background:#fafbfd;margin-top:6px"><div style="font-size:12px;font-weight:700;color:var(--brand);margin-bottom:6px">${esc(t('securePasswordRequirement'))}</div><div style="font-size:12px;color:var(--text);line-height:1.8">${esc(t('secureReqLength'))}</div><div style="font-size:12px;color:var(--text);line-height:1.8">${esc(t('secureReqNotAppLock'))}</div><div style="font-size:12px;color:var(--text);line-height:1.8">${esc(t('secureReqNotSimilar'))}</div><div style="font-size:12px;color:var(--text);line-height:1.8">${esc(t('secureReqNotWeak'))}</div></div></div>
  <div class="card" style="background:#fff8ec;border:1.5px solid var(--amber)"><div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:6px">⚠️ ${esc(t('secureExportWarningTitle'))}</div><div style="font-size:12px;line-height:1.7;color:var(--text)">${esc(t('secureExportWarning'))}</div></div>
  ${jtUI.exportBusy ? `<button class="btn primary block" disabled style="opacity:.6">${esc(t('secureStepDecrypting'))}</button>` : `<button class="btn primary block" onclick="jtDoExport()" ${(!pw || !pw2 || !match) ? 'disabled style="opacity:.5"' : ''}>${esc(t('secureExportStartBtn'))}</button>`}
  <button class="btn ghost block" onclick="jtBackToMenu()">${esc(t('secureExportCancelBtn'))}</button>`;
}
function jtOnExportPwInput(v){ jtUI.exportPassword = v; jtRerenderSecure(); }
function jtOnExportPw2Input(v){ jtUI.exportPasswordConfirm = v; jtRerenderSecure(); }
function jtOnImportPwInput(v){ jtUI.importPassword = v; }
function jtRerenderSecure(){
  const root = document.getElementById('app'); if(!root) return;
  const view = root.querySelector('.view'); if(!view) { render(); return; }
  const active = document.activeElement; const activeId = active ? active.id : null; const selStart = active && active.selectionStart != null ? active.selectionStart : null; const selEnd = active && active.selectionEnd != null ? active.selectionEnd : null;
  view.innerHTML = viewSecureTransfer();
  if(activeId){ const el = document.getElementById(activeId); if(el){ try { el.focus(); } catch(e){} if(selStart != null && selEnd != null && el.setSelectionRange){ try { el.setSelectionRange(selStart, selEnd); } catch(e){} } } }
}
function jtWeakReasonLabel(key){
  const map = { empty: 'secureWeakReasonEmpty', too_short: 'secureWeakReasonTooShort', common_password: 'secureWeakReasonCommon', repeated_digit: 'secureWeakReasonRepeatedDigit', repeated_char: 'secureWeakReasonRepeatedChar', keyboard_pattern: 'secureWeakReasonKeyboard', sequential_pattern: 'secureWeakReasonSequential', digits_only: 'secureWeakReasonDigitsOnly', letters_only: 'secureWeakReasonLettersOnly', contains_app_name: 'secureWeakReasonAppName', phone_like: 'secureWeakReasonPhoneLike' };
  return t(map[key] || key);
}
async function jtDoExport(){
  if(jtUI.exportBusy) return;
  const pw = jtUI.exportPassword; const pw2 = jtUI.exportPasswordConfirm;
  if(!pw || pw.length < JT_TRANSFER_PW_MIN_LENGTH){ toast(t('securePasswordTooShort', { n: JT_TRANSFER_PW_MIN_LENGTH })); return; }
  const sc = jtScorePassword(pw); if(sc.score === 0){ toast(t('securePasswordTooWeak')); return; }
  if(pw !== pw2){ toast(t('securePasswordMismatch')); return; }
  const similar = await jtCheckAppLockSimilarity(pw); if(similar.similar){ if(similar.reason === 'identical') toast(t('securePasswordSameAsAppLock')); else toast(t('securePasswordSimilarToAppLock')); return; }
  jtUI.exportBusy = true; jtRerenderSecure();
  try {
    jtStartTransferState('export', { startedAt: Date.now() });
    const snap = jtBuildSnapshot(); const result = await jtBuildAndEncryptPackage(pw, snap);
    const filename = (t('secureExportFilePrefix') || 'Jiheng_Transfer') + '_' + nowLocalDate() + '_' + nowLocalTime().replace(/:/g,'') + '.jhtransfer';
    const blob = new Blob([JSON.stringify(result.container)], { type: 'application/octet-stream' });
    downloadBlob(blob, filename);
    jtUI.exportFileName = filename; jtUI.exportDone = true; jtUI.exportBusy = false;
    jtMarkTransferComplete('export', { packageId: result.packageId, filename: filename });
    jtUI.exportPassword = ''; jtUI.exportPasswordConfirm = '';
    jtRerenderSecure(); toast(t('secureExportSuccessTitle'));
  } catch(e){ jtUI.exportBusy = false; jtRerenderSecure(); toast(t('secureStepFailed')); console.error('[JT export]', e); }
}

function jtRenderImport(){
  if(jtUI.importDone){
    return `<div class="card" style="border-left:4px solid var(--green)"><div class="section-head" style="margin-bottom:10px"><h3 style="color:var(--green)">✅ ${esc(t('secureImportSuccessTitle'))}</h3></div><p style="font-size:13px;line-height:1.7;margin:0 0 10px">${esc(t('secureImportSuccessDesc'))}</p><div class="card" style="background:#fff8ec;border:1.5px solid var(--amber);margin-bottom:12px"><div style="font-size:12px;line-height:1.7;color:var(--text)">${esc(t('secureImportSuccessReminder'))}</div></div><button class="btn primary block" onclick="jtBackToMenu()">${esc(t('ok'))}</button></div>`;
  }
  if(!jtUI.importContainer){
    return `<div class="card"><div class="section-head" style="margin-bottom:8px"><h3>📥 ${esc(t('secureImportTitle'))}</h3><button class="link" onclick="jtBackToMenu()">${esc(t('back'))}</button></div><p style="font-size:12px;line-height:1.65;color:var(--muted);margin:0 0 14px">${esc(t('secureImportPickFile'))}</p><label class="field"><input type="file" id="jt-import-file" accept=".jhtransfer,application/json,application/octet-stream" onchange="jtOnImportFileChosen(this)" style="display:none"><button type="button" class="btn primary block" onclick="document.getElementById('jt-import-file').click()">${esc(t('secureImportBtn'))}</button></label>${jtUI.importError ? `<div style="background:#fdecec;border-radius:10px;padding:10px 12px;margin-top:12px"><div style="font-size:12px;color:var(--red);line-height:1.6">${esc(jtUI.importError)}</div></div>` : ''}</div>`;
  }
  if(jtUI.importContainer && !jtUI.importPreview){
    const dupWarn = jtUI.duplicateWarning ? `<div class="card" style="background:#fff8ec;border:1.5px solid var(--amber);margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:6px">⚠️ ${esc(t('secureImportDuplicateTitle'))}</div><div style="font-size:12px;line-height:1.7;color:var(--text)">${esc(t('secureImportDuplicateDesc'))}</div></div>` : '';
    return `<div class="card"><div class="section-head" style="margin-bottom:8px"><h3>🔓 ${esc(t('secureImportPasswordLabel'))}</h3><button class="link" onclick="jtBackToMenu()">${esc(t('back'))}</button></div><p style="font-size:12px;line-height:1.65;color:var(--muted);margin:0 0 14px">${esc(t('secureImportPasswordHint'))}</p>${dupWarn}<label class="field"><span class="field-label">${esc(t('secureImportPasswordLabel'))}</span><div style="position:relative"><input type="password" id="jt-import-pw" value="${esc(jtUI.importPassword)}" maxlength="128" placeholder="${esc(t('securePasswordPlaceholder'))}" oninput="jtOnImportPwInput(this.value)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" style="padding-right:52px"><button type="button" class="icon-btn sm" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;font-size:16px" onclick="jtTogglePasswordVisibility('jt-import-pw', this)">🙈</button></div></label>${jtUI.importError ? `<div style="background:#fdecec;border-radius:10px;padding:10px 12px;margin-bottom:12px"><div style="font-size:12px;color:var(--red);line-height:1.6">${esc(jtUI.importError)}</div></div>` : ''}${jtUI.importBusy ? `<div style="background:#f1eef9;border-radius:10px;padding:12px;margin-bottom:12px;text-align:center"><div style="font-size:12px;color:var(--brand);font-weight:600">${esc(jtUI.importStep || t('secureStepDecrypting'))}</div></div><button class="btn primary block" disabled style="opacity:.6">${esc(jtUI.importStep || t('secureStepDecrypting'))}</button>` : `<button class="btn primary block" onclick="jtDoDecryptAndPreview()">${esc(t('secureImportStartBtn'))}</button>`}<button class="btn ghost block" onclick="jtBackToMenu()">${esc(t('secureImportCancelBtn'))}</button></div>`;
  }
  if(jtUI.importPreview){
    const c = jtCountSnapshot(jtUI.importPreview);
    const existingWarn = jtUI.existingDataWarning ? `<div class="card" style="background:#fff8ec;border:1.5px solid var(--amber);margin-bottom:12px"><div style="font-size:12px;font-weight:700;color:var(--amber);margin-bottom:6px">⚠️ ${esc(t('secureImportExistingDataTitle'))}</div><div style="font-size:12px;line-height:1.7;color:var(--text)">${esc(t('secureImportExistingDataDesc'))}</div></div>` : '';
    return `<div class="card"><div class="section-head" style="margin-bottom:8px"><h3>📋 ${esc(t('secureImportPreviewTitle'))}</h3><button class="link" onclick="jtBackToMenu()">${esc(t('back'))}</button></div><p style="font-size:12px;line-height:1.65;color:var(--muted);margin:0 0 14px">${esc(t('secureImportPreviewDesc'))}</p>${existingWarn}<div class="asset-rows"><div class="ar"><span>${esc(t('secureImportPreviewAccounts'))}</span><b>${c.accounts}</b></div><div class="ar"><span>${esc(t('secureImportPreviewTransactions'))}</span><b>${c.transactions}</b></div><div class="ar"><span>${esc(t('secureImportPreviewTransfers'))}</span><b>${c.transfers}</b></div><div class="ar"><span>${esc(t('secureImportPreviewGoals'))}</span><b>${c.goals}</b></div><div class="ar"><span>${esc(t('secureImportPreviewAssets'))}</span><b>${c.assets}</b></div><div class="ar"><span>${esc(t('secureImportPreviewDebts'))}</span><b>${c.debts}</b></div><div class="ar"><span>${esc(t('secureImportPreviewRepayments'))}</span><b>${c.repayments}</b></div><div class="ar"><span>${esc(t('secureImportPreviewMoneyGiven'))}</span><b>${c.moneyGiven}</b></div></div></div>${jtUI.importError ? `<div style="background:#fdecec;border-radius:10px;padding:10px 12px;margin-bottom:12px"><div style="font-size:12px;color:var(--red);line-height:1.6">${esc(jtUI.importError)}</div></div>` : ''}${jtUI.importBusy ? `<button class="btn primary block" disabled style="opacity:.6">${esc(jtUI.importStep || t('secureStepImporting'))}</button>` : `<button class="btn primary block" onclick="jtDoFinalImport()">${esc(t('secureImportPreviewConfirmBtn'))}</button>`}<button class="btn ghost block" onclick="jtBackToMenu()">${esc(t('secureImportCancelBtn'))}</button>`;
  }
  return '';
}
function jtTogglePasswordVisibility(inputId, btn){
  const el = document.getElementById(inputId); if(!el) return;
  const isPw = el.type === 'password'; el.type = isPw ? 'text' : 'password';
  if(btn) btn.textContent = isPw ? '👁' : '🙈';
}
function jtOnImportFileChosen(input){
  jtUI.importError = ''; jtUI.importPreview = null; jtUI.importContainer = null; jtUI.importPassword = ''; jtUI.duplicateWarning = false; jtUI.existingDataWarning = false;
  const file = input.files && input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = String(e.target.result || ''); const parsed = JSON.parse(text);
      if(!parsed || parsed.format !== JT_TRANSFER_FORMAT){ jtUI.importError = t('secureImportFileInvalid'); jtRerenderSecure(); return; }
      if(parsed.formatVersion !== JT_TRANSFER_FORMAT_VERSION){ jtUI.importError = t('secureImportFileVersionUnsupported'); jtRerenderSecure(); return; }
      jtUI.importContainer = parsed; jtUI.importPackageId = parsed.packageId || '';
      if(jtUI.importPackageId && jtHasPackageBeenImported(jtUI.importPackageId)){ jtUI.duplicateWarning = true; }
      const hasExisting = (state.accounts.length || state.transactions.length || state.goals.length || state.assets.length || state.debts.length || state.moneyGiven.length);
      if(hasExisting) jtUI.existingDataWarning = true;
      jtRerenderSecure();
    } catch(err){ jtUI.importError = t('secureImportFileInvalid'); jtRerenderSecure(); }
  };
  reader.onerror = () => { jtUI.importError = t('secureImportFileInvalid'); jtRerenderSecure(); };
  reader.readAsText(file);
}
async function jtDoDecryptAndPreview(){
  // 🔥 修复 Bug：强制重置状态，防止卡死
  jtUI.importBusy = false;
  
  const pwEl = document.getElementById('jt-import-pw');
  const pw = pwEl ? pwEl.value : jtUI.importPassword;
  if(!pw){ alert("请先输入导入密码！"); return; }
  
  if (!window.crypto || !window.crypto.subtle) {
    alert("导入失败：当前环境不支持解密。\n\n请务必通过 https:// 访问网页（比如 GitHub Pages），或安装到主屏幕运行。");
    jtUI.importBusy = false;
    jtRerenderSecure();
    return;
  }
  
  if(jtUI.importBusy) return;
  jtUI.importBusy = true; jtUI.importError = ''; jtUI.importStep = t('secureStepReading'); jtRerenderSecure();
  jtStartTransferState('import', { packageId: jtUI.importPackageId || '' });
  try {
    jtUI.importStep = t('secureStepVerifying'); jtRerenderSecure();
    if(!jtUI.importContainer || jtUI.importContainer.format !== JT_TRANSFER_FORMAT){ throw new Error('JT_ERR_INVALID_FORMAT'); }
    jtUI.importStep = t('secureStepDecrypting'); jtRerenderSecure();
    let decrypted;
    try { decrypted = await jtDecryptPackage(pw, jtUI.importContainer); } catch(e){ if(e && e.message === 'JT_ERR_DECRYPT_FAILED'){ jtUI.importBusy = false; jtUI.importError = t('secureImportPasswordWrong'); jtRerenderSecure(); return; } if(e && e.message === 'JT_ERR_CORRUPTED'){ jtUI.importBusy = false; jtUI.importError = t('secureImportFileCorrupted'); jtRerenderSecure(); return; } throw e; }
    jtUI.importStep = t('secureStepValidating'); jtRerenderSecure();
    const snap = decrypted && decrypted.state ? decrypted.state : decrypted;
    if(!jtValidateSnapshot(snap)){ jtUI.importBusy = false; jtUI.importError = t('secureImportFileInvalid'); jtRerenderSecure(); return; }
    jtUI.importPreview = snap; jtUI.importBusy = false; jtUI.importStep = ''; jtUI.importPassword = ''; jtRerenderSecure();
  } catch(e){ jtUI.importBusy = false; jtUI.importError = t('secureImportFileCorrupted'); jtRerenderSecure(); console.error('[JT import]', e); }
}
async function jtDoFinalImport(){
  if(jtUI.importBusy) return; if(!jtUI.importPreview) return;
  jtUI.importBusy = true; jtUI.importError = ''; jtUI.importStep = t('secureStepImporting'); jtRerenderSecure();
  try {
    await new Promise(r => setTimeout(r, 50));
    const snap = jtUI.importPreview; const prevState = JSON.parse(JSON.stringify(state));
    try { jtApplySnapshotToState(snap); } catch(e){ state = prevState; saveState(); throw e; }
    jtUI.importStep = t('secureStepVerifyingResult'); jtRerenderSecure(); await new Promise(r => setTimeout(r, 50));
    const ok = (state.accounts.length === (snap.accounts ? snap.accounts.length : 0) && state.transactions.length === (snap.transactions ? snap.transactions.length : 0) && state.goals.length === (snap.goals ? snap.goals.length : 0) && state.assets.length === (snap.assets ? snap.assets.length : 0) && state.debts.length === (snap.debts ? snap.debts.length : 0) && state.moneyGiven.length === (snap.moneyGiven ? snap.moneyGiven.length : 0));
    if(!ok){ state = prevState; saveState(); throw new Error('JT_VERIFY_MISMATCH'); }
    if(jtUI.importPackageId){ jtMarkPackageImported(jtUI.importPackageId, {}); }
    jtMarkTransferComplete('import', { packageId: jtUI.importPackageId || '' });
    jtUI.importDoneSnapshot = snap; jtUI.importPreview = null; jtUI.importContainer = null; jtUI.importDone = true; jtUI.importBusy = false; jtUI.importStep = '';
    render({ top:true }); toast(t('secureImportSuccessTitle'));
  } catch(e){ jtUI.importBusy = false; jtUI.importError = t('secureImportFileCorrupted'); jtRerenderSecure(); console.error('[JT final import]', e); }
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ============================ 重置逻辑 ============================ */
function resetOnType(v){
  resetUI.typed = v; const target = 'RESET JIHENG'; const ok = String(v || '').trim() === target;
  const btn = document.getElementById('reset-type-continue'); if(btn){ if(ok){ btn.disabled = false; btn.style.opacity = '1'; }else{ btn.disabled = true; btn.style.opacity = '0.5'; } }
  const err = document.getElementById('reset-type-err'); if(err){ err.textContent = (v && !ok) ? t('typeMismatch') : ''; }
}
function resetOnVerify(v){ resetUI.verifyPw = v; resetUI.verifyError = ''; }
function resetExportBackup(){ jtUI.mode = 'export'; ui.sub = 'secure-transfer'; resetUI.exportedInSession = true; render({ top:true }); }
function resetGoStep(step){ ui.sub = 'reset-jiheng'; resetUI.step = step; render(); }
function resetCancel(){ resetResetUI(); ui.sub = 'settings'; ui.subStack = []; render({ top:true }); }
async function resetDoVerify(){
  const pw = String(resetUI.verifyPw || ''); if(!pw) return;
  if(!lockRecord || !lockRecord.hash){ resetUI.verifyError = t('verifyNoLock'); resetUI.step = 'verify'; render(); return; }
  const hash = await sha256(pw);
  if(hash === lockRecord.hash){ resetUI.verifyPw = ''; resetUI.verifyError = ''; resetUI.step = 'backup'; render(); toast(t('verifyOk')); }
  else { resetUI.verifyError = t('verifyFail'); resetUI.verifyPw = ''; render(); }
}
function resetHoldStart(e){
  if(e) e.preventDefault(); if(resetUI.holding || resetUI.busy) return;
  resetUI.holding = true; resetUI.holdStartAt = Date.now(); resetUI.holdProgress = 0;
  window.addEventListener('blur', resetHoldAbort, { once:true });
  document.addEventListener('visibilitychange', resetHoldVisibility, { once:false });
  const tick = () => {
    if(!resetUI.holding) return;
    const el = Date.now() - resetUI.holdStartAt; const p = Math.min(el / 1000, 3); resetUI.holdProgress = p;
    const progEl = document.getElementById('reset-hold-progress'); if(progEl) progEl.textContent = t('finalHoldProgress', { n: p.toFixed(1) });
    if(p >= 3){ resetUI.holding = false; document.removeEventListener('visibilitychange', resetHoldVisibility); resetHoldSuccess(); return; }
    resetUI.holdRaf = requestAnimationFrame(tick);
  };
  resetUI.holdRaf = requestAnimationFrame(tick);
}
function resetHoldEnd(){
  if(!resetUI.holding) return; resetUI.holding = false;
  if(resetUI.holdRaf) cancelAnimationFrame(resetUI.holdRaf);
  document.removeEventListener('visibilitychange', resetHoldVisibility);
  toast(t('finalReleased')); const progEl = document.getElementById('reset-hold-progress'); if(progEl) progEl.textContent = ''; resetUI.holdProgress = 0;
}
function resetHoldAbort(){
  if(!resetUI.holding) return; resetUI.holding = false;
  if(resetUI.holdRaf) cancelAnimationFrame(resetUI.holdRaf);
  document.removeEventListener('visibilitychange', resetHoldVisibility);
  toast(t('finalInterrupted')); const progEl = document.getElementById('reset-hold-progress'); if(progEl) progEl.textContent = ''; resetUI.holdProgress = 0;
}
function resetHoldVisibility(){ if(document.visibilityState !== 'visible') resetHoldAbort(); }
async function resetHoldSuccess(){
  resetUI.step = 'processing'; render({ top:true }); await new Promise(r => setTimeout(r, 80));
  try {
    const ok = await executeJihengUserDataReset();
    if(ok){
      resetUI.done = true; resetUI.step = 'done';
      isUnlocked = false; lockRecord = null; lockUI.mode = 'create'; lockUI.pin = ''; lockUI.firstPin = ''; lockUI.msg = ''; lockUI.error = false; lockUI.useTextMode = false;
      render({ top:true }); renderLock();
    }else{ resetUI.step = 'error'; resetUI.error = t('errorBody'); render({ top:true }); }
  }catch(e){ console.error('[Reset] failed:', e); resetUI.step = 'error'; resetUI.error = t('errorBody'); render({ top:true }); }
}
async function executeJihengUserDataReset(){
  try {
    try { sentinelLogEvent('reset_start', 'Jiheng user data reset started'); } catch(e){}
    const USER_DATA_KEYS = [STORAGE_KEY, BACKUP_KEY, LOCK_KEY, LANG_KEY, META_KEY, SENTINEL_KEY, CHANGELOG_KEY, JT_TRANSFER_STATE_KEY, JT_IMPORTED_PACKAGES_KEY];
    const ALL_KEYS = USER_DATA_KEYS.concat(LEGACY_KEYS || []).concat(LEGACY_LOCK_KEYS || []).concat(LEGACY_LANG_KEYS || []).concat(LEGACY_META_KEYS || []);
    for(const k of ALL_KEYS){ try { localStorage.removeItem(k); } catch(e){} }
    state = defaultState(); LANG = state.settings.lang || 'zh';
    META = { appVersion: APP_VERSION, dataVersion: DATA_VERSION, lastUpdated: new Date().toISOString() }; saveMeta(META);
    CHANGELOG = CHANGELOG_SEED.slice(); saveChangelog();
    sentinelState = { lastCheckAt:null, lastStatus:'unknown', events:[] }; sentinelSave(sentinelState);
    saveState(); jtResetUI();
    return true;
  }catch(e){ console.error('[executeJihengUserDataReset] error:', e); return false; }
}

/* ============================ 兼容导出 ============================ */
function exportData(){ jtGoExport(); }
function exportCSV(){ jtGoExport(); }
function triggerImport(){ jtGoImport(); }
function clearData(){ jtGoImport(); }

/* ============================ PWA 支持 ============================ */
(function(){
  try {
    if(!('serviceWorker' in navigator)) return;
    if(location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).then(reg => {
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing; if(!nw) return;
            nw.addEventListener('statechange', () => { if(nw.state === 'installed' && navigator.serviceWorker.controller){ showPwaUpdateAvailable(); } });
          });
          setInterval(() => { reg.update().catch(() => {}); }, 60 * 60 * 1000);
        }).catch(err => { console.warn('[Jiheng PWA] SW registration failed:', err && err.message); });
    });
  } catch(e){ console.warn('[Jiheng PWA] init error:', e); }
})();

function pwaT(key){ const pack = I18N[LANG] || I18N.zh; return (pack.pwa && pack.pwa[key]) || (I18N.zh.pwa && I18N.zh.pwa[key]) || key; }
function isStandalone(){ try { if(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true; if(window.navigator && window.navigator.standalone === true) return true; if(window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) return true; } catch(e){} return false; }
function isIOSDevice(){ const ua = navigator.userAgent || ''; const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream; const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1; return iOS || iPadOS; }
function isAndroidDevice(){ return /Android/i.test(navigator.userAgent || ''); }

let _deferredInstallPrompt = null;
const PWA_DISMISS_KEY = 'jiheng_pwa_dismissed_at_v1'; const PWA_DISMISS_DAYS = 14;
function wasPwaDismissedRecently(){ try { const t = Number(localStorage.getItem(PWA_DISMISS_KEY) || 0); if(!t) return false; return (Date.now() - t) < PWA_DISMISS_DAYS * 86400000; } catch(e){ return false; } }
function markPwaDismissed(){ try { localStorage.setItem(PWA_DISMISS_KEY, String(Date.now())); } catch(e){} }

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); _deferredInstallPrompt = e;
  setTimeout(() => { if(!isStandalone() && !wasPwaDismissedRecently()) showPwaInstallCard(); }, 3000);
});
window.addEventListener('appinstalled', () => { _deferredInstallPrompt = null; hidePwaInstallCard(); try{ toast(pwaT('installedToast')); }catch(e){} });

function showPwaInstallCard(){
  const root = document.getElementById('pwa-install-root'); if(!root) return;
  if(root.classList.contains('show')) return;
  const isIOS = isIOSDevice(); const isAndroid = isAndroidDevice(); let body = '';
  if(isIOS){
    body = `<div class="pi-title">${esc(pwaT('iosTitle'))}</div><div class="pi-desc">${esc(pwaT('iosDesc'))}</div><div class="pwa-install-steps"><b>${esc(pwaT('iosStepsTitle'))}</b><ol><li>${esc(pwaT('iosStep1'))}</li><li>${esc(pwaT('iosStep2'))}</li><li>${esc(pwaT('iosStep3'))}</li></ol><div style="margin-top:6px;color:var(--muted);font-size:11.5px;line-height:1.55">${esc(pwaT('iosDataNote'))}</div></div><div class="pi-acts"><button class="pi-btn ghost" data-pwa-dismiss>${esc(pwaT('gotIt'))}</button></div>`;
  } else if(_deferredInstallPrompt){
    body = `<div class="pi-title">${esc(pwaT('androidTitle'))}</div><div class="pi-desc">${esc(pwaT('androidDesc'))}</div><div class="pi-acts"><button class="pi-btn primary" data-pwa-install>${esc(pwaT('installBtn'))}</button><button class="pi-btn ghost" data-pwa-dismiss>${esc(pwaT('later'))}</button></div>`;
  } else { return; }
  root.innerHTML = `<div class="pwa-install-card"><div class="pi-icon">📲</div><div class="pi-body">${body}</div><button class="pi-close" data-pwa-dismiss aria-label="Close">✕</button></div>`;
  root.classList.add('show');
  root.querySelectorAll('[data-pwa-dismiss]').forEach(el => { el.addEventListener('click', () => { markPwaDismissed(); hidePwaInstallCard(); }); });
  const installBtn = root.querySelector('[data-pwa-install]');
  if(installBtn){ installBtn.addEventListener('click', async () => { if(!_deferredInstallPrompt) return; try { _deferredInstallPrompt.prompt(); const choice = await _deferredInstallPrompt.userChoice; if(choice && choice.outcome === 'accepted'){ hidePwaInstallCard(); } else { markPwaDismissed(); hidePwaInstallCard(); } } catch(e){} _deferredInstallPrompt = null; }); }
}
function hidePwaInstallCard(){ const root = document.getElementById('pwa-install-root'); if(root){ root.classList.remove('show'); root.innerHTML = ''; } }
window.addEventListener('load', () => { setTimeout(() => { if(isStandalone()) return; if(wasPwaDismissedRecently()) return; if(isIOSDevice()){ const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent); if(isSafari) showPwaInstallCard(); } }, 3500); });

function showPwaUpdateAvailable(){
  if(document.getElementById('pwa-update-banner')) return;
  const el = document.createElement('div'); el.id = 'pwa-update-banner';
  el.style.cssText = 'position:fixed;left:0;right:0;top:calc(8px + var(--safe-t));z-index:195;display:flex;justify-content:center;padding:0 16px;pointer-events:none;';
  el.innerHTML = `<div style="background:rgba(28,24,48,.94);color:#fff;font-size:12.5px;font-weight:600;padding:10px 14px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.28);display:flex;align-items:center;gap:10px;pointer-events:auto;max-width:100%;"><span style="overflow-wrap:anywhere;">${esc(pwaT('updateAvailable'))}</span><button id="pwa-update-reload" style="border:none;background:var(--accent);color:#3d3158;font-size:12px;font-weight:800;padding:6px 12px;border-radius:9px;cursor:pointer;flex:0 0 auto;">${esc(pwaT('reload'))}</button></div>`;
  document.body.appendChild(el);
  const btn = el.querySelector('#pwa-update-reload');
  if(btn) btn.addEventListener('click', () => { if(navigator.serviceWorker && navigator.serviceWorker.controller){ navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' }); } setTimeout(() => { window.location.reload(); }, 200); });
}
function updateOnlineStatus(){
  const root = document.getElementById('pwa-offline-root'); if(!root) return;
  if(navigator.onLine){ root.classList.remove('show'); root.innerHTML = ''; } else { root.innerHTML = `<div class="pwa-offline-pill"><span class="pwa-dot"></span>${esc(pwaT('offline'))}</div>`; root.classList.add('show'); }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
window.addEventListener('load', () => { setTimeout(updateOnlineStatus, 500); });

window.addEventListener('storage', e => {
  if(e.key === STORAGE_KEY){ const r = loadState(); if(!r.migrationFailed && !r.parseError){ state = r.state; LANG = state.settings.lang || LANG; if(isUnlocked) render(); } }
  if(e.key === LOCK_KEY){ lockRecord = loadLock(); if(!lockRecord){ isUnlocked = true; renderLock(); render({ top:true }); } }
  if(e.key === META_KEY){ META = loadMeta(); if(isUnlocked) render(); }
});

/* =========================================================================
   最终启动引擎
   ========================================================================= */
(function boot(){
  state.accounts.forEach(a => { a.balance = round2(Number(a.balance) || 0); });
  state.goals.forEach(g => { g.saved = round2(Number(g.saved) || 0); g.targetAmount = round2(Number(g.targetAmount) || 0); });
  state.debts.forEach(d => {
    d.amount = round2(Number(d.amount)||0); d.originalAmount = round2(Number(d.originalAmount) || d.amount); d.paid = round2(Number(d.paid)||0);
    if(!Array.isArray(d.payments)) d.payments = []; if(!Array.isArray(d.repayments)) d.repayments = [];
    d.remainingAmount = round2(Math.max(d.originalAmount - d.paid, 0));
  });
  state.moneyGiven.forEach(m => { m.amount = round2(Number(m.amount)||0); });
  if(lockRecord && lockRecord.hash && !lockRecord.type){ lockRecord.type = 'pin'; saveLock(lockRecord); }
  if(APP_VERSION && APP_VERSION > (META.appVersion || '0')){ META.appVersion = APP_VERSION; }
  META.dataVersion = DATA_VERSION; META.lastUpdated = new Date().toISOString(); saveMeta(META);
  if(loadResult.migrationFailed){ setTimeout(() => toast(t('migrationFailed')), 2200); }
  if(loadResult.parseError){ setTimeout(() => toast(t('migrationFailed')), 2200); }
  saveChangelog(); saveState(); checkAchievements();

  if(lockRecord && lockRecord.hash){ isUnlocked = false; lockUI.mode = 'unlock'; }
  else { isUnlocked = false; lockUI.mode = 'create'; }

  const lockRoot = document.getElementById('lock-root');
  if(lockRoot) lockRoot.style.visibility = 'hidden';
  renderLock();

  showSplash(() => {
    if(lockRoot) lockRoot.style.visibility = '';
    renderLock();
    if(isUnlocked) render({ top:true });
  });

  console.log('[Jiheng] v' + APP_VERSION + ' ready. Data ' + DATA_VERSION_LABEL);
})();
