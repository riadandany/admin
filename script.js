(function () {
  const COLORS = [
    { name: "Toxic",  value: "#39ff7a", glow: "#9bffbf" },
    { name: "Cyan",   value: "#22d3ee", glow: "#7ff0ff" },
    { name: "White",  value: "#ffffff", glow: "#ffffff" },
    { name: "Rose",   value: "#ff3b6b", glow: "#ff7aa2" },
    { name: "Amber",  value: "#ffb547", glow: "#ffd58a" },
    { name: "Violet", value: "#a78bfa", glow: "#cfbcff" },
  ];
  const HAND_CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

  const $ = (s) => document.querySelector(s);
  const video = $("#video"), canvas = $("#canvas"), overlay = $("#overlay");
  const ctx = canvas.getContext("2d"), octx = overlay.getContext("2d");
  const statusText = $("#statusText"), splash = $("#splash"), splashStatus = $("#splashStatus");
  const dot = $("#dot");
  const sizeInput = $("#size"), sizeLabel = $("#sizeLabel");
  const paletteEl = $("#palette");

  let strokes = [], current = null;
  let moveAnchor = null, moveTarget = null, swipeAnchor = null, cooldown = 0;
  let colorIdx = 0, brushSize = 7, mode = "draw", ready = false;

  // Palette UI
  COLORS.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "swatch" + (i === 0 ? " active" : "");
    b.style.background = c.value;
    b.style.boxShadow = `0 0 24px ${c.glow}, 0 0 4px ${c.glow}`;
    b.title = c.name;
    b.onclick = () => setColor(i);
    paletteEl.appendChild(b);
  });
  function setColor(i){
    colorIdx = i;
    paletteEl.querySelectorAll(".swatch").forEach((el,j) => el.classList.toggle("active", i===j));
  }
  sizeInput.oninput = () => { brushSize = parseInt(sizeInput.value); sizeLabel.textContent = brushSize + "px"; };
  document.querySelectorAll(".mode").forEach(m => m.onclick = () => {
    mode = m.dataset.mode;
    document.querySelectorAll(".mode").forEach(x => x.classList.toggle("active", x===m));
  });
  $("#clearBtn").onclick = () => { strokes = []; current = null; redraw(); };
  $("#undoBtn").onclick  = () => { strokes.pop(); redraw(); };
  window.addEventListener("keydown", e => {
    if (e.key==="c"||e.key==="C"){ strokes=[]; current=null; redraw(); }
    if (e.key==="z"||e.key==="Z"){ strokes.pop(); redraw(); }
    if (e.key===" "){ const m = mode==="draw"?"watch":"draw"; mode=m;
      document.querySelectorAll(".mode").forEach(x => x.classList.toggle("active", x.dataset.mode===m)); }
  });

  function setStatus(t){ statusText.textContent = t; splashStatus.textContent = t; }
  function dist(a,b){ const dx=a.x-b.x,dy=a.y-b.y; return Math.hypot(dx,dy); }

  function drawStroke(c, s){
    if (s.points.length<1) return;
    c.lineCap="round"; c.lineJoin="round";
    c.shadowColor=s.color; c.shadowBlur=28;
    c.strokeStyle=s.color; c.lineWidth=s.size;
    c.beginPath(); c.moveTo(s.points[0].x, s.points[0].y);
    for (let i=1;i<s.points.length;i++) c.lineTo(s.points[i].x, s.points[i].y);
    c.stroke();
    c.shadowBlur=0; c.strokeStyle="rgba(255,255,255,0.92)";
    c.lineWidth=Math.max(1, s.size*0.35); c.stroke();
  }
  function redraw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const s of strokes) drawStroke(ctx, s);
    if (current) drawStroke(ctx, current);
  }
  function findNearestStroke(p, radius){
    let best=null;
    for (const s of strokes) for (let i=0;i<s.points.length;i++){
      const d=dist(s.points[i],p);
      if (d<radius && (!best || d<best.d)) best={stroke:s, idx:i, d};
    }
    if (!best) return null;
    const span=Math.max(8, Math.floor(best.stroke.points.length*0.18));
    return { stroke:best.stroke, lo:Math.max(0,best.idx-span), hi:Math.min(best.stroke.points.length-1,best.idx+span) };
  }
  function eraseAt(p, radius){
    const r2=radius*radius, next=[];
    for (const s of strokes){
      let buf=[], keep=[];
      for (const pt of s.points){
        const dx=pt.x-p.x, dy=pt.y-p.y;
        if (dx*dx+dy*dy>r2) buf.push(pt);
        else { if (buf.length>1) keep.push({color:s.color,size:s.size,points:buf}); buf=[]; }
      }
      if (buf.length>1) keep.push({color:s.color,size:s.size,points:buf});
      next.push(...keep);
    }
    strokes=next;
  }

  function resize(){
    const r = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(r.width*dpr), h = Math.floor(r.height*dpr);
    [canvas,overlay].forEach(c => { c.width=w; c.height=h; c.style.width=r.width+"px"; c.style.height=r.height+"px"; });
    redraw();
  }
  window.addEventListener("resize", resize); resize();

  function onResults(results){
    octx.clearRect(0,0,overlay.width,overlay.height);
    const W=overlay.width, H=overlay.height;
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length===0){
      if (current){ strokes.push(current); current=null; }
      moveAnchor=null; moveTarget=null; swipeAnchor=null;
      setStatus(mode==="draw"?"وضع الرسم":"وضع المشاهدة");
      redraw(); return;
    }
    const lm = results.multiHandLandmarks[0];
    const pts = lm.map(p => ({x:(1-p.x)*W, y:p.y*H}));
    const tipIndex=pts[8],pipIndex=pts[6],mcpIndex=pts[5];
    const tipMiddle=pts[12],pipMiddle=pts[10];
    const tipRing=pts[16],pipRing=pts[14];
    const tipPinky=pts[20],pipPinky=pts[18];
    const tipThumb=pts[4],ipThumb=pts[3];
    const wrist=pts[0];
    const palm = dist(pts[0],pts[9])||1;
    const fU=(t,p)=>t.y<p.y-6, fD=(t,p)=>t.y>p.y-2;
    const iU=fU(tipIndex,pipIndex), mU=fU(tipMiddle,pipMiddle), rU=fU(tipRing,pipRing), pU=fU(tipPinky,pipPinky);
    const iD=fD(tipIndex,pipIndex), mD=fD(tipMiddle,pipMiddle), rD=fD(tipRing,pipRing), pD=fD(tipPinky,pipPinky);
    const pinchID=dist(tipIndex,tipThumb)/palm, pinchMD=dist(tipMiddle,tipThumb)/palm;
    const thumbUp = tipThumb.y < ipThumb.y-4, thumbDownPose = tipThumb.y > ipThumb.y+4;
    const fist = iD && mD && rD && pD && dist(tipThumb,mcpIndex)/palm<0.7;
    const thumbsDown = thumbDownPose && iD && mD && rD && pD;
    const snap = pinchMD<0.18 && pinchID>0.35 && rD && pD;
    const openPalm = iU && mU && rU && pU && thumbUp;
    const now = performance.now(), cool = now < cooldown;

    let g = "idle";
    if (mode === "draw"){
      if (!cool && thumbsDown) g="undo";
      else if (!cool && snap) g="clear";
      else if (openPalm) g="swipe";
      else if (fist) g="moveAll";
      else if (pinchID<0.32 && rD && pD) g="moveOne";
      else if (iU && mU && rD && pD) g="erase";
      else if (iU && !mU) g="draw";
    }

    // Skeleton
    const accent = COLORS[colorIdx].value;
    octx.save();
    octx.shadowColor=accent; octx.shadowBlur=18; octx.strokeStyle=accent; octx.lineWidth=3;
    for (const [a,b] of HAND_CONN){ octx.beginPath(); octx.moveTo(pts[a].x,pts[a].y); octx.lineTo(pts[b].x,pts[b].y); octx.stroke(); }
    octx.shadowBlur=0; octx.strokeStyle="rgba(255,255,255,0.85)"; octx.lineWidth=1.2;
    for (const [a,b] of HAND_CONN){ octx.beginPath(); octx.moveTo(pts[a].x,pts[a].y); octx.lineTo(pts[b].x,pts[b].y); octx.stroke(); }
    for (let i=0;i<pts.length;i++){
      const p=pts[i];
      octx.shadowColor=accent; octx.shadowBlur=12; octx.fillStyle=accent;
      octx.beginPath(); octx.arc(p.x,p.y,3.5,0,Math.PI*2); octx.fill();
      octx.shadowBlur=0; octx.fillStyle="rgba(255,255,255,0.95)";
      octx.beginPath(); octx.arc(p.x,p.y,1.4,0,Math.PI*2); octx.fill();
    }
    octx.restore();

    if (g==="draw"){
      moveAnchor=null; moveTarget=null;
      if (!current) current={ color:COLORS[colorIdx].value, size:brushSize, points:[] };
      const arr=current.points, last=arr[arr.length-1], next={x:tipIndex.x,y:tipIndex.y};
      if (!last || dist(last,next)>2){
        const sm = last ? {x:last.x*0.55+next.x*0.45, y:last.y*0.55+next.y*0.45} : next;
        arr.push(sm);
      }
    } else if (current){ strokes.push(current); current=null; }

    if (g==="moveOne"){
      const pp = { x:(tipIndex.x+tipThumb.x)/2, y:(tipIndex.y+tipThumb.y)/2 };
      if (!moveTarget){ moveTarget = findNearestStroke(pp, Math.max(40, palm*0.6)); }
      if (moveTarget && moveAnchor){
        const dx=pp.x-moveAnchor.x, dy=pp.y-moveAnchor.y;
        const {stroke,lo,hi}=moveTarget;
        for (let i=lo;i<=hi;i++){ stroke.points[i].x+=dx; stroke.points[i].y+=dy; }
      }
      moveAnchor=pp;
      if (moveTarget){
        const {stroke,lo,hi}=moveTarget;
        octx.save(); octx.strokeStyle="rgba(155,255,191,0.9)";
        octx.shadowColor=accent; octx.shadowBlur=16; octx.lineWidth=2;
        octx.beginPath(); octx.moveTo(stroke.points[lo].x,stroke.points[lo].y);
        for (let i=lo+1;i<=hi;i++) octx.lineTo(stroke.points[i].x,stroke.points[i].y);
        octx.stroke(); octx.restore();
      }
    } else { moveTarget=null; }

    if (g==="moveAll"){
      if (moveAnchor){
        const dx=wrist.x-moveAnchor.x, dy=wrist.y-moveAnchor.y;
        for (const s of strokes) for (const p of s.points){ p.x+=dx; p.y+=dy; }
      }
      moveAnchor=wrist;
    } else if (g!=="moveOne"){ moveAnchor=null; }

    if (g==="erase"){
      const center={x:(tipIndex.x+tipMiddle.x)/2, y:(tipIndex.y+tipMiddle.y)/2};
      const r=Math.max(30, palm*0.45);
      eraseAt(center, r);
      octx.save(); octx.strokeStyle="rgba(255,80,120,0.9)";
      octx.shadowColor="#ff3b6b"; octx.shadowBlur=18; octx.lineWidth=2;
      octx.beginPath(); octx.arc(center.x,center.y,r,0,Math.PI*2); octx.stroke(); octx.restore();
    }

    if (g==="swipe"){
      if (!swipeAnchor) swipeAnchor={x:mcpIndex.x, t:now};
      const dx=mcpIndex.x-swipeAnchor.x, dt=now-swipeAnchor.t;
      if (Math.abs(dx)>palm*0.9 && dt<700 && !cool){
        const dir = dx>0 ? 1 : -1;
        setColor((colorIdx + dir + COLORS.length) % COLORS.length);
        cooldown = now + 600;
        swipeAnchor = {x:mcpIndex.x, t:now};
      } else if (dt>700){ swipeAnchor={x:mcpIndex.x, t:now}; }
    } else { swipeAnchor=null; }

    if (g==="clear" && !cool){ strokes=[]; current=null; cooldown=now+900; }
    if (g==="undo"  && !cool){ strokes.pop(); cooldown=now+600; }

    redraw();

    if (g==="draw" || g==="idle" || g==="erase"){
      octx.save();
      octx.shadowColor=accent; octx.shadowBlur=22; octx.fillStyle=accent;
      octx.beginPath(); octx.arc(tipIndex.x,tipIndex.y, g==="draw"?10:6, 0, Math.PI*2); octx.fill();
      octx.shadowBlur=0; octx.fillStyle="rgba(255,255,255,0.95)";
      octx.beginPath(); octx.arc(tipIndex.x,tipIndex.y,2.4,0,Math.PI*2); octx.fill();
      octx.restore();
    }

    setStatus(
      g==="draw" ? "يرسم" : g==="moveOne" ? "يحرّك قطعة" : g==="moveAll" ? "يحرّك الكل" :
      g==="erase" ? "يمسح" : g==="clear" ? "مسح كامل" : g==="undo" ? "تراجع" :
      g==="swipe" ? "تغيير اللون" : (mode==="draw"?"وضع الرسم":"وضع المشاهدة")
    );
  }

  async function init(){
    try{
      if (!navigator.mediaDevices?.getUserMedia){ setStatus("المتصفح لا يدعم الكاميرا."); return; }
      setStatus("جاري تجهيز الكاميرا والنموذج…");
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:"user",
          width:{ideal:isMobile?480:640}, height:{ideal:isMobile?360:480},
          frameRate:{ideal:30,max:30} }, audio:false
      });
      video.srcObject = stream;
      video.setAttribute("playsinline","true"); video.muted=true;
      await video.play().catch(()=>{});
      if (video.readyState<2) await new Promise(r => video.onloadedmetadata = r);

      const hands = new window.Hands({ locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
      hands.setOptions({ maxNumHands:1, modelComplexity:0, minDetectionConfidence:0.5, minTrackingConfidence:0.5, selfieMode:false });
      hands.onResults(onResults);

      ready=true; dot.className="dot ready"; splash.classList.add("hide");
      setStatus("جاهز — ارفع السبابة لتبدأ");

      let busy=false, frame=0;
      const tick = async () => {
        frame++;
        const skip = isMobile && (frame%2===0);
        if (!busy && !skip && video.readyState>=2){ busy=true; try{ await hands.send({image:video}); } catch{} busy=false; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch(e){
      const n=e?.name||"";
      if (n==="NotAllowedError"||n==="SecurityError") setStatus("تم رفض إذن الكاميرا.");
      else if (n==="NotFoundError"||n==="OverconstrainedError") setStatus("لم يتم العثور على كاميرا.");
      else setStatus("تعذّر تشغيل الكاميرا: " + (e?.message||n));
    }
  }
  init();
})();
