# 1. Base Image
FROM node:18-alpine AS base

# 2. Install pnpm
RUN npm install -g pnpm

# 3. Dependencies Stage
FROM base AS dependencies

WORKDIR /usr/src/app

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy project-specific package.json files to leverage Docker cache
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui-components/package.json ./packages/ui-components/
COPY packages/constants/package.json ./packages/constants/

# Install all dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile

# 4. Build Stage
FROM dependencies AS builder

WORKDIR /usr/src/app

# Copy the rest of the source code
COPY . .

# Build the backend application
RUN pnpm --filter backend build

# 5. Production Stage
FROM base AS production

WORKDIR /usr/src/app

# Copy built artifacts and dependencies from previous stages
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/backend/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
