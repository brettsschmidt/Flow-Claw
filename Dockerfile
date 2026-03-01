FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY packages/server/package.json ./packages/server/
COPY packages/ui/package.json ./packages/ui/
RUN npm install --workspaces

# Build UI
COPY packages/ui ./packages/ui
RUN npm run build -w packages/ui

# Copy server source
COPY packages/server ./packages/server

# Expose port
EXPOSE 3001

# Default: watch /workflow (mount your markdown directory here)
ENV WORKFLOW_DIR=/workflow
ENV PORT=3001

CMD ["node", "packages/server/src/cli.js", "/workflow", "--port", "3001", "--no-open"]
