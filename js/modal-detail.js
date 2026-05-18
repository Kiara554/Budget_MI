'use strict';
// ══════════════════════════════════════════════
//  MODAL: DETAIL
// ══════════════════════════════════════════════
function openDetail(id) {
  detailId = id;
  const e = expenses.find(x=>x.id===id); if(!e) return;
  const cat = CAT_MAP[e.catId]||CAT_MAP.divers;
  const col = catColor(e.catId);
  const eur = expenseEur(e);
  const tnd = expenseTnd(e);

  document.getElementById('detail-body').innerHTML = `
    <div style="text-align:center;padding:0 0 16px">
      <div class="detail-hero" style="background:${col.bg};color:${col.text};margin:0 auto 8px">
        ${icon(cat.ic||'divers', 32, col.text)}
      </div>
      <div class="detail-amount">${fmtEur(eur)}</div>
      <div style="font-size:13px;color:var(--text3);margin-top:4px">${fmtTnd(tnd)} · ${formatDate(e.date)}</div>
      ${e.enseigne ? `<div style="font-size:15px;font-weight:800;color:var(--text);margin-top:6px">${escHtml(e.enseigne)}</div>` : ''}
      <div style="margin-top:8px">
        <span style="background:${col.bg};color:${col.text};padding:4px 12px;border-radius:20px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px">${icon(cat.ic||'divers',14,col.text)} ${cat.lbl}</span>
      </div>
    </div>

    <div class="detail-meta-grid">
      <div class="detail-meta-item">
        <div class="detail-meta-label">Montant saisi</div>
        <div class="detail-meta-val">${e.amount} ${e.currency}</div>
      </div>
      <div class="detail-meta-item">
        <div class="detail-meta-label">Frais banque</div>
        <div class="detail-meta-val">${fmtEur(e.bankFee||0)}</div>
      </div>
      <div class="detail-meta-item">
        <div class="detail-meta-label">Paiement</div>
        <div class="detail-meta-val">${e.payment||'—'}</div>
      </div>
      <div class="detail-meta-item">
        <div class="detail-meta-label">Remboursable</div>
        <div class="detail-meta-val" style="display:flex;align-items:center;gap:4px">${e.remb?`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg><span style="color:var(--green)">Oui</span>`:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span style="color:var(--text3)">Non</span>`}</div>
      </div>
      ${(()=>{
        if (!e.remb) return '';
        const p = getPlafond(e.catId);
        if (p === null) return '';
        const montantRemb = Math.min(expenseEur(e), p);
        const isCapped = expenseEur(e) > p;
        return `<div class="detail-meta-item">
          <div class="detail-meta-label">Montant OPCO</div>
          <div class="detail-meta-val" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
            <span style="font-weight:800;font-family:var(--fm);color:var(--green)">${fmtEur(montantRemb,2)}</span>
            ${isCapped?`<span style="font-size:11px;color:var(--orange);font-weight:700">(plafonné à ${fmtEur(p,0)})</span>`:''}
          </div>
        </div>`;
      })()}
      <div class="detail-meta-item">
        <div class="detail-meta-label">Reçu joint</div>
        <div class="detail-meta-val" style="display:flex;align-items:center;gap:4px">${e.recu?`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg><span style="color:var(--green)">Oui</span>`:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span style="color:var(--text3)">Non</span>`}</div>
      </div>
      <div class="detail-meta-item">
        <div class="detail-meta-label">Nom du reçu</div>
        <div class="detail-meta-val" style="font-size:12px">${e.recuName||'—'}</div>
      </div>
      <div class="detail-meta-item" style="grid-column:1/-1">
        <div class="detail-meta-label">Ajouté le</div>
        <div class="detail-meta-val" style="font-size:12px;color:var(--text3)">${e.createdAt ? new Date(e.createdAt).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
      </div>
    </div>

    ${e.desc ? `<div style="background:var(--surface2);border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:14px;color:var(--text);font-weight:600">${escHtml(e.desc)}</div>` : ''}

    ${e.photo ? `
      <div style="margin-bottom:14px;border-radius:12px;overflow:hidden;max-height:200px">
        <img src="${e.photo}" style="width:100%;object-fit:cover;display:block" alt="Justificatif">
      </div>
    ` : ''}

    ${e.remb ? `<div style="margin-bottom:12px;background:var(--surface2);border-radius:12px;padding:12px 14px">
      ${(()=>{
        const st = (!e.rembStatus && e.rembDate) ? 'soumis' : (e.rembStatus || 'soumettre');
        const reset = `<button class="btn btn-outline btn-sm" style="margin-top:8px;width:100%;font-size:12px;color:var(--text3)" onclick="markUnremb('${e.id}')">Remettre à soumettre</button>`;
        if (st==='soumettre') return `
          <div class="btn-row">
            <button class="btn btn-accent" style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px" onclick="markRembStatus('${e.id}','soumis')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Soumettre</button>
            <button class="btn btn-outline btn-sm" style="flex:1;min-height:44px;color:var(--text3)" onclick="markRembStatus('${e.id}','non-soumis')">Ne pas soumettre</button>
          </div>`;
        if (st==='soumis') return `
          <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Soumis${e.rembDate ? ' le '+new Date(e.rembDate).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : ''}</div>
          <div class="btn-row">
            <button class="btn btn-outline btn-sm" style="flex:1;color:var(--green);border-color:var(--green)" onclick="markRembStatus('${e.id}','valide')">Validé</button>
            <button class="btn btn-outline btn-sm" style="flex:1;color:var(--red);border-color:var(--red)" onclick="markRembStatus('${e.id}','refuse')">Refusé</button>
            <button class="btn btn-outline btn-sm" style="flex:1;color:var(--blue);border-color:var(--blue)" onclick="markRembStatus('${e.id}','rembourse')">Remboursé</button>
          </div>${reset}`;
        if (st==='non-soumis') return `
          <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--text3);margin-bottom:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Non soumis</div>${reset}`;
        if (st==='valide') return `
          <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--green);margin-bottom:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>Validé</div>${reset}`;
        if (st==='refuse') return `
          <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Refusé</div>${reset}`;
        if (st==='rembourse') return `
          <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--blue);margin-bottom:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>Remboursé</div>${reset}`;
        return '';
      })()}
    </div>` : ''}

    <div class="btn-row" style="margin-bottom:10px">
      <button class="btn btn-outline btn-sm" style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px" onclick="openEdit('${e.id}')">${icon('edit',16)} Modifier</button>
      <button class="btn btn-outline btn-sm" style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px" onclick="addPhotoAfter('${e.id}')">${icon('camera',16)} ${e.photo?'Changer le reçu':'Ajouter un reçu'}</button>
    </div>
    <button class="btn btn-red" style="min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px;width:100%" onclick="deleteExpense('${e.id}')">${icon('trash',16,'var(--red)')} Supprimer</button>
    <div style="height:8px"></div>
  `;
  openModal('modal-detail');
}

function deleteExpense(id) {
  if(!confirm('Supprimer cette dépense ?')) return;
  deletePhotoIDB(id).catch(console.warn);
  expenses = expenses.filter(e=>e.id!==id);
  save(); closeModal('modal-detail'); render();
  toast('Dépense supprimée');
}

function markRemb(id) {
  markRembStatus(id, 'soumis');
}

function markRembStatus(id, status) {
  const idx = expenses.findIndex(e=>e.id===id); if(idx<0) return;
  expenses[idx].rembStatus = status;
  if (status === 'soumis') expenses[idx].rembDate = expenses[idx].rembDate || new Date().toISOString().slice(0,10);
  const labels = { soumis:'Soumis ✓', 'non-soumis':'Non soumis', valide:'Validé ✓', refuse:'Refusé', rembourse:'Remboursé ✓' };
  save(); openDetail(id); renderRemb();
  toast(labels[status] || 'Statut mis à jour');
}

function markUnremb(id) {
  const idx = expenses.findIndex(e=>e.id===id); if(idx<0) return;
  delete expenses[idx].rembDate;
  delete expenses[idx].rembStatus;
  save(); openDetail(id); renderRemb();
  toast('Remis à soumettre');
}
