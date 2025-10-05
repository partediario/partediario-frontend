# --- Etapa Base ---
# Instala pnpm y define el directorio de trabajo.
FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./

# --- Etapa de Desarrollo ---
# Instala dependencias y establece el comando para desarrollo.
FROM base AS dev
COPY . .
RUN pnpm install
CMD ["pnpm", "run", "dev"]

# --- Etapa de Construcción (Producción) ---
# Define los argumentos de construcción, los establece como variables de entorno,
# instala dependencias, copia el código y construye la aplicación.
FROM base AS builder
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm install
COPY . .
RUN pnpm build
RUN pnpm prune --prod

# --- Etapa Final (Producción) ---
# Crea la imagen final, ligera y segura para producción.
FROM node:22-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER nextjs
EXPOSE 3000
CMD ["pnpm", "start"]