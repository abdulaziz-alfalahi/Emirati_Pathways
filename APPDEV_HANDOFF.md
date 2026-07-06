# APPDEV Handoff Prompt — Copy Everything Below This Line

I'm continuing work on the Emirati Human Development Platform (Dubai HR / DGHR platform). This Antigravity instance was just migrated from the Jump Server to this APPDEV VM. Here's the full project context:

## ARCHITECTURE
- Backend: Python 3.10 / Flask with raw SQL (psycopg2), no ORM. Gunicorn + gevent workers. Deployed via Docker.
- Frontend: React (Vite), bilingual (EN/AR with RTL support), uses t() helper for translations.
- Database: PostgreSQL 18.3 at 10.228.145.66:5454, database dghr_prod, user dghr_prod, password '<REDACTED — stored in Moro secret store>' (single quotes in shell to avoid $ expansion).
- Schema source of truth: backend/DATABASE_SCHEMA.md (130 tables, fully documented).
- AI Service: Qwen via OpenAI-compatible SDK, proxied through Moro egress. Config in backend/config/qwen_config.py (120s timeout). Client in backend/services/qwen_client.py (retries disabled).
- Data models: Python dataclasses (NOT SQLAlchemy ORM), all DB access is raw SQL via psycopg2.

## INFRASTRUCTURE (Moro / MoroHub)
- APPDEV (this machine): 10.228.145.4 — Development server, Ubuntu 22.04
- APPQA: 10.228.145.5 — QA/staging server
- APP01: 10.228.145.6 — Production server 1
- APP02: 10.228.145.7 — Production server 2
- Jump Server: 10.228.145.98 — Windows, RDP gateway (losing internet tomorrow)
- DB Server: 10.228.145.66:5454 — PostgreSQL
- Proxy: http://10.61.192.2:8080 (required for all outbound internet)

## NETWORK / PROXY
- All outbound traffic must go through proxy 10.61.192.2:8080
- Internal VMs (10.228.145.x) are accessible directly without proxy
- Environment variables http_proxy, https_proxy, and no_proxy should be set in ~/.bashrc
- APT proxy is configured in /etc/apt/apt.conf.d/05proxy

## DEPLOYMENT WORKFLOW
- Develop on APPDEV → git push → pull to APPQA for testing → pull to APP01/APP02 for production
- Docker-based deployment using docker-compose.yml
- Git repo is at ~/Emirati_Pathways on the MORO-preparations branch

## KEY FILES TO KNOW
- docker-compose.yml — Multi-container orchestration
- deployment/install.sh — Production installation script
- backend/Dockerfile — Backend container config
- backend/DATABASE_SCHEMA.md — Complete schema reference
- .github/workflows/backend-ci.yml — CI pipeline

## CURRENT STATE
- Antigravity v1.107.0 freshly installed on APPDEV
- XFCE4 desktop + XRDP configured for GUI access
- Firefox installed at ~/firefox/firefox (set as default browser)
- SSH passwordless access from Jump Server to APPDEV is configured
- Git repo cloned and on MORO-preparations branch

## IMPORTANT NOTES
- Do NOT use SQLAlchemy ORM — this project uses raw SQL with psycopg2 exclusively
- Always use single quotes around the DB password in shell commands
- The proxy (10.61.192.2:8080) is required for any internet access including pip, npm, curl, docker pulls
- For sudo operations, the password contains special chars: <REDACTED — stored in Moro secret store>

Please confirm you understand this context by summarizing the key points, then let's continue development.
