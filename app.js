// One player is created only after an explicit video click.
const videoModal=document.getElementById('video-modal');
const modalPlayer=videoModal.querySelector('.modal-player');
let videoTrigger=null;
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-video]');
 if(!trigger)return;
 videoTrigger=trigger;
 const id=trigger.dataset.video;
 document.getElementById('video-modal-title').textContent=trigger.dataset.title;
 const source=videoModal.querySelector('.youtube-source');
 source.href='https://www.youtube.com/watch?v='+id;
 const iframe=document.createElement('iframe');
 iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&playsinline=1';
 iframe.title=trigger.dataset.title;
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
 iframe.allowFullscreen=true;
 modalPlayer.replaceChildren(iframe);
 videoModal.showModal();document.body.classList.add('video-open');
});
videoModal.querySelector('.modal-close').addEventListener('click',()=>videoModal.close());
// Keep keyboard focus inside the modal at its first and last controls.
videoModal.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const first=videoModal.querySelector('.modal-close');
 const last=videoModal.querySelector('.youtube-source');
 if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
});
videoModal.addEventListener('click',event=>{if(event.target===videoModal){const r=videoModal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)videoModal.close();}});
videoModal.addEventListener('close',()=>{modalPlayer.replaceChildren();document.body.classList.remove('video-open');videoTrigger?.focus({preventScroll:true});});
const caseTabs=[...document.querySelectorAll('[data-case-video]')];
function selectCase(tab){
 caseTabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
 const player=document.getElementById('xyoung-video');
 player.dataset.video=tab.dataset.caseVideo;
 player.dataset.title='X-YOUNG — '+tab.dataset.caseTitle;
 player.setAttribute('aria-label',player.dataset.title+' videosunu oynat');
 player.querySelector('img').src='assets/video-thumbnails/'+tab.dataset.caseVideo+'.jpg';
 document.getElementById('xyoung-title').textContent=tab.dataset.caseTitle;
 document.getElementById('xyoung-panel').setAttribute('aria-labelledby',tab.id);
}
caseTabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>selectCase(tab));
 tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?caseTabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+caseTabs.length)%caseTabs.length;selectCase(caseTabs[next]);caseTabs[next].focus();}});
});
document.querySelector('.stories-toggle').addEventListener('click',event=>{
 const button=event.currentTarget;const expanded=button.getAttribute('aria-expanded')==='true';
 document.getElementById('more-stories').hidden=expanded;
 button.setAttribute('aria-expanded',String(!expanded));
 button.textContent=expanded?'Diğer başarı hikâyelerini göster':'Hikâyeleri gizle';
});

const conditionButtons=[...document.querySelectorAll('.eligibility-toggle')];
const conditionAnimations=new WeakMap();
function setCondition(button,open){
 const panel=document.getElementById(button.getAttribute('aria-controls'));
 const previous=conditionAnimations.get(panel);
 const start=panel.hidden?0:panel.getBoundingClientRect().height;
 if(previous)previous.cancel();
 button.setAttribute('aria-expanded',String(open));
 button.querySelector('.condition-icon').textContent=open?'−':'+';
 panel.hidden=false;
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){panel.hidden=!open;return;}
 const end=open?panel.scrollHeight:0;
 const animation=panel.animate([{height:start+'px',opacity:open?0:1},{height:end+'px',opacity:open?1:0}],{duration:170,easing:'ease-out'});
 conditionAnimations.set(panel,animation);
 animation.onfinish=()=>{panel.hidden=!open;conditionAnimations.delete(panel);};
}
conditionButtons.forEach(button=>button.addEventListener('click',()=>{
 const open=button.getAttribute('aria-expanded')!=='true';
 conditionButtons.forEach(other=>{if(other!==button&&other.getAttribute('aria-expanded')==='true')setCondition(other,false);});
 setCondition(button,open);
}));

const faqButtons=[...document.querySelectorAll('.faq-toggle')];
const faqAnimations=new WeakMap();
function setFaq(button,open){
 const panel=document.getElementById(button.getAttribute('aria-controls'));
 const start=panel.hidden?0:panel.getBoundingClientRect().height;
 faqAnimations.get(panel)?.cancel();
 button.setAttribute('aria-expanded',String(open));
 button.querySelector('.faq-icon').textContent=open?'−':'+';
 panel.hidden=false;
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){panel.hidden=!open;return;}
 const animation=panel.animate([{height:start+'px',opacity:open?0:1},{height:(open?panel.scrollHeight:0)+'px',opacity:open?1:0}],{duration:170,easing:'ease-out'});
 faqAnimations.set(panel,animation);
 animation.onfinish=()=>{panel.hidden=!open;faqAnimations.delete(panel);};
}
faqButtons.forEach(button=>button.addEventListener('click',()=>{
 const open=button.getAttribute('aria-expanded')!=='true';
 faqButtons.forEach(other=>{if(other!==button&&other.getAttribute('aria-expanded')==='true')setFaq(other,false);});
 setFaq(button,open);
}));


// One scroll target for all application links; preserve campaign query parameters.
document.querySelectorAll('a[href="#basvuru"]').forEach(link=>link.addEventListener('click',event=>{
 event.preventDefault();
 const heading=document.querySelector('#basvuru .eyebrow');
 const url=new URL(location.href);url.hash='basvuru';history.replaceState(null,'',url);
 heading.tabIndex=-1;heading.focus({preventScroll:true});
 window.scrollTo({top:Math.max(0,window.scrollY+heading.getBoundingClientRect().top-(window.visualViewport?.offsetTop||0)-24),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 window.fiveByFiveMeasure?.('cta_click');
}));
