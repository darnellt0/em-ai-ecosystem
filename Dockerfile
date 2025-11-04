FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages

RUN npm ci

WORKDIR /app/packages/api
RUN npm run build || npx tsc -p tsconfig.json

EXPOSE 3000
ENV PORT=3000 NODE_ENV=production

CMD ["node", "dist/index.js"]
