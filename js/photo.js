'use strict';
// ══════════════════════════════════════════════
//  PHOTO
// ══════════════════════════════════════════════
function triggerPhoto(inputId) {
  document.getElementById(inputId).click();
}

function readFileAsDataUrl(file, callback) {
  const reader = new FileReader();
  reader.onload = e => callback(e.target.result, file.type || 'application/octet-stream', file.name);
  reader.readAsDataURL(file);
}

function handlePhoto(event, inputId) {
  const file = event.target.files[0]; if (!file) return;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    readFileAsDataUrl(file, (dataUrl) => {
      photoData = dataUrl;
      updatePhotoPreview();
      setToggle('t-recu', true);
    });
  } else {
    resizeImage(file, 900, 0.78, dataUrl => {
      photoData = dataUrl;
      updatePhotoPreview();
      setToggle('t-recu', true);
    });
  }
  event.target.value = '';
}

function updatePhotoPreview() {
  const prev = document.getElementById('photo-preview');
  if (!prev) return;
  if (photoData) {
    const isPdf = photoData.startsWith('data:application/pdf');
    prev.innerHTML = isPdf
      ? `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px">
           <span style="font-size:32px">📄</span>
           <span style="font-size:12px;font-weight:700;color:var(--text2)">PDF joint</span>
           <a href="${photoData}" target="_blank" style="font-size:11px;color:var(--accent);text-decoration:underline">Aperçu ↗</a>
         </div>
         <button class="photo-rm" onclick="event.stopPropagation();photoData=null;updatePhotoPreview()">✕</button>`
      : `<img src="${photoData}" alt="Aperçu"><button class="photo-rm" onclick="event.stopPropagation();photoData=null;updatePhotoPreview()">✕</button>`;
  } else {
    prev.innerHTML = `<span class="photo-icon">📎</span><span class="photo-hint">Ajouter un justificatif</span>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button type="button" onclick="event.stopPropagation();document.getElementById('photo-input-cam').click()" style="padding:5px 12px;border-radius:10px;border:1.5px solid var(--accent);background:var(--accent-pale);color:var(--accent);font-size:12px;font-weight:700;cursor:pointer">📷 Photo</button>
        <button type="button" onclick="event.stopPropagation();document.getElementById('photo-input-file').click()" style="padding:5px 12px;border-radius:10px;border:1.5px solid var(--border);background:var(--surface);color:var(--text2);font-size:12px;font-weight:700;cursor:pointer">📁 Fichier</button>
      </div>`;
  }
  renderExtraPhotosPreviews();
}

function addPhotoAfter(id) {
  detailId = id;
  document.getElementById('photo-input-after').click();
}

function handlePhotoAfter(event) {
  const file = event.target.files[0]; if (!file) return;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const addPhoto = (dataUrl, type) => {
    const idx = expenses.findIndex(e => e.id === detailId);
    if (idx < 0) return;
    const photoId = uid();
    if (!expenses[idx].photo) {
      // Premier justificatif → photo principale
      expenses[idx].photo = dataUrl;
    } else {
      // Justificatif supplémentaire
      if (!expenses[idx].extraPhotos) expenses[idx].extraPhotos = [];
      expenses[idx].extraPhotos.push({ id: photoId, type });
      savePhotoIDB(photoId, dataUrl).catch(console.warn);
    }
    expenses[idx].recu = true;
    save();
    openDetail(detailId);
    toast('Justificatif ajouté !');
  };
  if (isPdf) {
    readFileAsDataUrl(file, (dataUrl, type) => addPhoto(dataUrl, type));
  } else {
    resizeImage(file, 900, 0.78, dataUrl => addPhoto(dataUrl, 'image/jpeg'));
  }
  event.target.value = '';
}

function handleExtraPhoto(event) {
  const file = event.target.files[0]; if (!file) return;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const process = (dataUrl, type) => {
    extraPhotoDatas.push({ id: uid(), data: dataUrl, type, name: file.name });
    renderExtraPhotosPreviews();
    setToggle('t-recu', true);
  };
  if (isPdf) {
    readFileAsDataUrl(file, (dataUrl, type) => process(dataUrl, type));
  } else {
    resizeImage(file, 900, 0.78, dataUrl => process(dataUrl, 'image/jpeg'));
  }
  event.target.value = '';
}

function removeExtraPhoto(idx) {
  extraPhotoDatas.splice(idx, 1);
  renderExtraPhotosPreviews();
}

function renderExtraPhotosPreviews() {
  const el = document.getElementById('extra-photos-list');
  if (!el) return;
  if (!extraPhotoDatas.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">` +
    extraPhotoDatas.map((p, i) => {
      const isPdf = p.type === 'application/pdf';
      return `<div style="position:relative;width:64px;height:64px;border-radius:10px;overflow:hidden;border:1.5px solid var(--border);background:var(--surface2)">
        ${isPdf
          ? `<a href="${p.data}" target="_blank" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;text-decoration:none">📄</a>`
          : `<img src="${p.data}" style="width:100%;height:100%;object-fit:cover">`
        }
        <button onclick="removeExtraPhoto(${i})" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;line-height:1">✕</button>
      </div>`;
    }).join('') + `</div>`;
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
