# Multi-stage build per ottimizzare le dimensioni dell'immagine
FROM node:20-alpine AS base

# Installa le dipendenze necessarie
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Installa pnpm
RUN corepack enable pnpm

# Installa dipendenze
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Build dell'applicazione
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build dell'app
RUN pnpm build

# Immagine di produzione
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crea utente non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia i file necessari
# Copia public dalla directory principale del progetto
COPY --chown=nextjs:nodejs ./public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npx", "next", "start"]
