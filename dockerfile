# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
# Build with an explicitly provided backend URL or fall back to values in .env/.env.production
RUN npm run build 

EXPOSE 3000
CMD ["npm", "run", "start"]