// ===================== TERMINAL =====================
const termData={
  home:`<span class="t-green">========================</span>
<span class="t-green">   PROFILE / HOME</span>
<span class="t-green">========================</span>
<span class="t-muted">Name:</span>     Ankesh Prajapati
<span class="t-muted">Role:</span>     Cybersecurity Analyst (VAPT)
<span class="t-muted">Org:</span>      Securis360
<span class="t-muted">Location:</span>  India
<span class="t-muted">Mindset:</span>  Break-first, document properly.
`,
  skills:`<span class="t-yellow">VAPT Coverage:</span>
  Web / Mobile / API / Network / Cloud
  Thick-Client / Source Code Review

<span class="t-yellow">Tools:</span>
  Burp Suite, Nessus, Nmap, Metasploit
  Wireshark, Kali Linux, Python

<span class="t-yellow">Building:</span>
  Internal VAPT tooling & automation
`,
  experience:`<span class="t-blue">[2025-Now]</span> <span class="t-green">Security Analyst & Pentester @ Securis360</span>
  60+ VAPT engagements, internal tooling,
  detailed reporting, patch validation.

<span class="t-blue">[2024-2025]</span> <span class="t-green">Cybersecurity Intern @ State Cyber Crime Cell</span>
   assisted with pentesting on govt systems.

<span class="t-blue">[2022-2023]</span> <span class="t-yellow">Web Developer @ MOROSQ</span>
  Secure web modules, vuln patching.
`,
  projects:`<span class="t-green">1. Warden</span> <span class="t-muted">(private)</span>
   Static security analysis for Windows
   thick-client apps — secrets, DLL hijack
   risk, code-signing, RE exposure.

<span class="t-green">2. GhostRecon</span>
   Zero-dependency OSINT dork engine.
   Multi-engine query builder & bulk exec.

<span class="t-green">3. GhostRecon v2</span>
   Passive OSINT correlation console.
   7 recon modules -> single exposure score.

<span class="t-green">4. PhishAware</span>
   Frontend-only phishing awareness
   simulation platform. GitHub Pages.
`,
  certs:`<span class="t-green">✓</span> Certified Ethical Hacker (CEH)
<span class="t-green">✓</span> Certified Network Security Practitioner (CNSP)
<span class="t-green">✓</span> Junior Cybersecurity Analyst — Cisco
<span class="t-green">✓</span> Endpoint Security — Cisco
<span class="t-green">✓</span> PHP & MySQL Training — IIT Bombay
<span class="t-green">✓</span> Power BI — Parul University
`,
  contact:`<span class="t-green">Email:</span>    ankeshprajapati217@gmail.com
<span class="t-green">Phone:</span>    +91 93282 36503
<span class="t-green">LinkedIn:</span> linkedin.com/in/ankesh-prajapati-0a87a8249
<span class="t-green">Location:</span>  India
`,
  education:`<span class="t-green">M.C.A.</span> Cybersecurity & Digital Forensics
  Parul University (2023-2025)

<span class="t-green">B.C.A.</span>
  Veer Narmad South Gujarat University (2019-2022)
`
};

const breachLogs=[
  "suspicious login pattern detected...",
  "analyzing abnormal network flow...",
  "cross-referencing IOC signatures...",
  "hash mismatch in critical binary...",
  "failed login attempts spiking from remote subnet...",
  "unauthorized API probe detected...",
  "privilege escalation attempt logged...",
  "potential data exfiltration route identified...",
  "SSL certificate anomaly detected...",
  "port scan incoming from 192.168.x.x...",
];

// ═══ TERMINAL ENGINE ═══════════════════════════════════════════════════════
var cmdHistory=[],histIdx=-1,termBusy=false,_tv="";

function termFocus(){
  var ta=document.getElementById("termCapture");
  if(ta)ta.focus();
}
function termScrollBottom(){
  var sc=document.getElementById("termScroll");
  if(sc)sc.scrollTop=sc.scrollHeight;
}
function escHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function termSync(){
  var t=document.getElementById("termTyped");
  if(t)t.textContent=_tv;
  termScrollBottom();
}
function termFreeze(){
  var ps1="<span class=\"t-green\">ankesh</span>"+"<span class=\"t-muted\">@</span>"+"<span class=\"t-blue\">root</span>"+"<span class=\"t-muted\">:~$</span> ";
  printTerm(ps1+escHtml(_tv));
}

function initTerminal(){
  var ta=document.getElementById("termCapture");
  if(!ta)return;
  _tv=""; ta.value="";
  printTerm("<span class=\"t-green\">Ankesh-OS</span> <span class=\"t-muted\">v2.5.1 — ankesh@root</span>");
  printTerm("<span class=\"t-muted\">─────────────────────────────────────</span>");
  printTerm("Type <span class=\"t-green\">help</span> for commands. Tab to autocomplete.");
  printTerm("");

  ta.addEventListener("input",function(){
    // strip any newlines that sneak in (mobile return key)
    var v=ta.value;
    var clean="";
    for(var i=0;i<v.length;i++){if(v[i]!=="\n"&&v[i]!=="\r")clean+=v[i];}
    ta.value=clean;
    _tv=clean;
    termSync();
  });

  ta.addEventListener("keydown",function(e){
    if(termBusy&&!(e.ctrlKey&&e.key==="c"))return;
    if(e.key==="Enter"){
      e.preventDefault();
      var cmd=_tv.trim();
      termFreeze();
      _tv="";ta.value="";
      termSync();
      if(cmd){cmdHistory.unshift(cmd);histIdx=-1;handleTermCmd(cmd);}
      termScrollBottom();
    } else if(e.key==="ArrowUp"){
      e.preventDefault();
      histIdx=Math.min(histIdx+1,cmdHistory.length-1);
      _tv=cmdHistory[histIdx]||"";ta.value=_tv;termSync();
    } else if(e.key==="ArrowDown"){
      e.preventDefault();
      histIdx=Math.max(histIdx-1,-1);
      _tv=histIdx>=0?cmdHistory[histIdx]:"";ta.value=_tv;termSync();
    } else if(e.key==="Tab"){
      e.preventDefault();
      var p=_tv.toLowerCase().trimStart();
      var opts=["help","whoami","pwd","ls","ls -la","clear","exit","scan","hack ","open ","about","skills","experience","projects","certs","contact"];
      var m=opts.find(function(o){return o.startsWith(p)&&o!==p;});
      if(m){_tv=m;ta.value=m;termSync();}
    } else if(e.ctrlKey&&e.key==="c"){
      e.preventDefault();
      termFreeze();
      var out=document.getElementById("termOutput");
      if(out&&out.lastChild)out.lastChild.innerHTML+='<span class="t-muted">^C</span>';
      _tv="";ta.value="";termSync();
      termBusy=false;histIdx=-1;
    } else if(e.ctrlKey&&e.key==="l"){
      e.preventDefault();
      document.getElementById("termOutput").innerHTML="";
      termScrollBottom();
    }
  });

  var body=document.getElementById("termBody");
  if(body){
    body.addEventListener("click",termFocus);
    body.addEventListener("touchend",function(e){e.preventDefault();termFocus();},{passive:false});
  }
  ta.addEventListener("blur",function(){
    setTimeout(function(){
      var w=document.getElementById("win-terminal");
      if(w&&w.style.display!=="none"&&w.classList.contains("focused"))termFocus();
    },200);
  });
  termFocus();
}

function printTerm(html){
  var out=document.getElementById("termOutput");
  if(!out)return;
  // Split on literal \n within the html so multi-line strings each get their own div
  var lines=html.split("\n");
  for(var i=0;i<lines.length;i++){
    var d=document.createElement("div");
    d.className="term-line";
    // Empty line: use a zero-width space so the div has natural line height
    d.innerHTML=lines[i]===""?"\u200b":lines[i];
    out.appendChild(d);
  }
  termScrollBottom();
}
// ═══ END TERMINAL ════════════════════════════════════════════════════════════


function handleTermCmd(cmd){
  const c=cmd.toLowerCase().trim();
  if(c==="help"){
    printTerm('<span class="t-muted">available commands:</span>');
    printTerm('  <span class="t-green">about</span>  <span class="t-green">skills</span>  <span class="t-green">experience</span>  <span class="t-green">projects</span>  <span class="t-green">certs</span>  <span class="t-green">contact</span>');
    printTerm('  <span class="t-green">whoami</span>  <span class="t-green">pwd</span>  <span class="t-green">ls</span>  <span class="t-green">clear</span>  <span class="t-green">exit</span>  <span class="t-green">scan</span>');
    printTerm('  <span class="t-green">hack &lt;target&gt;</span>  <span class="t-muted">e.g. hack nasa.gov</span>');
    printTerm('  <span class="t-green">open &lt;window&gt;</span>  <span class="t-muted">e.g. open about</span>');
    printTerm('  <span class="t-muted">Tab</span> autocomplete  ·  <span class="t-muted">↑↓</span> history  ·  <span class="t-muted">Ctrl+C</span> cancel');
  } else if(c==="whoami"){
    printTerm('<span class="t-green">ankesh</span> — Security Analyst | VAPT Specialist');
  } else if(c==="pwd"){
    printTerm('<span class="t-muted">/home/ankesh/portfolio</span>');
  } else if(c==="ls"||c==="ls -la"){
    printTerm('<span class="t-muted">total 48</span>');
    printTerm('<span class="t-blue">drwxr-xr-x</span>  ankesh  staff   about.sh');
    printTerm('<span class="t-blue">drwxr-xr-x</span>  ankesh  staff   skills.sh');
    printTerm('<span class="t-blue">drwxr-xr-x</span>  ankesh  staff   experience.log');
    printTerm('<span class="t-blue">drwxr-xr-x</span>  ankesh  staff   projects/');
    printTerm('<span class="t-blue">drwxr-xr-x</span>  ankesh  staff   certs.db');
    printTerm('<span class="t-green">-rwxr-xr-x</span>  ankesh  staff   contact.txt');
  } else if(c==="clear"){
    document.getElementById("termOutput").innerHTML="";
  } else if(c==="exit"){
    printTerm("Closing terminal...");
    setTimeout(()=>closeWindow("terminal"),500);
  } else if(c==="konami"){
    printTerm('<span class="t-yellow">Hint: Type the Konami code (↑↑↓↓←→←→BA) to trigger RED TEAM mode.</span>');
  } else if(c==="scan"){
    runScan();
  } else if(c.startsWith("open ")){
    const target=c.replace("open ","").trim();
    const valid=["about","skills","experience","projects","certs","contact","terminal","neofetch","wallpaper"];
    if(valid.includes(target)){
      openWindow(target);
      printTerm(`<span class="t-green">Opening ${target}...</span>`);
    } else {
      printTerm(`<span class="t-red">open: '${target}' not found.</span> Try: ${valid.join(", ")}`);
    }
  } else if(c.startsWith("hack ")||c==="hack"){
    const tgt=(c==="hack")?"localhost":c.slice(5).trim();
    if(!tgt){printTerm('<span class="t-red">Usage: hack &lt;target&gt;</span>');}
    else{runHack(tgt);}
  } else if(c==="about"){
    printTerm('<span class="t-green">┌──────────────────────────────────────┐</span>');
    printTerm('<span class="t-green">│</span>  <span class="t-green">ANKESH PRAJAPATI</span>                    <span class="t-green">│</span>');
    printTerm('<span class="t-green">│</span>  Security Analyst · VAPT Specialist  <span class="t-green">│</span>');
    printTerm('<span class="t-green">└──────────────────────────────────────┘</span>');
    printTerm('<span class="t-muted">Name    :</span> Ankesh Prajapati');
    printTerm('<span class="t-muted">Role    :</span> Cybersecurity Analyst (VAPT)');
    printTerm('<span class="t-muted">Company :</span> Securis360');
    printTerm('<span class="t-muted">Focus   :</span> Web · Mobile · API · Network · Cloud');
    printTerm('<span class="t-muted">Former  :</span> State Cyber Crime Cell (CID)');
    printTerm('<span class="t-muted">Email   :</span> ankeshprajapati217@gmail.com');
    printTerm('');
    printTerm('<span class="t-muted">Type</span> <span class="t-green">open about</span> <span class="t-muted">for full profile window.</span>');
  } else if(termData[c]){
    printTerm(termData[c]);
  } else {
    printTerm(`<span class="t-red">command not found: ${cmd}</span> — type <span class="t-green">help</span>`);
  }
}

function runHack(target, done){
  // Parse target from "hack target.com" or just "target.com"
  const tgt = target.replace(/^hack\s+/i,'').trim() || "unknown.target";
  const ip = Array.from({length:4},()=>Math.floor(Math.random()*254)+1).join(".");

  const phases = [
    {delay:200,  fn:()=>{
      printTerm(`<span class="t-muted">┌──────────────────────────────────────┐</span>`);
      printTerm(`<span class="t-muted">│</span>  <span class="t-red">⚡ INITIATING BREACH PROTOCOL</span>       <span class="t-muted">│</span>`);
      printTerm(`<span class="t-muted">└──────────────────────────────────────┘</span>`);
    }},
    {delay:400,  fn:()=>printTerm(`<span class="t-muted">[*]</span> Target    : <span class="t-green">${tgt}</span>`)},
    {delay:600,  fn:()=>printTerm(`<span class="t-muted">[*]</span> Resolving : <span class="t-green">${tgt}</span> → <span class="t-yellow">${ip}</span>`)},
    {delay:900,  fn:()=>printTerm(`<span class="t-muted">[*]</span> Starting Nmap 7.95 scan on <span class="t-yellow">${ip}</span>`)},
    {delay:1300, fn:()=>{
      const ports=[[22,"ssh","OpenSSH 8.9p1"],[80,"http","nginx/1.24.0"],[443,"https","nginx/1.24.0"],[8443,"https-alt","Apache/2.4.58"],[3306,"mysql","MySQL 8.0.35"]];
      const open=ports.filter(()=>Math.random()>0.35);
      open.forEach(([p,s,v])=>printTerm(`<span class="t-green">  OPEN</span>   <span class="t-yellow">${p}/tcp</span>  ${s.padEnd(12)} <span class="t-muted">${v}</span>`));
    }},
    {delay:2000, fn:()=>printTerm(`<span class="t-muted">[*]</span> Running CVE scanner... <span class="t-yellow">CVE-2024-1337, CVE-2023-44487</span>`)},
    {delay:2600, fn:()=>printTerm(`<span class="t-red">[!]</span> Vulnerability found: <span class="t-red">SQL Injection</span> at <span class="t-green">/${tgt.split(".")[0]}/login.php</span>`)},
    {delay:3100, fn:()=>printTerm(`<span class="t-muted">[*]</span> Launching sqlmap payload...`)},
    {delay:3400, fn:()=>{
      let p=0;
      const iv=setInterval(()=>{
        p+=Math.floor(Math.random()*15)+5;
        if(p>=100){p=100;clearInterval(iv);}
        const bar="█".repeat(Math.floor(p/5))+"░".repeat(20-Math.floor(p/5));
        const lastLine=document.querySelector("#termOutput .t-progress");
        const html=`<span class="t-green">[${bar}]</span> <span class="t-yellow">${p}%</span>`;
        if(lastLine){lastLine.innerHTML=html;}else{printTerm(`<span class="t-progress">${html}</span>`);}
      },120);
    }},
    {delay:6800, fn:()=>printTerm(`<span class="t-red">[!]</span> Database dumped: <span class="t-green">users</span>, <span class="t-green">sessions</span>, <span class="t-green">credentials</span>`)},
    {delay:7200, fn:()=>printTerm(`<span class="t-muted">[*]</span> Cracking password hashes... <span class="t-yellow">md5crypt</span>`)},
    {delay:7700, fn:()=>printTerm(`<span class="t-red">[✓]</span> <span class="t-green">admin:Password123!</span>  <span class="t-muted">// cracked in 0.3s</span>`)},
    {delay:8100, fn:()=>printTerm(`<span class="t-red">[✓]</span> <span class="t-green">root:toor</span>           <span class="t-muted">// cracked in 0.1s</span>`)},
    {delay:8600, fn:()=>printTerm(`<span class="t-muted">[*]</span> Spawning reverse shell on port <span class="t-yellow">4444</span>...`)},
    {delay:9100, fn:()=>{
      printTerm(`<span class="t-red">root@${tgt}:/#</span> <span class="t-muted">uid=0(root) gid=0(root) groups=0(root)</span>`);
      printTerm(`<span class="t-muted">┌──────────────────────────────────────┐</span>`);
      printTerm(`<span class="t-muted">│</span>  <span class="t-red">⚡ BREACH COMPLETE</span> — <span class="t-green">ROOT ACCESS</span>     <span class="t-muted">│</span>`);
      printTerm(`<span class="t-muted">│</span>  <span class="t-muted">[ FOR EDUCATIONAL / CTF USE ONLY ]</span>   <span class="t-muted">│</span>`);
      printTerm(`<span class="t-muted">└──────────────────────────────────────┘</span>`);
      if(done)done();
    }},
  ];
  phases.forEach(({delay,fn})=>setTimeout(fn,delay));
}

function runScan(){
  const targets=["192.168.1.1","10.0.0.254","172.16.0.1"];
  const ports=["22 (SSH)","80 (HTTP)","443 (HTTPS)","8080 (HTTP-ALT)","3306 (MySQL)","5432 (PostgreSQL)"];
  printTerm(`<span class="t-green">Starting Nmap 7.95 ( https://nmap.org )</span>`);
  let i=0;
  function tick(){
    if(i<targets.length){
      const t=targets[i];
      const openPorts=ports.filter(()=>Math.random()>0.5);
      setTimeout(()=>{
        printTerm(`<span class="t-blue">Scanning ${t}...</span>`);
        openPorts.forEach(p=>printTerm(`  <span class="t-green">OPEN</span>  ${p}`));
        i++;tick();
      },600);
    } else {
      printTerm(`<span class="t-green">Scan complete. ${targets.length} hosts scanned.</span>`);
    }
  }tick();
}
