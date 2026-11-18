(() => {
 'use strict';
 const eta={
 before:['10:47 · 当时的系统推断','14:18','进港流量可能带来等待','当时只是预计可能要等，还没有确认，所以要把这点说明白。'],
 news:['11:08 · 新的机场运行消息','等待未发生','原先担心的等待，被新消息排除','原来担心的等待没有发生。之前的说法仍在，方便你对照。'],
 after:['11:08 · 修正后的预计','14:16','预计时间提前了两分钟','从 14:18 改为 14:16，旁边留下这次改动的原因。']};
 document.querySelectorAll('#hangji [data-eta-story]').forEach(button=>button.addEventListener('click',()=>{
 const value=eta[button.dataset.etaStory];['label','time','summary','explain'].forEach((key,i)=>document.getElementById('as-eta-'+key).textContent=value[i]);
 document.querySelectorAll('#hangji [data-eta-story]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
 document.querySelectorAll('#ielts [data-probe-answer]').forEach(button=>button.addEventListener('click',()=>{
 const answer=button.dataset.probeAnswer;
 const value=answer==='B'?['这一步选对了','这个词，这次选对了。','congestion 在这里指交通拥堵。这次选对了，可以接着看句意和找证据的过程；一道小题，还不能说明已经完全掌握。','接着看看，句子有没有读懂。']:answer==='unknown'?['信息还不够','不确定，也是有用的回答。','没关系，先留着这个疑问。可以换一种问法，再看看卡在哪里。','先弄清楚，再决定练什么。']:['词义值得再核对','这个词，我们再看一看。','congestion 在这里指交通拥堵。这次可能是词义让你犹豫了，也可能还有别的原因；先换个句子确认一下。','换个句子再看看，这个词是否还会让你犹豫。'];
 ['state','result','explain','next'].forEach((key,i)=>document.getElementById('as-probe-'+key).textContent=value[i]);
 document.querySelectorAll('#ielts [data-probe-answer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
})();
