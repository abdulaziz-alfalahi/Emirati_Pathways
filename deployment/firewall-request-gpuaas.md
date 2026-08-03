# Moro firewall request — GPUAAS access for on-prem speech-to-text

Rows for Moro's `Firewall_Request.xlsx` → "Internal Firewall Port Template"
sheet (same format as the 2026-07-27 request). Purpose: deploy and operate
the on-prem speech-to-text service (interview transcription) on the GPUAAS
nodes. All traffic stays inside the DGHR-EM tenant.

**Status 2026-08-03** — checked against the request actually sent to Moro
(`DGHR_EM_Firewall_Request_FILLED.xlsx`): APP01-02→GPU:8001, APPDEV→GPU
:8001/7860-7882 and Jump→GPU:22 already EXIST in the live policy; the only
missing must-have is **APPQA (10.228.145.5) → GPU :8001** (staging cannot
reach GPU STT without it). Delta workbook prepared and handed to the owner:
`~/Downloads/DGHR_EM_Firewall_Request_DELTA_APPQA_GPU.xlsx` (2 APPQA rows +
optional GPU→proxy:8080 model-download egress; workaround for the latter is
scp via the existing Jump→GPU SSH rule).

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
