# Simplified Railway deployment
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE $PORT

# Start with tsx for direct TypeScript execution
CMD ["npx", "tsx", "server/index.ts"]