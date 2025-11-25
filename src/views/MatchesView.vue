<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openMatchDialog()">
          Add Match
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search matches"
          variant="outlined"
          density="compact"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="filterTournament"
          :items="tournamentsList"
          item-title="name"
          item-value="id"
          label="Filter by Tournament"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="filterOpponent"
          :items="opponentsList"
          item-title="name"
          item-value="id"
          label="Filter by Opponent"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="match in filteredMatches" :key="match.id" cols="12">
        <v-card>
          <v-card-text>
            <v-row align="center">
              <v-col cols="auto">
                <v-avatar :color="getMatchResult(match) === 'Win' ? 'success' : 'error'" size="60">
                  <v-icon size="32">{{ getMatchResult(match) === 'Win' ? 'mdi-check' : 'mdi-close' }}</v-icon>
                </v-avatar>
              </v-col>
              <v-col>
                <div class="text-h6">{{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  {{ formatDate(match.date) }} • {{ getTournamentName(match.tournamentId) || 'Friendly Match' }}
                  <span v-if="match.round"> • {{ match.round }}</span>
                </div>
                <div v-if="match.player1TeamId || match.player2TeamId" class="text-caption mt-1">
                  <v-chip size="x-small" class="mr-1">{{ getTeamName(match.player1TeamId) }}</v-chip>
                  vs
                  <v-chip size="x-small" class="ml-1">{{ getTeamName(match.player2TeamId) }}</v-chip>
                </div>
              </v-col>
              <v-col cols="auto">
                <div class="text-h5">{{ getSetsWon(match) }}</div>
                <div class="text-caption text-medium-emphasis">{{ getSetBreakdown(match) }}</div>
              </v-col>
              <v-col cols="auto">
                <v-btn icon="mdi-pencil" variant="text" @click="openMatchDialog(match)"></v-btn>
                <v-btn icon="mdi-delete" variant="text" color="error" @click="confirmDelete(match)"></v-btn>
                <v-btn icon="mdi-arrow-right" variant="text" :to="`/matches/${match.id}`"></v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="matchDialog" max-width="800" persistent>
      <v-card>
        <v-card-title>{{ editingMatch ? 'Edit Match' : 'Add New Match' }}</v-card-title>
        <v-card-text>
          <v-form ref="matchForm">
            <v-autocomplete
              v-model="formData.tournamentId"
              :items="tournamentsList"
              item-title="displayName"
              item-value="id"
              label="Tournament/League"
              variant="outlined"
              :rules="[v => !!v || 'Tournament is required']"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showTournamentDialog = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-text-field
              v-if="isLeagueMatch"
              v-model="formData.round"
              label="Round"
              variant="outlined"
              placeholder="e.g., Round 1, Round 5"
              @blur="checkRoundDate"
            ></v-text-field>

            <v-text-field
              v-model="formData.date"
              label="Date"
              type="date"
              variant="outlined"
              :rules="[v => !!v || 'Date is required']"
              :disabled="dateLocked"
              :hint="dateLocked ? 'Date locked - same as other matches in this round' : ''"
              persistent-hint
            ></v-text-field>

            <v-autocomplete
              v-model="formData.player1Id"
              :items="opponentsList"
              item-title="name"
              item-value="id"
              label="Player 1"
              variant="outlined"
              :rules="[v => !!v || 'Player 1 is required']"
              @update:model-value="onPlayer1Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-select
              v-if="isLeagueMatch && tournamentTeams.length > 0"
              v-model="formData.player1TeamId"
              :items="tournamentTeams"
              item-title="name"
              item-value="id"
              label="Player 1 Team"
              variant="outlined"
              :disabled="player1TeamLocked"
              :hint="player1TeamLocked ? 'Team locked - player previously linked to this team' : ''"
              persistent-hint
            ></v-select>

            <v-autocomplete
              v-model="formData.player2Id"
              :items="opponentsList"
              item-title="name"
              item-value="id"
              label="Player 2"
              variant="outlined"
              :rules="[v => !!v || 'Player 2 is required']"
              @update:model-value="onPlayer2Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-select
              v-if="isLeagueMatch && tournamentTeams.length > 0"
              v-model="formData.player2TeamId"
              :items="tournamentTeams"
              item-title="name"
              item-value="id"
              label="Player 2 Team"
              variant="outlined"
              :disabled="player2TeamLocked"
              :hint="player2TeamLocked ? 'Team locked - player previously linked to this team' : ''"
              persistent-hint
            ></v-select>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1">Scores</v-card-title>
              <v-card-text>
                <v-row v-for="(score, index) in formData.scores" :key="index" align="center">
                  <v-col cols="2">
                    <div class="text-subtitle-2">Set {{ index + 1 }}</div>
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model.number="score.player1Score"
                      label="Player 1 Score"
                      type="number"
                      variant="outlined"
                      density="compact"
                      :min="0"
                    ></v-text-field>
                  </v-col>
                  <v-col>
                    <v-text-field
                      v-model.number="score.player2Score"
                      label="Player 2 Score"
                      type="number"
                      variant="outlined"
                      density="compact"
                      :min="0"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon="mdi-close" size="small" @click="removeScore(index)" v-if="formData.scores.length > 1"></v-btn>
                  </v-col>
                </v-row>
                <v-btn prepend-icon="mdi-plus" size="small" @click="addScore">Add Set</v-btn>
              </v-card-text>
            </v-card>

            <v-textarea
              v-model="formData.notes"
              label="Match Notes"
              variant="outlined"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeMatchDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveMatch">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showOpponentDialog" max-width="500">
      <v-card>
        <v-card-title>Add New Player</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newOpponent.name"
            label="Name"
            variant="outlined"
          ></v-text-field>
          <v-select
            v-model="newOpponent.playingStyle"
            :items="['Aggressive', 'Defensive', 'Mixed']"
            label="Playing Style"
            variant="outlined"
          ></v-select>
          <v-select
            v-model="newOpponent.club"
            :items="allTeamsList"
            item-title="name"
            item-value="name"
            label="Team/Club"
            variant="outlined"
            clearable
          >
            <template v-slot:append>
              <v-btn icon="mdi-plus" size="small" @click="showTeamDialog = true"></v-btn>
            </template>
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showOpponentDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addOpponent">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showTournamentDialog" max-width="500">
      <v-card>
        <v-card-title>Add New Tournament/League</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTournament.name"
            label="Name"
            variant="outlined"
            placeholder="e.g., National League, City Championship"
          ></v-text-field>
          <v-select
            v-model="newTournament.type"
            :items="['League', 'Tournament']"
            label="Type"
            variant="outlined"
          ></v-select>
          <v-text-field
            v-model.number="newTournament.year"
            label="Year"
            type="number"
            variant="outlined"
            placeholder="2024"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTournamentDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addTournament">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showTeamDialog" max-width="500">
      <v-card>
        <v-card-title>Add New Team</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newTeam.name"
            label="Team Name"
            variant="outlined"
          ></v-text-field>
          <v-select
            v-model="newTeam.tournamentId"
            :items="leagueTournaments"
            item-title="displayName"
            item-value="id"
            label="League"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTeamDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addTeam">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Match</v-card-title>
        <v-card-text>Are you sure you want to delete this match?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteMatch">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMatchesStore } from '../stores/matches'
import { useOpponentsStore } from '../stores/opponents'
import { useTournamentsStore } from '../stores/tournaments'
import { useTeamsStore } from '../stores/teams'
import { formatDate } from '../utils/date'

const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()
const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()

const matchDialog = ref(false)
const showOpponentDialog = ref(false)
const showTournamentDialog = ref(false)
const showTeamDialog = ref(false)
const deleteDialog = ref(false)
const editingMatch = ref(null)
const matchToDelete = ref(null)
const search = ref('')
const filterTournament = ref(null)
const filterOpponent = ref(null)
const matchForm = ref(null)
const dateLocked = ref(false)
const player1TeamLocked = ref(false)
const player2TeamLocked = ref(false)

const formData = ref({
  player1Id: '',
  player2Id: '',
  tournamentId: '',
  round: '',
  player1TeamId: '',
  player2TeamId: '',
  date: new Date().toISOString().split('T')[0],
  scores: [{ set: 1, player1Score: null, player2Score: null }],
  notes: '',
  photos: [],
  videoUrls: [],
  serveStats: { successRate: 0, returnPoints: 0 }
})

const newOpponent = ref({
  name: '',
  playingStyle: '',
  club: ''
})

const newTournament = ref({
  name: '',
  type: '',
  year: new Date().getFullYear()
})

const newTeam = ref({
  name: '',
  tournamentId: '',
  isMyTeam: false
})

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    opponentsStore.fetchOpponents(),
    tournamentsStore.fetchTournaments(),
    teamsStore.fetchTeams()
  ])
})

watch(() => formData.value.tournamentId, async (newTournamentId) => {
  if (newTournamentId && isLeagueMatch.value) {
    await teamsStore.fetchTeams()
  }
  formData.value.player1TeamId = ''
  formData.value.player2TeamId = ''
  formData.value.round = ''
  dateLocked.value = false
  player1TeamLocked.value = false
  player2TeamLocked.value = false
})

watch(() => formData.value.round, () => {
  checkRoundDate()
})

const checkRoundDate = () => {
  if (!formData.value.tournamentId || !formData.value.round || !isLeagueMatch.value) {
    dateLocked.value = false
    return
  }

  const existingMatch = matchesStore.matches.find(m => 
    m.tournamentId === formData.value.tournamentId && 
    m.round === formData.value.round &&
    m.id !== editingMatch.value?.id
  )

  if (existingMatch && existingMatch.date) {
    formData.value.date = existingMatch.date.toISOString().split('T')[0]
    dateLocked.value = true
  } else {
    dateLocked.value = false
  }
}

const getPlayerTeamAssociation = (playerId, tournamentId) => {
  const match = matchesStore.matches.find(m => 
    (m.player1Id === playerId || m.player2Id === playerId) &&
    m.tournamentId === tournamentId &&
    (m.player1TeamId || m.player2TeamId)
  )

  if (!match) return null

  if (match.player1Id === playerId) {
    return match.player1TeamId
  } else if (match.player2Id === playerId) {
    return match.player2TeamId
  }
  return null
}

const onPlayer1Selected = () => {
  if (!isLeagueMatch.value || !formData.value.tournamentId || !formData.value.player1Id) {
    player1TeamLocked.value = false
    return
  }

  const associatedTeamId = getPlayerTeamAssociation(formData.value.player1Id, formData.value.tournamentId)
  
  if (associatedTeamId) {
    formData.value.player1TeamId = associatedTeamId
    player1TeamLocked.value = true
  } else {
    player1TeamLocked.value = false
  }
}

const onPlayer2Selected = () => {
  if (!isLeagueMatch.value || !formData.value.tournamentId || !formData.value.player2Id) {
    player2TeamLocked.value = false
    return
  }

  const associatedTeamId = getPlayerTeamAssociation(formData.value.player2Id, formData.value.tournamentId)
  
  if (associatedTeamId) {
    formData.value.player2TeamId = associatedTeamId
    player2TeamLocked.value = true
  } else {
    player2TeamLocked.value = false
  }
}

const opponentsList = computed(() => opponentsStore.opponents)

const tournamentsList = computed(() => {
  return tournamentsStore.tournaments.map(t => ({
    ...t,
    displayName: `${t.name} (${t.year}) - ${t.type}`
  }))
})

const allTeamsList = computed(() => {
  return teamsStore.teams.map(t => ({
    id: t.id,
    name: t.name
  }))
})

const isLeagueMatch = computed(() => {
  const tournament = tournamentsStore.tournaments.find(t => t.id === formData.value.tournamentId)
  return tournament?.type === 'League'
})

const tournamentTeams = computed(() => {
  if (!formData.value.tournamentId) return []
  return teamsStore.teams.filter(t => t.tournamentId === formData.value.tournamentId)
})

const filteredMatches = computed(() => {
  let matches = matchesStore.matches

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    matches = matches.filter(m => {
      const player1 = getPlayerName(m.player1Id).toLowerCase()
      const player2 = getPlayerName(m.player2Id).toLowerCase()
      const tournament = getTournamentName(m.tournamentId)?.toLowerCase() || ''
      return player1.includes(searchLower) || player2.includes(searchLower) || tournament.includes(searchLower)
    })
  }

  if (filterTournament.value) {
    matches = matches.filter(m => m.tournamentId === filterTournament.value)
  }

  if (filterOpponent.value) {
    matches = matches.filter(m => m.opponentId === filterOpponent.value)
  }

  return matches
})

const openMatchDialog = (match = null) => {
  dateLocked.value = false
  player1TeamLocked.value = false
  player2TeamLocked.value = false

  if (match) {
    editingMatch.value = match
    formData.value = {
      ...match,
      date: match.date.toISOString().split('T')[0]
    }
    setTimeout(() => {
      checkRoundDate()
      if (formData.value.player1Id) onPlayer1Selected()
      if (formData.value.player2Id) onPlayer2Selected()
    }, 100)
  } else {
    editingMatch.value = null
    formData.value = {
      tournamentId: '',
      round: '',
      player1Id: '',
      player2Id: '',
      player1TeamId: '',
      player2TeamId: '',
      date: new Date().toISOString().split('T')[0],
      scores: [{ set: 1, player1Score: null, player2Score: null }],
      notes: '',
      photos: [],
      videoUrls: [],
      serveStats: { successRate: 0, returnPoints: 0 }
    }
  }
  matchDialog.value = true
}

const closeMatchDialog = () => {
  matchDialog.value = false
  editingMatch.value = null
}

const addScore = () => {
  formData.value.scores.push({
    set: formData.value.scores.length + 1,
    player1Score: null,
    player2Score: null
  })
}

const removeScore = (index) => {
  formData.value.scores.splice(index, 1)
  formData.value.scores.forEach((score, i) => {
    score.set = i + 1
  })
}

const saveMatch = async () => {
  const { valid } = await matchForm.value.validate()
  if (!valid) return

  const matchData = {
    ...formData.value,
    date: new Date(formData.value.date)
  }

  try {
    if (editingMatch.value) {
      await matchesStore.updateMatch(editingMatch.value.id, matchData)
    } else {
      await matchesStore.addMatch(matchData)
    }
    closeMatchDialog()
  } catch (error) {
    console.error('Error saving match:', error)
  }
}

const confirmDelete = (match) => {
  matchToDelete.value = match
  deleteDialog.value = true
}

const deleteMatch = async () => {
  try {
    await matchesStore.deleteMatch(matchToDelete.value.id)
    deleteDialog.value = false
    matchToDelete.value = null
  } catch (error) {
    console.error('Error deleting match:', error)
  }
}

const addOpponent = async () => {
  try {
    await opponentsStore.addOpponent(newOpponent.value)
    showOpponentDialog.value = false
    newOpponent.value = { name: '', playingStyle: '', club: '' }
  } catch (error) {
    console.error('Error adding opponent:', error)
  }
}

const addTournament = async () => {
  try {
    const tournamentId = await tournamentsStore.addTournament(newTournament.value)
    formData.value.tournamentId = tournamentId
    showTournamentDialog.value = false
    newTournament.value = { name: '', type: '', year: new Date().getFullYear() }
  } catch (error) {
    console.error('Error adding tournament:', error)
  }
}

const leagueTournaments = computed(() => {
  return tournamentsStore.tournaments
    .filter(t => t.type === 'League')
    .map(t => ({
      ...t,
      displayName: `${t.name} (${t.year})`
    }))
})

const addTeam = async () => {
  try {
    await teamsStore.addTeam(newTeam.value)
    showTeamDialog.value = false
    newTeam.value = { name: '', tournamentId: '', isMyTeam: false }
  } catch (error) {
    console.error('Error adding team:', error)
  }
}

const getTournamentName = (tournamentId) => {
  const tournament = tournamentsStore.tournaments.find(t => t.id === tournamentId)
  return tournament ? tournament.name : null
}

const getMatchResult = (match) => {
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const player1Score = score.player1Score || score.myScore || 0
    const player2Score = score.player2Score || score.oppScore || 0
    
    if (player1Score > player2Score) {
      player1Sets++
    } else if (player2Score > player1Score) {
      player2Sets++
    }
  })
  
  return player1Sets > player2Sets ? 'Win' : 'Loss'
}

const getSetsWon = (match) => {
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const player1Score = score.player1Score || score.myScore || 0
    const player2Score = score.player2Score || score.oppScore || 0
    
    if (player1Score > player2Score) {
      player1Sets++
    } else if (player2Score > player1Score) {
      player2Sets++
    }
  })
  
  return `${player1Sets}-${player2Sets}`
}

const getSetBreakdown = (match) => {
  return match.scores.map(s => `${s.player1Score || s.myScore || 0}-${s.player2Score || s.oppScore || 0}`).join(', ')
}

const getPlayerName = (playerId) => {
  const player = opponentsStore.opponents.find(o => o.id === playerId)
  return player ? player.name : 'Unknown'
}

const getTeamName = (teamId) => {
  if (!teamId) return ''
  const team = teamsStore.teams.find(t => t.id === teamId)
  return team ? team.name : ''
}
</script>

