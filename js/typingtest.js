// ══ HACK TYPER - ROOTBOY cartridge ════════════════════════════════
// Picks a difficulty on the D-pad, then types into a hidden textarea
// (physical keyboard, or the on-screen keyboard after tapping the screen).
(function(){
  var SNIPPETS={
    easy:[
      'nmap -sV -p 80,443,22 192.168.1.1',
      'grep -r password /var/log/ 2>/dev/null',
      'sudo netstat -tulpn | grep LISTEN',
      'curl -X POST http://target.com/login -d user=admin',
      'cat /etc/passwd | cut -d: -f1',
      'ssh root@10.0.0.1 -p 2222 -i id_rsa',
      'find / -perm -4000 -type f 2>/dev/null',
      'hydra -l admin -P pass.txt ssh://192.168.0.1',
      'ping -c 4 8.8.8.8 && echo reachable',
      'ls -la /home/ && whoami && id'
    ],
    hard:[
      'msfconsole -q -x "use exploit/multi/handler; set LHOST 0.0.0.0; set LPORT 4444; run"',
      'python3 -c "import socket,os; s=socket.socket(); s.connect((10.0.0.1,4444)); os.dup2(s.fileno(),0)"',
      'openssl s_client -connect target.com:443 | openssl x509 -noout -text | grep Subject',
      'awk -F: "{if($3==0)print $1}" /etc/passwd && cat /etc/shadow | grep -v locked',
      'tcpdump -i eth0 -w capture.pcap port 80 or port 443 && tshark -r capture.pcap -T fields'
    ],
    elite:[
      'import socket,threading; scan=lambda h,p: socket.create_connection((h,p),0.5) and True',
      'SELECT table_name,column_name FROM information_schema.columns WHERE column_name LIKE pass;',
      'powershell -nop -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0AA==',
      'iptables -A INPUT -p tcp --dport 22 -m recent --update --seconds 60 --hitcount 4 -j DROP',
      'volatility -f memory.dmp --profile=Win7SP1x64 pstree | grep -E cmd.powershell && malfind'
    ]
  };
  var DIFFS=['easy','hard','elite'],BEST_KEY='hacktyper_best',LIMIT=60;
  var t=null,inp=null,timer=0,touch='ontouchstart' in window;

  function best(){try{return parseInt(localStorage.getItem(BEST_KEY)||'0',10)||0;}catch(e){return 0;}}
  function clearCanvas(){Arcade.ctx.fillStyle='#020604';Arcade.ctx.fillRect(0,0,Arcade.W,Arcade.H);}

  function start(){t={phase:'select',d:0};clearCanvas();renderSelect();}
  function renderSelect(){
    Arcade.hud([['MODE','HACK TYPER'],['HI',best()+' WPM']]);
    Arcade.dom.innerHTML='<div class="tt-sel"><div class="tt-h">SELECT DIFFICULTY</div>'+
      DIFFS.map(function(d,i){return '<div class="tt-opt'+(i===t.d?' sel':'')+'">'+d.toUpperCase()+'</div>';}).join('')+
      '<div class="tt-hint">PRESS S TO START</div></div>';
  }

  function begin(){
    var d=t.d,pool=SNIPPETS[DIFFS[d]];
    clearInterval(timer);
    t={phase:'run',d:d,code:pool[Math.floor(Math.random()*pool.length)],typed:'',left:LIMIT,started:0,pausedAt:0,correct:0,done:false};
    Arcade.dom.innerHTML='<div class="tt-run"><div class="tt-label">[ BREACH CODE &middot; '+DIFFS[d].toUpperCase()+' ]</div>'+
      '<div class="tt-code" id="ttCode"></div>'+
      '<div class="tt-tap">'+(touch?'TAP SCREEN TO TYPE':'TYPE TO HACK &middot; TAB = NEW CODE')+'</div></div>';
    inp=document.createElement('textarea');
    inp.id='arcTypeInput';inp.spellcheck=false;
    inp.setAttribute('autocomplete','off');inp.setAttribute('autocapitalize','none');inp.setAttribute('autocorrect','off');
    inp.addEventListener('input',onInput);inp.addEventListener('keydown',onKeyDown);
    Arcade.dom.appendChild(inp);
    render();hud();focus();
  }
  function focus(){if(inp&&t&&t.phase==='run'&&!t.done)inp.focus({preventScroll:true});}
  function onKeyDown(e){
    // keep the caret pinned to the end so the comparison stays positional
    if(/^(Arrow|Home|End|Page)/.test(e.key)||e.key==='Enter')e.preventDefault();
    if(e.key==='Tab'){e.preventDefault();begin();}
  }
  function onInput(){
    if(!t||t.done)return;
    var v=inp.value.slice(0,t.code.length);if(v!==inp.value)inp.value=v;
    if(!t.started&&v.length){t.started=Date.now();timer=setInterval(second,1000);}
    var grew=v.length>t.typed.length;t.typed=v;
    var ok=0;for(var i=0;i<v.length;i++)if(v[i]===t.code[i])ok++;t.correct=ok;
    if(grew)Arcade.sfx(v[v.length-1]===t.code[v.length-1]?'key':'shift');
    render();hud();
    if(v===t.code)finish(true);
  }
  function second(){t.left--;hud();if(t.left<=0)finish(false);}
  function stats(){
    // floor elapsed at 3s so the first few keystrokes don't flash a 300 WPM spike
    var mins=t.started?Math.max(3000,Date.now()-t.started)/60000:0;
    return {wpm:mins>0?Math.round(t.correct/5/mins):0,acc:t.typed.length?Math.round(t.correct/t.typed.length*100):100};
  }
  function hud(){var st=stats();Arcade.hud([['WPM',st.wpm],['ACC',st.acc+'%'],['TIME',t.left]]);}
  function render(){
    var el=document.getElementById('ttCode');if(!el)return;
    var h='',c=t.code,v=t.typed;
    for(var i=0;i<c.length;i++){
      var ch=escHtml(c[i]);
      if(i<v.length)h+='<span class="'+(v[i]===c[i]?'ok':'bad')+'">'+ch+'</span>';
      else if(i===v.length)h+='<span class="cur">'+ch+'</span>';
      else h+=ch;
    }
    el.innerHTML=h;
  }
  function finish(done){
    if(t.done)return;
    t.done=true;clearInterval(timer);if(inp)inp.blur();
    var st=stats(),rank='SCRIPT KIDDIE';
    if(st.wpm>=80&&st.acc>=95)rank='ELITE HACKER';
    else if(st.wpm>=60&&st.acc>=90)rank='RED TEAMER';
    else if(st.wpm>=40&&st.acc>=85)rank='PENTESTER';
    else if(st.wpm>=25)rank='ANALYST';
    var nb=st.wpm>best();
    if(nb)try{localStorage.setItem(BEST_KEY,st.wpm);}catch(e){}
    Arcade.gameOver({title:done?'ACCESS GRANTED':'TIME UP',danger:!done,sfx:done?'win':'over',
      body:'WPM '+st.wpm+' &middot; ACC '+st.acc+'%<br>RANK ['+rank+']'+(nb?'<br><span class="arc-gold">NEW HIGH SCORE!</span>':'')});
  }

  function input(btn){
    if(!t)return false;
    if(t.phase==='select'){
      if(btn==='up'||btn==='down'){t.d=(t.d+(btn==='up'?-1:1)+DIFFS.length)%DIFFS.length;Arcade.sfx('move');renderSelect();}
      else if(btn==='s'){Arcade.sfx('select');begin();}
      else if(btn==='b'){Arcade.sfx('back');Arcade.toMenu();}
      return true;
    }
    return btn!=='s'&&btn!=='b';
  }
  function pause(){
    clearInterval(timer);if(inp)inp.blur();
    if(t&&t.started&&!t.done)t.pausedAt=Date.now();
  }
  function resume(){
    if(!t||t.phase!=='run'||t.done)return;
    if(t.started){t.started+=Date.now()-t.pausedAt;timer=setInterval(second,1000);} // paused time doesn't count against WPM
    focus();
  }
  function stop(){clearInterval(timer);t=null;if(inp){inp.remove();inp=null;}}

  Arcade.register({
    id:'typer',title:'Hack Typer',sprite:'term',
    help:'HACK TYPER: TYPE THE CODE BEFORE TIME RUNS OUT',
    best:best,bestLabel:function(){return best()+' WPM';},
    start:start,input:input,tick:function(){},
    pause:pause,resume:resume,stop:stop,tap:focus
  });
})();
