# syntax=docker/dockerfile:1

# 1. Base Stage
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache libc6-compat
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

# Copy workspaces needed for CMS
COPY packages/contract ./packages/contract
COPY apps/cms ./apps/cms

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Payload CMS Next.js Application
RUN pnpm --filter @persianpart/cms build

# 3. Runner Stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5174
ENV HOST=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Copy monorepo workspace files and node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/contract ./packages/contract
COPY --from=builder /app/apps/cms ./apps/cms

EXPOSE 5174

CMD ["pnpm", "--filter", "@persianpart/cms", "start"]
