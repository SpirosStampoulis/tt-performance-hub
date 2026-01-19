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

export const useSkillRatingsStore = defineStore('skillRatings', () => {
  const ratings = ref([])
  const loading = ref(false)

  const fetchRatings = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'skillRatings'), orderBy('date', 'desc'))
      const querySnapshot = await getDocs(q)
      ratings.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }))
    } catch (error) {
      console.error('Error fetching skill ratings:', error)
    } finally {
      loading.value = false
    }
  }

  const addRating = async (ratingData) => {
    try {
      const docRef = await addDoc(collection(db, 'skillRatings'), {
        ...ratingData,
        date: Timestamp.fromDate(ratingData.date),
        createdAt: Timestamp.now()
      })
      await fetchRatings()
      return docRef.id
    } catch (error) {
      console.error('Error adding skill rating:', error)
      throw error
    }
  }

  const updateRating = async (id, ratingData) => {
    try {
      const docRef = doc(db, 'skillRatings', id)
      await updateDoc(docRef, {
        ...ratingData,
        date: Timestamp.fromDate(ratingData.date)
      })
      await fetchRatings()
    } catch (error) {
      console.error('Error updating skill rating:', error)
      throw error
    }
  }

  const deleteRating = async (id) => {
    try {
      await deleteDoc(doc(db, 'skillRatings', id))
      await fetchRatings()
    } catch (error) {
      console.error('Error deleting skill rating:', error)
      throw error
    }
  }

  const getRatingsBySkill = (skillId) => {
    return ratings.value
      .filter(r => r.skillId === skillId)
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : a.date.toDate()
        const dateB = b.date instanceof Date ? b.date : b.date.toDate()
        return dateB - dateA
      })
  }

  const getCurrentRating = (skillId) => {
    const skillRatings = getRatingsBySkill(skillId)
    if (skillRatings.length === 0) return null
    return skillRatings[0].rating
  }

  const getRatingTrend = (skillId) => {
    const skillRatings = getRatingsBySkill(skillId)
    if (skillRatings.length < 2) return null
    
    const sorted = [...skillRatings].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : a.date.toDate()
      const dateB = b.date instanceof Date ? b.date : b.date.toDate()
      return dateA - dateB
    })
    
    const first = sorted[0].rating
    const last = sorted[sorted.length - 1].rating
    const change = last - first
    
    return {
      change,
      changePercent: first > 0 ? ((change / first) * 100).toFixed(1) : 0,
      isImproving: change > 0,
      trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable'
    }
  }

  return {
    ratings,
    loading,
    fetchRatings,
    addRating,
    updateRating,
    deleteRating,
    getRatingsBySkill,
    getCurrentRating,
    getRatingTrend
  }
})




