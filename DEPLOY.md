# Deploy to Railway

## Quick Deploy

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and sign up
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway will auto-detect the project (Nixpacks builder)

## Environment Variables

In Railway dashboard, go to your project → "Variables" tab and add:

- `MONGO_URI` = your MongoDB connection string (see below)
- `NODE_ENV` = `production`

## Database Setup (Required)

### Option 1: MongoDB Atlas (Recommended)
1. Go to [mongodb.com](https://mongodb.com) → Free cluster
2. Create account, build database
3. Create user and get connection string
4. Add to Railway env vars: `MONGO_URI` = `mongodb+srv://username:password@cluster.xxx.mongodb.net/cards-against-neg`

### Option 2: Railway MongoDB
1. In Railway dashboard: "New" → "Database" → "MongoDB"
2. Wait for it to provision
3. Copy the connection string from "Connect" tab
4. Add to your project env vars

## Client Build

The server will serve the client built files in production mode. Make sure to:

1. Build the client locally before deploying, or
2. Add a build hook in Railway

For automatic client builds, add a `package.json` script in the root:

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build"
  }
}
```

Then in Railway, set `BUILD_CMD` = `npm run build`

## Important Notes

- After deployment, the app will be available at your Railway URL
- The client connects to the same server (no separate URL needed)
- First deploy may take 2-3 minutes

---

# Deploy to Render

## Quick Deploy

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | cards-against-neg |
   | Root Directory | `server` |
   | Region | Frankfurt (or closest) |
   | Branch | main |
   | Build Command | (leave empty) |
   | Start Command | `npm start` |

6. Click "Create Web Service"

## Environment Variables

After creating the service, go to "Environment" tab and add:

- `MONGO_URI` = your MongoDB connection string (see below)

## Database Setup (Required)

You need a MongoDB database. Two free options:

### Option 1: MongoDB Atlas (Recommended)
1. Go to [mongodb.com](https://mongodb.com) → Free cluster
2. Create account, build database
3. Create user and get connection string
4. Add to Render env vars: `MONGO_URI` = `mongodb+srv://username:password@cluster.xxx.mongodb.net/cards-against-neg`

### Option 2: Render Managed Database
1. In Render dashboard: New → "MongoDB"
2. Wait for it to provision
3. Copy the connection string
4. Add to your web service env vars

## Client Deployment

1. In Render, click "New" → "Static Site"
2. Connect the same repo
3. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | cards-against-neg-client |
   | Root Directory | `client` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

4. Add environment variable:
   - `VITE_SERVER_URL` = your server URL (e.g., `https://cards-against-neg.onrender.com`)

## Important Notes

- The server URL in client must match your Render server URL
- After deployment, update client env var to point to your server
- First deploy may take 2-3 minutes