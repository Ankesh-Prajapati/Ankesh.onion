// ══════════════════════════════════════════════════════════════════
// ROOTBOY - handheld console that hosts the portfolio games.
// Each game registers a cartridge:
//   {id,title,sprite,help,best(),bestLabel(),start(),tick(dt,t),
//    input(btn)->handled, draw?(t), pause?(), resume?(), stop?(), tap?()}
// Buttons: up/down/left/right, s (start/pause), b (action/back).
// ══════════════════════════════════════════════════════════════════
var Arcade=(function(){
  var games=[],sel=0,state='off',cur=null,helpPrev=null,lastOvl=null,bootT=0;
  var win,dev,inner,views={},listEl,hlEl,hudEl,stage,canvas,ctx,domEl,ovl,banner,bctx,led,toastEl;
  var raf=0,last=0,built=false,muted=false,shell=0,held=null,repT=0;
  var SHELLS=['stealth','glass','neon'];
  var A={hex:'#00ff9d',rgb:'0,255,157'};
  var api={W:0,H:0,ctx:null,dom:null,A:A};

  function $(id){return document.getElementById(id);}
  function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function put(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function pad(n,l){n=String(Math.max(0,Math.floor(n||0)));while(n.length<(l||5))n='0'+n;return n;}
  function readAccent(){
    var cs=getComputedStyle(document.documentElement);
    A.hex=(cs.getPropertyValue('--accent')||'#00ff9d').trim();
    A.rgb=(cs.getPropertyValue('--accent-rgb')||'0,255,157').replace(/\s/g,'');
  }

  // ── pixel sprites (A = theme accent) ──
  var SPRITES={
    snake:["..AAAA...",".AKAAKA..",".AAAAAAR.","..AAAA...","AA..AA...","AAAAAA...",".AAAA...."],
    tetro:["CCCPPPCCC","CwCPwPCwC","CCCPPPCCC","...YYY...","...YwY...","...YYY..."],
    bug:[".R....R.","..R..R..",".RRRRRR.","RRKRRKRR",".RRRRRR.","R.RRRR.R",".R....R."],
    term:["WWWWWWWWWW","WKKKKKKKKW","WKAKKKKKKW","WKKAKKKKKW","WKAKKAAAKW","WKKKKKKKKW","WWWWWWWWWW","...WWWW..."]
  };
  function col(ch){return {A:A.hex,K:'#04100a',R:'#ff3355',P:'#b06fff',C:'#00c8ff',Y:'#febc2e',W:'#7d8a96',w:'rgba(255,255,255,.55)'}[ch];}
  function drawSprite(c,map,x,y){
    for(var r=0;r<map.length;r++)for(var q=0;q<map[r].length;q++){
      var ch=map[r][q];if(ch==='.')continue;c.fillStyle=col(ch);c.fillRect(x+q,y+r,1,1);
    }
  }
  var urlCache={};
  function spriteURL(name){
    var k=name+A.hex;if(urlCache[k])return urlCache[k];
    var m=SPRITES[name],c=document.createElement('canvas');c.width=m[0].length;c.height=m.length;
    drawSprite(c.getContext('2d'),m,0,0);return urlCache[k]=c.toDataURL();
  }
  var cnvCache={};
  function spriteCanvas(name){
    var k=name+A.hex;if(cnvCache[k])return cnvCache[k];
    var m=SPRITES[name],c=document.createElement('canvas');c.width=m[0].length;c.height=m.length;
    drawSprite(c.getContext('2d'),m,0,0);return cnvCache[k]=c;
  }

  // ── chiptune sfx (WebAudio, created on first user gesture) ──
  var ac=null,marchI=0;
  function tone(f,d,o){
    o=o||{};
    try{
      ac=ac||new(window.AudioContext||window.webkitAudioContext)();
      if(ac.state==='suspended')ac.resume();
      var t=ac.currentTime+(o.at||0),osc=ac.createOscillator(),g=ac.createGain();
      osc.type=o.type||'square';osc.frequency.setValueAtTime(f,t);
      if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t+d);
      g.gain.setValueAtTime(o.vol||0.035,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
      osc.connect(g);g.connect(ac.destination);osc.start(t);osc.stop(t+d+0.03);
    }catch(e){}
  }
  function seq(fs,d,step,vol){fs.forEach(function(f,i){tone(f,d,{at:i*step,vol:vol});});}
  var SFX={
    move:function(){tone(640,.035);},
    select:function(){tone(660,.06);tone(990,.1,{at:.06});},
    back:function(){tone(420,.08,{to:300});},
    pause:function(){tone(520,.05);tone(390,.07,{at:.05});},
    eat:function(){tone(880,.07,{to:1400,vol:.04});},
    rotate:function(){tone(560,.03,{type:'triangle',vol:.05});},
    shift:function(){tone(300,.02,{type:'triangle',vol:.03});},
    land:function(){tone(150,.06,{type:'triangle',vol:.05});},
    drop:function(){tone(260,.09,{to:90,vol:.045});},
    clear:function(){seq([523,659,784,1047],.09,.06);},
    win:function(){seq([523,659,784,1047,1319],.1,.07);},
    crash:function(){tone(220,.35,{type:'sawtooth',to:55,vol:.045});},
    over:function(){seq([392,330,262,196],.16,.13);},
    boot:function(){seq([392,523,659,784],.13,.1,.03);tone(1047,.35,{at:.42,vol:.03});},
    key:function(){tone(1500,.012,{vol:.015});},
    shoot:function(){tone(1400,.07,{to:500,vol:.025});},
    zap:function(){tone(320,.14,{type:'sawtooth',to:70,vol:.04});},
    march:function(){tone([98,92,87,82][marchI++%4],.07,{type:'triangle',vol:.07});}
  };
  function sfx(n){
    if(muted||!SFX[n])return;SFX[n]();
    if(led){led.classList.remove('blip');void led.offsetWidth;led.classList.add('blip');}
  }

  // ── setup ──
  function build(){
    if(built)return;built=true;
    win=$('win-arcade');dev=$('arcDevice');inner=$('arcInner');led=$('arcLed');
    views={boot:$('arcVBoot'),menu:$('arcVMenu'),game:$('arcVGame')};
    listEl=$('arcList');hudEl=$('arcHud');stage=$('arcStage');canvas=$('arcCanvas');
    ctx=canvas.getContext('2d');domEl=$('arcDom');ovl=$('arcOvl');toastEl=$('arcToast');
    banner=$('arcBanner');bctx=banner.getContext('2d');
    api.ctx=ctx;api.dom=domEl;
    muted=get('arcadeMuted')==='1';
    shell=Math.max(0,SHELLS.indexOf(get('arcadeShell')));
    dev.dataset.shell=SHELLS[shell];
    dev.classList.toggle('muted',muted);

    dev.addEventListener('pointerdown',onPointerDown);
    document.addEventListener('pointerup',stopRepeat);
    document.addEventListener('pointercancel',stopRepeat);
    dev.addEventListener('click',onAct);
    listEl.addEventListener('click',function(e){
      var it=e.target.closest('.arc-item');if(!it||state!=='menu')return;
      var i=+it.dataset.i;
      if(i===sel){sfx('select');startGame(i);}else{sel=i;renderSel();sfx('move');}
    });
    stage.addEventListener('click',function(){if(state==='game'&&cur&&cur.tap)cur.tap();});
    if(window.ResizeObserver)new ResizeObserver(onResize).observe(stage);
    window.addEventListener('resize',onResize);
    window.addEventListener('themechange',function(){readAccent();urlCache={};cnvCache={};if(state==='menu')renderMenu();});
    document.addEventListener('keydown',onKey);
    document.addEventListener('keyup',onKeyUp);
    document.addEventListener('visibilitychange',function(){if(document.hidden)blur();});
    if(document.fonts&&document.fonts.load)document.fonts.load('10px "Press Start 2P"');
  }

  function live(){return state!=='off'&&win.style.display!=='none'&&!win.classList.contains('minimized');}

  // ── power ──
  function open(){
    build();
    if(state!=='off')return;
    readAccent();
    if(!(typeof windowMoved!=='undefined'&&windowMoved.arcade)){
      win.style.left=Math.max(8,(innerWidth-dev.offsetWidth)/2)+'px';
      win.style.top=Math.max(8,(innerHeight-44-dev.offsetHeight)/2)+'px';
    }
    dev.classList.remove('pop');void dev.offsetWidth;dev.classList.add('pop');
    state='boot';
    inner.classList.remove('crt-off','crt-on');void inner.offsetWidth;inner.classList.add('crt-on');
    hideOvl();show('boot');sfx('boot');
    clearTimeout(bootT);bootT=setTimeout(toMenu,1700);
    cancelAnimationFrame(raf);last=0;raf=requestAnimationFrame(loop);
  }
  function powerOff(){
    if(state==='off')return;
    if(state==='game')pause(true);
    sfx('back');
    inner.classList.remove('crt-on');void inner.offsetWidth;inner.classList.add('crt-off');
    setTimeout(function(){closeWindow('arcade');},380);
  }
  function close(){ // called by closeWindow()
    if(!built)return;
    clearTimeout(bootT);stopRepeat();
    if(cur&&cur.stop)cur.stop();
    cur=null;state='off';hideOvl();
    cancelAnimationFrame(raf);
    inner.classList.remove('crt-off','crt-on');
  }
  function blur(){
    if(state==='game')pause();
    // keyup/pointerup can be missed once focus leaves; don't leave buttons stuck down
    if(dev)dev.querySelectorAll('[data-btn].down').forEach(function(b){b.classList.remove('down');});
  }

  // ── views ──
  function show(v){
    Object.keys(views).forEach(function(k){views[k].classList.toggle('on',k===v);});
    if(v==='game')resizeStage();
  }
  function toMenu(){
    clearTimeout(bootT);
    if(cur&&cur.stop)cur.stop();
    cur=null;state='menu';hideOvl();show('menu');
    renderMenu();
    requestAnimationFrame(function(){sizeBanner();renderSel(true);});
  }
  function renderMenu(){
    listEl.innerHTML='<div class="arc-hl" id="arcHl"></div>'+games.map(function(g,i){
      return '<div class="arc-item" data-i="'+i+'"><img src="'+spriteURL(g.sprite)+'" alt=""><span>'+g.title+'</span></div>';
    }).join('');
    hlEl=$('arcHl');renderSel(true);
  }
  function renderSel(instant){
    var items=listEl.querySelectorAll('.arc-item');if(!items.length)return;
    items.forEach(function(it,i){it.classList.toggle('sel',i===sel);});
    popAt=performance.now();
    var it=items[sel];
    hlEl.style.transition=instant?'none':'';
    hlEl.style.transform='translateY('+it.offsetTop+'px)';
    hlEl.style.height=it.offsetHeight+'px';
    $('arcSelCount').textContent=pad(sel+1,2)+'/'+pad(games.length,2);
    $('arcMenuBest').textContent=games[sel].bestLabel();
  }

  function startGame(i){
    if(cur&&cur.stop)cur.stop();
    cur=games[i];sel=i;state='game';
    hideOvl();show('game');
    ctx.fillStyle='#020604';ctx.fillRect(0,0,api.W,api.H);
    domEl.innerHTML='';
    cur.start();
  }
  function pause(silent){
    if(state!=='game')return;
    state='paused';if(cur.pause)cur.pause();
    overlay({title:'PAUSED',hint:[['S','RESUME'],['B','MENU']]});
    if(!silent)sfx('pause');
  }
  function resume(){state='game';hideOvl();if(cur.resume)cur.resume();last=0;}
  function gameOver(o){
    state='over';
    overlay({title:o.title||'GAME OVER',danger:o.danger!==false,body:o.body,hint:[['S','RETRY'],['B','MENU']]});
    sfx(o.sfx||'over');
  }

  function overlay(o,noSave){
    if(!noSave)lastOvl=o;
    ovl.innerHTML='<div class="arc-ovl-t'+(o.danger?' danger':'')+'">'+o.title+'</div>'+
      (o.body?'<div class="arc-ovl-b">'+o.body+'</div>':'')+
      (o.hint?'<div class="arc-ovl-h">'+o.hint.map(function(h){return '<span><kbd>'+h[0]+'</kbd>'+h[1]+'</span>';}).join('')+'</div>':'');
    ovl.classList.remove('on');void ovl.offsetWidth;ovl.classList.add('on');
  }
  function hideOvl(){ovl.classList.remove('on');}

  var HELP='<div class="arc-help">'+
    '<div><kbd>D-PAD</kbd><span>MOVE / STEER</span></div>'+
    '<div><kbd>S</kbd><span>START / PAUSE</span></div>'+
    '<div><kbd>B</kbd><span>ACTION / BACK</span></div>'+
    '<p>KEYS: ARROWS &middot; ENTER=S &middot; SPACE=B &middot; ESC=B</p>'+
    '<p>PSST: A CHEAT CODE FROM 1986 STILL WORKS HERE</p>';
  function toggleHelp(){
    if(state==='off'||state==='boot')return;
    if(state==='help'){closeHelp();return;}
    if(state==='game')pause(true);
    helpPrev=state;state='help';
    var g=helpPrev==='menu'?games[sel]:cur;
    overlay({title:'HELP',body:HELP+(g?'<p>'+g.help+'</p>':'')+'</div>',hint:[['ANY','CLOSE']]},true);
    sfx('select');
  }
  function closeHelp(){
    state=helpPrev;sfx('back');
    if(state==='menu')hideOvl();else if(lastOvl)overlay(lastOvl,true);
  }

  // ── input ──
  function press(btn){
    if(state==='off')return;
    if(state==='help'){closeHelp();return;}
    if(state==='boot'){toMenu();sfx('select');return;}
    if(state==='menu'){
      if(btn==='up'||btn==='down'){sel=(sel+(btn==='up'?-1:1)+games.length)%games.length;renderSel();sfx('move');}
      else if(btn==='s'){sfx('select');startGame(sel);}
      return;
    }
    if(state==='game'){
      if(cur.input&&cur.input(btn))return;
      if(btn==='s'||btn==='b')pause();
      return;
    }
    if(state==='paused'){
      if(btn==='s'){sfx('select');resume();}else if(btn==='b'){sfx('back');toMenu();}
      return;
    }
    if(state==='over'){
      if(btn==='s'){sfx('select');startGame(sel);}else if(btn==='b'){sfx('back');toMenu();}
    }
  }

  var DIRS={up:1,down:1,left:1,right:1};
  function onPointerDown(e){
    if(typeof activeWindow!=='undefined'&&activeWindow!=='arcade')focusWindow(win,'arcade');
    var b=e.target.closest('[data-btn]');if(!b)return;
    e.preventDefault();
    try{b.setPointerCapture(e.pointerId);}catch(x){}
    stopRepeat();held=b;
    var n=b.dataset.btn;b.classList.add('down');press(n);
    if(window.konamiFeed)konamiFeed(DIRS[n]?'arrow'+n:n==='s'?'a':n);
    if(DIRS[n])repT=setTimeout(function rep(){press(n);repT=setTimeout(rep,80);},240);
  }
  function stopRepeat(){clearTimeout(repT);if(held){held.classList.remove('down');held=null;}}

  function onAct(e){
    var a=e.target.closest('[data-act]');if(!a)return;
    var k=a.dataset.act;
    if(k==='close')powerOff();
    else if(k==='min'){blur();minimizeWindow('arcade');}
    else if(k==='sound'){
      muted=!muted;put('arcadeMuted',muted?'1':'0');dev.classList.toggle('muted',muted);
      if(!muted)sfx('select');toast(muted?'SOUND OFF':'SOUND ON');
    }
    else if(k==='theme'){
      shell=(shell+1)%SHELLS.length;dev.dataset.shell=SHELLS[shell];put('arcadeShell',SHELLS[shell]);
      toast('SHELL: '+SHELLS[shell].toUpperCase());sfx('move');
    }
    else if(k==='help')toggleHelp();
  }

  var KEYS={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',
    Enter:'s',s:'s',S:'s',p:'s',P:'s',b:'b',B:'b',' ':'b',Escape:'b',h:'help',H:'help','?':'help'};
  function onKey(e){
    if(!live()||(typeof activeWindow!=='undefined'&&activeWindow!=='arcade'))return;
    var ae=document.activeElement,typing=ae&&ae.id==='arcTypeInput';
    if(typing&&e.key!=='Escape')return; // Hack Typer owns the keyboard while typing
    if(!typing&&ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;
    var n=KEYS[e.key];if(!n)return;
    e.preventDefault();
    if(n==='help'){if(!e.repeat)toggleHelp();return;}
    var b=dev.querySelector('[data-btn="'+n+'"]');if(b)b.classList.add('down');
    if(e.repeat&&!DIRS[n])return;
    press(n);
  }
  function onKeyUp(e){
    var n=KEYS[e.key];if(!n||!dev)return;
    var b=dev.querySelector('[data-btn="'+n+'"]');if(b)b.classList.remove('down');
  }

  function toast(t){toastEl.textContent=t;toastEl.classList.remove('on');void toastEl.offsetWidth;toastEl.classList.add('on');}

  // ── loop ──
  function loop(t){
    raf=requestAnimationFrame(loop);
    var dt=last?Math.min(48,t-last):16;last=t;
    if(!live())return;
    if(state==='game'&&typeof activeWindow!=='undefined'&&activeWindow!=='arcade'){pause();return;}
    if(state==='menu')drawBanner(t);
    else if(state==='game'&&cur&&cur.tick)cur.tick(dt,t);
  }

  function resizeStage(){
    var r=stage.getBoundingClientRect();if(!r.width||!r.height)return;
    var d=Math.min(2,window.devicePixelRatio||1);
    api.W=r.width;api.H=r.height;
    canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);
    ctx.setTransform(d,0,0,d,0,0);ctx.imageSmoothingEnabled=false;
  }
  function onResize(){
    if(!built||state==='off')return;
    resizeStage();
    if(state==='menu'){sizeBanner();renderSel(true);}
    if(cur&&cur.draw&&state!=='game')cur.draw(performance.now());
  }

  // ── menu banner: low-res pixel scene, CSS scales it up ──
  var bw=0,BH=26,stars=[],popAt=0;
  function sizeBanner(){
    var r=banner.getBoundingClientRect();if(!r.width)return;
    var px=Math.max(1,Math.round(r.height/BH));
    bw=Math.ceil(r.width/px);banner.width=bw;banner.height=BH;
    stars=[];for(var i=0;i<Math.round(bw/6);i++)stars.push({x:Math.random()*bw|0,y:Math.random()*12|0,p:Math.random()*6});
  }
  function drawBanner(t){
    if(!bw)return;
    var c=bctx,s=t/1000,x,h,o;
    var sky=['#04070c','#060c12','#081219','#0a1820'];
    for(var i=0;i<20;i++){c.fillStyle=sky[Math.min(3,i>>2)];c.fillRect(0,i,bw,1);}
    stars.forEach(function(st){c.fillStyle='rgba(220,255,235,'+(0.3+0.7*Math.abs(Math.sin(s*1.3+st.p))).toFixed(2)+')';c.fillRect(st.x,st.y,1,1);});
    c.fillStyle='#d9f7e6';c.fillRect(bw-12,3,3,4);c.fillRect(bw-13,4,1,2);
    o=s*3;c.fillStyle='#0d2a1e';
    for(x=0;x<bw;x++){h=5+Math.round(2.5*Math.sin((x+o)/9)+1.6*Math.sin((x+o)/4.3));c.fillRect(x,20-h,1,h);}
    o=s*7;c.fillStyle='#123a27';
    for(x=0;x<bw;x++){h=2+Math.round(1.6*Math.sin((x+o)/6));c.fillRect(x,20-h,1,h);}
    c.fillStyle='#16432b';c.fillRect(0,20,bw,6);
    c.fillStyle=A.hex;c.globalAlpha=.6;c.fillRect(0,20,bw,1);c.globalAlpha=1;
    o=(s*18)%8;c.fillStyle='#0d2a1c';for(x=-o;x<bw;x+=8)c.fillRect(Math.round(x),23,4,1);
    // one slot per game; the selected one pops up (scale + lift, with a
    // little sparkle burst) and keeps bobbing, the rest wait dimmed
    c.imageSmoothingEnabled=false;
    var slot=bw/games.length,k=Math.min(1,(t-popAt)/320);
    var e=k<1?1+2.7*Math.pow(k-1,3)+1.7*Math.pow(k-1,2):1; // ease-out-back
    games.forEach(function(g,i){
      var cv=spriteCanvas(g.sprite),w=cv.width,h=cv.height,cx=Math.round(slot*(i+.5));
      if(i!==sel){
        c.globalAlpha=.4;c.drawImage(cv,cx-(w>>1),20-h);c.globalAlpha=1;
        return;
      }
      var sc=1+.9*e,lift=Math.round(3*e)+(k>=1?Math.round(Math.sin(t/240)):0);
      var dw=Math.round(w*sc),dh=Math.round(h*sc),x0=cx-(dw>>1),y0=20-dh-lift;
      c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x0+1,20,dw-2,1);
      c.fillStyle=A.hex;c.fillRect(x0-2,20,dw+4,1);
      c.drawImage(cv,x0,y0,dw,dh);
      if(k<1){
        var d=Math.round(2+k*7),my=y0+(dh>>1);
        c.globalAlpha=1-k;c.fillStyle='#eafff3';
        c.fillRect(x0-d,my-d,1,1);c.fillRect(x0+dw+d-1,my-d,1,1);
        c.fillRect(x0-d,my+d,1,1);c.fillRect(x0+dw+d-1,my+d,1,1);
        c.globalAlpha=1;
      }
    });
  }

  api.register=function(g){games.push(g);};
  // held state for games that poll (e.g. smooth movement); keyboard and pointer both toggle .down
  api.isDown=function(n){return !!(dev&&dev.querySelector('[data-btn="'+n+'"].down'));};
  api.open=open;api.close=close;api.blur=blur;
  api.toMenu=toMenu;api.gameOver=gameOver;api.sfx=sfx;api.pad=pad;
  api.hud=function(items){hudEl.innerHTML=items.map(function(p){return '<span>'+p[0]+' <b>'+escHtml(String(p[1]))+'</b></span>';}).join('');};
  api.font=function(px){return px+'px "Press Start 2P", monospace';};
  return api;
})();
