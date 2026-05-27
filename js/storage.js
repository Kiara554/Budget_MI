'use strict';
// ══════════════════════════════════════════════
//  PHOTO STORE — IndexedDB (évite saturation localStorage)
// ══════════════════════════════════════════════
let _photoDB = null;
function openPhotoDB() {
  if (_photoDB) return Promise.resolve(_photoDB);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('mi-photos', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('photos');
    req.onsuccess = e => { _photoDB = e.target.result; resolve(_photoDB); };
    req.onerror = () => reject(req.error);
  });
}
function savePhotoIDB(id, dataUrl) {
  return openPhotoDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(dataUrl, id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  }));
}
function deletePhotoIDB(id) {
  return openPhotoDB().then(db => new Promise(resolve => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(id);
    tx.oncomplete = resolve; tx.onerror = resolve;
  }));
}
function clearAllPhotosIDB() {
  return openPhotoDB().then(db => new Promise(resolve => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').clear();
    tx.oncomplete = resolve; tx.onerror = resolve;
  }));
}
function getAllPhotosIDB() {
  return openPhotoDB().then(db => new Promise(resolve => {
    const tx = db.transaction('photos', 'readonly');
    const result = {};
    tx.objectStore('photos').openCursor().onsuccess = e => {
      const cur = e.target.result;
      if (cur) { result[cur.key] = cur.value; cur.continue(); } else resolve(result);
    };
    tx.onerror = () => resolve({});
  }));
}

// ══════════════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════════════
function save() {
  // Photos stockées dans IndexedDB — on les retire du localStorage
  const expForStorage = expenses.map(({ photo, ...rest }) => ({
    ...rest,
    extraPhotos: (rest.extraPhotos || []).map(({ data, ...p }) => p)
  }));
  localStorage.setItem('mi_expenses',    JSON.stringify(expForStorage));
  localStorage.setItem('mi_withdrawals', JSON.stringify(withdrawals));
  localStorage.setItem('mi_gains',       JSON.stringify(gains));
  localStorage.setItem('mi_templates',   JSON.stringify(templates));
  localStorage.setItem('mi_settings',    JSON.stringify(settings));
  localStorage.setItem('mi_todos',       JSON.stringify(todoItems));
  // Persistance des photos dans IndexedDB
  expenses.forEach(e => {
    if (e.photo?.startsWith('data:')) savePhotoIDB(e.id, e.photo).catch(console.warn);
    (e.extraPhotos || []).forEach(p => {
      if (p.data?.startsWith('data:')) savePhotoIDB(p.id, p.data).catch(console.warn);
    });
  });
  debouncedGistSync();
}
async function load() {
  try { expenses    = JSON.parse(localStorage.getItem('mi_expenses'))    || []; } catch(e){ expenses=[]; }
  try { withdrawals = JSON.parse(localStorage.getItem('mi_withdrawals')) || []; } catch(e){ withdrawals=[]; }
  try { gains       = JSON.parse(localStorage.getItem('mi_gains'))       || []; } catch(e){ gains=[]; }
  try { templates   = JSON.parse(localStorage.getItem('mi_templates'))   || []; } catch(e){ templates=[]; }
  try {
    const defaults = {rate:3.38, budgets:{}, paymentMethods:null, githubPAT:'', githubGistId:'', syncPhotos:false, lastGistSync:null};
    settings = Object.assign(defaults, JSON.parse(localStorage.getItem('mi_settings'))||{});
  } catch(e) {
    settings = {rate:3.38, budgets:{}, paymentMethods:null, githubPAT:'', githubGistId:''};
  }
  try { todoItems = JSON.parse(localStorage.getItem('mi_todos')) || []; } catch(e){ todoItems=[]; }
  // Restauration des photos depuis IndexedDB
  try {
    const photos = await getAllPhotosIDB();
    expenses.forEach(e => {
      if (photos[e.id]) {
        e.photo = photos[e.id];
      } else if (e.photo?.startsWith('data:')) {
        // Migration : photo encore en base64 dans localStorage → IndexedDB
        savePhotoIDB(e.id, e.photo).catch(console.warn);
      }
      (e.extraPhotos || []).forEach(p => {
        if (photos[p.id]) p.data = photos[p.id];
      });
    });
  } catch (err) { console.warn('IndexedDB indisponible:', err); }
}
