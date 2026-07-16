// ══ TRAY ICONS ═══════════════════════════════════════════════════════════════
(function(){
  if(navigator.getBattery){
    navigator.getBattery().then(function(b){
      function update(){
        var pct=Math.round(b.level*100);
        var fill=document.getElementById("battFill");
        if(fill){
          var w=Math.max(2,Math.round(pct/100*16));
          fill.setAttribute("width",w);
          fill.setAttribute("fill",pct<20?"#ff3355":pct<50?"#febc2e":"currentColor");
        }
        var tray=document.getElementById("trayBattery");
        if(tray)tray.title="Battery: "+pct+"% "+(b.charging?"(charging)":"");
      }
      b.addEventListener("levelchange",update);
      b.addEventListener("chargingchange",update);
      update();
    });
  }
  function updateWifi(){
    var el=document.getElementById("trayWifi");
    if(!el)return;
    if(navigator.onLine){el.style.color="";el.title="WiFi: Connected";}
    else{el.style.color="#ff3355";el.title="WiFi: Disconnected";}
  }
  window.addEventListener("online",updateWifi);
  window.addEventListener("offline",updateWifi);
  updateWifi();
})();
