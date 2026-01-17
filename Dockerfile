# Build stage
FROM node:24-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Set build arguments for Vite (client-side env vars)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_META_APP_ID
ARG VITE_OPENROUTER_MODEL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_META_APP_ID=$VITE_META_APP_ID
ENV VITE_OPENROUTER_MODEL=$VITE_OPENROUTER_MODEL

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy build output to nginx static folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add basic nginx config for SPA routing
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
