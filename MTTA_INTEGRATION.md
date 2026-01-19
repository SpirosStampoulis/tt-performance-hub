# MTTA Integration Guide

This app can fetch player rankings and team data from the MTTA (Malta Table Tennis Association) results website.

## Setup

### CORS Proxy Configuration

Due to browser CORS restrictions, you'll need to set up a CORS proxy to fetch data from `results.mtta.mt`. You have two options:

#### Option 1: Use a Public CORS Proxy (Development Only)

For development, you can use a public CORS proxy service. Add this to your `.env` file:

```env
VITE_CORS_PROXY=https://cors-anywhere.herokuapp.com/
```

**Note:** Public CORS proxies are not recommended for production and may have rate limits.

#### Option 2: Set Up Your Own Backend Proxy (Recommended for Production)

Create a backend endpoint that fetches the MTTA data and returns it. Then set:

```env
VITE_CORS_PROXY=https://your-backend-url.com/api/proxy/
```

Example backend proxy (Node.js/Express):

```javascript
app.get('/api/proxy/*', async (req, res) => {
  const targetUrl = req.url.replace('/api/proxy/', 'https://results.mtta.mt/')
  try {
    const response = await fetch(targetUrl)
    const html = await response.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.send(html)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

## Usage

1. Navigate to the **Players** page
2. Click the **"Sync from MTTA"** button
3. Enter the team name exactly as it appears on `results.mtta.mt` (e.g., `TopSpin TTA "Skelton"`)
4. Click **"Fetch Data"** to preview the team data
5. Click **"Sync Players"** to import players into your app

## Features

- **Team Stats**: Fetches wins, losses, total games, and win rate
- **Team Formation**: Imports all players with their MTTA rankings
- **Team Results**: Fetches match history (available in the data but not yet displayed in UI)
- **Auto-sync**: Automatically creates new players or updates existing ones with MTTA rankings

## Data Structure

The MTTA service extracts:
- Player names and rankings
- Team statistics
- Match results with dates and scores

Synced players will have:
- `mttaRank`: Current MTTA ranking
- `mttaData`: Object containing rank and last sync timestamp
