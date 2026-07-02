FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production --silent
COPY . .
RUN npm run build || true
EXPOSE 4000
CMD ["node", "dist/index.js"]
