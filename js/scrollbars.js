// ══════════════════════════════════════════════════════
// CUSTOM SCROLLBARS — Edge's Fluent scrollbar ignores author CSS
// (::-webkit-scrollbar / scrollbar-color) and always paints its own
// native-themed bar, so the only way to get a consistent themed look
// across browsers is to hide the native one and draw this instead.
// ══════════════════════════════════════════════════════
function initCustomScrollbar(content){
  if(content._csbInit)return;
  content._csbInit=true;
  content.classList.add("csb-managed");
  if(getComputedStyle(content).position==="static")content.style.position="relative";

  var track=document.createElement("div");
  track.className="csb-track";
  var thumb=document.createElement("div");
  thumb.className="csb-thumb";
  track.appendChild(thumb);
  content.appendChild(track);

  function update(){
    var ch=content.clientHeight, sh=content.scrollHeight;
    if(sh<=ch+1){track.style.display="none";return;}
    track.style.display="block";
    var trackH=track.clientHeight;
    var thumbH=Math.max(24,trackH*(ch/sh));
    var maxScroll=sh-ch;
    var maxTravel=trackH-thumbH;
    thumb.style.height=thumbH+"px";
    thumb.style.top=(maxTravel*(content.scrollTop/maxScroll))+"px";
  }
  content.addEventListener("scroll",update);
  new ResizeObserver(update).observe(content);
  update();

  var dragging=false,startY=0,startScroll=0;
  thumb.addEventListener("mousedown",function(e){
    dragging=true;startY=e.clientY;startScroll=content.scrollTop;
    thumb.classList.add("dragging");
    document.body.style.userSelect="none";
    e.preventDefault();
  });
  document.addEventListener("mousemove",function(e){
    if(!dragging)return;
    var ch=content.clientHeight, sh=content.scrollHeight, trackH=track.clientHeight;
    var maxTravel=trackH-thumb.offsetHeight;
    if(maxTravel<=0)return;
    content.scrollTop=startScroll+((e.clientY-startY)/maxTravel)*(sh-ch);
  });
  document.addEventListener("mouseup",function(){
    if(!dragging)return;
    dragging=false;thumb.classList.remove("dragging");
    document.body.style.userSelect="";
  });
}

function initCustomScrollbars(){
  document.querySelectorAll(".win-content,.term-scroll,.neofetch-body,.snake-side-list,.game-code-display").forEach(initCustomScrollbar);
}
document.addEventListener("DOMContentLoaded",initCustomScrollbars);
