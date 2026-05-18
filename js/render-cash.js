'use strict';
// ══════════════════════════════════════════════
//  RENDER: CASH
// ══════════════════════════════════════════════
function renderCash() {
  buildTabs('cash-tabs', cashMo, `(m)=>{cashMo=m;renderCash()}`);

  const filtered = cashMo === 'all'
    ? expenses
    : expenses.filter(e => getMonth(e) === MONTH_DATES[MONTHS.indexOf(cashMo)]);

  const filteredW = cashMo === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.date?.slice(0,7) === MONTH_DATES[MONTHS.indexOf(cashMo)]);

  // Calculs EUR
  const cashEurRetire  = filteredW.filter(w=>w.currency==='EUR').reduce((s,w)=>s+Number(w.amount),0)
                       + filtered.filter(e=>e.catId==='cash'&&e.currency==='EUR').reduce((s,e)=>s+expenseEur(e),0);
  const cashEurPaid    = filtered.filter(e=>e.payment==='Espèces'&&e.currency==='EUR'&&e.catId!=='cash').reduce((s,e)=>s+expenseEur(e),0);
  const cashEurRestant = cashEurRetire - cashEurPaid;

  // Calculs TND
  const cashTndRetire  = filteredW.filter(w=>w.currency==='TND').reduce((s,w)=>s+Number(w.amount),0)
                       + filtered.filter(e=>e.catId==='cash'&&e.currency==='TND').reduce((s,e)=>s+expenseTnd(e),0);
  const cashTndPaid    = filtered.filter(e=>e.payment==='Espèces'&&e.currency==='TND'&&e.catId!=='cash').reduce((s,e)=>s+expenseTnd(e),0);
  const cashTndRestant = cashTndRetire - cashTndPaid;

  const hasData = cashEurRetire>0||cashEurPaid>0||cashTndRetire>0||cashTndPaid>0;

  const body = document.getElementById('cash-body');
  body.innerHTML = `
  <div style="margin-top:12px"></div>

  ${hasData ? `
  <div class="stat-grid">
    ${cashEurRetire>0||cashEurPaid>0 ? `
    <div class="card" style="margin-bottom:0">
      <div class="card-title" style="display:flex;align-items:center;gap:6px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>
        Cash EUR
      </div>
      <div class="cash-row">
        <span class="cash-row-label">Retiré</span>
        <span class="cash-row-val" style="color:var(--orange)">${fmtEur(cashEurRetire,2)}</span>
      </div>
      <div class="cash-row">
        <span class="cash-row-label">Dépensé en espèces</span>
        <span class="cash-row-val">${fmtEur(cashEurPaid,2)}</span>
      </div>
      <div class="cash-row" style="border-top:2px solid var(--border);margin-top:6px;padding-top:10px">
        <span class="cash-row-label" style="font-weight:800">Restant</span>
        <span class="cash-row-val" style="font-size:18px;color:${cashEurRestant>=0?'var(--green)':'var(--red)'}">${fmtEur(cashEurRestant,2)}</span>
      </div>
    </div>` : ''}
    ${cashTndRetire>0||cashTndPaid>0 ? `
    <div class="card" style="margin-bottom:0">
      <div class="card-title" style="display:flex;align-items:center;gap:6px">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
        Cash TND
      </div>
      <div class="cash-row">
        <span class="cash-row-label">Retiré</span>
        <span class="cash-row-val" style="color:var(--orange)">${fmtTnd(cashTndRetire,2)}</span>
      </div>
      <div class="cash-row">
        <span class="cash-row-label">Dépensé en espèces</span>
        <span class="cash-row-val">${fmtTnd(cashTndPaid,2)}</span>
      </div>
      <div class="cash-row" style="border-top:2px solid var(--border);margin-top:6px;padding-top:10px">
        <span class="cash-row-label" style="font-weight:800">Restant</span>
        <span class="cash-row-val" style="font-size:18px;color:${cashTndRestant>=0?'var(--green)':'var(--red)'}">${fmtTnd(cashTndRestant,2)}</span>
      </div>
    </div>` : ''}
  </div>` : `
  <div class="card" style="text-align:center;padding:24px;color:var(--text3)">
    <div style="font-size:36px;margin-bottom:10px">💵</div>
    <div style="font-size:14px;font-weight:700;margin-bottom:6px">Aucun retrait enregistré</div>
    <div style="font-size:13px">Appuie sur <strong>+ Retrait</strong> pour commencer le suivi</div>
  </div>`}

  ${filteredW.length>0 ? `
  <div class="card" style="margin-top:8px">
    <div class="card-title">Retraits${cashMo!=='all'?` — ${MONTH_LABELS[MONTHS.indexOf(cashMo)]}`:''}
      <span style="font-size:12px;color:var(--text3);font-weight:600;margin-left:6px">${filteredW.length} retrait${filteredW.length>1?'s':''}</span>
    </div>
    ${filteredW.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(w=>`
    <div class="cash-row" style="align-items:center">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:10px;background:${w.currency==='EUR'?'rgba(124,106,245,0.12)':'rgba(245,158,11,0.12)'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${w.currency==='EUR'?'💶':'🪙'}</div>
        <div>
          <div style="font-size:14px;font-weight:800;color:var(--text)">${Number(w.amount).toFixed(2)} ${w.currency}${w.note?` · <span style="font-size:12px;font-weight:400;color:var(--text3)">${escHtml(w.note)}</span>`:''}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:1px">${formatDate(w.date)}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <button onclick="openEditWithdraw('${w.id}')" style="background:var(--surface2);border:none;cursor:pointer;color:var(--text2);padding:6px 8px;font-size:15px;border-radius:8px;min-width:32px;min-height:32px">✎</button>
        <button onclick="deleteWithdraw('${w.id}')" style="background:var(--surface2);border:none;cursor:pointer;color:var(--red);padding:6px 8px;font-size:14px;border-radius:8px;min-width:32px;min-height:32px">✕</button>
      </div>
    </div>`).join('')}
  </div>` : ''}

  ${filtered.filter(e=>e.payment==='Espèces'&&e.catId!=='cash').length>0 ? `
  <div class="card" style="margin-top:8px">
    <div class="card-title">Dépenses réglées en espèces
      <span style="font-size:12px;color:var(--text3);font-weight:600;margin-left:6px">${filtered.filter(e=>e.payment==='Espèces'&&e.catId!=='cash').length}</span>
    </div>
    ${filtered.filter(e=>e.payment==='Espèces'&&e.catId!=='cash').slice().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`
    <div class="cash-row" onclick="openDetail('${e.id}')" style="cursor:pointer">
      <div style="display:flex;align-items:center;gap:10px">
        ${catIconHtml(e.catId,32)}
        <div>
          <div style="font-size:13px;font-weight:700">${e.enseigne?escHtml(e.enseigne):escHtml(e.desc)||'—'}</div>
          <div style="font-size:11px;color:var(--text3)">${formatDate(e.date)}</div>
        </div>
      </div>
      <span style="font-size:14px;font-weight:800;font-family:var(--fm)">${e.currency==='TND'?fmtTnd(expenseTnd(e),2):fmtEur(expenseEur(e),2)}</span>
    </div>`).join('')}
  </div>` : ''}
  `;
}
