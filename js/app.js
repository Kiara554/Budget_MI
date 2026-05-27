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
//  SWIPE NAVIGATION (mobile)
// ══════════════════════════════════════════════
function navigateMonth(dir) {
  const allMos = ['all', ...MONTHS];
  let cur;
  if      (curView === 'remb') cur = rembMo;
  else if (curView === 'cash') cur = cashMo;
  else                         cur = filterMo;
  const idx = allMos.indexOf(cur);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= allMos.length) return;
  const newMo = allMos[newIdx];
  if      (curView === 'remb') rembMo   = newMo;
  else if (curView === 'cash') cashMo   = newMo;
  else                         filterMo = newMo;
  render();
}

function initOfflineIndicator() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  let _wasOffline = false;

  const setOffline = () => {
    _wasOffline = true;
    banner.innerHTML = `${icon('wifi-off', 13, '#fff')} Hors ligne — modifications sauvegardées localement`;
    banner.classList.add('visible');
  };
  const setOnline = () => {
    banner.classList.remove('visible');
    if (_wasOffline) {
      _wasOffline = false;
      toast('De nouveau connecté');
      if (settings.githubPAT) debouncedGistSync();
    }
  };

  window.addEventListener('offline', setOffline);
  window.addEventListener('online',  setOnline);
  if (!navigator.onLine) setOffline(); // état initial si déjà hors ligne
}

function initSwipe() {
  let _sx = 0, _sy = 0;
  document.addEventListener('touchstart', e => {
    _sx = e.touches[0].clientX;
    _sy = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _sx;
    const dy = e.changedTouches[0].clientY - _sy;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return; // trop petit ou vertical
    if (document.body.style.overflow === 'hidden') return; // modal ouvert
    if (!['dashboard', 'list', 'remb', 'cash'].includes(curView)) return;
    navigateMonth(dx < 0 ? 1 : -1); // gauche → mois suivant, droite → mois précédent
  }, { passive: true });
}

// ══════════════════════════════════════════════
//  RÉCURRENCE — rappels Todo liés aux modèles
// ══════════════════════════════════════════════
function checkRecurringReminders() {
  const now      = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayDay = now.getDate();
  let created    = 0;
  templates.forEach(t => {
    if (t.recurringDay == null || t.recurringDay !== todayDay) return;
    // Ne pas créer si un rappel existe déjà pour aujourd'hui pour ce modèle
    const exists = todoItems.some(item =>
      item.reminderId === t.id && (item.createdAt||'').startsWith(todayStr)
    );
    if (exists) return;
    todoItems.unshift({
      id: uid(), text: `${t.name} — appliquer le modèle`,
      done: false, cat: null, priority: 'medium',
      dueDate: todayStr, createdAt: now.toISOString(),
      reminderId: t.id,
    });
    created++;
  });
  if (created > 0) { save(); }
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
async function init() {
  const savedTheme = localStorage.getItem('mi_theme');
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  await load();
  populateCatSelect();
  checkRecurringReminders();
  render();
  updateTodoBadge();
  initLock();
  initSwipe();
  initOfflineIndicator();
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
