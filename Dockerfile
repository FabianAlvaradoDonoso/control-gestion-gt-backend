# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.6.5

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Install tsc-alias to resolve path aliases
RUN pnpm add -D tsc-alias

# Build the application
RUN pnpm run build

# Resolve path aliases in compiled code
RUN npx tsc-alias -p tsconfig.json

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.6.5

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 8000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/app.js"]
