# Quick CORS Proxy Setup for MTTA Integration

The "Failed to fetch data" error is caused by CORS (Cross-Origin Resource Sharing) restrictions. Here are quick solutions:

## Option 1: Use a Public CORS Proxy (Quickest - Development Only)

1. Open your `.env` file in the project root
2. Add this line:
   ```env
   VITE_CORS_PROXY=https://api.allorigins.win/raw?url=
   ```

3. Restart your dev server:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

**Note:** Public proxies have rate limits and shouldn't be used in production.

## Option 2: Use CORS Anywhere (Alternative)

1. Add to `.env`:
   ```env
   VITE_CORS_PROXY=https://cors-anywhere.herokuapp.com/
   ```

2. You may need to request temporary access at https://cors-anywhere.herokuapp.com/corsdemo

## Option 3: Create Your Own Backend Proxy (Recommended for Production)

### Using Node.js/Express:

1. Create a simple proxy server:

```javascript
// proxy-server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/api/proxy/*', async (req, res) => {
  const targetUrl = req.url.replace('/api/proxy/', 'https://results.mtta.mt/');
  try {
    const response = await fetch(targetUrl);
    const html = await response.text();
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
});
```

2. Install dependencies:
```bash
npm install express cors node-fetch
```

3. Run the proxy:
```bash
node proxy-server.js
```

4. Update `.env`:
```env
VITE_CORS_PROXY=http://localhost:3001/api/proxy/
```

## Option 4: Use Vercel Serverless Function (Recommended for Production)

If you're deploying on Vercel, a serverless function is already created at `api/proxy.js`.

1. Deploy your app to Vercel (or it's already deployed)
2. Update your `.env` file:
   ```env
   VITE_CORS_PROXY=https://your-app.vercel.app/api/proxy?url=
   ```
   Replace `your-app.vercel.app` with your actual Vercel domain.

3. Restart your dev server

**Benefits:**
- ✅ No rate limits
- ✅ Reliable and fast
- ✅ Works in production
- ✅ Free on Vercel

**Note:** For local development, you can still use Option 1 (public proxy) or Option 3 (local proxy server).

## Testing

After setting up the proxy:

1. Restart your dev server
2. Go to Players page
3. Click "Sync from MTTA"
4. Enter team name: `TopSpin TTA "Skelton"`
5. Click "Fetch Data"

You should now see the team stats and players!

## Troubleshooting

- **Still getting CORS error?** Check browser console for the exact error
- **Proxy not working?** Make sure you restarted the dev server after updating `.env`
- **Empty response?** The MTTA website structure might have changed - check the console logs
