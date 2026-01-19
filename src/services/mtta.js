const MTTA_BASE_URL = 'https://results.mtta.mt'

const CORS_PROXY = import.meta.env.VITE_CORS_PROXY || ''

export async function fetchMTTATeamData(teamName) {
  try {
    const encodedTeamName = encodeURIComponent(teamName)
    const url = `${MTTA_BASE_URL}/teamplayers?team=${encodedTeamName}`
    
    const fetchUrl = CORS_PROXY ? `${CORS_PROXY}${url}` : url
    
    console.log('Fetching MTTA data from:', fetchUrl)
    console.log('CORS Proxy configured:', CORS_PROXY ? 'Yes' : 'No')
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch MTTA data: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    
    if (!html || html.length < 100) {
      throw new Error('Received empty or invalid response from MTTA website')
    }
    
    return parseMTTAHTML(html, teamName)
  } catch (error) {
    console.error('Error fetching MTTA team data:', error)
    
    let errorMessage = error.message || 'Failed to fetch MTTA data'
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS') || error.name === 'TypeError') {
      errorMessage = `CORS Error: The browser blocked the request to ${MTTA_BASE_URL}. You need to set up a CORS proxy. Add VITE_CORS_PROXY to your .env file. See MTTA_INTEGRATION.md for details.`
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
