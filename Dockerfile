# ── OneGate Simulator — Next.js + Prisma (Coolify) ──────────────────
# npm build (avoids host pnpm release-age policy). Prisma schema is synced
# to the database at container start via `prisma db push`.

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app ./
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/prisma db push --skip-generate && npm run start"]
