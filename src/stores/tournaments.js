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
  Timestamp 
} from 'firebase/firestore'
import { db } from '../services/firebase'

export const useTournamentsStore = defineStore('tournaments', () => {
  const tournaments = ref([])
  const loading = ref(false)

  const fetchTournaments = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'tournaments'), orderBy('name'))
      const querySnapshot = await getDocs(q)
      tournaments.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    } finally {
      loading.value = false
    }
  }

  const getTournament = async (id) => {
    try {
      const docRef = doc(db, 'tournaments', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching tournament:', error)
      return null
    }
  }

  const addTournament = async (tournamentData) => {
    try {
      const docRef = await addDoc(collection(db, 'tournaments'), {
        ...tournamentData,
        createdAt: Timestamp.now()
      })
      await fetchTournaments()
      return docRef.id
    } catch (error) {
      console.error('Error adding tournament:', error)
      throw error
    }
  }

  const updateTournament = async (id, tournamentData) => {
    try {
      const docRef = doc(db, 'tournaments', id)
      await updateDoc(docRef, tournamentData)
      await fetchTournaments()
    } catch (error) {
      console.error('Error updating tournament:', error)
      throw error
    }
  }

  const deleteTournament = async (id) => {
    try {
      await deleteDoc(doc(db, 'tournaments', id))
      await fetchTournaments()
    } catch (error) {
      console.error('Error deleting tournament:', error)
      throw error
    }
  }

  const getTournamentByName = (name) => {
    return tournaments.value.find(t => t.name.toLowerCase() === name.toLowerCase())
  }

  const getDefaultTournament = () => {
    return tournaments.value.find(t => t.isDefault) || null
  }

  return {
    tournaments,
    loading,
    fetchTournaments,
    getTournament,
    addTournament,
    updateTournament,
    deleteTournament,
    getTournamentByName,
    getDefaultTournament
  }
})

