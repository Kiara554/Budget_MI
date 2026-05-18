'use strict';
// ══════════════════════════════════════════════
//  GAINS
// ══════════════════════════════════════════════
function gainEur(g) {
  if (g.currency === 'EUR') return Number(g.amount);
  if (g.currency === 'TND') return Number(g.amount) / (settings.rate || 3.38);
  return Number(g.amount);
}

let editingGainId = null;

function openGainModal() {
  editingGainId = null;
  document.getElementById('modal-gain-title').textContent = 'Nouvelle entrée';
  document.getElementById('g-date').value    = new Date().toISOString().slice(0,10);
  document.getElementById('g-desc').value    = '';
  document.getElementById('g-amount').value  = '';
  document.getElementById('g-currency').value = 'EUR';
  populateGainTypeSelect();
  openModal('modal-gain');
}

function openEditGain(id) {
  const g = gains.find(x => x.id === id);
  if (!g) return;
  editingGainId = id;
  document.getElementById('modal-gain-title').textContent = 'Modifier l\'entrée';
  document.getElementById('g-date').value     = g.date;
  document.getElementById('g-desc').value     = g.desc || '';
  document.getElementById('g-amount').value   = g.amount;
  document.getElementById('g-currency').value = g.currency || 'EUR';
  populateGainTypeSelect(g.type);
  openModal('modal-gain');
}

function populateGainTypeSelect(selected) {
  const sel = document.getElementById('g-type');
  sel.innerHTML = GAIN_TYPES.map(t =>
    `<option value="${t.id}" ${t.id===(selected||GAIN_TYPES[0].id)?'selected':''}>${t.em} ${t.lbl}</option>`
  ).join('');
}

function submitGain() {
  const date   = document.getElementById('g-date').value;
  const amount = parseFloat(document.getElementById('g-amount').value);
  if (!date || isNaN(amount) || amount <= 0) { toast('Remplis la date et le montant'); return; }
  const entry = {
    date,
    amount,
    currency: document.getElementById('g-currency').value,
    type:     document.getElementById('g-type').value,
    desc:     document.getElementById('g-desc').value.trim(),
  };
  if (editingGainId) {
    const idx = gains.findIndex(g => g.id === editingGainId);
    if (idx !== -1) gains[idx] = { ...gains[idx], ...entry };
    toast('Entrée modifiée ✓');
  } else {
    gains.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,5), ...entry });
    toast('Entrée enregistrée ✓');
  }
  editingGainId = null;
  save(); closeModal('modal-gain'); renderDash();
}

function deleteGain(id) {
  if (!confirm('Supprimer cette entrée ?')) return;
  gains = gains.filter(g => g.id !== id);
  save(); renderDash();
  toast('Entrée supprimée');
}
