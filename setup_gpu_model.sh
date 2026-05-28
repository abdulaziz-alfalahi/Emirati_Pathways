#!/bin/bash
# =========================================================================
# Run this script on the GPU VM (10.228.145.194) via SSH
# It spins up an OpenAI-compatible ASR server on Port 8001 using GPU
# =========================================================================

echo "Deploying GPU Inference Server on port 8001..."

# Create directory
mkdir -p ~/inference-server
cd ~/inference-server

# 1. We will use the ultra-fast 'faster-whisper-server' as the backend. 
# It provides an OpenAI-compatible transcription endpoint out of the box.
# If you have a specific IBM Granite Speech Docker image, you can replace 
# the 'image' field below with your private registry image.

cat << 'EOF' > docker-compose.yml
services:
  asr-server:
    # Highly optimized ASR server with OpenAI compatible endpoints
    image: fedirz/faster-whisper-server:latest-cuda
    ports:
      - "8001:8000"
    environment:
      # Model settings. You can swap 'Systran/faster-whisper-large-v3' 
      # for your specific Granite model if it's compatible, or leave it 
      # as large-v3 for state-of-the-art multilingual accuracy.
      - WHISPER__MODEL=Systran/faster-whisper-large-v3
    volumes:
      - ./huggingface_cache:/root/.cache/huggingface
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
EOF

# Ensure Docker uses the network proxy if you are behind the same proxy as APPDEV
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf > /dev/null << 'EOF'
[Service]
Environment="HTTP_PROXY=http://10.61.192.2:8080/"
Environment="HTTPS_PROXY=http://10.61.192.2:8080/"
Environment="NO_PROXY=localhost,127.0.0.1,10.61.192.66,10.61.192.67,10.61.192.68,10.61.192.69,10.61.192.70,10.61.192.35"
EOF

# Restart docker and run the compose
sudo systemctl daemon-reload
sudo systemctl restart docker
sudo docker compose up -d

echo "✅ ASR Inference server deployed!"
echo "It is now listening on http://10.228.145.194:8001/v1/audio/transcriptions"
