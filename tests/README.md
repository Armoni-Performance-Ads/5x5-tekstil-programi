# Application response checks and safe browser preview

Run offline regression tests with Node.js 18+:

```sh
node tests/application.test.cjs
```

The 19 tests use a fake DOM, network and clock. The original 16 scenarios remain,
with the delayed-response assertion updated for the new 15-second notice.
Three additional tests check the notice boundary for headers/body and cancellation
after fast completion. No external request API is exposed to these tests.

Start the browser preview with Python 3.9+ from the repository root:

```sh
python3 tests/preview.py
```

Open http://127.0.0.1:8765/__preview/ on the same computer. Choose a scenario,
click **Senaryoyu başlat / sıfırla**, then **Örnek bilgileri doldur**, then the
real form's **5x5 Programına Başvur** button. Times are actual elapsed seconds,
not an accelerated clock. The inspector updates at state changes.

The preview serves the original HTML/CSS with a test-only fetch adapter injected
before production scripts. Application code still constructs the original
FormSubmit endpoint. The adapter maps that request to a local HTTP response,
using the browser's native fetch, streamed body handling and AbortController.
CSP separately blocks external requests, native form submission and analytics.
The server discards request bodies and never forwards or persists them.
The three preview files are not loaded by the normal production page.

Available cases: fast confirmation, headers delayed 45 seconds, JSON body delayed
45 seconds, headers or body stalled beyond 90 seconds, malformed JSON, explicit
rejection, HTTP 503 with a success payload, and a closed connection.
Widths: desktop, 360, 390 and 430 CSS pixels. Narrow frames test responsive
layout; they do not emulate an iPhone keyboard or constitute physical-device QA.

Expected behavior: a pending request shows the uncertain-delivery message at
15 seconds, removes aria-busy so the existing polite live region can announce it,
and retains the duplicate-submission lock. A positive HTTP response with explicit
success still opens the success panel up to the 90-second deadline. Timeout does
not establish whether an email was delivered. There is no automatic resubmission.

This preview cannot diagnose the actual FormSubmit incident, provider CORS,
anti-spam challenges or inbox delivery. It tests controlled browser behavior.
Do not merge or deploy to the live site without the user's approval.
