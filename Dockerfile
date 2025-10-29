# Build stage
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY .env .env
ARG VITE_API_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env
RUN bun run build

# Runtime stage with Nginx
FROM nginx:stable-alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist ./


ENV NODE_ENV=production
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
