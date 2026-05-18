'use strict';
// ══════════════════════════════════════════════
//  RENDER: TODO
// ══════════════════════════════════════════════
let todoFilter = 'all'; // 'all' | catId | 'done'
let todoEditId = null;
let todoEditCatId = null;

const TODO_CAT_COLORS = [
  '#f0a0b8','#f0b080','#e8c040','#78d4a0',
  '#84c0f0','#b098f4','#6cd0e8','#f098c4',
  '#a8d870','#f4a060',
];

function renderTodo() {
  const body = document.getElementById('todo-body');
  if (!body) return;
  const cats = settings.todoCategories || [];
  const filtered = todoItems.filter(t => {
    if (todoFilter === 'done') return t.done;
    if (todoFilter === 'all') return !t.done;
    return !t.done && t.cat === todoFilter;
  });
  const done = todoItems.filter(t => t.done);

  body.innerHTML = `
    <!-- Tabs catégories -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;padding:8px 0 4px">
      ${[{id:'all',name:'Tout'}, ...cats].map(c =>
        `<button onclick="todoFilter='${c.id}';renderTodo()" class="tab-btn ${todoFilter===c.id?'active':''}" ${c.color && todoFilter===c.id ? `style="background:${c.color};border-color:${c.color};color:#fff"` : c.color ? `style="border-color:${c.color};color:${c.color}"` : ''}>${c.name}</button>`
      ).join('')}
      ${done.length > 0 ? `<button onclick="todoFilter='done';renderTodo()" class="tab-btn ${todoFilter==='done'?'active':''}">✓ Terminé (${done.length})</button>` : ''}
    </div>

    <!-- Barre d'ajout rapide -->
    <div style="display:flex;gap:8px;margin:8px 0">
      <input class="form-input" type="text" id="todo-quick-input" placeholder="Nouvelle tâche…" style="flex:1;min-height:44px" onkeydown="if(event.key==='Enter')quickAddTodo()">
      <button onclick="quickAddTodo()" style="min-height:44px;padding:0 16px;border-radius:14px;border:none;background:var(--accent);color:#fff;font-size:20px;font-weight:800;cursor:pointer">+</button>
    </div>

    <!-- Liste -->
    ${filtered.length === 0 ? `<div style="text-align:center;color:var(--text3);padding:32px 0;font-size:14px">Aucune tâche${todoFilter!=='all'?` dans cette catégorie`:''}.</div>` : ''}
    ${filtered.map(t => renderTodoItem(t, cats)).join('')}

    <!-- Section terminés (si filtre all) -->
    ${todoFilter === 'all' && done.length > 0 ? `
      <div style="margin-top:16px;color:var(--text3);font-size:12px;font-weight:700;letter-spacing:.5px;padding:4px 0">TERMINÉ (${done.length})</div>
      ${done.slice(0,3).map(t => renderTodoItem(t, cats)).join('')}
      ${done.length > 3 ? `<button onclick="todoFilter='done';renderTodo()" style="width:100%;padding:8px;border-radius:12px;border:1.5px solid var(--border);background:none;color:var(--text3);font-size:12px;font-weight:700;cursor:pointer">Voir tout (${done.length})</button>` : ''}
    ` : ''}

    <!-- Gestion catégories -->
    <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:16px">
      <div style="font-size:12px;font-weight:700;color:var(--text3);letter-spacing:.5px;margin-bottom:10px">CATÉGORIES</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">
        ${cats.map(c => todoEditCatId === c.id ? `
          <div style="width:100%;background:var(--surface2);border-radius:14px;padding:10px;margin-bottom:4px">
            <input class="form-input" type="text" id="edit-cat-name-${c.id}" value="${escHtml(c.name)}" style="width:100%;min-height:38px;font-size:13px;margin-bottom:8px;box-sizing:border-box" onkeydown="if(event.key==='Enter')saveTodoCat('${c.id}');if(event.key==='Escape'){todoEditCatId=null;renderTodo()}">
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px" id="color-swatches-${c.id}">
              ${TODO_CAT_COLORS.map(col => `
                <button onclick="document.querySelectorAll('#color-swatches-${c.id} .swatch').forEach(b=>b.style.outline='none');this.style.outline='3px solid var(--accent)';this.dataset.sel='1';document.getElementById('edit-cat-color-${c.id}').value='${col}'"
                  class="swatch" style="width:24px;height:24px;border-radius:50%;border:none;background:${col};cursor:pointer;outline:${(c.color||TODO_CAT_COLORS[0])===col?'3px solid var(--accent)':'none'}"></button>
              `).join('')}
            </div>
            <input type="hidden" id="edit-cat-color-${c.id}" value="${c.color || TODO_CAT_COLORS[0]}">
            <div style="display:flex;gap:6px">
              <button onclick="saveTodoCat('${c.id}')" style="flex:1;padding:7px 0;border-radius:10px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer">Enregistrer</button>
              <button onclick="todoEditCatId=null;renderTodo()" style="padding:7px 12px;border-radius:10px;border:1.5px solid var(--border);background:none;color:var(--text2);font-size:13px;cursor:pointer">Annuler</button>
              <button onclick="deleteTodoCat('${c.id}')" style="padding:7px 12px;border-radius:10px;border:none;background:none;color:var(--text3);font-size:13px;cursor:pointer">✕</button>
            </div>
          </div>` : `
          <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;background:${c.color||'var(--surface2)'};font-size:12px;font-weight:700;color:${c.color?'#fff':'var(--text2)'}">
            ${escHtml(c.name)}
            <button onclick="openEditTodoCat('${c.id}')" style="background:none;border:none;cursor:pointer;color:${c.color?'rgba(255,255,255,0.8)':'var(--text3)'};font-size:11px;line-height:1;padding:0 0 0 2px">✎</button>
            <button onclick="deleteTodoCat('${c.id}')" style="background:none;border:none;cursor:pointer;color:${c.color?'rgba(255,255,255,0.8)':'var(--text3)'};font-size:11px;line-height:1;padding:0">✕</button>
          </span>`).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <input class="form-input" type="text" id="new-todo-cat" placeholder="Nouvelle catégorie…" style="flex:1;min-height:40px;font-size:13px" onkeydown="if(event.key==='Enter')addTodoCat()">
        <button onclick="addTodoCat()" style="min-height:40px;padding:0 14px;border-radius:12px;border:1.5px solid var(--accent);background:var(--accent-pale);color:var(--accent);font-size:13px;font-weight:800;cursor:pointer">+ Créer</button>
      </div>
    </div>
  `;
}

function renderTodoItem(t, cats) {
  const cat = cats.find(c => c.id === t.cat);
  return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
    <button onclick="toggleTodo('${t.id}')" style="flex-shrink:0;width:24px;height:24px;border-radius:8px;border:2px solid ${t.done?'var(--accent)':'var(--border)'};background:${t.done?'var(--accent)':'none'};cursor:pointer;display:flex;align-items:center;justify-content:center">
      ${t.done?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':''}
    </button>
    <div style="flex:1;min-width:0">
      <div style="font-size:14px;font-weight:600;color:${t.done?'var(--text3)':'var(--text)'};text-decoration:${t.done?'line-through':'none'};word-break:break-word">${escHtml(t.text)}</div>
      ${cat ? `<span style="font-size:11px;font-weight:700;color:${cat.color?'#fff':'var(--accent)'};padding:1px 7px;border-radius:10px;background:${cat.color||'var(--accent-pale)'};cursor:pointer" onclick="cycleTodoCat('${t.id}')">${escHtml(cat.name)}</span>` :
        `<span style="font-size:11px;color:var(--text3);cursor:pointer" onclick="cycleTodoCat('${t.id}')">+ catégorie</span>`}
    </div>
    <button onclick="deleteTodo('${t.id}')" style="flex-shrink:0;background:none;border:none;cursor:pointer;color:var(--text3);padding:4px;font-size:16px">✕</button>
  </div>`;
}

function quickAddTodo() {
  const inp = document.getElementById('todo-quick-input');
  const text = inp.value.trim(); if (!text) return;
  const cat = todoFilter !== 'all' && todoFilter !== 'done' ? todoFilter : null;
  todoItems.unshift({ id: uid(), text, done: false, cat, createdAt: new Date().toISOString() });
  inp.value = '';
  save(); renderTodo();
}

function toggleTodo(id) {
  const t = todoItems.find(t => t.id === id); if (!t) return;
  t.done = !t.done;
  save(); renderTodo();
}

function deleteTodo(id) {
  todoItems = todoItems.filter(t => t.id !== id);
  save(); renderTodo();
}

function cycleTodoCat(id) {
  const t = todoItems.find(t => t.id === id); if (!t) return;
  const cats = settings.todoCategories || [];
  if (!cats.length) { toast('Crée d\'abord une catégorie en bas'); return; }
  const idx = cats.findIndex(c => c.id === t.cat);
  t.cat = idx < cats.length - 1 ? cats[idx + 1].id : null;
  save(); renderTodo();
}

function addTodoCat() {
  const inp = document.getElementById('new-todo-cat');
  const name = inp.value.trim(); if (!name) return;
  if (!settings.todoCategories) settings.todoCategories = [];
  settings.todoCategories.push({ id: uid(), name });
  inp.value = '';
  save(); renderTodo();
}

function openEditTodoCat(id) {
  todoEditCatId = id;
  renderTodo();
}

function saveTodoCat(id) {
  const nameEl = document.getElementById(`edit-cat-name-${id}`);
  const colorEl = document.getElementById(`edit-cat-color-${id}`);
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) return;
  const cat = (settings.todoCategories || []).find(c => c.id === id);
  if (!cat) return;
  cat.name = name;
  cat.color = colorEl ? colorEl.value : cat.color;
  todoEditCatId = null;
  save(); renderTodo();
}

function deleteTodoCat(id) {
  if (!confirm('Supprimer cette catégorie ?')) return;
  settings.todoCategories = (settings.todoCategories || []).filter(c => c.id !== id);
  todoItems.forEach(t => { if (t.cat === id) t.cat = null; });
  todoEditCatId = null;
  save(); renderTodo();
}
