(()=>{
 const form=document.getElementById('application');
 if(!form)return;
 const success=()=>{
  form.classList.add('is-success');
  form.innerHTML='<div class="application-success" tabindex="-1" role="status" aria-live="polite"><img class="success-logo" src="assets/5x5-tekstil-programi-logo.png" alt="5x5 Tekstil Programı" width="568" height="249" loading="eager" fetchpriority="high"><h2>Başvurunuz alındı.</h2><p>Markanızı ve mevcut reklam yapınızı inceleyeceğiz. Programa uygun bulunmanız halinde sizinle telefon veya WhatsApp üzerinden iletişime geçeceğiz.</p><p>Başvurunuzun alınması, programa kabul edildiğiniz anlamına gelmez.</p></div>';
  const panel=form.querySelector('.application-success');
  panel.focus({preventScroll:true});
  const alignCard=(behavior='smooth')=>{
   const offset=window.visualViewport?.offsetTop||0;
   window.scrollTo({top:Math.max(0,window.scrollY+form.getBoundingClientRect().top-offset-24),behavior});
  };
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logo=panel.querySelector('.success-logo');
  const settle=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>alignCard(reduced?'instant':'smooth')));
  if(document.readyState!=='complete')window.addEventListener('load',settle,{once:true});
  document.fonts?.ready.then(settle);
  if(logo.complete)settle();else{logo.addEventListener('load',settle,{once:true});logo.addEventListener('error',settle,{once:true});}
  // Re-align after a mobile keyboard finishes closing; never depend on focus scrolling.
  const viewport=window.visualViewport;
  const onResize=()=>alignCard('instant');
  viewport?.addEventListener('resize',onResize);
  setTimeout(()=>viewport?.removeEventListener('resize',onResize),1000);

 };
 form.noValidate=true;
 const fields=[...form.querySelectorAll('input[required],select[required]')];
 const status=document.getElementById('form-status');
 const button=form.querySelector('button[type="submit"]');
 const label=button.querySelector('.submit-label');
 let sending=false;let submitted=false;let started=false;
 const requestId=crypto.randomUUID();
 form.addEventListener('input',()=>{if(!started){started=true;window.fiveByFiveMeasure?.('form_start');}},{once:true});
 function validate(field){
  let message='';const value=field.value.trim();
  if(!value)message=field.tagName==='SELECT'?'Lütfen bir aralık seçin.':'Lütfen bu alanı doldurun.';
  else if(field.name==='phone'&&(!/^\+?[\d\s().-]+$/.test(value)||value.replace(/\D/g,'').length<10||value.replace(/\D/g,'').length>15))message='Lütfen geçerli bir telefon numarası girin.';
  else if(!field.validity.valid)message='Lütfen bu alanı kontrol edin.';
  field.setAttribute('aria-invalid',String(!!message));
  document.getElementById('error-'+field.name).textContent=message;
  return !message;
 }
 fields.forEach(field=>{
  field.addEventListener('blur',()=>validate(field));
  field.addEventListener('input',()=>{if(field.getAttribute('aria-invalid')==='true')validate(field);});
  field.addEventListener('change',()=>validate(field));
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||submitted)return;
  window.fiveByFiveMeasure?.('form_submit_attempt');
  if(form.elements.namedItem('_honey').value)return;
  status.textContent='';
  const invalid=fields.filter(field=>!validate(field));
  if(invalid.length){invalid[0].focus();return;}
  const payload=Object.fromEntries(new FormData(form));
  fields.forEach(field=>payload[field.name]=field.value.trim());
  payload.application_id=requestId;
  const source=new URLSearchParams(location.search);
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){
   const value=source.get(key);if(value)payload[key]=value.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,150);
  }
  const endpoint=new URL(form.action);endpoint.pathname='/ajax'+endpoint.pathname;
  sending=true;button.disabled=true;form.setAttribute('aria-busy','true');label.textContent='Başvurunuz gönderiliyor...';
  // Give early feedback without discarding a late confirmation or sending again.
  const noticeTimer=setTimeout(()=>{
   form.removeAttribute('aria-busy');
   label.textContent='Teslim onayı bekleniyor';
   status.textContent='Henüz teslim onayı alamadık. Başvurunuz ulaşmış olabilir. Bu sayfada beklemeniz gerekmiyor; tekrar göndermeden önce bizimle iletişime geçin.';
   status.classList.add('submission-error');
  },15000);
  // Aborting the request does not undo an email already sent.
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
  let rejected=false;
  try{
   const response=await fetch(endpoint.href,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
   const result=await response.json();
   rejected=result?.success===false||result?.success==='false';
   if(!response.ok||!(result?.success===true||result?.success==='true'))throw new Error('Submission not confirmed');
   submitted=true;success();
   window.fiveByFiveMeasure?.('application_success',requestId);
  }catch(error){
   window.fiveByFiveMeasure?.('form_submit_error');
   status.textContent=rejected
    ?'Başvurunuz gönderilemedi. Lütfen bilgilerinizi kontrol ederek tekrar deneyin.'
    :'Başvurunuzun sonucu doğrulanamadı. Başvurunuz ulaşmış olabilir; tekrar göndermeden önce bizimle iletişime geçin.';
   status.classList.add('submission-error');
  }finally{
   clearTimeout(noticeTimer);clearTimeout(timer);sending=false;form.removeAttribute('aria-busy');button.disabled=false;label.textContent='5x5 Programına Başvur';
  }
 });
})();
