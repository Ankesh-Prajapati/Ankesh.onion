// ══════════════════════════════════════════════════════
// DESKTOP ANIMATED BACKGROUND — particle network
// ══════════════════════════════════════════════════════
function initDesktopBg(){
  var cv=document.getElementById("desktopBg");
  if(!cv)return;
  var ctx=cv.getContext("2d");
  var W,H;
  function rz(){W=cv.width=cv.offsetWidth||window.innerWidth;H=cv.height=cv.offsetHeight||(window.innerHeight-44);}
  rz();window.addEventListener("resize",function(){rz();initParticles();});

  var particles=[];
  var COUNT=65;
  var CONNECT_DIST=200;

  function initParticles(){
    particles=[];
    for(var i=0;i<COUNT;i++){
      particles.push({
        x:Math.random()*W,
        y:Math.random()*H,
        vx:(Math.random()-0.5)*0.35,
        vy:(Math.random()-0.5)*0.35,
        r:1+Math.random()*1.5,
        pulse:Math.random()*Math.PI*2
      });
    }
  }
  initParticles();

  // Data packets travelling along edges
  var packets=[];
  var pkTimer=0;

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#0d1117";
    ctx.fillRect(0,0,W,H);

    // get accent color from CSS var
    var accent=getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim()||"0,255,157";

    // update + draw particles
    for(var i=0;i<particles.length;i++){
      var p=particles[i];
      p.x+=p.vx; p.y+=p.vy; p.pulse+=0.02;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;
    }

    // draw connections
    for(var i=0;i<particles.length;i++){
      for(var j=i+1;j<particles.length;j++){
        var a=particles[i],b=particles[j];
        var dx=a.x-b.x, dy=a.y-b.y;
        var dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<CONNECT_DIST){
          var op=0.7-0.5*(dist/CONNECT_DIST);
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.strokeStyle="rgba("+accent+","+op+")";
          ctx.lineWidth=1.5;
          ctx.stroke();
        }
      }
    }

    // draw nodes
    for(var i=0;i<particles.length;i++){
      var p=particles[i];
      var glow=0.5+0.5*Math.sin(p.pulse);
      // outer glow
      ctx.beginPath();ctx.arc(p.x,p.y,p.r+2+glow*2,0,6.28);
      ctx.fillStyle="rgba("+accent+","+(0.04*glow)+")";ctx.fill();
      // core dot
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);
      ctx.fillStyle="rgba("+accent+","+(0.5+0.3*glow)+")";ctx.fill();
    }

    // spawn packets
    pkTimer++;
    if(pkTimer>55){
      pkTimer=0;
      var ai=Math.floor(Math.random()*particles.length);
      var bi=(ai+1+Math.floor(Math.random()*(particles.length-1)))%particles.length;
      var a=particles[ai],b=particles[bi];
      var dx=a.x-b.x,dy=a.y-b.y;
      if(Math.sqrt(dx*dx+dy*dy)<CONNECT_DIST){
        packets.push({a:a,b:b,t:0,speed:0.012+Math.random()*0.016});
      }
    }

    // draw + move packets
    for(var i=packets.length-1;i>=0;i--){
      var pk=packets[i]; pk.t+=pk.speed;
      if(pk.t>1){packets.splice(i,1);continue;}
      var px=pk.a.x+(pk.b.x-pk.a.x)*pk.t;
      var py=pk.a.y+(pk.b.y-pk.a.y)*pk.t;
      var fade=Math.sin(pk.t*Math.PI);
      ctx.beginPath();ctx.arc(px,py,2.2,0,6.28);
      ctx.fillStyle="rgba("+accent+","+fade+")";ctx.fill();
      // trail
      ctx.beginPath();ctx.arc(px,py,4,0,6.28);
      ctx.fillStyle="rgba("+accent+","+(fade*0.15)+")";ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  draw();
}
