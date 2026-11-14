// ══ FIREWALL — ROOTBOY cartridge ══════════════════════════════════
// Space-Invaders-style: hold left/right to move, B (or up) to fire,
// S to pause. Five themed waves cycle (classic, armored rootkits,
// diving worms, mixed V, ransomware boss) and speed up each loop.
// Kills can drop power-ups. Runs in a 120x100 virtual-pixel field.
(function(){
  var VW=120,VH=100,BEST_KEY='firewall_best';
  var SPR={
    p:["....A....","...AAA...",".AAAAAAA.","AAKAKAKAA","AAAAAAAAA"],
    r0:[".R....R.","..R..R..",".RRRRRR.","RRKRRKRR",".RRRRRR.","R.RRRR.R",".R....R."],
    r1:[".R....R.","..R..R..",".RRRRRR.","RRKRRKRR",".RRRRRR.",".R.RR.R.","R......R"],
    y0:["..YYYY..",".YYYYYY.","YYKYYKYY","YYYYYYYY",".Y.YY.Y.","Y......Y"],
    y1:["..YYYY..",".YYYYYY.","YYKYYKYY","YYYYYYYY","..Y..Y..",".Y....Y."],
    v0:["...PP...","..PPPP..",".PKPPKP.","PPPPPPPP","..P..P..",".P.PP.P."],
    v1:["...PP...","..PPPP..",".PKPPKP.","PPPPPPPP",".P.PP.P.","P......P"],
    k0:["WWWWWWWW","W.WWWW.W","WRWWWWRW","WWWWWWWW",".W.WW.W.","W.W..W.W"],
    k1:["WWWWWWWW","W.WWWW.W","WRWWWWRW","WWWWWWWW","W.W..W.W",".W....W."],
    d0:["...CC...","..CCCC..",".CKCCKC.","CCCCCCCC","C.C..C.C","..C..C.."],
    d1:["...CC...","..CCCC..",".CKCCKC.","CCCCCCCC",".C.CC.C.","C......C"],
    u:["...CCCCC...",".CCCCCCCCC.","CCKCCKCCKCC","..C.....C.."],
    b:["....RRRRRRRR....","..RRRRRRRRRRRR..",".RRKKRRRRRRKKRR.","RRRKKRRRRRRKKRRR","RRRRRRRRRRRRRRRR",
       "RRR.RRRRRRRR.RRR","RR..RRYYYYRR..RR",".R..RYYKKYYR..R.","....RYYYYYYR....","...RR.R..R.RR..."]
  };
  var TYPES={
    v:{pts:30,c:'#b06fff',hp:1},
    y:{pts:20,c:'#febc2e',hp:1},
    r:{pts:10,c:'#ff3355',hp:1},
    k:{pts:40,c:'#9aa7b4',hp:2},   // rootkit: armored, two hits
    d:{pts:25,c:'#00c8ff',hp:1}    // worm: breaks formation and dives
  };
  var WAVES=[
    {name:'INITIAL ACCESS',rows:['vvvvvvvv','yyyyyyyy','yyyyyyyy','rrrrrrrr']},
    {name:'ROOTKITS',rows:['.vvvvvv.','kkkkkkkk','yyyyyyyy','rrrrrrrr']},
    {name:'WORM SWARM',rows:['d.d.d.d.','.y.y.y.y','d.d.d.d.','.r.r.r.r']},
    {name:'LATERAL MOVEMENT',rows:['k......k','vk....kv','yykddkyy','rrrddrrr']},
    {name:'RANSOMWARE',boss:true}
  ];
  var POWERS={R:{name:'RAPID',c:'#00c8ff'},S:{name:'SPREAD',c:'#b06fff'},L:{name:'+1 LIFE',c:'#28c840'}};
  var SHIELD=["..############..",".##############.","################","################","#####......#####","####........####"];
  var COLS=8,DX=12,DY=10,EW=8,EH=7,SH_Y=VH-24,PY=VH-9,PW=9,BW=32,BH=20; // boss drawn at 2x its 16x10 sprite
  var g=null,cache={};

  function best(){try{return parseInt(localStorage.getItem(BEST_KEY)||'0',10)||0;}catch(e){return 0;}}
  function col(ch){return {A:Arcade.A.hex,K:'#04100a',R:'#ff3355',P:'#b06fff',Y:'#febc2e',C:'#00c8ff',W:'#9aa7b4'}[ch];}
  function sprite(n){
    var k=n+Arcade.A.hex;if(cache[k])return cache[k];
    var m=SPR[n],c=document.createElement('canvas');c.width=m[0].length;c.height=m.length;
    var x=c.getContext('2d');
    for(var r=0;r<m.length;r++)for(var q=0;q<m[r].length;q++)if(m[r][q]!=='.'){x.fillStyle=col(m[r][q]);x.fillRect(q,r,1,1);}
    return cache[k]=c;
  }

  function start(){
    var stars=[];for(var i=0;i<26;i++)stars.push({x:Math.random()*VW|0,y:Math.random()*(SH_Y-4)|0,p:Math.random()*6});
    g={score:0,lives:3,wave:0,px:(VW-PW)/2,shots:[],bombs:[],drops:[],parts:[],pops:[],stars:stars,
       power:null,powerT:0,ufo:null,ufoT:15000,dead:0,over:false,overT:0,done:false,breached:false,banner:0};
    nextWave();
  }
  function nextWave(){
    g.wave++;
    var def=WAVES[(g.wave-1)%WAVES.length],loop=Math.floor((g.wave-1)/WAVES.length);
    g.def=def;g.loop=loop;g.enemies=[];g.boss=null;
    g.fx=(VW-((COLS-1)*DX+EW))/2;g.fy=14+Math.min(g.wave-1,4)*3;
    if(def.boss){
      var hp=24+loop*12;
      g.boss={x:(VW-BW)/2,y:8,hp:hp,max:hp,t:0,fireAcc:0,shot:0,flash:0};
    }else{
      def.rows.forEach(function(row,r){
        row.split('').forEach(function(ch,c){
          if(ch!=='.')g.enemies.push({t:ch,hx:c*DX,hy:r*DY,x:0,y:0,hp:TYPES[ch].hp,alive:true,dive:null,flash:0});
        });
      });
    }
    placeFormation();
    g.shields=[0,1,2].map(function(i){return {x:18+i*34,cells:SHIELD.map(function(r){return r.split('').map(function(ch){return ch==='#';});})};});
    g.total=g.enemies.length;g.dir=1;g.stepAcc=0;g.frame=0;g.shootAcc=0;g.diveT=2500;
    g.bombs=[];g.shots=[];g.banner=1800;
    hud();
  }
  function placeFormation(){g.enemies.forEach(function(e){if(!e.dive){e.x=g.fx+e.hx;e.y=g.fy+e.hy;}});}
  function hud(){Arcade.hud([['SCORE',Arcade.pad(g.score)],['WAVE',g.wave],['LIVES',Math.max(0,g.lives)]]);}

  // ── firing ──
  function fire(){
    if(g.dead||g.over||g.banner>0||g.fireCd>0)return;
    if(g.power==='S'){
      if(g.shots.length)return;
      [-28,0,28].forEach(function(vx){g.shots.push({x:g.px+4,y:PY-3,vx:vx});});
    }else{
      if(g.shots.length>=(g.power==='R'?3:1))return;
      g.shots.push({x:g.px+4,y:PY-3,vx:0});
      g.fireCd=g.power==='R'?150:0;
    }
    Arcade.sfx('shoot');
  }
  function input(btn){
    if(btn==='b'||btn==='up'){fire();return true;}
    return btn==='left'||btn==='right'||btn==='down';
  }

  // ── main update ──
  function tick(dt,t){
    var s=dt/1000;
    fx(dt);
    if(g.over){g.overT+=dt;draw(t);if(g.overT>1100&&!g.done){g.done=true;finish();}return;}
    if(g.banner>0){g.banner-=dt;draw(t);return;}
    if(g.dead){
      g.dead-=dt;
      if(g.dead<=0){g.dead=0;if(g.lives>0){g.bombs=[];g.px=(VW-PW)/2;}else g.over=true;}
      draw(t);return;
    }

    var dir=(Arcade.isDown('right')?1:0)-(Arcade.isDown('left')?1:0);
    g.px=Math.max(1,Math.min(VW-PW-1,g.px+dir*62*s));
    g.fireCd=Math.max(0,(g.fireCd||0)-dt);
    if(Arcade.isDown('b')||Arcade.isDown('up'))fire(); // hold to auto-fire
    if(g.power){g.powerT-=dt;if(g.powerT<=0)g.power=null;}

    g.shots=g.shots.filter(function(sh){
      sh.y-=140*s;sh.x+=sh.vx*s;
      return sh.y>-3&&sh.x>-2&&sh.x<VW+2&&!shotHits(sh);
    });

    var live=g.enemies.filter(function(e){return e.alive;});
    if(!live.length&&!g.boss){Arcade.sfx('win');nextWave();draw(t);return;}

    var form=live.filter(function(e){return !e.dive;});
    if(form.length){
      g.stepAcc+=dt;
      var iv=Math.max(45,60+560*live.length/Math.max(1,g.total)-(g.wave-1)*25);
      if(g.stepAcc>=iv){g.stepAcc=0;stepFormation(form);}
    }
    if(g.dead)return;
    updateDivers(live,dt,s);
    if(g.dead)return;
    if(g.boss)updateBoss(dt,s);

    g.shootAcc+=dt;
    if(form.length&&g.shootAcc>=Math.max(320,1050-g.wave*80)&&g.bombs.length<2+Math.min(g.wave,6)){g.shootAcc=0;enemyFire(form);}

    g.bombs=g.bombs.filter(function(b){
      b.y+=(42+g.wave*3)*s;b.x+=(b.vx||0)*s;
      if(b.y>VH-2||b.x<0||b.x>VW)return false;
      if(hitShield(b.x,b.y,1,3))return false;
      for(var i=0;i<g.shots.length;i++){
        var sh=g.shots[i];
        if(Math.abs(sh.x-b.x)<=1&&sh.y<b.y+3&&sh.y+3>b.y){g.shots.splice(i,1);burst(b.x,b.y,'#eafff3',5);return false;}
      }
      if(b.x>=g.px&&b.x<g.px+PW&&b.y+3>=PY+1&&b.y<=PY+5){killPlayer();return false;}
      return true;
    });

    g.drops=g.drops.filter(function(d){
      d.y+=24*s;
      if(d.y>VH)return false;
      if(d.x+5>g.px&&d.x<g.px+PW&&d.y+5>=PY&&d.y<=PY+5){collect(d.k);return false;}
      return true;
    });

    if(!g.boss){
      g.ufoT-=dt;
      if(!g.ufo&&g.ufoT<=0){var l=Math.random()<.5;g.ufo={x:l?-11:VW,v:l?28:-28};g.ufoT=14000+Math.random()*10000;}
    }
    if(g.ufo){g.ufo.x+=g.ufo.v*s;if(g.ufo.x<-12||g.ufo.x>VW+1)g.ufo=null;}
    draw(t);
  }

  function stepFormation(form){
    var minX=VW,maxX=0;
    form.forEach(function(e){minX=Math.min(minX,g.fx+e.hx);maxX=Math.max(maxX,g.fx+e.hx+EW);});
    if((g.dir>0&&maxX+2>VW-2)||(g.dir<0&&minX-2<2)){g.dir*=-1;g.fy+=4;}
    else g.fx+=2*g.dir;
    g.frame^=1;Arcade.sfx('march');
    placeFormation();
    form.forEach(function(e){eraseShields(e.x,e.y,EW,EH);});
    if(form.some(function(e){return e.y+EH>=PY;})){g.breached=true;g.lives=1;killPlayer();}
  }

  // worms peel off one at a time, swoop at the player, then fly back into their slot
  function updateDivers(live,dt,s){
    var worms=live.filter(function(e){return e.t==='d';});
    if(worms.length){
      g.diveT-=dt;
      var diving=worms.filter(function(e){return e.dive;}).length;
      if(g.diveT<=0&&diving<1+Math.min(2,g.loop)){
        var idle=worms.filter(function(e){return !e.dive;});
        if(idle.length){
          var e=idle[Math.floor(Math.random()*idle.length)];
          e.dive={phase:'down',sx:e.x,sy:e.y,tx:g.px,t:0,fired:false};
          Arcade.sfx('rotate');
        }
        g.diveT=Math.max(900,2600-g.wave*120)+Math.random()*900;
      }
    }
    live.forEach(function(e){
      var d=e.dive;if(!d)return;
      d.t+=dt;
      if(d.phase==='down'){
        e.y+=(44+g.wave*2)*s;
        var k=Math.min(1,(e.y-d.sy)/60);
        e.x=d.sx+(d.tx-d.sx)*k+Math.sin(d.t/160)*8;
        if(!d.fired&&e.y>40){d.fired=true;g.bombs.push({x:Math.round(e.x+4),y:e.y+EH,vx:0});}
        eraseShields(e.x,e.y,EW,EH);
        if(e.x<g.px+PW&&e.x+EW>g.px&&e.y+EH>PY&&e.y<PY+5){
          e.alive=false;burst(e.x+4,e.y+3,TYPES.d.c,10);killPlayer();return;
        }
        if(e.y>VH+2){d.phase='back';e.y=-EH;}
      }else{
        var hx=g.fx+e.hx,hy=g.fy+e.hy,dx=hx-e.x,dy=hy-e.y,dist=Math.hypot(dx,dy),v=55*s;
        if(dist<=v){e.dive=null;e.x=hx;e.y=hy;}
        else{e.x+=dx/dist*v;e.y+=dy/dist*v;}
      }
    });
  }

  function updateBoss(dt,s){
    var b=g.boss;
    b.t+=dt;b.flash=Math.max(0,b.flash-dt);
    b.x=(VW-BW)/2+Math.sin(b.t/1100)*40;
    b.y=8+Math.sin(b.t/700)*3;
    b.fireAcc+=dt;
    if(b.fireAcc>=Math.max(650,1250-g.loop*150)){
      b.fireAcc=0;b.shot++;
      var cx=Math.round(b.x+BW/2);
      if(b.shot%3===0)g.bombs.push({x:cx,y:b.y+BH,vx:(g.px+4-cx)*0.4}); // aimed
      else [-20,0,20].forEach(function(vx){g.bombs.push({x:cx,y:b.y+BH,vx:vx});});
    }
  }

  function enemyFire(form){
    var cols={};
    form.forEach(function(e){var k=e.hx;if(!cols[k]||cols[k].hy<e.hy)cols[k]=e;});
    var shooters=Object.keys(cols).map(function(k){return cols[k];});
    // half the shots come from the column closest to the player
    var e=Math.random()<.5
      ?shooters.reduce(function(a,b){return Math.abs(a.x-g.px)<Math.abs(b.x-g.px)?a:b;})
      :shooters[Math.floor(Math.random()*shooters.length)];
    g.bombs.push({x:Math.round(e.x+4),y:e.y+EH,vx:0});
  }

  // returns true if the shot was used up
  function shotHits(sh){
    if(hitShield(sh.x,sh.y,1,3))return true;
    if(g.ufo&&sh.y<=9&&sh.x>=g.ufo.x&&sh.x<=g.ufo.x+11){
      var pts=[50,100,150,300][Math.floor(Math.random()*4)];
      addScore(pts,g.ufo.x+5.5,5,'#00c8ff');burst(g.ufo.x+5,6,'#00c8ff',14);
      g.ufo=null;Arcade.sfx('clear');return true;
    }
    var b=g.boss;
    if(b&&sh.x>=b.x&&sh.x<b.x+BW&&sh.y<b.y+BH&&sh.y+3>b.y){
      b.hp--;b.flash=90;burst(sh.x,sh.y,'#ff3355',3);
      if(b.hp<=0){
        var cx=b.x+BW/2,cy=b.y+BH/2;
        burst(cx,cy,'#ff3355',30);burst(cx,cy,'#febc2e',20);burst(cx,cy,Arcade.A.hex,15);
        addScore(1000*(g.loop+1),cx,cy,'#febc2e');
        g.drops.push({x:cx-2,y:cy,k:'L'});
        g.boss=null;Arcade.sfx('win');
      }else Arcade.sfx('shift');
      return true;
    }
    for(var i=0;i<g.enemies.length;i++){
      var e=g.enemies[i];
      if(e.alive&&sh.x>=e.x&&sh.x<e.x+EW&&sh.y<e.y+EH&&sh.y+3>e.y){
        e.hp--;
        if(e.hp>0){e.flash=140;burst(sh.x,e.y+EH,'#9aa7b4',4);Arcade.sfx('shift');return true;}
        e.alive=false;
        var ty=TYPES[e.t],pts=ty.pts*(e.dive?2:1);
        g.score+=pts;if(e.dive)g.pops.push({x:e.x+4,y:e.y,txt:String(pts),t:0,c:ty.c});
        burst(e.x+4,e.y+3,ty.c,10);Arcade.sfx('zap');hud();
        if(!g.drops.length&&Math.random()<.07){
          var keys=Object.keys(POWERS);
          g.drops.push({x:e.x+1.5,y:e.y,k:keys[Math.floor(Math.random()*keys.length)]});
        }
        return true;
      }
    }
    return false;
  }
  function addScore(pts,x,y,c){g.score+=pts;g.pops.push({x:x,y:y,txt:String(pts),t:0,c:c});hud();}
  function collect(k){
    var p=POWERS[k];
    if(k==='L'){
      if(g.lives<5)g.lives++;
      else g.shields=[0,1,2].map(function(i){return {x:18+i*34,cells:SHIELD.map(function(r){return r.split('').map(function(ch){return ch==='#';});})};});
    }else{g.power=k;g.powerT=9000;}
    g.pops.push({x:g.px+4.5,y:PY-6,txt:p.name,t:0,c:p.c});
    Arcade.sfx('eat');hud();
  }
  function killPlayer(){
    g.lives--;g.dead=1200;g.shots=[];g.power=null;
    burst(g.px+4.5,PY+2,Arcade.A.hex,18);burst(g.px+4.5,PY+2,'#ff3355',10);
    Arcade.sfx('crash');hud();
  }

  // shields: 16x6 cell grids that erode where they're hit
  function hitShield(x,y,w,h){
    for(var i=0;i<g.shields.length;i++){
      var sd=g.shields[i];
      for(var yy=Math.floor(y);yy<y+h;yy++)for(var xx=Math.floor(x);xx<x+w;xx++){
        var cx=xx-sd.x,cy=yy-SH_Y;
        if(cy>=0&&cy<6&&cx>=0&&cx<16&&sd.cells[cy][cx]){blast(sd,cx,cy);return true;}
      }
    }
    return false;
  }
  function blast(sd,cx,cy){
    for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){
      if(Math.abs(dx)+Math.abs(dy)>2||Math.random()<.3)continue;
      var r=sd.cells[cy+dy];if(r&&cx+dx>=0&&cx+dx<16)r[cx+dx]=false;
    }
    sd.cells[cy][cx]=false;
  }
  function eraseShields(x,y,w,h){
    g.shields.forEach(function(sd){
      for(var cy=0;cy<6;cy++)for(var cx=0;cx<16;cx++){
        var px=sd.x+cx,py=SH_Y+cy;
        if(px>=x&&px<x+w&&py>=y&&py<y+h)sd.cells[cy][cx]=false;
      }
    });
  }

  function burst(x,y,c,n){
    for(var i=0;i<n;i++){
      var a=Math.random()*6.283,v=10+Math.random()*30;
      g.parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,life:300+Math.random()*300,c:c});
    }
  }
  function fx(dt){
    var s=dt/1000;
    g.parts=g.parts.filter(function(p){p.t+=dt;p.x+=p.vx*s;p.y+=p.vy*s;p.vx*=.94;p.vy*=.94;return p.t<p.life;});
    g.pops=g.pops.filter(function(p){p.t+=dt;return p.t<900;});
    g.enemies.forEach(function(e){if(e.flash)e.flash=Math.max(0,e.flash-dt);});
  }

  function finish(){
    var nb=g.score>0&&g.score>best();
    if(nb)try{localStorage.setItem(BEST_KEY,g.score);}catch(e){}
    Arcade.gameOver({title:g.breached?'BREACHED':'GAME OVER',
      body:'SCORE '+Arcade.pad(g.score)+'<br>WAVE '+g.wave+' &middot; '+g.def.name+(nb?'<br><span class="arc-gold">NEW HIGH SCORE!</span>':'')});
  }

  // ── render ──
  function draw(t){
    if(!g)return;
    var c=Arcade.ctx,W=Arcade.W,H=Arcade.H,A=Arcade.A;
    // scale in whole *device* pixels (not CSS px) so sprites stay crisp but phones aren't stuck at 1x
    var dpr=Math.min(2,window.devicePixelRatio||1);
    var p=Math.max(1,Math.floor(Math.min(W/VW,H/VH)*dpr))/dpr;
    var ox=Math.round((W-VW*p)/2*dpr)/dpr,oy=Math.round((H-VH*p)/2*dpr)/dpr;
    function img(n,x,y,sc){var sp=sprite(n);sc=sc||1;c.drawImage(sp,ox+Math.round(x)*p,oy+Math.round(y)*p,sp.width*p*sc,sp.height*p*sc);}
    function px(x,y,w,h,color){c.fillStyle=color;c.fillRect(ox+Math.round(x)*p,oy+Math.round(y)*p,w*p,h*p);}
    function text(s,x,y,size,color){c.font=Arcade.font(Math.max(7,Math.round(size*p)));c.fillStyle=color;c.fillText(s,ox+x*p,oy+y*p);}
    c.imageSmoothingEnabled=false;
    c.fillStyle='#020604';c.fillRect(0,0,W,H);

    g.stars.forEach(function(st){px(st.x,st.y,1,1,'rgba(200,255,225,'+(0.15+0.35*Math.abs(Math.sin(t/900+st.p))).toFixed(2)+')');});
    px(0,VH-2,VW,1,'rgba('+A.rgb+',.6)');

    c.globalAlpha=.8;
    g.shields.forEach(function(sd){
      for(var cy=0;cy<6;cy++)for(var cx=0;cx<16;cx++)if(sd.cells[cy][cx])px(sd.x+cx,SH_Y+cy,1,1,A.hex);
    });
    c.globalAlpha=1;

    g.enemies.forEach(function(e){
      if(!e.alive)return;
      var fr=e.dive?(Math.floor(t/120)%2):g.frame;
      if(e.flash)c.globalAlpha=Math.floor(t/40)%2?.35:1;
      img(e.t+fr,e.x,e.y);
      c.globalAlpha=1;
      if(e.t==='k'&&e.hp===1)px(e.x+3,e.y+1,2,1,'#04100a'); // crack in damaged armor
    });

    var b=g.boss;
    if(b){
      if(!b.flash||Math.floor(t/40)%2)img('b',b.x,b.y,2);
      var bw=60,bx=(VW-bw)/2;
      px(bx-1,1,bw+2,3,'rgba(255,51,85,.25)');
      px(bx,2,Math.max(0,Math.round(bw*b.hp/b.max)),1,'#ff3355');
    }
    if(g.ufo&&Math.floor(t/120)%4)img('u',g.ufo.x,4);

    if(!g.dead&&!g.over){
      if(g.power){c.save();c.shadowColor=POWERS[g.power].c;c.shadowBlur=8;}
      img('p',g.px,PY);
      if(g.power)c.restore();
    }
    c.save();c.shadowColor=A.hex;c.shadowBlur=6;
    g.shots.forEach(function(sh){px(sh.x,sh.y,1,3,'#eafff3');});
    c.restore();
    g.bombs.forEach(function(bm){
      px(bm.x,bm.y,1,3,'#ff3355');
      px(bm.x+(Math.floor(bm.y/2)%2?1:-1),bm.y+1,1,1,'#ff3355'); // zig-zag spark
    });

    c.textAlign='center';c.textBaseline='middle';
    g.drops.forEach(function(d){
      var pc=POWERS[d.k].c,blink=Math.floor(t/150)%2;
      px(d.x,d.y,5,5,blink?pc:'#04100a');
      px(d.x+1,d.y+1,3,3,blink?'#04100a':pc);
      text(d.k==='L'?'+':d.k,d.x+2.5,d.y+2.7,3,blink?pc:'#04100a');
    });

    g.parts.forEach(function(q){c.globalAlpha=1-q.t/q.life;px(q.x,q.y,1,1,q.c);});
    c.globalAlpha=1;

    g.pops.forEach(function(q){c.globalAlpha=1-q.t/900;text(q.txt,q.x,q.y-q.t/900*5,3.5,q.c||'#00c8ff');});
    c.globalAlpha=1;

    if(g.power){
      c.textAlign='left';
      text(POWERS[g.power].name,2,VH-6,3,POWERS[g.power].c);
      px(2,VH-3,Math.round(22*g.powerT/9000),1,POWERS[g.power].c);
      c.textAlign='center';
    }

    if(g.banner>0){
      var fade=Math.min(1,g.banner/300),boss=!!g.def.boss;
      c.globalAlpha=fade;
      px(VW/2-36,SH_Y-21,72,g.loop?24:19,'rgba(2,6,4,.88)'); // backing so it reads over the swarm
      px(VW/2-36,SH_Y-21,72,1,boss?'#ff3355':A.hex);c.save();c.shadowColor=boss?'#ff3355':A.hex;c.shadowBlur=12;
      text('WAVE '+g.wave,VW/2,SH_Y-14,6.5,boss?'#ff3355':A.hex);
      c.restore();
      text((boss?'BOSS: ':'')+g.def.name,VW/2,SH_Y-6,3.2,'#b9cac1');
      if(g.loop)text('THREAT LEVEL +'+g.loop,VW/2,SH_Y-1,2.6,'#febc2e');
      c.globalAlpha=1;
    }
    if(g.over){c.fillStyle='rgba(255,51,85,'+(.2*Math.max(0,1-g.overT/600))+')';c.fillRect(0,0,W,H);}
  }

  Arcade.register({
    id:'firewall',title:'Firewall',sprite:'bug',
    help:'FIREWALL: HOLD LEFT/RIGHT TO MOVE &middot; B TO FIRE &middot; GRAB POWER-UPS, STOP THE MALWARE',
    best:best,bestLabel:function(){return Arcade.pad(best());},
    start:start,input:input,tick:tick,
    draw:function(){draw(performance.now());},stop:function(){g=null;}
  });
})();
