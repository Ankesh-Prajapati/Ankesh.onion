// ════════════════════════════════════════════════════════════════
// TETRIS ENGINE
// ════════════════════════════════════════════════════════════════
(function(){
  var COLS = 10, ROWS = 20, BLOCK = 26; // BLOCK recalculated in init()
  var canvas, ctx, nextCvs, nextCtx;
  var board, piece, nextPiece;
  var score, level, lines, best;
  var dropInterval, lastDrop, animId;
  var state = 'idle'; // idle | playing | paused | over

  var COLORS = {
    I:'#00f5ff', O:'#febc2e', T:'#b06fff',
    S:'#28c840', Z:'#ff3355', J:'#58a6ff', L:'#ff6d00'
  };

  var PIECES = {
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O:[[1,1],[1,1]],
    T:[[0,1,0],[1,1,1],[0,0,0]],
    S:[[0,1,1],[1,1,0],[0,0,0]],
    Z:[[1,1,0],[0,1,1],[0,0,0]],
    J:[[1,0,0],[1,1,1],[0,0,0]],
    L:[[0,0,1],[1,1,1],[0,0,0]]
  };

  var PIECE_KEYS = Object.keys(PIECES);
  var bag = [], bagNext = [];

  function shuffleBag(arr){
    for(var i=arr.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1));
      var t=arr[i]; arr[i]=arr[j]; arr[j]=t;
    }
    return arr;
  }
  function refillBag(b){ return shuffleBag(PIECE_KEYS.slice()); }

  function nextFromBag(){
    if(!bag.length) bag = refillBag();
    return bag.pop();
  }

  function makePiece(type){
    return {
      type: type,
      matrix: PIECES[type].map(function(r){ return r.slice(); }),
      x: Math.floor(COLS/2) - Math.floor(PIECES[type][0].length/2),
      y: 0,
      color: COLORS[type]
    };
  }

  function init(){
    canvas  = document.getElementById('tetrisCanvas');
    nextCvs = document.getElementById('tetrisNext');
    if(!canvas || !nextCvs) return;
    canvas.width  = COLS * BLOCK;
    canvas.height = ROWS * BLOCK;
    ctx     = canvas.getContext('2d');
    nextCtx = nextCvs.getContext('2d');
    best = 0;
    try { best = parseInt(localStorage.getItem('tetris_best')||'0'); } catch(e){}
    var b = document.getElementById('tetBest'); if(b) b.textContent = best;
  }

  function startGame(){
    if(window.stopDemo) window.stopDemo();
    board = Array.from({length:ROWS}, function(){ return new Array(COLS).fill(0); });
    bag = refillBag();
    score = 0; level = 1; lines = 0;
    updateHUD();
    piece     = makePiece(nextFromBag());
    nextPiece = makePiece(nextFromBag());
    state = 'playing';
    hideOverlay();
    var btn = document.getElementById('tetBtn'); if(btn) btn.textContent = '⏸ PAUSE';
    var sb = document.getElementById('tetBtnSide'); if(sb){ sb.style.display='block'; sb.textContent='⏸ PAUSE'; }
    lastDrop = performance.now();
    if(animId) cancelAnimationFrame(animId);
    gameLoop(lastDrop);

    // Focus canvas for key events
    canvas.setAttribute('tabindex','0');
    canvas.focus();
  }

  function gameLoop(ts){
    if(state !== 'playing'){ return; }
    animId = requestAnimationFrame(gameLoop);
    var interval = Math.max(80, 600 - (level-1)*55);
    if(ts - lastDrop >= interval){
      lastDrop = ts;
      dropPiece();
    }
    draw();
  }

  function dropPiece(){
    piece.y++;
    if(collides(piece)){
      piece.y--;
      lock();
    }
  }

  function hardDrop(){
    while(!collides({matrix:piece.matrix, x:piece.x, y:piece.y+1})){
      piece.y++;
      score += 2;
    }
    lock();
    updateHUD();
  }

  function lock(){
    piece.matrix.forEach(function(row,r){
      row.forEach(function(v,c){
        if(v) board[piece.y+r][piece.x+c] = piece.color;
      });
    });
    clearLines();
    piece = nextPiece;
    nextPiece = makePiece(nextFromBag());
    if(collides(piece)){
      gameOver();
      return;
    }
    drawNext();
  }

  function clearLines(){
    var cleared = 0;
    for(var r=ROWS-1;r>=0;r--){
      if(board[r].every(function(v){ return v!==0; })){
        board.splice(r,1);
        board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if(cleared){
      var pts = [0,100,300,500,800][cleared] * level;
      score += pts;
      lines += cleared;
      level = Math.floor(lines/10)+1;
      updateHUD();
      // Flash effect
      flashLines();
    }
  }

  function flashLines(){
    ctx.fillStyle = 'rgba(0,255,157,0.18)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function collides(p){
    return p.matrix.some(function(row,r){
      return row.some(function(v,c){
        if(!v) return false;
        var nx = p.x+c, ny = p.y+r;
        return nx<0 || nx>=COLS || ny>=ROWS || (ny>=0 && board[ny][nx]!==0);
      });
    });
  }

  function rotate(p){
    var m = p.matrix;
    var N = m.length;
    var rotated = Array.from({length:N}, function(_,r){
      return Array.from({length:N}, function(_,c){ return m[N-1-c][r]; });
    });
    var kicked = {matrix:rotated, x:p.x, y:p.y, type:p.type, color:p.color};
    // Wall kick
    var kicks = [0,-1,1,-2,2];
    for(var k=0;k<kicks.length;k++){
      kicked.x = p.x + kicks[k];
      if(!collides(kicked)){ p.matrix=rotated; p.x=kicked.x; return; }
    }
  }

  function ghostRow(){
    var gy = piece.y;
    while(!collides({matrix:piece.matrix, x:piece.x, y:gy+1})) gy++;
    return gy;
  }

  function draw(){
    // Background
    ctx.fillStyle = '#060a0d';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,157,0.04)';
    ctx.lineWidth = 0.5;
    for(var c=0;c<=COLS;c++){ ctx.beginPath(); ctx.moveTo(c*BLOCK,0); ctx.lineTo(c*BLOCK,canvas.height); ctx.stroke(); }
    for(var r=0;r<=ROWS;r++){ ctx.beginPath(); ctx.moveTo(0,r*BLOCK); ctx.lineTo(canvas.width,r*BLOCK); ctx.stroke(); }

    // Board
    board.forEach(function(row,r){
      row.forEach(function(v,c){
        if(v) drawBlock(ctx, c, r, v, 1);
      });
    });

    // Ghost piece
    var gy = ghostRow();
    if(gy !== piece.y){
      piece.matrix.forEach(function(row,r){
        row.forEach(function(v,c){
          if(v) drawBlock(ctx, piece.x+c, gy+r, piece.color, 0.18);
        });
      });
    }

    // Active piece
    piece.matrix.forEach(function(row,r){
      row.forEach(function(v,c){
        if(v) drawBlock(ctx, piece.x+c, piece.y+r, piece.color, 1);
      });
    });
  }

  function drawBlock(c, x, y, color, alpha){
    c.save();
    c.globalAlpha = alpha;
    // Fill
    c.fillStyle = color;
    c.fillRect(x*BLOCK+1, y*BLOCK+1, BLOCK-2, BLOCK-2);
    // Shine
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(x*BLOCK+2, y*BLOCK+2, BLOCK-4, 4);
    // Glow border
    if(alpha > 0.5){
      c.shadowColor = color;
      c.shadowBlur  = 6;
      c.strokeStyle = color;
      c.lineWidth   = 0.8;
      c.strokeRect(x*BLOCK+1, y*BLOCK+1, BLOCK-2, BLOCK-2);
    }
    c.restore();
  }

  function drawNext(){
    nextCtx.fillStyle = '#0a0d10';
    nextCtx.fillRect(0,0,nextCvs.width,nextCvs.height);
    if(!nextPiece) return;
    var m   = nextPiece.matrix;
    var bsz = 18;
    var ox  = Math.floor((nextCvs.width  - m[0].length*bsz) / 2);
    var oy  = Math.floor((nextCvs.height - m.length   *bsz) / 2);
    m.forEach(function(row,r){
      row.forEach(function(v,c){
        if(v){
          nextCtx.fillStyle = nextPiece.color;
          nextCtx.shadowColor = nextPiece.color;
          nextCtx.shadowBlur  = 5;
          nextCtx.fillRect(ox+c*bsz+1, oy+r*bsz+1, bsz-2, bsz-2);
        }
      });
    });
  }

  function drawIdleBoard(){
    if(!ctx) return;
    ctx.fillStyle = '#060a0d';
    ctx.fillRect(0,0,COLS*BLOCK,ROWS*BLOCK);
    ctx.strokeStyle = 'rgba(0,255,157,0.04)';
    ctx.lineWidth = 0.5;
    for(var c=0;c<=COLS;c++){ ctx.beginPath(); ctx.moveTo(c*BLOCK,0); ctx.lineTo(c*BLOCK,ROWS*BLOCK); ctx.stroke(); }
    for(var r=0;r<=ROWS;r++){ ctx.beginPath(); ctx.moveTo(0,r*BLOCK); ctx.lineTo(COLS*BLOCK,r*BLOCK); ctx.stroke(); }
  }

  function updateHUD(){
    document.getElementById('tetScore').textContent = score;
    document.getElementById('tetLevel').textContent = level;
    document.getElementById('tetLines').textContent = lines;
    if(score > best){
      best = score;
      document.getElementById('tetBest').textContent = best;
      try { localStorage.setItem('tetris_best', best); } catch(e){}
    }
  }

  function showGameScreen(){
    var idle = document.getElementById('tetIdleScreen');
    var game = document.getElementById('tetGameScreen');
    if(idle) idle.style.display = 'none';
    if(game){ game.style.display = 'flex'; }
  }

  function showIdleScreen(){
    var idle = document.getElementById('tetIdleScreen');
    var game = document.getElementById('tetGameScreen');
    if(game) game.style.display = 'none';
    if(idle) idle.style.display = 'flex';
    // Update best on idle screen too
    var bi = document.getElementById('tetBestIdle');
    if(bi) bi.textContent = best;
    startDemo();
  }

  function gameOver(){
    state = 'over';
    cancelAnimationFrame(animId);
    // Show pause/gameover overlay on top of game screen
    var ov = document.getElementById('tetOverlay');
    var title = document.getElementById('tetOverlayTitle');
    var sub   = document.getElementById('tetOverlaySub');
    if(title) title.textContent = 'GAME OVER';
    if(sub)   sub.textContent   = 'Score: ' + score + '  ·  Best: ' + best;
    if(ov)    ov.style.display  = 'flex';
  }

  function hideOverlay(){
    var ov = document.getElementById('tetOverlay');
    if(ov) ov.style.display = 'none';
  }

  function showPause(){
    var ov    = document.getElementById('tetOverlay');
    var title = document.getElementById('tetOverlayTitle');
    var sub   = document.getElementById('tetOverlaySub');
    if(title) title.textContent = 'PAUSED';
    if(sub)   sub.textContent   = 'Press P to resume';
    if(ov)    ov.style.display  = 'flex';
  }

  // Go back to main menu
  window.tetrisBackToMenu = function(){
    state = 'idle';
    cancelAnimationFrame(animId);
    hideOverlay();
    showIdleScreen();
  };

  // Public start/pause/resume toggle
  window.tetrisStartOrRestart = function(){
    if(state === 'idle' || state === 'over'){
      if(state === 'over') hideOverlay();
      showGameScreen();
      init();
      startGame();
    } else if(state === 'playing'){
      state = 'paused';
      cancelAnimationFrame(animId);
      showPause();
      var btn = document.getElementById('tetBtn');
      if(btn) btn.textContent = '▶ RESUME';
    } else if(state === 'paused'){
      state = 'playing';
      hideOverlay();
      var btn = document.getElementById('tetBtn');
      if(btn) btn.textContent = '⏸ PAUSE';
      lastDrop = performance.now();
      gameLoop(lastDrop);
    }
  };

  // Keyboard controls — only when tetris window is focused/open
  document.addEventListener('keydown', function(e){
    var win = document.getElementById('win-tetris');
    if(!win || win.style.display === 'none' || win.classList.contains('minimized')) return;
    if(state !== 'playing') {
      if(e.code === 'Space'){ e.preventDefault(); tetrisStartOrRestart(); }
      return;
    }
    switch(e.code){
      case 'ArrowLeft':  e.preventDefault(); piece.x--; if(collides(piece)) piece.x++; break;
      case 'ArrowRight': e.preventDefault(); piece.x++; if(collides(piece)) piece.x--; break;
      case 'ArrowDown':  e.preventDefault(); piece.y++; if(collides(piece)) piece.y--; score++; updateHUD(); break;
      case 'ArrowUp':    e.preventDefault(); rotate(piece); break;
      case 'Space':      e.preventDefault(); hardDrop(); break;
      case 'KeyP':       e.preventDefault(); tetrisStartOrRestart(); break;
    }
    draw();
  });

  // tetrisInit called by openWindow in main script
  window.tetrisInit = function(){
    best = 0;
    try { best = parseInt(localStorage.getItem('tetris_best')||'0'); } catch(e){}
    var bi = document.getElementById('tetBestIdle');
    if(bi) bi.textContent = best;
    var b = document.getElementById('tetBest');
    if(b) b.textContent = best;
    showIdleScreen();
  };

  // ── DEMO ANIMATION — random pieces fall on idle screen ────────
  var demoAnim = null;
  var demoPieces = [];
  var DEMO_COLS = ['#00f5ff','#00ff9d','#b06fff','#febc2e','#ff3355','#58a6ff','#ff6d00'];
  var DEMO_SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,1,0],[0,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]]
  ];

  function startDemo(){
    var dc = document.getElementById('tetDemoCanvas');
    if(!dc) return;
    var overlay = document.getElementById('tetOverlay');
    if(!overlay) return;
    dc.width  = overlay.offsetWidth  || 400;
    dc.height = overlay.offsetHeight || 500;
    var dctx = dc.getContext('2d');
    var BSZ  = 22;
    demoPieces = [];

    // Spawn a piece at random column
    function spawnDemo(){
      var shape = DEMO_SHAPES[Math.floor(Math.random()*DEMO_SHAPES.length)];
      var color = DEMO_COLS[Math.floor(Math.random()*DEMO_COLS.length)];
      var maxX  = Math.max(0, dc.width - shape[0].length * BSZ);
      demoPieces.push({
        shape: shape, color: color,
        x: Math.floor(Math.random() * (maxX / BSZ)) * BSZ,
        y: -shape.length * BSZ,
        speed: 0.6 + Math.random() * 1.2,
        rot: 0, rotSpeed: (Math.random()-0.5)*0.02
      });
    }

    // Spawn a few to start
    for(var i=0;i<5;i++){
      spawnDemo();
      demoPieces[i].y = Math.random() * dc.height;
    }

    var spawnTimer = 0;
    function demoLoop(){
      if(state !== 'idle'){ return; }
      demoAnim = requestAnimationFrame(demoLoop);

      dctx.clearRect(0,0,dc.width,dc.height);

      // Spawn new piece every ~60 frames
      spawnTimer++;
      if(spawnTimer > 55){ spawnTimer=0; spawnDemo(); }

      // Update + draw pieces
      for(var i=demoPieces.length-1;i>=0;i--){
        var p = demoPieces[i];
        p.y += p.speed;
        p.rot += p.rotSpeed;
        if(p.y > dc.height + 80){ demoPieces.splice(i,1); continue; }

        dctx.save();
        var cx = p.x + (p.shape[0].length*BSZ)/2;
        var cy = p.y + (p.shape.length*BSZ)/2;
        dctx.translate(cx, cy);
        dctx.rotate(p.rot);
        dctx.translate(-cx, -cy);

        p.shape.forEach(function(row,r){
          row.forEach(function(v,c){
            if(!v) return;
            var bx = p.x + c*BSZ;
            var by = p.y + r*BSZ;
            // Block fill
            dctx.fillStyle = p.color;
            dctx.shadowColor = p.color;
            dctx.shadowBlur  = 8;
            dctx.beginPath();
            dctx.roundRect ? dctx.roundRect(bx+1,by+1,BSZ-2,BSZ-2,2) : dctx.rect(bx+1,by+1,BSZ-2,BSZ-2);
            dctx.fill();
            // Shine
            dctx.shadowBlur = 0;
            dctx.fillStyle = 'rgba(255,255,255,0.2)';
            dctx.fillRect(bx+2,by+2,BSZ-4,3);
          });
        });
        dctx.restore();
      }
    }

    if(demoAnim) cancelAnimationFrame(demoAnim);
    demoLoop();
  }

  // Stop demo when game starts
  window.stopDemo = function(){
    if(demoAnim){ cancelAnimationFrame(demoAnim); demoAnim=null; }
    var dc = document.getElementById('tetDemoCanvas');
    if(dc){ var c=dc.getContext('2d'); c.clearRect(0,0,dc.width,dc.height); }
  };

})();