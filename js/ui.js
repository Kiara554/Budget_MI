'use strict';
// ══════════════════════════════════════════════
//  MODAL: ADD / EDIT — UI helpers
// ══════════════════════════════════════════════
function populateCatSelect() {
  const sel = document.getElementById('f-cat');
  sel.innerHTML = CATS.filter(c=>c.id!=='cash').map(c=>`<option value="${c.id}">${c.em} ${c.lbl}</option>`).join('');
}

// ══════════════════════════════════════════════
//  RETRAITS
// ══════════════════════════════════════════════
function openWithdrawModal() {
  editingWithdrawId = null;
  document.getElementById('modal-withdraw-title').textContent = 'Nouveau retrait';
  document.getElementById('w-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('w-amount').value = '';
  document.getElementById('w-currency').value = 'TND';
  document.getElementById('w-note').value = '';
  openModal('modal-withdraw');
}

function openEditWithdraw(id) {
  const w = withdrawals.find(x => x.id === id);
  if (!w) return;
  editingWithdrawId = id;
  document.getElementById('modal-withdraw-title').textContent = 'Modifier le retrait';
  document.getElementById('w-date').value = w.date;
  document.getElementById('w-amount').value = w.amount;
  document.getElementById('w-currency').value = w.currency;
  document.getElementById('w-note').value = w.note || '';
  openModal('modal-withdraw');
}

function submitWithdraw() {
  const amount = parseFloat(document.getElementById('w-amount').value);
  const date   = document.getElementById('w-date').value;
  if (!date || isNaN(amount) || amount <= 0) { toast('Remplis la date et le montant'); return; }
  const entry = {
    date, amount,
    currency: document.getElementById('w-currency').value,
    note:     document.getElementById('w-note').value.trim(),
  };
  if (editingWithdrawId) {
    const idx = withdrawals.findIndex(w => w.id === editingWithdrawId);
    if (idx !== -1) withdrawals[idx] = { ...withdrawals[idx], ...entry };
    toast('Retrait modifié ✓');
  } else {
    withdrawals.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,5), ...entry });
    toast('Retrait enregistré ✓');
  }
  editingWithdrawId = null;
  save(); closeModal('modal-withdraw'); renderDash();
}

function deleteWithdraw(id) {
  if (!confirm('Supprimer ce retrait ?')) return;
  withdrawals = withdrawals.filter(w=>w.id!==id);
  save(); renderDash();
  toast('Retrait supprimé');
}

function populatePaymentSelect() {
  const sel = document.getElementById('f-payment');
  if (!sel) return;
  const methods = getPayMethods();
  const cur = sel.value;
  sel.innerHTML = methods.map(m=>`<option value="${escAttr(m.name)}">${m.name}</option>`).join('');
  if (cur && methods.find(m=>m.name===cur)) sel.value = cur;
}

function escAttr(s) { return (s||'').replace(/"/g,'&quot;'); }

// ══════════════════════════════════════════════
//  TOGGLE
// ══════════════════════════════════════════════
function toggleBtn(id) {
  document.getElementById(id).classList.toggle('on');
}
function setToggle(id, val) {
  const el = document.getElementById(id);
  if(val) el.classList.add('on'); else el.classList.remove('on');
}

// ══════════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function handleOverlayClick(e, modalId) {
  if(e.target.id===modalId) closeModal(modalId);
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
let _toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(()=>el.classList.remove('show'), 2800);
}

// ══════════════════════════════════════════════
//  RENDER DISPATCH
// ══════════════════════════════════════════════
function render() {
  if(curView==='dashboard') renderDash();
  else if(curView==='list') renderList();
  else if(curView==='cash') renderCash();
  else if(curView==='remb') renderRemb();
  else if(curView==='settings') renderSettings();
}
