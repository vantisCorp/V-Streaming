# Multi-stage Dockerfile for V-Streaming development and testing

# Stage 1: Build stage
FROM node:20-bookworm-slim AS build

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    libwebkit2gtk-4.1-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install frontend dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Runtime stage (for testing only - full app requires native OS)
FROM node:20-bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libwebkit2gtk-4.1-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Expose port for development server
EXPOSE 5173

# Default command
CMD ["npm", "run", "preview"]