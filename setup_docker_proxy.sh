#!/bin/bash

# Create the systemd configuration directory for Docker
mkdir -p /etc/systemd/system/docker.service.d

# Create the proxy configuration file safely
cat << 'EOF' > /etc/systemd/system/docker.service.d/http-proxy.conf
[Service]
Environment="HTTP_PROXY=http://10.61.192.2:8080/"
Environment="HTTPS_PROXY=http://10.61.192.2:8080/"
Environment="NO_PROXY=localhost,127.0.0.1,10.61.192.66,10.61.192.67,10.61.192.68,10.61.192.69,10.61.192.70,10.61.192.35"
EOF

# Reload systemd and restart the Docker daemon
systemctl daemon-reload
systemctl restart docker

echo "Docker proxy configuration applied successfully!"
