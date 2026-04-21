# --- ETAPA DE CONSTRUCCIÓN ---
FROM node:25.4.0-slim AS builder

# Define DATABASE_URL como argumento (puedes pasarlo en build o usar valor dummy)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=$DATABASE_URL

RUN npm install -g pnpm
WORKDIR /app

# 1. Copiamos los archivos de configuración del workspace
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml* ./
COPY emails/package.json ./emails/

# 2. Instalación RECURSIVA de dependencias
RUN pnpm install -r --frozen-lockfile

# 3. Copiamos el resto del código
COPY . .

# 4. Build (ya incluye db:generate)
RUN pnpm run build

# --- ETAPA DE PRODUCCIÓN ---
FROM node:25.4.0-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g pnpm

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/emails ./emails

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]