// ══════════════════════════════════════════════════════
// DESKTOP ANIMATED BACKGROUND — matrix rain / network
// ══════════════════════════════════════════════════════
var MATRIX_FONT=16;
var MATRIX_CHARS="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var NET_COUNT=35, NET_CONNECT_DIST=160;

var _bgCanvas,_bgCtx,_bgW,_bgH,_bgLastTick=0;
var _bgDrops=[], _bgParticles=[], _bgPackets=[], _bgPkTimer=0;
var _bgStyle=(localStorage.getItem("wallpaperStyle")==="network")?"network":"matrix";

function setWallpaperStyle(style){
  _bgStyle=style==="network"?"network":"matrix";
  try{localStorage.setItem("wallpaperStyle",_bgStyle);}catch(e){}
  // hard-clear so the previous style's trail doesn't linger/ghost through the switch
  if(_bgCtx){_bgCtx.fillStyle="#0d1117";_bgCtx.fillRect(0,0,_bgW,_bgH);}
}

function _bgResize(){
  var cv=_bgCanvas;
  _bgW=cv.width=cv.offsetWidth||window.innerWidth;
  _bgH=cv.height=cv.offsetHeight||(window.innerHeight-44);

  // a wallpaper sitting behind desktop icons needs gaps the original
  // full-screen demo didn't: only ~45% of columns rain, rest stay empty
  var cols=Math.floor(_bgW/MATRIX_FONT);
  _bgDrops=[];
  for(var i=0;i<cols;i++)_bgDrops.push(Math.random()<0.22?Math.floor(Math.random()*-30):null);

  _bgParticles=[];
  for(var i=0;i<NET_COUNT;i++){
    _bgParticles.push({x:Math.random()*_bgW,y:Math.random()*_bgH,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,r:1+Math.random()*1.5,pulse:Math.random()*Math.PI*2});
  }
  _bgPackets=[];
}

// classic matrix code-rain — same algorithm as the canonical canvas demo:
// one fixed column grid, a single falling glyph per column, each column
// independently re-rolls a ~2.5% chance to restart once it clears the bottom.
function _drawMatrix(accent){
  var ctx=_bgCtx;
  ctx.font=MATRIX_FONT+"px monospace";
  ctx.fillStyle="rgba("+accent+",0.5)";
  for(var i=0;i<_bgDrops.length;i++){
    if(_bgDrops[i]===null)continue;
    var text=MATRIX_CHARS[Math.floor(Math.random()*MATRIX_CHARS.length)];
    ctx.fillText(text,i*MATRIX_FONT,_bgDrops[i]*MATRIX_FONT);
    if(_bgDrops[i]*MATRIX_FONT>_bgH&&Math.random()>0.975)_bgDrops[i]=0;
    _bgDrops[i]++;
  }
}

function _drawNetwork(accent){
  var ctx=_bgCtx;
  var particles=_bgParticles;
  for(var i=0;i<particles.length;i++){
    var p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.pulse+=0.02;
    if(p.x<0||p.x>_bgW) p.vx*=-1;
    if(p.y<0||p.y>_bgH) p.vy*=-1;
  }
  for(var i=0;i<particles.length;i++){
    for(var j=i+1;j<particles.length;j++){
      var a=particles[i],b=particles[j];
      var dx=a.x-b.x, dy=a.y-b.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<NET_CONNECT_DIST){
        var op=0.5-0.35*(dist/NET_CONNECT_DIST);
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.strokeStyle="rgba("+accent+","+op+")";
        ctx.lineWidth=1.2;
        ctx.stroke();
      }
    }
  }
  for(var i=0;i<particles.length;i++){
    var p=particles[i];
    var glow=0.5+0.5*Math.sin(p.pulse);
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);
    ctx.fillStyle="rgba("+accent+","+(0.4+0.3*glow)+")";ctx.fill();
  }

  _bgPkTimer++;
  if(_bgPkTimer>55){
    _bgPkTimer=0;
    var ai=Math.floor(Math.random()*particles.length);
    var bi=(ai+1+Math.floor(Math.random()*(particles.length-1)))%particles.length;
    var a=particles[ai],b=particles[bi];
    var dx=a.x-b.x,dy=a.y-b.y;
    if(Math.sqrt(dx*dx+dy*dy)<NET_CONNECT_DIST)_bgPackets.push({a:a,b:b,t:0,speed:0.012+Math.random()*0.016});
  }
  for(var i=_bgPackets.length-1;i>=0;i--){
    var pk=_bgPackets[i]; pk.t+=pk.speed;
    if(pk.t>1){_bgPackets.splice(i,1);continue;}
    var px=pk.a.x+(pk.b.x-pk.a.x)*pk.t;
    var py=pk.a.y+(pk.b.y-pk.a.y)*pk.t;
    var fade=Math.sin(pk.t*Math.PI);
    ctx.beginPath();ctx.arc(px,py,2,0,6.28);
    ctx.fillStyle="rgba("+accent+","+fade+")";ctx.fill();
  }
}

function _bgDraw(ts){
  requestAnimationFrame(_bgDraw);
  var accent=getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim()||"0,255,157";

  if(_bgStyle==="network"){
    _bgCtx.fillStyle="rgba(13,17,23,0.15)";
    _bgCtx.fillRect(0,0,_bgW,_bgH);
    _drawNetwork(accent);
    return;
  }

  // matrix rain runs at a fixed ~30fps pace to match the classic rain cadence
  if(ts-_bgLastTick<33)return;
  _bgLastTick=ts;
  _bgCtx.fillStyle="rgba(13,17,23,0.15)";
  _bgCtx.fillRect(0,0,_bgW,_bgH);
  _drawMatrix(accent);
}

function initDesktopBg(){
  var cv=document.getElementById("desktopBg");
  if(!cv)return;
  _bgCanvas=cv;
  _bgCtx=cv.getContext("2d");
  _bgResize();
  window.addEventListener("resize",_bgResize);
  requestAnimationFrame(_bgDraw);
}
