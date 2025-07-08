# Tahap 1: Instalasi Dependensi
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Tahap 2: Build Aplikasi
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pastikan .env.local ada untuk proses build
# Kita akan buat file kosong jika tidak ada, agar build tidak gagal
RUN touch .env.local
RUN npm run build

# Tahap 3: Produksi
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy file-file yang dibutuhkan dari tahap builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Jalankan aplikasi
EXPOSE 3000
CMD ["npm", "start"]