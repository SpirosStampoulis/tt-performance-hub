const MTTA_BASE_URL = 'https://results.mtta.mt'

const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || ''

function buildProxyUrl(targetUrl, proxy) {
  if (!proxy) return targetUrl
  
  const proxyTrimmed = proxy.trim()
  
  if (proxyTrimmed.includes('?url=') || proxyTrimmed.includes('&url=')) {
    return `${proxyTrimmed}${encodeURIComponent(targetUrl)}`
  }
  
  if (proxyTrimmed.endsWith('/')) {
    return `${proxyTrimmed}${targetUrl}`
  }
  
  return `${proxyTrimmed}/${targetUrl}`
}

async function fetchWithRetry(url, options, maxRetries = 2) {
  let lastError = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    } catch (error) {
      lastError = error
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - the server took too long to respond')
      }
      
      if (attempt < maxRetries && (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('NetworkError')
      )) {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries}...`)
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

export async function fetchMTTATeamData(teamName) {
  try {
    const encodedTeamName = encodeURIComponent(teamName)
    const targetUrl = `${MTTA_BASE_URL}/teamplayers?team=${encodedTeamName}`
    
    const fetchUrl = buildProxyUrl(targetUrl, CORS_PROXY)
    
    console.log('Fetching MTTA data...')
    console.log('Target URL:', targetUrl)
    console.log('CORS Proxy:', CORS_PROXY || 'Not configured')
    console.log('Final URL:', fetchUrl)
    
    const response = await fetchWithRetry(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      mode: 'cors',
      cache: 'no-cache'
    })

    const html = await response.text()
    
    if (!html || html.length < 100) {
      throw new Error('Received empty or invalid response from MTTA website. The proxy might not be working correctly.')
    }
    
    if (html.includes('CORS') && html.includes('blocked')) {
      throw new Error('CORS proxy returned an error page. The proxy might not be configured correctly.')
    }
    
    if (html.includes('Access Denied') || html.includes('403') || html.includes('Forbidden')) {
      throw new Error('Access denied by the proxy server. The proxy might require authentication or have rate limits.')
    }
    
    return parseMTTAHTML(html, teamName)
  } catch (error) {
    console.error('Error fetching MTTA team data:', error)
    
    let errorMessage = error.message || 'Failed to fetch MTTA data'
    const isCorsError = error.message?.includes('Failed to fetch') || 
                       error.message?.includes('CORS') || 
                       error.name === 'TypeError' ||
                       error.message?.includes('network') ||
                       error.message?.includes('NetworkError')
    
    if (isCorsError) {
      if (CORS_PROXY) {
        errorMessage = `CORS Error: The proxy (${CORS_PROXY}) is not working correctly. Possible issues:\n` +
          `1. The proxy server might be down or rate-limited\n` +
          `2. The proxy URL format might be incorrect\n` +
          `3. The proxy might require authentication\n\n` +
          `Please check your VITE_CORS_PROXY setting in .env file and try a different proxy. See CORS_PROXY_SETUP.md for alternatives.`
      } else {
        errorMessage = `CORS Error: The browser blocked the request to ${MTTA_BASE_URL}.\n\n` +
          `You need to set up a CORS proxy. Add VITE_CORS_PROXY to your .env file.\n\n` +
          `Quick fix: Add this to your .env file:\n` +
          `VITE_CORS_PROXY=https://api.allorigins.win/raw?url=\n\n` +
          `Then restart your dev server. See CORS_PROXY_SETUP.md for more options.`
      }
    }
    
    throw new Error(errorMessage)
  }
}

function parseMTTAHTML(html, teamName) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const stats = extractStats(doc)
  const teamFormation = extractTeamFormation(doc)
  const teamResults = extractTeamResults(doc)

  return {
    teamName: teamName,
    stats,
    teamFormation,
    teamResults,
    fetchedAt: new Date().toISOString()
  }
}

function extractStats(doc) {
  const stats = {
    wins: null,
    losses: null,
    totalGames: null,
    winRate: null
  }

  const bodyText = doc.body?.textContent || ''
  
  const winsMatch = bodyText.match(/Wins\s*(\d+)/i)
  const lossesMatch = bodyText.match(/Losses\s*(\d+)/i)
  const totalGamesMatch = bodyText.match(/Total Games\s*(\d+)/i)
  const winRateMatch = bodyText.match(/(\d+\.?\d*)%/i)

  if (winsMatch) stats.wins = parseInt(winsMatch[1], 10)
  if (lossesMatch) stats.losses = parseInt(lossesMatch[1], 10)
  if (totalGamesMatch) stats.totalGames = parseInt(totalGamesMatch[1], 10)
  if (winRateMatch) stats.winRate = parseFloat(winRateMatch[1])

  return stats
}

function extractTeamFormation(doc) {
  const players = []
  
  const allText = doc.body?.textContent || ''
  
  const teamFormationMatch = allText.match(/Team Formation\s*([\s\S]*?)(?:Team Results|$)/i)
  if (!teamFormationMatch) return players

  const formationText = teamFormationMatch[1]
  
  const playerPattern = /([A-Za-z\s]+?)\s*\(Rank\s*#(\d+)\)/g
  let match
  
  while ((match = playerPattern.exec(formationText)) !== null) {
    const name = match[1].trim()
    const rank = parseInt(match[2], 10)
    
    if (name && !isNaN(rank)) {
      players.push({ name, rank })
    }
  }

  return players
}

function extractTeamResults(doc) {
  const results = []
  
  const allText = doc.body?.textContent || ''
  
  const teamResultsMatch = allText.match(/Team Results\s*([\s\S]*?)(?:Created by|$)/i)
  if (!teamResultsMatch) return results

  const resultsText = teamResultsMatch[1]
  
  const resultPattern = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(\d+)\s+(.+?)\s+(\d+)/g
  let match
  
  while ((match = resultPattern.exec(resultsText)) !== null) {
    results.push({
      date: match[1],
      team1: match[2].trim(),
      team1Score: parseInt(match[3], 10),
      team2: match[4].trim(),
      team2Score: parseInt(match[5], 10)
    })
  }

  return results
}

export async function syncMTTAPlayersToOpponents(teamName, opponentsStore, nameMappings = {}) {
  try {
    await opponentsStore.fetchOpponents()
    const mttaData = await fetchMTTATeamData(teamName)
    
    const syncedPlayers = []
    let findBestMatch = null
    
    try {
      const nameMatching = await import('../utils/nameMatching')
      findBestMatch = nameMatching.findBestMatch
    } catch (importError) {
      console.warn('Could not load name matching utility:', importError)
    }
    
    for (const player of mttaData.teamFormation) {
      let opponent = null
      let matchMethod = 'none'
      
      if (nameMappings[player.name]) {
        opponent = opponentsStore.opponents.find(o => o.id === nameMappings[player.name])
        if (opponent) matchMethod = 'manual mapping'
      }
      
      if (!opponent) {
        opponent = opponentsStore.getOpponentByName(player.name)
        if (opponent) matchMethod = 'exact match'
      }
      
      if (!opponent && findBestMatch) {
        const bestMatch = findBestMatch(player.name, opponentsStore.opponents, 0.55, teamName)
        if (bestMatch) {
          opponent = bestMatch.opponent
          matchMethod = 'fuzzy match'
          console.log(`Auto-matched "${player.name}" with "${opponent.name}" (score: ${(bestMatch.score * 100).toFixed(0)}%) - ${bestMatch.reason}`)
        } else {
          console.log(`No match found for "${player.name}" (tried fuzzy matching with threshold 0.55, team: ${teamName || 'any'})`)
        }
      }
      
      if (!opponent) {
        console.log(`Creating new player: "${player.name}"`)
      }
      
      if (opponent) {
        await opponentsStore.updateOpponent(opponent.id, {
          mttaRank: player.rank,
          mttaData: {
            rank: player.rank,
            lastSynced: new Date().toISOString()
          }
        })
        await opponentsStore.fetchOpponents()
        opponent = opponentsStore.opponents.find(o => o.id === opponent.id)
      } else {
        const opponentId = await opponentsStore.addOpponent({
          name: player.name,
          mttaRank: player.rank,
          mttaData: {
            rank: player.rank,
            lastSynced: new Date().toISOString()
          }
        })
        await opponentsStore.fetchOpponents()
        opponent = opponentsStore.opponents.find(o => o.id === opponentId) || await opponentsStore.getOpponent(opponentId)
      }
      
      if (opponent) {
        syncedPlayers.push(opponent)
      }
    }
    
    return {
      success: true,
      syncedCount: syncedPlayers.length,
      players: syncedPlayers
    }
  } catch (error) {
    console.error('Error syncing MTTA players:', error)
    throw error
  }
}

export async function findPotentialMatches(teamName, opponentsStore) {
  try {
    await opponentsStore.fetchOpponents()
    const mttaData = await fetchMTTATeamData(teamName)
    
    let findBestMatch = null
    try {
      const nameMatching = await import('../utils/nameMatching')
      findBestMatch = nameMatching.findBestMatch
    } catch (importError) {
      console.warn('Could not load name matching utility:', importError)
      return []
    }
    
    if (!findBestMatch) {
      return []
    }
    
    const potentialMatches = []
    
    for (const player of mttaData.teamFormation) {
      const exactMatch = opponentsStore.getOpponentByName(player.name)
      
      if (!exactMatch) {
        const bestMatch = findBestMatch(player.name, opponentsStore.opponents, 0.5, teamName)
        if (bestMatch) {
          potentialMatches.push({
            mttaName: player.name,
            mttaRank: player.rank,
            existingPlayer: bestMatch.opponent,
            matchScore: bestMatch.score,
            reason: bestMatch.reason
          })
        }
      }
    }
    
    return potentialMatches
  } catch (error) {
    console.error('Error finding potential matches:', error)
    return []
  }
}
