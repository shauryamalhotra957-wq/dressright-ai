# DressRight AI

DressRight AI is a working prototype for a men's styling website. A user uploads a photo, chooses a style lane and budget, receives a RAG-backed capsule recommendation, sees the full price breakdown, and creates a hosted-checkout-style order.

![DressRight AI styling studio](public/assets/hero-styling-studio.png)

## Why It Exists

Most styling tools either stop at generic inspiration or push users directly into shopping. DressRight AI models a more useful flow: understand the style goal, retrieve grounded outfit guidance, explain the recommendation, and keep checkout/payment boundaries realistic.

## What Is Implemented

- Photo upload flow with browser preview.
- Server-side binary upload validation.
- RAG-style retrieval over curated style guidance and clothing catalog data.
- Capsule recommendations with outfit formulas, fit plan, care plan, and item rationale.
- Pricing engine for subtotal, styling fee, alterations reserve, shipping, estimated tax, and final total.
- Checkout simulation designed around a PCI-friendly hosted payment boundary.
- Security headers, CSRF validation, same-origin write checks, rate limits, path traversal blocking, input sanitization, and upload allowlisting.
- Node test suite covering uploads, RAG, pricing, and API behavior.

## Tech Stack

- Node.js
- Express-style HTTP server
- Vanilla JavaScript frontend
- Local JSON knowledge base and catalog
- Deterministic recommendation pipeline
- Node test runner

## Quick Start

```powershell
npm install
npm start
```

Open:

```text
http://127.0.0.1:4173
```

## Test

```powershell
npm test
```

## Project Structure

```text
dressright-ai/
  public/
    index.html
    app.js
    styles.css
    assets/
  server/
    index.js
    lib/
      pricing.js
      rag.js
      recommendation.js
      security.js
      uploads.js
  data/
    catalog.json
    style-knowledge.json
  tests/
  docs/
```

## How The Recommendation Flow Works

1. The user chooses a style lane, budget, and optional preferences.
2. The app validates the uploaded image and form data.
3. The retrieval layer searches curated style guidance and catalog items.
4. The recommendation engine assembles a bounded capsule.
5. The pricing engine calculates transparent totals.
6. Checkout returns a simulated hosted-payment order response.

## Production Integration Points

- Replace the deterministic recommendation assembler in `server/lib/recommendation.js` with an LLM call that receives retrieved documents as bounded context.
- Add privacy-reviewed computer-vision measurements, storing only derived fit metadata unless the user explicitly opts in.
- Connect `/api/checkout` to Stripe Checkout, Adyen Drop-in, or another hosted payment provider.
- Add retailer APIs, inventory checks, returns, address validation, and tax calculation.
- Move session and order state from memory into a database with encryption at rest and audit logs.

## Security Notes

The app is intentionally designed around a hosted checkout boundary so it does not handle cardholder data directly. File uploads are allowlisted and validated server-side.

See:

- [Threat Model](docs/threat-model.md)
- [API Notes](docs/api.md)
- [Architecture](docs/architecture.md)
- [Security Policy](SECURITY.md)

## Research Grounding

- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP LLM Prompt Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- PCI Security Standards Council: https://www.pcisecuritystandards.org/

## License

This project is currently marked `UNLICENSED` in `package.json`. Add a license before accepting external contributions or reuse.

