FROM node:18-alpine

WORKDIR /app

# Install dependencies for both server and client
COPY server/package*.json server/
RUN cd server && npm install

COPY client/package*.json client/
RUN cd client && npm install

# Copy source code
COPY . .

# Build the client
RUN cd client && npm run build

# Expose port
EXPOSE 4000

# Start the server
CMD ["sh", "-c", "cd server && node server.js"]