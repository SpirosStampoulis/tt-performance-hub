import { ref } from 'vue'
import { fetchMTTATeamData, syncMTTAPlayersToOpponents, findPotentialMatches } from '../services/mtta'
import { useOpponentsStore } from '../stores/opponents'

export function useMTTA() {
  const loading = ref(false)
  const error = ref(null)
  const teamData = ref(null)
  const potentialMatches = ref([])

  const fetchTeamData = async (teamName) => {
    loading.value = true
    error.value = null
    teamData.value = null
    potentialMatches.value = []

    try {
      const data = await fetchMTTATeamData(teamName)
      teamData.value = data
      
      try {
        const opponentsStore = useOpponentsStore()
        await opponentsStore.fetchOpponents()
        const matches = await findPotentialMatches(teamName, opponentsStore)
        potentialMatches.value = matches
      } catch (matchError) {
        console.warn('Error finding potential matches (non-critical):', matchError)
        potentialMatches.value = []
      }
      
      return data
    } catch (err) {
      error.value = err.message || 'Failed to fetch MTTA data'
      console.error('Error fetching MTTA team data:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const syncPlayers = async (teamName, nameMappings = {}) => {
    loading.value = true
    error.value = null

    try {
      const opponentsStore = useOpponentsStore()
      const result = await syncMTTAPlayersToOpponents(teamName, opponentsStore, nameMappings)
      return result
    } catch (err) {
      error.value = err.message || 'Failed to sync MTTA players'
      console.error('Error syncing MTTA players:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    teamData,
    potentialMatches,
    fetchTeamData,
    syncPlayers
  }
}
