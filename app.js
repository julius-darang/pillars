const STORAGE_KEY = 'ritual_jd_v1';
const PILLARS = ['mind','body','soul'];
const CIRCUMFERENCE = 113.1;
const PILLAR_ICONS = {
  mind: ['📖','✍️','🧠','🎯','💡','📝','🔬','🎓','🗺️','🔭','♟️','📐'],
  body: ['🏋️','🤸','🚶','🚴','💪','🏃','🥗','💧','🧘','🏊','⚽','🥊'],
  soul: ['🧘','📿','✨','🌿','🕯️','🙏','🌅','💭','🎨','🎵','📖','🌊'],
};
const DEFAULT_HABITS = {
  mind: [
    { id:'m1', icon:'📖', name:'Read for 30 minutes', hint:'Books, articles, or deep dives' },
    { id:'m2', icon:'✍️', name:'Journal one page', hint:'Reflect, plan, or free-write' },
    { id:'m3', icon:'🎯', name:'Deep work session', hint:'No distraction, single task' },
  ],
  body: [
    { id:'b1', icon:'🏋️', name:'Strength or movement', hint:'Any training counts' },
    { id:'b2', icon:'💧', name:'Drink 2L of water', hint:'Hydration is foundational' },
    { id:'b3', icon:'🚶', name:'Walk outside', hint:'Sunlight + steps' },
  ],
  soul: [
    { id:'s1', icon:'🧘', name:'Meditate 10 minutes', hint:'Still the noise' },
    { id:'s2', icon:'🙏', name:'Practice gratitude', hint:"Three things you're grateful for" },
    { id:'s3', icon:'🌅', name:'No screens first hour', hint:'Own your morning' },
  ],
};

let selectedDate = dateKey(new Date());
function loadState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
let state = loadState();
if (!state.habits)    state.habits    = JSON.parse(JSON.stringify(DEFAULT_HABITS));
if (!state.logs)      state.logs      = {};
if (!state.collapsed) state.collapsed = {};
if (!state.weeklyGoal) state.weeklyGoal = 5;
if (!state.reminder)  state.reminder  = null;
saveState();

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todayKey() { return dateKey(new Date()); }
function shiftDate(k, n) { const d = new Date(k+'T12:00:00'); d.setDate(d.getDate()+n); return dateKey(d); }
function mondayOf(date) { const d = new Date(date); const dow = d.getDay(); d.setDate(d.getDate() - ((dow===0?7:dow)-1)); return d; }
function formatFull(k) { return new Date(k+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); }

function buildWeekStrip() {
  const strip = document.getElementById('week-strip');
  strip.innerHTML = '';
  const today = new Date(), monday = mondayOf(today), tk = todayKey();
  const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    const k = dateKey(d);
    const btn = document.createElement('button');
    btn.className = 'day-btn';
    btn.innerHTML = `<span class="day-name">${DAYS[i]}</span><span class="day-num">${d.getDate()}</span>`;
    if (k === selectedDate) btn.classList.add('selected');
    if (k === tk) btn.classList.add('today-marker');
    const log = state.logs[k] || {};
    const allIds = PILLARS.flatMap(p => (state.habits[p]||[]).map(h => h.id));
    const doneN = allIds.filter(id => log[id]).length;
    if (doneN > 0) { btn.classList.add('has-done'); if (allIds.length > 0 && doneN === allIds.length) btn.classList.add('full-done'); }
    btn.addEventListener('click', () => { selectedDate = k; buildWeekStrip(); renderAll(); });
    strip.appendChild(btn);
  }
  document.getElementById('week-label').textContent = formatFull(selectedDate);
}

function getHabitStreak(id) {
  let streak = 0, k = selectedDate;
  for (let i = 0; i < 365; i++) {
    if (state.logs[k] && state.logs[k][id]) { streak++; k = shiftDate(k,-1); } else break;
  }
  return streak;
}
function calcStreak() {
  let k = todayKey();
  if (!Object.values(state.logs[k]||{}).some(Boolean)) k = shiftDate(k,-1);
  let s = 0;
  for (let i = 0; i < 365; i++) {
    if (Object.values(state.logs[k]||{}).some(Boolean)) { s++; k = shiftDate(k,-1); } else break;
  }
  return s;
}
function calcBest() {
  const keys = Object.keys(state.logs).sort();
  let best = 0, cur = 0, prev = null;
  keys.forEach(k => {
    const done = Object.values(state.logs[k]||{}).some(Boolean);
    if (done) { cur = (prev && shiftDate(prev,1)===k) ? cur+1 : 1; if (cur>best) best=cur; prev=k; }
    else { cur = 0; prev = null; }
  });
  return Math.max(best, calcStreak());
}
function calcWeekPct() {
  const today = new Date(), monday = mondayOf(today);
  let done = 0, total = 0;
  const all = PILLARS.flatMap(p => state.habits[p]||[]);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    if (d > today) break;
    const k = dateKey(d);
    all.forEach(h => { total++; if (state.logs[k] && state.logs[k][h.id]) done++; });
  }
  return total === 0 ? 0 : Math.round((done/total)*100);
}

function isDone(id) { return !!(state.logs[selectedDate] && state.logs[selectedDate][id]); }

function toggleHabit(pillar, id) {
  if (!state.logs[selectedDate]) state.logs[selectedDate] = {};
  const was = state.logs[selectedDate][id];
  state.logs[selectedDate][id] = !was;
  saveState(); renderAll(); buildWeekStrip();
  const h = (state.habits[pillar]||[]).find(h => h.id===id);
  if (!was && h) {
    showToast('·', h.name);
    const row = document.querySelector(`[data-id="${id}"]`);
    if (row) { row.classList.add('just-done'); setTimeout(()=>row.classList.remove('just-done'),320); }
  }
}

function renderHabitRow(pillar, habit, index) {
  const done = isDone(habit.id), streak = getHabitStreak(habit.id);
  const div = document.createElement('div');
  div.className = `habit-row ${pillar}${done?' done':''}`;
  div.dataset.id = habit.id;
  div.dataset.index = index;
  div.draggable = true;
  div.innerHTML = `
    <div class="habit-check">
      <svg viewBox="0 0 10 8" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1,4 4,7 9,1"/>
      </svg>
    </div>
    <div class="habit-icon">${esc(habit.icon)}</div>
    <div class="habit-info">
      <div class="habit-name">${esc(habit.name)}</div>
      ${habit.hint ? `<div class="habit-hint">${esc(habit.hint)}</div>` : ''}
    </div>
    <div class="habit-streak">
      <span class="streak-fire">🔥</span>
      <span>${streak}d</span>
    </div>
    <div class="habit-acts">
      <button class="habit-act" data-action="edit">edit</button>
      <button class="habit-act del" data-action="delete">del</button>
    </div>`;
  div.addEventListener('click', e => { if (e.target.closest('.habit-acts')) return; toggleHabit(pillar, habit.id); });
  div.querySelector('[data-action="edit"]').addEventListener('click', e => { e.stopPropagation(); openEditModal(pillar, habit.id); });
  div.querySelector('[data-action="delete"]').addEventListener('click', e => { e.stopPropagation(); openDeleteModal(pillar, habit.id); });
  return div;
}

function renderList(pillar) {
  const list = document.getElementById(`list-${pillar}`);
  const habits = state.habits[pillar] || [];
  list.innerHTML = '';
  if (!habits.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">${{mind:'🧠',body:'💪',soul:'✨'}[pillar]}</div><div class="empty-label">No habits yet</div></div>`;
    return;
  }
  habits.forEach((h, i) => list.appendChild(renderHabitRow(pillar, h, i)));
}

function renderProgress(pillar) {
  const habits = state.habits[pillar] || [];
  const done = habits.filter(h => isDone(h.id)).length;
  const total = habits.length;
  const pct = total === 0 ? 0 : Math.round((done/total)*100);
  document.getElementById(`pct-${pillar}`).textContent = pct + '%';
  document.getElementById(`bar-${pillar}`).style.width = pct + '%';
  const banner = document.getElementById(`banner-${pillar}`);
  if (pct === 100 && total > 0) banner.classList.add('show'); else banner.classList.remove('show');
}

function renderStats() {
  let totalH = 0, doneH = 0;
  PILLARS.forEach(p => { (state.habits[p]||[]).forEach(h => { totalH++; if (isDone(h.id)) doneH++; }); });
  document.getElementById('stat-today').textContent = `${doneH}/${totalH}`;
  document.getElementById('stat-streak').textContent = calcStreak();
  document.getElementById('stat-best').textContent = calcBest();
  document.getElementById('stat-week').textContent = calcWeekPct() + '%';
}

function renderAll() {
  PILLARS.forEach(p => { renderList(p); renderProgress(p); });
  renderStats();
}

function toggleCollapse(pillar) {
  const section = document.getElementById(`section-${pillar}`);
  const btn = document.getElementById(`cbtn-${pillar}`);
  const now = section.classList.toggle('collapsed');
  btn.textContent = now ? 'expand' : 'collapse';
  state.collapsed[pillar] = now;
  saveState();
}
function restoreCollapsed() {
  PILLARS.forEach(p => {
    if (state.collapsed[p]) {
      document.getElementById(`section-${p}`).classList.add('collapsed');
      document.getElementById(`cbtn-${p}`).textContent = 'expand';
    }
  });
}

function openForm(pillar) {
  closeAllForms();
  document.getElementById(`form-${pillar}`).classList.add('open');
  document.getElementById(`input-${pillar}`).focus();
}
function closeForm(pillar) {
  document.getElementById(`form-${pillar}`).classList.remove('open');
  document.getElementById(`input-${pillar}`).value = '';
  document.getElementById(`hint-${pillar}`).value = '';
}
function closeAllForms() { PILLARS.forEach(p => closeForm(p)); }

function addHabit(pillar) {
  const nameEl = document.getElementById(`input-${pillar}`);
  const hintEl = document.getElementById(`hint-${pillar}`);
  const iconEl = document.getElementById(`icon-${pillar}`);
  const name = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }
  state.habits[pillar].push({ id: pillar[0]+Date.now(), icon: iconEl.value, name, hint: hintEl.value.trim() });
  saveState(); closeForm(pillar); renderAll();
  showToast('+', name + ' added');
}

PILLARS.forEach(p => {
  ['input','hint'].forEach(prefix => {
    document.getElementById(`${prefix}-${p}`).addEventListener('keydown', e => {
      if (e.key === 'Enter') addHabit(p);
      if (e.key === 'Escape') closeForm(p);
    });
  });
});

let editTarget = null;
function openEditModal(pillar, id) {
  const habit = (state.habits[pillar]||[]).find(h => h.id===id);
  if (!habit) return;
  editTarget = { pillar, id };
  const sel = document.getElementById('edit-icon');
  sel.innerHTML = '';
  PILLAR_ICONS[pillar].forEach(ic => {
    const o = document.createElement('option');
    o.value = ic; o.textContent = ic;
    if (ic === habit.icon) o.selected = true;
    sel.appendChild(o);
  });
  document.getElementById('edit-name').value = habit.name;
  document.getElementById('edit-hint').value = habit.hint || '';
  openOverlay('edit-overlay');
  setTimeout(() => document.getElementById('edit-name').focus(), 120);
}
function saveEdit() {
  if (!editTarget) return;
  const { pillar, id } = editTarget;
  const habit = (state.habits[pillar]||[]).find(h => h.id===id);
  if (!habit) return;
  const name = document.getElementById('edit-name').value.trim();
  if (!name) { document.getElementById('edit-name').focus(); return; }
  habit.icon = document.getElementById('edit-icon').value;
  habit.name = name;
  habit.hint = document.getElementById('edit-hint').value.trim();
  saveState(); closeEditModal(); renderAll();
  showToast('·', 'Habit updated');
}
function closeEditModal() { closeOverlay('edit-overlay'); editTarget = null; }
document.getElementById('edit-name').addEventListener('keydown', e => { if (e.key==='Enter') saveEdit(); if (e.key==='Escape') closeEditModal(); });

let deleteTarget = null;
function openDeleteModal(pillar, id) {
  const habit = (state.habits[pillar]||[]).find(h => h.id===id);
  if (!habit) return;
  deleteTarget = { pillar, id };
  document.getElementById('delete-name').textContent = habit.name;
  openOverlay('delete-overlay');
}
function confirmDelete() {
  if (!deleteTarget) return;
  const { pillar, id } = deleteTarget;
  state.habits[pillar] = (state.habits[pillar]||[]).filter(h => h.id !== id);
  saveState(); closeDeleteModal(); renderAll(); buildWeekStrip();
  showToast('·', 'Habit removed');
}
function closeDeleteModal() { closeOverlay('delete-overlay'); deleteTarget = null; }

function openSettings() { openOverlay('settings-overlay'); renderHistory(); renderGoal(); }
function closeSettings() { closeOverlay('settings-overlay'); }
function exportData() {
  const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href:url, download:`ritual-${todayKey()}.json` });
  a.click(); URL.revokeObjectURL(url);
  showToast('↓', 'Data exported');
}
function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.habits || !imported.logs) {
        alert('Invalid data format');
        return;
      }
      if (!confirm('This will replace your current data. Continue?')) return;
      state.habits = imported.habits;
      state.logs = imported.logs;
      state.collapsed = imported.collapsed || {};
      saveState();
      location.reload();
      showToast('↑', 'Data imported');
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function toggleReminder() {
  const timeInput = document.getElementById('reminder-time');
  if (!('Notification' in window)) {
    alert('Notifications not supported in this browser');
    return;
  }
  if (Notification.permission === 'granted') {
    state.reminder = state.reminder ? null : timeInput.value;
    saveState();
    showToast('🔔', state.reminder ? 'Reminder set' : 'Reminder off');
  } else {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        state.reminder = timeInput.value;
        saveState();
        showToast('🔔', 'Reminder enabled');
      }
    });
  }
}

function checkReminder() {
  if (!state.reminder || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const [h, m] = state.reminder.split(':').map(Number);
  if (now.getHours() === h && now.getMinutes() === m) {
    new Notification('Ritual', { body: 'Time to complete your daily habits!', icon: '📿' });
  }
}
setInterval(checkReminder, 60000);

function updateGoal(val) {
  state.weeklyGoal = Math.min(7, Math.max(1, parseInt(val) || 5));
  saveState();
  renderGoal();
}

function renderGoal() {
  const goal = state.weeklyGoal || 5;
  const weekDone = calcWeekPctFull();
  const done = weekDone.days;
  const pct = Math.min(100, (done / goal) * 100);
  const goalFill = document.getElementById('goal-fill');
  const goalText = document.getElementById('goal-text');
  const goalInput = document.getElementById('goal-input-settings');
  if (goalFill) goalFill.style.width = pct + '%';
  if (goalText) {
    goalText.textContent = done + '/' + goal + ' days';
    if (done >= goal) goalText.classList.add('complete');
    else goalText.classList.remove('complete');
  }
  if (goalInput) goalInput.value = goal;
}

function calcWeekPctFull() {
  const today = new Date(), monday = mondayOf(today);
  let daysDone = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    if (d > today) break;
    const k = dateKey(d);
    const all = PILLARS.flatMap(p => state.habits[p]||[]);
    const dayDone = all.some(h => state.logs[k] && state.logs[k][h.id]);
    if (dayDone) daysDone++;
  }
  return { days: daysDone };
}

function renderHistory() {
  const chart = document.getElementById('settings-history-chart');
  if (!chart) return;
  const today = new Date();
  chart.innerHTML = '';
  const all = PILLARS.flatMap(p => state.habits[p]||[]);
  if (all.length === 0) {
    chart.innerHTML = '<div class="chart-empty">No data yet</div>';
    return;
  }
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const k = dateKey(d);
    let dayDone = 0;
    all.forEach(h => { if (state.logs[k] && state.logs[k][h.id]) dayDone++; });
    const max = all.length;
    const pct = max === 0 ? 0 : (dayDone / max) * 100;
    const barHeight = Math.max(pct * 0.35, 3);
    const grp = document.createElement('div');
    grp.className = 'chart-bar-group';
    const bar = document.createElement('div');
    bar.className = 'chart-bar all';
    bar.style.height = barHeight + 'px';
    const lbl = document.createElement('span');
    lbl.className = 'chart-label';
    lbl.textContent = ['S','M','T','W','T','F','S'][d.getDay()];
    grp.appendChild(bar);
    grp.appendChild(lbl);
    chart.appendChild(grp);
  }
}

function initDragDrop() {
  let draggedEl = null;
  document.querySelectorAll('.habit-list').forEach(list => {
    list.addEventListener('dragstart', e => {
      if (e.target.classList.contains('habit-row')) {
        draggedEl = e.target;
        e.target.classList.add('dragging');
      }
    });
    list.addEventListener('dragend', e => {
      if (draggedEl) {
        draggedEl.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedEl = null;
      }
    });
    list.addEventListener('dragover', e => {
      e.preventDefault();
      const row = e.target.closest('.habit-row');
      if (row && row !== draggedEl) {
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        row.classList.add('drag-over');
      }
    });
    list.addEventListener('drop', e => {
      e.preventDefault();
      const targetRow = e.target.closest('.habit-row');
      if (!draggedEl || !targetRow || targetRow === draggedEl) return;
      const fromPillar = draggedEl.classList.contains('mind') ? 'mind' : draggedEl.classList.contains('body') ? 'body' : 'soul';
      const toPillar = targetRow.classList.contains('mind') ? 'mind' : targetRow.classList.contains('body') ? 'body' : 'soul';
      if (fromPillar !== toPillar) return;
      const fromIdx = parseInt(draggedEl.dataset.index);
      const toIdx = parseInt(targetRow.dataset.index);
      const arr = state.habits[fromPillar];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      saveState();
      renderAll();
    });
  });
}

function confirmReset() {
  if (!confirm('Reset ALL data? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function openOverlay(id) { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.overlay').forEach(el => { el.addEventListener('click', e => { if (e.target===el) el.classList.remove('open'); }); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'));
  closeAllForms();
});

function filterPillar(filter, btn) {
  document.querySelectorAll('.pillar-nav-tab').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
  PILLARS.forEach(p => {
    document.getElementById(`section-${p}`).classList.toggle('hidden', filter !== p);
  });
}

let toastTimer;
function showToast(icon, msg) {
  document.getElementById('t-icon').textContent = icon;
  document.getElementById('t-msg').textContent = msg;
  const t = document.getElementById('toast');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

buildWeekStrip();
restoreCollapsed();
renderAll();
initDragDrop();
// default: show mind only
PILLARS.forEach(p => {
  if (p !== 'mind') document.getElementById(`section-${p}`).classList.add('hidden');
});

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
