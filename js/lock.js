'use strict';
// ══════════════════════════════════════════════
//  LOCK / PIN
// ══════════════════════════════════════════════
let _lockInput   = '';
let _lockMode    = 'check'; // 'check' | 'setup-first' | 'setup-confirm' | 'change-old' | 'change-new' | 'change-confirm'
let _lockFirst   = '';      // premier code saisi lors d'une création

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mi2026:' + pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function lockKey(d) {
  if (_lockInput.length >= 4) return;
  _lockInput += d;
  updateLockDots();
  if (_lockInput.length === 4) setTimeout(lockSubmit, 120);
}

function lockDel() {
  _lockInput = _lockInput.slice(0, -1);
  updateLockDots();
}

function updateLockDots(state) {
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('ld' + i);
    d.className = 'lock-dot' + (i < _lockInput.length ? ' filled' : '') + (state === 'error' ? ' error' : '');
  }
}

async function lockSubmit() {
  const pin = _lockInput;
  _lockInput = '';

  if (_lockMode === 'check') {
    const stored = localStorage.getItem('mi_pin');
    const h = await hashPin(pin);
    if (h === stored) {
      unlock();
    } else {
      lockError('Code incorrect');
    }

  } else if (_lockMode === 'setup-first') {
    _lockFirst = pin;
    _lockMode = 'setup-confirm';
    setLockSub('Confirmez le code');
    updateLockDots();

  } else if (_lockMode === 'setup-confirm') {
    if (pin === _lockFirst) {
      const h = await hashPin(pin);
      localStorage.setItem('mi_pin', h);
      toast('Code PIN activé ✓');
      unlock();
    } else {
      _lockFirst = '';
      _lockMode = 'setup-first';
      lockError('Codes différents — recommencez');
    }

  } else if (_lockMode === 'change-old') {
    const stored = localStorage.getItem('mi_pin');
    const h = await hashPin(pin);
    if (h === stored) {
      _lockMode = 'change-new';
      setLockSub('Nouveau code');
      updateLockDots();
    } else {
      lockError('Code incorrect');
    }

  } else if (_lockMode === 'change-new') {
    _lockFirst = pin;
    _lockMode = 'change-confirm';
    setLockSub('Confirmez le nouveau code');
    updateLockDots();

  } else if (_lockMode === 'change-confirm') {
    if (pin === _lockFirst) {
      const h = await hashPin(pin);
      localStorage.setItem('mi_pin', h);
      document.getElementById('lock-screen').classList.add('hidden');
      toast('Code PIN modifié ✓');
      renderSettings();
    } else {
      _lockFirst = '';
      _lockMode = 'change-new';
      lockError('Codes différents — recommencez');
    }
  }
}

function lockError(msg) {
  updateLockDots('error');
  setLockSub(msg, true);
  const dots = document.getElementById('lock-dots');
  dots.classList.add('shake');
  setTimeout(() => { dots.classList.remove('shake'); updateLockDots(); setLockSub(lockSubDefault()); }, 700);
}

function lockSubDefault() {
  if (_lockMode === 'setup-first')    return 'Choisissez un code à 4 chiffres';
  if (_lockMode === 'setup-confirm')  return 'Confirmez le code';
  if (_lockMode === 'change-old')     return 'Entrez l\'ancien code';
  if (_lockMode === 'change-new')     return 'Nouveau code à 4 chiffres';
  if (_lockMode === 'change-confirm') return 'Confirmez le nouveau code';
  return 'Entrez votre code';
}

function setLockSub(msg, isError) {
  const el = document.getElementById('lock-sub');
  el.textContent = msg;
  el.className = 'lock-sub' + (isError ? ' error' : '');
}

function unlock() {
  const ls = document.getElementById('lock-screen');
  ls.classList.add('hidden');
  setTimeout(() => ls.style.display = 'none', 260);
}

function initLock() {
  const hasPin = !!localStorage.getItem('mi_pin');
  const ls = document.getElementById('lock-screen');
  if (!hasPin) {
    ls.style.display = 'none'; // pas de PIN configuré → accès direct
    return;
  }
  _lockMode = 'check';
  setLockSub('Entrez votre code');
  updateLockDots();
}

// Appel depuis les Réglages
function setupPin() {
  _lockMode = 'setup-first';
  _lockFirst = '';
  _lockInput = '';
  const ls = document.getElementById('lock-screen');
  ls.style.display = '';
  ls.classList.remove('hidden');
  setLockSub('Choisissez un code à 4 chiffres');
  updateLockDots();
}

function changePin() {
  _lockMode = 'change-old';
  _lockFirst = '';
  _lockInput = '';
  const ls = document.getElementById('lock-screen');
  ls.style.display = '';
  ls.classList.remove('hidden');
  setLockSub('Entrez l\'ancien code');
  updateLockDots();
}

function disablePin() {
  if (!confirm('Désactiver le code PIN ?')) return;
  localStorage.removeItem('mi_pin');
  toast('Code PIN désactivé');
  renderSettings();
}
