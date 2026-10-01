# Static web build (same bundle that Capacitor wraps for Android/iOS), served by nginx.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* values are baked in at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
