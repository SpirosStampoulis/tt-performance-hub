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

export const usePracticeStore = defineStore('practice', () => {
  const practiceSessions = ref([])
  const loading = ref(false)

  const fetchPracticeSessions = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'practiceSessions'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      practiceSessions.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching practice sessions:', error)
    } finally {
      loading.value = false
    }
  }

  const addPracticeSession = async (sessionData) => {
    try {
      const docRef = await addDoc(collection(db, 'practiceSessions'), {
        ...sessionData,
        date: Timestamp.fromDate(sessionData.date),
        createdAt: Timestamp.now()
      })
      await fetchPracticeSessions()
      return docRef.id
    } catch (error) {
      console.error('Error adding practice session:', error)
      throw error
    }
  }

  const updatePracticeSession = async (id, sessionData) => {
    try {
      const docRef = doc(db, 'practiceSessions', id)
      await updateDoc(docRef, {
        ...sessionData,
        date: Timestamp.fromDate(sessionData.date)
      })
      await fetchPracticeSessions()
    } catch (error) {
      console.error('Error updating practice session:', error)
      throw error
    }
  }

  const deletePracticeSession = async (id) => {
    try {
      await deleteDoc(doc(db, 'practiceSessions', id))
      await fetchPracticeSessions()
    } catch (error) {
      console.error('Error deleting practice session:', error)
      throw error
    }
  }

  return {
    practiceSessions,
    loading,
    fetchPracticeSessions,
    addPracticeSession,
    updatePracticeSession,
    deletePracticeSession
  }
})

