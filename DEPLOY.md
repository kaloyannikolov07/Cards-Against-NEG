# Deploy to Railway

This project deploys best as one Railway web service:

- the client is built with Vite into `server/dist`
- the Express server serves that built client in production
- Socket.IO runs on the same public Railway URL

## 1. Push the project to GitHub

Commit and push the repository to GitHub. Railway deploys from your GitHub repo.

## 2. Create the Railway service

1. Go to https://railway.app
2. Click **New Project**
3. Choose **Deploy from GitHub repo**
4. Select this repository
5. Railway should use the existing `Dockerfile` because `railway.json` sets the builder to `DOCKERFILE`

Do not create a separate frontend service. The backend serves the frontend.

## 3. Add MongoDB

You need a MongoDB connection string.

### Option A: Railway MongoDB

1. In the Railway project, click **New**
2. Choose **Database**
3. Choose **MongoDB**
4. Open the MongoDB service variables/connect tab
5. Copy the MongoDB connection URL

### Option B: MongoDB Atlas

1. Create a free cluster at https://mongodb.com/atlas
2. Create a database user
3. Allow Railway to connect from the network access settings
4. Copy the connection string

## 4. Set Railway variables

Open your web service in Railway, go to **Variables**, and add:

```text
MONGO_URI=mongodb connection string here
NODE_ENV=production
```

Railway sets `PORT` automatically. Do not hard-code it.

## 5. Deploy

Railway will build the Docker image and run:

```bash
npm start
```

That starts `server/server.js`. The server listens on `process.env.PORT`, which is what Railway requires.

## 6. Generate a public URL

In the Railway service:

1. Go to **Settings**
2. Open **Networking**
3. Click **Generate Domain**

Use that generated Railway domain to open the game.

## Local Production Check

From the repo root:

```bash
npm install
npm run build
set NODE_ENV=production
npm start
```

Then open `http://localhost:4000`.

On macOS/Linux, use:

```bash
NODE_ENV=production npm start
```

## Notes

- You do not need `VITE_SERVER_URL` on Railway because the client connects to `window.location.origin`.
- If you deploy the client separately later, then set `VITE_SERVER_URL` to the backend URL before building the client.
- The `/health` route can be used as a quick backend check.
