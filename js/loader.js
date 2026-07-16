// =====================================================================
// FAST BOOT SEQUENCE — quick terminal-style boot (~1-1.5s total)
// then hands off to the desktop.
// =====================================================================
(function () {
  const linesEl = document.getElementById('bootLines');
  const screen = document.getElementById('loadingScreen');
  if (!linesEl || !screen) { initDesktop(); initDesktopBg(); return; }

  const BOOT_STEPS = [
    'booting ankesh-os v2.5.1 ...',
    'mounting /home/ankesh ... <span class="boot-ok">OK</span>',
    'loading security modules ... <span class="boot-ok">OK</span>',
    'starting desktop environment ... <span class="boot-ok">OK</span>'
  ];

  let i = 0;
  function printNext() {
    if (i >= BOOT_STEPS.length) {
      setTimeout(finish, 250);
      return;
    }
    const line = document.createElement('div');
    line.className = 'boot-line';
    line.innerHTML = '<span class="boot-ok">$</span> ' + BOOT_STEPS[i];
    linesEl.appendChild(line);
    i++;
    setTimeout(printNext, 220);
  }

  function finish() {
    screen.style.opacity = '0';
    setTimeout(function () {
      if (screen.parentNode) screen.parentNode.removeChild(screen);
      initDesktop();
      initDesktopBg();
    }, 250);
  }

  printNext();
})();
