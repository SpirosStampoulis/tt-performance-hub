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

export const useMatchesStore = defineStore('matches', () => {
  const matches = ref([])
  const loading = ref(false)

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
    getHeadToHeadBetweenPlayers
  }
})

