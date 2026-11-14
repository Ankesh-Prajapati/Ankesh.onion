// ══ TETRIS - ROOTBOY cartridge ════════════════════════════════════
// left/right move · up rotate · down soft drop · B hard drop · S pause
(function(){
  var COLS=10,ROWS=20,BEST_KEY='tetris_best';
  var COLORS={I:'#00f5ff',O:'#febc2e',T:'#b06fff',S:'#28c840',Z:'#ff3355',J:'#58a6ff',L:'#ff6d00'};
  var SHAPES={
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O:[[1,1],[1,1]],
    T:[[0,1,0],[1,1,1],[0,0,0]],
    S:[[0,1,1],[1,1,0],[0,0,0]],
    Z:[[1,1,0],[0,1,1],[0,0,0]],
    J:[[1,0,0],[1,1,1],[0,0,0]],
    L:[[0,0,1],[1,1,1],[0,0,0]]
  };
  var KEYS=Object.keys(SHAPES),g=null;

  function best(){try{return parseInt(localStorage.getItem(BEST_KEY)||'0',10)||0;}catch(e){return 0;}}
  function fromBag(){
    if(!g.bag.length){
      g.bag=KEYS.slice();
      for(var i=g.bag.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=g.bag[i];g.bag[i]=g.bag[j];g.bag[j]=t;}
    }
    return g.bag.pop();
  }
  function make(type){
    var m=SHAPES[type].map(function(r){return r.slice();});
    return {m:m,x:Math.floor((COLS-m[0].length)/2),y:type==='I'?-1:0,c:COLORS[type]};
  }
  function collides(p,dx,dy,m){
    m=m||p.m;
    for(var r=0;r<m.length;r++)for(var q=0;q<m[r].length;q++){
      if(!m[r][q])continue;
      var x=p.x+q+dx,y=p.y+r+dy;
      if(x<0||x>=COLS||y>=ROWS)return true;
      if(y>=0&&g.board[y][x])return true;
    }
    return false;
  }

  function start(){
    g={board:Array.from({length:ROWS},function(){return new Array(COLS).fill(0);}),bag:[],
      score:0,lines:0,level:1,acc:0,clearing:null,over:false,overT:0,done:false,hi:best(),flash:0};
    g.piece=make(fromBag());g.next=make(fromBag());
    hud();draw();
  }
  function gravity(){return Math.max(90,700-(g.level-1)*60);}
  function hud(){Arcade.hud([['SCORE',Arcade.pad(g.score)],['LINES',g.lines],['HI',Arcade.pad(Math.max(g.hi,g.score))]]);}

  function move(dx){if(!collides(g.piece,dx,0)){g.piece.x+=dx;Arcade.sfx('shift');}}
  function rotate(){
    var m=g.piece.m,N=m.length;
    var r=m.map(function(row,i){return row.map(function(_,j){return m[N-1-j][i];});});
    var kicks=[0,-1,1,-2,2];
    for(var k=0;k<kicks.length;k++){
      if(!collides(g.piece,kicks[k],0,r)){g.piece.m=r;g.piece.x+=kicks[k];Arcade.sfx('rotate');return;}
    }
  }
  function lock(){
    var p=g.piece;
    for(var r=0;r<p.m.length;r++)for(var q=0;q<p.m[r].length;q++){
      if(!p.m[r][q])continue;
      if(p.y+r<0){gameOver();return;}
      g.board[p.y+r][p.x+q]=p.c;
    }
    var full=[];
    for(var y=0;y<ROWS;y++)if(g.board[y].every(Boolean))full.push(y);
    if(full.length){
      g.clearing={rows:full,t:0};g.lines+=full.length;
      g.score+=[0,100,300,500,800][full.length]*g.level;
      g.level=Math.floor(g.lines/10)+1;
      Arcade.sfx(full.length===4?'win':'clear');hud();
    }else{Arcade.sfx('land');spawn();}
  }
  function spawn(){g.piece=g.next;g.next=make(fromBag());g.acc=0;if(collides(g.piece,0,0))gameOver();}
  function gameOver(){g.over=true;Arcade.sfx('crash');}

  function input(btn){
    if(g.over||g.clearing)return btn!=='s';
    if(btn==='left')move(-1);
    else if(btn==='right')move(1);
    else if(btn==='up')rotate();
    else if(btn==='down'){
      if(!collides(g.piece,0,1)){g.piece.y++;g.score+=1;g.acc=0;hud();}else lock();
    }
    else if(btn==='b'){
      var n=0;while(!collides(g.piece,0,1)){g.piece.y++;n++;}
      g.score+=n*2;g.flash=1;Arcade.sfx('drop');lock();hud();
    }
    else return false;
    return true;
  }

  function tick(dt){
    if(g.over){
      g.overT+=dt;draw();
      if(g.overT>1000&&!g.done){g.done=true;finish();}
      return;
    }
    if(g.clearing){
      g.clearing.t+=dt;
      if(g.clearing.t>=260){
        g.clearing.rows.forEach(function(y){g.board.splice(y,1);g.board.unshift(new Array(COLS).fill(0));});
        g.clearing=null;spawn();
      }
      draw();return;
    }
    g.acc+=dt;
    if(g.acc>=gravity()){g.acc=0;if(!collides(g.piece,0,1))g.piece.y++;else lock();}
    g.flash=Math.max(0,g.flash-dt/180);
    draw();
  }

  function finish(){
    var nb=g.score>0&&g.score>best();
    if(nb)try{localStorage.setItem(BEST_KEY,g.score);}catch(e){}
    Arcade.gameOver({body:'SCORE '+Arcade.pad(g.score)+'<br>LINES '+g.lines+' &middot; LVL '+g.level+
      (nb?'<br><span class="arc-gold">NEW HIGH SCORE!</span>':'')});
  }

  // ── render ──
  function block(c,x,y,b,col,a){
    var e=Math.max(1,Math.round(b*.15));
    c.globalAlpha=a;
    c.fillStyle=col;c.fillRect(x+1,y+1,b-2,b-2);
    c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x+1,y+1,b-2,e);c.fillRect(x+1,y+1,e,b-2);
    c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x+1,y+b-1-e,b-2,e);c.fillRect(x+b-1-e,y+1,e,b-2);
    c.globalAlpha=1;
  }
  function eachCell(p,fn){for(var r=0;r<p.m.length;r++)for(var q=0;q<p.m[r].length;q++)if(p.m[r][q])fn(p.x+q,p.y+r);}
  function draw(){
    if(!g)return;
    var c=Arcade.ctx,W=Arcade.W,H=Arcade.H,A=Arcade.A,x,y;
    var b=Math.max(6,Math.floor((H-10)/ROWS)),bw=b*COLS,bh=b*ROWS;
    var side=Math.max(Math.round(b*4.4),54),gap=Math.max(8,Math.round(b*.7));
    var ox=Math.floor((W-bw-gap-side)/2),oy=Math.floor((H-bh)/2);
    c.fillStyle='#020604';c.fillRect(0,0,W,H);
    c.fillStyle='#04100a';c.fillRect(ox,oy,bw,bh);
    c.strokeStyle='rgba('+A.rgb+',.07)';c.lineWidth=1;c.beginPath();
    for(x=1;x<COLS;x++){c.moveTo(ox+x*b+.5,oy);c.lineTo(ox+x*b+.5,oy+bh);}
    for(y=1;y<ROWS;y++){c.moveTo(ox,oy+y*b+.5);c.lineTo(ox+bw,oy+y*b+.5);}
    c.stroke();
    c.save();c.shadowColor=A.hex;c.shadowBlur=4+g.flash*14;
    c.strokeStyle='rgba('+A.rgb+','+(.45+g.flash*.5)+')';c.strokeRect(ox-1.5,oy-1.5,bw+3,bh+3);c.restore();

    for(y=0;y<ROWS;y++)for(x=0;x<COLS;x++)if(g.board[y][x])block(c,ox+x*b,oy+y*b,b,g.board[y][x],1);

    if(g.clearing){
      var on=Math.floor(g.clearing.t/65)%2===0;
      c.fillStyle=on?'rgba(255,255,255,.92)':'rgba('+A.rgb+',.6)';
      g.clearing.rows.forEach(function(r){c.fillRect(ox,oy+r*b,bw,b);});
    }else if(!g.over){
      var d=0;while(!collides(g.piece,0,d+1))d++;
      eachCell(g.piece,function(px,py){if(py+d>=0)block(c,ox+px*b,oy+(py+d)*b,b,g.piece.c,.18);});
      eachCell(g.piece,function(px,py){if(py>=0)block(c,ox+px*b,oy+py*b,b,g.piece.c,1);});
    }
    if(g.over){
      var k=Math.min(ROWS,Math.floor(g.overT/40));
      for(y=ROWS-1;y>=ROWS-k;y--)for(x=0;x<COLS;x++)block(c,ox+x*b,oy+y*b,b,'#2a3a33',1);
    }

    // side panel: next piece + level
    var sx=ox+bw+gap,fs=Math.max(6,Math.round(b*.45));
    c.font=Arcade.font(fs);c.textAlign='left';c.textBaseline='top';
    c.fillStyle='#7f9a8c';c.fillText('NEXT',sx,oy);
    var by=oy+Math.round(fs*1.8),bxh=Math.round(side*.8);
    c.strokeStyle='rgba('+A.rgb+',.3)';c.strokeRect(sx+.5,by+.5,side-1,bxh-1);
    var m=g.next.m,minR=9,maxR=-1,minC=9,maxC=-1;
    for(var r=0;r<m.length;r++)for(var q=0;q<m[r].length;q++)if(m[r][q]){minR=Math.min(minR,r);maxR=Math.max(maxR,r);minC=Math.min(minC,q);maxC=Math.max(maxC,q);}
    var nb=Math.floor(Math.min(side/5,bxh/3.2)),nw=(maxC-minC+1)*nb,nh=(maxR-minR+1)*nb;
    var nx=sx+Math.floor((side-nw)/2),ny=by+Math.floor((bxh-nh)/2);
    for(r=minR;r<=maxR;r++)for(q=minC;q<=maxC;q++)if(m[r][q])block(c,nx+(q-minC)*nb,ny+(r-minR)*nb,nb,g.next.c,1);
    var ly=by+bxh+Math.round(fs*1.6);
    c.fillStyle='#7f9a8c';c.fillText('LEVEL',sx,ly);
    c.fillStyle=A.hex;c.font=Arcade.font(Math.round(fs*1.6));c.fillText(String(g.level),sx,ly+Math.round(fs*1.6));
  }

  Arcade.register({
    id:'tetris',title:'Tetris',sprite:'tetro',
    help:'TETRIS: UP ROTATE &middot; DOWN SOFT DROP &middot; B HARD DROP',
    best:best,bestLabel:function(){return Arcade.pad(best());},
    start:start,input:input,tick:tick,
    draw:function(){draw();},stop:function(){g=null;}
  });
})();
