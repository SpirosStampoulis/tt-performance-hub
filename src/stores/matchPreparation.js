import { defineStore } from 'pinia'
import { ref } from 'vue'
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
import { useMatchesStore } from './matches'
import { useOpponentsStore } from './opponents'

export const useMatchPreparationStore = defineStore('matchPreparation', () => {
  const scoutingReports = ref([])
  const loading = ref(false)
  const matchesStore = useMatchesStore()
  const opponentsStore = useOpponentsStore()

  const fetchScoutingReports = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'scoutingReports'), orderBy('matchDate', 'desc'))
      const querySnapshot = await getDocs(q)
      scoutingReports.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        matchDate: doc.data().matchDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching scouting reports:', error)
    } finally {
      loading.value = false
    }
  }

  const getScoutingReport = async (id) => {
    try {
      const docRef = doc(db, 'scoutingReports', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          matchDate: docSnap.data().matchDate?.toDate()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching scouting report:', error)
      return null
    }
  }

  const addScoutingReport = async (reportData) => {
    try {
      const docRef = await addDoc(collection(db, 'scoutingReports'), {
        ...reportData,
        matchDate: Timestamp.fromDate(reportData.matchDate),
        createdAt: Timestamp.now()
      })
      await fetchScoutingReports()
      return docRef.id
    } catch (error) {
      console.error('Error adding scouting report:', error)
      throw error
    }
  }

  const updateScoutingReport = async (id, reportData) => {
    try {
      const docRef = doc(db, 'scoutingReports', id)
      await updateDoc(docRef, {
        ...reportData,
        matchDate: Timestamp.fromDate(reportData.matchDate)
      })
      await fetchScoutingReports()
    } catch (error) {
      console.error('Error updating scouting report:', error)
      throw error
    }
  }

  const deleteScoutingReport = async (id) => {
    try {
      await deleteDoc(doc(db, 'scoutingReports', id))
      await fetchScoutingReports()
    } catch (error) {
      console.error('Error deleting scouting report:', error)
      throw error
    }
  }

  const generateScoutingReport = (opponentId, matchDate = null) => {
    const opponent = opponentsStore.opponents.find(o => o.id === opponentId)
    if (!opponent) return null

    const PLAYER_NAME = 'Spiros Stampoulis'
    const currentPlayer = opponentsStore.opponents.find(o => o.name === PLAYER_NAME)
    const currentPlayerId = currentPlayer ? currentPlayer.id : null

    const prediction = matchesStore.predictMatchup(opponentId, opponent, currentPlayerId)
    const headToHead = matchesStore.headToHeadStats(opponentId)
    const matches = matchesStore.getMatchesByOpponent(opponentId)
    
    const recentMatches = [...matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })
      .slice(0, 5)

    const recentForm = recentMatches.map(m => {
      const myTotal = m.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = m.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      return myTotal > oppTotal ? 'W' : 'L'
    })

    const winProbability = prediction ? prediction.winProbability : calculateWinProbability(opponentId)
    
    const gamePlan = generateGamePlan(opponent, headToHead, recentForm, winProbability, prediction)
    
    const keyTactics = generateKeyTactics(opponent, headToHead, recentMatches, prediction)

    return {
      opponentId,
      opponentName: opponent.name,
      matchDate: matchDate || new Date(),
      headToHeadRecord: `${headToHead.wins}-${headToHead.losses}`,
      winRate: headToHead.winRate,
      recentForm: recentForm.join(''),
      winProbability,
      weaknesses: opponent.weaknesses || 'No weaknesses noted',
      playingStyle: opponent.playingStyle || 'Unknown',
      gamePlan,
      keyTactics,
      notes: '',
      mttaRanking: prediction ? prediction.mttaRanking : null,
      playerToPlayerH2H: prediction ? prediction.playerToPlayerH2H : null
    }
  }

  const calculateWinProbability = (opponentId) => {
    const headToHead = matchesStore.headToHeadStats(opponentId)
    const matches = matchesStore.getMatchesByOpponent(opponentId)
    
    if (matches.length < 3) return 50

    const recentMatches = [...matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })
      .slice(0, 10)

    const recentWins = recentMatches.filter(m => {
      const myTotal = m.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = m.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      return myTotal > oppTotal
    }).length

    const recentWinRate = (recentWins / recentMatches.length) * 100
    const overallWinRate = parseFloat(headToHead.winRate) || 50

    const weightedProbability = (recentWinRate * 0.6) + (overallWinRate * 0.4)
    
    return Math.round(Math.max(0, Math.min(100, weightedProbability)))
  }

  const generateGamePlan = (opponent, headToHead, recentForm, winProbability, prediction = null) => {
    const plans = []

    if (parseFloat(headToHead.winRate) >= 70) {
      plans.push('Maintain your winning strategy - you have a strong record against this opponent')
    } else if (parseFloat(headToHead.winRate) <= 30) {
      plans.push('Consider adjusting your approach - this opponent has been challenging')
    }

    if (recentForm.length > 0) {
      const recentWins = recentForm.filter(r => r === 'W').length
      if (recentWins >= 3) {
        plans.push('You\'ve been in good form recently - build on this momentum')
      } else if (recentWins === 0) {
        plans.push('Focus on fundamentals and stay positive - recent results can be improved')
      }
    }

    if (opponent.playingStyle === 'Aggressive') {
      plans.push('Be prepared for fast-paced rallies - focus on control and placement')
      plans.push('Use defensive shots to counter their aggressive play')
    } else if (opponent.playingStyle === 'Defensive') {
      plans.push('Be patient and wait for opportunities to attack')
      plans.push('Use spin and placement to break down their defense')
    }

    if (prediction && prediction.mttaRanking && prediction.mttaRanking.opponent) {
      const ranking = prediction.mttaRanking.opponent
      if (ranking.currentPosition && ranking.currentPosition <= 10) {
        plans.push('Opponent is highly ranked - prepare for high-level play and consistency')
      } else if (ranking.currentPosition && ranking.currentPosition >= 50) {
        plans.push('Opponent is lower ranked - but don\'t underestimate, play your game')
      }
      
      if (ranking.startPosition && ranking.currentPosition) {
        const improvement = ranking.startPosition - ranking.currentPosition
        if (improvement > 5) {
          plans.push(`Opponent has improved significantly (${improvement} positions) - they're in good form`)
        }
      }
    }

    if (winProbability >= 70) {
      plans.push('Play with confidence but stay focused - maintain your advantage')
    } else if (winProbability <= 40) {
      plans.push('Stay focused and execute your game plan - every point matters')
    }

    return plans.length > 0 ? plans : ['Focus on your strengths and execute your game plan']
  }

  const generateKeyTactics = (opponent, headToHead, recentMatches, prediction = null) => {
    const tactics = []

    if (opponent.weaknesses) {
      tactics.push(`Exploit weaknesses: ${opponent.weaknesses}`)
    }

    if (recentMatches.length > 0) {
      const lastMatch = recentMatches[0]
      if (lastMatch.notes) {
        tactics.push(`Previous match notes: ${lastMatch.notes.substring(0, 100)}...`)
      }
    }

    if (opponent.playingStyle) {
      tactics.push(`Playing style: ${opponent.playingStyle} - adjust your strategy accordingly`)
    }

    if (prediction && prediction.playerToPlayerH2H && prediction.playerToPlayerH2H.total > 0) {
      const h2h = prediction.playerToPlayerH2H
      if (parseFloat(h2h.player1WinRate) >= 60) {
        tactics.push(`Direct head-to-head favors you (${h2h.player1Wins}-${h2h.player2Wins}) - use what worked before`)
      } else if (parseFloat(h2h.player1WinRate) <= 40) {
        tactics.push(`Direct head-to-head is challenging (${h2h.player1Wins}-${h2h.player2Wins}) - try new approaches`)
      }
    }

    if (parseFloat(headToHead.winRate) >= 60) {
      tactics.push('You have a winning record - maintain your successful patterns')
    } else {
      tactics.push('Consider trying new tactics - current approach needs adjustment')
    }

    return tactics.length > 0 ? tactics : ['Focus on consistent play and minimizing errors']
  }

  return {
    scoutingReports,
    loading,
    fetchScoutingReports,
    getScoutingReport,
    addScoutingReport,
    updateScoutingReport,
    deleteScoutingReport,
    generateScoutingReport,
    calculateWinProbability
  }
})

