'use strict';
// ══════════════════════════════════════════════
//  RENDER: SETTINGS
// ══════════════════════════════════════════════
function renderSettings() {
  const body = document.getElementById('settings-body');
  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  const hasPin = !!localStorage.getItem('mi_pin');
  const gistOk = !!settings.githubPAT;

  // ── helpers visuels ───────────────────────────────────────
  // Ligne expandable dans un groupe
  function row(key, iconBg, iconEm, title, valueTxt, bodyHtml, defaultOpen) {
    const open = settingsOpen[key] !== undefined ? settingsOpen[key] : defaultOpen;
    return `<div>
      <button type="button" onclick="settingsOpen['${key}']=!settingsOpen['${key}'];renderSettings()"
        style="width:100%;display:flex;align-items:center;gap:12px;padding:13px 16px;background:none;border:none;cursor:pointer;text-align:left">
        <div style="width:36px;height:36px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0">${iconEm}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;color:var(--text)">${title}</div>
          ${valueTxt&&!open?`<div style="font-size:12px;color:var(--text3);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${valueTxt}</div>`:''}
        </div>
        <span style="font-size:18px;color:var(--text3);font-weight:300;flex-shrink:0;line-height:1">${open?'⌃':'›'}</span>
      </button>
      ${open?`<div style="padding:0 16px 16px;border-top:1px solid var(--border)">${bodyHtml}</div>`:''}
    </div>`;
  }
  // Ligne directe (pas d'expand, action inline)
  function rowDirect(iconBg, iconEm, title, rightHtml) {
    return `<div style="display:flex;align-items:center;gap:12px;padding:13px 16px">
      <div style="width:36px;height:36px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0">${iconEm}</div>
      <div style="flex:1"><div style="font-size:14px;font-weight:700;color:var(--text)">${title}</div></div>
      ${rightHtml}
    </div>`;
  }
  // Groupe de lignes dans une carte arrondie
  function group(label, rows) {
    const sep = `<div style="height:1px;background:var(--border);margin-left:64px"></div>`;
    return `<div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.7px;text-transform:uppercase;padding:20px 4px 8px">${label}</div>
    <div style="background:var(--surface);border-radius:18px;overflow:hidden;box-shadow:var(--shadow)">
      ${rows.join(sep)}
    </div>`;
  }

  // ── palette partagée catégories ───────────────────────────
  const CAT_PALETTE = [
    '#f0a0b8','#ff6b6b','#ee5a24','#fd79a8',
    '#f0b080','#feca57','#e17055','#fdcb6e',
    '#78d4a0','#55efc4','#00b894','#a8d870',
    '#84c0f0','#0984e3','#74b9ff','#6cd0e8',
    '#b098f4','#a29bfe','#6c5ce7','#e84393',
    '#f4a060','#c0b8e4','#a8b8cc','#74d898',
    '#e8c040','#68cca0','#f098bc','#8e98f0',
    '#ff9f43','#48dbfb','#ff9ff3','#54a0ff',
  ];
  const customIds = new Set((settings.customCats||[]).map(c=>c.id));

  function catEditForm(c, isNew) {
    const cc = c.color||'';
    return `<div style="background:var(--surface2);border-radius:14px;padding:12px;margin-bottom:8px">
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <input class="form-input" id="ce-em-${c.id}" value="${c.em||''}" maxlength="3" placeholder="🏠" style="width:52px;text-align:center;font-size:20px;flex-shrink:0;padding:6px 4px">
        <input class="form-input" id="ce-lbl-${c.id}" value="${escHtml(c.lbl||'')}" placeholder="Nom…" style="flex:1">
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;align-items:center" id="ce-sw-${c.id}">
        ${CAT_PALETTE.map(col=>`<button type="button" onclick="(function(b,v){document.querySelectorAll('#ce-sw-${c.id} .cs').forEach(x=>x.style.outline='none');b.style.outline='3px solid var(--accent)';document.getElementById('ce-color-${c.id}').value=v;var hi=document.getElementById('ce-hex-${c.id}');if(hi)hi.value=v;var pr=document.getElementById('ce-prev-${c.id}');if(pr)pr.style.background=v;})(this,'${col}')" class="cs" style="width:24px;height:24px;border-radius:50%;border:none;background:${col};cursor:pointer;outline:${cc===col?'3px solid var(--accent)':'none'};flex-shrink:0"></button>`).join('')}
        <input type="color" id="ce-picker-${c.id}" value="${cc||'#84c0f0'}" onchange="(function(v){document.getElementById('ce-color-${c.id}').value=v;document.querySelectorAll('#ce-sw-${c.id} .cs').forEach(x=>x.style.outline='none');var hi=document.getElementById('ce-hex-${c.id}');if(hi)hi.value=v;var pr=document.getElementById('ce-prev-${c.id}');if(pr)pr.style.background=v;})(this.value)" style="width:24px;height:24px;border-radius:50%;border:2px solid var(--border);padding:0;cursor:pointer;flex-shrink:0;overflow:hidden" title="Sélecteur visuel">
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div id="ce-prev-${c.id}" style="width:28px;height:28px;border-radius:50%;background:${cc||'var(--border)'};border:2px solid var(--border);flex-shrink:0"></div>
        <input type="text" id="ce-hex-${c.id}" value="${cc}" placeholder="#84c0f0" maxlength="7"
          style="flex:1;font-family:var(--fm);font-size:13px;padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);outline:none"
          oninput="applyCatHex('${c.id}',this.value)"
          onblur="applyCatHex('${c.id}',this.value,true)">
      </div>
      <input type="hidden" id="ce-color-${c.id}" value="${cc}">
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button type="button" onclick="${isNew?'saveNewCat()':'saveCatSettings(\''+c.id+'\')'}" style="flex:1;min-width:80px;padding:8px;border-radius:10px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer">Enregistrer</button>
        <button type="button" onclick="catSettingsEditId=null;renderSettings()" style="padding:8px 12px;border-radius:10px;border:1.5px solid var(--border);background:none;color:var(--text2);font-size:13px;cursor:pointer">Annuler</button>
        ${isNew?'':customIds.has(c.id)
          ?`<button type="button" onclick="deleteCustomCat('${c.id}')" style="padding:8px 10px;border-radius:10px;border:none;background:none;color:var(--red);font-size:13px;font-weight:700;cursor:pointer">✕ Suppr.</button>`
          :`<button type="button" onclick="resetCatOverride('${c.id}')" style="padding:8px 10px;border-radius:10px;border:none;background:none;color:var(--text3);font-size:12px;cursor:pointer">↩ Défaut</button>`}
      </div>
    </div>`;
  }

  // ── contenus des sections ─────────────────────────────────
  const gistBody = `
    <div class="card" style="margin-bottom:0">
      <div id="gist-status" class="gist-status-badge ${gistOk?(_syncState==='synced'?'synced':'idle'):'idle'}" style="margin-bottom:10px">
        ${gistOk?(_syncState==='synced'?'✓ Sauvegardé sur Gist':'● Connecté'):'○ Non configuré'}
      </div>
      <button onclick="_gistInfoOpen=!_gistInfoOpen;renderSettings()" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--text2);background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;margin-bottom:10px;cursor:pointer">
        <span>${_gistInfoOpen?'▲':'▼'}</span> Instructions
      </button>
      ${_gistInfoOpen?`<div class="gist-info-box" style="margin-bottom:10px">
        Sauvegarde <strong>auto</strong> 4 s après chaque modif.<br>
        <strong>Nouvel appareil</strong> : colle ton token → <em>Connecter</em>.<br><br>
        <strong>1.</strong> github.com → avatar → <strong>Settings → Developer settings → Personal access tokens → Tokens (classic)</strong><br>
        <strong>2.</strong> <em>Generate new token (classic)</em> · coche <strong><code>gist</code></strong><br>
        <strong>3.</strong> Copie le token (<code>ghp_…</code>)
      </div>`:''}
      <div class="form-group" style="margin-bottom:10px">
        <label class="form-label">Token GitHub</label>
        <div class="pat-input-wrap">
          <input class="form-input" type="password" id="s-pat" value="${settings.githubPAT||''}" placeholder="ghp_…" autocomplete="off" autocorrect="off" spellcheck="false">
          <button class="pat-toggle" type="button" onclick="const i=document.getElementById('s-pat');i.type=i.type==='password'?'text':'password';this.textContent=i.type==='password'?'👁':'🙈'">👁</button>
        </div>
      </div>
      <div class="btn-row" style="margin-bottom:8px">
        <button class="btn btn-accent" onclick="savePAT()" style="min-height:44px">Connecter</button>
        <button class="btn btn-outline" onclick="syncToGist()" style="min-height:44px" ${gistOk?'':'disabled'}>Sauvegarder</button>
      </div>
      <div class="btn-row" style="margin-bottom:10px">
        <button class="btn btn-outline" onclick="loadFromGist()" style="min-height:44px" ${settings.githubGistId?'':'disabled'}>Charger depuis Gist</button>
        ${gistOk?`<button class="btn" style="min-height:44px;color:var(--text3);border:1px solid var(--border)" onclick="disconnectGist()">Déconnecter</button>`:''}
      </div>
      <label class="form-label" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span>Gist ID</span>
        ${settings.githubGistId?`<a href="https://gist.github.com/${settings.githubGistId}" target="_blank" rel="noopener" style="font-size:11px;color:var(--accent);text-decoration:none">Voir ↗</a>`:''}
      </label>
      <div style="display:flex;gap:6px">
        <input type="text" id="s-gist-id" value="${settings.githubGistId||''}" placeholder="ex: 4a3b2c1d…" autocomplete="off" spellcheck="false" style="flex:1;font-family:var(--fm);font-size:11px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);outline:none;min-width:0">
        <button onclick="saveGistId()" style="flex-shrink:0;padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);font-size:12px;font-weight:700;cursor:pointer">OK</button>
      </div>
    </div>`;

  const pinBody = `<div class="card" style="margin-bottom:0">
    ${hasPin?`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>
        <span style="font-size:13px;font-weight:700;color:var(--green)">Code PIN activé</span>
      </div>
      <div class="btn-row">
        <button class="btn btn-outline" style="flex:1;min-height:44px" onclick="changePin()">Changer</button>
        <button class="btn" style="flex:1;min-height:44px;color:var(--red);border:1px solid var(--border)" onclick="disablePin()">Désactiver</button>
      </div>`:`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--border)"></div>
        <span style="font-size:13px;font-weight:700;color:var(--text3)">Aucun code configuré</span>
      </div>
      <button class="btn btn-accent" style="min-height:44px;width:100%" onclick="setupPin()">Activer un code PIN</button>`}
  </div>`;

  const tauxBody = `<div class="card" style="margin-bottom:0">
    <div class="form-group" style="margin-bottom:10px">
      <label class="form-label">1 EUR = ? TND</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input class="form-input" type="number" id="s-rate" value="${settings.rate}" step="0.01" min="1" style="flex:1">
        <button onclick="fetchRate()" id="btn-fetch-rate" style="flex-shrink:0;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface2);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">↻ Actuel</button>
      </div>
      <div id="rate-info" style="font-size:11px;color:var(--text3);margin-top:4px"></div>
    </div>
    <button class="btn btn-accent" onclick="saveRate()" style="min-height:44px">Sauvegarder</button>
  </div>`;

  const budgetGlobalBody = `<div class="card" style="margin-bottom:0">
    <div class="stat-grid" style="margin-bottom:10px">
      <div class="stat-card accent-bg">
        <div class="stat-label">Budget Mai</div>
        <div class="stat-value mono">${fmtEur(computeBudgetPrepa(),0)}</div>
        <div class="stat-small">Transport + Achats prépa</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Mensuel (×3)</div>
        <div class="stat-value mono">${fmtEur(computeBudgetMensuel(),0)}</div>
        <div class="stat-small">Juin · Juillet · Août</div>
      </div>
    </div>
    <div class="stat-card green-bg" style="margin-bottom:0">
      <div class="stat-label">Budget total stage</div>
      <div class="stat-value mono" style="font-size:24px">${fmtEur(computeBudgetTotal(),0)}</div>
    </div>
  </div>`;

  const catsBody = (()=>{
    const rows = getCats().map(c => {
      if (catSettingsEditId === c.id) return catEditForm(c, false);
      const col = catColor(c.id);
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="flex:1;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:3px 9px;border-radius:20px;background:${col.bg};color:${col.text};overflow:hidden">
          ${c.em||icon(c.ic||'divers',13,col.text)} <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(c.lbl)}</span>
          ${customIds.has(c.id)?'<span style="font-size:9px;opacity:.6">perso</span>':''}
        </span>
        <button type="button" onclick="catSettingsEditId='${c.id}';renderSettings()" style="padding:4px 8px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--text2);font-size:13px;cursor:pointer;flex-shrink:0">✎</button>
      </div>`;
    }).join('');
    const newForm = catSettingsEditId==='__new__' ? catEditForm({id:'__new__',lbl:'',em:'',color:''}, true) : '';
    return `<div class="card" style="margin-bottom:0;padding-bottom:8px">${rows}${newForm}
      <div style="display:flex;gap:8px;margin-top:10px">
        <button type="button" onclick="catSettingsEditId='__new__';renderSettings()" style="flex:1;padding:10px;border-radius:12px;border:2px dashed var(--border);background:none;color:var(--text3);font-size:13px;font-weight:700;cursor:pointer">+ Ajouter</button>
        <button type="button" onclick="resetAllCats()" style="padding:10px 12px;border-radius:12px;border:1.5px solid var(--border);background:none;color:var(--text3);font-size:12px;font-weight:700;cursor:pointer" title="Remettre toutes les catégories par défaut">↩ Tout défaut</button>
      </div>
    </div>`;
  })();

  const budgetsCatBody = `<div class="card" style="margin-bottom:0;padding:0 0 8px;overflow:hidden">
    <div style="overflow-x:auto">
      <table class="budget-table">
        <thead><tr>
          <th style="padding:10px 10px 6px">Catégorie</th>
          <th>Budget €</th><th>Plafond OPCO €</th>
        </tr></thead>
        <tbody>
          ${getCats().map(c=>{
            const b=getBudget(c.id), p=getPlafond(c.id), col=catColor(c.id);
            return `<tr>
              <td style="padding:6px 10px;border:none;background:none">
                <span style="background:${col.bg};color:${col.text};padding:2px 7px;border-radius:20px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px">${icon(c.ic||'divers',11,col.text)} ${c.lbl}</span>
              </td>
              <td style="border:none;background:none;text-align:right"><input class="budget-input" type="number" min="0" id="b-budget-${c.id}" value="${b}" placeholder="—"></td>
              <td style="border:none;background:none;text-align:right"><input class="budget-input" type="number" min="0" id="b-plafond-${c.id}" value="${p!==null?p:''}" placeholder="—"></td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot><tr>
          <td style="padding:6px 10px;font-size:12px;font-weight:900;border:none;background:none">Total</td>
          <td style="border:none;background:none;text-align:right;font-size:12px;font-weight:900;font-family:var(--fm);color:var(--accent)">${fmtEur(getCats().reduce((s,c)=>s+getBudget(c.id),0),0)}</td>
          <td style="border:none;background:none;text-align:right;font-size:12px;font-weight:900;font-family:var(--fm);color:var(--green)">${fmtEur(getCats().reduce((s,c)=>{const p=getPlafond(c.id);return s+(p||0);},0),0)} <span style="font-size:10px;color:var(--text3)">/ ${fmtEur(OPCO_GLOBAL_MAX,0)}</span></td>
        </tr></tfoot>
      </table>
    </div>
    <div style="padding:8px 10px 2px;display:flex;gap:8px">
      <button class="btn btn-accent" onclick="saveBudgets()" style="min-height:40px">💾 Sauvegarder</button>
      <button class="btn btn-outline" onclick="resetBudgets()" style="min-height:40px">↩ Défaut</button>
    </div>
  </div>`;

  const payBody = `<div class="card" style="margin-bottom:0;padding-bottom:8px">
    <div id="pay-methods-list"></div>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn btn-outline" onclick="addPayMethod()" style="min-height:40px">+ Ajouter</button>
      <button class="btn btn-accent" onclick="savePayMethods()" style="min-height:40px">💾 Sauvegarder</button>
    </div>
    <p style="font-size:11px;color:var(--text3);margin-top:6px">💳 Carte · 💵 Espèces · 🔄 Virement · 📱 Mobile</p>
  </div>`;

  const exportBody = `<div class="card" style="margin-bottom:0">
    <div class="btn-row" style="margin-bottom:8px">
      <button class="btn btn-accent" onclick="exportData()">Exporter JSON</button>
      <button class="btn btn-outline" onclick="shareData()">Partager</button>
    </div>
    <button class="btn btn-outline" onclick="document.getElementById('import-input').click()">Importer JSON</button>
    <input type="file" id="import-input" accept="application/json,.json" style="display:none" onchange="importData(event)">
  </div>`;

  const storageBody = `<div class="card" id="storage-info-card" style="margin-bottom:0">
    <div style="font-size:13px;color:var(--text3)">Calcul en cours…</div>
  </div>`;


  // ── assemblage ────────────────────────────────────────────
  const gistStatus = gistOk ? (_syncState==='synced' ? '✓ Synchronisé' : '● Connecté') : 'Non configuré';
  const gistColor  = gistOk ? (_syncState==='synced' ? 'var(--green)' : 'var(--accent)') : 'var(--text3)';

  body.innerHTML = `<div style="padding-top:8px">

    <!-- Statut sync rapide -->
    <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:14px;padding:10px 14px;margin-bottom:4px;box-shadow:var(--shadow)">
      <div style="display:flex;align-items:center;gap:8px">
        <div id="gist-status" class="gist-status-badge ${gistOk?(_syncState==='synced'?'synced':'idle'):'idle'}">${gistOk?(_syncState==='synced'?'✓ Sauvegardé':'● Connecté'):'○ Non configuré'}</div>
      </div>
      <div style="display:flex;gap:6px">
        ${gistOk?`<button onclick="syncToGist()" style="padding:5px 12px;border-radius:8px;border:1.5px solid var(--accent);background:var(--accent-pale);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer">↑ Sync</button>`:''}
        <button onclick="settingsOpen['gist']=!settingsOpen['gist'];renderSettings()" style="padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--text3);font-size:12px;font-weight:700;cursor:pointer">⚙️</button>
      </div>
    </div>

    <!-- SYNCHRO & SAUVEGARDE -->
    ${group('Synchro & sauvegarde', [
      row('gist',    'var(--blue-pale)',   '☁️', 'Sauvegarde Gist',    gistStatus,                                     gistBody,        !gistOk),
      row('export',  'var(--green-pale)',  '📦', 'Export / Import',    '',                                             exportBody,      false),
      row('storage', 'var(--surface2)',    '💾', 'Stockage',           '',                                             storageBody,     false),
    ])}

    <!-- BUDGET & CATÉGORIES -->
    ${group('Budget & catégories', [
      row('cats',         'var(--accent-pale)',  '🏷️', 'Catégories',          getCats().length+' catégories',                        catsBody,         false),
      row('budgets',      'var(--green-pale)',   '💰', 'Budgets détaillés',   fmtEur(getCats().reduce((s,c)=>s+getBudget(c.id),0),0), budgetsCatBody,   false),
      row('budgetGlobal', 'var(--accent-pale)',  '🎯', 'Budget total stage',  fmtEur(computeBudgetTotal(),0),                        budgetGlobalBody, false),
    ])}

    <!-- PAIEMENTS & TAUX -->
    ${group('Paiements & taux', [
      row('pay',  'var(--blue-pale)',   '💳', 'Moyens de paiement', getPayMethods().length+' configurés',   payBody,  false),
      row('taux', 'var(--orange-pale)', '💱', 'Taux de change',     `1 € = ${settings.rate} TND`,           tauxBody, false),
    ])}

    <!-- SÉCURITÉ & APPARENCE -->
    ${group('Sécurité & apparence', [
      row('pin', hasPin?'var(--green-pale)':'var(--red-pale)', '🔒',
          'Code PIN', hasPin?'Activé ✓':'Non configuré', pinBody, false),
      rowDirect('var(--surface2)', isDark?'🌙':'☀️', 'Mode sombre',
        `<button class="theme-toggle-btn ${isDark?'dark':''}" onclick="toggleTheme();renderSettings()" style="flex-shrink:0">${isDark?'Activé':'Désactivé'}</button>`),
    ])}

    <!-- Danger + footer -->
    <div style="margin-top:24px;padding:0 4px">
      <button class="btn btn-red" onclick="confirmReset()" style="width:100%;min-height:44px">
        🗑️ Effacer toutes les dépenses
      </button>
    </div>
    <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;padding:0 4px">
      <span style="font-size:11px;color:var(--text3);font-family:var(--fm)">MI Dépenses ${APP_VERSION}</span>
      <button class="btn btn-outline btn-sm" style="font-size:12px;padding:7px 14px" onclick="forceUpdate()">↻ Mettre à jour</button>
    </div>
    <div style="height:20px"></div>
  </div>`;

  if (settingsOpen['pay']) renderPayMethodsList();
  if (settingsOpen['storage']) updateStorageInfo();
}

async function updateStorageInfo() {
  const el = document.getElementById('storage-info-card');
  if (!el) return;
  try {
    const photoCount = expenses.filter(e => e.photo).length;
    let usedBytes = 0, quotaBytes = 0;
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      usedBytes  = est.usage  || 0;
      quotaBytes = est.quota  || 0;
    }
    // localStorage fallback estimate
    let lsBytes = 0;
    for (const k of Object.keys(localStorage)) {
      lsBytes += (localStorage.getItem(k)?.length || 0) * 2;
    }
    const usedMB  = usedBytes  ? (usedBytes  / 1048576).toFixed(1) : null;
    const quotaMB = quotaBytes ? (quotaBytes / 1048576 / 1024).toFixed(1) : null;
    const lsMB    = (lsBytes / 1048576).toFixed(2);
    const pct     = quotaBytes ? Math.min(100, Math.round(usedBytes / quotaBytes * 100)) : null;
    const barColor = pct > 80 ? 'var(--red)' : pct > 50 ? '#f59e0b' : 'var(--accent)';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
        <span style="color:var(--text2);font-weight:700">Photos enregistrées</span>
        <span style="font-weight:800;color:var(--accent)">${photoCount} reçu${photoCount!==1?'s':''}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
        <span style="color:var(--text2);font-weight:700">Données texte (localStorage)</span>
        <span style="font-weight:700;color:var(--text)">${lsMB} Mo</span>
      </div>
      ${usedMB ? `
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
        <span style="color:var(--text2);font-weight:700">Total app sur l'appareil</span>
        <span style="font-weight:700;color:var(--text)">${usedMB} Mo${quotaMB ? ` / ${quotaMB} Go dispo` : ''}</span>
      </div>
      <div style="background:var(--border);border-radius:99px;height:8px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${barColor};border-radius:99px;transition:width 0.4s"></div>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px;text-align:right">${pct}% utilisé</div>
      ` : ''}
      <div style="font-size:11px;color:var(--text3);margin-top:8px">📦 Les photos sont stockées dans IndexedDB (espace séparé, beaucoup plus large que le localStorage).</div>
    `;
    if (pct > 80) toast('⚠️ Stockage à ' + pct + '% — pense à exporter tes données');
  } catch(e) {
    el.innerHTML = `<div style="font-size:13px;color:var(--text3)">Impossible de lire le stockage.</div>`;
  }
}

// ══════════════════════════════════════════════
//  SETTINGS ACTIONS
// ══════════════════════════════════════════════
async function savePAT() {
  const pat = (document.getElementById('s-pat')?.value || '').trim();
  if (!pat) { toast('Token vide'); return; }
  if (!pat.startsWith('ghp_') && !pat.startsWith('github_pat_')) {
    if (!confirm('Ce token ne ressemble pas à un token GitHub classique (ghp_…). Continuer quand même ?')) return;
  }
  settings.githubPAT = pat;
  settings.githubGistId = settings.githubGistId || '';
  localStorage.setItem('mi_settings', JSON.stringify(settings));
  renderSettings();

  if (settings.githubGistId) {
    // Gist ID déjà connu → synchro directe
    toast('Token sauvegardé — synchronisation…');
    syncToGist();
  } else {
    // Pas de Gist ID → chercher un Gist existant chez cet utilisateur
    toast('Recherche d\'un Gist existant…');
    setSyncState('syncing');
    try {
      const resp = await fetch('https://api.github.com/gists?per_page=100', {
        headers: gistHeaders(),
      });
      if (resp.status === 401) { setSyncState('error'); toast('Token invalide'); return; }
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const gists = await resp.json();
      const found = gists.find(g => g.files && g.files['mi-depenses.json']);
      if (found) {
        settings.githubGistId = found.id;
        localStorage.setItem('mi_settings', JSON.stringify(settings));
        renderSettings();
        setSyncState('idle');
        toast('Gist trouvé ! Chargement des données…');
        loadFromGist();
      } else {
        setSyncState('idle');
        toast('Aucun Gist existant — la première sauvegarde en créera un.');
      }
    } catch(e) {
      setSyncState('error');
      toast('Erreur recherche Gist : ' + e.message);
    }
  }
}

async function fetchRate() {
  const btn = document.getElementById('btn-fetch-rate');
  const info = document.getElementById('rate-info');
  if(btn) btn.textContent = '…';
  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/EUR');
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const rate = data.rates?.TND;
    if(!rate) throw new Error('TND introuvable');
    document.getElementById('s-rate').value = rate.toFixed(4);
    if(info) info.textContent = `Taux en temps réel : 1 € = ${rate.toFixed(4)} TND`;
    toast(`Taux récupéré : 1 € = ${rate.toFixed(4)} TND`);
  } catch(e) {
    toast('Impossible de récupérer le taux : ' + e.message);
    if(info) info.textContent = 'Erreur — vérifie ta connexion';
  } finally {
    if(btn) btn.textContent = '↻ Actuel';
  }
}

function saveRate() {
  const v = parseFloat(document.getElementById('s-rate').value);
  if(isNaN(v)||v<=0) return toast('Taux invalide');
  settings.rate = v;
  save();
  toast('Taux sauvegardé : 1€ = '+v+' TND');
}

function saveBudgetGlobal() {
  const total   = parseFloat(document.getElementById('s-budget-total')?.value);
  const prepa   = parseFloat(document.getElementById('s-budget-prepa')?.value);
  const mensuel = parseFloat(document.getElementById('s-budget-mensuel')?.value);
  if (isNaN(total) || isNaN(prepa) || isNaN(mensuel) || total <= 0 || prepa <= 0 || mensuel <= 0) {
    toast('Valeurs invalides'); return;
  }
  settings.budgetTotal   = total;
  settings.budgetPrepa   = prepa;
  settings.budgetMensuel = mensuel;
  save(); renderDash();
  toast('Budgets globaux sauvegardés ✓');
}

function saveBudgets() {
  getCats().forEach(c=>{
    const bEl = document.getElementById('b-budget-'+c.id);
    const pEl = document.getElementById('b-plafond-'+c.id);
    if(!settings.budgets[c.id]) settings.budgets[c.id] = {};
    if(bEl) settings.budgets[c.id].budget = bEl.value!=='' ? parseFloat(bEl.value)||0 : undefined;
    if(pEl) settings.budgets[c.id].plafond = pEl.value!=='' ? parseFloat(pEl.value)||null : null;
  });
  save();
  renderDash();
  renderSettings();
  toast('Budgets sauvegardés !');
}

function resetBudgets() {
  if(!confirm('Réinitialiser tous les budgets aux valeurs par défaut ?')) return;
  settings.budgets = {};
  save();
  renderSettings();
  toast('Budgets réinitialisés');
}

function exportData() {
  const blob = new Blob([JSON.stringify({expenses, settings}, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `mi-depenses-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
}

async function shareData() {
  const json = JSON.stringify({expenses, settings}, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const file = new File([blob], `mi-depenses-${new Date().toISOString().slice(0,10)}.json`, {type:'application/json'});
  if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
    try { await navigator.share({files:[file], title:'MI Dépenses', text:'Export de mes dépenses'}); return; } catch(e){}
  }
  // fallback: copy JSON to clipboard
  try {
    await navigator.clipboard.writeText(json);
    toast('JSON copié dans le presse-papier !');
  } catch(e) {
    toast('Partage non disponible sur ce navigateur');
  }
}

function importData(ev) {
  const f = ev.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if(data.expenses) expenses = data.expenses;
      if(data.settings) settings = Object.assign({rate:3.38,budgets:{}}, data.settings);
      save(); render();
      toast('Import réussi : '+expenses.length+' dépenses');
    } catch(err) { toast('Fichier invalide'); }
  };
  reader.readAsText(f);
  ev.target.value = '';
}

function confirmReset() {
  if(!confirm('Supprimer TOUTES les dépenses ? Cette action est irréversible.')) return;
  clearAllPhotosIDB().catch(console.warn);
  expenses = [];
  save(); render();
  toast('Toutes les dépenses supprimées');
}

// ── Champ hex couleur catégorie ─────────────────
function applyCatHex(id, raw, commit) {
  let val = raw.trim();
  if (!val.startsWith('#')) val = '#' + val;
  const hidden  = document.getElementById('ce-color-' + id);
  const preview = document.getElementById('ce-prev-' + id);
  const picker  = document.getElementById('ce-picker-' + id);
  const valid   = /^#[0-9a-fA-F]{6}$/.test(val);
  if (hidden)  hidden.value = valid ? val : (raw.trim() ? raw.trim() : '');
  if (preview) preview.style.background = valid ? val : 'var(--border)';
  if (valid && picker) picker.value = val;
  // En mode commit (onblur) : auto-corriger le champ texte
  if (commit) {
    const hi = document.getElementById('ce-hex-' + id);
    if (hi && valid) hi.value = val;
  }
}

// ── Gestion catégories ──────────────────────────
function saveCatSettings(id) {
  const lbl   = document.getElementById(`ce-lbl-${id}`)?.value?.trim();
  const em    = document.getElementById(`ce-em-${id}`)?.value?.trim();
  const color = document.getElementById(`ce-color-${id}`)?.value?.trim() || '';
  if (!lbl) { toast('Nom requis'); return; }
  const customIdx = (settings.customCats||[]).findIndex(c=>c.id===id);
  if (customIdx >= 0) {
    settings.customCats[customIdx] = Object.assign({}, settings.customCats[customIdx], {lbl, em: em||settings.customCats[customIdx].em, color: color||undefined});
  } else {
    if (!settings.catOverrides) settings.catOverrides = {};
    settings.catOverrides[id] = Object.assign({}, settings.catOverrides[id]||{}, {lbl, em: em||undefined});
    if (color) settings.catOverrides[id].color = color; else delete settings.catOverrides[id].color;
  }
  catSettingsEditId = null;
  save(); renderSettings();
  toast('Catégorie mise à jour ✓');
}

function saveNewCat() {
  const lbl   = document.getElementById('ce-lbl-__new__')?.value?.trim();
  const em    = document.getElementById('ce-em-__new__')?.value?.trim();
  const color = document.getElementById('ce-color-__new__')?.value?.trim() || '#84c0f0';
  if (!lbl) { toast('Nom requis'); return; }
  if (!settings.customCats) settings.customCats = [];
  settings.customCats.push({id:uid(), lbl, em:em||'📦', color, type:'mensuel', budget:0, plafond:null});
  catSettingsEditId = null;
  save(); renderSettings();
  toast('Catégorie ajoutée ✓');
}

function deleteCustomCat(id) {
  if (!confirm('Supprimer cette catégorie ?')) return;
  settings.customCats = (settings.customCats||[]).filter(c=>c.id!==id);
  expenses.forEach(e=>{ if(e.catId===id) e.catId='divers'; });
  catSettingsEditId = null;
  save(); renderSettings();
  toast('Catégorie supprimée');
}

function resetCatOverride(id) {
  if (!confirm('Réinitialiser cette catégorie aux valeurs par défaut ?')) return;
  if (settings.catOverrides) delete settings.catOverrides[id];
  catSettingsEditId = null;
  save(); renderSettings();
  toast('Réinitialisé');
}

function resetAllCats() {
  if (!confirm('Remettre TOUTES les catégories à leurs valeurs par défaut ?\nLes catégories personnalisées seront supprimées.')) return;
  settings.catOverrides = {};
  settings.customCats   = [];
  // Dépenses liées aux catégories supprimées → remapper sur 'divers'
  const validIds = new Set(CATS.map(c => c.id));
  expenses.forEach(e => { if (!validIds.has(e.catId)) e.catId = 'divers'; });
  catSettingsEditId = null;
  save(); render(); renderSettings();
  toast('Toutes les catégories réinitialisées');
}
