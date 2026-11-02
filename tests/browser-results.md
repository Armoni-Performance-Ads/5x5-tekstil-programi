# Browser verification — 2 November 2026

Environment: Safari on macOS, native browser DOM/fetch/AbortController, actual wall-clock delays.
Original PR head: `3a22eef7c9d77b6ac9439e9d8225b66d9e9b62e3`.
Production change under test: 15-second early notice plus existing 90-second request deadline.

The unmodified PR's 16 offline tests passed before editing. The updated suite has
19 passing tests (the original 16 scenarios and three early-notice checks), using
Node.js v24.21.0. JavaScript and preview-server syntax checks passed.

| Browser case | Observed result |
| --- | --- |
| Empty required fields | Five field errors, focus on name, zero requests |
| Fast confirmation, 430 CSS px | Success at 0.6 s; one request, no early notice |
| Headers delayed 45 s, desktop | Early notice at 15.0 s, success at 45.1 s; one request |
| JSON body delayed 45 s, 360 CSS px | Early notice at 15.1 s, success at 45.0 s; one request |
| Headers stalled, 390 CSS px | Early notice at 15.1 s, unconfirmed result at 90.1 s; values retained, button restored |
| Body stalled after headers, desktop | Early notice at 15.0 s, unconfirmed result at 90.0 s |
| Malformed JSON | Unconfirmed delivery message; no success |
| Explicit success:false | Explicit rejection message; no success |
| HTTP 503 with success:true payload | Unconfirmed delivery message; no false success |
| Closed connection | Unconfirmed delivery message at 0.1 s; no success |

During the stalled request, pressing Enter in a field did not create another
request. The request count remained one. During the early notice the button stayed
disabled, aria-busy was removed and aria-live remained polite. Actual screen-reader
speech was not tested.

Visual checks covered the desktop notice, the 390 px pending notice and the 360 px
success panel. No horizontal overflow or uncaught application JavaScript error
was observed in the tested states. These are narrow Safari frames, not tests on
physical iPhone/Android devices.

All submitted data was synthetic. The preview-only adapter sent requests solely
to the local mock server; CSP independently blocked external networking/native
form submission. The blocked GTM resource is intentional and is not an application
error. The server discards payloads and does not forward or store them.

The actual FormSubmit service, CORS, anti-spam checks and email delivery were not
tested. These results do not establish the cause of the original incident.

HTML/CSS, November dates, app.js, measurement.js and existing assets match the
original PR blob hashes. The production endpoint and recipient are unchanged.
Production code changes are restricted to application.js; other changes are tests,
preview tooling and this report. main was read-only; no merge or deployment ran.
