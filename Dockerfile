FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets
COPY --from=builder /app/dist ./dist

# Create data directory
RUN mkdir -p /data/servers /data/modpacks

# dockerode communicates with the host Docker daemon via the socket.
# Mount /var/run/docker.sock:/var/run/docker.sock in your compose file.
# The node process needs permission to access the socket.
# On most systems adding the container user to the docker group is sufficient,
# but running as root works too for a home server setup.

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.cjs"]
