// Local event hooks only. No analytics service, cookie, storage or personal data.
// Connect approved analytics IDs only after the consent setup is confirmed.
(()=>{
 const allowed=new Set(['page_view','cta_click','form_start','form_submit_attempt','form_submit_error','application_success']);
 const successes=new Set();
 window.fiveByFiveMeasure=(name,eventId)=>{
  if(!allowed.has(name))return;
  if(name==='application_success'){if(!eventId||successes.has(eventId))return;successes.add(eventId);}
  document.dispatchEvent(new CustomEvent('fivebyfive:measure',{detail:{event:name,...(eventId?{event_id:eventId}:{})}}));
 };
 window.fiveByFiveMeasure('page_view');
})();
