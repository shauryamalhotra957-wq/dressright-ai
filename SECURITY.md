# Security Notes

No website can honestly promise that it "cannot be hacked." This prototype instead implements concrete controls that reduce common risk and make the trust boundaries visible.

## Implemented Controls

- Restrictive browser headers: CSP, frame denial, nosniff, referrer policy, permissions policy, and same-origin resource policy.
- Server-side upload validation: PNG/JPEG/WebP allowlist, magic-byte checks, extension consistency checks, 5 MB maximum size, and active-content marker rejection.
- No uploaded image persistence in the demo server; only a session-scoped hash and metadata are retained.
- Session-scoped CSRF token on every mutating endpoint.
- Same-origin enforcement for write requests.
- Per-route rate limiting with a stricter upload bucket.
- Static file path normalization to block traversal outside `public`.
- User profile sanitization before retrieval and recommendation generation.
- Hosted-checkout design so raw payment card data does not touch this application.

## Production Hardening Checklist

- Terminate TLS at the edge and set `Secure` on cookies.
- Store session/order state in a hardened data store with encryption at rest.
- Add malware scanning and image transcoding in an isolated worker.
- Use object storage with short-lived signed URLs for any user-approved retained images.
- Add address validation, fraud detection, order audit logs, and human approval gates.
- Run SAST, dependency scanning, secret scanning, and DAST in CI.
- Add SOC 2-style access reviews before handling real customer photos.
- Keep LLM prompts and retrieved context separated; never let user-supplied text rewrite system or developer instructions.
