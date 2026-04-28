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
   | Region | Frankfurt (or closest) |
   | Branch | main |
   | Build Command | (leave empty for server) |
   | Start Command | `npm start` |

6. Click "Create Web Service"

## Environment Variables

After creating the service, go to "Environment" tab and add:

- No variables needed for server (uses PORT from Render)

## Client Deployment

1. In Render, click "New" → "Static Site"
2. Connect the same repo
3. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | cards-against-neg-client |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

4. Add environment variable:
   - `VITE_SERVER_URL` = your server URL (e.g., `https://cards-against-neg.onrender.com`)

## Important Notes

- The server URL in client must match your Render server URL
- After deployment, update client env var to point to your server
- First deploy may take 2-3 minutes