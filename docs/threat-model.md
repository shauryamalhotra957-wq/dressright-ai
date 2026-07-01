# Threat Model

## Assets

- User photos and derived fit metadata.
- Style preferences and measurements.
- Checkout/order details.
- Catalog pricing and retailer integration keys.
- AI prompts, retrieved context, and recommendation outputs.

## Primary Risks

- Malicious file upload disguised as an image.
- Prompt injection through free-text style-icon fields.
- Cross-site request forgery against order or upload endpoints.
- Path traversal through static file serving.
- Cardholder data exposure.
- Model leakage or unsafe recommendations caused by untrusted retrieved content.

## Current Mitigations

- Image allowlist, magic-byte validation, size limit, and active-content scanning.
- Input sanitization before retrieval.
- Curated local RAG corpus only.
- CSRF token and same-origin checks on mutating endpoints.
- Hosted-checkout architecture.
- Static path resolution constrained to `public`.

## Residual Risk

This is a prototype. Real deployment needs TLS, secure cookies, malware scanning, image transcoding, observability, secrets management, database access controls, human review for purchases, and third-party vendor security review.
