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

# Deploy Frontend to Vercel

Vercel is a good fit for the React/Vite frontend, but not for this Socket.IO backend. Keep the backend on Railway and deploy only the client to Vercel.

## 1. Deploy the backend first

Deploy the backend with the Railway steps above. Copy the public Railway URL, for example:

```text
https://cards-against-neg-production.up.railway.app
```

## 2. Create the Vercel project

1. Go to https://vercel.com
2. Click **Add New...** -> **Project**
3. Import this GitHub repository
4. Keep the project root as the repository root

The included `vercel.json` tells Vercel to build the client and publish `client/dist`.

## 3. Add Vercel environment variables

In Vercel, open **Project Settings** -> **Environment Variables** and add:

```text
VITE_SERVER_URL=https://your-railway-backend-url
```

Add it for Production, Preview, and Development if you want all deployments to connect to the same backend.

## 4. Deploy

Vercel will run:

```bash
npm run build --prefix client
```

Because Vercel sets the `VERCEL` environment variable, the Vite build outputs to `client/dist`. For Railway builds, it still outputs to `server/dist`.

## Important Vercel Note

Do not move `server/server.js` into a Vercel Function unless the realtime logic is rewritten. Socket.IO needs a persistent Node server for the multiplayer rooms.
