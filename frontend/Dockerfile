FROM node:20

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Complete nuclear clean
RUN rm -rf node_modules package-lock.json
RUN npm cache clean --force

# Install dependencies
RUN npm install --force

# Nuclear esbuild fix
RUN npm uninstall esbuild
RUN npm install esbuild@0.21.5 --force
RUN npm rebuild

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]

