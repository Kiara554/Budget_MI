'use strict';
// ══════════════════════════════════════════════
//  THEME / UPDATE
// ══════════════════════════════════════════════
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('mi_theme', next);
  renderSettings();
}

async function forceUpdate() {
  toast('Recherche de mise à jour…');
  if (!('serviceWorker' in navigator)) { toast('Service Worker non supporté'); return; }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    window.location.reload(true);
  } catch(e) {
    window.location.reload(true);
  }
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
async function init() {
  const savedTheme = localStorage.getItem('mi_theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  await load();
  populateCatSelect();
  render();
  initLock();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
