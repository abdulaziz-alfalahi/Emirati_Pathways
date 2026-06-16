# =========================================
# Emirati Human Development Platform — Frontend
# Multi-stage build: Node build → Nginx serve
# =========================================

# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app

# Force NODE_ENV=development so npm ci installs devDependencies (vite, typescript)
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci --production=false
# Verify vite was actually installed
RUN ls -la node_modules/.bin/vite && echo "✅ vite found"

COPY . .
# Skip tsc (type-checking done locally); vite build catches syntax/import errors
RUN node_modules/.bin/vite build

# Stage 2: Serve static files via Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Ensure all static files are world-readable (fixes 403 on images/assets)
RUN chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} +
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1
