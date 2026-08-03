# Moro firewall request — GPUAAS access for on-prem speech-to-text

Rows for Moro's `Firewall_Request.xlsx` → "Internal Firewall Port Template"
sheet (same format as the 2026-07-27 request). Purpose: deploy and operate
the on-prem speech-to-text service (interview transcription) on the GPUAAS
nodes. All traffic stays inside the DGHR-EM tenant.

| Source Tenant | Source Server | Source IP | Dest Tenant | Dest Server | Dest IP | Service (ports) | Protocol | Remark |
|---|---|---|---|---|---|---|---|---|
| DGHR-EM | APPQA | 10.228.145.5 | DGHR-EM | GPUAAS-01 | 10.228.145.194 | 8001 | TCP | Interview STT API (faster-whisper, OpenAI-compatible) — staging app → GPU inference |
| DGHR-EM | APPQA | 10.228.145.5 | DGHR-EM | GPUAAS-02 | 10.228.145.195 | 8001 | TCP | Same, second GPU node (failover) |
| DGHR-EM | APPDEV | 10.228.145.4 | DGHR-EM | GPUAAS-01 | 10.228.145.194 | 22, 8001 | TCP | Deployment + verification of the STT service from the dev VM |
| DGHR-EM | APPDEV | 10.228.145.4 | DGHR-EM | GPUAAS-02 | 10.228.145.195 | 22, 8001 | TCP | Same, second GPU node |
| DGHR-EM | Jump Server | 10.228.145.98 | DGHR-EM | GPUAAS-01/02 | 10.228.145.194-195 | 22 | TCP | Admin SSH to GPU nodes via bastion (if not already permitted) |
| DGHR-EM | GPUAAS-01/02 | 10.228.145.194-195 | Shared Services | Proxy | 10.61.192.2 | 8080 | TCP | Model download egress (HuggingFace via proxy) — one-time per model, may already exist |

Change Summary: enable the on-prem interview transcription service
(faster-whisper) on the GPUAAS nodes. The staging application (APPQA) calls
the inference API on :8001; APPDEV needs SSH+API for deployment and testing;
GPU nodes need proxy egress once to fetch the speech model. No new external
exposure — all rules are intra-tenant except the existing shared proxy.

Production follow-up (when prod hosts are confirmed): mirror the APPQA→GPUAAS
:8001 rules from the production app nodes (10.228.145.2-.3) — these may
already exist per the current policy export ("LiveKit/GPUAAS" egress rows).
