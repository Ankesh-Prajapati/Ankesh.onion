(function(){
  var canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  var ctx = canvas.getContext('2d');
  var favicon = null;
  var frame = 0;
  var glitchTimer = 0;
  var glitching = false;

  // Matrix rain drops for favicon
  var drops = [];
  var chars = '01アイウエオカキ<>{}[]#$%@!';
  for(var i=0;i<4;i++) drops.push({x:i*8+4, y:Math.random()*32, speed:1+Math.random()*1.5, char:chars[Math.floor(Math.random()*chars.length)]});

  function drawFavicon(){
    ctx.clearRect(0,0,32,32);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0,0,32,32);

    // Glitch effect trigger
    glitchTimer++;
    if(glitchTimer > 60 && Math.random() < 0.03){ glitching = true; glitchTimer = 0; }
    if(glitching && Math.random() < 0.3) glitching = false;

    // Animated border glow (pulsing)
    var pulse = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.05));
    ctx.strokeStyle = 'rgba(0,255,157,' + pulse + ')';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, 30, 30);

    // Corner brackets
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2;
    var s = 6;
    // TL
    ctx.beginPath(); ctx.moveTo(2,2+s); ctx.lineTo(2,2); ctx.lineTo(2+s,2); ctx.stroke();
    // TR
    ctx.beginPath(); ctx.moveTo(30-s,2); ctx.lineTo(30,2); ctx.lineTo(30,2+s); ctx.stroke();
    // BL
    ctx.beginPath(); ctx.moveTo(2,30-s); ctx.lineTo(2,30); ctx.lineTo(2+s,30); ctx.stroke();
    // BR
    ctx.beginPath(); ctx.moveTo(30-s,30); ctx.lineTo(30,30); ctx.lineTo(30,30-s); ctx.stroke();

    // Matrix rain columns
    drops.forEach(function(d){
      var alpha = glitching ? Math.random() : (0.3 + 0.7*(1-(d.y/32)));
      ctx.fillStyle = 'rgba(0,255,157,'+alpha+')';
      ctx.font = 'bold 7px monospace';
      if(Math.random() < 0.1) d.char = chars[Math.floor(Math.random()*chars.length)];
      ctx.fillText(d.char, d.x-3, d.y);
      d.y += d.speed;
      if(d.y > 34){ d.y = -4; d.char = chars[Math.floor(Math.random()*chars.length)]; }
    });

    // Center shield/lock icon
    ctx.fillStyle = glitching ? '#ff3355' : '#00ff9d';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Glitch offset
    var gx = glitching ? (Math.random()*4-2) : 0;
    var gy = glitching ? (Math.random()*4-2) : 0;
    ctx.fillText('🔒', 16+gx, 16+gy);

    // Scan line sweep
    var scanY = (frame * 0.8) % 32;
    ctx.fillStyle = 'rgba(0,255,157,0.12)';
    ctx.fillRect(0, scanY, 32, 2);

    frame++;
    favicon = document.getElementById('favicon');
    if(favicon) favicon.href = canvas.toDataURL('image/png');
    requestAnimationFrame(drawFavicon);
  }
  window.addEventListener('DOMContentLoaded', drawFavicon);
})();
