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

export const usePredictionsStore = defineStore('predictions', () => {
  const savedPredictions = ref([])
  const loading = ref(false)

  const fetchPredictions = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'predictions'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      savedPredictions.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      loading.value = false
    }
  }

  const addPrediction = async (predictionData) => {
    try {
      const docRef = await addDoc(collection(db, 'predictions'), {
        ...predictionData,
        createdAt: Timestamp.now()
      })
      await fetchPredictions()
      return docRef.id
    } catch (error) {
      console.error('Error saving prediction:', error)
      throw error
    }
  }

  const deletePrediction = async (id) => {
    try {
      await deleteDoc(doc(db, 'predictions', id))
      await fetchPredictions()
    } catch (error) {
      console.error('Error deleting prediction:', error)
      throw error
    }
  }

  return {
    savedPredictions,
    loading,
    fetchPredictions,
    addPrediction,
    deletePrediction
  }
})
