// ===================== CLOCK =====================
function updateClock(){
  const now=new Date();
  document.getElementById("clock").textContent=
    now.toLocaleDateString("en-IN",{weekday:"short",month:"short",day:"2-digit"})+" "+
    now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true});
}
setInterval(updateClock,1000);updateClock();

// ===================== NEOFETCH UPTIME =====================
const startTime=Date.now();
setInterval(()=>{
  const el=document.getElementById("nfUptime");
  if(!el)return;
  const s=Math.floor((Date.now()-startTime)/1000);
  el.textContent=`${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`;
},1000);
// ════════════════════════════════════════════════════════════════
// DESKTOP CLOCK WIDGET
// ════════════════════════════════════════════════════════════════
(function(){
  function tickClock(){
    var now  = new Date();
    var h    = String(now.getHours()).padStart(2,'0');
    var m    = String(now.getMinutes()).padStart(2,'0');
    var s    = String(now.getSeconds()).padStart(2,'0');
    var days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    var mons = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    var dateStr = days[now.getDay()] + ', ' + mons[now.getMonth()] + ' ' +
                  String(now.getDate()).padStart(2,'0') + ' ' + now.getFullYear();

    var tEl = document.getElementById('deskClockTime');
    var dEl = document.getElementById('deskClockDate');
    var bar = document.getElementById('deskClockSecBar');
    if(tEl) tEl.textContent = h + ':' + m + ':' + s;
    if(dEl) dEl.textContent = dateStr;
    if(bar) bar.style.width = ((now.getSeconds()/60)*100) + '%';
  }
  tickClock();
  setInterval(tickClock, 1000);

  // Keep clock color synced with theme
  var _origApply = window.applyThemeColor;
  window.applyThemeColor = function(hex){
    if(_origApply) _origApply(hex);
    var tEl = document.getElementById('deskClockTime');
    var dEl = document.getElementById('deskClockDate');
    var bar = document.getElementById('deskClockSecBar');
    var bg  = document.getElementById('deskClockSec');
    function hexToRgba(h,a){ var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return 'rgba('+r+','+g+','+b+','+a+')'; }
    if(tEl){ tEl.style.color = hexToRgba(hex,0.85); tEl.style.textShadow = '0 0 20px '+hexToRgba(hex,0.4)+',0 0 40px '+hexToRgba(hex,0.15); }
    if(dEl) dEl.style.color = hexToRgba(hex,0.45);
    if(bar) bar.style.background = hexToRgba(hex,0.5);
    if(bg)  bg.style.background  = hexToRgba(hex,0.08);
  };
})();
