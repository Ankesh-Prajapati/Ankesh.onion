// ══════════════════════════════════════════════════════
// DECRYPT TEXT REVEAL — scrambles then resolves to the real text,
// like a terminal brute-forcing a string. Supports <br> line breaks.
// ══════════════════════════════════════════════════════
var DECRYPT_CHARS="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

function decryptReveal(el,duration){
  if(!el||el._decrypting)return;
  var lines=el.innerHTML.split(/<br\s*\/?>/i).map(function(s){return s.trim();});
  var total=lines.reduce(function(n,l){return n+l.length;},0);
  if(total===0)return;
  el._decrypting=true;
  duration=duration||700;
  var steps=Math.max(10,Math.round(duration/40));
  var frame=0;
  var iv=setInterval(function(){
    frame++;
    var revealCount=Math.floor((frame/steps)*total);
    var seen=0;
    var outLines=lines.map(function(line){
      var out="";
      for(var i=0;i<line.length;i++){
        var ch=line[i];
        if(ch===" "){out+=" ";seen++;continue;}
        if(seen<revealCount){out+=ch;}
        else{out+=DECRYPT_CHARS[Math.floor(Math.random()*DECRYPT_CHARS.length)];}
        seen++;
      }
      return out;
    });
    el.innerHTML=outLines.join("<br>");
    if(revealCount>=total){
      clearInterval(iv);
      el.innerHTML=lines.join("<br>");
      el._decrypting=false;
    }
  },40);
}
