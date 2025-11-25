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
      matches.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }))
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
      const myTotalScore = match.scores.reduce((sum, s) => sum + s.myScore, 0)
      const oppTotalScore = match.scores.reduce((sum, s) => sum + s.oppScore, 0)
      
      if (myTotalScore > oppTotalScore) wins++
      else losses++
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
        else losses++
      } else {
        if (player2Sets > player1Sets) wins++
        else losses++
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
    recentMatches
  }
})

