FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts

# --- Builder ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Dummy env vars for build (real values injected at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV BETTER_AUTH_SECRET="build-time-placeholder"
ENV BETTER_AUTH_URL="http://localhost:3000"

RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma: schema, config, migrations for `prisma migrate deploy`
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Install Prisma CLI + deps needed for migrations (dotenv, tsx for prisma.config.ts)
RUN npm install --prefix /tmp prisma@latest @prisma/engines@latest dotenv tsx typescript && \
    cp -r /tmp/node_modules/.bin ./node_modules/.bin && \
    cp -r /tmp/node_modules/prisma ./node_modules/prisma && \
    cp -r /tmp/node_modules/@prisma ./node_modules/@prisma && \
    cp -r /tmp/node_modules/dotenv ./node_modules/dotenv && \
    cp -r /tmp/node_modules/tsx ./node_modules/tsx && \
    cp -r /tmp/node_modules/typescript ./node_modules/typescript && \
    rm -rf /tmp/node_modules

# Also copy the generated Prisma client (needed for seed if run)
COPY --from=builder /app/src/lib/generated ./src/lib/generated

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
