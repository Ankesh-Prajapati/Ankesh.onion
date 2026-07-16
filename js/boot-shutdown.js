// ══ BOOT / SHUTDOWN SEQUENCE ═════════════════════════════════════════════════
window.addEventListener("keydown",function(e){
  if((e.key==="F5")||(e.ctrlKey&&(e.key==="r"||e.key==="R"))||(e.metaKey&&(e.key==="r"||e.key==="R"))){
    e.preventDefault();
    triggerShutdown(function(){location.reload();});
  }
});

function triggerShutdown(onDone){
  var overlay=document.getElementById("shutdownOverlay");
  var log=document.getElementById("shutdownLog");
  if(!overlay)return;
  overlay.style.display="flex";log.innerHTML="";

  var shutLines=[
    {t:0,   s:"[ <span style='color:#28c840'>OK</span> ] Stopping Snake Game service..."},
    {t:220, s:"[ <span style='color:#28c840'>OK</span> ] Stopping terminal sessions..."},
    {t:430, s:"[ <span style='color:#28c840'>OK</span> ] Flushing filesystem buffers..."},
    {t:640, s:"[ <span style='color:#28c840'>OK</span> ] Saving session state to /var/cache..."},
    {t:860, s:"[ <span style='color:#febc2e'>!!</span> ] <span style='color:#febc2e'>Archiving 50+ VAPT assessment reports...</span>"},
    {t:1080,s:"[ <span style='color:#28c840'>OK</span> ] Unmounting /dev/sda1 ..."},
    {t:1300,s:"[ <span style='color:#28c840'>OK</span> ] Stopping network manager (root-net)..."},
    {t:1520,s:"[ <span style='color:#28c840'>OK</span> ] All processes terminated."},
    {t:1760,s:"<span style='color:#00ff9d'>Ankesh-OS — Rebooting in 3...</span>"},
    {t:2360,s:"<span style='color:#00ff9d'>Ankesh-OS — Rebooting in 2...</span>"},
    {t:2960,s:"<span style='color:#00ff9d'>Ankesh-OS — Rebooting in 1...</span>"},
    {t:3560,s:"<span style='color:#ff5f57'>⏻  System halted.</span>"},
  ];
  shutLines.forEach(function(l){
    setTimeout(function(){
      var d=document.createElement("div");d.innerHTML=l.s;log.appendChild(d);log.scrollTop=log.scrollHeight;
    },l.t);
  });

  // Black pause, then boot log
  setTimeout(function(){
    log.innerHTML="";
    var bootLines=[
      {t:0,   s:"<span style='color:#00ff9d;font-size:1.05rem;font-weight:700;letter-spacing:0.08em'>Ankesh-OS 2.5.1 (Ankesh Edition)</span>"},
      {t:280, s:"<span style='color:#6e7681'>CPU: Intel Core i9-13900K &nbsp; RAM: 32768MB &nbsp; SSD: 1TB NVME</span>"},
      {t:520, s:"[ <span style='color:#28c840'>OK</span> ] Loading kernel modules..."},
      {t:720, s:"[ <span style='color:#28c840'>OK</span> ] Starting udev daemon..."},
      {t:920, s:"[ <span style='color:#28c840'>OK</span> ] Mounting /dev/sda1 on / (ext4, ro)"},
      {t:1100,s:"[ <span style='color:#28c840'>OK</span> ] Mounting virtual filesystems (/proc /sys /dev)"},
      {t:1300,s:"[ <span style='color:#28c840'>OK</span> ] Started Network Manager (root-net)"},
      {t:1500,s:"[ <span style='color:#28c840'>OK</span> ] OpenSSH server running on :22"},
      {t:1700,s:"[ <span style='color:#28c840'>OK</span> ] Firewall rules applied (iptables + nftables)"},
      {t:1900,s:"[ <span style='color:#28c840'>OK</span> ] VPN tunnel up (wg0 — 10.8.0.1)"},
      {t:2100,s:"[ <span style='color:#febc2e'>!!</span> ] <span style='color:#febc2e'>Security notice: 3 failed SSH attempts since last boot</span>"},
      {t:2340,s:"[ <span style='color:#28c840'>OK</span> ] Starting portfolio renderer (v2.5.1)..."},
      {t:2560,s:"[ <span style='color:#28c840'>OK</span> ] Loading VAPT workspace..."},
      {t:2760,s:"[ <span style='color:#28c840'>OK</span> ] Reached target: Graphical Interface"},
      {t:3000,s:"<span style='color:#00ff9d;font-weight:700'>ankesh@root login: <span style='animation:blink 1s step-end infinite'>█</span></span>"},
    ];
    bootLines.forEach(function(l){
      setTimeout(function(){
        var d=document.createElement("div");d.innerHTML=l.s;log.appendChild(d);log.scrollTop=log.scrollHeight;
      },l.t);
    });
    setTimeout(function(){
      overlay.style.transition="opacity 0.7s";overlay.style.opacity="0";
      setTimeout(function(){
        overlay.style.display="none";overlay.style.opacity="1";overlay.style.transition="";
        if(onDone)onDone();
      },700);
    },3500);
  },4000);
}
// ══════════════════════════════════════════════════════════════════
// INTRUDER ALERT TOAST — cybersec flavoured pop-up on load
// ══════════════════════════════════════════════════════════════════
setTimeout(showIntruderAlert, 3600);
function showIntruderAlert() {
  // Remove if already exists
  const old = document.getElementById("intruderToast");
  if(old) old.remove();

  const toast = document.createElement("div");
  toast.id = "intruderToast";
  toast.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:10px;">
      <div style="font-size:1.1rem;flex-shrink:0;margin-top:1px;animation:toastPulse 1s ease-in-out infinite;">⚠</div>
      <div style="flex:1;">
        <div style="font-size:0.65rem;color:#ff3355;letter-spacing:0.18em;font-weight:700;margin-bottom:3px;">[ SECURITY ALERT ]</div>
        <div style="font-size:0.78rem;color:#c9d1d9;line-height:1.5;">Intruder detected on network</div>
        <div style="font-size:0.7rem;color:#6e7681;margin-top:2px;">Origin: <span style="color:var(--accent);font-weight:600;">unknown</span> &nbsp;·&nbsp; Tracing...</div>
        <div style="font-size:0.62rem;color:#6e7681;margin-top:4px;letter-spacing:0.06em;">IP logged · Tracing route...</div>
      </div>
      <div onclick="document.getElementById('intruderToast').remove()" style="cursor:pointer;color:#6e7681;font-size:0.75rem;padding:2px 4px;opacity:0.6;hover:opacity:1;">✕</div>
    </div>
    <div style="margin-top:8px;height:2px;background:rgba(255,51,85,0.15);border-radius:1px;overflow:hidden;">
      <div id="toastProgress" style="height:100%;width:100%;background:linear-gradient(90deg,#ff3355,#ff6b35);border-radius:1px;transition:width linear;"></div>
    </div>
  `;
  toast.style.cssText = `
    position:fixed;bottom:58px;right:14px;z-index:99998;
    background:#0d1117;border:1px solid rgba(255,51,85,0.4);border-radius:8px;
    padding:12px 14px;width:260px;
    box-shadow:0 4px 24px rgba(0,0,0,0.7),0 0 0 1px rgba(255,51,85,0.1),0 0 20px rgba(255,51,85,0.08);
    font-family:'Fira Code',monospace;
    animation:toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
    backdrop-filter:blur(12px);
  `;

  // Inject keyframes if not present
  if(!document.getElementById("toastKeyframes")){
    const style = document.createElement("style");
    style.id = "toastKeyframes";
    style.textContent = `
      @keyframes toastSlideIn{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes toastSlideOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(12px)}}
      @keyframes toastPulse{0%,100%{color:#ff3355}50%{color:#febc2e}}
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Shrink progress bar over 5 seconds then auto dismiss
  const bar = document.getElementById("toastProgress");
  setTimeout(() => { if(bar) bar.style.width = "0%"; bar.style.transitionDuration = "4.8s"; }, 100);
  setTimeout(() => {
    if(toast.parentNode){
      toast.style.animation = "toastSlideOut 0.3s ease forwards";
      setTimeout(() => { if(toast.parentNode) toast.remove(); }, 300);
    }
  }, 5000);
}

// ══════════════════════════════════════════════════════════════════