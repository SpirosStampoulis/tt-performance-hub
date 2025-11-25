import { ref } from 'vue'

export function useLoading() {
  const loading = ref(false)
  const error = ref(null)

  const withLoading = async (asyncFn) => {
    loading.value = true
    error.value = null
    try {
      return await asyncFn()
    } catch (err) {
      error.value = err.message || 'An error occurred'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    withLoading
  }
}

