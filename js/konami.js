// ===================== KONAMI =====================
const konamiSeq=["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
let ki=0,kPrev="";
// fed by physical keys and by ROOTBOY's on-screen buttons (S counts as A) so phones can enter it too
function konamiFeed(key){
  if(key===konamiSeq[ki]){
    ki++;
    if(ki===konamiSeq.length){triggerAlert();ki=0;}
  } else {
    // pressing up a third time shouldn't throw away the two ups already entered
    ki=key==="arrowup"?(kPrev==="arrowup"?2:1):0;
  }
  kPrev=key;
}
window.addEventListener("keydown",(e)=>konamiFeed(e.key.toLowerCase()));

console.log("%c ROOT ACCESS HINT %c ↑ ↑ ↓ ↓ ← → ← → B A ","background:#00ff9d;color:#000;font-weight:bold;padding:2px 4px","color:#00ff9d;font-weight:bold");

function triggerAlert(){
  const overlay=document.getElementById("alertOverlay");
  overlay.classList.add("show");
  setTimeout(()=>overlay.classList.remove("show"),7000);
}

