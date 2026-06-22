#!/bin/bash
# ============================================================================
# Staging Deployment Helper Script (APPQA)
# ============================================================================
set -euo pipefail

echo "============================================================"
echo "  Deploying Career Hub & Admin Updates to Staging (APPQA)"
echo "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

REPO_DIR="$HOME/Emirati_Pathways"
cd "$REPO_DIR"

echo "1. Pulling latest code from origin/production-readiness..."
git pull origin production-readiness

echo "2. Building frontend production assets..."
cd "$REPO_DIR/frontend"
npm run build

echo "3. Rebuilding & restarting docker-compose frontend (port 8089)..."
cd "$REPO_DIR"
sudo docker-compose build frontend
sudo docker-compose up -d frontend

echo "4. Rebuilding & restarting standalone emirati_frontend (port 80)..."
sudo docker build -t emirati_frontend:latest ./frontend
sudo docker stop emirati_frontend || true
sudo docker rm emirati_frontend || true
sudo docker run -d --name emirati_frontend --network emirati_pathways_platform -p 80:80 --restart unless-stopped emirati_frontend:latest

echo ""
echo "============================================================"
echo "  ✅ Staging Deployment Successful!"
echo "============================================================"
echo ""
