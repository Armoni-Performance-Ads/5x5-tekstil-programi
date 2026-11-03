// Test-only adapter. Native browser fetch, body streaming, abort and wall clock.
(() => {
  const nativeFetch = window.fetch.bind(window);
  const params = new URLSearchParams(location.search);
  const scenario = params.get('case') || 'delayed';
  let requests = 0, start = 0, noticeAt = null, successAt = null, finalAt = null;
  const errors = [], events = [], violations = [];
  const expected = 'https://formsubmit.co/ajax/onur@armoni.agency';
  window.fetch = (url, options) => {
    if (String(url) !== expected) return Promise.reject(new Error('Preview blocks unexpected fetch'));
    requests++; start ||= performance.now();
    return nativeFetch('/__mock?case=' + encodeURIComponent(scenario), options);
  };
  addEventListener('error', event => errors.push(event.message));
  addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
  addEventListener('securitypolicyviolation', event => violations.push(event.effectiveDirective));
  addEventListener('DOMContentLoaded', () => {
    const measure = window.fiveByFiveMeasure;
    window.fiveByFiveMeasure = (name, id) => { events.push(name); measure?.(name, id); };
    addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== parent) return;
      if (event.data === 'fill-demo') {
        for (const [id, value] of Object.entries({'apply-name':'Önizleme Testi', 'apply-brand':'DEMO — Gerçek Başvuru Değil', 'apply-phone':'05000000000', 'apply-spend':'50.000–100.000 TL', 'apply-revenue':'500.000 TL’den az'})) {
          const field = document.getElementById(id);
          if (!field) continue;
          field.value = value;
          field.dispatchEvent(new Event('input', {bubbles:true}));
          field.dispatchEvent(new Event('change', {bubbles:true}));
        }
        document.getElementById('application')?.scrollIntoView({block:'start'});
      }
    });
    let last = '';
    setInterval(() => {
      const form = document.getElementById('application');
      const status = document.getElementById('form-status');
      const success = !!form?.classList.contains('is-success');
      const elapsed = start ? (performance.now() - start) / 1000 : 0;
      const message = status?.textContent || '';
      if (noticeAt === null && message.startsWith('Henüz')) noticeAt = elapsed;
      if (successAt === null && success) successAt = elapsed;
      if (finalAt === null && (message.includes('sonucu doğrulanamadı') || message.includes('gönderilemedi'))) finalAt = elapsed;
      const state = {
        scenario, elapsed: Math.round(elapsed), requests,
        noticeAt: noticeAt?.toFixed(1) ?? null, successAt: successAt?.toFixed(1) ?? null, finalAt: finalAt?.toFixed(1) ?? null,
        success, message, button: form?.querySelector('.submit-label')?.textContent || '',
        disabled: form?.querySelector('button[type=submit]')?.disabled ?? null,
        busy: form?.getAttribute('aria-busy') || 'false',
        live: status?.getAttribute('aria-live') || form?.querySelector('.application-success')?.getAttribute('aria-live'),
        focused: document.activeElement?.className || document.activeElement?.id || document.activeElement?.tagName,
        fieldsRetained: document.getElementById('apply-name')?.value === 'Önizleme Testi',
        width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        fieldErrors: [...document.querySelectorAll('.field-error')].map(e=>e.textContent).filter(Boolean),
        appErrors: errors, events, blockedExternalResources: violations.length,
      };
      // Update the inspector on state changes, not every second. This also
      // prevents repeated live-region announcements while the request waits.
      const data = JSON.stringify({...state, elapsed:0});
      if (data !== last) parent.postMessage({previewState:state}, location.origin);
      last = data;
    }, 100);
  });
})();
