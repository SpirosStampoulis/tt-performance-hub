import { ref, onMounted } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

const user = ref(null)
const loading = ref(true)

export function useAuth() {
  const checkAuth = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false
        resolve(firebaseUser)
      })
    })
  }

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return userCredential.user
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    loading,
    checkAuth,
    login,
    logout
  }
}

