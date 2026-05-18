'use strict';
// ══════════════════════════════════════════════
//  RENDER: SETTINGS
// ══════════════════════════════════════════════
function renderSettings() {
  const body = document.getElementById('settings-body');
  body.innerHTML = `
  <div style="margin-top:12px"></div>

  <!-- Sauvegarde cloud GitHub Gist -->
  <div class="settings-section">
    <div class="settings-section-title" style="display:flex;align-items:center;gap:6px">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
      Sauvegarde cloud (GitHub Gist)
    </div>
    <div class="card">
      <div id="gist-status" class="gist-status-badge ${settings.githubPAT ? (_syncState==='synced'?'synced':'idle') : 'idle'}">
        ${settings.githubPAT ? (_syncState==='synced' ? '✓ Sauvegardé sur Gist' : '● Connecté') : '○ Non configuré'}
      </div>

      <button onclick="_gistInfoOpen=!_gistInfoOpen;renderSettings()" style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--text2);background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 10px;margin-bottom:10px;cursor:pointer">
        <span>${_gistInfoOpen ? '▲' : '▼'}</span> Instructions de configuration
      </button>
      ${_gistInfoOpen ? `<div class="gist-info-box">
        Sauvegarde <strong>automatique</strong> 4 s après chaque modification (dépenses, réglages, budgets, moyens de paiement, PIN).<br><br>
        <strong>Nouvel appareil</strong> : colle ton token → <em>Connecter</em> → l'app retrouve ton Gist automatiquement et charge tes données.<br><br>
        <strong>Créer un token :</strong><br>
        <strong>1.</strong> github.com → ton avatar → <strong>Settings → Developer settings → Personal access tokens → Tokens (classic)</strong><br>
        <strong>2.</strong> <em>Generate new token (classic)</em> · coche uniquement <strong><code>gist</code></strong><br>
        <strong>3.</strong> Copie le token (<code>ghp_…</code>) et colle-le ci-dessous
      </div>` : ''}

      <div class="form-group" style="margin-bottom:10px">
        <label class="form-label">Token GitHub (scope gist)</label>
        <div class="pat-input-wrap">
          <input class="form-input" type="password" id="s-pat"
            value="${settings.githubPAT||''}"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            autocomplete="off" autocorrect="off" spellcheck="false">
          <button class="pat-toggle" type="button" onclick="
            const i=document.getElementById('s-pat');
            i.type=i.type==='password'?'text':'password';
            this.textContent=i.type==='password'?'👁':'🙈';
          ">👁</button>
        </div>
      </div>

      <div class="btn-row" style="margin-bottom:8px">
        <button class="btn btn-accent" onclick="savePAT()" style="min-height:44px">Connecter</button>
        <button class="btn btn-outline" onclick="syncToGist()" style="min-height:44px" ${settings.githubPAT?'':'disabled'}>
          Sauvegarder maintenant
        </button>
      </div>
      <div class="btn-row">
        <button class="btn btn-outline" onclick="loadFromGist()" style="min-height:44px" ${settings.githubGistId?'':'disabled'}>
          Charger depuis Gist
        </button>
        ${settings.githubPAT ? `<button class="btn" style="min-height:44px;color:var(--text3);border:1px solid var(--border)" onclick="disconnectGist()">Déconnecter</button>` : ''}
      </div>

      <div class="form-group" style="margin-top:12px;margin-bottom:6px">
        <label class="form-label" style="display:flex;align-items:center;justify-content:space-between">
          <span>Gist ID</span>
          ${settings.githubGistId ? `<a href="https://gist.github.com/${settings.githubGistId}" target="_blank" rel="noopener" style="font-size:11px;color:var(--accent);text-decoration:none">Voir ↗</a>` : ''}
        </label>
        <div style="display:flex;gap:6px;align-items:center">
          <input type="text" id="s-gist-id"
            value="${settings.githubGistId||''}"
            placeholder="ex: 4a3b2c1d…"
            autocomplete="off" spellcheck="false"
            style="flex:1;font-family:var(--fm);font-size:11px;padding:6px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);outline:none;min-width:0">
          <button onclick="saveGistId()" style="flex-shrink:0;padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface2);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">OK</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Code PIN -->
  <div class="settings-section">
    <div class="settings-section-title" style="display:flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Sécurité — Code PIN
    </div>
    <div class="card">
      ${localStorage.getItem('mi_pin') ? `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0"></div>
          <span style="font-size:13px;font-weight:700;color:var(--green)">Code PIN activé</span>
        </div>
        <div class="btn-row">
          <button class="btn btn-outline" style="flex:1;min-height:44px" onclick="changePin()">Changer le code</button>
          <button class="btn" style="flex:1;min-height:44px;color:var(--red);border:1px solid var(--border)" onclick="disablePin()">Désactiver</button>
        </div>
      ` : `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--border);flex-shrink:0"></div>
          <span style="font-size:13px;font-weight:700;color:var(--text3)">Aucun code configuré</span>
        </div>
        <button class="btn btn-accent" style="min-height:44px;width:100%" onclick="setupPin()">Activer un code PIN</button>
      `}
    </div>
  </div>

  <!-- Taux de change -->
  <div class="settings-section">
    <div class="settings-section-title">💱 Taux de change</div>
    <div class="card">
      <div class="form-group" style="margin-bottom:10px">
        <label class="form-label">1 EUR = ? TND</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" type="number" id="s-rate" value="${settings.rate}" step="0.01" min="1" style="flex:1">
          <button onclick="fetchRate()" id="btn-fetch-rate" style="flex-shrink:0;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface2);font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">↻ Actuel</button>
        </div>
        <div id="rate-info" style="font-size:11px;color:var(--text3);margin-top:4px"></div>
      </div>
      <button class="btn btn-accent" onclick="saveRate()" style="min-height:44px">Sauvegarder le taux</button>
    </div>
  </div>

  <!-- Budget global -->
  <div class="settings-section">
    <div class="settings-section-title">🎯 Budget global du stage</div>
    <div class="card">
      <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--text3);margin-bottom:14px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Calculé automatiquement depuis les budgets par catégorie
      </div>
      <div class="stat-grid" style="margin-bottom:10px">
        <div class="stat-card accent-bg">
          <div class="stat-label">Budget Mai</div>
          <div class="stat-value mono">${fmtEur(computeBudgetPrepa(),0)}</div>
          <div class="stat-small">Transport A/R + Achats prépa</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Budget mensuel</div>
          <div class="stat-value mono">${fmtEur(computeBudgetMensuel(),0)}</div>
          <div class="stat-small">Juin · Juillet · Août (×3)</div>
        </div>
      </div>
      <div class="stat-card green-bg" style="margin-bottom:0">
        <div class="stat-label">Budget total stage</div>
        <div class="stat-value mono" style="font-size:26px">${fmtEur(computeBudgetTotal(),0)}</div>
        <div class="stat-small">Mai + mensuel × 3</div>
      </div>
    </div>
  </div>

  <!-- Budget par catégorie -->
  <div class="settings-section">
    <div class="settings-section-title">💰 Budgets par catégorie</div>
    <div class="card" style="padding:0 0 8px;overflow:hidden">
      <div style="overflow-x:auto">
        <table class="budget-table" style="padding:0 12px">
          <thead>
            <tr>
              <th style="padding:12px 12px 6px">Catégorie</th>
              <th>Budget (€)</th>
              <th>Plafond remb. (€)</th>
            </tr>
          </thead>
          <tbody>
            ${CATS.map(c=>{
              const b = getBudget(c.id);
              const p = getPlafond(c.id);
              return `<tr>
                <td style="padding:8px 12px 8px;border:none;background:none;display:flex;align-items:center;gap:6px">
                  <span style="background:${catColor(c.id).bg};color:${catColor(c.id).text};padding:2px 8px;border-radius:20px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:5px">${icon(c.ic||'divers',13,catColor(c.id).text)} ${c.lbl}</span>
                </td>
                <td style="border:none;background:none;text-align:right">
                  <input class="budget-input" type="number" min="0" id="b-budget-${c.id}" value="${b}" placeholder="—">
                </td>
                <td style="border:none;background:none;text-align:right">
                  <input class="budget-input" type="number" min="0" id="b-plafond-${c.id}" value="${p!==null?p:''}" placeholder="—">
                </td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding:8px 12px;font-size:12px;font-weight:900;color:var(--text);border-top:2px solid var(--border);border:none;background:none">Total</td>
              <td style="border-top:2px solid var(--border);border:none;background:none;text-align:right;font-size:13px;font-weight:900;font-family:var(--fm);color:var(--accent)">
                ${fmtEur(CATS.reduce((s,c)=>s+getBudget(c.id),0),0)}
              </td>
              <td style="border-top:2px solid var(--border);border:none;background:none;text-align:right;font-size:13px;font-weight:900;font-family:var(--fm);color:var(--green)">
                ${fmtEur(CATS.reduce((s,c)=>{ const p=getPlafond(c.id); return s+(p||0); },0),0)} <span style="font-size:10px;font-weight:700;color:var(--text3)">/ ${fmtEur(OPCO_GLOBAL_MAX,0)} max</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="padding:10px 12px 4px;display:flex;gap:10px">
        <button class="btn btn-accent" onclick="saveBudgets()" style="min-height:44px">💾 Sauvegarder budgets</button>
        <button class="btn btn-outline" onclick="resetBudgets()" style="min-height:44px">↩ Réinitialiser</button>
      </div>
    </div>
  </div>

  <!-- Moyens de paiement -->
  <div class="settings-section">
    <div class="settings-section-title" style="display:flex;align-items:center;gap:6px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Moyens de paiement</div>
    <div class="card" style="padding-bottom:8px">
      <div id="pay-methods-list"></div>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn btn-outline" onclick="addPayMethod()" style="display:flex;align-items:center;gap:5px;min-height:40px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter</button>
        <button class="btn btn-accent" onclick="savePayMethods()" style="display:flex;align-items:center;gap:5px;min-height:40px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Sauvegarder</button>
      </div>
      <p style="font-size:11px;color:var(--text3);margin-top:8px">Choisir le type : 💳 Carte · 💵 Espèces · 🔄 Virement · 📱 Mobile</p>
    </div>
  </div>

  <!-- Import / Export -->
  <div class="settings-section">
    <div class="settings-section-title" style="display:flex;align-items:center;gap:6px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export / Import</div>
    <div class="card">
      <div class="btn-row" style="margin-bottom:10px">
        <button class="btn btn-accent" onclick="exportData()" style="display:flex;align-items:center;gap:5px">Exporter JSON</button>
        <button class="btn btn-outline" onclick="shareData()" style="display:flex;align-items:center;gap:5px">Partager</button>
      </div>
      <button class="btn btn-outline" onclick="document.getElementById('import-input').click()" style="display:flex;align-items:center;gap:5px">Importer JSON</button>
      <input type="file" id="import-input" accept="application/json,.json" style="display:none" onchange="importData(event)">
    </div>
  </div>

  <!-- Stockage -->
  <div class="settings-section">
    <div class="settings-section-title" style="display:flex;align-items:center;gap:6px"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg> Stockage</div>
    <div class="card" id="storage-info-card">
      <div style="font-size:13px;color:var(--text3)">Calcul en cours…</div>
    </div>
  </div>

  <!-- Reset data -->
  <div class="settings-section">
    <div class="settings-section-title">🗑️ Données</div>
    <div class="card">
      <button class="btn btn-red" onclick="confirmReset()">🗑️ Effacer toutes les dépenses</button>
    </div>
  </div>

  <!-- Apparence -->
  <div class="settings-section">
    <div class="settings-section-title">🎨 Apparence</div>
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:2px">Mode sombre</div>
          <div style="font-size:12px;color:var(--text3)">Thème adapté pour la nuit</div>
        </div>
        <button class="theme-toggle-btn ${document.documentElement.getAttribute('data-theme')==='dark'?'dark':''}" onclick="toggleTheme()">
          ${document.documentElement.getAttribute('data-theme')==='dark' ? '🌙 Activé' : '☀️ Désactivé'}
        </button>
      </div>
    </div>
  </div>

  <!-- About sync -->
  <div class="settings-section">
    <div class="settings-section-title">💬 À propos de la synchro</div>
    <div class="sync-box">
      <strong>Sauvegarde principale : GitHub Gist</strong> (section ci-dessus).<br>
      Toutes les données sont synchronisées automatiquement — dépenses, réglages, budgets, moyens de paiement et code PIN.<br><br>
      <strong>Sauvegarde manuelle (secours) :</strong><br>
      • <strong>Exporter JSON</strong> → fichier complet avec photos des reçus<br>
      • <strong>Importer JSON</strong> sur n'importe quel appareil<br>
      • <strong>Partager</strong> → envoyer via WhatsApp, mail, etc.<br><br>
      ℹ️ Les photos des reçus sont incluses dans le JSON exporté et dans le Gist (en base64).
    </div>
  </div>

  <div style="height:20px"></div>
  <div style="text-align:center;padding-bottom:4px">
    <button class="btn btn-outline btn-sm" style="font-size:13px;padding:10px 20px" onclick="forceUpdate()">
      ↻ Mettre à jour l'application
    </button>
  </div>
  <div style="text-align:center;padding-bottom:8px;font-size:11px;color:var(--text3);font-family:var(--fm)">
    MI Dépenses ${APP_VERSION} — Cache sw-${APP_VERSION}
  </div>
  `;
  renderPayMethodsList();
  updateStorageInfo();
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
  CATS.forEach(c=>{
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
