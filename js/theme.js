// ===================== WALLPAPER SYSTEM =====================
function makeParticles(count, color, maxY) {
  return Array.from({length: count}, () => {
    const x = (Math.random() * 1440) | 0;
    const y = (Math.random() * (maxY || 900)) | 0;
    const r = (Math.random() * 1.5 + 0.4).toFixed(1);
    const d = (Math.random() * 4 + 2).toFixed(1);
    const b = (Math.random() * 5).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"><animate attributeName="opacity" values="0;0.7;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
  }).join("");
}

// ══ THEME CUSTOMIZER ══════════════════════════════════════
const PRESETS = [
  {name:"Hacker",    hex:"#00ff9d"},
  {name:"Cyber",     hex:"#00c8ff"},
  {name:"Purple",    hex:"#b06fff"},
  {name:"Red",       hex:"#ff3355"},
  {name:"Amber",     hex:"#febc2e"},
  {name:"Orange",    hex:"#ff6d00"},
  {name:"Pink",      hex:"#ff5fa0"},
  {name:"White",     hex:"#e0e0e0"},
];

let _wheelHue = 150, _wheelSat = 1.0, _wheelBrt = 1.0;
let _draggingWheel = false;

function hexToHSB(hex) {
  let r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  let max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0, s=max===0?0:d/max, v=max;
  if(d!==0){
    if(max===r) h=((g-b)/d)%6;
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h=Math.round(h*60); if(h<0)h+=360;
  }
  return {h,s,v};
}

function hsbToHex(h,s,v) {
  let c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c;
  let r,g,b;
  if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}
  else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
  r=Math.round((r+m)*255); g=Math.round((g+m)*255); b=Math.round((b+m)*255);
  return "#"+r.toString(16).padStart(2,"0")+g.toString(16).padStart(2,"0")+b.toString(16).padStart(2,"0");
}

function drawWheel(canvas) {
  const ctx = canvas.getContext("2d");
  const cx = canvas.width/2, cy = canvas.height/2, r = cx-2;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let angle=0; angle<360; angle++){
    const startA = (angle-1)*Math.PI/180, endA = (angle+1)*Math.PI/180;
    const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    grad.addColorStop(0,`hsl(${angle},0%,${_wheelBrt*100}%)`);
    grad.addColorStop(1,`hsl(${angle},${_wheelSat*100}%,${_wheelBrt*50}%)`);
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,startA,endA);
    ctx.closePath();
    ctx.fillStyle=grad;
    ctx.fill();
  }
  // Center white dot
  const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,r*0.18);
  cg.addColorStop(0,`rgba(255,255,255,${_wheelBrt})`);
  cg.addColorStop(1,"rgba(255,255,255,0)");
  ctx.beginPath();ctx.arc(cx,cy,r*0.18,0,Math.PI*2);ctx.fillStyle=cg;ctx.fill();
}

// NOTE: drawWheel() colors each wedge using the raw canvas arc angle (0 =
// +x axis) directly as the hue value, so these conversions must use the
// same convention with no rotation offset or the cursor/preview drifts
// from the color actually under the cursor.
function wheelAngleToXY(hue, sat, canvas) {
  const cx=canvas.width/2, cy=canvas.height/2, r=(cx-2)*sat;
  const a=hue*Math.PI/180;
  return {x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)};
}

function xyToHueSat(x,y,canvas) {
  const cx=canvas.width/2, cy=canvas.height/2, r=cx-2;
  const dx=x-cx, dy=y-cy;
  const dist=Math.sqrt(dx*dx+dy*dy);
  const sat=Math.min(1,dist/r);
  let hue=Math.atan2(dy,dx)*180/Math.PI;
  if(hue<0)hue+=360;
  return {hue:Math.round(hue)%360, sat};
}

function updateWheelCursor() {
  const canvas=document.getElementById("themeWheel");
  if(!canvas) return;
  const pos=wheelAngleToXY(_wheelHue,_wheelSat,canvas);
  const cur=document.getElementById("wheelCursor");
  cur.style.left=pos.x+"px"; cur.style.top=pos.y+"px";
  const hex=hsbToHex(_wheelHue,_wheelSat,_wheelBrt);
  cur.style.background=hex;
  updateHexPreview(hex);
}

function updateHexPreview(hex) {
  const hi=document.getElementById("hexInput");
  const ps=document.getElementById("previewSwatch");
  if(hi) hi.value=hex;
  if(ps) ps.style.background=hex;
  // Update slider thumb accent
  document.querySelectorAll(".theme-slider").forEach(s=>s.style.setProperty("--sl-color",hex));
}

function initThemeWheel() {
  const canvas=document.getElementById("themeWheel");
  if(!canvas) return;
  const brtS0=document.getElementById("brtSlider"), satS0=document.getElementById("satSlider");
  if(brtS0){brtS0.value=Math.round(_wheelBrt*100);document.getElementById("brtVal").textContent=Math.round(_wheelBrt*100)+"%";}
  if(satS0){satS0.value=Math.round(_wheelSat*100);document.getElementById("satVal").textContent=Math.round(_wheelSat*100)+"%";}
  drawWheel(canvas);
  updateWheelCursor();

  function handleWheel(e) {
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    const {hue,sat}=xyToHueSat(x,y,canvas);
    _wheelHue=hue; _wheelSat=sat;
    updateWheelCursor();
  }
  canvas.addEventListener("mousedown",(e)=>{_draggingWheel=true;handleWheel(e);});
  document.addEventListener("mousemove",(e)=>{if(_draggingWheel)handleWheel(e);});
  document.addEventListener("mouseup",()=>_draggingWheel=false);
  // Touch
  canvas.addEventListener("touchstart",(e)=>{e.preventDefault();_draggingWheel=true;const t=e.touches[0];const rect=canvas.getBoundingClientRect();const x=t.clientX-rect.left,y=t.clientY-rect.top;const {hue,sat}=xyToHueSat(x,y,canvas);_wheelHue=hue;_wheelSat=sat;updateWheelCursor();},{passive:false});
  canvas.addEventListener("touchmove",(e)=>{e.preventDefault();if(!_draggingWheel)return;const t=e.touches[0];const rect=canvas.getBoundingClientRect();const x=t.clientX-rect.left,y=t.clientY-rect.top;const {hue,sat}=xyToHueSat(x,y,canvas);_wheelHue=hue;_wheelSat=sat;updateWheelCursor();},{passive:false});

  // Brightness slider
  const brtS=document.getElementById("brtSlider");
  if(brtS){
    brtS.addEventListener("input",()=>{
      _wheelBrt=brtS.value/100;
      document.getElementById("brtVal").textContent=brtS.value+"%";
      drawWheel(canvas);updateWheelCursor();
    });
  }
  // Saturation slider
  const satS=document.getElementById("satSlider");
  if(satS){
    satS.addEventListener("input",()=>{
      _wheelSat=satS.value/100;
      document.getElementById("satVal").textContent=satS.value+"%";
      updateWheelCursor();
    });
  }
  // Hex input
  const hexI=document.getElementById("hexInput");
  if(hexI){
    hexI.addEventListener("input",()=>{
      const v=hexI.value;
      if(/^#[0-9a-fA-F]{6}$/.test(v)){
        const {h,s,v:bv}=hexToHSB(v);
        _wheelHue=h;_wheelSat=s;_wheelBrt=bv;
        if(brtS){brtS.value=Math.round(bv*100);document.getElementById("brtVal").textContent=Math.round(bv*100)+"%";}
        if(satS){satS.value=Math.round(s*100);document.getElementById("satVal").textContent=Math.round(s*100)+"%";}
        drawWheel(canvas);updateWheelCursor();
        document.getElementById("previewSwatch").style.background=v;
      }
    });
    hexI.addEventListener("keydown",(e)=>{if(e.key==="Enter")applyCustomTheme();});
  }
}

function buildPresetGrid() {
  const grid=document.getElementById("presetGrid");
  if(!grid) return;
  grid.innerHTML="";
  PRESETS.forEach(p=>{
    const btn=document.createElement("div");
    btn.className="preset-btn"+(p.hex.toLowerCase()===_currentAccentHex.toLowerCase()?" active":"");
    btn.innerHTML=`<div class="preset-swatch" style="background:${p.hex};box-shadow:0 0 10px ${p.hex};color:${p.hex}"></div><div class="preset-name">${p.name}</div>`;
    btn.onclick=()=>{
      document.querySelectorAll(".preset-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const {h,s,v}=hexToHSB(p.hex);
      _wheelHue=h;_wheelSat=s;_wheelBrt=v;
      const brtS=document.getElementById("brtSlider");
      const satS=document.getElementById("satSlider");
      if(brtS){brtS.value=Math.round(v*100);document.getElementById("brtVal").textContent=Math.round(v*100)+"%";}
      if(satS){satS.value=Math.round(s*100);document.getElementById("satVal").textContent=Math.round(s*100)+"%";}
      const canvas=document.getElementById("themeWheel");
      drawWheel(canvas);updateWheelCursor();
      applyThemeColor(p.hex);
    };
    grid.appendChild(btn);
  });
}

function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16);
  const g=parseInt(hex.slice(3,5),16);
  const b=parseInt(hex.slice(5,7),16);
  return r+","+g+","+b;
}
let _currentAccentHex="#00ff9d";
function applyThemeColor(hex, silent) {
  _currentAccentHex=hex;
  const root=document.documentElement;
  // Core accent
  root.style.setProperty("--accent", hex);
  root.style.setProperty("--accent2", hex);
  root.style.setProperty("--accent-rgb", hexToRgb(hex));
  // Window shadow updates automatically via --accent-rgb
  // Border tint for focused windows - handled by rgba(var(--accent-rgb))
  // Update slider thumb color
  const styleId="theme-dynamic-style";
  let el=document.getElementById(styleId);
  if(!el){el=document.createElement("style");el.id=styleId;document.head.appendChild(el);}
  el.textContent=`
    .theme-slider::-webkit-slider-thumb{background:${hex}!important;box-shadow:0 0 6px ${hex}!important;}
    .theme-slider::-moz-range-thumb{background:${hex}!important;}
    .win-resize{background:linear-gradient(135deg,transparent 50%,rgba(var(--accent-rgb),0.3) 50%)!important;}
    .taskbar-start{background:rgba(var(--accent-rgb),0.1)!important;border:1px solid rgba(var(--accent-rgb),0.3)!important;}
    .taskbar-start:hover{background:rgba(var(--accent-rgb),0.2)!important;}
    #startMenu .sm-item:hover{background:rgba(var(--accent-rgb),0.08)!important;color:${hex}!important;}
    .hk-fill{background:linear-gradient(90deg,${hex},${hex}88)!important;}
    .hk-sweep,.hack-scan{background:linear-gradient(90deg,transparent,${hex},transparent)!important;box-shadow:0 0 8px ${hex}!important;}
    .apply-theme-btn{background:${hex}!important;}
    .preset-btn.active{border-color:${hex}!important;}
    .about-badge{border-color:rgba(var(--accent-rgb),0.4)!important;color:${hex}!important;}
    ::-webkit-scrollbar-thumb{background:rgba(var(--accent-rgb),0.3)!important;}
  `;
  if(!silent){
    try{localStorage.setItem("accentColor",hex);}catch(e){}
    showNotif("Theme","Accent → "+hex);
  }
  window.dispatchEvent(new CustomEvent("themechange", { detail: { hex: hex } }));
}

(function(){
  try{
    const saved=localStorage.getItem("accentColor");
    if(saved&&/^#[0-9a-fA-F]{6}$/.test(saved))applyThemeColor(saved,true);
  }catch(e){}
})();

function applyCustomTheme() {
  const hex=hsbToHex(_wheelHue,_wheelSat,_wheelBrt);
  document.querySelectorAll(".preset-btn").forEach(b=>b.classList.remove("active"));
  applyThemeColor(hex);
}

const WALLPAPER_STYLES = [
  {id:"matrix",  name:"Matrix",  icon:`<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <text x="1" y="8" font-family="monospace" font-size="7" fill="#00ff9d">1</text>
    <text x="1" y="17" font-family="monospace" font-size="7" fill="#00ff9d" opacity="0.4">0</text>
    <text x="8" y="6" font-family="monospace" font-size="7" fill="#00ff9d" opacity="0.8">0</text>
    <text x="8" y="14" font-family="monospace" font-size="7" fill="#00ff9d">1</text>
    <text x="14" y="10" font-family="monospace" font-size="7" fill="#00ff9d" opacity="0.6">0</text>
    <text x="14" y="18" font-family="monospace" font-size="7" fill="#00ff9d" opacity="0.3">1</text>
  </svg>`},
  {id:"network", name:"Network", icon:`<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="4" x2="16" y2="7" stroke="#00ff9d" stroke-width="1" opacity="0.6"/>
    <line x1="16" y1="7" x2="9" y2="16" stroke="#00ff9d" stroke-width="1" opacity="0.6"/>
    <line x1="9" y1="16" x2="3" y2="4" stroke="#00ff9d" stroke-width="1" opacity="0.6"/>
    <line x1="16" y1="7" x2="18" y2="17" stroke="#00ff9d" stroke-width="1" opacity="0.4"/>
    <circle cx="3" cy="4" r="1.6" fill="#00ff9d"/>
    <circle cx="16" cy="7" r="1.6" fill="#00ff9d"/>
    <circle cx="9" cy="16" r="1.6" fill="#00ff9d"/>
    <circle cx="18" cy="17" r="1.3" fill="#00ff9d" opacity="0.7"/>
  </svg>`},
];
function buildWallpaperStyleGrid() {
  const grid=document.getElementById("wallpaperStyleGrid");
  if(!grid) return;
  grid.innerHTML="";
  const current=(typeof localStorage!=="undefined"&&localStorage.getItem("wallpaperStyle"))||"matrix";
  WALLPAPER_STYLES.forEach(s=>{
    const btn=document.createElement("div");
    btn.className="preset-btn"+(s.id===current?" active":"");
    btn.innerHTML=`<div class="preset-swatch" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);box-shadow:none;border-radius:6px;">${s.icon}</div><div class="preset-name">${s.name}</div>`;
    btn.onclick=()=>{
      document.querySelectorAll("#wallpaperStyleGrid .preset-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      setWallpaperStyle(s.id);
      showNotif("Wallpaper","Style → "+s.name);
    };
    grid.appendChild(btn);
  });
}

function buildWallpaperPicker() {
  const {h,s,v}=hexToHSB(_currentAccentHex);
  _wheelHue=h;_wheelSat=s;_wheelBrt=v;
  buildWallpaperStyleGrid();
  buildPresetGrid();
  // Delay wheel init until window is visible
  setTimeout(initThemeWheel, 50);
}
