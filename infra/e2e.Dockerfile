# syntax=docker/dockerfile:1
FROM node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS test
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN npm ci
RUN npx playwright install --with-deps chromium firefox webkit && apt-get update && apt-get install -y --no-install-recommends libnss3-tools && rm -rf /var/lib/apt/lists/* && mkdir -p /opt/playwright && mv /root/.cache/ms-playwright/* /opt/playwright/
COPY . .
RUN npm run contracts:generate
ENV NODE_EXTRA_CA_CERTS=/trust/root.crt
ENV SSL_CERT_FILE=/trust/root.crt
ENV E2E_RUNTIME_CONTAINER=1
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
USER node
CMD ["node", "tools/quality/trust-ca.mjs", "test"]
