(() => {
  'use strict';
  const root=document.getElementById('objects');
  const lightbox=document.getElementById('lightbox');
  const canvas=root?.querySelector('.objects-particle-layer');
  if(!root||!lightbox||!canvas)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 600px), (pointer: coarse)');
  let ctx=null;
  try{ctx=canvas.getContext('2d');}catch(_){/* Existing lightbox remains available. */}
  let frame=0,finish=null,selected=null,owned=false,busy=false;
  const palette=['#b8e9e6','#b8e9e6','#eee8d9','#eee8d9','#d6b67c'];
  function cleanup(){
    if(frame)cancelAnimationFrame(frame);frame=0;
    if(ctx)ctx.clearRect(0,0,canvas.width,canvas.height);
    canvas.dataset.active='false';
    selected?.classList.remove('objects-selected');
    busy=false;
  }
  function complete(){const callback=finish;finish=null;cleanup();callback?.();}
  function particles(trigger,closing,callback){
    if(busy)complete();
    selected=trigger;
    if(reduced.matches||!ctx){callback();return;}
    const bounds=root.getBoundingClientRect(),image=trigger.querySelector('img').getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,1.5);
    if(!image.width||!bounds.width||!bounds.height){callback();return;}
    canvas.width=Math.round(bounds.width*dpr);canvas.height=Math.round(bounds.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const cx=image.left-bounds.left+image.width/2,cy=image.top-bounds.top+image.height/2;
    const spread=Math.min(145,bounds.width*.25),count=mobile.matches?48:150;
    const points=Array.from({length:count},(_,i)=>{
      const angle=Math.random()*Math.PI*2,r=Math.sqrt(Math.random());
      return{tx:Math.cos(angle)*image.width*.38*r,ty:Math.sin(angle)*image.height*.4*r,bx:Math.cos(angle)*(spread*.45+Math.random()*spread),by:Math.sin(angle)*(spread*.45+Math.random()*spread),size:.8+Math.random()*1.8,color:palette[i%20===0?4:i%4],phase:Math.random()*Math.PI*2};
    });
    const mix=(a,b,t)=>a+(b-a)*t;
    const ease=t=>1-Math.pow(1-t,3);
    busy=true;finish=callback;trigger.classList.add('objects-selected');canvas.dataset.active='true';
    const duration=closing?660:560;let started;
    function tick(now){
      if(started===undefined)started=now;
      const t=Math.min(1,(now-started)/duration);
      ctx.clearRect(0,0,bounds.width,bounds.height);
      for(const p of points){
        let x,y;
        if(!closing){
          if(t<.36){const u=ease(t/.36);x=mix(p.tx,p.bx,u);y=mix(p.ty,p.by,u);}
          else{const u=ease((t-.36)/.64);x=mix(p.bx,p.tx*.12,u);y=mix(p.by,p.ty*.12,u);}
        }else{
          if(t<.4){const u=ease(t/.4);x=mix(p.tx*.12,p.bx,u);y=mix(p.ty*.12,p.by,u);}
          else{const u=ease((t-.4)/.6);x=mix(p.bx,p.tx,u);y=mix(p.by,p.ty,u)+Math.sin(Math.PI*u)*14;}
        }
        ctx.globalAlpha=Math.min(1,t*9)*Math.min(1,(1-t)*6)*.85;
        ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=mobile.matches?3:6;
        ctx.beginPath();ctx.arc(cx+x,cy+y,p.size*(.7+.3*Math.sin(t*7+p.phase)),0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;ctx.shadowBlur=0;
      if(closing)trigger.querySelector('img').style.opacity=String(Math.max(0,(t-.6)/.4));
      if(t<1)frame=requestAnimationFrame(tick);else complete();
    }
    frame=requestAnimationFrame(tick);
  }
  function show(trigger){
    if(lightbox.open)return;
    owned=true;selected=trigger;
    // Reuse the original function and original dialog, with their existing behavior.
    window.openImage(trigger.dataset.lightbox,trigger.dataset.title);
    if(trigger.dataset.model && window.Teapot3D) window.Teapot3D.open(root,lightbox);
  }
  root.addEventListener('click',event=>{
    const trigger=event.target.closest('.artifact button[data-lightbox]');
    if(!trigger||!root.contains(trigger)||typeof window.openImage!=='function')return;
    event.preventDefault();event.stopPropagation();
    if(busy||lightbox.open)return;
    particles(trigger,false,()=>show(trigger));
  },true);
  lightbox.addEventListener('close',()=>{
    if(!owned||lightbox.open)return;
    owned=false;const trigger=selected;
    if(!trigger)return;
    particles(trigger,true,()=>{trigger.querySelector('img').style.removeProperty('opacity');selected=null;});
  });
  reduced.addEventListener('change',()=>{if(reduced.matches&&busy)complete();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy)complete();});
  new IntersectionObserver(entries=>root.classList.toggle('objects-resting',!entries[0].isIntersecting)).observe(root);
})();
