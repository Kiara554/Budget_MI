'use strict';
// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function fmtEur(n, dp=2) { return (n||0).toFixed(dp).replace('.',',') + ' €'; }
function fmtTnd(n, dp=2) { return (n||0).toFixed(dp).replace('.',',') + ' TND'; }
// Dashboard display currency (toggleable)
function dashFmt(eurVal, dp=2) {
  if(dashCurrency==='TND') return fmtTnd(eurVal * settings.rate, dp);
  return fmtEur(eurVal, dp);
}
function toggleDashCurrency() {
  dashCurrency = dashCurrency==='EUR' ? 'TND' : 'EUR';
  document.getElementById('dc-eur').classList.toggle('active', dashCurrency==='EUR');
  document.getElementById('dc-tnd').classList.toggle('active', dashCurrency==='TND');
  renderDash();
}
function pct(a,b) { return b>0 ? Math.min((a/b)*100,100) : 0; }

function toEur(amount, currency) {
  if(currency==='EUR') return amount;
  if(currency==='TND') return amount / settings.rate;
  if(currency==='USD') return amount * 0.92; // approximate
  return amount;
}
function toTnd(amount, currency) {
  if(currency==='TND') return amount;
  if(currency==='EUR') return amount * settings.rate;
  if(currency==='USD') return amount * 0.92 * settings.rate;
  return amount;
}
function expenseEur(e) { return toEur(e.amount, e.currency) + (e.bankFee||0); }
function expenseTnd(e) { return toTnd(e.amount, e.currency); }

function getMonth(e) {
  if(!e.date) return null;
  const ym = e.date.slice(0,7);
  // Les dépenses d'avril sont regroupées dans Mai (prépa)
  if(ym === '2026-04') return '2026-05';
  return ym;
}
function getMonthIdx(e) {
  const ym = getMonth(e);
  return MONTH_DATES.indexOf(ym);
}

function computeBudgetPrepa()   { return CATS.filter(c=>c.type==='prepa').reduce((s,c)=>s+getBudget(c.id),0); }
function computeBudgetMensuel() { return CATS.filter(c=>c.type==='mensuel').reduce((s,c)=>s+getBudget(c.id),0); }
function computeBudgetTotal()   { return computeBudgetPrepa() + computeBudgetMensuel()*3; }

function getBudgetGlobal(mo) {
  if (mo === 'all') return computeBudgetTotal();
  if (mo === 'mai') return computeBudgetPrepa();
  return computeBudgetMensuel();
}

function getBudget(catId) {
  if(settings.budgets[catId] && settings.budgets[catId].budget !== undefined)
    return settings.budgets[catId].budget;
  return CAT_MAP[catId]?.budget ?? 0;
}
function getPlafond(catId) {
  if(settings.budgets[catId] && settings.budgets[catId].plafond !== undefined)
    return settings.budgets[catId].plafond;
  return CAT_MAP[catId]?.plafond ?? null;
}

function catColor(catId) {
  const c = CAT_COLORS[catId] || CAT_COLORS.divers;
  if (document.documentElement.getAttribute('data-theme') === 'dark' && c.bgd) {
    return {bg: c.bgd, text: c.textd, bar: c.bar};
  }
  return c;
}

function filteredExpenses() {
  return expenses.filter(e => {
    if(filterMo !== 'all') {
      const ym = getMonth(e);
      if(ym !== MONTH_DATES[MONTHS.indexOf(filterMo)]) return false;
    }
    if(catFilter !== 'all' && e.catId !== catFilter) return false;
    if(search) {
      const q = search.toLowerCase();
      if(!(e.desc||'').toLowerCase().includes(q) &&
         !(CAT_MAP[e.catId]?.lbl||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function makeDonut(segs, total, cx, cy, r, sw) {
  if(!total) return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f6" stroke-width="${sw}"/>`;
  const circ = 2*Math.PI*r;
  let cumLen = 0;
  return segs.filter(s=>s.v>0).map(s=>{
    const len=(s.v/total)*circ;
    const offset = circ/4 - cumLen;
    cumLen += len;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${len.toFixed(2)} ${(circ-len).toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"/>`;
  }).join('');
}

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════
function showView(v) {
  curView = v;
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === v);
  });
  render();
}

function buildTabs(containerId, activeVal, onchange) {
  const el = document.getElementById(containerId);
  el.innerHTML = ['all',...MONTHS].map((m,i) =>
    `<button class="tab-btn ${filterMo===m&&activeVal===m?'active':m===activeVal?'active':''}" onclick="(${onchange})('${m}')">${i===0?'Tout':MONTH_LABELS[i-1]}</button>`
  ).join('');
  // fix active
  el.querySelectorAll('.tab-btn').forEach((btn,i)=>{
    const m = i===0?'all':MONTHS[i-1];
    btn.classList.toggle('active', m===activeVal);
  });
}
