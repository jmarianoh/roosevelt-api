FROM node:22-alpine

WORKDIR /app

RUN addgroup -g 10001 appgroup && adduser -D -u 10001 -G appgroup appuser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server ./server

RUN mkdir -p /app/.local-data/private && chown -R appuser:appgroup /app

ENV HOST=0.0.0.0 \
    PORT=3001 \
    NODE_ENV=production

USER appuser

EXPOSE 3001

VOLUME ["/app/.local-data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 1

CMD ["npm", "start"]
