const COLORS = [
  { name:"Toxic", value:"#39ff7a", glow:"#9bffbf" },
  { name:"Cyan",  value:"#22d3ee", glow:"#7ff0ff" },
  { name:"White", value:"#ffffff", glow:"#ffffff" },
  { name:"Rose",  value:"#ff3b6b", glow:"#ff7aa2" },
  { name:"Amber", value:"#ffb547", glow:"#ffd58a" },
  { name:"Violet",value:"#a78bfa", glow:"#cfbcff" },
];
const HAND_CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const overlay = document.getElementById("overlay");
const statusText = document.getElementById("statusText");
const statusDot = document.querySelector(".status .dot");
const splash = document.getElementById("splash");
const splashSub = document.getElementById("splashSub");
const paletteEl = document.getElementById("palette");
const brushInput = document.getElementById("brush");
const brushVal = document.getElementById("brushVal");

let strokes = [];
let current = null;
let moveAnchor = null;
let mode = "draw";
let color = COLORS[0];
let size = 7;
let ready = false;

// Palette
COLORS.forEach(c => {
  const b = document.createElement("button");
  b.className = "swatch" + (c.value === color.value ? " active" : "");
  b.style.background = c.value;
  b.style.boxShadow = `0 0 24px ${c.glow}, 0 0 4px ${c.glow}`;
  b.title = c.name;
  b.onclick = () => {
    color = c;
    document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
    b.classList.add("active");
  };
  paletteEl.appendChild(b);
});

brushInput.oninput = () => { size = parseInt(brushInput.value); brushVal.textContent = size + "px"; };

document.querySelectorAll(".mode").forEach(m => {
  m.onclick = () => {
    document.querySelectorAll(".mode").forEach(x => x.classList.remove("active"));
    m.classList.add("active");
    mode = m.dataset.mode;
  };
});

document.getElementById("btnClear").onclick = () => { strokes = []; current = null; redraw(); };
document.getElementById("btnUndo").onclick = () => { strokes.pop(); redraw(); };

window.addEventListener("keydown", e => {
  if (e.key === "c" || e.key === "C") { strokes = []; current = null; redraw(); }
  if (e.key === "z" || e.key === "Z") { strokes.pop(); redraw(); }
  if (e.key === " ") {
    mode = mode === "draw" ? "watch" : "draw";
    document.querySelectorAll(".mode").forEach(m => m.classList.toggle("active", m.dataset.mode === mode));
  }
});

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(rect.width * dpr), h = Math.floor(rect.height * dpr);
  [canvas, overlay].forEach(c => {
    c.width = w; c.height = h;
    c.style.width = rect.width + "px"; c.style.height = rect.height + "px";
  });
  redraw();
}
window.addEventListener("resize", resize);
resize();

function drawStroke(ctx, s) {
  if (s.points.length < 1) return;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.shadowColor = s.color; ctx.shadowBlur = 28;
  ctx.strokeStyle = s.color; ctx.lineWidth = s.size;
  ctx.beginPath();
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(1, s.size * 0.35);
  ctx.stroke();
}
function redraw() {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of strokes) drawStroke(ctx, s);
  if (current) drawStroke(ctx, current);
}
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function eraseAt(p, radius) {
  const r2 = radius * radius;
  const next = [];
  for (const s of strokes) {
    let buf = [];
    for (const pt of s.points) {
      const dx = pt.x - p.x, dy = pt.y - p.y;
      if (dx*dx + dy*dy > r2) buf.push(pt);
      else { if (buf.length > 1) next.push({ color:s.color, size:s.size, points:buf }); buf = []; }
    }
    if (buf.length > 1) next.push({ color:s.color, size:s.size, points:buf });
  }
  strokes = next;
}

function setStatus(text, isReady) {
  statusText.textContent = text;
  statusDot.className = "dot " + (isReady ? "ok" : "warn");
  if (isReady) splash.classList.add("hidden");
  else splashSub.textContent = text;
}

function onResults(results) {
  const octx = overlay.getContext("2d");
  octx.clearRect(0, 0, overlay.width, overlay.height);
  const W = overlay.width, H = overlay.height;

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    if (current) { strokes.push(current); current = null; }
    moveAnchor = null;
    if (ready) setStatus(mode === "draw" ? "وضع الرسم" : "وضع المشاهدة", true);
    return;
  }

  const lm = results.multiHandLandmarks[0];
  const pts = lm.map(p => ({ x:(1 - p.x) * W, y:p.y * H }));
  const tipI = pts[8], pipI = pts[6], tipM = pts[12], pipM = pts[10];
  const tipR = pts[16], pipR = pts[14], tipP = pts[20], pipP = pts[18], tipT = pts[4];

  const indexUp = tipI.y < pipI.y - 6;
  const middleUp = tipM.y < pipM.y - 6;
  const ringDown = tipR.y > pipR.y - 4;
  const pinkyDown = tipP.y > pipP.y - 4;

  const palmRef = dist(pts[0], pts[9]) || 1;
  const pinch = dist(tipI, tipT) / palmRef < 0.35;

  let g = "idle";
  if (mode === "draw") {
    if (pinch && ringDown && pinkyDown) g = "move";
    else if (indexUp && middleUp && ringDown && pinkyDown) g = "erase";
    else if (indexUp && !middleUp) g = "draw";
  }

  const accent = color.value;
  octx.save();
  octx.shadowColor = accent; octx.shadowBlur = 18;
  octx.strokeStyle = accent; octx.lineWidth = 3;
  for (const [a,b] of HAND_CONN) {
    octx.beginPath(); octx.moveTo(pts[a].x, pts[a].y); octx.lineTo(pts[b].x, pts[b].y); octx.stroke();
  }
  octx.shadowBlur = 0;
  octx.strokeStyle = "rgba(255,255,255,0.85)"; octx.lineWidth = 1.2;
  for (const [a,b] of HAND_CONN) {
    octx.beginPath(); octx.moveTo(pts[a].x, pts[a].y); octx.lineTo(pts[b].x, pts[b].y); octx.stroke();
  }
  for (const p of pts) {
    octx.shadowColor = accent; octx.shadowBlur = 12;
    octx.fillStyle = accent;
    octx.beginPath(); octx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); octx.fill();
    octx.shadowBlur = 0;
    octx.fillStyle = "rgba(255,255,255,0.95)";
    octx.beginPath(); octx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); octx.fill();
  }
  octx.restore();

  if (g === "draw") {
    moveAnchor = null;
    if (!current) current = { color: color.value, size, points: [] };
    const arr = current.points, last = arr[arr.length - 1];
    const next = { x: tipI.x, y: tipI.y };
    if (!last || dist(last, next) > 2) {
      const smooth = last ? { x: last.x * 0.55 + next.x * 0.45, y: last.y * 0.55 + next.y * 0.45 } : next;
      arr.push(smooth);
    }
  } else if (current) { strokes.push(current); current = null; }

  if (g === "move") {
    const pp = { x:(tipI.x + tipT.x)/2, y:(tipI.y + tipT.y)/2 };
    if (moveAnchor) {
      const dx = pp.x - moveAnchor.x, dy = pp.y - moveAnchor.y;
      for (const s of strokes) for (const p of s.points) { p.x += dx; p.y += dy; }
    }
    moveAnchor = pp;
  } else moveAnchor = null;

  if (g === "erase") {
    const c = { x:(tipI.x + tipM.x)/2, y:(tipI.y + tipM.y)/2 };
    const r = Math.max(30, palmRef * 0.45);
    eraseAt(c, r);
    octx.save();
    octx.strokeStyle = "rgba(255,80,120,0.9)";
    octx.shadowColor = "#ff3b6b"; octx.shadowBlur = 18; octx.lineWidth = 2;
    octx.beginPath(); octx.arc(c.x, c.y, r, 0, Math.PI * 2); octx.stroke();
    octx.restore();
  }

  redraw();

  if (g !== "move") {
    octx.save();
    octx.shadowColor = accent; octx.shadowBlur = 22;
    octx.fillStyle = accent;
    octx.beginPath(); octx.arc(tipI.x, tipI.y, g === "draw" ? 10 : 6, 0, Math.PI * 2); octx.fill();
    octx.shadowBlur = 0;
    octx.fillStyle = "rgba(255,255,255,0.95)";
    octx.beginPath(); octx.arc(tipI.x, tipI.y, 2.4, 0, Math.PI * 2); octx.fill();
    octx.restore();
  }

  const label = g === "draw" ? "يرسم الآن" : g === "move" ? "يحرّك الرسمة" : g === "erase" ? "يمسح" : (mode === "draw" ? "وضع الرسم" : "وضع المشاهدة");
  setStatus(label, true);
}

(async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("المتصفح لا يدعم الكاميرا.", false); return; }
    setStatus("جاري طلب إذن الكاميرا…", false);
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode:"user", width:{ideal:isMobile?640:1280}, height:{ideal:isMobile?480:720} },
      audio: false
    });
    video.srcObject = stream;
    await video.play().catch(()=>{});
    await new Promise(r => { if (video.readyState >= 2) r(); else video.onloadedmetadata = () => r(); });

    setStatus("جاري تحميل نموذج تتبع اليد…", false);
    const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
    hands.setOptions({ maxNumHands:1, modelComplexity:0, minDetectionConfidence:0.6, minTrackingConfidence:0.5 });
    hands.onResults(onResults);

    ready = true;
    setStatus("جاهز — ارفع السبابة لتبدأ", true);

    const tick = async () => {
      if (video.readyState >= 2) { try { await hands.send({ image: video }); } catch {} }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } catch (e) {
    const n = e?.name || "";
    if (n === "NotAllowedError" || n === "SecurityError") setStatus("تم رفض إذن الكاميرا.", false);
    else if (n === "NotFoundError" || n === "OverconstrainedError") setStatus("لم يتم العثور على كاميرا.", false);
    else setStatus("تعذّر تشغيل الكاميرا: " + (e?.message || n), false);
  }
})();
