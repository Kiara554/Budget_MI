'use strict';
// ══════════════════════════════════════════════
//  RENDER: LIST
// ══════════════════════════════════════════════
function renderList() {
  buildTabs('list-tabs', filterMo, `(m)=>{filterMo=m;renderList()}`);

  // Cat filters
  const row = document.getElementById('cat-filter-row');
  row.innerHTML = `<button class="filter-chip ${catFilter==='all'?'active':''}" onclick="setCatFilter('all')">Tout</button>` +
    CATS.map(c=>{const col=catColor(c.id);return `<button class="filter-chip ${catFilter===c.id?'active':''}" onclick="setCatFilter('${c.id}')" style="display:inline-flex;align-items:center;gap:5px">${icon(c.ic||'divers',13)} ${c.lbl}</button>`;}).join('');

  const exps = filteredExpenses().sort((a,b)=>b.date.localeCompare(a.date));
  const totalFiltered = exps.reduce((s,e)=>s+expenseEur(e),0);
  const bar = document.getElementById('list-total-bar');
  if (bar) bar.innerHTML = exps.length
    ? `<span>${exps.length} dépense${exps.length>1?'s':''}</span><span style="font-family:var(--fm);color:var(--text)">${fmtEur(totalFiltered,2)}</span>`
    : '';
  const body = document.getElementById('list-body');

  if(!exps.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">🧾</div><div class="empty-title">Aucune dépense</div><div class="empty-sub">Appuie sur + pour ajouter</div></div>`;
    return;
  }

  // Group by date
  const byDate = {};
  exps.forEach(e => {
    const d = e.date || 'Inconnue';
    if(!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });

  body.innerHTML = Object.entries(byDate).map(([date, es])=>`
    <div style="font-size:12px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin:12px 0 6px;padding-left:4px">${formatDate(date)}</div>
    ${es.map(e=>expenseCard(e)).join('')}
  `).join('');
}

function formatDate(d) {
  if(!d||d==='Inconnue') return 'Date inconnue';
  try {
    const dt = new Date(d+'T12:00:00');
    return dt.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long'});
  } catch(e){ return d; }
}

function expenseCard(e) {
  const cat = CAT_MAP[e.catId] || CATS[CATS.length-1];
  const col = catColor(e.catId);
  const eur = expenseEur(e);
  const tnd = expenseTnd(e);
  const payIcon = payTypeIcon(e.payment);
  return `<div class="expense-item" onclick="openDetail('${e.id}')">
    ${catIconHtml(e.catId, 22)}
    <div class="expense-info">
      <div class="expense-desc">${e.enseigne ? `<span style="font-weight:800">${escHtml(e.enseigne)}</span>${e.desc?` · ${escHtml(e.desc)}`:''}` : escHtml(e.desc)||'Sans description'}</div>
      <div class="expense-meta" style="display:flex;align-items:center;gap:4px">${payIcon}<span>${cat.lbl} · ${escHtml(e.payment||'—')}</span></div>
    </div>
    <div class="expense-amount">
      <div class="expense-eur">${fmtEur(eur)}</div>
      <div class="expense-tnd">${fmtTnd(tnd,0)}</div>
      <div class="expense-badges">
        ${e.remb?'<span class="badge-small badge-remb">Remb.</span>':''}
        ${e.recu?'<span class="badge-small badge-recu">Reçu</span>':''}
      </div>
    </div>
  </div>`;
}

function payTypeIcon(paymentName) {
  const m = getPayMethods().find(x=>x.name===paymentName);
  const typeKey = m ? m.type : 'pay-other';
  const p = ICON_PATHS[typeKey] || ICON_PATHS['pay-other'];
  return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.5;flex-shrink:0">${p}</svg>`;
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setCatFilter(id) { catFilter=id; renderList(); }
function onSearch(v) { search=v; renderList(); }
