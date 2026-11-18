(() => {
  'use strict';
  let runtimePromise,bufferPromise,current;
  const loadScript=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('本地模型资源未能加载'));};document.getElementById('objects').append(s);});
  function runtime(){return runtimePromise ||= loadScript('assets/teapot-runtime.js').then(()=>window.TeapotRuntime).catch(e=>{runtimePromise=null;throw e;});}
  function modelBuffer(){
    return bufferPromise ||= (location.protocol==='file:' ? loadScript('assets/teapot-model.js').then(()=>{
      const text=atob(window.__teapotModelBase64);delete window.__teapotModelBase64;
      const bytes=new Uint8Array(text.length);for(let i=0;i<text.length;i++)bytes[i]=text.charCodeAt(i);return bytes.buffer;
    }) : fetch('assets/teapot.glb').then(r=>{if(!r.ok)throw new Error('模型文件未能读取');return r.arrayBuffer();})).catch(e=>{bufferPromise=null;throw e;});
  }
  function releaseScene(scene){const textures=new Set();scene?.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])if(material){for(const value of Object.values(material))if(value?.isTexture)textures.add(value);material.dispose();}});textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});}
  async function open(root,dialog){
    current?.close();
    const host=root.querySelector('.objects-3d-slot');
    const image=dialog.querySelector('#zoom-image');
    const oldStyle=image.getAttribute('style');
    const restoreImage=()=>{if(oldStyle===null)image.removeAttribute('style');else image.setAttribute('style',oldStyle);};
    const shadow=host.shadowRoot||host.attachShadow({mode:'open'});
    host.hidden=false;host.setAttribute('aria-hidden','false');host.dataset.state='loading';delete host.dataset.camera;host.style.cssText='display:block;width:100%;min-width:0';
    dialog.querySelector('.zoom-scroll').append(host);image.style.display='none';
    shadow.innerHTML=`<style>
      :host{font-family:system-ui,"Microsoft YaHei",sans-serif;color:#e6f1eb}*{box-sizing:border-box}.viewer{background:radial-gradient(ellipse at 50% 35%,#254a53,#0b2331 70%);position:relative}.stage{position:relative;height:clamp(280px,64dvh,650px);overflow:hidden;touch-action:none}.stage canvas{display:block;width:100%;height:100%;touch-action:none;outline-offset:-4px}.status{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:30px;pointer-events:none;color:#d4e6de;font-size:14px}.status[hidden]{display:none}.toolbar{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;padding:13px;border-top:1px solid #b6d9d524}button{font:inherit;font-size:13px;background:#153743;border:1px solid #7aa8ac66;color:#e5f1e9;padding:8px 13px;cursor:pointer;min-height:38px}button:focus-visible,canvas:focus-visible{outline:2px solid #95e2d8}button:disabled{opacity:.4;cursor:wait}.hint{text-align:center;color:#acccc8;font-size:12px;line-height:1.7;margin:0;padding:0 16px 16px}.tag{position:absolute;top:15px;left:18px;font-size:11px;letter-spacing:.12em;color:#a7ccc7;pointer-events:none}.stage[hidden]{display:none}@media(max-width:600px){.stage{height:58dvh;min-height:280px}.toolbar{gap:6px;padding:11px}button{padding:8px 11px}}
    </style><div class="viewer"><div class="stage"><span class="tag">粉彩人物茶壶 / 3D</span><div class="status" role="status" aria-live="polite">正在载入茶壶模型与材质…</div></div><div class="toolbar"><button type="button" data-action="in" disabled aria-label="放大模型">＋ 放大</button><button type="button" data-action="out" disabled aria-label="缩小模型">－ 缩小</button><button type="button" data-action="reset" disabled>复位</button><button type="button" data-action="photo">查看原图</button></div><p class="hint">拖动旋转 · 滚轮 / 双指缩放 · 方向键调整视角<br>原始模型试览，表面细节以所提供模型为准。</p></div>`;
    const session={closed:false,dispose:null,close(){if(this.closed)return;this.closed=true;this.dispose?.();dialog.removeEventListener('close',onClose);host.hidden=true;host.setAttribute('aria-hidden','true');host.removeAttribute('style');root.append(host);restoreImage();if(current===this)current=null;}};
    current=session;
    const onClose=()=>{if(!dialog.open)session.close();};dialog.addEventListener('close',onClose);
    shadow.querySelector('[data-action=photo]').onclick=()=>session.close();
    const status=shadow.querySelector('.status'),stage=shadow.querySelector('.stage');
    let renderer,controls,environment,observer,scene;
    const dispose=()=>{observer?.disconnect();controls?.dispose();releaseScene(scene);environment?.dispose();renderer?.dispose();renderer?.forceContextLoss();};
    session.dispose=dispose;
    try{
      const [lib,buffer]=await Promise.all([runtime(),modelBuffer()]);if(session.closed)return;
      const T=lib.THREE;
      renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
      renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','茶壶三维模型：拖动或方向键旋转，滚轮、双指或加减键缩放');stage.prepend(renderer.domElement);
      scene=new T.Scene();
      const camera=new T.PerspectiveCamera(38,1,.01,100);
      controls=new lib.OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.minDistance=1.6;controls.maxDistance=7;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI-.08;
      const pmrem=new T.PMREMGenerator(renderer),room=new lib.RoomEnvironment();environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
      scene.add(new T.HemisphereLight(0xdcefff,0x3b3c32,2));const light=new T.DirectionalLight(0xfff2df,3);light.position.set(3,4,5);scene.add(light);
      const gltf=await new lib.GLTFLoader().parseAsync(buffer.slice(0),'');
      if(session.closed){releaseScene(gltf.scene);return;}
      const model=gltf.scene;const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
      const scale=1.8/Math.max(size.x,size.y,size.z);model.scale.multiplyScalar(scale);model.position.sub(center.multiplyScalar(scale));scene.add(model);
      const render=()=>{if(session.closed)return;renderer.render(scene,camera);host.dataset.camera=camera.position.toArray().map(v=>v.toFixed(3)).join(',');};
      const reset=()=>{camera.position.set(-2.35,1.05,3.3).multiplyScalar(Math.max(1,.86/camera.aspect));controls.maxDistance=Math.max(7,camera.position.length()*1.6);controls.target.set(0,0,0);controls.update();render();};reset();
      let firstResize=true;
      const resize=()=>{const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;const oldAspect=camera.aspect;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();if(firstResize||(oldAspect<.85)!==(camera.aspect<.85)){firstResize=false;reset();}render();};
      controls.addEventListener('change',render);observer=new ResizeObserver(resize);observer.observe(stage);resize();
      function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.setLength(T.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();render();}
      shadow.querySelector('[data-action=in]').onclick=()=>zoom(.82);shadow.querySelector('[data-action=out]').onclick=()=>zoom(1.22);shadow.querySelector('[data-action=reset]').onclick=reset;
      renderer.domElement.addEventListener('keydown',event=>{if(['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();if(['+','=','-'].includes(event.key)){zoom(event.key==='-'?1.15:.87);return;}const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));if(event.key==='ArrowLeft')s.theta-=.14;if(event.key==='ArrowRight')s.theta+=.14;if(event.key==='ArrowUp')s.phi-=.12;if(event.key==='ArrowDown')s.phi+=.12;s.phi=T.MathUtils.clamp(s.phi,.08,Math.PI-.08);camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();render();}});
      renderer.domElement.addEventListener('webglcontextlost',event=>{if(session.closed)return;event.preventDefault();status.hidden=false;status.textContent='3D 显示暂时中断，可关闭后重试或查看原图。';});
      shadow.querySelectorAll('button[disabled]').forEach(button=>button.disabled=false);status.hidden=true;host.dataset.state='ready';host.dataset.vertices=String(renderer.info.render.triangles);renderer.domElement.focus({preventScroll:true});
    }catch(error){if(session.closed)return;dispose();session.dispose=null;status.hidden=false;status.textContent='暂时无法显示 3D，请点“查看原图”，或关闭后重试。';host.dataset.state='error';console.warn('Teapot preview:',error.message);}
  }
  window.Teapot3D={open};
})();
