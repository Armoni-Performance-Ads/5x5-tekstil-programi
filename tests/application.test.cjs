// Run with Node.js 18+: node tests/application.test.cjs
// The application runs in an isolated VM with a fake DOM, fetch and clock.
// No real network API is exposed; even the timeout cases finish immediately.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '..', 'application.js');
const idleLabel = '5x5 Programına Başvur';
const endpoint = 'https://formsubmit.co/ajax/onur@armoni.agency';

function element(extra = {}) {
  const attrs = new Map();
  const classes = new Set();
  const handlers = {};
  return Object.assign({
    textContent: '', value: '', disabled: false,
    classList: { add: name => classes.add(name), contains: name => classes.has(name) },
    setAttribute: (name, value) => attrs.set(name, value),
    getAttribute: name => attrs.get(name), removeAttribute: name => attrs.delete(name),
    addEventListener: (name, handler) => { handlers[name] = handler; },
    handlers, focus() { this.focused = true; },
  }, extra);
}

function createHarness(options = {}, source = fs.readFileSync(sourcePath, 'utf8')) {
  let now = 0, nextTimer = 0;
  const timers = new Map();
  const setTimeout = (fn, ms) => { const id = ++nextTimer; timers.set(id, { at: now + ms, fn }); return id; };
  const clearTimeout = id => timers.delete(id);
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  const advance = async ms => {
    const end = now + ms;
    await flush();
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn(); await flush();
    }
    now = end; await flush();
  };
  const fields = [
    ['name', ' Test Applicant '], ['brand', ' Test Brand '], ['phone', '05000000000'],
    ['spend', '50.000–100.000 TL'], ['revenue', '500.000 TL’den az'],
  ].map(([name, value]) => element({ name, value, tagName: ['spend', 'revenue'].includes(name) ? 'SELECT' : 'INPUT', validity: { valid: true } }));
  const honey = element();
  const label = element({ textContent: idleLabel });
  const button = element({ querySelector: () => label });
  const status = element();
  const panel = element({ querySelector: () => ({ complete: true }) });
  const form = element({
    action: 'https://formsubmit.co/onur@armoni.agency', innerHTML: '',
    elements: { namedItem: () => honey },
    querySelectorAll: () => fields,
    querySelector: selector => selector === '.application-success' ? panel : button,
    getBoundingClientRect: () => ({ top: 100 }),
  });
  const errors = Object.fromEntries(fields.map(field => ['error-' + field.name, element()]));
  const events = [], requests = [];
  const delay = (ms, signal, value, error) => new Promise((resolve, reject) => {
    const abort = () => { const failure = new Error('Aborted'); failure.name = 'AbortError'; reject(failure); };
    if (signal.aborted) { abort(); return; }
    const id = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      if (error) reject(error); else resolve(value);
    }, ms);
    const onAbort = () => { clearTimeout(id); abort(); };
    signal.addEventListener('abort', onAbort, { once: true });
  });
  const sandbox = {
    document: { readyState: 'complete', getElementById: id => id === 'application' ? form : id === 'form-status' ? status : errors[id] },
    window: { fiveByFiveMeasure: (name, id) => events.push({ name, id }), matchMedia: () => ({ matches: true }), scrollTo() {}, scrollY: 0 },
    location: { search: '?utm_source=test&utm_campaign=november' },
    crypto: { randomUUID: () => 'offline-test-id' },
    URL, URLSearchParams, AbortController, setTimeout, clearTimeout,
    requestAnimationFrame() {},
    FormData: class { constructor() { return [['_subject', '5x5 Tekstil Programı — Kasım 2026 başvurusu'], ['_honey', honey.value], ...fields.map(field => [field.name, field.value])]; } },
    fetch: (url, init) => {
      requests.push({ url, init });
      return delay(options.headersDelay || 0, init.signal, {
        ok: options.ok ?? true,
        json: () => delay(options.bodyDelay || 0, init.signal,
          Object.hasOwn(options, 'result') ? options.result : { success: true }, options.jsonError),
      }, options.networkError);
    },
  };
  vm.runInNewContext(source, sandbox, { filename: 'application.js' });
  const submit = () => form.handlers.submit({ preventDefault() {} });
  return { form, button, label, status, fields, honey, events, requests, timers, submit, advance };
}

function assertIdle(h) {
  assert.equal(h.button.disabled, false);
  assert.equal(h.form.getAttribute('aria-busy'), undefined);
  assert.equal(h.label.textContent, idleLabel);
}
function assertSuccess(h) {
  assert.equal(h.form.classList.contains('is-success'), true);
  assert.match(h.form.innerHTML, /Başvurunuz alındı/);
  assert.equal(h.events.filter(event => event.name === 'application_success').length, 1);
  assert.equal(h.events.some(event => event.name === 'form_submit_error'), false);
  assertIdle(h);
}
function assertUnconfirmed(h) {
  assert.equal(h.form.classList.contains('is-success'), false);
  assert.match(h.status.textContent, /sonucu doğrulanamadı/);
  assert.match(h.status.textContent, /ulaşmış olabilir/);
  assert.doesNotMatch(h.status.textContent, /gönderilemedi/);
  assert.equal(h.events.filter(event => event.name === 'form_submit_error').length, 1);
  assertIdle(h);
}

async function runTests() {
  const results = [];
  async function check(name, fn) { await fn(); results.push(name); }

  for (const value of [true, 'true']) await check('Accept confirmed success: ' + JSON.stringify(value), async () => {
    const h = createHarness({ result: { success: value } });
    const done = h.submit(); await h.advance(0); await done; assertSuccess(h);
    assert.equal(h.requests.length, 1); assert.equal(h.requests[0].url, endpoint);
    assert.equal(h.requests[0].init.method, 'POST');
    assert.equal(h.requests[0].init.headers.Accept, 'application/json');
    assert.equal(h.requests[0].init.headers['Content-Type'], 'application/json');
    const payload = JSON.parse(h.requests[0].init.body);
    assert.equal(payload.name, 'Test Applicant'); assert.equal(payload.application_id, 'offline-test-id');
    assert.equal(payload.utm_source, 'test');
    await h.submit(); assert.equal(h.requests.length, 1);
    await h.advance(100000); assert.equal(h.requests[0].init.signal.aborted, false);
  });

  for (const delays of [{ headersDelay: 45000 }, { bodyDelay: 45000 }]) {
    await check('Accept 45-second delay: ' + Object.keys(delays)[0], async () => {
      const h = createHarness(delays); const done = h.submit();
      await h.advance(30001);
      assert.equal(h.button.disabled, true); assert.equal(h.form.getAttribute('aria-busy'), 'true');
      assert.equal(h.requests[0].init.signal.aborted, false);
      await h.submit(); assert.equal(h.requests.length, 1);
      await h.advance(14999); await done; assertSuccess(h);
    });
  }

  for (const delays of [{ headersDelay: 120000 }, { bodyDelay: 120000 }]) {
    await check('Release UI after timeout: ' + Object.keys(delays)[0], async () => {
      const h = createHarness(delays); const done = h.submit();
      await h.advance(89999); assert.equal(h.button.disabled, true);
      await h.advance(1); await done; assertUnconfirmed(h);
      assert.equal(h.requests[0].init.signal.aborted, true);
      await h.advance(120000); assert.equal(h.form.classList.contains('is-success'), false);
      assert.equal(h.requests.length, 1); // Never automatically resubmit.
      assert.equal(h.fields[0].value, ' Test Applicant ');
      assert.equal(h.timers.size, 0);
    });
  }

  for (const value of [false, 'false']) await check('Preserve explicit rejection: ' + JSON.stringify(value), async () => {
    const h = createHarness({ result: { success: value } });
    const done = h.submit(); await h.advance(0); await done;
    assert.match(h.status.textContent, /gönderilemedi/);
    assert.equal(h.form.classList.contains('is-success'), false); assertIdle(h);
  });

  for (const [name, options] of [
    ['network or CORS failure', { networkError: new TypeError('Failed to fetch') }],
    ['HTML or malformed JSON', { jsonError: new SyntaxError('Unexpected token <') }],
    ['empty response body', { jsonError: new SyntaxError('Unexpected end of JSON input') }],
    ['null JSON', { result: null }],
    ['missing confirmation', { result: {} }],
    ['truthy but invalid confirmation', { result: { success: 'false-like' } }],
    ['non-2xx response with success payload', { ok: false, result: { success: true } }],
  ]) await check('Keep delivery unconfirmed: ' + name, async () => {
    const h = createHarness(options); const done = h.submit();
    await h.advance(0); await done; assertUnconfirmed(h);
    await h.advance(100000); assert.equal(h.requests[0].init.signal.aborted, false);
    assert.equal(h.timers.size, 0); assert.equal(h.requests.length, 1);
  });

  await check('Required fields and honeypot prevent requests', async () => {
    const h = createHarness(); h.fields[0].value = ''; await h.submit();
    assert.equal(h.requests.length, 0); assert.equal(h.fields[0].focused, true);
    h.fields[0].value = 'Test'; h.honey.value = 'bot'; await h.submit();
    assert.equal(h.requests.length, 0); assertIdle(h);
  });
  return results;
}

module.exports = { runTests, createHarness };
if (require.main === module) runTests().then(results => {
  for (const result of results) console.log('PASS ' + result);
  console.log(results.length + ' offline tests passed; no external requests.');
}).catch(error => { console.error(error); process.exitCode = 1; });
