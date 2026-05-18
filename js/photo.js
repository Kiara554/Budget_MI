'use strict';
// ══════════════════════════════════════════════
//  PHOTO
// ══════════════════════════════════════════════
function triggerPhoto(inputId) {
  document.getElementById(inputId).click();
}

function handlePhoto(event, inputId) {
  const file = event.target.files[0]; if(!file) return;
  resizeImage(file, 900, 0.78, dataUrl => {
    photoData = dataUrl;
    updatePhotoPreview();
    // Coche automatiquement "Reçu présent ?"
    setToggle('t-recu', true);
  });
}

function updatePhotoPreview() {
  const prev = document.getElementById('photo-preview');
  if(!prev) return;
  if(photoData) {
    prev.style.cursor = 'default';
    prev.onclick = null;
    prev.innerHTML = `<img src="${photoData}" alt="Aperçu"><button class="photo-rm" onclick="event.stopPropagation();photoData=null;updatePhotoPreview()">✕</button>`;
  } else {
    prev.style.cursor = 'default';
    prev.onclick = null;
    prev.innerHTML = `<span class="photo-icon">📎</span><span class="photo-hint">Ajouter un justificatif</span><div style="display:flex;gap:8px;margin-top:8px"><button type="button" onclick="event.stopPropagation();document.getElementById('photo-input-cam').click()" style="padding:5px 12px;border-radius:10px;border:1.5px solid var(--accent);background:var(--accent-pale);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer">📷 Photo</button><button type="button" onclick="event.stopPropagation();document.getElementById('photo-input-file').click()" style="padding:5px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--text2);font-size:12px;font-weight:700;cursor:pointer">📁 Fichier</button></div>`;
  }
}

function addPhotoAfter(id) {
  detailId = id;
  document.getElementById('photo-input-after').click();
}

function handlePhotoAfter(event) {
  const file = event.target.files[0]; if(!file) return;
  resizeImage(file, 900, 0.78, dataUrl => {
    const idx = expenses.findIndex(e=>e.id===detailId);
    if(idx>=0) {
      expenses[idx].photo = dataUrl;
      expenses[idx].recu = true;
      save();
      openDetail(detailId);
      toast('Justificatif ajouté !');
    }
  });
  event.target.value = '';
}

function toJpeg(dataUrl) {
  return new Promise(resolve => {
    if (dataUrl.startsWith('data:image/jpeg')) { resolve(dataUrl); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/jpeg', 0.88));
    };
    img.src = dataUrl;
  });
}

function resizeImage(file, maxSize, quality, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if(w>maxSize||h>maxSize) {
        if(w>h) { h=Math.round(h*(maxSize/w)); w=maxSize; }
        else { w=Math.round(w*(maxSize/h)); h=maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
