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

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref([])
  const loading = ref(false)

  const fetchGoals = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'goals'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      goals.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        targetDate: doc.data().targetDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      loading.value = false
    }
  }

  const addGoal = async (goalData) => {
    try {
      const docRef = await addDoc(collection(db, 'goals'), {
        ...goalData,
        targetDate: goalData.targetDate ? Timestamp.fromDate(goalData.targetDate) : null,
        createdAt: Timestamp.now()
      })
      await fetchGoals()
      return docRef.id
    } catch (error) {
      console.error('Error adding goal:', error)
      throw error
    }
  }

  const updateGoal = async (id, goalData) => {
    try {
      const docRef = doc(db, 'goals', id)
      const updateData = { ...goalData }
      if (updateData.targetDate instanceof Date) {
        updateData.targetDate = Timestamp.fromDate(updateData.targetDate)
      }
      await updateDoc(docRef, updateData)
      await fetchGoals()
    } catch (error) {
      console.error('Error updating goal:', error)
      throw error
    }
  }

  const deleteGoal = async (id) => {
    try {
      await deleteDoc(doc(db, 'goals', id))
      await fetchGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  return {
    goals,
    loading,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal
  }
})

