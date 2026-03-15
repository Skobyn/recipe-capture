# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + built frontend
FROM node:20-alpine AS production
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/backend/public ./public

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
