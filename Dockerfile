FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json server/package.json client/package.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the client
RUN npm run build

# Expose port
EXPOSE 4000

# Start the server
CMD ["npm", "start"]

# Start the server
CMD ["sh", "-c", "cd server && node server.js"]