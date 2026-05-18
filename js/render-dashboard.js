'use strict';
// ══════════════════════════════════════════════
//  RENDER: DASHBOARD
// ══════════════════════════════════════════════
function renderDash() {
  buildTabs('dash-tabs', filterMo, `(m)=>{filterMo=m;renderDash()}`);

  // Filter expenses for dashboard (month filter, excluding cash for spending)
  const allExp = expenses;
  const filtered = filterMo==='all' ? allExp : allExp.filter(e=>getMonth(e)===MONTH_DATES[MONTHS.indexOf(filterMo)]);
  const spendExp = filtered.filter(e=>e.catId!=='cash');

  const totalEur = spendExp.reduce((s,e)=>s+expenseEur(e),0);
  const totalTnd = spendExp.reduce((s,e)=>s+expenseTnd(e),0);
  const nbDep    = spendExp.length;
  const avgDep   = nbDep>0 ? totalEur/nbDep : 0;
  const totalRemb = spendExp.filter(e=>e.remb).reduce((s,e)=>s+expenseEur(e),0);
  const totalBankFees = spendExp.reduce((s,e)=>s+(e.bankFee||0),0);
  const totalPourboires = filtered.filter(e=>e.catId==='pourboires').reduce((s,e)=>s+expenseEur(e),0);

  // Gains
  const filteredGains = filterMo==='all' ? gains : gains.filter(g => g.date.startsWith(MONTH_DATES[MONTHS.indexOf(filterMo)]));
  const totalGains    = filteredGains.reduce((s,g) => s + gainEur(g), 0);
  const soldeNet      = totalGains - totalEur;

  // Cash track — EUR (nouveau système withdrawals + rétrocompat catId='cash')
  const cashEurRetire  = withdrawals.filter(w=>w.currency==='EUR').reduce((s,w)=>s+Number(w.amount),0)
                       + filtered.filter(e=>e.catId==='cash' && e.currency==='EUR').reduce((s,e)=>s+expenseEur(e),0);
  const cashEurPaid    = filtered.filter(e=>e.payment==='Espèces' && e.currency==='EUR' && e.catId!=='cash').reduce((s,e)=>s+expenseEur(e),0);
  const cashEurRestant = cashEurRetire - cashEurPaid;
  // Cash track — TND
  const cashTndRetire  = withdrawals.filter(w=>w.currency==='TND').reduce((s,w)=>s+Number(w.amount),0)
                       + filtered.filter(e=>e.catId==='cash' && e.currency==='TND').reduce((s,e)=>s+expenseTnd(e),0);
  const cashTndPaid    = filtered.filter(e=>e.payment==='Espèces' && e.currency==='TND' && e.catId!=='cash').reduce((s,e)=>s+expenseTnd(e),0);
  const cashTndRestant = cashTndRetire - cashTndPaid;

  // Budget
  const budgetRef = getBudgetGlobal(filterMo);
  const reste     = budgetRef - totalEur;
  const pctUsed   = pct(totalEur, budgetRef);

  // Per-category stats
  const catStats = CATS.filter(c=>c.id!=='cash').map(c=>{
    const exps = spendExp.filter(e=>e.catId===c.id);
    const spent = exps.reduce((s,e)=>s+expenseEur(e),0);
    const budget = c.type==='mensuel' && filterMo!=='all' ? getBudget(c.id) : (c.type==='mensuel' ? getBudget(c.id)*4 : getBudget(c.id));
    return { c, spent, budget };
  }).filter(x=>x.spent>0||x.budget>0);

  // Monthly totals for mini chart
  const monthlyTotals = MONTH_DATES.map(ym =>
    allExp.filter(e=>getMonth(e)===ym && e.catId!=='cash').reduce((s,e)=>s+expenseEur(e),0)
  );
  const monthlyBudgets = MONTHS.map(m => getBudgetGlobal(m));
  const maxMonthly = Math.max(...monthlyTotals, ...monthlyBudgets, 1);

  // Donut segments
  const donutSegs = catStats.filter(x=>x.spent>0).map(x=>({
    v: x.spent,
    color: catColor(x.c.id).bar,
    label: x.c.lbl,
    ic: x.c.ic,
  }));

  const pctColor = pctUsed < 70 ? 'var(--green)' : pctUsed < 90 ? 'var(--orange)' : 'var(--red)';

  const body = document.getElementById('dash-body');
  body.innerHTML = `
  <!-- Top stats — wrapper pour desktop 3×2 -->
  <div class="stat-group" style="margin-top:12px">
    <div class="stat-grid">
      <div class="stat-card accent-bg">
        <div class="stat-label">Budget total</div>
        <div class="stat-value mono">${dashFmt(budgetRef,0)}</div>
        <div class="stat-small">${filterMo==='all'?'Mai – Août 2026':MONTH_LABELS[MONTHS.indexOf(filterMo)]}</div>
      </div>
      <div class="stat-card ${reste>=0?'green-bg':'red-bg'}">
        <div class="stat-label">Reste</div>
        <div class="stat-value mono">${dashFmt(reste,0)}</div>
        <div class="stat-small">${pctUsed.toFixed(0)}% consommé</div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Dépensé</div>
        <div class="stat-value mono">${dashFmt(totalEur,2)}</div>
        <div class="stat-small">${dashCurrency==='EUR'?fmtTnd(totalTnd,0):fmtEur(totalEur,2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Nb dépenses</div>
        <div class="stat-value">${nbDep}</div>
        <div class="stat-small">Moy. ${dashFmt(avgDep,2)}</div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card green-bg">
        <div class="stat-label">À rembourser</div>
        <div class="stat-value mono">${dashFmt(totalRemb,2)}</div>
        <div class="stat-small">Remboursable LEEM</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Frais bancaires</div>
        <div class="stat-value mono">${dashFmt(totalBankFees,2)}</div>
        <div class="stat-small">Pourboires: ${dashFmt(totalPourboires,2)}</div>
      </div>
    </div>
  </div>

  <!-- Budget progress bar -->
  <div class="card">
    <div class="card-title">Progression budget</div>
    <div class="prog-header">
      <span class="prog-label">Total dépensé</span>
      <span class="prog-amount">${dashFmt(totalEur,0)} / ${dashFmt(budgetRef,0)}</span>
    </div>
    <div class="prog-bar-bg">
      <div class="prog-bar" style="width:${pctUsed}%;background:${pctColor}"></div>
    </div>
    <div class="prog-sub"><span>${pctUsed.toFixed(1)}% utilisé</span><span>Reste: ${dashFmt(reste,0)}</span></div>
  </div>

  <!-- Donut chart -->
  <div class="card">
    <div class="card-title">Répartition par catégorie</div>
    <div class="donut-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0">
        ${makeDonut(donutSegs, totalEur, 60, 60, 45, 18)}
        <text x="60" y="56" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="800" fill="#1a1d2e">${dashFmt(totalEur,0)}</text>
        <text x="60" y="69" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#a0a8c0">total</text>
      </svg>
      <div class="donut-legend">
        ${donutSegs.slice(0,8).map(s=>`
          <div class="legend-item">
            <div class="legend-dot" style="background:${s.color}"></div>
            <span style="display:flex;align-items:center;gap:5px">${icon(s.ic||'divers',14)} ${s.label}</span>
            <span style="margin-left:auto;font-family:var(--fm);font-size:11px">${((s.v/totalEur)*100).toFixed(0)}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- Category progress bars -->
  <div class="card">
    <div class="card-title">Dépenses par catégorie</div>
    ${catStats.map(({c,spent,budget})=>{
      const p = pct(spent,budget);
      const col = catColor(c.id);
      const pColor = p<70?col.bar:p<90?'var(--orange)':'var(--red)';
      return `<div class="prog-wrap">
        <div class="prog-header">
          <span class="prog-label">
            <span style="background:${col.bg};color:${col.text};padding:2px 8px;border-radius:20px;font-size:12px;display:inline-flex;align-items:center;gap:5px">${icon(c.ic||'divers',13,col.text)} ${c.lbl}</span>
          </span>
          <span class="prog-amount">${dashFmt(spent,0)}${budget>0?' / '+dashFmt(budget,0):''}</span>
        </div>
        ${budget>0 ? (()=>{
          const max   = Math.max(spent, budget);
          const wOk   = (Math.min(spent, budget) / max * 100).toFixed(1);
          const wOver = spent > budget ? ((spent - budget) / max * 100).toFixed(1) : 0;
          return `<div class="prog-bar-bg" style="overflow:visible">
            <div style="display:flex;height:100%;border-radius:99px;overflow:hidden">
              <div style="width:${wOk}%;background:${col.bar};transition:width .4s;flex-shrink:0"></div>
              ${wOver > 0 ? `<div style="width:${wOver}%;background:var(--red);transition:width .4s;flex-shrink:0"></div>` : ''}
            </div>
          </div>
          <div class="prog-sub">${p>100
            ? `<span style="color:var(--red);font-weight:800">Dépassement +${dashFmt(spent-budget,0)}</span><span>Budget: ${dashFmt(budget,0)}</span>`
            : `<span>${p.toFixed(0)}%</span><span>Reste: ${dashFmt(budget-spent,0)}</span>`
          }</div>`;
        })() :
        `<div class="prog-sub"><span>Pas de budget fixé</span></div>`}
      </div>`;
    }).join('')}
  </div>

  <!-- Monthly mini chart -->
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
      <span>Progression mensuelle</span>
      <span style="font-size:10px;color:var(--text3);font-weight:600;display:flex;align-items:center;gap:4px">
        <span style="display:inline-block;width:18px;height:2px;border-top:2px dashed var(--text3);vertical-align:middle"></span>Budget
      </span>
    </div>
    <div class="monthly-bars">
      ${MONTH_DATES.map((ym,i)=>{
        const v      = monthlyTotals[i];
        const budget = monthlyBudgets[i];
        const h      = maxMonthly>0 ? Math.max(4,(v/maxMonthly)*100) : 4;
        const bLine  = maxMonthly>0 ? (budget/maxMonthly)*100 : 0;
        const colors = ['#f0a0b8','#84c0f0','#78d4a0','#b098f4'];
        const col    = v > budget ? 'var(--red)' : colors[i];
        return `<div class="monthly-bar-wrap">
          <div class="monthly-bar-val" style="color:${v>budget?'var(--red)':'var(--text2)'}">${v>0?dashFmt(v,0):''}</div>
          <div class="monthly-bar-bg" style="position:relative">
            <div class="monthly-bar-fill" style="height:${h}%;background:${col}"></div>
            ${bLine>0&&bLine<=100?`<div style="position:absolute;left:0;right:0;bottom:${bLine.toFixed(1)}%;height:2px;background:rgba(0,0,0,0.20);border-top:2px dashed rgba(0,0,0,0.30);pointer-events:none"></div>`:''}
          </div>
          <div class="monthly-bar-label">${MONTH_LABELS[i]}</div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- Gains & Solde net -->
  <div class="card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div class="card-title" style="margin:0">Gains & Solde net</div>
      <button onclick="openGainModal()" style="display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);font-size:12px;font-weight:700;color:var(--text2);cursor:pointer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Entrée
      </button>
    </div>
    <div class="stat-grid" style="margin-bottom:${filteredGains.length>0?'12':'0'}px">
      <div class="stat-card green-bg">
        <div class="stat-label">Total gains</div>
        <div class="stat-value mono">${dashFmt(totalGains,2)}</div>
        <div class="stat-small">${filteredGains.length} entrée${filteredGains.length!==1?'s':''}</div>
      </div>
      <div class="stat-card ${soldeNet<=0?'red-bg':'green-bg'}">
        <div class="stat-label">Solde net</div>
        <div class="stat-value mono">${soldeNet>0?'+':''}${dashFmt(soldeNet,2)}</div>
        <div class="stat-small">${soldeNet<=0?'Dépenses > gains':'Gains > dépenses'}</div>
      </div>
    </div>
    ${filteredGains.length===0 ? `
      <div style="text-align:center;color:var(--text3);font-size:13px;padding:8px 0">
        Aucun gain enregistré — appuie sur <strong>+ Entrée</strong>
      </div>` :
      filteredGains.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(g=>{
        const gt = GAIN_TYPES.find(t=>t.id===g.type)||GAIN_TYPES[3];
        return `<div class="cash-row">
          <div>
            <div style="font-size:13px;font-weight:700">${gt.em} ${gt.lbl}${g.desc?` · <span style="font-weight:400;color:var(--text2)">${escHtml(g.desc)}</span>`:''}</div>
            <div style="font-size:11px;color:var(--text3)">${formatDate(g.date)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:15px;font-weight:800;font-family:var(--fm);color:var(--green)">+${dashFmt(gainEur(g),2)}</span>
            <button onclick="openEditGain('${g.id}')" style="background:none;border:none;cursor:pointer;color:var(--text3);padding:0;font-size:15px" title="Modifier">✎</button>
            <button onclick="deleteGain('${g.id}')" style="background:none;border:none;cursor:pointer;color:var(--text3);padding:0;font-size:16px" title="Supprimer">✕</button>
          </div>
        </div>`;
      }).join('')
    }
  </div>

  <!-- Cash mini-résumé dashboard -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin:12px 0 8px">
    <div class="section-label">Suivi cash</div>
    <button onclick="showView('cash')" style="font-size:12px;font-weight:700;color:var(--accent);background:none;border:none;cursor:pointer;padding:4px 0">Voir tout →</button>
  </div>
  <div class="stat-grid">
    ${cashEurRetire>0||cashEurPaid>0 ? `
    <div class="card" style="margin-bottom:0;cursor:pointer" onclick="showView('cash')">
      <div class="card-title">💶 EUR</div>
      <div class="cash-row"><span class="cash-row-label">Restant</span>
        <span class="cash-row-val" style="color:${cashEurRestant>=0?'var(--green)':'var(--red)'}">${fmtEur(cashEurRestant,2)}</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">${fmtEur(cashEurRetire,0)} retiré · ${fmtEur(cashEurPaid,0)} dépensé</div>
    </div>` : ''}
    ${cashTndRetire>0||cashTndPaid>0 ? `
    <div class="card" style="margin-bottom:0;cursor:pointer" onclick="showView('cash')">
      <div class="card-title">🪙 TND</div>
      <div class="cash-row"><span class="cash-row-label">Restant</span>
        <span class="cash-row-val" style="color:${cashTndRestant>=0?'var(--green)':'var(--red)'}">${fmtTnd(cashTndRestant,2)}</span>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">${fmtTnd(cashTndRetire,0)} retiré · ${fmtTnd(cashTndPaid,0)} dépensé</div>
    </div>` : ''}
    ${cashEurRetire===0&&cashEurPaid===0&&cashTndRetire===0&&cashTndPaid===0 ? `
    <div class="card" style="grid-column:1/-1;margin-bottom:0;color:var(--text3);font-size:13px;text-align:center;padding:14px;cursor:pointer" onclick="showView('cash')">
      Aucun retrait — appuie sur <strong>Cash</strong> dans la nav
    </div>` : ''}
  </div>
  `;
}
