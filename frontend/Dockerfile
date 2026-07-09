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

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
