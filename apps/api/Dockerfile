FROM node:22-alpine AS builder
WORKDIR /app

# Copy root package manager files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy the specific workspaces
COPY packages/data ./packages/data
COPY packages/ai ./packages/ai
COPY apps/api ./apps/api

# Install dependencies using npm workspaces
RUN npm ci

# Build the API
RUN npm run build -w apps/api

FROM node:22-alpine AS production
WORKDIR /app

# Only copy production dependencies
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/data/package.json ./packages/data/
COPY --from=builder /app/packages/ai/package.json ./packages/ai/

# Copy built code
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001
ENV NODE_ENV=production

CMD ["npm", "run", "start", "-w", "apps/api"]
