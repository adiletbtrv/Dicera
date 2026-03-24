FROM node:22-alpine AS builder
WORKDIR /app

# Copy root files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy relevant packages
COPY packages/data ./packages/data
COPY apps/web ./apps/web

RUN npm ci

# Build web frontend
RUN npm run build -w apps/web

FROM node:22-alpine AS server
WORKDIR /app

# Install simple web server
RUN npm install -g serve

COPY --from=builder /app/apps/web/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
