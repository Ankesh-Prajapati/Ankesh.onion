// ===================== CONTEXT MENU =====================
function toggleStartMenu(){
  const m=document.getElementById("startMenu");
  if(m.style.display==="flex"){hideStart();return;}
  hideCtx();
  m.style.display="flex";
}
function hideStart(){
  const m=document.getElementById("startMenu");
  if(m) m.style.display="none";
}
function showCtxMenu(e){
  e.preventDefault();
  const m=document.getElementById("ctxMenu");
  m.style.display="block";
  m.style.left=e.clientX+"px";
  m.style.top=e.clientY+"px";
}
function hideCtx(){document.getElementById("ctxMenu").style.display="none";}
document.addEventListener("click",(e)=>{
  if(!e.target.closest("#ctxMenu")) hideCtx();
  if(!e.target.closest("#startMenu")&&!e.target.closest(".taskbar-start")) hideStart();
});
document.addEventListener("contextmenu",(e)=>{if(e.target===document.body||e.target===document.getElementById("desktop")||e.target.id==="desktop")return;hideCtx();});

function openAllWindows(){["about","skills","experience","projects","certs","contact","terminal","neofetch"].forEach(openWindow);}
function closeAllWindows(){["about","skills","experience","projects","certs","contact","terminal","neofetch","wallpaper","snake","typingtest","tetris"].forEach(closeWindow);}

// ===================== NOTIFICATIONS =====================
let notifTimeout;
function showNotif(title,msg){
  let n=document.querySelector(".notif");
  if(n)n.remove();
  clearTimeout(notifTimeout);
  n=document.createElement("div");
  n.className="notif";
  n.innerHTML=`<div class="notif-title">⚡ ${title}</div><div>${msg}</div>`;
  document.body.appendChild(n);
  notifTimeout=setTimeout(()=>{if(n.parentNode)n.remove();},2500);
}
