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

export const useOpponentsStore = defineStore('opponents', () => {
  const opponents = ref([])
  const loading = ref(false)

  const fetchOpponents = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'opponents'), orderBy('name'))
      const querySnapshot = await getDocs(q)
      opponents.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      loading.value = false
    }
  }

  const getOpponent = async (id) => {
    try {
      const docRef = doc(db, 'opponents', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching player:', error)
      return null
    }
  }

  const addOpponent = async (opponentData) => {
    try {
      const docRef = await addDoc(collection(db, 'opponents'), {
        ...opponentData,
        createdAt: Timestamp.now()
      })
      await fetchOpponents()
      return docRef.id
    } catch (error) {
      console.error('Error adding player:', error)
      throw error
    }
  }

  const updateOpponent = async (id, opponentData) => {
    try {
      const docRef = doc(db, 'opponents', id)
      await updateDoc(docRef, opponentData)
      await fetchOpponents()
    } catch (error) {
      console.error('Error updating player:', error)
      throw error
    }
  }

  const deleteOpponent = async (id) => {
    try {
      await deleteDoc(doc(db, 'opponents', id))
      await fetchOpponents()
    } catch (error) {
      console.error('Error deleting player:', error)
      throw error
    }
  }

  const getOpponentByName = (name) => {
    return opponents.value.find(o => o.name.toLowerCase() === name.toLowerCase())
  }

  return {
    opponents,
    loading,
    fetchOpponents,
    getOpponent,
    addOpponent,
    updateOpponent,
    deleteOpponent,
    getOpponentByName
  }
})

