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
      <v-col cols="12" md="3">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search matches"
          variant="outlined"
          density="compact"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
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
      <v-col cols="12" md="3">
        <v-select
          v-model="filterOpponent"
          :items="opponentsList"
          item-title="name"
          item-value="id"
          label="Filter by Player"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterTeam"
          :items="teamsList"
          item-title="name"
          item-value="id"
          label="Filter by Team"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterRound"
          :items="roundsList"
          label="Filter by Round"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="match in filteredMatches" :key="match.id" cols="12">
        <v-card :class="{ 'border-scheduled': isScheduled(match) }">
          <v-card-text>
            <v-row align="center">
              <v-col>
                <div class="d-flex align-center mb-1">
                  <div class="text-h6">
                    <span v-if="match.player1Id && match.player2Id">
                      {{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}
                    </span>
                    <span v-else-if="match.player1TeamId && match.player2TeamId">
                      {{ getTeamName(match.player1TeamId) }} vs {{ getTeamName(match.player2TeamId) }}
                    </span>
                    <span v-else>
                      Match TBD
                    </span>
                  </div>
                  <v-chip
                    v-if="isScheduled(match)"
                    size="small"
                    color="info"
                    class="ml-2"
                  >
                    <v-icon start size="small">mdi-clock-outline</v-icon>
                    Scheduled
                  </v-chip>
                </div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  {{ formatDate(match.date) }} • {{ getTournamentName(match.tournamentId) || 'Friendly Match' }}
                  <span v-if="match.round"> • {{ match.round }}</span>
                </div>
                <div v-if="match.player1TeamId || match.player2TeamId" class="text-caption mt-1">
                  <v-chip size="x-small" class="mr-1">{{ getTeamName(match.player1TeamId) }}</v-chip>
                  vs
                  <v-chip size="x-small" class="ml-1">{{ getTeamName(match.player2TeamId) }}</v-chip>
                </div>
                <div v-if="isScheduled(match) && (!match.player1Id || !match.player2Id)" class="text-caption text-info mt-1">
                  <v-icon size="x-small" class="mr-1">mdi-information</v-icon>
                  Players to be determined
                </div>
              </v-col>
              <v-col cols="auto" v-if="!isScheduled(match)">
                <div class="text-h5">{{ getSetsWon(match) }}</div>
                <div class="text-caption text-medium-emphasis">{{ getSetBreakdown(match) }}</div>
              </v-col>
              <v-col cols="auto" v-else>
                <v-chip color="info" variant="outlined">
                  <v-icon start>mdi-calendar-clock</v-icon>
                  Upcoming
                </v-chip>
              </v-col>
              <v-col cols="auto">
                <v-btn icon="mdi-pencil" variant="text" @click="openMatchDialog(match)"></v-btn>
                <v-btn icon="mdi-delete" variant="text" color="error" @click="confirmDelete(match)"></v-btn>
                <v-btn v-if="!isScheduled(match)" icon="mdi-arrow-right" variant="text" :to="`/matches/${match.id}`"></v-btn>
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
              :rules="[v => !!v || 'Round is required for league matches']"
              @blur="checkRoundDate"
            ></v-text-field>

            <v-text-field
              v-model="formData.date"
              label="Date"
              type="date"
              variant="outlined"
              :rules="[v => !!v || 'Date is required']"
              :disabled="dateLocked"
            ></v-text-field>

            <v-alert v-if="isScheduledMatch && isLeagueMatch" type="info" variant="tonal" class="mb-4">
              For scheduled matches, you can select teams first. Players can be added later when the match is played.
            </v-alert>

            <v-autocomplete
              v-if="isLeagueMatch"
              v-model="formData.player1TeamId"
              :items="tournamentTeamsList"
              item-title="name"
              item-value="id"
              label="Team 1"
              variant="outlined"
              :rules="isLeagueMatch && isScheduledMatch ? [v => !!v || 'Team 1 is required for scheduled league matches'] : []"
              @update:model-value="onTeam1Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showTeamDialog = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-autocomplete
              v-if="isLeagueMatch"
              v-model="formData.player2TeamId"
              :items="tournamentTeamsList"
              item-title="name"
              item-value="id"
              label="Team 2"
              variant="outlined"
              :rules="isLeagueMatch && isScheduledMatch ? [v => !!v || 'Team 2 is required for scheduled league matches'] : []"
              @update:model-value="onTeam2Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showTeamDialog = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-autocomplete
              v-model="formData.player1Id"
              :items="filteredPlayer1List"
              item-title="name"
              item-value="id"
              label="Player 1"
              variant="outlined"
              :rules="[
                isScheduledMatch ? null : (v => !!v || 'Player 1 is required'),
                v => validatePlayerTeam(v, formData.player1TeamId, 'Player 1')
              ].filter(r => r !== null)"
              :hint="getPlayer1Hint()"
              persistent-hint
              @update:model-value="onPlayer1Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-autocomplete
              v-model="formData.player2Id"
              :items="filteredPlayer2List"
              item-title="name"
              item-value="id"
              label="Player 2"
              variant="outlined"
              :rules="[
                isScheduledMatch ? null : (v => !!v || 'Player 2 is required'),
                v => validatePlayerTeam(v, formData.player2TeamId, 'Player 2')
              ].filter(r => r !== null)"
              :hint="getPlayer2Hint()"
              persistent-hint
              @update:model-value="onPlayer2Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true"></v-btn>
              </template>
            </v-autocomplete>

            <v-checkbox
              v-model="isScheduledMatch"
              label="This is a scheduled match (no scores yet)"
              class="mb-2"
              @update:model-value="onScheduledMatchChange"
            ></v-checkbox>

            <v-card variant="outlined" class="mb-4" v-if="!isScheduledMatch">
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
                      class="score-input"
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
                      class="score-input"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon="mdi-close" size="small" @click="removeScore(index)" v-if="formData.scores.length > 1"></v-btn>
                  </v-col>
                </v-row>
                <v-btn prepend-icon="mdi-plus" size="small" @click="addScore">Add Set</v-btn>
              </v-card-text>
            </v-card>
            
            <v-alert v-if="isScheduledMatch" type="info" variant="tonal" class="mb-4">
              This match is scheduled. You can add scores later when the match is played.
            </v-alert>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1">Match Notes & Tactics</v-card-title>
              <v-card-text>
                <v-textarea
                  v-model="formData.notes"
                  label="General Notes"
                  variant="outlined"
                  rows="3"
                  placeholder="Overall match notes..."
                  persistent-placeholder
                  no-resize
                ></v-textarea>
                
                <v-textarea
                  v-model="formData.tacticsUsed"
                  label="Tactics Used"
                  variant="outlined"
                  rows="2"
                  placeholder="What tactics worked well?"
                  persistent-placeholder
                  no-resize
                  class="general-notes-textarea"
                ></v-textarea>
                
                <v-textarea
                  v-model="formData.tacticsToImprove"
                  label="Areas to Improve"
                  variant="outlined"
                  rows="2"
                  placeholder="What didn't work? What needs improvement?"
                  persistent-placeholder
                  no-resize
                  class="general-notes-textarea"
                ></v-textarea>
                
                <v-textarea
                  v-model="formData.opponentWeaknesses"
                  label="Opponent Weaknesses Observed"
                  variant="outlined"
                  rows="2"
                  placeholder="What weaknesses did you notice in your opponent?"
                  persistent-placeholder
                  no-resize
                  class="general-notes-textarea"
                ></v-textarea>
              </v-card-text>
            </v-card>

            <v-card v-if="formData.player1Id && formData.player2Id" variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-1">
                <v-icon class="mr-2">mdi-chart-line</v-icon>
                Win Probability Prediction
              </v-card-title>
              <v-card-text>
                <div class="text-h5 mb-2">{{ getWinProbability() }}%</div>
                <v-progress-linear
                  :model-value="getWinProbability()"
                  :color="getProbabilityColor()"
                  height="25"
                  rounded
                ></v-progress-linear>
                <div class="text-caption mt-2 text-medium-emphasis">
                  Based on historical head-to-head record and recent form
                </div>
              </v-card-text>
            </v-card>

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-2">YouTube Video</v-card-title>
              <v-card-text>
                <v-text-field
                  v-model="formData.youtubeUrl"
                  label="YouTube Video URL"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  variant="outlined"
                  prepend-inner-icon="mdi-youtube"
                  hint="Paste a YouTube URL to add a video to this match"
                  persistent-hint
                ></v-text-field>
                <div v-if="formData.youtubeUrl && getYouTubeEmbedUrl(formData.youtubeUrl)" class="mt-4">
                  <div class="text-caption text-medium-emphasis mb-2">Video Preview:</div>
                  <div class="video-preview-container">
                    <iframe
                      :src="getYouTubeEmbedUrl(formData.youtubeUrl)"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                  <v-chip size="small" color="red" prepend-icon="mdi-youtube" class="mt-2">
                    Video ready to save
                  </v-chip>
                </div>
                <div v-else-if="formData.youtubeUrl" class="mt-2">
                  <v-alert type="warning" density="compact">
                    Please enter a valid YouTube URL
                  </v-alert>
                </div>
              </v-card-text>
            </v-card>
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
import { useRoute } from 'vue-router'
import { useMatchesStore } from '../stores/matches'
import { useOpponentsStore } from '../stores/opponents'
import { useTournamentsStore } from '../stores/tournaments'
import { useTeamsStore } from '../stores/teams'
import { formatDate } from '../utils/date'
import { getYouTubeEmbedUrl } from '../utils/storage'

const route = useRoute()
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
const filterTeam = ref(null)
const filterRound = ref(null)
const matchForm = ref(null)
const dateLocked = ref(false)
const isScheduledMatch = ref(false)

const formData = ref({
  player1Id: '',
  player2Id: '',
  tournamentId: '',
  round: '',
  player1TeamId: '',
  player2TeamId: '',
  date: new Date().toISOString().split('T')[0],
  scores: [
    { set: 1, player1Score: null, player2Score: null },
    { set: 2, player1Score: null, player2Score: null },
    { set: 3, player1Score: null, player2Score: null }
  ],
  notes: '',
  tacticsUsed: '',
  tacticsToImprove: '',
  opponentWeaknesses: '',
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
  
  // Handle query parameters for scheduling matches
  if (route.query.tournament) {
    formData.value.tournamentId = route.query.tournament
    if (route.query.scheduled === 'true') {
      setTimeout(() => openMatchDialog(), 100)
    }
  }
  
  // Handle edit query parameter
  if (route.query.edit) {
    const match = matchesStore.matches.find(m => m.id === route.query.edit)
    if (match) {
      setTimeout(() => openMatchDialog(match), 100)
    }
  }
})

watch(() => formData.value.tournamentId, async (newTournamentId) => {
  if (newTournamentId && isLeagueMatch.value) {
    await teamsStore.fetchTeams()
  }
  formData.value.player1TeamId = ''
  formData.value.player2TeamId = ''
  formData.value.round = ''
  dateLocked.value = false
  if (formData.value.player1Id) onPlayer1Selected()
  if (formData.value.player2Id) onPlayer2Selected()
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

const getPlayerTeamFromClub = (playerId, tournamentId) => {
  if (!playerId || !tournamentId) return null
  
  const player = opponentsStore.opponents.find(p => p.id === playerId)
  if (!player || !player.club) return null
  
  const team = teamsStore.teams.find(t => 
    t.tournamentId === tournamentId && 
    t.name === player.club
  )
  
  return team ? team.id : null
}

const validatePlayerTeam = (playerId, teamId, playerLabel) => {
  if (!playerId || !teamId || !isLeagueMatch.value || !formData.value.tournamentId) {
    return true // No validation needed if player or team not selected
  }
  
  const playerTeamId = getPlayerTeamFromClub(playerId, formData.value.tournamentId)
  if (playerTeamId !== teamId) {
    const player = opponentsStore.opponents.find(p => p.id === playerId)
    const team = teamsStore.teams.find(t => t.id === teamId)
    return `${playerLabel} does not belong to ${team?.name || 'selected team'}. Please select a player from the correct team.`
  }
  
  return true
}

const getPlayer1Hint = () => {
  if (isLeagueMatch.value && formData.value.player1TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player1TeamId)
    return team ? `Only players from ${team.name} are shown` : ''
  }
  return ''
}

const getPlayer2Hint = () => {
  if (isLeagueMatch.value && formData.value.player2TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player2TeamId)
    return team ? `Only players from ${team.name} are shown` : ''
  }
  return ''
}

const onPlayer1Selected = () => {
  if (!isLeagueMatch.value || !formData.value.tournamentId || !formData.value.player1Id) {
    if (!isScheduledMatch.value) {
      formData.value.player1TeamId = ''
    }
    return
  }

  // Validate player belongs to selected team
  if (formData.value.player1TeamId) {
    const playerTeamId = getPlayerTeamFromClub(formData.value.player1Id, formData.value.tournamentId)
    if (playerTeamId !== formData.value.player1TeamId) {
      // Clear player if it doesn't match the team
      formData.value.player1Id = ''
      return
    }
  } else {
    // Auto-fill team if not set
    const teamId = getPlayerTeamFromClub(formData.value.player1Id, formData.value.tournamentId)
    formData.value.player1TeamId = teamId || ''
  }
}

const onPlayer2Selected = () => {
  if (!isLeagueMatch.value || !formData.value.tournamentId || !formData.value.player2Id) {
    if (!isScheduledMatch.value) {
      formData.value.player2TeamId = ''
    }
    return
  }

  // Validate player belongs to selected team
  if (formData.value.player2TeamId) {
    const playerTeamId = getPlayerTeamFromClub(formData.value.player2Id, formData.value.tournamentId)
    if (playerTeamId !== formData.value.player2TeamId) {
      // Clear player if it doesn't match the team
      formData.value.player2Id = ''
      return
    }
  } else {
    // Auto-fill team if not set
    const teamId = getPlayerTeamFromClub(formData.value.player2Id, formData.value.tournamentId)
    formData.value.player2TeamId = teamId || ''
  }
}

const onTeam1Selected = () => {
  // When team is selected, clear player1 if it doesn't belong to this team
  if (formData.value.player1Id && formData.value.player1TeamId) {
    const playerTeamId = getPlayerTeamFromClub(formData.value.player1Id, formData.value.tournamentId)
    if (playerTeamId !== formData.value.player1TeamId) {
      formData.value.player1Id = ''
    }
  }
}

const onTeam2Selected = () => {
  // When team is selected, clear player2 if it doesn't belong to this team
  if (formData.value.player2Id && formData.value.player2TeamId) {
    const playerTeamId = getPlayerTeamFromClub(formData.value.player2Id, formData.value.tournamentId)
    if (playerTeamId !== formData.value.player2TeamId) {
      formData.value.player2Id = ''
    }
  }
}

const opponentsList = computed(() => opponentsStore.opponents)

const filteredPlayer1List = computed(() => {
  if (!isLeagueMatch.value || !formData.value.tournamentId) {
    return opponentsList.value
  }
  
  // If team is selected, only show players from that team
  if (formData.value.player1TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player1TeamId)
    if (team) {
      return opponentsList.value.filter(player => {
        return player.club === team.name
      })
    }
  }
  
  return opponentsList.value
})

const filteredPlayer2List = computed(() => {
  if (!isLeagueMatch.value || !formData.value.tournamentId) {
    return opponentsList.value
  }
  
  // If team is selected, only show players from that team
  if (formData.value.player2TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player2TeamId)
    if (team) {
      return opponentsList.value.filter(player => {
        return player.club === team.name
      })
    }
  }
  
  return opponentsList.value
})

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

const teamsList = computed(() => {
  return teamsStore.teams.map(t => ({
    id: t.id,
    name: t.name
  }))
})

const tournamentTeamsList = computed(() => {
  if (!formData.value.tournamentId) return []
  return teamsStore.teams
    .filter(t => t.tournamentId === formData.value.tournamentId)
    .map(t => ({
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

const roundsList = computed(() => {
  const rounds = new Set()
  matchesStore.matches.forEach(match => {
    if (match.round) {
      rounds.add(match.round)
    }
  })
  return Array.from(rounds).sort((a, b) => {
    const aNum = parseInt(a)
    const bNum = parseInt(b)
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum
    }
    return String(a).localeCompare(String(b))
  })
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
    matches = matches.filter(m => m.player1Id === filterOpponent.value || m.player2Id === filterOpponent.value || m.opponentId === filterOpponent.value)
  }

  if (filterTeam.value) {
    matches = matches.filter(m => m.player1TeamId === filterTeam.value || m.player2TeamId === filterTeam.value)
  }

  if (filterRound.value) {
    matches = matches.filter(m => m.round === filterRound.value)
  }

  return matches
})

const openMatchDialog = (match = null) => {
  dateLocked.value = false

  if (match) {
    editingMatch.value = match
    formData.value = {
      ...match,
      date: match.date.toISOString().split('T')[0],
      youtubeUrl: match.videoUrls && match.videoUrls.length > 0 ? match.videoUrls[0] : '',
      tacticsUsed: match.tacticsUsed || '',
      tacticsToImprove: match.tacticsToImprove || '',
      opponentWeaknesses: match.opponentWeaknesses || ''
    }
    setTimeout(() => {
      checkRoundDate()
      if (formData.value.player1Id) onPlayer1Selected()
      if (formData.value.player2Id) onPlayer2Selected()
    }, 100)
  } else {
    editingMatch.value = null
    const today = new Date()
    const matchDate = new Date(today)
    matchDate.setDate(today.getDate() + 7)
    isScheduledMatch.value = true
    
    // Find default tournament
    const defaultTournament = tournamentsStore.tournaments.find(t => t.isDefault)
    formData.value = {
      tournamentId: defaultTournament ? defaultTournament.id : '',
      round: '',
      player1Id: '',
      player2Id: '',
      player1TeamId: '',
      player2TeamId: '',
      date: matchDate.toISOString().split('T')[0],
      scores: [],
      notes: '',
      tacticsUsed: '',
      tacticsToImprove: '',
      opponentWeaknesses: '',
      photos: [],
      videoUrls: [],
      youtubeUrl: '',
      serveStats: { successRate: 0, returnPoints: 0 }
    }
  }
  matchDialog.value = true
}

const onScheduledMatchChange = (value) => {
  if (value) {
    formData.value.scores = []
  } else {
    if (formData.value.scores.length === 0) {
      formData.value.scores = [
        { set: 1, player1Score: null, player2Score: null },
        { set: 2, player1Score: null, player2Score: null },
        { set: 3, player1Score: null, player2Score: null }
      ]
    }
  }
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

  // For scheduled matches, require teams for league matches
  if (isScheduledMatch.value && isLeagueMatch.value) {
    if (!formData.value.player1TeamId || !formData.value.player2TeamId) {
      alert('Please select both teams for scheduled league matches')
      return
    }
  }

  // For completed matches, require players
  if (!isScheduledMatch.value) {
    if (!formData.value.player1Id || !formData.value.player2Id) {
      alert('Please select both players for completed matches')
      return
    }
  }

  // Determine match status
  const hasScores = formData.value.scores && formData.value.scores.length > 0 && 
    formData.value.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
  const matchDate = new Date(formData.value.date)
  const isFuture = matchDate > new Date()
  
  let status = 'completed'
  if (isScheduledMatch.value || (!hasScores && isFuture)) {
    status = 'scheduled'
  } else if (hasScores) {
    status = 'completed'
  }

  // Convert youtubeUrl to videoUrls array
  const videoUrls = []
  if (formData.value.youtubeUrl && formData.value.youtubeUrl.trim()) {
    videoUrls.push(formData.value.youtubeUrl.trim())
  }
  // If editing and there were existing videos, preserve them unless we're replacing
  if (editingMatch.value && editingMatch.value.videoUrls && editingMatch.value.videoUrls.length > 0) {
    // If we have a new URL, replace the first one, otherwise keep existing
    if (formData.value.youtubeUrl && formData.value.youtubeUrl.trim()) {
      // Replace first video with new one, keep others
      videoUrls.push(...(editingMatch.value.videoUrls.slice(1)))
    } else {
      // Keep existing videos
      videoUrls.push(...editingMatch.value.videoUrls)
    }
  }

  const matchData = {
    ...formData.value,
    date: new Date(formData.value.date),
    videoUrls: videoUrls,
    status: status
  }
  
  // Remove youtubeUrl from the data we save (it's just for the form)
  delete matchData.youtubeUrl

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

const getWinProbability = () => {
  if (!formData.value.player1Id || !formData.value.player2Id) return 50
  
  const player1Id = formData.value.player1Id
  const player2Id = formData.value.player2Id
  
  const player1Matches = matchesStore.matches.filter(m => 
    m.player1Id === player1Id || m.player2Id === player1Id
  )
  const player2Matches = matchesStore.matches.filter(m => 
    m.player1Id === player2Id || m.player2Id === player2Id
  )
  
  if (player1Matches.length === 0 && player2Matches.length === 0) return 50
  
  let player1WinRate = 0
  let player2WinRate = 0
  
  if (player1Matches.length > 0) {
    const player1Wins = player1Matches.filter(m => {
      const isP1 = m.player1Id === player1Id
      let p1Sets = 0
      let p2Sets = 0
      m.scores.forEach(s => {
        const p1 = s.player1Score || s.myScore || 0
        const p2 = s.player2Score || s.oppScore || 0
        if (p1 > p2) p1Sets++
        else if (p2 > p1) p2Sets++
      })
      return isP1 ? p1Sets > p2Sets : p2Sets > p1Sets
    }).length
    player1WinRate = (player1Wins / player1Matches.length) * 100
  }
  
  if (player2Matches.length > 0) {
    const player2Wins = player2Matches.filter(m => {
      const isP1 = m.player1Id === player2Id
      let p1Sets = 0
      let p2Sets = 0
      m.scores.forEach(s => {
        const p1 = s.player1Score || s.myScore || 0
        const p2 = s.player2Score || s.oppScore || 0
        if (p1 > p2) p1Sets++
        else if (p2 > p1) p2Sets++
      })
      return isP1 ? p1Sets > p2Sets : p2Sets > p1Sets
    }).length
    player2WinRate = (player2Wins / player2Matches.length) * 100
  }
  
  const h2hMatches = matchesStore.matches.filter(m => 
    (m.player1Id === player1Id && m.player2Id === player2Id) ||
    (m.player1Id === player2Id && m.player2Id === player1Id)
  )
  
  let h2hWinRate = 50
  if (h2hMatches.length > 0) {
    const h2hWins = h2hMatches.filter(m => {
      const isP1 = m.player1Id === player1Id
      let p1Sets = 0
      let p2Sets = 0
      m.scores.forEach(s => {
        const p1 = s.player1Score || s.myScore || 0
        const p2 = s.player2Score || s.oppScore || 0
        if (p1 > p2) p1Sets++
        else if (p2 > p1) p2Sets++
      })
      return isP1 ? p1Sets > p2Sets : p2Sets > p1Sets
    }).length
    h2hWinRate = (h2hWins / h2hMatches.length) * 100
  }
  
  const overallWinRate = (player1WinRate + (100 - player2WinRate)) / 2
  const weightedProbability = h2hMatches.length >= 3 
    ? (h2hWinRate * 0.6) + (overallWinRate * 0.4)
    : overallWinRate
  
  return Math.max(5, Math.min(95, Math.round(weightedProbability)))
}

const getProbabilityColor = () => {
  const prob = getWinProbability()
  if (prob >= 70) return 'success'
  if (prob >= 50) return 'info'
  if (prob >= 30) return 'warning'
  return 'error'
}

const isScheduled = (match) => {
  if (match.status === 'scheduled') return true
  const hasScores = match.scores && match.scores.length > 0 && 
    match.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
  const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
  return !hasScores && matchDate > new Date()
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

<style scoped>
.video-preview-container {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 4px;
  background: #000;
}

.video-preview-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.border-scheduled {
  border-left: 4px solid #2196F3 !important;
}

/* Remove floating label animation for General Notes to prevent it going above other text */
.general-notes-textarea .v-label {
  position: static !important;
  transform: none !important;
  transition: none !important;
  top: auto !important;
  left: auto !important;
  margin-bottom: 8px !important;
}

.general-notes-textarea .v-field__input {
  padding-top: 0 !important;
}

/* Remove spinner arrows from number inputs in score fields */
.score-input input[type="number"]::-webkit-inner-spin-button,
.score-input input[type="number"]::-webkit-outer-spin-button,
.score-input .v-field__input input[type="number"]::-webkit-inner-spin-button,
.score-input .v-field__input input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button,
.v-text-field input[type="number"]::-webkit-inner-spin-button,
.v-text-field input[type="number"]::-webkit-outer-spin-button,
.v-field input[type="number"]::-webkit-inner-spin-button,
.v-field input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none !important;
  appearance: none !important;
  margin: 0 !important;
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.score-input input[type="number"],
.score-input .v-field__input input[type="number"],
input[type="number"],
.v-text-field input[type="number"],
.v-field input[type="number"] {
  -moz-appearance: textfield !important;
  appearance: textfield !important;
}

/* Additional fix for all number inputs in all states */
.score-input input[type="number"]:hover,
.score-input input[type="number"]:focus,
.score-input input[type="number"]:active,
.score-input .v-field__input input[type="number"]:hover,
.score-input .v-field__input input[type="number"]:focus,
.score-input .v-field__input input[type="number"]:active,
input[type="number"]:hover,
input[type="number"]:focus,
input[type="number"]:active,
.v-text-field input[type="number"]:hover,
.v-text-field input[type="number"]:focus,
.v-text-field input[type="number"]:active,
.v-field input[type="number"]:hover,
.v-field input[type="number"]:focus,
.v-field input[type="number"]:active {
  -moz-appearance: textfield !important;
  appearance: textfield !important;
}
</style>

