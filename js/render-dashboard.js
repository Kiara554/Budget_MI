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

  // Comparaison mois précédent (disponible pour juin / juil / août)
  const _prevMoIdx = (filterMo !== 'all' && filterMo !== 'mai') ? MONTHS.indexOf(filterMo) - 1 : -1;
  const _prevMoYm  = _prevMoIdx >= 0 ? MONTH_DATES[_prevMoIdx] : null;
  const _prevSpend = _prevMoYm ? allExp.filter(e => getMonth(e) === _prevMoYm && e.catId !== 'cash') : [];
  const _prevTotal = _prevSpend.reduce((s,e) => s + expenseEur(e), 0);
  const _prevRemb  = _prevSpend.filter(e => e.remb).reduce((s,e) => s + expenseEur(e), 0);
  const _prevNb    = _prevSpend.length;
  const _deltaDep  = totalEur  - _prevTotal;
  const _deltaRemb = totalRemb - _prevRemb;
  const _fmtDelta  = v => (v > 0 ? '+' : '') + dashFmt(v, 0);

  // Per-category stats
  const catStats = getCats().filter(c => {
    if (c.id === 'cash') return false;
    if (c.type === 'prepa' && filterMo !== 'all' && filterMo !== 'mai') return false;
    return true;
  }).map(c=>{
    const exps = spendExp.filter(e=>e.catId===c.id);
    const spent = exps.reduce((s,e)=>s+expenseEur(e),0);
    const budget = c.type==='mensuel' && filterMo!=='all' ? getBudget(c.id) : (c.type==='mensuel' ? getBudget(c.id)*4 : getBudget(c.id));
    return { c, spent, budget };
  }).filter(x=>x.spent>0||x.budget>0);

  // Monthly totals for bar chart
  const monthlyTotals = MONTH_DATES.map(ym =>
    allExp.filter(e=>getMonth(e)===ym && e.catId!=='cash').reduce((s,e)=>s+expenseEur(e),0)
  );
  const monthlyBudgets = MONTHS.map(m => getBudgetGlobal(m));
  const maxMonthly = Math.max(...monthlyTotals, ...monthlyBudgets, 1);

  // Granular progression data for curve mode
  function buildProgressionData() {
    const isAll = filterMo === 'all';
    const granularity = dashChartGranularity;
    let startStr, endStr, totalBudget;
    if (isAll) {
      startStr = settings.stageStart || '2026-05-01';
      endStr   = settings.stageEnd   || '2026-08-31';
      totalBudget = monthlyBudgets.reduce((s,v)=>s+v, 0);
    } else {
      const idx = MONTHS.indexOf(filterMo);
      const ym  = MONTH_DATES[idx];
      const [y, m] = ym.split('-').map(Number);
      startStr = `${ym}-01`;
      endStr   = `${ym}-${String(new Date(y,m,0).getDate()).padStart(2,'0')}`;
      totalBudget = getBudgetGlobal(filterMo);
    }
    const start = new Date(startStr), end = new Date(endStr);
    const today = new Date().toISOString().slice(0,10);

    // Build buckets
    const buckets = [];
    let d = new Date(start);
    if (granularity === 'day') {
      while (d <= end) {
        const ds = d.toISOString().slice(0,10);
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        buckets.push({ label: `${dd}/${mm}`, date: ds });
        d.setDate(d.getDate()+1);
      }
    } else {
      while (d <= end) {
        const ws = d.toISOString().slice(0,10);
        const we = new Date(d); we.setDate(we.getDate()+6);
        if (we > end) we.setTime(end.getTime());
        const wes = we.toISOString().slice(0,10);
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        buckets.push({ label: `${dd}/${mm}`, date: ws, endDate: wes });
        d.setDate(d.getDate()+7);
      }
    }

    const rel = allExp.filter(e => e.catId!=='cash' && e.date >= startStr && e.date <= endStr);
    let cum = 0;
    const points = buckets.map(b => {
      const bEnd = b.endDate || b.date;
      const v = rel.filter(e => e.date >= b.date && e.date <= bEnd).reduce((s,e)=>s+expenseEur(e),0);
      cum += v;
      const isToday = today >= b.date && today <= bEnd;
      return { label: b.label, value: cum, isToday };
    });

    // Budget pace line: linear from 0 to totalBudget
    const totalDays = (end - start) / 86400000 + 1;
    const budgetPoints = buckets.map(b => {
      const bEnd = b.endDate || b.date;
      const dayNum = (new Date(bEnd) - start) / 86400000 + 1;
      return totalBudget * dayNum / totalDays;
    });

    // Gains curve: cumulative gains per bucket
    const gainRel = gains.filter(g => g.date >= startStr && g.date <= endStr);
    let cumGain = 0;
    const gainPoints = buckets.map(b => {
      const bEnd = b.endDate || b.date;
      const v = gainRel.filter(g => g.date >= b.date && g.date <= bEnd).reduce((s,g) => s + gainEur(g), 0);
      cumGain += v;
      return cumGain;
    });

    return { points, budgetPoints, gainPoints, totalBudget, startStr, endStr };
  }

  // Donut segments
  const donutSegs = catStats.filter(x=>x.spent>0).map(x=>({
    v: x.spent,
    color: catColor(x.c.id).bar,
    label: x.c.lbl,
    ic: x.c.ic,
  }));

  const pctColor = pctUsed < 70 ? 'var(--green)' : pctUsed < 90 ? 'var(--orange)' : 'var(--red)';

  // Statistiques dépenses (carte collapsible)
  const _DAY_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const _dayTotals  = [0,0,0,0,0,0,0];
  spendExp.forEach(e => {
    if (!e.date) return;
    const dow = (new Date(e.date + 'T12:00:00').getDay() + 6) % 7;
    _dayTotals[dow] += expenseEur(e);
  });
  const _maxDayV   = Math.max(..._dayTotals, 0.01);
  const _topDayIdx = _dayTotals.indexOf(Math.max(..._dayTotals));
  const _catFreq   = {};
  spendExp.forEach(e => { _catFreq[e.catId] = (_catFreq[e.catId] || 0) + 1; });
  const _topCatEntry = Object.entries(_catFreq).sort((a,b) => b[1]-a[1])[0];
  const _topCat      = _topCatEntry ? getCatMap()[_topCatEntry[0]] : null;
  const _topCatCount = _topCatEntry?.[1] || 0;
  const _topExp = spendExp.length > 0
    ? spendExp.reduce((a,b) => expenseEur(a) >= expenseEur(b) ? a : b)
    : null;

  const body = document.getElementById('dash-body');
  // Compte à rebours fin de stage (dates issues des réglages)
  const _today      = new Date(); _today.setHours(0,0,0,0);
  const _stageEnd   = new Date((settings.stageEnd   || '2026-08-31') + 'T12:00:00'); _stageEnd.setHours(0,0,0,0);
  const _stageStart = new Date((settings.stageStart || '2026-05-01') + 'T12:00:00'); _stageStart.setHours(0,0,0,0);
  const _daysLeft = Math.ceil((_stageEnd - _today) / 86400000);
  const _stageStarted = _today >= _stageStart;
  const _stageOver    = _today > _stageEnd;
  // Labels formatés depuis les dates réglages
  const _fmtShortDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'long' });
  const _startLabel = _fmtShortDate(settings.stageStart || '2026-05-01');
  const _endLabel   = _fmtShortDate(settings.stageEnd   || '2026-08-31');
  const _countdownHtml = (() => {
    if (_stageOver)   return `<div style="display:flex;align-items:center;gap:6px;justify-content:center;font-size:13px;color:var(--text3);padding:10px 0">${icon('check',14,'var(--green)')} Stage terminé</div>`;
    if (!_stageStarted) {
      const d = Math.ceil((_stageStart - _today) / 86400000);
      return `<div style="display:flex;align-items:center;justify-content:space-between;background:var(--accent-pale);border-radius:14px;padding:10px 14px;margin-bottom:4px">
        <span style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--accent)">${icon('calendar',14,'var(--accent)')} Départ dans ${d} jour${d>1?'s':''}</span>
        <span style="font-size:12px;color:var(--text3)">${_startLabel}</span>
      </div>`;
    }
    const col = _daysLeft <= 7 ? 'var(--red)' : _daysLeft <= 14 ? 'var(--orange)' : 'var(--accent)';
    const bg  = _daysLeft <= 7 ? 'var(--red-pale)' : _daysLeft <= 14 ? 'var(--orange-pale)' : 'var(--accent-pale)';
    return `<div style="display:flex;align-items:center;justify-content:space-between;background:${bg};border-radius:14px;padding:10px 14px;margin-bottom:4px">
      <span style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:${col}">${icon('clock',14,col)} Il reste <strong>${_daysLeft}</strong> jour${_daysLeft>1?'s':''}</span>
      <span style="font-size:12px;color:var(--text3)">Fin le ${_endLabel}</span>
    </div>`;
  })();

  // Widget tâches urgentes
  const _todayStr   = new Date().toISOString().slice(0,10);
  const _urgentTodos = todoItems.filter(t => !t.done && (
    (t.dueDate && t.dueDate < _todayStr) || t.priority === 'high'
  )).sort((a, b) => {
    const aOv = a.dueDate && a.dueDate < _todayStr;
    const bOv = b.dueDate && b.dueDate < _todayStr;
    if (aOv && !bOv) return -1;
    if (!aOv && bOv) return 1;
    if (aOv && bOv) return a.dueDate.localeCompare(b.dueDate);
    return 0;
  });
  const _urgentWidget = _urgentTodos.length === 0 ? '' : `
    <div style="background:var(--surface);border-radius:16px;padding:11px 13px;margin-bottom:4px;box-shadow:var(--shadow);border-left:3px solid var(--red)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="display:flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--red);letter-spacing:.4px">${icon('alert-tri',13,'var(--red)')} TÂCHES URGENTES</span>
        <button onclick="showView('todo')" style="font-size:11px;font-weight:700;color:var(--accent);background:none;border:none;cursor:pointer;padding:0">Voir tout →</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${_urgentTodos.slice(0,3).map(t => {
          const isOverdue = t.dueDate && t.dueDate < _todayStr;
          const badge = isOverdue
            ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:var(--red);padding:1px 6px;border-radius:8px;background:var(--red-pale);white-space:nowrap;flex-shrink:0">${icon('calendar',10,'var(--red)')} Retard</span>`
            : `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#f07090;padding:1px 6px;border-radius:8px;background:#ffe8f0;white-space:nowrap;flex-shrink:0">${icon('alert-tri',10,'#f07090')} Haute</span>`;
          return `<div style="display:flex;align-items:center;gap:7px;padding:7px 9px;background:var(--surface2);border-radius:10px;cursor:pointer" onclick="showView('todo')">
            ${badge}
            <span style="font-size:13px;font-weight:600;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(t.text)}</span>
          </div>`;
        }).join('')}
        ${_urgentTodos.length > 3 ? `<div style="font-size:11px;color:var(--text3);text-align:center;padding-top:2px">+${_urgentTodos.length - 3} autre${_urgentTodos.length - 3 > 1 ? 's' : ''} tâche${_urgentTodos.length - 3 > 1 ? 's' : ''} urgente${_urgentTodos.length - 3 > 1 ? 's' : ''}</div>` : ''}
      </div>
    </div>`;

  body.innerHTML = `
  ${_countdownHtml}
  ${_urgentWidget}
  <!-- Top stats — wrapper pour desktop 3×2 -->
  <div class="stat-group" style="margin-top:12px">
    <div class="stat-grid">
      <div class="stat-card accent-bg">
        <div class="stat-label">Budget total</div>
        <div class="stat-value mono">${dashFmt(budgetRef,0)}</div>
        <div class="stat-small">${filterMo==='all'?`${_startLabel} – ${_endLabel}`:MONTH_LABELS[MONTHS.indexOf(filterMo)]}</div>
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

  <!-- Comparaison mois précédent -->
  ${_prevMoYm ? `
  <div class="card" style="padding:12px 14px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="card-title" style="margin:0">vs ${MONTH_LABELS[_prevMoIdx]}</div>
      <span style="font-size:11px;color:var(--text3);font-weight:700">${MONTH_LABELS[MONTHS.indexOf(filterMo)]}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:4px">DÉPENSÉ</div>
        <div style="font-size:16px;font-weight:800;font-family:var(--fm)">${dashFmt(totalEur,0)}</div>
        <div style="display:flex;align-items:center;gap:3px;margin-top:4px">
          ${_deltaDep!==0?icon(_deltaDep>0?'alert-tri':'check',11,_deltaDep>0?'var(--red)':'var(--green)'):''}
          <span style="font-size:12px;font-weight:700;color:${_deltaDep>0?'var(--red)':_deltaDep<0?'var(--green)':'var(--text3)'}">
            ${_deltaDep===0?'—':_fmtDelta(_deltaDep)}
          </span>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:4px">REMBOURSABLE</div>
        <div style="font-size:16px;font-weight:800;font-family:var(--fm)">${dashFmt(totalRemb,0)}</div>
        <div style="display:flex;align-items:center;gap:3px;margin-top:4px">
          ${_deltaRemb!==0?icon(_deltaRemb<0?'alert-tri':'check',11,_deltaRemb<0?'var(--orange)':'var(--green)'):''}
          <span style="font-size:12px;font-weight:700;color:${_deltaRemb>0?'var(--green)':_deltaRemb<0?'var(--orange)':'var(--text3)'}">
            ${_deltaRemb===0?'—':_fmtDelta(_deltaRemb)}
          </span>
        </div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--text3);margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">
      ${nbDep} dépense${nbDep!==1?'s':''} ce mois · ${_prevNb} en ${MONTH_LABELS[_prevMoIdx]}
    </div>
  </div>` : ''}

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
          <span class="prog-amount" style="display:flex;align-items:center;gap:4px">${p>=100?icon('alert-tri',12,'var(--red)'):p>=80?icon('alert-tri',12,'var(--orange)'):''}${dashFmt(spent,0)}${budget>0?' / '+dashFmt(budget,0):''}</span>
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

  <!-- Statistiques dépenses (collapsible) -->
  ${spendExp.length > 0 ? `
  <div class="card" style="padding:0;overflow:hidden">
    <button onclick="dashStatsOpen=!dashStatsOpen;renderDash()"
      style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:none;border:none;cursor:pointer;text-align:left">
      <span class="card-title" style="margin:0;display:flex;align-items:center;gap:7px">${icon('info',15,'var(--text2)')} Statistiques</span>
      <span style="font-size:13px;color:var(--text3);line-height:1">${dashStatsOpen?'▲':'▼'}</span>
    </button>
    ${dashStatsOpen ? `
    <div style="padding:0 14px 14px">
      <div style="font-size:10px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:8px">DÉPENSES PAR JOUR DE LA SEMAINE</div>
      <div style="display:flex;gap:4px;align-items:flex-end;height:56px">
        ${_DAY_LABELS.map((lbl,i) => {
          const h = Math.max(3, (_dayTotals[i] / _maxDayV) * 44).toFixed(0);
          const isTop = i === _topDayIdx && _dayTotals[i] > 0;
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
            <div style="width:100%;height:${h}px;background:${isTop?'var(--accent)':'var(--surface2)'};border-radius:4px 4px 2px 2px"></div>
            <span style="font-size:9px;font-weight:${isTop?800:600};color:${isTop?'var(--accent)':'var(--text3)'}">${lbl}</span>
          </div>`;
        }).join('')}
      </div>
      ${_dayTotals[_topDayIdx] > 0 ? `
      <div style="font-size:12px;color:var(--text2);margin-top:8px">
        Jour le plus dépensier : <strong style="color:var(--accent)">${_DAY_LABELS[_topDayIdx]}</strong> — ${dashFmt(_dayTotals[_topDayIdx],0)}
      </div>` : ''}
      ${_topCat ? `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:12px;margin-top:12px">
        ${catIconHtml(_topCatEntry[0],18)}
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:800;color:var(--text)">${_topCat.lbl}</div>
          <div style="font-size:11px;color:var(--text3)">Catégorie la plus fréquente — ${_topCatCount} fois</div>
        </div>
      </div>` : ''}
      ${_topExp ? `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:12px;margin-top:8px">
        ${catIconHtml(_topExp.catId,18)}
        <div style="flex:1;min-width:0;overflow:hidden">
          <div style="font-size:12px;font-weight:800;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(_topExp.enseigne||getCatMap()[_topExp.catId]?.lbl||'Divers')}</div>
          <div style="font-size:11px;color:var(--text3)">${formatDate(_topExp.date)} — dépense la plus élevée</div>
        </div>
        <span style="font-size:14px;font-weight:800;font-family:var(--fm);color:var(--text);flex-shrink:0">${dashFmt(expenseEur(_topExp),0)}</span>
      </div>` : ''}
    </div>` : ''}
  </div>` : ''}

  <!-- Monthly mini chart -->
  <div class="card">
    <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
      <span>Progression ${filterMo==='all'?'globale':'mensuelle'}</span>
      <div style="display:flex;align-items:center;gap:6px">
        ${dashChartMode==='curve' ? `
        <button onclick="dashChartGranularity=dashChartGranularity==='week'?'day':'week';renderDash()" style="padding:3px 7px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);font-size:10px;font-weight:700;color:var(--text2);cursor:pointer">
          ${icon('calendar',10,'var(--text2)')} ${dashChartGranularity==='week'?'Jour':'Semaine'}
        </button>` : ''}
        <button onclick="dashChartMode=dashChartMode==='bar'?'curve':'bar';renderDash()" style="padding:3px 8px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);font-size:11px;font-weight:700;color:var(--text2);cursor:pointer">
          ${dashChartMode==='bar'?'∿ Courbe':'▬ Barres'}
        </button>
      </div>
    </div>
    ${dashChartMode === 'bar' ? `
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
    </div>` : (()=>{
      const { points, budgetPoints, gainPoints, totalBudget } = buildProgressionData();
      if (!points.length) return `<div style="text-align:center;color:var(--text3);font-size:13px;padding:24px 0">Aucune dépense</div>`;

      const hasGains = gainPoints.some(v => v > 0);
      const svgW = 300, svgH = 130, padL = 36, padR = 10, padT = 22, padB = 26;
      const plotW = svgW - padL - padR;
      const plotH = svgH - padT - padB;
      const maxV  = Math.max(...points.map(p=>p.value), ...budgetPoints, ...(hasGains ? gainPoints : []), 1);

      const toX = i => padL + (i / (points.length - 1 || 1)) * plotW;
      const toY = v => padT + plotH - (v / maxV) * plotH;

      const linePath = points.map((p,i) => `${i===0?'M':'L'}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`).join(' ');
      const budPath  = budgetPoints.map((v,i) => `${i===0?'M':'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
      const areaPath = linePath + ` L${toX(points.length-1).toFixed(1)},${(padT+plotH).toFixed(1)} L${toX(0).toFixed(1)},${(padT+plotH).toFixed(1)} Z`;
      const gainPath = hasGains ? gainPoints.map((v,i) => `${i===0?'M':'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ') : '';
      const gainAreaPath = hasGains ? gainPath + ` L${toX(gainPoints.length-1).toFixed(1)},${(padT+plotH).toFixed(1)} L${toX(0).toFixed(1)},${(padT+plotH).toFixed(1)} Z` : '';

      // Y-axis labels (3 ticks)
      const yTicks = [0, 0.5, 1].map(f => ({ v: maxV*f, y: toY(maxV*f) }));

      // X labels: show every Nth to avoid overlap; max ~6 visible
      const step = Math.ceil(points.length / 6);

      // Today marker index
      const todayIdx = points.findIndex(p=>p.isToday);

      // Legend layout: budget always shown; gains only if non-zero
      const legendItems = [
        { x: svgW-120, dash: false, color: 'var(--accent)',   label: 'Dép.' },
        { x: svgW-86,  dash: true,  color: 'rgba(120,120,160,0.55)', label: 'Budget' },
        ...(hasGains ? [{ x: svgW-40, dash: false, color: 'var(--green)', label: 'Gains' }] : []),
      ];

      return `<svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;height:150px;overflow:visible">
        <defs>
          <linearGradient id="prog-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>
          </linearGradient>
          ${hasGains ? `<linearGradient id="gain-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--green)" stop-opacity="0.14"/>
            <stop offset="100%" stop-color="var(--green)" stop-opacity="0.01"/>
          </linearGradient>` : ''}
        </defs>

        <!-- Y-axis ticks and labels -->
        ${yTicks.map(t => `
          <line x1="${padL}" y1="${t.y.toFixed(1)}" x2="${svgW-padR}" y2="${t.y.toFixed(1)}" stroke="var(--border)" stroke-width="0.8" stroke-dasharray="3,3"/>
          <text x="${padL-4}" y="${(t.y+3.5).toFixed(1)}" text-anchor="end" font-size="8" fill="var(--text3)" font-family="Nunito,sans-serif">${t.v>0?dashFmt(t.v,0):''}</text>
        `).join('')}

        <!-- Budget pace line -->
        <path d="${budPath}" fill="none" stroke="rgba(120,120,160,0.4)" stroke-width="1.5" stroke-dasharray="5,4"/>

        <!-- Gains area fill -->
        ${hasGains ? `<path d="${gainAreaPath}" fill="url(#gain-grad)"/>` : ''}

        <!-- Area fill (expenses) -->
        <path d="${areaPath}" fill="url(#prog-grad)"/>

        <!-- Gains curve -->
        ${hasGains ? `<path d="${gainPath}" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="6,3"/>` : ''}

        <!-- Spending curve -->
        <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Today marker -->
        ${todayIdx >= 0 ? `
          <line x1="${toX(todayIdx).toFixed(1)}" y1="${padT}" x2="${toX(todayIdx).toFixed(1)}" y2="${(padT+plotH).toFixed(1)}" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="3,2"/>
          <text x="${toX(todayIdx).toFixed(1)}" y="${(padT-4).toFixed(1)}" text-anchor="middle" font-size="8" fill="var(--orange)" font-family="Nunito,sans-serif">Auj.</text>
        ` : ''}

        <!-- Dots + labels for visible points (expenses) -->
        ${points.map((p, i) => {
          const show = (i % step === 0) || i === points.length - 1;
          const overBudget = p.value > budgetPoints[i];
          const dotCol = overBudget ? 'var(--red)' : 'var(--accent)';
          return `
            ${show && p.value > 0 ? `<circle cx="${toX(i).toFixed(1)}" cy="${toY(p.value).toFixed(1)}" r="3.5" fill="${dotCol}" stroke="white" stroke-width="1.5"/>
            <text x="${toX(i).toFixed(1)}" y="${(toY(p.value)-7).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="800" fill="${overBudget?'var(--red)':'var(--text2)'}" font-family="Nunito,sans-serif">${dashFmt(p.value,0)}</text>` : ''}
            ${show ? `<text x="${toX(i).toFixed(1)}" y="${(padT+plotH+13).toFixed(1)}" text-anchor="middle" font-size="8" fill="var(--text3)" font-family="Nunito,sans-serif">${p.label}</text>` : ''}
          `;
        }).join('')}

        <!-- Gains dots for visible points -->
        ${hasGains ? points.map((p, i) => {
          const show = (i % step === 0) || i === points.length - 1;
          const gv = gainPoints[i];
          return show && gv > 0 ? `<circle cx="${toX(i).toFixed(1)}" cy="${toY(gv).toFixed(1)}" r="2.5" fill="var(--green)" stroke="white" stroke-width="1.2"/>` : '';
        }).join('') : ''}

        <!-- Legend -->
        ${legendItems.map(it => `
          <line x1="${it.x}" y1="${padT+5}" x2="${it.x+10}" y2="${padT+5}" stroke="${it.color}" stroke-width="1.8" ${it.dash?'stroke-dasharray="4,3"':''}/>
          <text x="${it.x+13}" y="${padT+9}" font-size="8" fill="var(--text3)" font-family="Nunito,sans-serif">${it.label}</text>
        `).join('')}
      </svg>`;
    })()}
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
