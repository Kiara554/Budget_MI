'use strict';
// ══════════════════════════════════════════════
//  RENDER: REMBOURSEMENTS
// ══════════════════════════════════════════════
function renderRemb() {
  buildTabs('remb-tabs', rembMo, `(m)=>{rembMo=m;renderRemb()}`);

  // Données communes
  const allRemb      = expenses.filter(e=>e.remb);
  const sansJustifCount = allRemb.filter(e=>!e.recu&&!e.photo).length;
  const rembExp      = rembMo==='all' ? allRemb : allRemb.filter(e=>getMonth(e)===MONTH_DATES[MONTHS.indexOf(rembMo)]);
  const totalRemb    = rembExp.reduce((s,e)=>s+expenseEur(e),0);
  const avecRecu     = rembExp.filter(e=>e.recu).reduce((s,e)=>s+expenseEur(e),0);
  const sansRecu     = rembExp.filter(e=>!e.recu).reduce((s,e)=>s+expenseEur(e),0);
  const plafondTotal = CATS.filter(c=>c.plafond).reduce((s,c)=>s+getPlafond(c.id),0);
  const allExpMo     = rembMo==='all' ? expenses.filter(e=>e.catId!=='cash') : expenses.filter(e=>e.catId!=='cash'&&getMonth(e)===MONTH_DATES[MONTHS.indexOf(rembMo)]);
  const totalDepense = allExpMo.reduce((s,e)=>s+expenseEur(e),0);
  // Plafonnement par total de catégorie (pas par dépense individuelle)
  const totalRembCapped = CATS.reduce((s,c)=>{
    const p = getPlafond(c.id);
    const catTotal = rembExp.filter(e=>e.catId===c.id).reduce((t,e)=>t+expenseEur(e),0);
    return s + (p !== null ? Math.min(catTotal, p) : catTotal);
  }, 0);
  // Le plafond effectif est le min entre la somme des plafonds catégories et le max OPCO global
  const opcoEffectiveMax = plafondTotal > 0 ? Math.min(plafondTotal, OPCO_GLOBAL_MAX) : OPCO_GLOBAL_MAX;
  const montantRecup = Math.min(totalRembCapped, opcoEffectiveMax);
  const pctRemb      = totalDepense>0 ? totalRemb/totalDepense*100 : 0;
  const pctPlafond   = opcoEffectiveMax>0 ? totalRembCapped/opcoEffectiveMax*100 : 0;
  const monthlyTotals = MONTH_DATES.map(ym=>allRemb.filter(e=>getMonth(e)===ym).reduce((s,e)=>s+expenseEur(e),0));
  const monthlyOpco   = MONTH_DATES.map(ym=>{
    const moRemb = allRemb.filter(e=>getMonth(e)===ym);
    return CATS.reduce((s,c)=>{
      const p = getPlafond(c.id);
      const catTotal = moRemb.filter(e=>e.catId===c.id).reduce((t,e)=>t+expenseEur(e),0);
      return s + (p !== null ? Math.min(catTotal, p) : catTotal);
    }, 0);
  });
  const catRemb = CATS.filter(c=>getPlafond(c.id)!==null).map(c=>{
    const exps=rembExp.filter(e=>e.catId===c.id), total=exps.reduce((s,e)=>s+expenseEur(e),0);
    const plafond=getPlafond(c.id), quota=Math.min(total,plafond);
    return {c,total,plafond,quota,quotaRestant:plafond-quota};
  });

  // Mise à jour filtre chips (remb-filter-row) — visible uniquement en vue dépenses
  const filterRow = document.getElementById('remb-filter-row');
  if (filterRow) filterRow.style.display = rembSubView==='depenses' ? '' : 'none';
  if (filterRow && rembSubView==='depenses') {
    const filterCfg = [
      { id:'all',         label:'Tout',           color:'' },
      { id:'sans-justif', label:`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Sans justif${sansJustifCount?` (${sansJustifCount})`:''}`, color:'var(--red)' },
      { id:'soumettre',   label:'À soumettre',   color:'var(--orange)' },
      { id:'soumis',      label:'Soumis',        color:'var(--accent)' },
      { id:'non-soumis',  label:'Non soumis',    color:'var(--text2)'  },
      { id:'rembourse',   label:'Remboursé',     color:'var(--blue)'       },
      { id:'valide',      label:'Validé',        color:'var(--green)'  },
      { id:'refuse',      label:'Refusé',        color:'var(--red)'    },
    ];
    filterRow.innerHTML = filterCfg.map(f =>
      `<button class="filter-chip ${rembFilter===f.id?'active':''}"
        onclick="rembFilter='${f.id}';renderRemb()"
        style="display:inline-flex;align-items:center;gap:4px;${rembFilter===f.id&&f.color?`background:${f.color};border-color:${f.color}`:''}"
      >${f.label}</button>`
    ).join('');
  }

  // Sous-onglets
  const subTabs = `
  <div style="display:flex;background:var(--surface2);border-radius:12px;padding:3px;gap:3px;margin-top:12px;margin-bottom:4px">
    <button onclick="rembSubView='synthese';renderRemb()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border-radius:9px;border:none;cursor:pointer;font-size:13px;font-weight:800;transition:all .15s;
      background:${rembSubView==='synthese'?'var(--surface)':'transparent'};
      color:${rembSubView==='synthese'?'var(--accent)':'var(--text3)'};
      box-shadow:${rembSubView==='synthese'?'0 1px 4px rgba(0,0,0,.08)':'none'}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      Synthèse
    </button>
    <button onclick="rembSubView='depenses';renderRemb()" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border-radius:9px;border:none;cursor:pointer;font-size:13px;font-weight:800;transition:all .15s;
      background:${rembSubView==='depenses'?'var(--surface)':'transparent'};
      color:${rembSubView==='depenses'?'var(--accent)':'var(--text3)'};
      box-shadow:${rembSubView==='depenses'?'0 1px 4px rgba(0,0,0,.08)':'none'}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="2" fill="currentColor" stroke="none"/></svg>
      Dépenses
      ${sansJustifCount>0?`<span style="background:var(--red);color:#fff;font-size:10px;font-weight:900;padding:1px 6px;border-radius:20px">${sansJustifCount}</span>`:''}
    </button>
  </div>`;

  const body = document.getElementById('remb-body');

  if (rembSubView === 'synthese') {
    body.innerHTML = subTabs + `
    <div class="remb-summary" style="margin-top:8px">
      <div class="stat-card accent-bg">
        <div class="stat-label">${rembMo==='all'?'Total stage':'Ce mois'}</div>
        <div class="stat-value mono">${fmtEur(totalRemb,2)}</div>
        <div class="stat-small">Plafond: ${fmtEur(plafondTotal,0)}</div>
      </div>
      <div class="stat-card green-bg">
        <div class="stat-label">Avec reçu</div>
        <div class="stat-value mono">${fmtEur(avecRecu,2)}</div>
        <div class="stat-small">Sans reçu: ${fmtEur(sansRecu,2)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Proportion remboursable OPCO</div>
      <div class="prog-wrap">
        <div class="prog-header">
          <span class="prog-label">Remboursable / Total dépensé</span>
          <span class="prog-amount">${fmtEur(totalRemb,0)} / ${fmtEur(totalDepense,0)}</span>
        </div>
        <div class="prog-bar-bg"><div class="prog-bar" style="width:${Math.min(pctRemb,100).toFixed(1)}%;background:var(--accent)"></div></div>
        <div class="prog-sub"><span>${pctRemb.toFixed(0)}% de tes dépenses sont remboursables</span></div>
      </div>
      <div class="prog-wrap" style="margin-top:10px">
        <div class="prog-header">
          <span class="prog-label">Plafond OPCO utilisé</span>
          <span class="prog-amount">${fmtEur(totalRembCapped,0)} / ${fmtEur(opcoEffectiveMax,0)}</span>
        </div>
        <div class="prog-bar-bg"><div class="prog-bar" style="width:${Math.min(pctPlafond,100).toFixed(1)}%;background:${pctPlafond<70?'var(--green)':pctPlafond<90?'var(--orange)':'var(--red)'}"></div></div>
        <div class="prog-sub">
          <span>${pctPlafond.toFixed(0)}% du plafond de ${fmtEur(opcoEffectiveMax,0)} atteint${opcoEffectiveMax===OPCO_GLOBAL_MAX&&plafondTotal>OPCO_GLOBAL_MAX?' (max OPCO)':''}</span>
          <span style="font-weight:700;color:var(--green)">Récupérable : ${fmtEur(montantRecup,2)}</span>
        </div>
      </div>
    </div>

    ${rembMo==='all' ? `
    <div class="card">
      <div class="card-title">Récap par mois</div>
      <div style="display:flex;gap:10px;margin-bottom:10px">
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--text2)"><span style="width:10px;height:10px;border-radius:3px;background:var(--accent);opacity:0.3;display:inline-block"></span>Remboursable</span>
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--text2)"><span style="width:10px;height:10px;border-radius:3px;background:var(--green);display:inline-block"></span>Éligible OPCO</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${MONTH_DATES.map((ym,i)=>{
          const v=monthlyTotals[i], opco=monthlyOpco[i];
          const maxV=Math.max(...monthlyTotals,1);
          const pctV=(v/maxV*100).toFixed(1), pctOpco=(opco/maxV*100).toFixed(1);
          return `<div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
              <span style="font-size:13px;font-weight:700;color:var(--text)">${MONTH_LABELS[i]}</span>
              <span style="display:flex;gap:8px;align-items:center">
                <span style="font-size:12px;font-weight:700;font-family:var(--fm);color:var(--accent)">${v>0?fmtEur(v,2):'—'}</span>
                ${opco<v?`<span style="font-size:12px;font-weight:800;font-family:var(--fm);color:var(--green)">${fmtEur(opco,2)}</span>`:''}
              </span>
            </div>
            ${v>0?`<div class="prog-bar-bg" style="height:7px;position:relative">
              <div style="position:absolute;left:0;top:0;height:100%;width:${pctV}%;background:var(--accent);opacity:0.25;border-radius:99px"></div>
              <div style="position:absolute;left:0;top:0;height:100%;width:${pctOpco}%;background:var(--green);border-radius:99px"></div>
            </div>`:''}
          </div>`;
        }).join('')}
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border);margin-top:2px">
          <span style="font-size:13px;font-weight:800;color:var(--text)">Total stage</span>
          <span style="display:flex;gap:10px;align-items:center">
            <span style="font-size:13px;font-weight:800;font-family:var(--fm);color:var(--accent)">${fmtEur(monthlyTotals.reduce((s,v)=>s+v,0),2)}</span>
            <span style="font-size:13px;font-weight:900;font-family:var(--fm);color:var(--green)">${fmtEur(montantRecup,2)} OPCO</span>
          </span>
        </div>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-title">Détail par catégorie</div>
      ${catRemb.map(({c,total,plafond,quota,quotaRestant})=>`
        <div class="remb-row">
          <div class="remb-row-left">
            <div class="remb-row-name" style="display:flex;align-items:center;gap:6px">${catIconHtml(c.id,16)} ${c.lbl}</div>
            <div class="remb-row-sub">Dépensé: ${fmtEur(total,2)} · Plafond: ${fmtEur(plafond,0)}</div>
          </div>
          <div class="remb-row-right">
            <div class="remb-row-val">${fmtEur(quota,2)}</div>
            <div class="remb-row-quota" style="color:${quotaRestant>0?'var(--green)':'var(--text3)'}">Quota restant: ${fmtEur(quotaRestant,0)}</div>
          </div>
        </div>
      `).join('')}
    </div>`;

  } else {
    // ── Vue DÉPENSES ──
    const getStatus = e => {
      if (!e.rembStatus && e.rembDate) return 'soumis'; // rétrocompat
      return e.rembStatus || 'soumettre';
    };
    const matchFilter = e => {
      const s = getStatus(e);
      if (rembFilter==='all')         return true;
      if (rembFilter==='sans-justif') return !e.recu && !e.photo;
      return rembFilter === s;
    };
    const sorted     = rembExp.slice().sort((a,b)=>b.date.localeCompare(a.date)).filter(matchFilter);
    const pending    = sorted.filter(e=>getStatus(e)==='soumettre');
    const soumis     = sorted.filter(e=>getStatus(e)==='soumis');
    const nonSoumis  = sorted.filter(e=>getStatus(e)==='non-soumis');
    const valide     = sorted.filter(e=>getStatus(e)==='valide');
    const refuse     = sorted.filter(e=>getStatus(e)==='refuse');
    const rembourse  = sorted.filter(e=>getStatus(e)==='rembourse');

    function rembRow(e) {
      const eur = expenseEur(e);
      const STATUS_BADGES = {
        soumettre:   `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:var(--orange);background:rgba(245,158,11,0.12);padding:2px 7px;border-radius:20px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>À soumettre</span>`,
        soumis:      `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:#fff;background:var(--accent);padding:2px 7px;border-radius:20px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Soumis</span>`,
        'non-soumis':`<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:var(--text3);background:var(--surface2);padding:2px 7px;border-radius:20px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>Non soumis</span>`,
        valide:      `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:#fff;background:var(--green);padding:2px 7px;border-radius:20px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>Validé</span>`,
        refuse:      `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:#fff;background:var(--red);padding:2px 7px;border-radius:20px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Refusé</span>`,
        rembourse:   `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:#fff;background:var(--blue);padding:2px 7px;border-radius:20px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>Remboursé</span>`,
      };
      const statusBadge = STATUS_BADGES[getStatus(e)] || '';
      return `<div class="remb-row" onclick="openDetail('${e.id}')" style="cursor:pointer">
        <div class="remb-row-left">
          <div class="remb-row-name" style="display:flex;align-items:center;gap:6px">${catIconHtml(e.catId,16)} ${e.enseigne?`<span style="font-weight:800">${escHtml(e.enseigne)}</span>${e.desc?` · ${escHtml(e.desc)}`:''}`:escHtml(e.desc)||'Sans desc.'}</div>
          <div class="remb-row-sub" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${formatDate(e.date)}${statusBadge?` · ${statusBadge}`:''}
            ${e.recu
              ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--green)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>Reçu</span>`
              : `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:#fff;background:var(--red);padding:2px 7px;border-radius:20px;letter-spacing:0.2px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Sans reçu</span>`
            }
          </div>
        </div>
        <div class="remb-row-right">
          <div class="remb-row-val">${fmtEur(eur,2)}</div>
        </div>
      </div>`;
    }
    function section(title, color, list, emptyMsg) {
      if(list.length===0 && color!=='') return '';
      return `<div class="card">
        <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
          <span${color?` style="color:${color}"`:''}}>${title}</span>
          <span style="font-size:12px;color:var(--text3);font-weight:600">${list.length} dépense${list.length!==1?'s':''}</span>
        </div>
        ${list.length===0?`<div style="color:var(--text3);font-size:14px;text-align:center;padding:16px">${emptyMsg}</div>`:list.map(rembRow).join('')}
      </div>`;
    }

    const si = (path, w=13) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    const sTitle = (svg, label) => `<span style="display:inline-flex;align-items:center;gap:5px">${svg} ${label}</span>`;
    body.innerHTML = subTabs
      + section(sTitle(si('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'), 'À soumettre'), '', pending, 'Aucune à soumettre')
      + section(sTitle(si('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'), 'Soumis'), 'var(--accent)', soumis, '')
      + section(sTitle(si('<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'), 'Non soumis'), 'var(--text3)', nonSoumis, '')
      + section(sTitle(si('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'), 'Remboursé'), 'var(--blue)', rembourse, '')
      + section(sTitle(si('<polyline points="20 6 9 17 4 12"/>'), 'Validé'), 'var(--green)', valide, '')
      + section(sTitle(si('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'), 'Refusé'), 'var(--red)', refuse, '');
  }
}

// ══════════════════════════════════════════════
//  EXPORT / DOWNLOAD
// ══════════════════════════════════════════════
async function downloadAllPhotos() {
  const withPhoto = expenses.filter(e => e.remb && e.photo);
  if (!withPhoto.length) { toast('Aucun reçu à télécharger'); return; }
  toast(`Téléchargement de ${withPhoto.length} reçu${withPhoto.length>1?'s':''}…`);
  const sorted = withPhoto.slice().sort((a,b) => a.date.localeCompare(b.date));
  for (let i = 0; i < sorted.length; i++) {
    const e   = sorted[i];
    const cat = CATS.find(c => c.id === e.catId);
    const num = String(i + 1).padStart(2, '0');
    const label = (e.enseigne || cat?.lbl || e.catId).replace(/[^a-zA-Z0-9À-ÿ\-_]/g, '_').slice(0, 30);
    const eur  = expenseEur(e).toFixed(0);
    const filename = `${num}_${e.date}_${label}_${eur}EUR.jpg`;
    const dataUrl = await toJpeg(e.photo);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
    await new Promise(r => setTimeout(r, 300));
  }
  toast('✓ Tous les reçus téléchargés');
}

function exportRembExcel() {
  const rembExp = expenses.filter(e => e.remb);
  if (!rembExp.length) { toast('Aucune dépense remboursable'); return; }

  const sorted   = rembExp.slice().sort((a,b) => a.date.localeCompare(b.date));
  const totalTtc = sorted.reduce((s,e) => s + expenseTnd(e), 0);
  const totalEur = sorted.reduce((s,e) => s + expenseEur(e), 0);
  const rate     = settings.rate || 3.38;

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>Note de Frais LEEM</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; }
  td { padding: 5px 8px; }
  .hdr { font-weight: bold; background: #dce6f1; }
  .col-hdr { font-weight: bold; background: #1f3864; color: #fff; text-align: center; }
  .alt { background: #f2f7ff; }
  .total-row { font-weight: bold; background: #dce6f1; }
</style>
</head>
<body>
<table border="1" cellspacing="0" cellpadding="5"
  style="border-collapse:collapse;font-size:11px;width:100%">
  <tr>
    <td colspan="8" style="font-size:13px;font-weight:bold;text-align:center;background:#1f3864;color:#fff;padding:10px">
      FORMULAIRE NOTE DE FRAIS — MOBILITÉ INTERNATIONALE APPRENTIS
    </td>
  </tr>
  <tr>
    <td colspan="2" class="hdr">Campus :</td>
    <td colspan="2">Nanterre</td>
    <td colspan="2" class="hdr">ÉCOLE :</td>
    <td colspan="2"></td>
  </tr>
  <tr>
    <td colspan="2" class="hdr">Nom :</td>
    <td colspan="2"></td>
    <td colspan="2" class="hdr">Prénom :</td>
    <td colspan="2"></td>
  </tr>
  <tr>
    <td colspan="2" class="hdr">Promo :</td>
    <td colspan="2"></td>
    <td colspan="2" class="hdr">Taux de change =</td>
    <td colspan="2">${rate} TND/€</td>
  </tr>
  <tr><td colspan="8" style="padding:4px;border:none"></td></tr>
  <tr>
    <td class="col-hdr" style="width:80px">DATE</td>
    <td class="col-hdr" style="width:120px">TYPE DE DÉPENSE</td>
    <td class="col-hdr" style="width:160px">ENSEIGNE / LIEU</td>
    <td class="col-hdr" style="width:100px">MONTANT TTC (devises)</td>
    <td class="col-hdr" style="width:90px">MONTANT EN EUROS</td>
    <td class="col-hdr" style="width:40px">N° JUSTIF.</td>
    <td class="col-hdr" style="width:130px">NOM DU JUSTIFICATIF</td>
    <td class="col-hdr" style="width:120px">JUSTIFICATIF</td>
  </tr>
  ${sorted.map((e,i) => `<tr class="${i%2===1?'alt':''}">
    <td style="white-space:nowrap;text-align:center">${e.date}</td>
    <td>${CAT_MAP[e.catId]?.lbl || e.catId}</td>
    <td>${e.enseigne ? escHtml(e.enseigne) : ''}${e.desc ? ' — '+escHtml(e.desc) : ''}</td>
    <td style="text-align:right;font-family:monospace">${Number(e.amount).toFixed(2)} ${e.currency || 'EUR'}</td>
    <td style="text-align:right;font-family:monospace;font-weight:bold">${expenseEur(e).toFixed(2)} €</td>
    <td style="text-align:center">${i+1}</td>
    <td style="font-size:10px;color:#444">${e.recuName ? escHtml(e.recuName) : ''}</td>
    <td style="text-align:center;padding:2px">${e.photo
      ? `<img src="${e.photo}" style="max-width:110px;max-height:80px;display:block;margin:auto">`
      : '<span style="color:#ccc;font-size:10px">—</span>'
    }</td>
  </tr>`).join('')}
  <tr class="total-row">
    <td colspan="3" style="text-align:right;font-weight:bold">TOTAL</td>
    <td style="text-align:right;font-family:monospace">${totalTtc.toFixed(2)}</td>
    <td style="text-align:right;font-family:monospace;font-weight:bold">${totalEur.toFixed(2)} €</td>
    <td colspan="3"></td>
  </tr>
  <tr><td colspan="8" style="padding:8px;border:none"></td></tr>
  <tr>
    <td colspan="8" style="font-size:10px;font-style:italic;color:#555;padding:6px 8px;background:#fffbe6;border:1px solid #e6d88a">
      Joindre impérativement les tickets de caisse correspondants.
    </td>
  </tr>
  <tr>
    <td colspan="8" style="font-size:10px;color:#444;padding:8px;line-height:1.5">
      Je certifie sur l'honneur l'exactitude de tous les renseignements portés sur la présente note de frais,
      sachant que toute erreur ou omission dans ces renseignements peut entraîner le rejet de la demande
      ou le retrait de l'aide.
    </td>
  </tr>
  <tr>
    <td colspan="3" style="padding:12px 8px">Date :</td>
    <td colspan="5" style="padding:12px 8px">Nom Prénom, signature :</td>
  </tr>
</table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `note_de_frais_leem_${new Date().toISOString().slice(0,10)}.xls`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  toast(`Note de frais exportée — ${sorted.length} dépenses ✓`);
}
