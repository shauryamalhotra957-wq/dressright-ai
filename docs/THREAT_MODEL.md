# dressright-ai: STRIDE Threat Model & Data Privacy

Security assessment for **AI-Assisted Menswear Styling Platform with RAG Capsule Wardrobes**.

| STRIDE Pillar | Identified Threat Vector | Severity | Mitigation Strategy |
|---|---|---|---|
| **Spoofing** | Session hijacking or fraudulent device identity | High | Cryptographic session tokens with short expiry (15m) and secure HttpOnly cookies |
| **Tampering** | Modification of local store state or intercepted API payloads | Critical | Authenticated AES-256-GCM encryption with HMAC tamper-detection digests |
| **Repudiation** | User disputing confirmed actions or configuration changes | Medium | Immutable append-only audit trail stored in encrypted local sqlite database |
| **Information Disclosure** | Leakage of private journal entries or personal wardrobe preferences | High | End-to-end user-held encryption keys; zero plaintext indexing on cloud servers |
| **Denial of Service** | Maliciously large payload upload crashing parser | High | Strict JSON body size limits (max 512KB) and rate limiting (max 60 req/min) |
| **Elevation of Privilege** | DOM XSS injection via user markdown or note inputs | Critical | Strict DOMPurify / sanitized AST rendering rejecting raw script and iframe tags |
