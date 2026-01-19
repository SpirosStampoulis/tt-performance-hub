export default async function handler(req, res) {
  const { url } = req.query
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    const targetUrl = decodeURIComponent(url)
    
    if (!targetUrl.startsWith('https://results.mtta.mt/')) {
      return res.status(400).json({ error: 'Only requests to results.mtta.mt are allowed' })
    }
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; TT-Performance-Hub/1.0)'
      }
    })

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Failed to fetch: ${response.status} ${response.statusText}` 
      })
    }

    const html = await response.text()
    
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    
    res.send(html)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
