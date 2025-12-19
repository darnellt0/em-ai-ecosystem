FROM node:20-alpine

WORKDIR /app

# Copy manifests and source (node_modules/dist are excluded via .dockerignore)
COPY package*.json ./
COPY packages ./packages
# Install workspaces inside the container
RUN npm install --workspaces --include-workspace-root

WORKDIR /app

EXPOSE 3000
ENV PORT=3000 NODE_ENV=production

CMD ["npx", "ts-node", "packages/api/src/index.ts"]
