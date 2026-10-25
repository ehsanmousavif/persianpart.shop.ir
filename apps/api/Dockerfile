# syntax=docker/dockerfile:1

# 1. Base Stage using official Bun Alpine image
FROM oven/bun:1-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache nodejs npm
RUN npm install -g pnpm@11.18.0

# 2. Builder Stage
FROM base AS builder
WORKDIR /app

# Copy monorepo configurations and manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contract/package.json ./packages/contract/
COPY apps/api/package.json ./apps/api/
COPY apps/cms/package.json ./apps/cms/
COPY apps/web/package.json ./apps/web/

# Install workspace dependencies with cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Copy workspaces needed for API (API depends on contract and cms)
COPY packages/contract ./packages/contract
COPY apps/cms ./apps/cms
COPY apps/api ./apps/api

# 3. Runner Stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5175
ENV HOST=0.0.0.0

# Copy monorepo workspace files and node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contract ./packages/contract
COPY --from=builder /app/apps/cms ./apps/cms
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 5175

CMD ["bun", "run", "apps/api/src/server.ts"]
