# Dockerfile

# Base Image: Gunakan image Node.js versi 20 yang ramping (slim)
FROM node:20-slim AS base

# Set working directory di dalam container
WORKDIR /app

# Install dependensi yang dibutuhkan untuk build
RUN apt-get update && apt-get install -y openssl

# --- Tahap 1: Pemasangan Dependensi ---
FROM base AS deps
WORKDIR /app
# Salin package.json dan package-lock.json
COPY package.json package-lock.json* ./
# Install dependensi
RUN npm install

# --- Tahap 2: Build Aplikasi ---
FROM base AS builder
WORKDIR /app
# Salin dependensi yang sudah ter-install dari tahap 'deps'
COPY --from=deps /app/node_modules ./node_modules
# Salin sisa kode aplikasi
COPY . .
# Build aplikasi Next.js
RUN npm run build

# --- Tahap 3: Produksi ---
FROM base AS runner
WORKDIR /app

# Set environment variable untuk produksi
ENV NODE_ENV=production

# Salin folder .next yang sudah di-build dari tahap 'builder'
COPY --from=builder /app/.next ./.next
# Salin node_modules dari tahap 'deps'
COPY --from=deps /app/node_modules ./node_modules
# Salin package.json
COPY package.json .

# Expose port 3000
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]