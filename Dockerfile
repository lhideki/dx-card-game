# Use Node.js 20 to install dependencies and build the Next.js app (required for @google/genai)
FROM node:20 AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the application and prune dev dependencies
RUN npm run build && npm prune --omit=dev

# Production image
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy application from build stage
COPY --from=build /app .

# The app expects to run on port 8080 in Cloud Run
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
