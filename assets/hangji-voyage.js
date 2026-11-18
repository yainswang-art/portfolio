(() => {
  'use strict';
  const root = document.getElementById('hangji');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const canvas = $('#route');
  const ctx = canvas.getContext('2d');
  const slider = $('#timeline');
  const play = $('#hj-play');
  const stageButtons = [...root.querySelectorAll('[data-progress]')];
  const cameraButtons = [...root.querySelectorAll('[data-camera]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const segments = [
    { at:0, no:'第 01 段', name:'推出与滑行', phase:'滑行', map:'第 01 段 · 滑行道上排队',
      what:'离开廊桥，在滑行道上排队，等塔台给一个离场时刻。',
      why:'前面还有六架飞机等同一个离场点，塔台要拉开间隔；机长把这段等待算进油量和时间。',
      feel:'走走停停，发动机声音忽大忽小，安全带灯还亮着。',
      eta:'11:40', tone:'plan' },
    { at:8, no:'第 02 段', name:'起飞与爬升', phase:'起飞', map:'第 02 段 · 连续爬升',
      what:'起飞后连续爬升，十分钟到三千米，再一层层往巡航高度走。',
      why:'低空有别的飞机和限制区，只能听指令一层层爬；爬得高更省油，但要看天气给不给。',
      feel:'推背，耳朵发闷，窗外的地面越变越小。',
      eta:'11:46', tone:'late' },
    { at:25, no:'第 03 段', name:'巡航', phase:'巡航', map:'第 03 段 · 35,000 英尺',
      what:'保持 35,000 英尺，速度约 850 公里每小时，沿航路点往南。',
      why:'这个高度风更顺、耗油更少，也刚好在云层上面，颠簸最小。顺风还帮忙追回两分钟。',
      feel:'机身基本平稳，安全带灯灭了，只剩持续的发动机声。',
      eta:'11:44', tone:'recover' },
    { at:50, no:'第 04 段', name:'绕开一片雷雨', phase:'绕飞', map:'第 04 段 · 右偏 15 公里',
      what:'请求右偏十五公里，绕开前方那块对流云，航向和高度一起改。',
      why:'气象雷达上那片云顶高、回波强，穿过去会剧烈颠簸；绕飞多烧油，但更稳。',
      feel:'安全带灯亮，广播提醒，大约八分钟轻到中度颠簸。',
      eta:'11:56', tone:'late' },
    { at:62, no:'第 05 段', name:'没有信号的二十分钟', phase:'离线', map:'第 05 段 · 位置靠估算', offline:true,
      what:'飞机照常飞，但手机收不到地面网络，位置只能按航向和速度推。',
      why:'海上没有基站，机上 Wi-Fi 也没连上卫星。系统宁可写“估算”，也不假装知道。',
      feel:'地图停在上一个点，进度条走得很慢。',
      eta:'11:54–11:58', tone:'range' },
    { at:82, no:'第 06 段', name:'下降与排队', phase:'排队', map:'第 06 段 · 进近排队',
      what:'开始下降，在进近点前减速，按塔台指令排队进去。',
      why:'前面落地的飞机多，间隔要拉开；多盘旋一圈，比硬插进去安全。',
      feel:'引擎声小了又变大，机身倾斜，地面在窗外转了一圈。',
      eta:'11:58', tone:'late' },
    { at:100, no:'第 07 段', name:'落地', phase:'落地', map:'第 07 段 · 已落地',
      what:'放下起落架，接地，减速滑跑。',
      why:'塔台给了落地许可，跑道是空的，不用复飞。',
      feel:'一下触地的闷响，反推的轰鸣，然后安静下来。',
      eta:'11:57', tone:'final' }
  ];
  let progress = 0, playing = false, lastTime = 0, frame = 0, stageIndex = -1;
  let cameraMode = 'overview', currentCamera = null, targetCamera = null;
  const earth = new Image();
  earth.src = new URL('hangji-earth.png', document.currentScript.src).href;
  earth.addEventListener('load', () => { draw(); });
  earth.addEventListener('error', () => { draw(); });
  // 原项目固定投影的机场锚点，来自核心动效演示中 1000px 地球图的坐标。
  const departure = { x:0.5095, y:0.4301 }, arrival = { x:0.4915, y:0.5644 };
  function point(t) { return { x:departure.x+(arrival.x-departure.x)*t+Math.sin(Math.PI*t)*0.015, y:departure.y+(arrival.y-departure.y)*t }; }
  function resizeCamera() {
    const {width:w,height:h} = canvas.getBoundingClientRect();
    const size = cameraMode === 'overview' ? Math.min(w*1.02,h*1.86) : Math.min(w*2.05,h*3.0);
    const focus = cameraMode === 'overview' ? {x:0.5005,y:0.4972} : cameraMode === 'arrival' ? arrival : point(progress/100);
    targetCamera = {size, x:w*0.5-focus.x*size, y:h*(cameraMode==='overview'?0.51:0.49)-focus.y*size};
    if (!currentCamera || reduced.matches) currentCamera = {...targetCamera};
  }
  function draw() {
    if (!ctx) return;
    const {width:w,height:h} = canvas.getBoundingClientRect();
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1,2);
    if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) { canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr); }
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#030b12';ctx.fillRect(0,0,w,h);
    if (!currentCamera) resizeCamera();
    const c=currentCamera;
    if (earth.complete && earth.naturalWidth) { ctx.drawImage(earth,c.x,c.y,c.size,c.size);ctx.fillStyle='#07182830';ctx.fillRect(0,0,w,h); }
    else { ctx.strokeStyle='#1c424e';ctx.lineWidth=1;for(let y=20;y<h;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();} }
    const screen = t => {const p=point(t);return{x:c.x+p.x*c.size,y:c.y+p.y*c.size};};
    const trace = t => {ctx.beginPath();for(let i=0;i<=80;i++){const p=screen(t*i/80);if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.stroke();};
    ctx.strokeStyle='#cae8e780';ctx.lineWidth=1.6;ctx.setLineDash([4,6]);trace(1);ctx.setLineDash([]);
    const active = segments[Math.max(0,stageIndex)];
    const accent = active && active.offline ? '#e8bd85' : '#77e7ea';
    ctx.strokeStyle=accent;ctx.lineWidth=2.6;ctx.shadowBlur=10;ctx.shadowColor=accent;trace(progress/100);ctx.shadowBlur=0;
    // 航段分隔点（相邻太近时避让，避免挤成一团）
    let lastDot = null;
    for (let i=0;i<segments.length;i++) {
      const p = screen(segments[i].at/100);
      const done = progress >= segments[i].at, now = i===stageIndex;
      if (!now && lastDot && Math.hypot(p.x-lastDot.x,p.y-lastDot.y) < 9) continue;
      ctx.beginPath();ctx.arc(p.x,p.y,now?5:2.4,0,Math.PI*2);
      ctx.fillStyle = now ? accent : done ? '#cae8e7aa' : '#cae8e745';
      ctx.fill();
      lastDot = p;
    }
    for(const [t,text] of [[0,'北京 PEK'],[1,'深圳 SZX']]){const p=screen(t);ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#edf7ed';ctx.fill();ctx.font='12px "Microsoft YaHei",sans-serif';ctx.textAlign=t===0?'left':'right';const tx=p.x+(t===0?13:-13),ty=p.y+(t===0?-11:24);ctx.lineWidth=4;ctx.strokeStyle='#071017';ctx.strokeText(text,tx,ty);ctx.fillText(text,tx,ty);}
    const p=screen(progress/100),ahead=screen(Math.min(1,progress/100+0.001)),before=screen(Math.max(0,progress/100-0.001));
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(ahead.y-before.y,ahead.x-before.x));ctx.fillStyle=active&&active.offline?'#e8bd85':'#fff6d9';ctx.shadowBlur=12;ctx.shadowColor='#8afaff';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-7);ctx.lineTo(-4,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.restore();
    const vignette=ctx.createLinearGradient(0,0,0,h);vignette.addColorStop(0,'#030b1233');vignette.addColorStop(0.65,'#030b1200');vignette.addColorStop(1,'#030b12b0');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  }
  // 到达时间的一路变化：点一下直接跳到那一段
  const rail = $('#hj-eta-rail');
  if (rail) {
    rail.innerHTML = segments.map((s,i)=>'<button type="button" data-rail="'+i+'" aria-pressed="'+String(i===0)+'">'+s.eta+'</button>').join('<span aria-hidden="true">·</span>');
    rail.querySelectorAll('[data-rail]').forEach(button=>button.addEventListener('click',()=>{
      stop();progress=segments[Number(button.dataset.rail)].at;update();animate();
    }));
  }
  function update() {
    slider.value=String(progress);$('#progress').textContent=Math.round(progress)+'%';
    let index=0;segments.forEach((s,i)=>{if(progress>=s.at)index=i;});
    const seg=segments[index];
    slider.setAttribute('aria-valuetext',Math.round(progress)+'% · '+seg.phase+' · '+seg.name);
    if(stageIndex!==index){
      stageIndex=index;
      $('#hj-seg-no').textContent=seg.no;
      $('#hj-seg-phase').textContent=seg.phase;
      $('#hj-seg-name').textContent=seg.name;
      $('#hj-seg-what').textContent=seg.what;
      $('#hj-seg-why').textContent=seg.why;
      $('#hj-seg-feel').textContent=seg.feel;
      $('#hj-seg-eta').textContent=seg.eta;
      $('#hj-seg-eta').dataset.tone=seg.tone;
      $('#hj-stage-name').textContent=seg.phase;
      $('#hj-position').textContent=seg.map;
      stageButtons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
      if(rail)rail.querySelectorAll('[data-rail]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
    }
    resizeCamera();draw();
  }
  function stop() {playing=false;play.textContent='▶ 播放航程';play.setAttribute('aria-pressed','false');lastTime=0;}
  function tick(now) {
    frame=0;
    const elapsed=lastTime?Math.min(now-lastTime,80):0;lastTime=now;
    if(playing){progress=Math.min(100,progress+elapsed/300);update();if(progress===100)stop();}
    let moving=false;
    if(currentCamera&&targetCamera){for(const key of ['x','y','size']){const delta=targetCamera[key]-currentCamera[key];if(Math.abs(delta)>0.15){currentCamera[key]+=delta*(1-Math.exp(-Math.max(elapsed,16)/160));moving=true;}else currentCamera[key]=targetCamera[key];}}
    draw();
    if(playing||moving)frame=requestAnimationFrame(tick);else lastTime=0;
  }
  function animate(){if(!frame)frame=requestAnimationFrame(tick);}
  play.addEventListener('click',()=>{if(playing){stop();return;}if(progress>=100)progress=0;playing=true;play.textContent='Ⅱ 暂停航程';play.setAttribute('aria-pressed','true');if(!reduced.matches&&cameraMode==='overview')setCamera('follow');update();animate();});
  slider.addEventListener('input',()=>{stop();progress=Number(slider.value);update();animate();});
  stageButtons.forEach(button=>button.addEventListener('click',()=>{stop();progress=Number(button.dataset.progress);update();animate();}));
  function setCamera(mode){cameraMode=mode;cameraButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.camera===mode)));resizeCamera();draw();animate();}
  cameraButtons.forEach(button=>button.addEventListener('click',()=>setCamera(button.dataset.camera)));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();},{threshold:0}).observe(canvas);
  const updateNav=()=>{const rect=root.getBoundingClientRect();document.body.classList.toggle('hj-visible',rect.top<80&&rect.bottom>80);};
  window.addEventListener('scroll',updateNav,{passive:true});updateNav();
  new ResizeObserver(()=>{resizeCamera();draw();animate();}).observe(canvas);
  reduced.addEventListener('change',()=>{resizeCamera();draw();});
  update();
})();
