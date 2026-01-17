# Build stage
FROM node:24-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite will automatically pick up VITE_ prefixed env vars from the environment
# during 'npm run build' even without explicit ARG if they are present in the shell.
# Easypanel usually injects 'Environment' variables into the build process.
RUN npm run build

# Production stage
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf "server { \n\
    listen 80; \n\
    location / { \n\
    root /usr/share/nginx/html; \n\
    index index.html index.htm; \n\
    try_files \$uri \$uri/ /index.html; \n\
    } \n\
    }" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
