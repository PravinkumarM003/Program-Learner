FROM node:18-bullseye-slim

WORKDIR /app

# Install Python3 and C toolchain for code execution (gcc/clang)
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		python3 python3-pip python3-venv \
		build-essential gcc g++ make clang ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --production --silent

COPY . .
RUN npm run build || true

# Ensure temp run dir exists and is writable by the service user
RUN mkdir -p /app/temp_run && chown -R node:node /app/temp_run /app

USER node

EXPOSE 4000
CMD ["node", "dist/index.js"]
