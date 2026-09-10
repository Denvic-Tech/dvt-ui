FROM node:22.13.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Устойчивость к флейки-сети/TLS при скачивании пакетов: ретраи с backoff.
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-factor 2 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 180000 \
 && npm config set fetch-timeout 600000 \
 && npm install --no-audit --no-fund

COPY . .

RUN npm run build

FROM nginx:1.27.4-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
