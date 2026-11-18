(() => {
 'use strict';
 const root=document.getElementById('sky-flight');if(!root)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const $=s=>root.querySelector(s);let driven=-1,ready=false,ticket=0,active=false,progress=0,frame=0,renderer,scene,camera,controls,earth,stars,route,observer,auto=false,reverse=false,last=0,originFocus,oldOverflow,inertRecords=[];
 const clamp=n=>Math.max(0,Math.min(1,n)),smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
 const script=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;root.append(s);});
 let libraries;function load(){return libraries ||= Promise.all([window.TeapotRuntime?Promise.resolve():script('assets/teapot-runtime.js'),window.SkyTextures?Promise.resolve():script('assets/sky-textures.js')]).catch(e=>{libraries=null;throw e;});}
 function jump(id){const node=document.getElementById(id);history.replaceState(null,'','#'+id);node.scrollIntoView({behavior:'instant',block:'start'});node.setAttribute('tabindex','-1');node.focus({preventScroll:true});}
 function close(destination){if(!active)return;active=false;auto=false;if(frame)cancelAnimationFrame(frame);frame=0;observer?.disconnect();controls?.dispose();if(scene){const textures=new Set();scene.traverse(n=>{n.geometry?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material])if(m){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}});textures.forEach(t=>t.dispose());}renderer?.dispose();renderer?.forceContextLoss();renderer=null;scene=null;$('.sf-stage').replaceChildren();root.hidePopover();document.body.style.overflow=oldOverflow;for(const[e,v]of inertRecords)e.inert=v;inertRecords=[];if(destination)jump(destination);else originFocus?.focus({preventScroll:true});}
 function update(){
  root.style.setProperty('--sf-sky',String(1-smooth(.33,.76,progress)));root.style.setProperty('--sf-rise',String(smooth(0,.5,progress)));root.style.setProperty('--sf-cloud',String(Math.sin(Math.PI*clamp(progress/.65))));
  $('#sf-progress').value=String(progress*100);$('#sf-progress').setAttribute('aria-valuetext',progress<.3?'海面':progress<.67?'云层':'地球与北京至深圳航线');
  $('#sf-title').textContent=progress<.28?'从海面，抬头。':progress<.6?'穿过云层。':'把一段等待，看得明白。';
  $('#sf-caption').textContent=progress<.28?'离开船边的视角，去看一段飞行。':progress<.6?'镜头慢慢拉远，海岸成为地球的一部分。':'北京首都 → 深圳宝安 · 航迹';
  $('#sf-play').textContent=auto?'暂停旅程':'播放旅程';$('#sf-play').setAttribute('aria-pressed',String(auto));
  root.dataset.phase=progress>.85?'earth':progress>.3?'cloud':'sea';
  if(!renderer||!ready)return;
  const T=window.TeapotRuntime.THREE,t=smooth(.35,.95,progress);
  controls.enabled=progress>.92;earth.visible=progress>.34;earth.position.y=-1.2*(1-t);earth.rotation.y=(1-t)*.7;
  if(!controls.enabled||auto||Math.abs(progress-driven)>.0001){driven=progress;camera.position.set(-.43, .52, -.81).normalize().multiplyScalar(5.3-2.2*t);camera.lookAt(0,earth.position.y,0);controls.target.set(0,earth.position.y,0);controls.update();}
  stars.material.opacity=smooth(.5,.95,progress)*.65;route.visible=progress>.8;
  renderer.render(scene,camera);root.dataset.camera=camera.position.toArray().map(v=>v.toFixed(3)).join(',');root.dataset.ready='loaded';
  for(const [selector,lat,lon]of [['.sf-pek',40.073,116.598],['.sf-szx',22.638,113.812]]){const p=geo(T,lat,lon,1.04);earth.localToWorld(p);p.project(camera);const marker=$(selector);marker.style.left=(p.x*.5+.5)*100+'%';marker.style.top=(-p.y*.5+.5)*100+'%';marker.hidden=progress<.86;}
 }
 function geo(T,lat,lon,r=1){const a=lat*Math.PI/180,b=lon*Math.PI/180;return new T.Vector3(r*Math.cos(a)*Math.cos(b),r*Math.sin(a),-r*Math.cos(a)*Math.sin(b));}
 function schedule(){if(!frame)frame=requestAnimationFrame(tick);}
 function tick(now){frame=0;if(!active)return;const dt=last?Math.min(70,now-last):0;last=now;if(auto){progress=clamp(progress+(reverse?-1:1)*dt/6500);if(progress>=1){auto=false;}if(reverse&&progress<=0){close('voyage');return;}}update();if(auto)schedule();else last=0;}
 async function open(back=false){
  if(active)return;const session=++ticket;driven=-1;ready=false;root.dataset.ready='loading';active=true;reverse=back;progress=back?1:reduced.matches?1:0;auto=false;$('#sf-play').disabled=reduced.matches;originFocus=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  inertRecords=[...document.querySelectorAll('body>main,body>.masthead,body>footer')].map(e=>[e,e.inert]);for(const[e]of inertRecords)e.inert=true;
  root.showPopover();$('#sf-enter').focus();$('#sf-status').textContent='正在准备天空与地球…';update();
  try{await load();if(!active||session!==ticket)return;const {THREE:T,OrbitControls}=window.TeapotRuntime;
   renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;$('.sf-stage').append(renderer.domElement);renderer.domElement.setAttribute('aria-label','可拖动旋转的三维地球');renderer.domElement.tabIndex=0;
   scene=new T.Scene();camera=new T.PerspectiveCamera(43,1,.05,50);controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=2;controls.maxDistance=5;controls.addEventListener('change',()=>{if(!active||auto||progress<.93)return;update();});
   const loader=new T.TextureLoader();const[day,night]=await Promise.all([loader.loadAsync(window.SkyTextures.day),loader.loadAsync(window.SkyTextures.night)]);if(!active||session!==ticket){day.dispose();night.dispose();return;}day.colorSpace=night.colorSpace=T.SRGBColorSpace;
   earth=new T.Group();scene.add(earth);earth.add(new T.Mesh(new T.SphereGeometry(1,64,40),new T.MeshPhongMaterial({map:day,emissiveMap:night,emissive:0xffffff,emissiveIntensity:.4,shininess:8})));
   scene.add(new T.AmbientLight(0xa8cbe9,.4));const light=new T.DirectionalLight(0xfff2d8,2.4);light.position.set(-3,3,-4);scene.add(light);
   const atmosphere=new T.Mesh(new T.SphereGeometry(1.025,48,32),new T.ShaderMaterial({vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.2,.6,1.,a*.65);}',transparent:true,depthWrite:false,side:T.FrontSide,blending:T.AdditiveBlending}));earth.add(atmosphere);
   const positions=new Float32Array(900);for(let i=0;i<900;i++)positions[i]=(Math.random()-.5)*20;const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));stars=new T.Points(geometry,new T.PointsMaterial({color:0xcadbe5,size:.018,transparent:true,opacity:0,depthWrite:false}));scene.add(stars);
   route=new T.Group();earth.add(route);const a=geo(T,40.073,116.598),b=geo(T,22.638,113.812);const pts=Array.from({length:65},(_,i)=>a.clone().lerp(b,i/64).normalize().multiplyScalar(1.02+Math.sin(Math.PI*i/64)*.025));route.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xa8e6dc})));
   for(const p of[a,b]){const dot=new T.Mesh(new T.SphereGeometry(.012,12,8),new T.MeshBasicMaterial({color:0xffd298}));dot.position.copy(p.multiplyScalar(1.025));route.add(dot);}
   ready=true;const resize=()=>{if(!renderer)return;const r=$('.sf-stage').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();update();};observer=new ResizeObserver(resize);observer.observe($('.sf-stage'));resize();$('#sf-status').textContent='';auto=!reduced.matches;update();if(auto)schedule();
  }catch(error){$('#sf-status').textContent='暂时无法载入地球，可以直接进入航迹。';auto=false;$('#sf-play').disabled=true;console.warn('Sky entry:',error.message);}
 }
 document.querySelector('#voyage .sky-actions a[href="#hangji"]').textContent='抬头，去看另一段旅程 ↑';
 document.querySelector('#voyage .sky-actions a[href="#hangji"]').addEventListener('click',event=>{event.preventDefault();open();});
 document.querySelectorAll('[data-sky-return]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();open(true);}));
 $('#sf-enter').onclick=()=>close('hangji');$('#sf-back').onclick=()=>close('voyage');$('#sf-play').onclick=()=>{if(reduced.matches)return;if(progress>=1){progress=0;reverse=false;}auto=!auto;update();schedule();};
 $('#sf-progress').oninput=event=>{auto=false;progress=Number(event.target.value)/100;update();};
 root.addEventListener('wheel',event=>{if(progress>.95&&!auto&&event.target.tagName==='CANVAS')return;event.preventDefault();auto=false;const delta=event.deltaMode===1?event.deltaY*16:event.deltaY;progress=clamp(progress+delta/1500);update();},{passive:false});
 let touchY;root.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY;},{passive:true});root.addEventListener('touchmove',e=>{if(e.touches.length!==1||touchY==null||progress>.95&&e.target.tagName==='CANVAS')return;const y=e.touches[0].clientY;auto=false;progress=clamp(progress+(touchY-y)/700);touchY=y;update();},{passive:true});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}if(event.key==='Tab'){const buttons=[...root.querySelectorAll('button,input')].filter(e=>!e.disabled);const i=buttons.indexOf(document.activeElement);if(event.shiftKey&&i<=0){event.preventDefault();buttons.at(-1).focus();}else if(!event.shiftKey&&i===buttons.length-1){event.preventDefault();buttons[0].focus();}}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){auto=false;update();}});
 reduced.addEventListener('change',()=>{if(active&&reduced.matches){auto=false;progress=1;update();}});
 // Only start on a deliberate upward gesture from the sea opening, never hijack reading.
 let gate=0;window.addEventListener('wheel',event=>{if(active||reduced.matches||event.deltaY>=0)return;const r=document.getElementById('voyage').getBoundingClientRect();if(Math.abs(r.top)<12&&Date.now()-gate>1500){gate=Date.now();open();}},{passive:true});
 let seaTouch=null;window.addEventListener('touchstart',event=>{if(active)return;const r=document.getElementById('voyage').getBoundingClientRect();seaTouch=Math.abs(r.top)<15?event.touches[0]?.clientY:null;},{passive:true});window.addEventListener('touchend',event=>{if(active||seaTouch===null||reduced.matches)return;const y=event.changedTouches[0]?.clientY;if(y-seaTouch>70&&Date.now()-gate>1500){gate=Date.now();open();}seaTouch=null;},{passive:true});
})();
