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
      // githubPAT et githubGistId exclus volontairement (sensibles / propres à chaque appareil)
    },
    pin: localStorage.getItem('mi_pin') || null, // hash SHA-256, jamais le code en clair
    expenses,
    withdrawals,
    gains,
    templates,
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
      localStorage.setItem('mi_settings', JSON.stringify(settings));
      if (curView === 'settings') renderSettings();
    }
    setSyncState('synced');
  } catch (e) {
    setSyncState('error');
    toast('Sync Gist : ' + e.message);
    console.error(e);
  }
}

async function loadFromGist() {
  if (!settings.githubPAT) { toast('Token GitHub manquant'); return; }
  if (!settings.githubGistId) { toast('Aucun Gist associé — sauvegarde d\'abord une fois'); return; }
  if (!confirm('Remplacer les données locales par celles du Gist ?')) return;
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
    if (Array.isArray(d.expenses))    expenses    = d.expenses;
    if (Array.isArray(d.withdrawals)) withdrawals = d.withdrawals;
    if (Array.isArray(d.gains))       gains       = d.gains;
    if (Array.isArray(d.templates))   templates   = d.templates;
    if (d.settings) {
      settings = {
        ...settings,
        ...d.settings,
        githubPAT:    settings.githubPAT,    // toujours propre à l'appareil
        githubGistId: settings.githubGistId, // toujours propre à l'appareil
      };
    }
    // Restaure le PIN hashé si présent dans le backup
    if (d.pin) {
      localStorage.setItem('mi_pin', d.pin);
    }
    localStorage.setItem('mi_expenses',    JSON.stringify(expenses));
    localStorage.setItem('mi_withdrawals', JSON.stringify(withdrawals));
    localStorage.setItem('mi_settings',    JSON.stringify(settings));
    setSyncState('synced');
    render();
    renderSettings();
    toast(`Chargé depuis Gist — ${expenses.length} dépenses (${d.savedAt?.slice(0,10)||'?'})`);
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
  loadFromGist();
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
