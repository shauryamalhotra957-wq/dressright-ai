# Checkout contract

The demo checkout endpoint is intentionally server-priced.

1. A recommendation is generated from the validated profile and curated catalog.
2. Its calculated pricing object is stored in the session; the uploaded binary is never retained.
3. Checkout must submit the displayed total, which is compared to the session recommendation total.
4. Missing recommendations and mismatched totals return 409; the server never trusts a client-only amount.
5. The returned URL is a simulated hosted-payment boundary. Production integrations must recalculate prices against current inventory and delegate card data to a PCI-compliant provider.

The contract is covered by tests/checkout-amount.test.js and the pricing boundary tests.
