# AquaPrecision: AI Irrigation Simulator
# Hugging Face Spaces deployment

FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build the project (Vite frontend + esbuild server bundle)
RUN npm run build

# HF Spaces runs on port 7860
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

CMD ["node", "dist/server.js"]
