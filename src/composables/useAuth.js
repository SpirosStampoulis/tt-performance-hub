import { ref, onMounted } from 'vue'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'

const user = ref(null)
const loading = ref(true)
const isGuest = ref(false)

export function useAuth() {
  const checkAuth = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          user.value = firebaseUser
          isGuest.value = false
          sessionStorage.removeItem('guestUser')
        } else {
          const guestUser = sessionStorage.getItem('guestUser') === 'true'
          if (guestUser) {
            user.value = { uid: 'guest', email: 'guest@guest.com', isGuest: true }
            isGuest.value = true
          } else {
            user.value = null
            isGuest.value = false
          }
        }
        loading.value = false
        resolve(user.value)
      })
    })
  }

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      isGuest.value = false
      return userCredential.user
    } catch (error) {
      throw error
    }
  }

  const loginAsGuest = () => {
    user.value = { uid: 'guest', email: 'guest@guest.com', isGuest: true }
    isGuest.value = true
    sessionStorage.setItem('guestUser', 'true')
    return user.value
  }

  const logout = async () => {
    try {
      if (!isGuest.value) {
        await signOut(auth)
      }
      user.value = null
      isGuest.value = false
      sessionStorage.removeItem('guestUser')
    } catch (error) {
      throw error
    }
  }

  return {
    user,
    loading,
    isGuest,
    checkAuth,
    login,
    loginAsGuest,
    logout
  }
}

