import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { useMatchesStore } from './matches'

export const useStreaksStore = defineStore('streaks', () => {
  const milestones = ref([])
  const loading = ref(false)
  const matchesStore = useMatchesStore()

  const fetchMilestones = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'milestones'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      milestones.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching milestones:', error)
    } finally {
      loading.value = false
    }
  }

  const addMilestone = async (milestoneData) => {
    try {
      const docRef = await addDoc(collection(db, 'milestones'), {
        ...milestoneData,
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      })
      await fetchMilestones()
      return docRef.id
    } catch (error) {
      console.error('Error adding milestone:', error)
      throw error
    }
  }

  const deleteMilestone = async (id) => {
    try {
      await deleteDoc(doc(db, 'milestones', id))
      await fetchMilestones()
    } catch (error) {
      console.error('Error deleting milestone:', error)
      throw error
    }
  }

  const currentWinStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })

    if (sortedMatches.length === 0) return 0

    let streak = 0
    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (myTotal > oppTotal) {
        streak++
      } else {
        break
      }
    }

    return streak
  })

  const currentLossStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })

    if (sortedMatches.length === 0) return 0

    let streak = 0
    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (oppTotal > myTotal) {
        streak++
      } else {
        break
      }
    }

    return streak
  })

  const longestWinStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateA - dateB
      })

    let maxStreak = 0
    let currentStreak = 0

    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (myTotal > oppTotal) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return maxStreak
  })

  const longestLossStreak = computed(() => {
    const sortedMatches = [...matchesStore.matches]
      .filter(m => m.date && m.scores && m.scores.length > 0)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateA - dateB
      })

    let maxStreak = 0
    let currentStreak = 0

    for (const match of sortedMatches) {
      const myTotal = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      
      if (oppTotal > myTotal) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return maxStreak
  })

  const personalRecords = computed(() => {
    const matches = matchesStore.matches.filter(m => m.date && m.scores && m.scores.length > 0)
    
    if (matches.length === 0) {
      return {
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        bestTournamentFinish: null,
        mostConsecutiveWins: longestWinStreak.value,
        mostConsecutiveLosses: longestLossStreak.value
      }
    }

    const wins = matches.filter(m => {
      const myTotal = m.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
      const oppTotal = m.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
      return myTotal > oppTotal
    }).length

    const losses = matches.length - wins

    return {
      totalMatches: matches.length,
      totalWins: wins,
      totalLosses: losses,
      mostConsecutiveWins: longestWinStreak.value,
      mostConsecutiveLosses: longestLossStreak.value,
      currentWinStreak: currentWinStreak.value,
      currentLossStreak: currentLossStreak.value
    }
  })

  const checkMilestones = async () => {
    const records = personalRecords.value
    const newMilestones = []

    if (records.totalMatches === 10 || records.totalMatches === 25 || 
        records.totalMatches === 50 || records.totalMatches === 100 || 
        records.totalMatches === 200) {
      newMilestones.push({
        type: 'matches',
        title: `${records.totalMatches} Matches Played`,
        description: `You've played ${records.totalMatches} matches!`,
        category: 'milestone'
      })
    }

    if (records.totalWins === 10 || records.totalWins === 25 || 
        records.totalWins === 50 || records.totalWins === 100) {
      newMilestones.push({
        type: 'wins',
        title: `${records.totalWins} Wins Achieved`,
        description: `Congratulations on ${records.totalWins} wins!`,
        category: 'achievement'
      })
    }

    if (currentWinStreak.value === 5 || currentWinStreak.value === 10 || 
        currentWinStreak.value === 15) {
      newMilestones.push({
        type: 'streak',
        title: `${currentWinStreak.value} Match Win Streak`,
        description: `You're on fire with ${currentWinStreak.value} consecutive wins!`,
        category: 'achievement'
      })
    }

    if (longestWinStreak.value === 5 || longestWinStreak.value === 10 || 
        longestWinStreak.value === 15 || longestWinStreak.value === 20) {
      const existing = milestones.value.find(m => 
        m.type === 'longest_streak' && m.value === longestWinStreak.value
      )
      if (!existing) {
        newMilestones.push({
          type: 'longest_streak',
          title: `Longest Win Streak: ${longestWinStreak.value}`,
          description: `Your longest winning streak is ${longestWinStreak.value} matches!`,
          category: 'record',
          value: longestWinStreak.value
        })
      }
    }

    for (const milestone of newMilestones) {
      const exists = milestones.value.some(m => 
        m.type === milestone.type && 
        m.title === milestone.title &&
        Math.abs((m.date?.getTime() || 0) - Date.now()) < 86400000
      )
      
      if (!exists) {
        await addMilestone(milestone)
      }
    }
  }

  return {
    milestones,
    loading,
    fetchMilestones,
    addMilestone,
    deleteMilestone,
    currentWinStreak,
    currentLossStreak,
    longestWinStreak,
    longestLossStreak,
    personalRecords,
    checkMilestones
  }
})

