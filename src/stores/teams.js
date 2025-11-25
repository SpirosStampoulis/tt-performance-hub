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

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref([])
  const loading = ref(false)

  const fetchTeams = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'teams'), orderBy('name'))
      const querySnapshot = await getDocs(q)
      teams.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      loading.value = false
    }
  }

  const getTeam = async (id) => {
    try {
      const docRef = doc(db, 'teams', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching team:', error)
      return null
    }
  }

  const addTeam = async (teamData) => {
    try {
      const docRef = await addDoc(collection(db, 'teams'), {
        ...teamData,
        createdAt: Timestamp.now()
      })
      await fetchTeams()
      return docRef.id
    } catch (error) {
      console.error('Error adding team:', error)
      throw error
    }
  }

  const updateTeam = async (id, teamData) => {
    try {
      const docRef = doc(db, 'teams', id)
      await updateDoc(docRef, teamData)
      await fetchTeams()
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    }
  }

  const deleteTeam = async (id) => {
    try {
      await deleteDoc(doc(db, 'teams', id))
      await fetchTeams()
    } catch (error) {
      console.error('Error deleting team:', error)
      throw error
    }
  }

  const getTeamsByTournament = async (tournamentId) => {
    try {
      const q = query(
        collection(db, 'teams'),
        where('tournamentId', '==', tournamentId)
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching teams by tournament:', error)
      return []
    }
  }

  return {
    teams,
    loading,
    fetchTeams,
    getTeam,
    addTeam,
    updateTeam,
    deleteTeam,
    getTeamsByTournament
  }
})

