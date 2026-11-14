// ══ SNAKE - ROOTBOY cartridge ═════════════════════════════════════
// No name prompt: every run gets a random callsign for the local
// high-score table. The outer ring of cells is a solid wall.
(function(){
  var LB_KEY='snakeLB_v4';
  // step = ms per move. Speeds up a little per food, but stops at a
  // playable floor instead of racing off like the old 60ms cap.
  var STEP0=160,STEP_MIN=100,STEP_DEC=4;
  var TAGS=['ROOT','GHOST','NULL','CIPHER','VOID','HEX','PROXY','SHELL','ZERO','BYTE','KERNEL','NEO','PHANTOM','RAVEN'];
  var DIRS={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
  var s=null;

  function lb(){try{return JSON.parse(localStorage.getItem(LB_KEY))||[];}catch(e){return [];}}
  function best(){var l=lb();return l.length?l[0].score:0;}
  function saveRun(){
    var l=lb();l.push({name:s.name,score:s.score,id:s.id});
    l.sort(function(a,b){return b.score-a.score;});l=l.slice(0,10);
    try{localStorage.setItem(LB_KEY,JSON.stringify(l));}catch(e){}
    return l;
  }

  function start(){
    var W=Arcade.W,H=Arcade.H,c=Math.max(9,Math.floor(Math.min(W,H)/16));
    var cols=Math.max(12,Math.floor(W/c)),rows=Math.max(10,Math.floor(H/c));
    var cx=Math.floor(cols/2),cy=Math.floor(rows/2);
    s={id:Date.now(),name:TAGS[Math.floor(Math.random()*TAGS.length)]+'-'+(10+Math.floor(Math.random()*90)),
      cols:cols,rows:rows,body:[{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}],dir:DIRS.right,queue:[],
      food:null,foodT:0,score:0,hi:best(),step:STEP0,acc:0,parts:[],pops:[],dead:false,deadT:0,done:false};
    placeFood();hud();draw(performance.now());
  }
  function hud(){Arcade.hud([['P1',s.name],['SCORE',Arcade.pad(s.score)],['HI',Arcade.pad(Math.max(s.hi,s.score))]]);}
  function placeFood(){
    var p;
    do{p={x:1+Math.floor(Math.random()*(s.cols-2)),y:1+Math.floor(Math.random()*(s.rows-2))};}
    while(s.body.some(function(b){return b.x===p.x&&b.y===p.y;}));
    s.food=p;s.foodT=0;
  }

  function input(btn){
    var d=DIRS[btn];if(!d)return false;
    if(s.dead)return true;
    // buffer up to 2 turns so quick double-taps between steps aren't lost
    var lastD=s.queue.length?s.queue[s.queue.length-1]:s.dir;
    if(d===lastD||(d.x&&d.x===-lastD.x)||(d.y&&d.y===-lastD.y))return true;
    if(s.queue.length<2)s.queue.push(d);
    return true;
  }

  function stepOnce(){
    if(s.queue.length)s.dir=s.queue.shift();
    var h=s.body[0],n={x:h.x+s.dir.x,y:h.y+s.dir.y};
    var wall=n.x<1||n.y<1||n.x>s.cols-2||n.y>s.rows-2;
    var eat=n.x===s.food.x&&n.y===s.food.y;
    var len=eat?s.body.length:s.body.length-1; // tail moves away unless we grow
    for(var i=0;i<len&&!wall;i++)if(s.body[i].x===n.x&&s.body[i].y===n.y)wall=true;
    if(wall){die();return;}
    s.body.unshift(n);
    if(eat){
      s.score+=10;s.step=Math.max(STEP_MIN,s.step-STEP_DEC);
      burst(n.x,n.y,null,8);s.pops.push({x:n.x,y:n.y,t:0});
      Arcade.sfx('eat');placeFood();hud();
    }else s.body.pop();
  }
  function die(){s.dead=true;s.queue=[];Arcade.sfx('crash');burst(s.body[0].x,s.body[0].y,'#ff3355',14);}
  function burst(x,y,color,count){
    for(var i=0;i<count;i++){
      var a=Math.random()*Math.PI*2,v=.004+Math.random()*.008;
      s.parts.push({x:x+.5,y:y+.5,vx:Math.cos(a)*v,vy:Math.sin(a)*v,t:0,life:350+Math.random()*250,c:color});
    }
  }

  function tick(dt,t){
    if(s.dead){
      s.deadT+=dt;fx(dt);draw(t);
      if(s.deadT>750&&!s.done){s.done=true;finish();}
      return;
    }
    s.acc+=dt;
    while(s.acc>=s.step&&!s.dead){s.acc-=s.step;stepOnce();}
    s.foodT+=dt;fx(dt);draw(t);
  }
  function fx(dt){
    s.parts=s.parts.filter(function(p){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.95;p.vy*=.95;return p.t<p.life;});
    s.pops=s.pops.filter(function(p){p.t+=dt;return p.t<700;});
  }

  function finish(){
    var l=saveRun(),isBest=s.score>0&&l[0].id===s.id;
    var rows=l.slice(0,5).map(function(e,i){
      return '<div class="arc-lb'+(e.id===s.id?' me':'')+'"><span>'+(i+1)+'</span><span>'+escHtml(e.name)+'</span><span>'+Arcade.pad(e.score)+'</span></div>';
    }).join('');
    Arcade.gameOver({body:'SCORE '+Arcade.pad(s.score)+
      (isBest?'<br><span class="arc-gold">NEW HIGH SCORE!</span>':'')+
      '<div class="arc-lb-h">HIGH SCORES</div>'+rows});
  }

  // ── render ──
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function easeBack(k){var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2);}
  function brick(c,x,y,cs,rgb){
    var px=x*cs,py=y*cs,half=Math.floor(cs/2);
    c.fillStyle='#0c1f16';c.fillRect(px,py,cs,cs);
    c.fillStyle='rgba('+rgb+',.22)';c.fillRect(px,py,cs,1);c.fillRect(px,py,1,cs);
    c.fillStyle='rgba(0,0,0,.55)';c.fillRect(px,py+cs-1,cs,1);c.fillRect(px+cs-1,py,1,cs);
    c.fillRect(px,py+half,cs,1);c.fillRect(px+((x+y)%2?half:Math.floor(cs/4)),py,1,half);
  }
  function draw(t){
    if(!s)return;
    var c=Arcade.ctx,W=Arcade.W,H=Arcade.H,A=Arcade.A;
    var cs=Math.floor(Math.min(W/s.cols,H/s.rows));
    var ox=Math.floor((W-cs*s.cols)/2),oy=Math.floor((H-cs*s.rows)/2);
    var shake=s.dead?Math.max(0,1-s.deadT/350)*cs*.35:0,x,y;
    c.fillStyle='#020604';c.fillRect(0,0,W,H);
    c.save();
    c.translate(ox+(Math.random()-.5)*shake*2,oy+(Math.random()-.5)*shake*2);

    c.fillStyle='rgba('+A.rgb+',.08)';
    for(y=1;y<s.rows-1;y++)for(x=1;x<s.cols-1;x++)c.fillRect(x*cs+cs/2-.5,y*cs+cs/2-.5,1,1);

    for(x=0;x<s.cols;x++){brick(c,x,0,cs,A.rgb);brick(c,x,s.rows-1,cs,A.rgb);}
    for(y=1;y<s.rows-1;y++){brick(c,0,y,cs,A.rgb);brick(c,s.cols-1,y,cs,A.rgb);}
    c.save();c.shadowColor=A.hex;c.shadowBlur=8;c.strokeStyle='rgba('+A.rgb+',.55)';c.lineWidth=1;
    c.strokeRect(cs+.5,cs+.5,(s.cols-2)*cs-1,(s.rows-2)*cs-1);c.restore();

    var f=s.food,k=Math.min(1,s.foodT/220),sc=k<1?easeBack(k):1+.08*Math.sin(t/180),fz=cs*.32;
    c.save();c.translate(f.x*cs+cs/2,f.y*cs+cs/2);c.scale(sc,sc);
    c.shadowColor='#ff3355';c.shadowBlur=10;c.fillStyle='#ff3355';c.fillRect(-fz,-fz,fz*2,fz*2);
    c.shadowBlur=0;c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-fz,-fz,fz*.75,fz*.5);
    c.fillStyle=A.hex;c.fillRect(-cs*.06,-cs*.5,cs*.14,cs*.2);
    c.restore();

    var n=s.body.length;
    for(var i=n-1;i>=0;i--){
      var b=s.body[i],head=i===0,a=head?1:.35+.65*(1-i/n),col=s.dead?'255,51,85':A.rgb;
      c.fillStyle='rgba('+col+','+a+')';
      if(head){c.save();c.shadowColor='rgb('+col+')';c.shadowBlur=12;}
      var p=head?1:Math.max(1,cs*.12);
      rr(c,b.x*cs+p,b.y*cs+p,cs-p*2,cs-p*2,cs*.28);c.fill();
      if(head){c.restore();eyes(c,b,cs);}
    }

    var z=Math.max(1,cs*.18);
    s.parts.forEach(function(p){
      c.fillStyle='rgba('+(p.c?'255,51,85':A.rgb)+','+(1-p.t/p.life)+')';
      c.fillRect(p.x*cs-z/2,p.y*cs-z/2,z,z);
    });
    c.font=Arcade.font(Math.max(7,Math.round(cs*.55)));c.textAlign='center';c.textBaseline='bottom';
    s.pops.forEach(function(p){
      c.fillStyle='rgba(254,188,46,'+(1-p.t/700)+')';
      c.fillText('+10',p.x*cs+cs/2,p.y*cs-p.t/700*cs*1.4);
    });
    c.restore();
    if(s.dead){c.fillStyle='rgba(255,51,85,'+(.22*Math.max(0,1-s.deadT/500))+')';c.fillRect(0,0,W,H);}
  }
  function eyes(c,b,cs){
    var d=s.dir,ex=b.x*cs+cs/2+d.x*cs*.18,ey=b.y*cs+cs/2+d.y*cs*.18,sd=cs*.2,r=Math.max(1,cs*.1);
    c.fillStyle='#03110a';
    c.fillRect(ex-d.y*sd-r,ey+d.x*sd-r,r*2,r*2);
    c.fillRect(ex+d.y*sd-r,ey-d.x*sd-r,r*2,r*2);
  }

  Arcade.register({
    id:'snake',title:'Snake',sprite:'snake',
    help:'SNAKE: EAT, GROW, DONT TOUCH THE WALL',
    best:best,bestLabel:function(){return Arcade.pad(best());},
    start:start,input:input,tick:tick,
    draw:function(t){draw(t);},stop:function(){s=null;}
  });
})();
