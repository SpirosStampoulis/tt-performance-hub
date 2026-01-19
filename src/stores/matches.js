import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useTournamentsStore } from './tournaments'
import { useOpponentsStore } from './opponents'

export const useMatchesStore = defineStore('matches', () => {
  const matches = ref([])
  const loading = ref(false)
  const tournamentsStore = useTournamentsStore()
  const opponentsStore = useOpponentsStore()

  const fetchMatches = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'matches'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      matches.value = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const matchDate = data.date?.toDate()
        const hasScores = data.scores && data.scores.length > 0 && 
          data.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
        const isFuture = matchDate && matchDate > new Date()
        
        // Auto-set status for existing matches without status
        let status = data.status
        if (!status) {
          if (hasScores) {
            status = 'completed'
          } else if (isFuture) {
            status = 'scheduled'
          } else {
            status = 'completed' // Default for past matches without scores
          }
        }
        
        return {
          id: doc.id,
          ...data,
          status,
          date: matchDate
        }
      })
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      loading.value = false
    }
  }

  const getMatch = async (id) => {
    try {
      const docRef = doc(db, 'matches', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          date: docSnap.data().date?.toDate()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching match:', error)
      return null
    }
  }

  const addMatch = async (matchData) => {
    try {
      const docRef = await addDoc(collection(db, 'matches'), {
        ...matchData,
        date: Timestamp.fromDate(matchData.date),
        createdAt: Timestamp.now()
      })
      await fetchMatches()
      return docRef.id
    } catch (error) {
      console.error('Error adding match:', error)
      throw error
    }
  }

  const updateMatch = async (id, matchData) => {
    try {
      const docRef = doc(db, 'matches', id)
      await updateDoc(docRef, {
        ...matchData,
        date: Timestamp.fromDate(matchData.date)
      })
      await fetchMatches()
    } catch (error) {
      console.error('Error updating match:', error)
      throw error
    }
  }

  const deleteMatch = async (id) => {
    try {
      await deleteDoc(doc(db, 'matches', id))
      await fetchMatches()
    } catch (error) {
      console.error('Error deleting match:', error)
      throw error
    }
  }

  const getMatchesByOpponent = (playerId) => {
    return matches.value.filter(m => 
      m.player1Id === playerId || m.player2Id === playerId || m.opponentId === playerId
    )
  }

  const totalMatches = computed(() => matches.value.length)

  const winLossRecord = computed(() => {
    let wins = 0
    let losses = 0
    
    matches.value.forEach(match => {
      if (!match.scores || match.scores.length === 0) return
      const myTotalScore = match.scores.reduce((sum, s) => sum + (s.myScore || s.player1Score || 0), 0)
      const oppTotalScore = match.scores.reduce((sum, s) => sum + (s.oppScore || s.player2Score || 0), 0)
      
      if (myTotalScore > oppTotalScore) wins++
      else if (oppTotalScore > myTotalScore) losses++
    })
    
    return { wins, losses }
  })

  const winPercentage = computed(() => {
    const { wins, losses } = winLossRecord.value
    const total = wins + losses
    return total > 0 ? ((wins / total) * 100).toFixed(1) : 0
  })


  const headToHeadStats = (playerId) => {
    const playerMatches = getMatchesByOpponent(playerId)
    let wins = 0
    let losses = 0
    
    playerMatches.forEach(match => {
      if (!match.scores || match.scores.length === 0) return
      const isPlayer1 = match.player1Id === playerId || match.opponentId === playerId
      
      let player1Sets = 0
      let player2Sets = 0
      
      match.scores.forEach(score => {
        const p1Score = score.player1Score || score.myScore || 0
        const p2Score = score.player2Score || score.oppScore || 0
        if (p1Score > p2Score) player1Sets++
        else if (p2Score > p1Score) player2Sets++
      })
      
      if (isPlayer1) {
        if (player1Sets > player2Sets) wins++
        else if (player2Sets > player1Sets) losses++
      } else {
        if (player2Sets > player1Sets) wins++
        else if (player1Sets > player2Sets) losses++
      }
    })
    
    return { 
      wins, 
      losses, 
      total: playerMatches.length,
      winRate: playerMatches.length > 0 ? ((wins / playerMatches.length) * 100).toFixed(1) : 0
    }
  }

  const recentMatches = computed(() => {
    return matches.value.slice(0, 5)
  })

  const advancedStats = computed(() => {
    let totalSetsWon = 0
    let totalSetsLost = 0
    let totalServeSuccess = 0
    let totalReturnPoints = 0
    let serveCount = 0
    let returnCount = 0
    let totalMatchDuration = 0
    let matchCount = 0

    matches.value.forEach(match => {
      if (!match.scores || match.scores.length === 0) return
      let player1Sets = 0
      let player2Sets = 0

      match.scores.forEach(score => {
        const p1Score = score.player1Score || score.myScore || 0
        const p2Score = score.player2Score || score.oppScore || 0
        if (p1Score > p2Score) {
          player1Sets++
          totalSetsWon++
        } else if (p2Score > p1Score) {
          player2Sets++
          totalSetsLost++
        }
      })

      if (match.serveStats) {
        if (match.serveStats.successRate !== undefined) {
          totalServeSuccess += match.serveStats.successRate
          serveCount++
        }
        if (match.serveStats.returnPoints !== undefined) {
          totalReturnPoints += match.serveStats.returnPoints
          returnCount++
        }
      }

      if (match.duration) {
        totalMatchDuration += match.duration
        matchCount++
      }
    })

    const totalSets = totalSetsWon + totalSetsLost
    const setsWonPercentage = totalSets > 0 ? ((totalSetsWon / totalSets) * 100).toFixed(1) : 0
    const averageServeSuccess = serveCount > 0 ? (totalServeSuccess / serveCount).toFixed(1) : 0
    const averageReturnPoints = returnCount > 0 ? (totalReturnPoints / returnCount).toFixed(1) : 0
    const averageMatchDuration = matchCount > 0 ? (totalMatchDuration / matchCount).toFixed(0) : 0

    return {
      totalSetsWon,
      totalSetsLost,
      setsWonPercentage,
      averageServeSuccess,
      averageReturnPoints,
      averageMatchDuration,
      totalSets
    }
  })

  const performanceByMonth = computed(() => {
    const monthlyData = {}
    
    matches.value.forEach(match => {
      if (!match.date || !match.scores || match.scores.length === 0) return
      const date = match.date instanceof Date ? match.date : match.date.toDate()
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { wins: 0, losses: 0, matches: 0 }
      }
      
      monthlyData[monthKey].matches++
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (myTotal > oppTotal) {
        monthlyData[monthKey].wins++
      } else if (oppTotal > myTotal) {
        monthlyData[monthKey].losses++
      }
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data,
        winRate: data.matches > 0 ? ((data.wins / data.matches) * 100).toFixed(1) : 0
      }))
  })

  const setsTrend = computed(() => {
    const sortedMatches = [...matches.value]
      .filter(m => m.date)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateA - dateB
      })

    return sortedMatches.map(match => {
      let setsWon = 0
      let setsLost = 0

      if (match.scores && match.scores.length > 0) {
        match.scores.forEach(score => {
          const p1Score = score.player1Score || score.myScore || 0
          const p2Score = score.player2Score || score.oppScore || 0
          if (p1Score > p2Score) setsWon++
          else if (p2Score > p1Score) setsLost++
        })
      }

      return {
        date: match.date instanceof Date ? match.date : match.date.toDate(),
        setsWon,
        setsLost
      }
    })
  })

  const getMatchesBetweenPlayers = (player1Id, player2Id) => {
    return matches.value.filter(m => {
      if (!m.scores || m.scores.length === 0) return false
      const hasPlayer1 = m.player1Id === player1Id || m.player2Id === player1Id || m.opponentId === player1Id
      const hasPlayer2 = m.player1Id === player2Id || m.player2Id === player2Id || m.opponentId === player2Id
      return hasPlayer1 && hasPlayer2
    })
  }

  const getHeadToHeadBetweenPlayers = (player1Id, player2Id) => {
    const matches = getMatchesBetweenPlayers(player1Id, player2Id)
    let player1Wins = 0
    let player2Wins = 0
    
    matches.forEach(match => {
      const isPlayer1First = match.player1Id === player1Id || match.opponentId === player1Id
      
      let player1Sets = 0
      let player2Sets = 0
      
      match.scores.forEach(score => {
        const p1Score = score.player1Score || score.myScore || 0
        const p2Score = score.player2Score || score.oppScore || 0
        if (p1Score > p2Score) player1Sets++
        else if (p2Score > p1Score) player2Sets++
      })
      
      if (isPlayer1First) {
        if (player1Sets > player2Sets) player1Wins++
        else if (player2Sets > player1Sets) player2Wins++
      } else {
        if (player2Sets > player1Sets) player1Wins++
        else if (player1Sets > player2Sets) player2Wins++
      }
    })
    
    return {
      total: matches.length,
      player1Wins,
      player2Wins,
      player1WinRate: matches.length > 0 ? ((player1Wins / matches.length) * 100).toFixed(1) : 0
    }
  }

  const predictMatchBetweenPlayers = (player1Id, player2Id, tournamentId = null) => {
    if (!player1Id || !player2Id) {
      return {
        winProbability: 50,
        confidence: 'low',
        factors: ['Both players must be selected'],
        recommendation: 'Select both players to get a prediction',
        commonOpponents: [],
        mttaComparison: null
      }
    }

    const currentYear = new Date().getFullYear()
    let leagueTournamentId = tournamentId

    if (!leagueTournamentId) {
      const leagueMatches = matches.value.filter(m => {
        if (!m.tournamentId) return false
        const tournament = tournamentsStore?.tournaments?.find(t => t.id === m.tournamentId)
        return tournament && (tournament.type === 'League' || tournament.type === 'Simple League')
      })
      
      if (leagueMatches.length > 0) {
        const tournamentIds = [...new Set(leagueMatches.map(m => m.tournamentId))]
        const currentTournaments = tournamentIds
          .map(id => tournamentsStore?.tournaments?.find(t => t.id === id))
          .filter(t => t && (t.year === currentYear || t.year === String(currentYear)))
          .sort((a, b) => {
            const yearA = parseInt(a.year) || 0
            const yearB = parseInt(b.year) || 0
            return yearB - yearA
          })
        
        if (currentTournaments.length > 0) {
          leagueTournamentId = currentTournaments[0].id
        }
      }
    }

    const player1Matches = matches.value.filter(m => {
      if (leagueTournamentId && m.tournamentId !== leagueTournamentId) return false
      return (m.player1Id === player1Id || m.player2Id === player1Id || m.opponentId === player1Id) &&
             m.scores && m.scores.length > 0
    })

    const player2Matches = matches.value.filter(m => {
      if (leagueTournamentId && m.tournamentId !== leagueTournamentId) return false
      return (m.player1Id === player2Id || m.player2Id === player2Id || m.opponentId === player2Id) &&
             m.scores && m.scores.length > 0
    })

    const player1Opponents = new Set()
    player1Matches.forEach(m => {
      if (m.player1Id === player1Id) {
        if (m.player2Id) player1Opponents.add(m.player2Id)
        if (m.opponentId) player1Opponents.add(m.opponentId)
      } else if (m.player2Id === player1Id) {
        if (m.player1Id) player1Opponents.add(m.player1Id)
      } else if (m.opponentId === player1Id) {
        if (m.player1Id) player1Opponents.add(m.player1Id)
        if (m.player2Id) player1Opponents.add(m.player2Id)
      }
    })

    const player2Opponents = new Set()
    player2Matches.forEach(m => {
      if (m.player1Id === player2Id) {
        if (m.player2Id) player2Opponents.add(m.player2Id)
        if (m.opponentId) player2Opponents.add(m.opponentId)
      } else if (m.player2Id === player2Id) {
        if (m.player1Id) player2Opponents.add(m.player1Id)
      } else if (m.opponentId === player2Id) {
        if (m.player1Id) player2Opponents.add(m.player1Id)
        if (m.player2Id) player2Opponents.add(m.player2Id)
      }
    })

    const commonOpponentIds = [...player1Opponents].filter(id => 
      id !== player1Id && id !== player2Id && player2Opponents.has(id)
    )

    const commonOpponents = commonOpponentIds.map(opponentId => {
      const player1OppMatches = player1Matches.filter(m => {
        return (m.player1Id === opponentId || m.player2Id === opponentId || m.opponentId === opponentId) &&
               (m.player1Id === player1Id || m.player2Id === player1Id || m.opponentId === player1Id)
      })

      const player2OppMatches = player2Matches.filter(m => {
        return (m.player1Id === opponentId || m.player2Id === opponentId || m.opponentId === opponentId) &&
               (m.player1Id === player2Id || m.player2Id === player2Id || m.opponentId === player2Id)
      })

      let player1Wins = 0
      let player1Losses = 0
      let player2Wins = 0
      let player2Losses = 0

      const player1MatchDetails = []
      player1OppMatches.forEach(match => {
        const isPlayer1First = match.player1Id === player1Id || match.opponentId === player1Id
        let player1Sets = 0
        let opponentSets = 0
        const setScores = []

        match.scores.forEach(score => {
          const p1Score = score.player1Score || score.myScore || 0
          const p2Score = score.player2Score || score.oppScore || 0
          
          if (isPlayer1First) {
            if (p1Score > p2Score) player1Sets++
            else if (p2Score > p1Score) opponentSets++
            setScores.push(`${p1Score}-${p2Score}`)
          } else {
            if (p2Score > p1Score) player1Sets++
            else if (p1Score > p2Score) opponentSets++
            setScores.push(`${p2Score}-${p1Score}`)
          }
        })

        const matchResult = player1Sets > opponentSets ? 'W' : opponentSets > player1Sets ? 'L' : 'D'
        const setScoreDisplay = `${player1Sets}-${opponentSets}`
        const detailedScores = setScores.join(' ')

        if (player1Sets > opponentSets) player1Wins++
        else if (opponentSets > player1Sets) player1Losses++

        player1MatchDetails.push({
          result: matchResult,
          setScore: setScoreDisplay,
          detailedScores: detailedScores,
          date: match.date
        })
      })

      const player2MatchDetails = []
      player2OppMatches.forEach(match => {
        const isPlayer2First = match.player1Id === player2Id || match.opponentId === player2Id
        let player2Sets = 0
        let opponentSets = 0
        const setScores = []

        match.scores.forEach(score => {
          const p1Score = score.player1Score || score.myScore || 0
          const p2Score = score.player2Score || score.oppScore || 0
          
          if (isPlayer2First) {
            if (p1Score > p2Score) player2Sets++
            else if (p2Score > p1Score) opponentSets++
            setScores.push(`${p1Score}-${p2Score}`)
          } else {
            if (p2Score > p1Score) player2Sets++
            else if (p1Score > p2Score) opponentSets++
            setScores.push(`${p2Score}-${p1Score}`)
          }
        })

        const matchResult = player2Sets > opponentSets ? 'W' : opponentSets > player2Sets ? 'L' : 'D'
        const setScoreDisplay = `${player2Sets}-${opponentSets}`
        const detailedScores = setScores.join(' ')

        if (player2Sets > opponentSets) player2Wins++
        else if (opponentSets > player2Sets) player2Losses++

        player2MatchDetails.push({
          result: matchResult,
          setScore: setScoreDisplay,
          detailedScores: detailedScores,
          date: match.date
        })
      })

      const player1WinRate = (player1Wins + player1Losses) > 0 
        ? (player1Wins / (player1Wins + player1Losses)) * 100 
        : 0
      const player2WinRate = (player2Wins + player2Losses) > 0 
        ? (player2Wins / (player2Wins + player2Losses)) * 100 
        : 0

      return {
        opponentId,
        player1Wins,
        player1Losses,
        player1WinRate,
        player2Wins,
        player2Losses,
        player2WinRate,
        advantage: player1WinRate - player2WinRate,
        player1Matches: player1MatchDetails,
        player2Matches: player2MatchDetails
      }
    })

    const h2h = getHeadToHeadBetweenPlayers(player1Id, player2Id)

    let winProbability = 50
    const factors = []
    let confidence = 'low'

    if (commonOpponents.length > 0) {
      const avgAdvantage = commonOpponents.reduce((sum, co) => sum + co.advantage, 0) / commonOpponents.length
      winProbability = 50 + (avgAdvantage * 0.5)
      factors.push(`Based on ${commonOpponents.length} common opponent(s) in current season`)
      
      if (commonOpponents.length >= 3) {
        confidence = 'high'
      } else if (commonOpponents.length >= 2) {
        confidence = 'medium'
      }
    } else {
      factors.push('No common opponents found in current season league tournament')
    }

    if (h2h.total > 0) {
      const h2hWeight = Math.min(h2h.total / 5, 1) * 0.3
      const commonOpponentsWeight = 0.5
      const mttaWeight = 0.2

      const h2hAdjustment = (parseFloat(h2h.player1WinRate) - 50) * h2hWeight
      winProbability = 50 + (winProbability - 50) * commonOpponentsWeight + h2hAdjustment

      factors.push(`Head-to-head: ${h2h.player1Wins}-${h2h.player2Wins} (${h2h.player1WinRate}% win rate)`)

      if (h2h.total >= 3) {
        confidence = confidence === 'low' ? 'medium' : confidence
      }
    }

    const player1 = opponentsStore?.opponents?.find(o => o.id === player1Id)
    const player2 = opponentsStore?.opponents?.find(o => o.id === player2Id)

    let mttaComparison = null
    if (player1?.mttaRank && player2?.mttaRank) {
      const rankDiff = player2.mttaRank - player1.mttaRank
      mttaComparison = {
        player1Rank: player1.mttaRank,
        player2Rank: player2.mttaRank,
        rankDifference: rankDiff,
        advantage: rankDiff > 0 ? 'player1' : rankDiff < 0 ? 'player2' : 'even'
      }

      if (Math.abs(rankDiff) > 0) {
        const mttaAdjustment = Math.min(Math.abs(rankDiff) * 2, 15) * (rankDiff > 0 ? 1 : -1)
        winProbability += mttaAdjustment
        const betterPlayer = rankDiff > 0 ? player1 : player2
        factors.push(`MTTA Ranking: ${player1.mttaRank} vs ${player2.mttaRank} (${betterPlayer.name} ranked ${Math.abs(rankDiff)} position${Math.abs(rankDiff) !== 1 ? 's' : ''} higher)`)
      } else {
        factors.push(`MTTA Ranking: Both players ranked ${player1.mttaRank}`)
      }
    } else {
      if (player1 && !player1.mttaRank) {
        factors.push(`${player1.name} MTTA ranking not available`)
      }
      if (player2 && !player2.mttaRank) {
        factors.push(`${player2.name} MTTA ranking not available`)
      }
    }

    winProbability = Math.max(10, Math.min(90, winProbability))

    let recommendation = ''
    if (winProbability >= 70) {
      recommendation = 'Strong favorite - maintain consistent play'
    } else if (winProbability >= 60) {
      recommendation = 'Favorable matchup - execute game plan confidently'
    } else if (winProbability >= 50) {
      recommendation = 'Even matchup - focus on key moments'
    } else if (winProbability >= 40) {
      recommendation = 'Challenging matchup - adapt strategy as needed'
    } else {
      recommendation = 'Underdog position - play with focus and determination'
    }

    return {
      winProbability: Math.round(winProbability),
      confidence,
      factors,
      recommendation,
      commonOpponents,
      mttaComparison,
      headToHead: h2h,
      tournamentId: leagueTournamentId
    }
  }

  const predictMatchup = (opponentId, opponentData = null, currentPlayerId = null) => {
    const headToHead = headToHeadStats(opponentId)
    const opponentMatches = getMatchesByOpponent(opponentId)
    
    let playerToPlayerH2H = null
    if (currentPlayerId && opponentId) {
      playerToPlayerH2H = getHeadToHeadBetweenPlayers(currentPlayerId, opponentId)
    }
    
    if (opponentMatches.length === 0) {
      return {
        winProbability: 50,
        confidence: 'low',
        factors: ['No previous matches against this opponent'],
        recommendation: 'Focus on fundamentals and adapt to their playing style',
        mttaRanking: null,
        playerToPlayerH2H: playerToPlayerH2H
      }
    }

    const recentMatches = [...opponentMatches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })
      .slice(0, 10)

    const recentWins = recentMatches.filter(m => {
      if (!m.scores || m.scores.length === 0) return false
      const isPlayer1 = m.player1Id === opponentId || m.opponentId === opponentId
      let player1Sets = 0
      let player2Sets = 0
      
      m.scores.forEach(score => {
        const p1Score = score.player1Score || score.myScore || 0
        const p2Score = score.player2Score || score.oppScore || 0
        if (p1Score > p2Score) player1Sets++
        else if (p2Score > p1Score) player2Sets++
      })
      
      if (isPlayer1) {
        return player1Sets < player2Sets
      } else {
        return player2Sets < player1Sets
      }
    }).length

    const recentWinRate = recentMatches.length > 0 ? (recentWins / recentMatches.length) * 100 : 0
    const overallWinRate = parseFloat(headToHead.winRate) || 50

    let winProbability = (recentWinRate * 0.6) + (overallWinRate * 0.4)
    
    if (recentMatches.length < 3) {
      winProbability = overallWinRate
    }

    const factors = []
    if (overallWinRate >= 70) {
      factors.push(`Strong historical record (${overallWinRate}% win rate)`)
    } else if (overallWinRate <= 30) {
      factors.push(`Challenging opponent (${overallWinRate}% win rate)`)
    }

    if (recentWinRate >= 70 && recentMatches.length >= 3) {
      factors.push('Excellent recent form against this opponent')
    } else if (recentWinRate <= 30 && recentMatches.length >= 3) {
      factors.push('Struggling in recent matches')
    }

    if (headToHead.total >= 5) {
      factors.push(`Based on ${headToHead.total} previous matches`)
    } else {
      factors.push(`Limited match history (${headToHead.total} matches)`)
    }

    let confidence = 'medium'
    if (headToHead.total >= 5 && recentMatches.length >= 5) {
      confidence = 'high'
    } else if (headToHead.total < 3) {
      confidence = 'low'
    }

    let recommendation = ''
    if (winProbability >= 70) {
      recommendation = 'Play with confidence - maintain your winning strategy'
    } else if (winProbability >= 55) {
      recommendation = 'Slight advantage - focus on executing your game plan'
    } else if (winProbability >= 45) {
      recommendation = 'Even matchup - every point will be crucial'
    } else if (winProbability >= 30) {
      recommendation = 'Challenging opponent - consider adjusting tactics'
    } else {
      recommendation = 'Underdog position - focus on fundamentals and stay positive'
    }

    let mttaRanking = null
    if (opponentData) {
      mttaRanking = {
        opponent: {
          startPosition: opponentData.mttaStartPosition,
          currentPosition: opponentData.mttaCurrentPosition,
          totalPoints: opponentData.mttaTotalPoints
        }
      }
    }

    if (mttaRanking && mttaRanking.opponent.currentPosition) {
      const rankingDiff = mttaRanking.opponent.currentPosition
      if (rankingDiff <= 10) {
        factors.push(`Opponent is highly ranked (Position ${mttaRanking.opponent.currentPosition})`)
        if (winProbability > 50) {
          winProbability = Math.max(45, winProbability - 5)
        }
      } else if (rankingDiff <= 20) {
        factors.push(`Opponent is well-ranked (Position ${mttaRanking.opponent.currentPosition})`)
      } else if (rankingDiff >= 50) {
        factors.push(`Opponent is lower ranked (Position ${mttaRanking.opponent.currentPosition})`)
        if (winProbability < 70) {
          winProbability = Math.min(75, winProbability + 5)
        }
      }
      
      if (mttaRanking.opponent.startPosition && mttaRanking.opponent.currentPosition) {
        const positionChange = mttaRanking.opponent.startPosition - mttaRanking.opponent.currentPosition
        if (positionChange > 0) {
          factors.push(`Opponent has improved ${positionChange} positions (${mttaRanking.opponent.startPosition} → ${mttaRanking.opponent.currentPosition})`)
        } else if (positionChange < 0) {
          factors.push(`Opponent has dropped ${Math.abs(positionChange)} positions (${mttaRanking.opponent.startPosition} → ${mttaRanking.opponent.currentPosition})`)
        }
      }
    }

    return {
      winProbability: Math.round(Math.max(0, Math.min(100, winProbability))),
      confidence,
      factors,
      recommendation,
      headToHead: {
        wins: headToHead.wins,
        losses: headToHead.losses,
        total: headToHead.total,
        winRate: overallWinRate
      },
      recentForm: {
        wins: recentWins,
        total: recentMatches.length,
        winRate: recentWinRate
      },
      mttaRanking,
      playerToPlayerH2H: playerToPlayerH2H
    }
  }

  return {
    matches,
    loading,
    fetchMatches,
    getMatch,
    addMatch,
    updateMatch,
    deleteMatch,
    getMatchesByOpponent,
    totalMatches,
    winLossRecord,
    winPercentage,
    headToHeadStats,
    recentMatches,
    advancedStats,
    performanceByMonth,
    setsTrend,
    predictMatchup,
    getMatchesBetweenPlayers,
    getHeadToHeadBetweenPlayers,
    predictMatchBetweenPlayers
  }
})

