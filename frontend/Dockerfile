# Step 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retries 5 \
    && npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Step 2: Serve the Static Files via Nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
