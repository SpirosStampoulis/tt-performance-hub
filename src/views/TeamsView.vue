<template>
  <v-container>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedTournament"
          :items="leagueTournaments"
          item-title="displayName"
          item-value="id"
          label="Select League"
          variant="outlined"
          density="comfortable"
        ></v-select>
      </v-col>
      <v-col cols="12" md="6" v-if="selectedTournament">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="showTeamDialog = true" :disabled="isGuest">
          Add Team
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="selectedTournament">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            Teams
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="tournamentTeams.length === 0" class="text-center text-medium-emphasis py-8">
            No teams added yet. Click "Add Team" to create teams for this tournament.
          </v-card-text>
          <v-expansion-panels v-else variant="accordion" class="mt-2">
            <v-expansion-panel
              v-for="team in tournamentTeams"
              :key="team.id"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center justify-space-between w-100 pr-4">
                  <div class="d-flex align-center">
                    <v-icon class="mr-2">mdi-shield-account</v-icon>
                    <div>
                      <div class="text-body-1 font-weight-bold">{{ team.name }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ getTeamPlayers(team).length }} player(s)
                      </div>
                    </div>
                    <v-chip v-if="team.isMyTeam" size="x-small" color="primary" class="ml-2">My Team</v-chip>
                  </div>
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <div v-if="getTeamPlayers(team).length === 0" class="text-center text-medium-emphasis py-4">
                  No players linked to this team. Players are linked when their "club" field matches the team name.
                </div>
                <div v-else>
                  <v-row>
                    <v-col
                      v-for="player in getTeamPlayers(team)"
                      :key="player.id"
                      cols="12"
                      md="6"
                      lg="4"
                    >
                      <v-card variant="outlined" class="player-card">
                        <v-card-title class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center">
                            <v-icon class="mr-2" color="primary">mdi-account</v-icon>
                            <div>
                              <div class="text-body-1 font-weight-bold">{{ player.name }}</div>
                              <div v-if="player.mttaRank" class="text-caption text-medium-emphasis">
                                MTTA Rank: #{{ player.mttaRank }}
                              </div>
                            </div>
                          </div>
                          <v-btn
                            icon="mdi-open-in-new"
                            size="small"
                            variant="text"
                            @click="viewPlayer(player.id)"
                          ></v-btn>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-card-text>
                          <div class="mb-3">
                            <div class="text-caption text-medium-emphasis mb-1">
                              Match Statistics
                              <span v-if="selectedTournament" class="text-caption text-primary">
                                ({{ tournamentsStore.tournaments.find(t => t.id === selectedTournament)?.name || 'Tournament' }})
                              </span>
                            </div>
                            <v-row>
                              <v-col cols="6">
                                <div class="text-center pa-2 bg-grey-lighten-4 rounded">
                                  <div class="text-h6 font-weight-bold text-primary">{{ getPlayerStats(player.id).totalMatches }}</div>
                                  <div class="text-caption">Total Matches</div>
                                </div>
                              </v-col>
                              <v-col cols="6">
                                <div class="text-center pa-2 bg-grey-lighten-4 rounded">
                                  <div class="text-h6 font-weight-bold" :class="getPlayerStats(player.id).winRate >= 50 ? 'text-success' : 'text-error'">
                                    {{ getPlayerStats(player.id).winRate }}%
                                  </div>
                                  <div class="text-caption">Win Rate</div>
                                </div>
                              </v-col>
                            </v-row>
                            <div class="mt-2 text-center">
                              <v-chip size="small" color="success" variant="flat" class="mr-1">
                                {{ getPlayerStats(player.id).wins }}W
                              </v-chip>
                              <v-chip size="small" color="error" variant="flat">
                                {{ getPlayerStats(player.id).losses }}L
                              </v-chip>
                            </div>
                          </div>
                          <div v-if="getPlayerRecentMatches(player.id).length > 0" class="mb-3">
                            <div class="text-caption text-medium-emphasis mb-1">Recent Matches</div>
                            <v-list density="compact">
                              <v-list-item
                                v-for="match in getPlayerRecentMatches(player.id)"
                                :key="match.id"
                                class="px-0"
                              >
                                <template v-slot:prepend>
                                  <v-chip
                                    :color="getMatchResult(match, player.id) === 'W' ? 'success' : getMatchResult(match, player.id) === 'L' ? 'error' : 'grey'"
                                    size="x-small"
                                    variant="flat"
                                  >
                                    {{ getMatchResult(match, player.id) }}
                                  </v-chip>
                                </template>
                                <v-list-item-title class="text-body-2">
                                  {{ getOpponentName(match, player.id) }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-caption">
                                  {{ formatDate(match.date) }}
                                </v-list-item-subtitle>
                              </v-list-item>
                            </v-list>
                          </div>
                          <div v-if="player.club" class="text-caption text-medium-emphasis">
                            <v-icon size="small" class="mr-1">mdi-shield</v-icon>
                            Club: {{ player.club }}
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>
              </v-expansion-panel-text>
              <template v-slot:actions>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  color="error"
                  variant="text"
                  @click.stop="confirmDeleteTeam(team)"
                  :disabled="isGuest"
                ></v-btn>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showTeamDialog" max-width="500">
      <v-card>
        <v-card-title>Add Team</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTeam.name"
            label="Team Name"
            variant="outlined"
          ></v-text-field>
          <v-checkbox
            v-model="newTeam.isMyTeam"
            label="This is my team"
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTeamDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addTeam" :disabled="isGuest">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTeamDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Team</v-card-title>
        <v-card-text>Are you sure you want to delete this team?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteTeamDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteTeam" :disabled="isGuest">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentsStore } from '../stores/tournaments'
import { useTeamsStore } from '../stores/teams'
import { useOpponentsStore } from '../stores/opponents'
import { useMatchesStore } from '../stores/matches'
import { useAuth } from '../composables/useAuth'
import { formatDate } from '../utils/date'

const router = useRouter()
const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()
const opponentsStore = useOpponentsStore()
const matchesStore = useMatchesStore()
const { isGuest } = useAuth()

const selectedTournament = ref(null)
const showTeamDialog = ref(false)
const deleteTeamDialog = ref(false)
const teamToDelete = ref(null)

const newTeam = ref({
  name: '',
  isMyTeam: false
})

const leagueTournaments = computed(() => {
  return tournamentsStore.tournaments
    .filter(t => t.type === 'League' || t.type === 'Simple League')
    .map(t => ({
      ...t,
      displayName: `${t.name} (${t.year})`
    }))
})

onMounted(async () => {
  await Promise.all([
    tournamentsStore.fetchTournaments(),
    teamsStore.fetchTeams(),
    opponentsStore.fetchOpponents(),
    matchesStore.fetchMatches()
  ])
  
  if (!selectedTournament.value && leagueTournaments.value.length > 0) {
    const defaultTournament = leagueTournaments.value.find(t => t.isDefault)
    if (defaultTournament) {
      selectedTournament.value = defaultTournament.id
    } else {
      selectedTournament.value = leagueTournaments.value[0].id
    }
  }
})

watch(leagueTournaments, (newTournaments) => {
  if (!selectedTournament.value && newTournaments.length > 0) {
    const defaultTournament = newTournaments.find(t => t.isDefault)
    if (defaultTournament) {
      selectedTournament.value = defaultTournament.id
    } else {
      selectedTournament.value = newTournaments[0].id
    }
  }
}, { immediate: true })

const tournamentTeams = computed(() => {
  if (!selectedTournament.value) return []
  return teamsStore.teams.filter(t => t.tournamentId === selectedTournament.value)
})

const addTeam = async () => {
  try {
    await teamsStore.addTeam({
      ...newTeam.value,
      tournamentId: selectedTournament.value
    })
    showTeamDialog.value = false
    newTeam.value = { name: '', isMyTeam: false }
  } catch (error) {
    console.error('Error adding team:', error)
  }
}

const confirmDeleteTeam = (team) => {
  teamToDelete.value = team
  deleteTeamDialog.value = true
}

const deleteTeam = async () => {
  try {
    await teamsStore.deleteTeam(teamToDelete.value.id)
    deleteTeamDialog.value = false
    teamToDelete.value = null
  } catch (error) {
    console.error('Error deleting team:', error)
  }
}

const getTeamPlayers = (team) => {
  return opponentsStore.opponents.filter(player => 
    player.club && player.club.toLowerCase() === team.name.toLowerCase()
  )
}

const getPlayerStats = (playerId) => {
  let playerMatches = matchesStore.matches.filter(m => 
    (m.player1Id === playerId || m.player2Id === playerId || m.opponentId === playerId) &&
    m.scores && m.scores.length > 0
  )
  
  if (selectedTournament.value) {
    playerMatches = playerMatches.filter(m => m.tournamentId === selectedTournament.value)
  }
  
  let wins = 0
  let losses = 0
  
  playerMatches.forEach(match => {
    const isPlayerFirst = match.player1Id === playerId || match.opponentId === playerId
    let playerSets = 0
    let opponentSets = 0
    
    match.scores.forEach(score => {
      const p1Score = score.player1Score || score.myScore || 0
      const p2Score = score.player2Score || score.oppScore || 0
      if (isPlayerFirst) {
        if (p1Score > p2Score) playerSets++
        else if (p2Score > p1Score) opponentSets++
      } else {
        if (p2Score > p1Score) playerSets++
        else if (p1Score > p2Score) opponentSets++
      }
    })
    
    if (playerSets > opponentSets) wins++
    else if (opponentSets > playerSets) losses++
  })
  
  const total = wins + losses
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  
  return {
    totalMatches: playerMatches.length,
    wins,
    losses,
    winRate
  }
}

const getPlayerRecentMatches = (playerId) => {
  let playerMatches = matchesStore.matches.filter(m => 
    (m.player1Id === playerId || m.player2Id === playerId || m.opponentId === playerId) &&
    m.scores && m.scores.length > 0
  )
  
  if (selectedTournament.value) {
    playerMatches = playerMatches.filter(m => m.tournamentId === selectedTournament.value)
  }
  
  return playerMatches
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : (a.date?.toDate ? a.date.toDate() : new Date(a.date))
      const dateB = b.date instanceof Date ? b.date : (b.date?.toDate ? b.date.toDate() : new Date(b.date))
      return dateB - dateA
    })
    .slice(0, 5)
}

const getMatchResult = (match, playerId) => {
  const isPlayerFirst = match.player1Id === playerId || match.opponentId === playerId
  let playerSets = 0
  let opponentSets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (isPlayerFirst) {
      if (p1Score > p2Score) playerSets++
      else if (p2Score > p1Score) opponentSets++
    } else {
      if (p2Score > p1Score) playerSets++
      else if (p1Score > p2Score) opponentSets++
    }
  })
  
  if (playerSets > opponentSets) return 'W'
  if (opponentSets > playerSets) return 'L'
  return 'D'
}

const getOpponentName = (match, playerId) => {
  let opponentId = null
  if (match.player1Id === playerId) {
    opponentId = match.player2Id || match.opponentId
  } else if (match.player2Id === playerId) {
    opponentId = match.player1Id || match.opponentId
  } else if (match.opponentId === playerId) {
    opponentId = match.player1Id || match.player2Id
  }
  
  if (opponentId) {
    const opponent = opponentsStore.opponents.find(o => o.id === opponentId)
    return opponent ? opponent.name : 'Unknown'
  }
  
  return 'Unknown'
}

const viewPlayer = (playerId) => {
  router.push(`/opponents/${playerId}`)
}
</script>

<style scoped>
.player-card {
  transition: all 0.3s ease;
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 20, 60, 0.2) !important;
}
</style>

