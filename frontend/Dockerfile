# =========================================
# Emirati Human Development Platform — Frontend
# Pre-built static files → Nginx serve
# =========================================
# Build locally first: npm run build (or: npx vite build)
# Then: docker-compose build frontend

FROM nginx:stable-alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Ensure all static files are world-readable
RUN chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} +
EXPOSE 80

# -Y off disables proxy use. The image inherits http_proxy from the build args,
# and BusyBox wget (this is nginx:alpine) honours http_proxy but IGNORES
# no_proxy — so a plain `wget http://localhost/health` is sent to the corporate
# forward proxy, which cannot resolve the container's own localhost and answers
# 503. The container then reports "unhealthy" forever while serving perfectly
# well: verified on APPQA with a failing streak of 31 against a /health endpoint
# that returns 200 from outside. A container permanently stuck "unhealthy"
# trains people to ignore health status, which is how the LiveKit crash loop ran
# 2,379 restarts unnoticed.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -Y off -qO- http://localhost/health || exit 1
