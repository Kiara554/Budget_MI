'use strict';
// ══════════════════════════════════════════════
//  MODAL: ADD / EDIT
// ══════════════════════════════════════════════
function autoSetRemb() {
  if (editingId) return; // en mode édition on respecte le choix existant
  const catId = document.getElementById('f-cat')?.value;
  if (!catId) return;
  setToggle('t-remb', getPlafond(catId) !== null);
}

function autoFillRecuName() {
  // Only auto-fill if user hasn't manually edited the field
  const recuEl = document.getElementById('f-recu-name');
  if(recuEl.dataset.userEdited === '1') return;
  const enseigne = (document.getElementById('f-enseigne')?.value||'').trim();
  const catId = document.getElementById('f-cat')?.value || '';
  const date = document.getElementById('f-date')?.value || '';
  const catLabel = CAT_MAP[catId]?.lbl || catId;
  const parts = [enseigne, catLabel, date].filter(Boolean);
  recuEl.value = parts.join('_').toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_\-]/g,'');
}

function openAddModal() {
  editingId = null;
  photoData = null;
  document.getElementById('modal-add-title').textContent = 'Nouvelle dépense';
  document.getElementById('f-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('f-cat').value = 'alim';
  document.getElementById('f-enseigne').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('f-amount').value = '';
  document.getElementById('f-currency').value = 'TND';
  document.getElementById('f-bank').value = '0';
  populatePaymentSelect();
  // default = premier moyen de paiement
  const methods = getPayMethods();
  if (methods.length) document.getElementById('f-payment').value = methods[0].name;
  const recuEl = document.getElementById('f-recu-name');
  recuEl.dataset.userEdited = '0';
  recuEl.value = '';
  autoSetRemb();
  setToggle('t-recu', false);
  updatePhotoPreview();
  renderTemplateChips();
  document.getElementById('tpl-section').style.display = '';
  document.getElementById('btn-save-tpl').style.display = '';
  openModal('modal-add');
  autoFillRecuName();
}

// ── MODÈLES (templates) ───────────────────────
function renderTemplateChips() {
  const el = document.getElementById('tpl-chips');
  if (!el) return;
  if (!templates.length) {
    el.innerHTML = `<span style="font-size:12px;color:var(--text3)">Aucun modèle — saisir une dépense et taper ★ pour en créer un.</span>`;
    return;
  }
  el.innerHTML = templates.map(t => {
    const cat = CATS.find(c => c.id === t.catId);
    return `<button class="tpl-chip" onclick="applyTemplate('${t.id}')">
      ${icon(cat?.ic||'divers', 14)} ${escHtml(t.name)}
      <span class="tpl-chip-del" onclick="event.stopPropagation();deleteTemplate('${t.id}')">✕</span>
    </button>`;
  }).join('');
}

function applyTemplate(id) {
  const t = templates.find(x => x.id === id); if (!t) return;
  document.getElementById('f-cat').value      = t.catId;
  document.getElementById('f-enseigne').value = t.enseigne || '';
  document.getElementById('f-desc').value     = t.desc     || '';
  document.getElementById('f-amount').value   = t.amount   || '';
  document.getElementById('f-currency').value = t.currency || 'TND';
  document.getElementById('f-bank').value     = t.bankFee  || '0';
  populatePaymentSelect();
  if (t.payment) document.getElementById('f-payment').value = t.payment;
  setToggle('t-remb', !!t.remb);
  const recuEl = document.getElementById('f-recu-name');
  recuEl.dataset.userEdited = '0';
  recuEl.value = '';
  autoFillRecuName();
}

function saveAsTemplate() {
  const catId    = document.getElementById('f-cat').value;
  const enseigne = document.getElementById('f-enseigne').value.trim();
  const desc     = document.getElementById('f-desc').value.trim();
  const amount   = document.getElementById('f-amount').value;
  const currency = document.getElementById('f-currency').value;
  const bankFee  = document.getElementById('f-bank').value;
  const payment  = document.getElementById('f-payment').value;
  const remb     = document.getElementById('t-remb').classList.contains('on');
  const cat      = CATS.find(c => c.id === catId);
  const defaultName = enseigne || cat?.lbl || catId;
  const name = prompt('Nom du modèle :', defaultName);
  if (!name) return;
  templates.push({ id: uid(), name: name.trim(), catId, enseigne, desc, amount: parseFloat(amount)||0, currency, bankFee: parseFloat(bankFee)||0, payment, remb });
  save();
  renderTemplateChips();
  toast('Modèle "' + name.trim() + '" sauvegardé !');
}

function deleteTemplate(id) {
  templates = templates.filter(t => t.id !== id);
  save();
  renderTemplateChips();
}

function openEdit(id) {
  const e = expenses.find(x=>x.id===id); if(!e) return;
  editingId = id;
  photoData = e.photo || null;
  closeModal('modal-detail');
  document.getElementById('modal-add-title').textContent = 'Modifier la dépense';
  document.getElementById('f-date').value  = e.date;
  document.getElementById('f-cat').value   = e.catId;
  document.getElementById('f-enseigne').value = e.enseigne||'';
  document.getElementById('f-desc').value  = e.desc||'';
  document.getElementById('f-amount').value = e.amount;
  document.getElementById('f-currency').value = e.currency||'TND';
  document.getElementById('f-bank').value  = e.bankFee||0;
  populatePaymentSelect();
  document.getElementById('f-payment').value = e.payment || getPayMethods()[0]?.name || '';
  const recuEl = document.getElementById('f-recu-name');
  recuEl.value = e.recuName||'';
  recuEl.dataset.userEdited = '1'; // preserve existing name in edit mode
  setToggle('t-remb', !!e.remb);
  setToggle('t-recu', !!e.recu);
  updatePhotoPreview();
  document.getElementById('tpl-section').style.display = 'none';
  document.getElementById('btn-save-tpl').style.display = 'none';
  openModal('modal-add');
}

function submitAdd() {
  const date     = document.getElementById('f-date').value;
  const catId    = document.getElementById('f-cat').value;
  const enseigne = document.getElementById('f-enseigne').value.trim();
  const desc     = document.getElementById('f-desc').value.trim();
  const amount   = parseFloat(document.getElementById('f-amount').value);
  const currency = document.getElementById('f-currency').value;
  const bankFee  = parseFloat(document.getElementById('f-bank').value)||0;
  const payment  = document.getElementById('f-payment').value;
  const remb     = document.getElementById('t-remb').classList.contains('on');
  const recu     = document.getElementById('t-recu').classList.contains('on');
  const recuName = document.getElementById('f-recu-name').value.trim();

  if(!date) return toast('Choisir une date');
  if(isNaN(amount)||amount<0) return toast('Montant invalide');
  if(remb && !recu && !photoData) toast('⚠️ Remboursable sans reçu — pense à ajouter le justificatif');

  if(editingId) {
    const idx = expenses.findIndex(x=>x.id===editingId);
    if(idx>=0) {
      // createdAt preserved — never overwritten on edit
      expenses[idx] = {...expenses[idx], date, catId, enseigne, desc, amount, currency, bankFee, payment, remb, recu, recuName, photo: photoData};
    }
    toast('Dépense modifiée !');
  } else {
    const ym = date.slice(0,7);
    const moIdx = MONTH_DATES.indexOf(ym);
    expenses.push({ id:uid(), date, catId, enseigne, desc, amount, currency, bankFee, payment, remb, recu, recuName, photo: photoData, month: moIdx>=0?MONTHS[moIdx]:null, createdAt: new Date().toISOString() });
    toast('Dépense ajoutée !');
  }
  save();
  closeModal('modal-add');
  editingId = null;
  photoData = null;
  render();
}
