FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3010
ENV Liftrz_SQLITE_PATH=/data/Liftrz.sqlite

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY api ./api
COPY lib ./lib
COPY public ./public
COPY db.json ./db.json
COPY server.js ./server.js

RUN mkdir -p /data

EXPOSE 3010

CMD ["node", "server.js"]
