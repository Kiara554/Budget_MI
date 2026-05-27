'use strict';
// ══════════════════════════════════════════════
//  GITHUB GIST SYNC
// ══════════════════════════════════════════════
let _gistTimer  = null;
let _syncState  = 'idle'; // idle | syncing | synced | error | disabled
let _gistInfoOpen = false;
let _syncIndicatorTimer = null;
let editingWithdrawId = null;

function debouncedGistSync() {
  if (!settings.githubPAT) return;
  clearTimeout(_gistTimer);
  _gistTimer = setTimeout(syncToGist, 4000); // 4s après la dernière modif
  setSyncState('idle');
}

function setSyncState(s) {
  _syncState = s;
  const el = document.getElementById('gist-status');
  const cfg = {
    idle:     { cls:'idle',    icon:'●', label:'En attente…'      },
    syncing:  { cls:'syncing', icon:'↻', label:'Sauvegarde…'      },
    synced:   { cls:'synced',  icon:'✓', label:'Sauvegardé sur Gist' },
    error:    { cls:'error',   icon:'✕', label:'Erreur de sync'   },
    disabled: { cls:'idle',    icon:'○', label:'Sync désactivée'  },
  };
  const c = cfg[s] || cfg.idle;
  if (el) {
    el.className = `gist-status-badge ${c.cls}`;
    el.textContent = `${c.icon} ${c.label}`;
  }
  // Badge flottant mobile
  const ind = document.getElementById('sync-indicator');
  if (ind) {
    clearTimeout(_syncIndicatorTimer);
    if (s === 'syncing') {
      ind.className = 'sync-indicator syncing';
      ind.textContent = '↻ Sync…';
    } else if (s === 'synced') {
      ind.className = 'sync-indicator synced';
      ind.textContent = '✓ Sauvegardé';
      _syncIndicatorTimer = setTimeout(() => { ind.className = 'sync-indicator'; }, 2500);
    } else if (s === 'error') {
      ind.className = 'sync-indicator error';
      ind.textContent = '✕ Erreur sync';
      _syncIndicatorTimer = setTimeout(() => { ind.className = 'sync-indicator'; }, 4000);
    } else {
      ind.className = 'sync-indicator';
    }
  }
}

function gistHeaders() {
  return {
    'Authorization': `token ${settings.githubPAT}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json',
  };
}

function gistPayload() {
  const backup = {
    version: 3,
    savedAt: new Date().toISOString(),
    device: navigator.userAgent.slice(0, 60),
    settings: {
      rate:           settings.rate,
      budgets:        settings.budgets,
      paymentMethods: settings.paymentMethods,
      catOverrides:   settings.catOverrides  || {},
      customCats:     settings.customCats    || [],
      todoCategories: settings.todoCategories|| [],
      // githubPAT et githubGistId exclus volontairement (sensibles / propres à chaque appareil)
    },
    pin: localStorage.getItem('mi_pin') || null,
    expenses,
    withdrawals,
    gains,
    templates,
    todoItems,
  };
  return JSON.stringify({ files: { 'mi-depenses.json': { content: JSON.stringify(backup, null, 2) } } });
}

async function syncToGist() {
  if (!settings.githubPAT) {
    toast('Configure le token GitHub dans Réglages → Sauvegarde cloud');
    return;
  }
  setSyncState('syncing');
  try {
    let resp, gist;
    if (settings.githubGistId) {
      resp = await fetch(`https://api.github.com/gists/${settings.githubGistId}`, {
        method: 'PATCH', headers: gistHeaders(), body: gistPayload(),
      });
    } else {
      resp = await fetch('https://api.github.com/gists', {
        method: 'POST', headers: gistHeaders(),
        body: JSON.stringify({
          description: 'MI Dépenses — Sauvegarde automatique',
          public: false,
          files: { 'mi-depenses.json': { content: '{}' } },
        }),
      });
    }
    if (resp.status === 401) throw new Error('Token invalide ou expiré');
    if (resp.status === 404) {
      // Gist supprimé → en créer un nouveau
      settings.githubGistId = '';
      localStorage.setItem('mi_settings', JSON.stringify(settings));
      return syncToGist();
    }
    if (!resp.ok) throw new Error(`GitHub API : HTTP ${resp.status}`);
    gist = await resp.json();
    if (!settings.githubGistId) {
      settings.githubGistId = gist.id;
      if (curView === 'settings') renderSettings();
    }
    // Mémoriser l'horodatage du push pour la détection de conflit
    settings.lastGistSync = new Date().toISOString();
    localStorage.setItem('mi_settings', JSON.stringify(settings));
    setSyncState('synced');
    // Sync photos si activé (fichier séparé dans le même Gist)
    if (settings.syncPhotos) syncPhotosToGist().catch(console.warn);
  } catch (e) {
    setSyncState('error');
    toast('Sync Gist : ' + e.message);
    console.error(e);
  }
}

// ── SYNC PHOTOS ────────────────────────────────
const _PHOTOS_MAX_BYTES = 9 * 1024 * 1024; // 9 Mo — limite prudente avant troncature API

async function syncPhotosToGist() {
  if (!settings.githubGistId || !settings.githubPAT) return;
  try {
    const allPhotos = await getAllPhotosIDB();
    // Garder uniquement les IDs référencés par les dépenses actuelles
    const validIds = new Set();
    expenses.forEach(e => {
      if (e.id) validIds.add(e.id);
      (e.extraPhotos || []).forEach(p => { if (p.id) validIds.add(p.id); });
    });
    const filtered = {};
    let totalBytes = 0;
    for (const [k, v] of Object.entries(allPhotos)) {
      if (!validIds.has(k)) continue;
      totalBytes += (v || '').length;
      if (totalBytes > _PHOTOS_MAX_BYTES) {
        toast('Photos trop volumineuses pour Gist (>9 Mo) — utilise l\'export JSON local');
        return;
      }
      filtered[k] = v;
    }
    const nb = Object.keys(filtered).length;
    if (!nb) return; // rien à sauvegarder
    const content = JSON.stringify({ savedAt: new Date().toISOString(), count: nb, photos: filtered });
    const resp = await fetch(`https://api.github.com/gists/${settings.githubGistId}`, {
      method: 'PATCH',
      headers: gistHeaders(),
      body: JSON.stringify({ files: { 'mi-photos.json': { content } } }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    toast(`${nb} photo${nb > 1 ? 's' : ''} sauvegardée${nb > 1 ? 's' : ''} sur Gist`);
  } catch (e) {
    toast('Sync photos Gist : ' + e.message);
    console.error(e);
  }
}

async function loadPhotosFromGist() {
  if (!settings.githubGistId || !settings.githubPAT) {
    toast('Connecte-toi d\'abord à GitHub Gist');
    return;
  }
  try {
    const resp = await fetch(`https://api.github.com/gists/${settings.githubGistId}`, {
      headers: gistHeaders(),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const gist = await resp.json();
    const raw  = gist.files['mi-photos.json']?.content;
    if (!raw) { toast('Aucune photo sauvegardée dans ce Gist'); return; }
    const d = JSON.parse(raw);
    if (!d.photos) { toast('Fichier mi-photos.json vide ou invalide'); return; }
    const entries = Object.entries(d.photos);
    await Promise.all(entries.map(([id, data]) => savePhotoIDB(id, data)));
    // Attacher les photos restaurées aux dépenses en mémoire
    expenses.forEach(e => {
      if (d.photos[e.id]) e.photo = d.photos[e.id];
      (e.extraPhotos || []).forEach(p => { if (d.photos[p.id]) p.data = d.photos[p.id]; });
    });
    const nb = entries.length;
    toast(`${nb} photo${nb > 1 ? 's' : ''} restaurée${nb > 1 ? 's' : ''} depuis Gist`);
    render();
  } catch (e) {
    toast('Chargement photos Gist : ' + e.message);
    console.error(e);
  }
}

// ── GESTION DE CONFLIT ────────────────────────
function _fmtConflictDate(iso) {
  if (!iso) return 'date inconnue';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function showConflictDialog({ localDate, localNb, gistDate, gistNb, onLocal, onGist }) {
  document.getElementById('conflict-overlay')?.remove();
  const ov = document.createElement('div');
  ov.id = 'conflict-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  ov.innerHTML = `
    <div style="background:var(--surface);border-radius:20px;padding:20px;max-width:340px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.25)">
      <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:6px">Conflit de données</div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:16px">Des modifications existent sur cet appareil et dans le Gist. Laquelle conserver ?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        <div style="padding:12px;background:var(--surface2);border-radius:12px;border:2px solid var(--border)">
          <div style="font-size:10px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:4px">CET APPAREIL</div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">${localNb} dép.</div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px">${localDate}</div>
        </div>
        <div style="padding:12px;background:var(--accent-pale);border-radius:12px;border:2px solid var(--accent)">
          <div style="font-size:10px;font-weight:800;color:var(--accent);letter-spacing:.5px;margin-bottom:4px">GIST (CLOUD)</div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">${gistNb} dép.</div>
          <div style="font-size:11px;color:var(--text3);margin-top:3px">${gistDate}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button id="conflict-local" style="flex:1;padding:12px;border-radius:12px;border:1.5px solid var(--border);background:var(--surface2);font-size:13px;font-weight:700;color:var(--text2);cursor:pointer">Garder local</button>
        <button id="conflict-gist"  style="flex:1;padding:12px;border-radius:12px;border:none;background:var(--accent);font-size:13px;font-weight:700;color:#fff;cursor:pointer">Charger Gist</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  document.getElementById('conflict-local').onclick = () => { ov.remove(); onLocal(); };
  document.getElementById('conflict-gist').onclick  = () => { ov.remove(); onGist(); };
}

// autoLoad = true → appelé automatiquement (savePAT / saveGistId), bypasse le confirm simple
async function loadFromGist(autoLoad = false) {
  if (!settings.githubPAT) { toast('Token GitHub manquant'); return; }
  if (!settings.githubGistId) { toast('Aucun Gist associé — sauvegarde d\'abord une fois'); return; }
  setSyncState('syncing');
  try {
    const resp = await fetch(`https://api.github.com/gists/${settings.githubGistId}`, {
      headers: gistHeaders(),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const gist = await resp.json();
    const raw  = gist.files['mi-depenses.json']?.content;
    if (!raw) throw new Error('Fichier mi-depenses.json introuvable dans le Gist');
    const d = JSON.parse(raw);
    setSyncState('idle');

    const gistNb    = Array.isArray(d.expenses) ? d.expenses.length : 0;
    const localNb   = expenses.length;
    const gistSaved = d.savedAt  || null;
    const lastSync  = settings.lastGistSync || null; // timestamp de la dernière sync bidirectionnelle

    // Conflit : le Gist a été modifié par un autre appareil depuis la dernière sync connue,
    // et on a aussi des données locales (potentiellement divergentes)
    const isConflict = !autoLoad
      && lastSync && gistSaved && gistSaved > lastSync
      && localNb > 0 && gistNb > 0;

    const _applyGistData = async () => {
      setSyncState('syncing');
      if (Array.isArray(d.expenses))    expenses    = d.expenses;
      if (Array.isArray(d.withdrawals)) withdrawals = d.withdrawals;
      if (Array.isArray(d.gains))       gains       = d.gains;
      if (Array.isArray(d.templates))   templates   = d.templates;
      if (Array.isArray(d.todoItems))   todoItems   = d.todoItems;
      const _keep = { githubPAT: settings.githubPAT, githubGistId: settings.githubGistId,
                      syncPhotos: settings.syncPhotos, lastGistSync: new Date().toISOString() };
      if (d.settings) settings = { ...settings, ...d.settings, ..._keep };
      else            Object.assign(settings, _keep);
      if (d.pin) localStorage.setItem('mi_pin', d.pin);
      localStorage.setItem('mi_expenses',    JSON.stringify(expenses));
      localStorage.setItem('mi_withdrawals', JSON.stringify(withdrawals));
      localStorage.setItem('mi_settings',    JSON.stringify(settings));
      setSyncState('synced');
      render();
      renderSettings();
      toast(`Chargé depuis Gist — ${expenses.length} dépenses (${d.savedAt?.slice(0,10)||'?'})`);
      if (settings.syncPhotos) loadPhotosFromGist().catch(console.warn);
    };

    if (isConflict) {
      showConflictDialog({
        localDate: _fmtConflictDate(lastSync),
        localNb,
        gistDate:  _fmtConflictDate(gistSaved),
        gistNb,
        onLocal: () => {
          // Conserver local — on met à jour lastGistSync pour ne plus re-détecter le même conflit
          settings.lastGistSync = new Date().toISOString();
          localStorage.setItem('mi_settings', JSON.stringify(settings));
          toast('Données locales conservées');
          setSyncState('idle');
        },
        onGist: () => _applyGistData(),
      });
    } else if (!autoLoad && localNb > 0) {
      if (!confirm(`Remplacer les ${localNb} dépenses locales par les ${gistNb} du Gist (${gistSaved?.slice(0,10)||'?'}) ?`)) {
        setSyncState('idle');
        return;
      }
      await _applyGistData();
    } else {
      await _applyGistData();
    }
  } catch (e) {
    setSyncState('error');
    toast('Erreur chargement Gist : ' + e.message);
  }
}

function saveGistId() {
  const val = (document.getElementById('s-gist-id')?.value || '').trim();
  if (!val) { toast('ID vide — rien changé'); return; }
  settings.githubGistId = val;
  localStorage.setItem('mi_settings', JSON.stringify(settings));
  renderSettings();
  toast('Gist ID mis à jour — chargement…');
  loadFromGist(true); // autoLoad : l'utilisateur vient d'entrer un ID, pas de confirm
}

function toggleSyncPhotos() {
  settings.syncPhotos = !settings.syncPhotos;
  localStorage.setItem('mi_settings', JSON.stringify(settings));
  renderSettings();
  toast(settings.syncPhotos ? 'Sync photos activée' : 'Sync photos désactivée');
}

async function disconnectGist() {
  if (!confirm('Déconnecter GitHub Gist ? Le Gist ne sera pas supprimé.')) return;
  settings.githubPAT = '';
  settings.githubGistId = '';
  localStorage.setItem('mi_settings', JSON.stringify(settings));
  setSyncState('disabled');
  renderSettings();
  toast('Gist déconnecté');
}
