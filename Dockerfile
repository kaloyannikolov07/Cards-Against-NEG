FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]
