// ══ SNAKE GAME ══════════════════════════════════════════════════════════════
var snakeState={player:"",score:0,hi:0,snake:[],dir:{x:1,y:0},nextDir:{x:1,y:0},
  food:{x:0,y:0},running:false,paused:false,dead:false,speed:130,tick:null,cols:20,rows:20,cell:16};

var SLB_KEY="snakeLB_v3";
function snakeGetLb(){try{var d=localStorage.getItem(SLB_KEY);return d?JSON.parse(d):[]}catch(e){return [];}}
function snakeSaveLb(lb){try{localStorage.setItem(SLB_KEY,JSON.stringify(lb));}catch(e){}}
function snakeSaveScore(name,score){
  var lb=snakeGetLb();
  var ex=lb.find(function(e){return e.name===name;});
  if(ex){if(score>ex.score)ex.score=score;}else{lb.push({name:name,score:score});}
  lb.sort(function(a,b){return b.score-a.score;});lb=lb.slice(0,10);snakeSaveLb(lb);return lb;
}

function startSnakeGame(){
  var inp=document.getElementById("snakeNameInput");
  var err=document.getElementById("snakeNameErr");
  // Strip any non-alphanumeric just in case
  inp.value=inp.value.replace(/[^a-zA-Z0-9]/g,"");
  var name=inp.value.trim();
  if(name.length<2){err.textContent="Min 2 chars required";return;}
  if(name.length>12){name=name.slice(0,12);inp.value=name;}
  err.textContent="";
  snakeState.player=name;
  var lb=snakeGetLb();var me=lb.find(function(e){return e.name===name;});
  snakeState.hi=me?me.score:0;
  document.getElementById("snakePlayerLabel").textContent=name;
  document.getElementById("snakeHiLabel").textContent=snakeState.hi;
  document.getElementById("snakeNameModal").style.display="none";
  document.getElementById("snakeHUD").style.display="flex";
  document.getElementById("snakeCanvasWrap").style.display="flex";
  // Show side panel and d-pad
  var sp=document.getElementById("snakeSidePanel");if(sp)sp.style.display="flex";
  // Show mobile dpad on touch devices
  if('ontouchstart' in window){
    var dp=document.getElementById("snakeDpadBottom");if(dp)dp.style.display="block";
  }
  snakeUpdateSidePanel();
  snakeInit();
}

function snakeInit(){
  var st=snakeState;
  var wrap=document.getElementById("snakeCanvasWrap");
  var canvas=document.getElementById("snakeCanvas");if(!canvas||!wrap)return;
  var w=wrap.clientWidth||340, h=wrap.clientHeight||340;
  // Reserve space for d-pad on mobile
  var avail=Math.min(w, h);
  st.cell=Math.max(12,Math.floor(avail/st.cols));
  canvas.width=st.cell*st.cols;canvas.height=st.cell*st.rows;
  st.snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  st.dir={x:1,y:0};st.nextDir={x:1,y:0};
  st.score=0;st.dead=false;st.paused=false;st.speed=130;
  document.getElementById("snakeScoreLabel").textContent="0";
  snakePlaceFood();
  if(st.tick)clearInterval(st.tick);
  st.running=true;
  document.getElementById("snakeDeadOverlay").style.display="none";
  document.getElementById("snakePauseOverlay").style.display="none";
  st.tick=setInterval(snakeTick,st.speed);
  requestAnimationFrame(snakeDraw);
}

function snakePlaceFood(){
  var st=snakeState,pos;
  do{pos={x:Math.floor(Math.random()*st.cols),y:Math.floor(Math.random()*st.rows)};}
  while(st.snake.some(function(s){return s.x===pos.x&&s.y===pos.y;}));
  st.food=pos;
}

function snakeTick(){
  var st=snakeState;if(!st.running||st.paused||st.dead)return;
  st.dir=st.nextDir;
  var head={x:st.snake[0].x+st.dir.x,y:st.snake[0].y+st.dir.y};
  if(head.x<0||head.x>=st.cols||head.y<0||head.y>=st.rows){snakeDie();return;}
  if(st.snake.some(function(s){return s.x===head.x&&s.y===head.y;})){snakeDie();return;}
  st.snake.unshift(head);
  if(head.x===st.food.x&&head.y===st.food.y){
    st.score+=10;
    document.getElementById("snakeScoreLabel").textContent=st.score;
    if(st.score>st.hi){st.hi=st.score;document.getElementById("snakeHiLabel").textContent=st.hi;}
    snakePlaceFood();
    if(st.speed>60){st.speed=Math.max(60,st.speed-5);clearInterval(st.tick);st.tick=setInterval(snakeTick,st.speed);}
  }else{st.snake.pop();}
}

function snakeRgb(hex){
  hex=(hex||"#00ff9d").replace(/[^0-9a-fA-F]/g,"");
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return parseInt(hex.slice(0,2),16)+","+parseInt(hex.slice(2,4),16)+","+parseInt(hex.slice(4,6),16);
}

function snakeDraw(){
  var st=snakeState;
  var canvas=document.getElementById("snakeCanvas");if(!canvas)return;
  var ctx=canvas.getContext("2d");
  var accent=(getComputedStyle(document.documentElement).getPropertyValue("--accent")||"#00ff9d").trim();
  var rgb=snakeRgb(accent);var c=st.cell;
  ctx.fillStyle="#000";ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="rgba(255,255,255,0.03)";ctx.lineWidth=0.5;
  for(var i=0;i<=st.cols;i++){ctx.beginPath();ctx.moveTo(i*c,0);ctx.lineTo(i*c,canvas.height);ctx.stroke();}
  for(var j=0;j<=st.rows;j++){ctx.beginPath();ctx.moveTo(0,j*c);ctx.lineTo(canvas.width,j*c);ctx.stroke();}
  // Glowing wall boundary
  var bw=2.5;
  ctx.save();
  ctx.shadowColor=accent;ctx.shadowBlur=14;
  ctx.strokeStyle=accent;ctx.lineWidth=bw;ctx.globalAlpha=0.85;
  ctx.strokeRect(bw/2,bw/2,canvas.width-bw,canvas.height-bw);
  ctx.restore();
  // Corner brackets
  var br=Math.min(20,c*1.4);
  ctx.save();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.globalAlpha=0.95;
  [[0,0,1,1],[canvas.width,0,-1,1],[0,canvas.height,1,-1],[canvas.width,canvas.height,-1,-1]].forEach(function(p){
    ctx.beginPath();ctx.moveTo(p[0]+p[2]*br,p[1]);ctx.lineTo(p[0],p[1]);ctx.lineTo(p[0],p[1]+p[3]*br);ctx.stroke();
  });
  ctx.restore();
  // Food pulse
  var pulse=0.6+0.4*Math.sin(Date.now()/300);
  ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=12*pulse;
  ctx.fillStyle=accent;ctx.beginPath();ctx.arc(st.food.x*c+c/2,st.food.y*c+c/2,c*0.38,0,Math.PI*2);ctx.fill();ctx.restore();
  // Snake segments
  for(var i=0;i<st.snake.length;i++){
    var seg=st.snake[i];var frac=1-i/st.snake.length;
    ctx.save();if(i===0){ctx.shadowColor=accent;ctx.shadowBlur=14;}
    ctx.fillStyle=i===0?accent:"rgba("+rgb+","+(0.2+0.8*frac)+")";
    var pad=i===0?1:2,rr=c*0.18;
    var x=seg.x*c+pad,y=seg.y*c+pad,w=c-pad*2,h=c-pad*2;
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.lineTo(x+w-rr,y);ctx.arcTo(x+w,y,x+w,y+rr,rr);
    ctx.lineTo(x+w,y+h-rr);ctx.arcTo(x+w,y+h,x+w-rr,y+h,rr);ctx.lineTo(x+rr,y+h);ctx.arcTo(x,y+h,x,y+h-rr,rr);
    ctx.lineTo(x,y+rr);ctx.arcTo(x,y,x+rr,y,rr);ctx.closePath();ctx.fill();ctx.restore();
    if(i===0){
      ctx.fillStyle="#000";
      var ex1={x:seg.x*c+c/2+st.dir.y*c*0.22+st.dir.x*c*0.25,y:seg.y*c+c/2-st.dir.x*c*0.22+st.dir.y*c*0.25};
      var ex2={x:seg.x*c+c/2-st.dir.y*c*0.22+st.dir.x*c*0.25,y:seg.y*c+c/2+st.dir.x*c*0.22+st.dir.y*c*0.25};
      ctx.beginPath();ctx.arc(ex1.x,ex1.y,c*0.09,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(ex2.x,ex2.y,c*0.09,0,Math.PI*2);ctx.fill();
    }
  }
  if(st.running&&!st.dead)requestAnimationFrame(snakeDraw);
}

function snakeDie(){
  var st=snakeState;st.dead=true;st.running=false;clearInterval(st.tick);
  snakeSaveScore(st.player,st.score);
  snakeUpdateSidePanel();
  var newBest=st.score>0&&st.score===st.hi;
  document.getElementById("snakeFinalScore").textContent="Score: "+st.score+(newBest?" 🏆 NEW BEST!":"");
  document.getElementById("snakeDeadOverlay").style.display="flex";
  var canvas=document.getElementById("snakeCanvas");
  if(canvas){var ctx=canvas.getContext("2d");ctx.fillStyle="rgba(255,51,85,0.14)";ctx.fillRect(0,0,canvas.width,canvas.height);}
}

function snakeUpdateSidePanel(){
  var list=document.getElementById("snakeSideLbList");if(!list)return;
  var lb=snakeGetLb();
  if(!lb.length){list.innerHTML='<div style="color:var(--muted);font-size:0.62rem;padding:12px 8px;text-align:center;">No scores yet</div>';return;}
  var medals=["\uD83E\uDD47","\uD83E\uDD48","\uD83E\uDD49"];
  list.innerHTML=lb.map(function(e,i){
    var me=e.name===snakeState.player;
    return '<div style="padding:7px 8px;border-bottom:1px solid #0f0f0f;display:flex;flex-direction:column;gap:1px;'+(me?"background:rgba(var(--accent-rgb),0.06);":"")+'">'+
      '<div style="display:flex;align-items:center;gap:5px;">'+
        '<span style="font-size:'+(i<3?"0.85rem":"0.68rem")+';width:18px;text-align:center;">'+(medals[i]||("#"+(i+1)))+'</span>'+
        '<span style="font-size:0.7rem;color:'+(me?"var(--accent)":"var(--text)")+';flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+e.name+'</span>'+
      '</div>'+
      '<div style="text-align:right;font-size:0.75rem;color:var(--accent);font-weight:700;padding-right:2px;">'+e.score+'</div>'+
    '</div>';
  }).join("");
}

function snakeRetry(){document.getElementById("snakeDeadOverlay").style.display="none";snakeInit();}
function snakeChangeUser(){
  var st=snakeState;if(st.tick)clearInterval(st.tick);st.running=false;
  document.getElementById("snakeDeadOverlay").style.display="none";
  document.getElementById("snakeCanvasWrap").style.display="none";
  document.getElementById("snakeHUD").style.display="none";
  document.getElementById("snakeNameInput").value="";
  document.getElementById("snakeNameErr").textContent="";
  document.getElementById("snakeNameModal").style.display="flex";
  var dp=document.getElementById("snakeDpadBottom");if(dp)dp.style.display="none";
}
function snakeTogglePause(){
  var st=snakeState;
  if(!st.running&&!st.paused)return;
  st.paused=!st.paused;
  document.getElementById("snakePauseOverlay").style.display=st.paused?"flex":"none";
}
function snakeMobileDir(x,y){
  if(x===0&&y===0){snakeTogglePause();return;}
  var d=snakeState.nextDir;
  if(x!==0&&d.x!==0)return;
  if(y!==0&&d.y!==0)return;
  snakeState.nextDir={x:x,y:y};
}

// Keyboard — skip entirely if any input/textarea is focused
window.addEventListener("keydown",function(e){
  var win=document.getElementById("win-snake");
  if(!win||win.style.display==="none")return;
  // Don't hijack keys when user is typing in an input
  if(document.activeElement&&(document.activeElement.tagName==="INPUT"||document.activeElement.tagName==="TEXTAREA"))return;
  var st=snakeState;var d=st.nextDir;
  if(e.key==="ArrowUp"||e.key==="w"||e.key==="W"){if(d.y===0){st.nextDir={x:0,y:-1};}e.preventDefault();}
  else if(e.key==="ArrowDown"||e.key==="s"||e.key==="S"){if(d.y===0){st.nextDir={x:0,y:1};}e.preventDefault();}
  else if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A"){if(d.x===0){st.nextDir={x:-1,y:0};}e.preventDefault();}
  else if(e.key==="ArrowRight"||e.key==="d"||e.key==="D"){if(d.x===0){st.nextDir={x:1,y:0};}e.preventDefault();}
  else if(e.key==="p"||e.key==="P"){snakeTogglePause();}
});
// ══ END SNAKE ════════════════════════════════════════════════════════════════// ════════════════════════════════════════════════════════════════
// SNAKE DEMO ANIMATION — crawling snake on idle screen
// ════════════════════════════════════════════════════════════════
(function(){
  var demoAnim = null;
  var snakes   = [];
  var foods    = [];
  var CELL     = 18;
  var dc, dctx, W, H, COLS, ROWS;

  var SNAKE_COLORS = [
    {head:'#00ff9d', body:'#00cc7a', glow:'rgba(0,255,157,0.6)'},
    {head:'#00f5ff', body:'#00b8cc', glow:'rgba(0,245,255,0.5)'},
    {head:'#b06fff', body:'#7a4dcc', glow:'rgba(176,111,255,0.5)'},
    {head:'#febc2e', body:'#cc960e', glow:'rgba(254,188,46,0.5)'}
  ];

  function initDemo(){
    dc = document.getElementById('snakeDemoCanvas');
    if(!dc) return;
    var modal = document.getElementById('snakeNameModal');
    W = modal ? modal.offsetWidth  : 500;
    H = modal ? modal.offsetHeight : 400;
    dc.width  = W;
    dc.height = H;
    dctx = dc.getContext('2d');
    COLS = Math.floor(W / CELL);
    ROWS = Math.floor(H / CELL);

    snakes = [];
    foods  = [];

    // Spawn 3 snakes crawling around
    for(var i = 0; i < 3; i++){
      spawnSnake(i);
    }
    // Spawn food pellets
    for(var f = 0; f < 8; f++){
      foods.push({
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      });
    }

    if(demoAnim) cancelAnimationFrame(demoAnim);
    var last = 0;
    var interval = 120; // ms per step

    function loop(ts){
      var modal = document.getElementById('snakeNameModal');
      if(!modal || modal.style.display === 'none'){
        demoAnim = null;
        return;
      }
      demoAnim = requestAnimationFrame(loop);
      if(ts - last < interval) { drawOnly(); return; }
      last = ts;
      stepAll();
      drawOnly();
    }
    demoAnim = requestAnimationFrame(loop);
  }

  function spawnSnake(colorIdx){
    var dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    var dir  = dirs[Math.floor(Math.random()*dirs.length)];
    var sx   = Math.floor(3 + Math.random()*(COLS-6));
    var sy   = Math.floor(3 + Math.random()*(ROWS-6));
    var len  = 6 + Math.floor(Math.random()*8);
    var segs = [];
    for(var i=0;i<len;i++){
      segs.push({
        x: ((sx - dir.x*i) + COLS*99) % COLS,
        y: ((sy - dir.y*i) + ROWS*99) % ROWS
      });
    }
    snakes.push({
      segs: segs,
      dir:  dir,
      color: SNAKE_COLORS[colorIdx % SNAKE_COLORS.length],
      turnTimer: 0,
      turnEvery: 8 + Math.floor(Math.random()*12),
      growing: 0
    });
  }

  function stepAll(){
    snakes.forEach(function(s){
      // Decide if we should turn
      s.turnTimer++;
      if(s.turnTimer >= s.turnEvery){
        s.turnTimer = 0;
        s.turnEvery = 6 + Math.floor(Math.random()*14);
        // Turn left or right (not reverse)
        var turns = [
          {x: s.dir.y,  y:-s.dir.x},
          {x:-s.dir.y,  y: s.dir.x}
        ];
        // Sometimes go straight
        if(Math.random() > 0.35){
          s.dir = turns[Math.floor(Math.random()*2)];
        }
      }

      // Avoid hitting own body (simple lookahead)
      var nx = (s.segs[0].x + s.dir.x + COLS) % COLS;
      var ny = (s.segs[0].y + s.dir.y + ROWS) % ROWS;
      var hits = s.segs.some(function(seg,i){ return i > 0 && seg.x===nx && seg.y===ny; });
      if(hits){
        // Try alternate turns
        var alts = [{x:s.dir.y,y:-s.dir.x},{x:-s.dir.y,y:s.dir.x}];
        for(var a=0;a<alts.length;a++){
          var ax = (s.segs[0].x + alts[a].x + COLS) % COLS;
          var ay = (s.segs[0].y + alts[a].y + ROWS) % ROWS;
          var ahits = s.segs.some(function(seg,i){ return i>0 && seg.x===ax && seg.y===ay; });
          if(!ahits){ s.dir = alts[a]; nx=ax; ny=ay; break; }
        }
      }

      // Move: add new head
      s.segs.unshift({x: (s.segs[0].x+s.dir.x+COLS)%COLS, y: (s.segs[0].y+s.dir.y+ROWS)%ROWS});

      // Check food
      var ate = -1;
      for(var f=0;f<foods.length;f++){
        if(foods[f].x===s.segs[0].x && foods[f].y===s.segs[0].y){ ate=f; break; }
      }
      if(ate >= 0){
        foods.splice(ate,1);
        foods.push({x:Math.floor(Math.random()*COLS), y:Math.floor(Math.random()*ROWS)});
        s.growing += 3;
      }

      // Remove tail unless growing
      if(s.growing > 0){ s.growing--; }
      else { s.segs.pop(); }
    });
  }

  function drawOnly(){
    dctx.clearRect(0,0,W,H);

    // Subtle grid
    dctx.strokeStyle = 'rgba(0,255,157,0.04)';
    dctx.lineWidth = 0.5;
    for(var c=0;c<=COLS;c++){ dctx.beginPath(); dctx.moveTo(c*CELL,0); dctx.lineTo(c*CELL,H); dctx.stroke(); }
    for(var r=0;r<=ROWS;r++){ dctx.beginPath(); dctx.moveTo(0,r*CELL); dctx.lineTo(W,r*CELL); dctx.stroke(); }

    // Food
    foods.forEach(function(f){
      var fx = f.x*CELL + CELL/2;
      var fy = f.y*CELL + CELL/2;
      dctx.save();
      dctx.shadowColor = '#ff3355';
      dctx.shadowBlur  = 10;
      dctx.fillStyle   = '#ff3355';
      dctx.beginPath();
      dctx.arc(fx, fy, CELL*0.28, 0, Math.PI*2);
      dctx.fill();
      dctx.restore();
    });

    // Snakes
    snakes.forEach(function(s){
      s.segs.forEach(function(seg, i){
        var x = seg.x*CELL+1;
        var y = seg.y*CELL+1;
        var sz = CELL-2;
        dctx.save();

        if(i === 0){
          // Head — brighter + glow
          dctx.shadowColor = s.color.glow;
          dctx.shadowBlur  = 14;
          dctx.fillStyle   = s.color.head;
        } else {
          // Body — fade out toward tail
          var fade = 1 - (i / s.segs.length) * 0.6;
          dctx.globalAlpha = fade;
          dctx.shadowColor = s.color.glow;
          dctx.shadowBlur  = 5;
          dctx.fillStyle   = s.color.body;
        }

        // Rounded rect
        var r2 = 3;
        dctx.beginPath();
        dctx.moveTo(x+r2, y);
        dctx.lineTo(x+sz-r2, y);
        dctx.quadraticCurveTo(x+sz, y, x+sz, y+r2);
        dctx.lineTo(x+sz, y+sz-r2);
        dctx.quadraticCurveTo(x+sz, y+sz, x+sz-r2, y+sz);
        dctx.lineTo(x+r2, y+sz);
        dctx.quadraticCurveTo(x, y+sz, x, y+sz-r2);
        dctx.lineTo(x, y+r2);
        dctx.quadraticCurveTo(x, y, x+r2, y);
        dctx.closePath();
        dctx.fill();

        // Eyes on head
        if(i === 0){
          dctx.shadowBlur = 0;
          dctx.fillStyle = '#000';
          var ex1, ey1, ex2, ey2;
          var eyeOff = CELL * 0.22;
          var eyeIn  = CELL * 0.28;
          if(s.dir.x===1)       { ex1=x+sz*0.7; ey1=y+eyeOff; ex2=x+sz*0.7; ey2=y+sz-eyeOff; }
          else if(s.dir.x===-1) { ex1=x+sz*0.3; ey1=y+eyeOff; ex2=x+sz*0.3; ey2=y+sz-eyeOff; }
          else if(s.dir.y===1)  { ex1=x+eyeOff; ey1=y+sz*0.7; ex2=x+sz-eyeOff; ey2=y+sz*0.7; }
          else                  { ex1=x+eyeOff; ey1=y+sz*0.3; ex2=x+sz-eyeOff; ey2=y+sz*0.3; }
          dctx.beginPath(); dctx.arc(ex1,ey1,1.8,0,Math.PI*2); dctx.fill();
          dctx.beginPath(); dctx.arc(ex2,ey2,1.8,0,Math.PI*2); dctx.fill();
        }

        dctx.restore();
      });
    });
  }

  // Start demo when snake window opens
  var _snakeOrigOpen = window.openWindow;
  window.openWindow = function(name){
    _snakeOrigOpen(name);
    if(name === 'snake'){
      setTimeout(function(){
        var modal = document.getElementById('snakeNameModal');
        if(modal && modal.style.display !== 'none') initDemo();
      }, 80);
    }
  };

  // Stop demo when game starts (hook into startSnakeGame)
  var _origStartSnake = window.startSnakeGame;
  window.startSnakeGame = function(){
    if(demoAnim){ cancelAnimationFrame(demoAnim); demoAnim=null; }
    var dc2 = document.getElementById('snakeDemoCanvas');
    if(dc2){ var c=dc2.getContext('2d'); c.clearRect(0,0,dc2.width,dc2.height); }
    if(_origStartSnake) _origStartSnake();
  };

  // Restart demo when player hits "Change Player" (snakeChangeUser goes back to modal)
  var _origChangeUser = window.snakeChangeUser;
  window.snakeChangeUser = function(){
    if(_origChangeUser) _origChangeUser();
    setTimeout(function(){
      var modal = document.getElementById('snakeNameModal');
      if(modal && modal.style.display !== 'none') initDemo();
    }, 80);
  };

})();