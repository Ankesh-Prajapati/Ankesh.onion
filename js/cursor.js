// =====================================================================
// CURSOR — standard pointer shape, tinted to match the active theme.
// No custom crosshair, no DOM element following the mouse. We simply
// generate a tiny SVG arrow cursor in the current accent color and set
// it via CSS `cursor:url()`, keeping things minimal and immersive.
// =====================================================================
(function () {
  function currentAccent() {
    const val = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    return val || '#00ff9d';
  }

  function buildCursorDataUri(color) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <path d="M2 1.5 L2 18 L6.2 14.2 L9 20 L11.3 19 L8.6 13 L14 13 Z"
        fill="${color}" stroke="#0d1117" stroke-width="1" stroke-linejoin="round"/>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function applyCursor() {
    const uri = buildCursorDataUri(currentAccent());
    document.documentElement.style.setProperty('--cursor-url', `url("${uri}") 2 1, auto`);
    document.body.style.cursor = `url("${uri}") 2 1, auto`;
  }

  document.addEventListener('DOMContentLoaded', applyCursor);
  // Re-tint whenever the theme changes (theme.js dispatches this event).
  window.addEventListener('themechange', applyCursor);
})();
