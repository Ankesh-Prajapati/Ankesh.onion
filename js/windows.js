// =====================================================================
// WINDOW MANAGER — open/close/minimize/maximize/focus/drag/resize
// =====================================================================
let activeWindow = null;
let zCounter = 10;
const windowState = {};
const windowMoved = {}; // tracks whether the user has manually repositioned a window

// Default open order used for cascading placement so windows never
// stack exactly on top of one another when opened programmatically.
const CASCADE_START = { top: 70, left: 110 };
const CASCADE_STEP = 34;
let cascadeIndex = 0;

function initDesktop() {
  // Open the two "welcome" windows staggered and pre-positioned so they
  // never overlap on startup.
  setTimeout(() => openWindow('about'), 150);
  setTimeout(() => openWindow('neofetch'), 450);
  animateSkillBars();
  initTerminal();
  buildWallpaperPicker();
}

function cascadePosition(win) {
  const top = CASCADE_START.top + (cascadeIndex % 6) * CASCADE_STEP;
  const left = CASCADE_START.left + (cascadeIndex % 6) * CASCADE_STEP * 1.6;
  win.style.top = top + 'px';
  win.style.left = left + 'px';
  cascadeIndex++;
}

function openWindow(name) {
  const win = document.getElementById('win-' + name);
  if (!win) return;
  const wasHidden = win.style.display === 'none' || !win.style.display;

  // If a window has no saved position yet and hasn't been moved by the
  // user, and it's being opened for the first time in this session at
  // its default spot, nudge it into a cascade slot to avoid stacking
  // exactly on top of another freshly-opened window.
  if (wasHidden && !windowMoved[name] && win.dataset.cascaded !== 'true' && win.dataset.noCascade !== 'true') {
    win.dataset.cascaded = 'true';
  }

  win.style.display = 'flex';
  win.classList.remove('minimized');
  focusWindow(win, name);
  updateTaskbar();
  if (name === 'skills') setTimeout(animateSkillBars, 100);
  if (name === 'wallpaper') { setTimeout(() => { buildPresetGrid(); initThemeWheel(); }, 60); }
  if (name === 'typingtest') { setTimeout(() => { if (!ttSnippet) { ttSnippet = getTTSnippet(); } renderTTDisplay(document.getElementById('ttInput')?.value || ''); }, 80); }
  if (name === 'tetris') { setTimeout(function () { if (typeof tetrisInit === 'function') tetrisInit(); }, 60); }
  showNotif('Opened', '~/' + name + ' loaded successfully');
}

function closeWindow(name) {
  const win = document.getElementById('win-' + name);
  if (!win) return;
  win.style.display = 'none';
  win.classList.remove('minimized', 'maximized', 'focused');
  updateTaskbar();
}

function minimizeWindow(name) {
  const win = document.getElementById('win-' + name);
  if (!win) return;
  win.classList.toggle('minimized');
  updateTaskbar();
}

function toggleMaximize(name) {
  const win = document.getElementById('win-' + name);
  if (!win) return;
  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    const s = windowState[name];
    if (s) { win.style.width = s.w; win.style.height = s.h; win.style.top = s.t; win.style.left = s.l; }
  } else {
    windowState[name] = { w: win.style.width, h: win.style.height, t: win.style.top, l: win.style.left };
    win.classList.add('maximized');
  }
  focusWindow(win, name);
}

function focusWindow(win, name) {
  document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
  win.classList.add('focused');
  win.style.zIndex = ++zCounter;
  activeWindow = name;
  updateTaskbar();
}

document.addEventListener('mousedown', (e) => {
  const win = e.target.closest('.window');
  if (win) {
    const name = win.dataset.win;
    if (name) focusWindow(win, name);
  }
});

function updateTaskbar() {
  const tasks = document.getElementById('taskbarTasks');
  tasks.innerHTML = '';
  const wins = ['about', 'skills', 'experience', 'projects', 'certs', 'contact', 'terminal', 'neofetch', 'wallpaper', 'snake', 'typingtest', 'tetris'];
  const labels = { about: '👤 about', skills: '⚡ skills', experience: '📋 experience', projects: '🛡️ projects', certs: '🎓 certs', contact: '📡 contact', terminal: '💻 terminal', neofetch: '🖥️ neofetch', wallpaper: '🎨 theme', snake: '🐍 snake', typingtest: '⌨️ hack.exe', tetris: '🎮 tetris.exe' };
  wins.forEach(n => {
    const win = document.getElementById('win-' + n);
    if (!win || win.style.display === 'none') return;
    const btn = document.createElement('button');
    btn.className = 'taskbar-task' + (activeWindow === n ? ' active' : '');
    btn.textContent = labels[n] || n;
    btn.onclick = () => {
      if (win.classList.contains('minimized')) { win.classList.remove('minimized'); }
      else if (activeWindow === n) { win.classList.add('minimized'); }
      focusWindow(win, n);
    };
    tasks.appendChild(btn);
  });
}

// ===================== DRAG (mouse) =====================
let dragState = null;
function startDrag(e, winId) {
  if (e.target.classList.contains('win-dot')) return;
  const win = document.getElementById(winId);
  if (win.classList.contains('maximized')) return;
  windowMoved[win.dataset.win] = true;
  dragState = { winId, startX: e.clientX, startY: e.clientY, origLeft: parseInt(win.style.left) || 0, origTop: parseInt(win.style.top) || 0 };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
}
function onDrag(e) {
  if (!dragState) return;
  const win = document.getElementById(dragState.winId);
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;
  win.style.left = (dragState.origLeft + dx) + 'px';
  win.style.top = Math.max(0, dragState.origTop + dy) + 'px';
}
function stopDrag() { dragState = null; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag); }

// ===================== RESIZE (mouse) =====================
let resizeState = null;
function startResize(e, winId) {
  const win = document.getElementById(winId);
  resizeState = { winId, startX: e.clientX, startY: e.clientY, origW: win.offsetWidth, origH: win.offsetHeight };
  win.style.height = win.offsetHeight + 'px'; // lock in current auto-height before manual resize
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault(); e.stopPropagation();
}
function onResize(e) {
  if (!resizeState) return;
  const win = document.getElementById(resizeState.winId);
  const w = Math.max(280, resizeState.origW + (e.clientX - resizeState.startX));
  const h = Math.max(180, resizeState.origH + (e.clientY - resizeState.startY));
  win.style.width = w + 'px'; win.style.height = h + 'px';
}
function stopResize() { resizeState = null; document.removeEventListener('mousemove', onResize); document.removeEventListener('mouseup', stopResize); }

// ===================== DRAG (touch) =====================
function startDragTouch(e, winId) {
  if (e.target.classList.contains('win-dot')) return;
  var win = document.getElementById(winId);
  if (!win || win.classList.contains('maximized')) return;
  windowMoved[win.dataset.win] = true;
  var t = e.touches[0];
  dragState = { winId: winId, startX: t.clientX, startY: t.clientY, origLeft: parseInt(win.style.left) || 0, origTop: parseInt(win.style.top) || 0 };
  document.addEventListener('touchmove', onDragTouch, { passive: false });
  document.addEventListener('touchend', stopDragTouch);
  e.preventDefault();
}
function onDragTouch(e) {
  if (!dragState) return;
  var win = document.getElementById(dragState.winId);
  var t = e.touches[0];
  win.style.left = (dragState.origLeft + (t.clientX - dragState.startX)) + 'px';
  win.style.top = Math.max(0, dragState.origTop + (t.clientY - dragState.startY)) + 'px';
  e.preventDefault();
}
function stopDragTouch() { dragState = null; document.removeEventListener('touchmove', onDragTouch); document.removeEventListener('touchend', stopDragTouch); }

// ===================== RESIZE (touch) =====================
function startResizeTouch(e, winId) {
  var win = document.getElementById(winId);
  var t = e.touches[0];
  resizeState = { winId: winId, startX: t.clientX, startY: t.clientY, origW: win.offsetWidth, origH: win.offsetHeight };
  win.style.height = win.offsetHeight + 'px';
  document.addEventListener('touchmove', onResizeTouch, { passive: false });
  document.addEventListener('touchend', stopResizeTouch);
  e.preventDefault(); e.stopPropagation();
}
function onResizeTouch(e) {
  if (!resizeState) return;
  var win = document.getElementById(resizeState.winId);
  var t = e.touches[0];
  win.style.width = Math.max(280, resizeState.origW + (t.clientX - resizeState.startX)) + 'px';
  win.style.height = Math.max(180, resizeState.origH + (t.clientY - resizeState.startY)) + 'px';
  e.preventDefault();
}
function stopResizeTouch() { resizeState = null; document.removeEventListener('touchmove', onResizeTouch); document.removeEventListener('touchend', stopResizeTouch); }

// Single-tap icons on mobile
function iconTap(e, name) { e.preventDefault(); openWindow(name); }

// ===================== SKILL BARS =====================
function animateSkillBars() {
  document.querySelectorAll('.skill-fill').forEach(bar => {
    const target = bar.dataset.w;
    setTimeout(() => { bar.style.width = target; }, 100);
  });
}

function openAllWindows() { ['about', 'skills', 'experience', 'projects', 'certs', 'contact', 'terminal', 'neofetch'].forEach(openWindow); }
function closeAllWindows() { ['about', 'skills', 'experience', 'projects', 'certs', 'contact', 'terminal', 'neofetch', 'wallpaper', 'snake', 'typingtest', 'tetris'].forEach(closeWindow); }
