
// ══════════════════════════════════════════════════════════════
// DESKTOP ICON GRID — snap grid, drag on desktop only, responsive
// ══════════════════════════════════════════════════════════════
(function(){
  var STORE_KEY  = 'ankesh_icon_grid_v2';
  var CELL_W     = 82;   // grid cell width
  var CELL_H     = 86;   // grid cell height
  var PAD        = 10;   // edge padding
  var TASKBAR_H  = 44;

  var grid  = document.getElementById('desktopIcons');
  var icons = Array.from(grid.querySelectorAll('.icon'));

  // ── MOBILE: leave CSS in charge, no JS positioning ──────────
  function isMobile(){ return window.innerWidth <= 768; }

  function resetMobile(){
    grid.removeAttribute('style');
    icons.forEach(function(ic){
      ic.removeAttribute('style');
    });
  }

  // ── DESKTOP: absolute canvas ─────────────────────────────────
  function setupDesktop(){
    grid.style.cssText = [
      'position:fixed',
      'top:0','right:0','bottom:0','left:0',
      'width:100%','height:100%',
      'display:block',
      'pointer-events:none',
      'overflow:visible',
      'z-index:2'
    ].join(';');

    icons.forEach(function(ic){
      ic.style.position = 'absolute';
      ic.style.width    = CELL_W + 'px';
      ic.style.margin   = '0';
      ic.style.pointerEvents = 'all';
    });
  }

  // ── GRID HELPERS ─────────────────────────────────────────────
  // Returns {col, row} for a pixel position snapped to nearest cell
  function pixelToCell(x, y){
    var cols = availCols();
    var rows = availRows();
    var col  = Math.round(x / CELL_W);
    var row  = Math.round(y / CELL_H);
    col = Math.max(0, Math.min(cols - 1, col));
    row = Math.max(0, Math.min(rows - 1, row));
    return {col:col, row:row};
  }

  function cellToPixel(col, row){
    // Default: right-aligned columns counted from right edge
    var dw = window.innerWidth;
    var x  = dw - PAD - CELL_W - col * CELL_W;
    var y  = PAD + row * CELL_H;
    return {x:x, y:y};
  }

  function availRows(){ return Math.max(1, Math.floor((window.innerHeight - TASKBAR_H - PAD * 2) / CELL_H)); }
  function availCols(){ return Math.max(1, Math.floor((window.innerWidth  - PAD * 2) / CELL_W)); }

  // Default grid cell for icon index i (right-side columns)
  function defaultCell(i){
    var rows = availRows();
    var col  = Math.floor(i / rows);
    var row  = i % rows;
    return {col:col, row:row};
  }

  // ── SAVED POSITIONS ──────────────────────────────────────────
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch(e){}

  function saveCell(key, col, row){
    try {
      saved[key] = {col:col, row:row};
      localStorage.setItem(STORE_KEY, JSON.stringify(saved));
    } catch(e){}
  }

  function getKey(icon, i){
    var t = icon.getAttribute('title') || ('icon'+i);
    return 'ic_' + t.replace(/[^a-z0-9]/gi,'_').toLowerCase();
  }

  // ── POSITION ALL ICONS ───────────────────────────────────────
  // occupiedCells tracks which {col,row} are taken to prevent overlap
  function layoutIcons(keepSaved){
    var occupied = {};  // "col_row" → true

    icons.forEach(function(icon, i){
      var key  = getKey(icon, i);
      var cell;

      if(keepSaved && saved[key]){
        // Clamp to current screen size
        var rows = availRows();
        var cols = availCols();
        cell = {
          col: Math.min(saved[key].col, cols - 1),
          row: Math.min(saved[key].row, rows - 1)
        };
        // If that cell is taken, find next free one
        var cellKey = cell.col + '_' + cell.row;
        if(occupied[cellKey]){ cell = nextFreeCell(occupied); }
      } else {
        // Use default column layout, skip occupied
        cell = defaultCell(i);
        var cellKey = cell.col + '_' + cell.row;
        if(occupied[cellKey]){ cell = nextFreeCell(occupied); }
      }

      var ck = cell.col + '_' + cell.row;
      occupied[ck] = true;

      var px = cellToPixel(cell.col, cell.row);
      icon.style.left = px.x + 'px';
      icon.style.top  = px.y + 'px';
      icon._gridCol = cell.col;
      icon._gridRow = cell.row;
    });
  }

  function nextFreeCell(occupied){
    var rows = availRows();
    var cols = availCols();
    for(var c = 0; c < cols; c++){
      for(var r = 0; r < rows; r++){
        var ck = c + '_' + r;
        if(!occupied[ck]) return {col:c, row:r};
      }
    }
    return {col:0, row:0};
  }

  // ── DRAG ─────────────────────────────────────────────────────
  function makeDraggable(icon, i){
    var key = getKey(icon, i);
    var dragging = false, moved = false;
    var startX, startY, origLeft, origTop;

    icon.addEventListener('mousedown', function(e){
      if(e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startY = e.clientY;
      origLeft = parseInt(icon.style.left) || 0;
      origTop  = parseInt(icon.style.top)  || 0;
      icon.style.zIndex    = '9999';
      icon.style.opacity   = '0.85';
      icon.style.transform = 'scale(1.1)';
      icon.style.transition = 'none';
      e.stopPropagation();
    });

    document.addEventListener('mousemove', function(e){
      if(!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if(Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

      var dw = window.innerWidth;
      var dh = window.innerHeight - TASKBAR_H;
      var nx = Math.max(PAD, Math.min(dw - CELL_W - PAD, origLeft + dx));
      var ny = Math.max(PAD, Math.min(dh - CELL_H,       origTop  + dy));
      icon.style.left = nx + 'px';
      icon.style.top  = ny + 'px';
    });

    document.addEventListener('mouseup', function(e){
      if(!dragging) return;
      dragging = false;
      icon.style.zIndex    = '';
      icon.style.opacity   = '1';
      icon.style.transform = '';
      icon.style.transition = '';

      if(moved){
        // Snap to nearest free grid cell
        var cx = parseInt(icon.style.left);
        var cy = parseInt(icon.style.top);

        // Convert pixel back to cell (relative to right edge)
        var dw   = window.innerWidth;
        var colFromRight = Math.round((dw - PAD - CELL_W - cx) / CELL_W);
        var row  = Math.round((cy - PAD) / CELL_H);
        var rows = availRows();
        var cols = availCols();
        colFromRight = Math.max(0, Math.min(cols - 1, colFromRight));
        row = Math.max(0, Math.min(rows - 1, row));

        // Check if that cell is occupied by another icon
        var targetCell = {col: colFromRight, row: row};
        var conflict = icons.find(function(ic2){
          return ic2 !== icon && ic2._gridCol === targetCell.col && ic2._gridRow === targetCell.row;
        });

        if(conflict){
          // Swap positions
          var tempCol = icon._gridCol, tempRow = icon._gridRow;
          conflict._gridCol = tempCol; conflict._gridRow = tempRow;
          var conflictKey = getKey(conflict, icons.indexOf(conflict));
          saveCell(conflictKey, tempCol, tempRow);
          var cp = cellToPixel(tempCol, tempRow);
          conflict.style.transition = 'left 0.2s, top 0.2s';
          conflict.style.left = cp.x + 'px';
          conflict.style.top  = cp.y + 'px';
          setTimeout(function(){ conflict.style.transition=''; }, 220);
        }

        icon._gridCol = targetCell.col;
        icon._gridRow = targetCell.row;
        saveCell(key, targetCell.col, targetCell.row);

        var sp = cellToPixel(targetCell.col, targetCell.row);
        icon.style.transition = 'left 0.15s, top 0.15s';
        icon.style.left = sp.x + 'px';
        icon.style.top  = sp.y + 'px';
        setTimeout(function(){ icon.style.transition=''; }, 160);

        // Suppress accidental dblclick after drag
        icon._suppress = true;
        setTimeout(function(){ icon._suppress = false; }, 200);
      }
    });

    icon.addEventListener('dblclick', function(e){
      if(icon._suppress) e.stopImmediatePropagation();
    });

    // Right-click → reset to default cell
    icon.addEventListener('contextmenu', function(e){
      e.preventDefault(); e.stopPropagation();
      delete saved[key];
      try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch(ex){}
      layoutIcons(true);
    });
  }

  // ── RESIZE: reflow icons that are now out of bounds ──────────
  function onResize(){
    if(isMobile()){ resetMobile(); return; }
    setupDesktop();
    layoutIcons(true); // keep saved cells but clamp to new screen
  }

  // ── INIT ─────────────────────────────────────────────────────
  function init(){
    if(isMobile()){ resetMobile(); return; }
    setupDesktop();
    layoutIcons(true);
    icons.forEach(function(icon, i){ makeDraggable(icon, i); });
  }

  window.addEventListener('resize', onResize);
  // Run after boot screen clears
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 200); });

})();