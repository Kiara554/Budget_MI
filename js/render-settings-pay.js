'use strict';
// ── RENDER payment methods list in settings ──
function renderPayMethodsList() {
  const el = document.getElementById('pay-methods-list');
  if (!el) return;
  const methods = getPayMethods();
  const typeEmoji = {'pay-card':'💳','pay-cash':'💵','pay-transfer':'🔄','pay-phone':'📱','pay-other':'●'};
  el.innerHTML = methods.map((m,i)=>`
    <div class="pay-edit-row">
      <select class="pay-type-select" id="pm-type-${i}" title="Type de paiement">
        <option value="pay-card"  ${m.type==='pay-card'  ?'selected':''}>💳</option>
        <option value="pay-cash"  ${m.type==='pay-cash'  ?'selected':''}>💵</option>
        <option value="pay-transfer" ${m.type==='pay-transfer'?'selected':''}>🔄</option>
        <option value="pay-phone" ${m.type==='pay-phone' ?'selected':''}>📱</option>
        <option value="pay-other" ${m.type==='pay-other' ?'selected':''}>●</option>
      </select>
      <input class="pay-name-input" id="pm-name-${i}" value="${escAttr(m.name)}" placeholder="Nom du moyen de paiement">
      <button class="btn-icon-del" onclick="deletePayMethod(${i})" title="Supprimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
}

function addPayMethod() {
  if (!settings.paymentMethods || !settings.paymentMethods.length) {
    settings.paymentMethods = [...DEFAULT_PAYMENTS];
  }
  settings.paymentMethods.push({id:uid(), name:'Nouveau', type:'pay-card'});
  save(); renderPayMethodsList();
}

function deletePayMethod(i) {
  if (!settings.paymentMethods) settings.paymentMethods = [...DEFAULT_PAYMENTS];
  if (settings.paymentMethods.length <= 1) { toast('Gardez au moins un moyen de paiement'); return; }
  settings.paymentMethods.splice(i, 1);
  save(); renderPayMethodsList();
}

function savePayMethods() {
  const methods = getPayMethods();
  const updated = methods.map((m,i) => ({
    ...m,
    name: (document.getElementById('pm-name-'+i)?.value || m.name).trim() || m.name,
    type: document.getElementById('pm-type-'+i)?.value || m.type,
  })).filter(m=>m.name);
  settings.paymentMethods = updated;
  save(); renderPayMethodsList();
  toast('Moyens de paiement sauvegardés !');
}
