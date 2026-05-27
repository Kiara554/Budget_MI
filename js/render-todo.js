'use strict';
// ══════════════════════════════════════════════
//  RENDER: TODO
// ══════════════════════════════════════════════
let todoFilter      = 'all';
let todoEditId      = null;
let todoEditCatId   = null;
let todoShowCatMgr  = false;
let todoAddExpanded = false;
let todoSort        = 'priority'; // 'priority' | 'newest'
let todoDoneOpen    = false;

const TODO_CAT_COLORS = [
  '#f0a0b8','#f0b080','#e8c040','#78d4a0',
  '#84c0f0','#b098f4','#6cd0e8','#f098c4',
  '#a8d870','#f4a060',
];

const TODO_PRIO = {
  high:   { label: 'Haute',   color: '#f07090', pale: '#ffe8f0', dot: '●' },
  medium: { label: 'Moyenne', color: '#f5a96a', pale: '#fff3e6', dot: '●' },
  low:    { label: 'Basse',   color: '#4dbf98', pale: '#dff7ee', dot: '●' },
};

function todoDueTxt(dueDate) {
  if (!dueDate) return null;
  const today    = new Date().toISOString().slice(0,10);
  const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
  if (dueDate < today)    return { label:'En retard', col:'var(--red)',    bg:'var(--red-pale)'    };
  if (dueDate === today)  return { label:"Auj.",      col:'var(--orange)', bg:'var(--orange-pale)' };
  if (dueDate===tomorrow) return { label:'Demain',    col:'var(--blue)',   bg:'var(--blue-pale)'   };
  const d=new Date(dueDate+'T12:00:00');
  return { label:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`, col:'var(--text3)', bg:'var(--surface2)' };
}

function todoSorted(items) {
  if (todoSort === 'newest') return [...items].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const ord = {high:0, medium:1, low:2};
  return [...items].sort((a,b) => {
    const pa = a.priority ? (ord[a.priority]??3) : 3;
    const pb = b.priority ? (ord[b.priority]??3) : 3;
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1; if (b.dueDate) return 1;
    return 0;
  });
}

function selectTodoPrio(formId, p) {
  const inp = document.getElementById('tp-prio-'+formId);
  if (!inp) return;
  const cur = inp.value;
  inp.value = cur === p ? '' : p;
  document.querySelectorAll('.tp-pbtn-'+formId).forEach(b => {
    const bp = b.dataset.p;
    const pr = TODO_PRIO[bp];
    const sel = inp.value === bp;
    b.style.background = sel ? pr.color : 'transparent';
    b.style.color = sel ? '#fff' : pr.color;
  });
}

function updateTodoBadge() {
  const badge = document.getElementById('todo-badge');
  if (!badge) return;
  const today = new Date().toISOString().slice(0,10);
  const count = todoItems.filter(t => !t.done && (
    (t.dueDate && t.dueDate < today) || t.priority === 'high'
  )).length;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

function renderTodo() {
  const body = document.getElementById('todo-body');
  if (!body) return;
  const cats   = settings.todoCategories || [];
  const active = todoItems.filter(t => !t.done);
  const done   = todoItems.filter(t => t.done);
  const today  = new Date().toISOString().slice(0,10);
  const overdue = active.filter(t => t.dueDate && t.dueDate < today).length;

  const catCounts = {};
  active.forEach(t => { if (t.cat) catCounts[t.cat] = (catCounts[t.cat]||0)+1; });

  const filtered = (() => {
    if (todoFilter === 'done') return todoSorted(done);
    const base = todoFilter === 'all' ? active : active.filter(t => t.cat === todoFilter);
    return todoSorted(base);
  })();

  const activeCatName = cats.find(c=>c.id===todoFilter)?.name || '';

  body.innerHTML = `
    <!-- Stats bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0 4px">
      <div style="font-size:12px;color:var(--text3);display:flex;gap:10px;flex-wrap:wrap">
        <span><strong style="color:var(--text)">${active.length}</strong> en cours</span>
        ${done.length ? `<span><strong style="color:var(--green)">${done.length}</strong> terminée${done.length>1?'s':''}</span>` : ''}
        ${overdue ? `<span style="color:var(--red);font-weight:700">⚠ ${overdue} en retard</span>` : ''}
      </div>
      <button onclick="todoSort=todoSort==='priority'?'newest':'priority';renderTodo()"
        style="padding:3px 9px;border-radius:8px;border:1px solid var(--border);background:none;font-size:11px;font-weight:700;color:var(--text3);cursor:pointer">
        ${todoSort==='priority'?'🎯 Priorité':'🕐 Date'}
      </button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:5px;flex-wrap:wrap;padding:4px 0 10px">
      ${[{id:'all',name:'Tout',count:active.length}, ...cats.map(c=>({...c,count:catCounts[c.id]||0}))].map(c => {
        const on = todoFilter===c.id;
        const sty = c.color && on  ? `background:${c.color};border-color:${c.color};color:#fff`
                  : c.color && !on ? `border-color:${c.color};color:${c.color}` : '';
        return `<button onclick="todoFilter='${c.id}';renderTodo()" class="tab-btn ${on?'active':''}" ${sty?`style="${sty}"`:''}>${c.name}${c.count>0?` <span style="font-size:10px;opacity:.75">${c.count}</span>`:''}</button>`;
      }).join('')}
      ${done.length ? `<button onclick="todoFilter='done';renderTodo()" class="tab-btn ${todoFilter==='done'?'active':''}">✓&nbsp;<span style="font-size:10px;opacity:.75">${done.length}</span></button>` : ''}
    </div>

    <!-- Zone d'ajout -->
    <div style="background:var(--surface);border-radius:16px;padding:12px;margin-bottom:14px;box-shadow:var(--shadow)">
      <div style="display:flex;gap:8px">
        <input class="form-input" type="text" id="todo-quick-input"
          placeholder="${activeCatName ? 'Tâche dans '+activeCatName+'…' : 'Nouvelle tâche…'}"
          style="flex:1;min-height:44px"
          onkeydown="if(event.key==='Enter')quickAddTodo()">
        <button onclick="todoAddExpanded=!todoAddExpanded;renderTodo()"
          style="min-height:44px;padding:0 12px;border-radius:12px;border:1.5px solid ${todoAddExpanded?'var(--accent)':'var(--border)'};background:${todoAddExpanded?'var(--accent-pale)':'none'};color:${todoAddExpanded?'var(--accent)':'var(--text3)'};font-size:16px;cursor:pointer" title="Options">
          ⋯
        </button>
        <button onclick="quickAddTodo()"
          style="min-height:44px;padding:0 18px;border-radius:12px;border:none;background:var(--accent);color:#fff;font-size:22px;font-weight:800;cursor:pointer">+</button>
      </div>
      ${todoAddExpanded ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:8px">PRIORITÉ</div>
        <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
          ${['high','medium','low'].map(p => {
            const pr = TODO_PRIO[p];
            return `<button type="button" data-p="${p}" class="tp-pbtn-add"
              onclick="selectTodoPrio('add','${p}')"
              style="padding:5px 12px;border-radius:20px;border:1.5px solid ${pr.color};background:transparent;color:${pr.color};font-size:12px;font-weight:700;cursor:pointer">
              <span style="color:${pr.color}">${pr.dot}</span> ${pr.label}
            </button>`;
          }).join('')}
        </div>
        <input type="hidden" id="tp-prio-add" value="">
        <div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:6px">DATE LIMITE</div>
        <input type="date" class="form-input" id="tp-due-add" min="${today}">
      </div>` : ''}
    </div>

    <!-- Liste -->
    ${filtered.length===0 ? `
      <div style="text-align:center;padding:48px 0">
        <div style="font-size:36px;margin-bottom:10px">${todoFilter==='done'?'🎉':todoFilter!=='all'?'🏷️':'✨'}</div>
        <div style="font-size:15px;font-weight:800;color:var(--text2)">${todoFilter==='done'?'Aucune tâche terminée':'Aucune tâche ici'}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:6px">${todoFilter==='done'?'Coche une tâche pour la voir ici':'Saisis ta première tâche ci-dessus'}</div>
      </div>` : ''}
    <div style="display:flex;flex-direction:column;gap:6px">
      ${filtered.map(t => renderTodoItem(t, cats)).join('')}
    </div>

    <!-- Section terminées (vue all uniquement) -->
    ${todoFilter==='all' && done.length>0 ? `
      <div style="margin-top:20px">
        <button onclick="todoDoneOpen=!todoDoneOpen;renderTodo()"
          style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:12px;border:none;background:var(--surface2);cursor:pointer">
          <span style="font-size:12px;font-weight:800;color:var(--text3);letter-spacing:.4px">✓ TERMINÉES (${done.length})</span>
          <span style="font-size:13px;color:var(--text3)">${todoDoneOpen?'▲':'▼'}</span>
        </button>
        ${todoDoneOpen ? `<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">${done.map(t=>renderTodoItem(t,cats)).join('')}</div>
        <button onclick="clearDoneTodos()" style="width:100%;margin-top:8px;padding:8px;border-radius:10px;border:1.5px solid var(--border);background:none;color:var(--text3);font-size:12px;font-weight:700;cursor:pointer">🗑 Effacer les terminées</button>` : ''}
      </div>
    ` : ''}

    <!-- Gestion catégories (repliable) -->
    <div style="margin-top:24px">
      <button onclick="todoShowCatMgr=!todoShowCatMgr;renderTodo()"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-radius:12px;border:none;background:none;cursor:pointer;border:1px solid var(--border)">
        <span style="font-size:12px;font-weight:800;color:var(--text3);letter-spacing:.4px">🏷️ CATÉGORIES (${cats.length})</span>
        <span style="font-size:13px;color:var(--text3)">${todoShowCatMgr?'▲':'▼'}</span>
      </button>
      ${todoShowCatMgr ? `
      <div style="background:var(--surface);border-radius:14px;padding:14px;margin-top:8px;box-shadow:var(--shadow)">
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px">
          ${cats.length===0 ? `<div style="font-size:13px;color:var(--text3)">Aucune catégorie — crée-en une ci-dessous.</div>` : ''}
          ${cats.map(c => todoEditCatId===c.id ? `
            <div style="width:100%;background:var(--surface2);border-radius:12px;padding:10px">
              <input class="form-input" type="text" id="edit-cat-name-${c.id}" value="${escHtml(c.name)}"
                style="width:100%;min-height:36px;font-size:13px;margin-bottom:8px;box-sizing:border-box"
                onkeydown="if(event.key==='Enter')saveTodoCat('${c.id}');if(event.key==='Escape'){todoEditCatId=null;renderTodo()}">
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px" id="color-swatches-${c.id}">
                ${TODO_CAT_COLORS.map(col=>`<button type="button" onclick="document.querySelectorAll('#color-swatches-${c.id} .sw').forEach(b=>b.style.outline='none');this.style.outline='3px solid var(--accent)';document.getElementById('edit-cat-color-${c.id}').value='${col}'" class="sw" style="width:22px;height:22px;border-radius:50%;border:none;background:${col};cursor:pointer;outline:${(c.color||TODO_CAT_COLORS[0])===col?'3px solid var(--accent)':'none'}"></button>`).join('')}
              </div>
              <input type="hidden" id="edit-cat-color-${c.id}" value="${c.color||TODO_CAT_COLORS[0]}">
              <div style="display:flex;gap:6px">
                <button onclick="saveTodoCat('${c.id}')" style="flex:1;padding:7px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer">OK</button>
                <button onclick="todoEditCatId=null;renderTodo()" style="padding:7px 10px;border-radius:8px;border:1.5px solid var(--border);background:none;color:var(--text2);font-size:13px;cursor:pointer">Annuler</button>
                <button onclick="deleteTodoCat('${c.id}')" style="padding:7px 10px;border-radius:8px;border:none;background:none;color:var(--red);font-size:13px;cursor:pointer">✕</button>
              </div>
            </div>` : `
            <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;background:${c.color||'var(--surface2)'};font-size:12px;font-weight:700;color:${c.color?'#fff':'var(--text2)'}">
              ${escHtml(c.name)}
              ${catCounts[c.id]>0?`<span style="font-size:10px;opacity:.7">${catCounts[c.id]}</span>`:''}
              <button onclick="openEditTodoCat('${c.id}')" style="background:none;border:none;cursor:pointer;color:${c.color?'rgba(255,255,255,.7)':'var(--text3)'};font-size:11px;padding:0;margin-left:2px">✎</button>
            </span>`).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <input class="form-input" type="text" id="new-todo-cat" placeholder="Nouvelle catégorie…"
            style="flex:1;min-height:38px;font-size:13px" onkeydown="if(event.key==='Enter')addTodoCat()">
          <button onclick="addTodoCat()"
            style="padding:0 14px;border-radius:10px;border:1.5px solid var(--accent);background:var(--accent-pale);color:var(--accent);font-size:13px;font-weight:800;cursor:pointer;min-height:38px">+ Créer</button>
        </div>
      </div>` : ''}
    </div>
    <div style="height:16px"></div>
  `;
  updateTodoBadge();
}

function renderTodoItem(t, cats) {
  const cat     = cats.find(c => c.id === t.cat);
  const pr      = t.priority ? TODO_PRIO[t.priority] : null;
  const due     = todoDueTxt(t.dueDate);
  const today   = new Date().toISOString().slice(0,10);
  const _lnkExp = t.expenseId ? expenses.find(x => x.id === t.expenseId) : null;

  const leftBorder = pr ? `border-left:3px solid ${pr.color}` : 'border-left:3px solid transparent';

  if (todoEditId === t.id) {
    return `<div style="background:var(--surface);border-radius:14px;padding:14px;box-shadow:var(--shadow)">
      <input class="form-input" id="todo-edit-inp-${t.id}" value="${escHtml(t.text)}"
        style="width:100%;min-height:40px;margin-bottom:10px;box-sizing:border-box"
        onkeydown="if(event.key==='Enter')saveTodoEdit('${t.id}');if(event.key==='Escape'){todoEditId=null;renderTodo()}">
      <div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:7px">PRIORITÉ</div>
      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
        ${['high','medium','low'].map(p => {
          const pp=TODO_PRIO[p], sel=t.priority===p;
          return `<button type="button" data-p="${p}" class="tp-pbtn-${t.id}"
            onclick="selectTodoPrio('${t.id}','${p}')"
            style="padding:4px 11px;border-radius:20px;border:1.5px solid ${pp.color};background:${sel?pp.color:'transparent'};color:${sel?'#fff':pp.color};font-size:12px;font-weight:700;cursor:pointer">
            ${pp.dot} ${pp.label}
          </button>`;
        }).join('')}
      </div>
      <input type="hidden" id="tp-prio-${t.id}" value="${t.priority||''}">
      <div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:6px">DATE LIMITE</div>
      <input type="date" class="form-input" id="tp-due-${t.id}" value="${t.dueDate||''}" min="${today}"
        style="margin-bottom:12px">
      ${cats.length ? `
      <div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:6px">CATÉGORIE</div>
      <input type="hidden" id="tp-cat-${t.id}" value="${t.cat||''}">
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
        <button type="button" onclick="selectTodoCat('${t.id}','')"
          style="padding:5px 12px;border-radius:20px;border:1.5px solid var(--border);background:${!t.cat?'var(--surface2)':'transparent'};color:var(--text3);font-size:12px;font-weight:700;cursor:pointer">
          Aucune
        </button>
        ${cats.map(c => {
          const sel = t.cat === c.id;
          const col = c.color || 'var(--accent)';
          return `<button type="button" class="tp-cbtn-${t.id}" data-cid="${c.id}"
            onclick="selectTodoCat('${t.id}','${c.id}')"
            style="padding:5px 12px;border-radius:20px;border:1.5px solid ${col};background:${sel?col:'transparent'};color:${sel?'#fff':col};font-size:12px;font-weight:700;cursor:pointer">
            ${escHtml(c.name)}
          </button>`;
        }).join('')}
      </div>` : ''}
      <div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:6px">NOTES</div>
      <textarea class="form-input" id="tp-notes-${t.id}" placeholder="Contexte, détails…"
        style="width:100%;min-height:64px;margin-bottom:12px;box-sizing:border-box;resize:vertical;font-size:13px;line-height:1.4"
      >${escHtml(t.notes||'')}</textarea>
      <div style="font-size:11px;font-weight:800;color:var(--text3);letter-spacing:.5px;margin-bottom:6px">DÉPENSE LIÉE</div>
      <input type="hidden" id="tp-exp-${t.id}" value="${t.expenseId||''}">
      <div id="tp-exp-display-${t.id}" style="display:${_lnkExp?'flex':'none'};align-items:center;gap:7px;padding:8px 10px;background:var(--surface2);border-radius:10px;margin-bottom:12px">
        ${_lnkExp ? `<span style="flex:1;min-width:0;font-size:12px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${_lnkExp.enseigne?escHtml(_lnkExp.enseigne):(getCatMap()[_lnkExp.catId]?.lbl||'Divers')} · ${formatDate(_lnkExp.date)} · ${fmtEur(expenseEur(_lnkExp),2)}
        </span>
        <button type="button" onclick="clearTodoExp('${t.id}')" style="flex-shrink:0;background:none;border:none;cursor:pointer;color:var(--text3);padding:2px">${icon('xmark',12,'var(--text3)')}</button>` : ''}
      </div>
      <div id="tp-exp-picker-${t.id}" style="display:${_lnkExp?'none':'block'};margin-bottom:12px">
        <input type="text" class="form-input" id="tp-exp-search-${t.id}" placeholder="Rechercher une dépense…"
          oninput="filterTodoExpPicker('${t.id}')"
          style="width:100%;box-sizing:border-box;font-size:13px;margin-bottom:6px">
        <div id="tp-exp-list-${t.id}" style="max-height:150px;overflow-y:auto;display:flex;flex-direction:column;gap:3px"></div>
      </div>
      <div style="display:flex;gap:6px">
        <button onclick="saveTodoEdit('${t.id}')" style="flex:1;padding:9px;border-radius:10px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer">Enregistrer</button>
        <button onclick="todoEditId=null;renderTodo()" style="padding:9px 14px;border-radius:10px;border:1.5px solid var(--border);background:none;color:var(--text2);font-size:13px;cursor:pointer">Annuler</button>
        <button onclick="deleteTodo('${t.id}')" style="padding:9px 12px;border-radius:10px;border:none;background:none;color:var(--red);font-size:16px;cursor:pointer">✕</button>
      </div>
    </div>`;
  }

  return `<div style="display:flex;align-items:flex-start;gap:10px;padding:11px 12px 11px 10px;background:var(--surface);border-radius:14px;${leftBorder};box-shadow:0 1px 3px rgba(0,0,0,.04)">
    <button onclick="toggleTodo('${t.id}')"
      style="flex-shrink:0;width:22px;height:22px;border-radius:7px;border:2px solid ${t.done?'var(--accent)':'var(--border)'};background:${t.done?'var(--accent)':'none'};cursor:pointer;display:flex;align-items:center;justify-content:center;margin-top:1px">
      ${t.done?'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':''}
    </button>
    <div style="flex:1;min-width:0;cursor:pointer" onclick="todoEditId='${t.id}';renderTodo()">
      <div style="font-size:14px;font-weight:600;color:${t.done?'var(--text3)':'var(--text)'};text-decoration:${t.done?'line-through':'none'};word-break:break-word;line-height:1.35">${escHtml(t.text)}</div>
      ${t.notes&&!t.done?`<div style="font-size:12px;color:var(--text3);margin-top:4px;line-height:1.45;word-break:break-word">${escHtml(t.notes)}</div>`:''}
      ${(cat||due||pr) ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;align-items:center">
        ${pr&&!t.done?`<span style="font-size:11px;font-weight:700;color:${pr.color};padding:1px 7px;border-radius:10px;background:${pr.pale}">${pr.dot} ${pr.label}</span>`:''}
        ${due?`<span style="font-size:11px;font-weight:700;color:${due.col};padding:1px 7px;border-radius:10px;background:${due.bg}">📅 ${due.label}</span>`:''}
        ${cat?`<span style="font-size:11px;font-weight:700;color:${cat.color?'#fff':'var(--accent)'};padding:1px 7px;border-radius:10px;background:${cat.color||'var(--accent-pale)'}">${escHtml(cat.name)}</span>`:''}
      </div>` : ''}
      ${_lnkExp ? `
      <div onclick="event.stopPropagation();openDetail('${_lnkExp.id}')"
        style="display:flex;align-items:center;gap:7px;margin-top:6px;padding:5px 8px;background:var(--accent-pale);border-radius:8px;cursor:pointer">
        ${catIconHtml(_lnkExp.catId,13)}
        <span style="font-size:11px;font-weight:600;color:var(--text2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${_lnkExp.enseigne?escHtml(_lnkExp.enseigne):(getCatMap()[_lnkExp.catId]?.lbl||'Divers')} · ${formatDate(_lnkExp.date)}
        </span>
        <span style="font-size:11px;font-weight:700;font-family:var(--fm);color:var(--accent);flex-shrink:0">${fmtEur(expenseEur(_lnkExp),2)}</span>
      </div>` : ''}
    </div>
    <button onclick="todoEditId='${t.id}';renderTodo()"
      style="flex-shrink:0;background:none;border:none;cursor:pointer;color:var(--text3);padding:2px 4px;font-size:15px;margin-top:1px">✎</button>
  </div>`;
}

// ── Actions ──────────────────────────────────────
function quickAddTodo() {
  const inp = document.getElementById('todo-quick-input');
  const text = inp.value.trim(); if (!text) return;
  const cat      = todoFilter!=='all'&&todoFilter!=='done' ? todoFilter : null;
  const priority = todoAddExpanded ? (document.getElementById('tp-prio-add')?.value||null) : null;
  const dueDate  = todoAddExpanded ? (document.getElementById('tp-due-add')?.value||null) : null;
  todoItems.unshift({ id:uid(), text, done:false, cat, priority:priority||null, dueDate:dueDate||null, createdAt:new Date().toISOString() });
  inp.value = '';
  save(); renderTodo();
}

function saveTodoEdit(id) {
  const t = todoItems.find(t=>t.id===id); if (!t) return;
  const inp  = document.getElementById('todo-edit-inp-'+id);
  const prEl = document.getElementById('tp-prio-'+id);
  const duEl = document.getElementById('tp-due-'+id);
  const catEl= document.getElementById('tp-cat-'+id);
  const text = inp ? inp.value.trim() : t.text;
  if (!text) return;
  t.text     = text;
  if (prEl)  t.priority = prEl.value  || null;
  if (duEl)  t.dueDate  = duEl.value  || null;
  if (catEl) t.cat      = catEl.value || null;
  const notesEl = document.getElementById('tp-notes-'+id);
  if (notesEl) t.notes = notesEl.value.trim() || null;
  const expEl = document.getElementById('tp-exp-'+id);
  if (expEl) t.expenseId = expEl.value || null;
  todoEditId = null;
  save(); renderTodo();
}

function toggleTodo(id) {
  const t = todoItems.find(t=>t.id===id); if (!t) return;
  t.done = !t.done;
  save(); renderTodo(); updateTodoBadge();
}

function deleteTodo(id) {
  todoItems = todoItems.filter(t=>t.id!==id);
  save(); renderTodo();
}

function clearDoneTodos() {
  if (!confirm('Effacer toutes les tâches terminées ?')) return;
  todoItems = todoItems.filter(t=>!t.done);
  todoDoneOpen = false;
  save(); renderTodo();
}

function selectTodoCat(itemId, catId) {
  const inp = document.getElementById('tp-cat-'+itemId);
  if (!inp) return;
  inp.value = catId;
  const cats = settings.todoCategories || [];
  const wrap = inp.nextElementSibling;
  if (!wrap) return;
  // Bouton "Aucune" (premier enfant, pas de data-cid)
  const noneBtn = wrap.querySelector('button:first-child');
  if (noneBtn) { noneBtn.style.background = !catId ? 'var(--surface2)' : 'transparent'; }
  // Boutons catégories
  wrap.querySelectorAll('button[data-cid]').forEach(b => {
    const c = cats.find(c => c.id === b.dataset.cid);
    const col = c?.color || 'var(--accent)';
    const sel = b.dataset.cid === catId;
    b.style.background = sel ? col : 'transparent';
    b.style.color = sel ? '#fff' : col;
  });
}

function cycleTodoCat(id) {
  const t = todoItems.find(t=>t.id===id); if (!t) return;
  const cats = settings.todoCategories||[];
  if (!cats.length) { toast('Crée d\'abord une catégorie'); return; }
  const idx = cats.findIndex(c=>c.id===t.cat);
  t.cat = idx<cats.length-1 ? cats[idx+1].id : null;
  save(); renderTodo();
}

function addTodoCat() {
  const inp = document.getElementById('new-todo-cat');
  const name = inp.value.trim(); if (!name) return;
  if (!settings.todoCategories) settings.todoCategories = [];
  settings.todoCategories.push({id:uid(), name});
  inp.value = '';
  save(); renderTodo();
}

function openEditTodoCat(id) { todoEditCatId=id; renderTodo(); }

function saveTodoCat(id) {
  const nameEl  = document.getElementById('edit-cat-name-'+id);
  const colorEl = document.getElementById('edit-cat-color-'+id);
  const name = nameEl ? nameEl.value.trim() : ''; if (!name) return;
  const cat = (settings.todoCategories||[]).find(c=>c.id===id); if (!cat) return;
  cat.name  = name;
  cat.color = colorEl ? colorEl.value : cat.color;
  todoEditCatId = null;
  save(); renderTodo();
}

// ── Lien Todo↔Dépense ────────────────────────────
function filterTodoExpPicker(itemId) {
  const q    = (document.getElementById('tp-exp-search-'+itemId)?.value||'').toLowerCase().trim();
  const list = document.getElementById('tp-exp-list-'+itemId);
  if (!list) return;
  const catMap = getCatMap();
  const matches = expenses
    .filter(e => e.catId !== 'cash')
    .filter(e => !q ||
      (e.enseigne||'').toLowerCase().includes(q) ||
      (e.desc||'').toLowerCase().includes(q) ||
      (catMap[e.catId]?.lbl||'').toLowerCase().includes(q) ||
      e.date.includes(q))
    .sort((a,b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  if (!matches.length) {
    list.innerHTML = `<div style="font-size:12px;color:var(--text3);padding:6px 8px">Aucune dépense trouvée</div>`;
    return;
  }
  list.innerHTML = matches.map(e => {
    const lbl = e.enseigne ? escHtml(e.enseigne) : (catMap[e.catId]?.lbl||'Divers');
    return `<div onclick="selectTodoExp('${itemId}','${e.id}')"
      style="display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:var(--surface2);border-radius:8px;cursor:pointer;font-size:12px">
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);font-weight:600">${lbl} <span style="color:var(--text3);font-weight:400">· ${formatDate(e.date)}</span></span>
      <span style="flex-shrink:0;font-weight:700;font-family:var(--fm);color:var(--text2);margin-left:8px">${fmtEur(expenseEur(e),2)}</span>
    </div>`;
  }).join('');
}

function selectTodoExp(itemId, expId) {
  const inp = document.getElementById('tp-exp-'+itemId);
  if (inp) inp.value = expId;
  const e = expenses.find(x => x.id === expId);
  if (!e) return;
  const catMap = getCatMap();
  const lbl = e.enseigne ? escHtml(e.enseigne) : (catMap[e.catId]?.lbl||'Divers');
  const display = document.getElementById('tp-exp-display-'+itemId);
  const picker  = document.getElementById('tp-exp-picker-'+itemId);
  if (display) {
    display.style.display = 'flex';
    display.innerHTML = `
      <span style="flex:1;min-width:0;font-size:12px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        ${lbl} · ${formatDate(e.date)} · ${fmtEur(expenseEur(e),2)}
      </span>
      <button type="button" onclick="clearTodoExp('${itemId}')"
        style="flex-shrink:0;background:none;border:none;cursor:pointer;color:var(--text3);padding:2px">
        ${icon('xmark',12,'var(--text3)')}
      </button>`;
  }
  if (picker) picker.style.display = 'none';
}

function clearTodoExp(itemId) {
  const inp = document.getElementById('tp-exp-'+itemId);
  if (inp) inp.value = '';
  const search = document.getElementById('tp-exp-search-'+itemId);
  if (search) search.value = '';
  const list = document.getElementById('tp-exp-list-'+itemId);
  if (list) list.innerHTML = '';
  const display = document.getElementById('tp-exp-display-'+itemId);
  const picker  = document.getElementById('tp-exp-picker-'+itemId);
  if (display) display.style.display = 'none';
  if (picker)  picker.style.display  = 'block';
}

function deleteTodoCat(id) {
  if (!confirm('Supprimer cette catégorie ?')) return;
  settings.todoCategories = (settings.todoCategories||[]).filter(c=>c.id!==id);
  todoItems.forEach(t=>{ if(t.cat===id) t.cat=null; });
  todoEditCatId = null;
  save(); renderTodo();
}
