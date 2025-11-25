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
  Timestamp 
} from 'firebase/firestore'
import { db } from '../services/firebase'

export const useSkillsStore = defineStore('skills', () => {
  const skills = ref([])
  const loading = ref(false)

  const fetchSkills = async () => {
    loading.value = true
    try {
      const q = query(collection(db, 'skills'), orderBy('category'))
      const querySnapshot = await getDocs(q)
      skills.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      loading.value = false
    }
  }

  const getSkill = async (id) => {
    try {
      const docRef = doc(db, 'skills', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching skill:', error)
      return null
    }
  }

  const addSkill = async (skillData) => {
    try {
      const docRef = await addDoc(collection(db, 'skills'), {
        ...skillData,
        createdAt: Timestamp.now()
      })
      await fetchSkills()
      return docRef.id
    } catch (error) {
      console.error('Error adding skill:', error)
      throw error
    }
  }

  const updateSkill = async (id, skillData) => {
    try {
      const docRef = doc(db, 'skills', id)
      await updateDoc(docRef, skillData)
      await fetchSkills()
    } catch (error) {
      console.error('Error updating skill:', error)
      throw error
    }
  }

  const deleteSkill = async (id) => {
    try {
      await deleteDoc(doc(db, 'skills', id))
      await fetchSkills()
    } catch (error) {
      console.error('Error deleting skill:', error)
      throw error
    }
  }

  const skillsByCategory = computed(() => {
    const categories = {}
    skills.value.forEach(skill => {
      if (!categories[skill.category]) {
        categories[skill.category] = []
      }
      categories[skill.category].push(skill)
    })
    return categories
  })

  const categories = ['Serve', 'Return', 'Attack', 'Defense', 'Movement', 'Footwork', 'Tactics']

  return {
    skills,
    loading,
    categories,
    fetchSkills,
    getSkill,
    addSkill,
    updateSkill,
    deleteSkill,
    skillsByCategory
  }
})

