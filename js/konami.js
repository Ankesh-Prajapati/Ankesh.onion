// ===================== KONAMI =====================
const konamiSeq=["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
let ki=0;
window.addEventListener("keydown",(e)=>{
  if(e.key.toLowerCase()===konamiSeq[ki]){
    ki++;
    if(ki===konamiSeq.length){
      triggerAlert();ki=0;
    }
  } else ki=0;
});

function triggerAlert(){
  const overlay=document.getElementById("alertOverlay");
  overlay.classList.add("show");
  setTimeout(()=>overlay.classList.remove("show"),7000);
}

