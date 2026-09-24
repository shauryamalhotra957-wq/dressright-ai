# dressright-ai: Production Operations Runbook & Incident Triage

Production guidance, offline cache lifecycle, and incident playbooks for **AI-Assisted Menswear Styling Platform with RAG Capsule Wardrobes**.

## Service Level Objectives (SLOs)
- **Client Render Latency**: First Contentful Paint (FCP) < 0.8s on 4G networks.
- **Offline Reliability**: 100% core capability available when disconnected from internet.
- **Sync Reconciliation Time**: Local dirty mutations synced to cloud within 3 seconds of reconnection.

## Incident Triage Matrix

### Sev-1: Local Store Decryption Failure / Key Loss
1. **Detection**: Client emits `DECRYPTION_MAC_MISMATCH` upon reading local store.
2. **Immediate Action**: Isolate corrupted local block; prompt user for biometric re-auth.
3. **Recovery**: Restore verified encrypted snapshot from cloud backup.

### Sev-2: Sync Conflict / Concurrent Mutation Drift
1. **Detection**: Vector clock conflict detected between client offline mutation and cloud remote state.
2. **Remediation**: Apply deterministic Last-Write-Wins (LWW) with three-way merge preview presented to user.
