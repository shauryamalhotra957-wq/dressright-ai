# DressRight AI

DressRight AI is a working prototype for a men's styling website: upload a photo, choose a style lane and budget, get a RAG-backed capsule recommendation, see the total cost, then create a hosted-checkout-style order.

## Run

```powershell
npm start
```

Open `http://127.0.0.1:4173`.

## Test

```powershell
npm test
```

## What Is Implemented

- Photo upload flow with client preview and server-side binary validation.
- RAG-style retrieval over curated style guidance and a clothing catalog.
- Capsule recommendation with outfit formulas, fit plan, care plan, and item rationale.
- Pricing engine with clothes subtotal, styling fee, alterations reserve, shipping, estimated tax, and total.
- Checkout simulation that models a PCI-friendly hosted payment boundary.
- Security headers, CSRF validation, same-origin write checks, rate limits, path traversal blocking, input sanitization, and upload allowlisting.

## Production Integration Points

- Replace the deterministic recommendation assembler in `server/lib/recommendation.js` with an LLM call that receives retrieved documents as bounded context.
- Add computer-vision measurements through a privacy-reviewed model, then store only derived fit metadata unless the user explicitly opts in.
- Connect `/api/checkout` to Stripe Checkout, Adyen Drop-in, or another hosted payment provider.
- Add retailer APIs, inventory checks, return labels, and address validation before purchase.
- Move session state and order state from memory into a database with encryption at rest and operational audit logs.

## Research Grounding

The security model follows OWASP guidance for file uploads, prompt-injection boundaries, and common web risks. Payment handling is deliberately designed around hosted checkout so the application avoids handling cardholder data directly.

- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP LLM Prompt Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- PCI Security Standards Council: https://www.pcisecuritystandards.org/
