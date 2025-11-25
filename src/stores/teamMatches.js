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
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../services/firebase'

export const useTeamMatchesStore = defineStore('teamMatches', () => {
  const teamMatches = ref([])
  const loading = ref(false)

  const fetchTeamMatches = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'teamMatches'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      teamMatches.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching team matches:', error)
    } finally {
      loading.value = false
    }
  }

  const getTeamMatch = async (id) => {
    try {
      const docRef = doc(db, 'teamMatches', id)
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
      console.error('Error fetching team match:', error)
      return null
    }
  }

  const addTeamMatch = async (teamMatchData) => {
    try {
      const docRef = await addDoc(collection(db, 'teamMatches'), {
        ...teamMatchData,
        date: Timestamp.fromDate(teamMatchData.date),
        createdAt: Timestamp.now()
      })
      await fetchTeamMatches()
      return docRef.id
    } catch (error) {
      console.error('Error adding team match:', error)
      throw error
    }
  }

  const updateTeamMatch = async (id, teamMatchData) => {
    try {
      const docRef = doc(db, 'teamMatches', id)
      const updateData = { ...teamMatchData }
      
      if (updateData.date instanceof Date) {
        updateData.date = Timestamp.fromDate(updateData.date)
      } else if (updateData.date && typeof updateData.date.toDate === 'function') {
        updateData.date = Timestamp.fromDate(updateData.date.toDate())
      }
      
      await updateDoc(docRef, updateData)
      await fetchTeamMatches()
    } catch (error) {
      console.error('Error updating team match:', error)
      throw error
    }
  }

  const deleteTeamMatch = async (id) => {
    try {
      await deleteDoc(doc(db, 'teamMatches', id))
      await fetchTeamMatches()
    } catch (error) {
      console.error('Error deleting team match:', error)
      throw error
    }
  }

  const getTeamMatchesByTournament = (tournamentId) => {
    return teamMatches.value.filter(tm => tm.tournamentId === tournamentId)
  }

  const getTeamMatchesByRound = (tournamentId, round) => {
    return teamMatches.value.filter(
      tm => tm.tournamentId === tournamentId && tm.round === round
    )
  }

  return {
    teamMatches,
    loading,
    fetchTeamMatches,
    getTeamMatch,
    addTeamMatch,
    updateTeamMatch,
    deleteTeamMatch,
    getTeamMatchesByTournament,
    getTeamMatchesByRound
  }
})

