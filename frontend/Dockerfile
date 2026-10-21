# --- Etapa de build ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# http: el sitio usa la API real. VITE_API_URL vacio = mismo origen; Nginx reenvia /api al backend.
ARG VITE_FUENTE_DATOS=http
ARG VITE_API_URL=
ENV VITE_FUENTE_DATOS=$VITE_FUENTE_DATOS VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Etapa de runtime ---
FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
