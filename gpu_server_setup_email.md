**Subject:** GPU Server Setup Required — LiveKit Interview AI Module

Hi Team,

We've completed the integration of **IBM Granite 4.0 1B Speech** and **LiveKit** into our Emirati Pathways platform for real-time interview transcription, recording, and AI-powered candidate analysis. The code is deployed and verified, but the system requires a **CUDA-capable GPU server** to go live. I need your help provisioning this.

### Why We Need It

The Granite speech model runs locally (no cloud API calls — this is a **data sovereignty requirement**). It performs real-time speech-to-text during video interviews, feeding into automated competency analysis and hiring signal generation. All media processing stays on our network — nothing leaves the local infrastructure.

### Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| **GPU** | NVIDIA T4 (16 GB VRAM) | NVIDIA A10G or L4 (24 GB VRAM) |
| **RAM** | 16 GB | 32 GB |
| **CPU** | 4 cores | 8 cores |
| **Storage** | 100 GB SSD | 250 GB SSD (model weights + interview recordings) |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

> The model itself uses ~2 GB VRAM in bfloat16, but we need headroom for concurrent sessions and the LiveKit Egress service (headless Chrome for recording).

### Software to Install

1. **NVIDIA Driver** ≥ 535 + **CUDA Toolkit** ≥ 12.1
2. **Docker** + **Docker Compose** (v2) + **NVIDIA Container Toolkit** (for GPU passthrough to containers)
3. **Python 3.11+** with pip

### What We'll Deploy on It

The server will run **5 containerized services** via Docker Compose:

| Service | Port | Role |
|---|---|---|
| LiveKit Server | 7880 | WebRTC SFU for video interviews |
| LiveKit Egress | — | Records interviews to MP4 (headless Chrome) |
| MinIO | 9000/9001 | S3-compatible storage with AES-256 encryption |
| Agent Worker | 8002 | Runs Granite ASR model on GPU |
| Webhook Receiver | 8003 | Handles recording lifecycle events |

### Network Requirements

- Ports **7880–7882** open for WebRTC traffic (from client browsers)
- Ports **9000–9001** accessible internally for MinIO
- The server must be able to reach our **PostgreSQL database** and be reachable from our **Flask backend**
- **No outbound internet required** after initial model download (~2 GB one-time pull from Hugging Face)

### Data Sovereignty Note

This architecture was specifically designed so that **no audio, video, or transcript data leaves the local network**. The ASR model runs locally, recordings stay in our MinIO instance, and all processing is on-premise. This is critical for UAE compliance.

### Once the Server Is Ready

I'll need SSH access to deploy. The deployment itself is straightforward:
```bash
docker compose -f docker-compose.livekit.yml up -d
```

Please let me know the timeline for provisioning, or if you'd prefer a cloud GPU instance (AWS `me-central-1` region to maintain UAE data residency — `g5.xlarge` with A10G would work).

Thanks,
[Your Name]
