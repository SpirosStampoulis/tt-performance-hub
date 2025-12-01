<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openMatchDialog()"
          size="large"
          rounded="lg"
          elevation="2"
          :disabled="isGuest"
        >
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
        <v-card
          class="match-card"
          :class="{ 'scheduled-match': isScheduled(match), 'completed-match': !isScheduled(match) }"
          elevation="3"
        >
          <v-card-text class="match-card-content">
            <v-row align="center" class="match-row">
              <v-col cols="12" md="6" class="match-info-col">
                <div class="d-flex align-center mb-2 flex-wrap match-header">
                  <div class="match-title">
                    <span v-if="match.isDoubles && match.player1Id && match.player2Id && match.player3Id && match.player4Id">
                      {{ getPlayerName(match.player1Id) }} & {{ getPlayerName(match.player3Id) }} vs {{ getPlayerName(match.player2Id) }} & {{ getPlayerName(match.player4Id) }}
                      <v-chip size="x-small" color="accent" variant="flat" class="ml-2">Doubles</v-chip>
                    </span>
                    <span v-else-if="match.player1Id && match.player2Id">
                      {{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}
                    </span>
                    <span v-else-if="match.player1TeamId && match.player2TeamId">
                      {{ getTeamName(match.player1TeamId) }} vs {{ getTeamName(match.player2TeamId) }}
                    </span>
                    <span v-else>
                      Match TBD
                    </span>
                  </div>
                  <router-link
                    v-if="match.videoUrls && match.videoUrls.length > 0"
                    :to="`/matches/${match.id}`"
                    class="ml-2 youtube-badge"
                  >
                    <v-icon size="small" class="youtube-icon" color="red">mdi-youtube</v-icon>
                  </router-link>
                  <div
                    v-if="isScheduled(match)"
                    class="ml-2 scheduled-badge"
                  >
                    <v-icon size="small" class="scheduled-icon">mdi-clock-outline</v-icon>
                    <span class="scheduled-text">Scheduled</span>
                  </div>
                </div>
                <div class="match-meta">
                  <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                  <span>{{ formatDate(match.date) }}</span>
                  <span class="mx-1">•</span>
                  <span>{{ getTournamentName(match.tournamentId) || 'Friendly Match' }}</span>
                  <span v-if="match.round" class="mx-1">•</span>
                  <span v-if="match.round" class="match-round">Round {{ match.round }}</span>
                </div>
                <div v-if="match.player1TeamId || match.player2TeamId" class="match-teams">
                  <v-chip size="x-small" color="primary" variant="flat" class="mr-1">{{ getTeamName(match.player1TeamId) }}</v-chip>
                  vs
                  <v-chip size="x-small" color="secondary" variant="flat" class="ml-1">{{ getTeamName(match.player2TeamId) }}</v-chip>
                </div>
                <div v-if="isScheduled(match) && (!match.player1Id || !match.player2Id)" class="match-info-note">
                  <v-icon size="x-small" class="mr-1">mdi-information</v-icon>
                  Players to be determined
                </div>
              </v-col>
              <v-col cols="12" md="auto" class="match-right-col">
                <div class="d-flex align-center match-right-content">
                  <div v-if="!isScheduled(match)" class="match-score match-score-desktop">
                    <div class="match-score-value">{{ getSetsWon(match) }}</div>
                    <div class="match-score-breakdown">{{ getSetBreakdown(match) }}</div>
                  </div>
                  <div v-if="!isScheduled(match)" class="match-score match-score-mobile">
                    <div class="match-score-value">{{ getSetsWon(match) }}</div>
                    <div class="match-score-breakdown">{{ getSetBreakdown(match) }}</div>
                  </div>
                  <div class="match-actions">
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="openMatchDialog(match)" class="action-btn" :disabled="isGuest"></v-btn>
                    <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click.stop="confirmDelete(match)" class="action-btn" :disabled="isGuest"></v-btn>
                    <v-btn v-if="!isScheduled(match)" icon="mdi-arrow-right" variant="text" size="small" :to="`/matches/${match.id}`" class="action-btn"></v-btn>
                  </div>
                </div>
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
                <v-btn icon="mdi-plus" size="small" @click="showTournamentDialog = true" :disabled="isGuest"></v-btn>
              </template>
            </v-autocomplete>

            <v-autocomplete
              v-if="isTournamentMatch && availableGroupRounds.length > 0"
              v-model="formData.round"
              :items="availableGroupRounds"
              label="Round/Group"
              variant="outlined"
              :rules="[v => !!v || 'Round is required']"
              clearable
            ></v-autocomplete>
            
            <v-text-field
              v-else-if="isLeagueMatch || isTournamentMatch"
              v-model="formData.round"
              label="Round"
              variant="outlined"
              :placeholder="isTournamentMatch ? 'e.g., Group A, Quarter-Final' : 'e.g., Round 1, Round 5'"
              :rules="[v => !!v || 'Round is required']"
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
                <v-btn icon="mdi-plus" size="small" @click="showTeamDialog = true" :disabled="isGuest"></v-btn>
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
                <v-btn icon="mdi-plus" size="small" @click="showTeamDialog = true" :disabled="isGuest"></v-btn>
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
              @update:model-value="onPlayer1Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true" :disabled="isGuest"></v-btn>
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
              @update:model-value="onPlayer2Selected"
            >
              <template v-slot:append>
                <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true" :disabled="isGuest"></v-btn>
              </template>
            </v-autocomplete>

            <template v-if="isDoublesMatch">
              <v-autocomplete
                v-model="formData.player3Id"
                :items="filteredPlayer3List"
                item-title="name"
                item-value="id"
                label="Player 3 (Team 1 - Second Player)"
                variant="outlined"
                :rules="[
                  isScheduledMatch ? null : (v => !!v || 'Player 3 is required for doubles'),
                  v => validatePlayerTeam(v, formData.player1TeamId, 'Player 3')
                ].filter(r => r !== null)"
                @update:model-value="onPlayer3Selected"
              >
                <template v-slot:append>
                  <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true" :disabled="isGuest"></v-btn>
                </template>
              </v-autocomplete>

              <v-autocomplete
                v-model="formData.player4Id"
                :items="filteredPlayer4List"
                item-title="name"
                item-value="id"
                label="Player 4 (Team 2 - Second Player)"
                variant="outlined"
                :rules="[
                  isScheduledMatch ? null : (v => !!v || 'Player 4 is required for doubles'),
                  v => validatePlayerTeam(v, formData.player2TeamId, 'Player 4')
                ].filter(r => r !== null)"
                @update:model-value="onPlayer4Selected"
              >
                <template v-slot:append>
                  <v-btn icon="mdi-plus" size="small" @click="showOpponentDialog = true" :disabled="isGuest"></v-btn>
                </template>
              </v-autocomplete>
            </template>

            <div class="d-flex mb-2">
              <v-checkbox
                v-model="isScheduledMatch"
                label="This is a scheduled match (no scores yet)"
                @update:model-value="onScheduledMatchChange"
              ></v-checkbox>
              <v-checkbox
                v-model="isDoublesMatch"
                label="Doubles Match (2 vs 2)"
                class="ml-4"
                @update:model-value="onDoublesMatchChange"
              ></v-checkbox>
            </div>

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
                    <v-btn icon="mdi-close" size="small" @click="removeScore(index)" v-if="formData.scores.length > 1" :disabled="isGuest"></v-btn>
                  </v-col>
                </v-row>
                <v-btn prepend-icon="mdi-plus" size="small" @click="addScore" :disabled="isGuest">Add Set</v-btn>
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
          <v-btn color="primary" @click="saveMatch" :disabled="isGuest">Save</v-btn>
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
            v-model="newOpponent.club"
            :items="allTeamsList"
            item-title="name"
            item-value="name"
            label="Team/Club"
            variant="outlined"
            clearable
          >
            <template v-slot:append>
              <v-btn icon="mdi-plus" size="small" @click="showTeamDialog = true" :disabled="isGuest"></v-btn>
            </template>
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showOpponentDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addOpponent" :disabled="isGuest">Add</v-btn>
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
          <v-btn color="primary" @click="addTournament" :disabled="isGuest">Add</v-btn>
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
          <v-btn color="primary" @click="addTeam" :disabled="isGuest">Add</v-btn>
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
          <v-btn color="error" @click="deleteMatch" :disabled="isGuest">Delete</v-btn>
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
import { useAuth } from '../composables/useAuth'
import { formatDate } from '../utils/date'
import { getYouTubeEmbedUrl } from '../utils/storage'

const route = useRoute()
const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()
const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()
const { isGuest } = useAuth()

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
const isDoublesMatch = ref(false)

const formData = ref({
  player1Id: '',
  player2Id: '',
  player3Id: '',
  player4Id: '',
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
  serveStats: { successRate: 0, returnPoints: 0 },
  isDoubles: false
})

const newOpponent = ref({
  name: '',
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
  // Check date locking for tournament matches
  if (newTournamentId && isTournamentMatch.value) {
    checkRoundDate()
  }
})

watch(() => formData.value.round, () => {
  checkRoundDate()
})

const checkRoundDate = () => {
  if (!formData.value.tournamentId) {
    dateLocked.value = false
    return
  }

  // For league matches: lock date by round
  if (isLeagueMatch.value && formData.value.round) {
    const existingMatch = matchesStore.matches.find(m => 
      m.tournamentId === formData.value.tournamentId && 
      m.round === formData.value.round &&
      m.id !== editingMatch.value?.id
    )

    if (existingMatch && existingMatch.date) {
      const matchDate = existingMatch.date instanceof Date 
        ? existingMatch.date 
        : (existingMatch.date?.toDate ? existingMatch.date.toDate() : new Date(existingMatch.date))
      formData.value.date = matchDate.toISOString().split('T')[0]
      dateLocked.value = true
    } else {
      dateLocked.value = false
    }
    return
  }

  // For tournament matches: lock date for all matches in the tournament
  if (isTournamentMatch.value) {
    const existingMatch = matchesStore.matches.find(m => 
      m.tournamentId === formData.value.tournamentId &&
      m.id !== editingMatch.value?.id &&
      m.date
    )

    if (existingMatch && existingMatch.date) {
      const matchDate = existingMatch.date instanceof Date 
        ? existingMatch.date 
        : (existingMatch.date?.toDate ? existingMatch.date.toDate() : new Date(existingMatch.date))
      formData.value.date = matchDate.toISOString().split('T')[0]
      dateLocked.value = true
    } else {
      dateLocked.value = false
    }
    return
  }

  dateLocked.value = false
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

const getPlayer3Hint = () => {
  if (isLeagueMatch.value && formData.value.player1TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player1TeamId)
    return team ? `Only players from ${team.name} are shown (excluding Player 1)` : ''
  }
  return ''
}

const getPlayer4Hint = () => {
  if (isLeagueMatch.value && formData.value.player2TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player2TeamId)
    return team ? `Only players from ${team.name} are shown (excluding Player 2)` : ''
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

const onPlayer3Selected = () => {
  if (!isLeagueMatch.value || !formData.value.tournamentId || !formData.value.player3Id) {
    return
  }

  // Player 3 must be from Team 1 (same as Player 1)
  if (formData.value.player1TeamId) {
    const playerTeamId = getPlayerTeamFromClub(formData.value.player3Id, formData.value.tournamentId)
    if (playerTeamId !== formData.value.player1TeamId) {
      // Clear player if it doesn't match Team 1
      formData.value.player3Id = ''
      return
    }
    // Ensure player3 is not the same as player1
    if (formData.value.player3Id === formData.value.player1Id) {
      formData.value.player3Id = ''
      return
    }
  }
}

const onPlayer4Selected = () => {
  if (!isLeagueMatch.value || !formData.value.tournamentId || !formData.value.player4Id) {
    return
  }

  // Player 4 must be from Team 2 (same as Player 2)
  if (formData.value.player2TeamId) {
    const playerTeamId = getPlayerTeamFromClub(formData.value.player4Id, formData.value.tournamentId)
    if (playerTeamId !== formData.value.player2TeamId) {
      // Clear player if it doesn't match Team 2
      formData.value.player4Id = ''
      return
    }
    // Ensure player4 is not the same as player2
    if (formData.value.player4Id === formData.value.player2Id) {
      formData.value.player4Id = ''
      return
    }
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
  // Filter by group for tournament matches
  if (isTournamentMatch.value && formData.value.tournamentId && formData.value.round) {
    const round = formData.value.round
    if (round.startsWith('Group ')) {
      const groupName = round.replace('Group ', '')
      const tournament = tournamentsStore.tournaments.find(t => t.id === formData.value.tournamentId)
      if (tournament?.groups) {
        const group = tournament.groups.find(g => g.name === groupName)
        if (group?.players) {
          return opponentsList.value.filter(player => group.players.includes(player.id))
        }
      }
    }
  }
  
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
  // Filter by group for tournament matches
  if (isTournamentMatch.value && formData.value.tournamentId && formData.value.round) {
    const round = formData.value.round
    if (round.startsWith('Group ')) {
      const groupName = round.replace('Group ', '')
      const tournament = tournamentsStore.tournaments.find(t => t.id === formData.value.tournamentId)
      if (tournament?.groups) {
        const group = tournament.groups.find(g => g.name === groupName)
        if (group?.players) {
          return opponentsList.value.filter(player => 
            group.players.includes(player.id) && player.id !== formData.value.player1Id
          )
        }
      }
    }
  }
  
  if (!isLeagueMatch.value || !formData.value.tournamentId) {
    return opponentsList.value.filter(player => player.id !== formData.value.player1Id)
  }
  
  // If team is selected, only show players from that team
  if (formData.value.player2TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player2TeamId)
    if (team) {
      return opponentsList.value.filter(player => {
        return player.club === team.name && player.id !== formData.value.player1Id
      })
    }
  }
  
  return opponentsList.value.filter(player => player.id !== formData.value.player1Id)
})

const filteredPlayer3List = computed(() => {
  // Filter by group for tournament matches
  if (isTournamentMatch.value && formData.value.tournamentId && formData.value.round) {
    const round = formData.value.round
    if (round.startsWith('Group ')) {
      const groupName = round.replace('Group ', '')
      const tournament = tournamentsStore.tournaments.find(t => t.id === formData.value.tournamentId)
      if (tournament?.groups) {
        const group = tournament.groups.find(g => g.name === groupName)
        if (group?.players) {
          return opponentsList.value.filter(player => 
            group.players.includes(player.id) && 
            player.id !== formData.value.player1Id && 
            player.id !== formData.value.player2Id
          )
        }
      }
    }
  }
  
  if (!isLeagueMatch.value || !formData.value.tournamentId) {
    return opponentsList.value.filter(player => 
      player.id !== formData.value.player1Id && player.id !== formData.value.player2Id
    )
  }
  
  // Player 3 must be from Team 1 (same as Player 1)
  if (formData.value.player1TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player1TeamId)
    if (team) {
      return opponentsList.value.filter(player => {
        // Exclude player1 and player2 to avoid selecting the same player twice
        return player.club === team.name && 
               player.id !== formData.value.player1Id && 
               player.id !== formData.value.player2Id
      })
    }
  }
  
  return opponentsList.value.filter(player => 
    player.id !== formData.value.player1Id && player.id !== formData.value.player2Id
  )
})

const filteredPlayer4List = computed(() => {
  // Filter by group for tournament matches
  if (isTournamentMatch.value && formData.value.tournamentId && formData.value.round) {
    const round = formData.value.round
    if (round.startsWith('Group ')) {
      const groupName = round.replace('Group ', '')
      const tournament = tournamentsStore.tournaments.find(t => t.id === formData.value.tournamentId)
      if (tournament?.groups) {
        const group = tournament.groups.find(g => g.name === groupName)
        if (group?.players) {
          return opponentsList.value.filter(player => 
            group.players.includes(player.id) && 
            player.id !== formData.value.player1Id && 
            player.id !== formData.value.player2Id &&
            player.id !== formData.value.player3Id
          )
        }
      }
    }
  }
  
  if (!isLeagueMatch.value || !formData.value.tournamentId) {
    return opponentsList.value.filter(player => 
      player.id !== formData.value.player1Id && 
      player.id !== formData.value.player2Id &&
      player.id !== formData.value.player3Id
    )
  }
  
  // Player 4 must be from Team 2 (same as Player 2)
  if (formData.value.player2TeamId) {
    const team = teamsStore.teams.find(t => t.id === formData.value.player2TeamId)
    if (team) {
      return opponentsList.value.filter(player => {
        // Exclude player1, player2, and player3 to avoid selecting the same player twice
        return player.club === team.name && 
               player.id !== formData.value.player2Id &&
               player.id !== formData.value.player1Id &&
               player.id !== formData.value.player3Id
      })
    }
  }
  
  return opponentsList.value.filter(player => 
    player.id !== formData.value.player1Id && 
    player.id !== formData.value.player2Id &&
    player.id !== formData.value.player3Id
  )
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

const isTournamentMatch = computed(() => {
  const tournament = tournamentsStore.tournaments.find(t => t.id === formData.value.tournamentId)
  return tournament?.type === 'Tournament'
})

const availableGroupRounds = computed(() => {
  if (!isTournamentMatch.value || !formData.value.tournamentId) return []
  
  const tournament = tournamentsStore.tournaments.find(t => t.id === formData.value.tournamentId)
  const rounds = new Set()
  
  if (tournament?.groups) {
    tournament.groups.forEach(g => {
      rounds.add(`Group ${g.name}`)
    })
  }
  
  const knockoutRounds = ['Quarter-Final', 'Semi-Final', 'Final']
  knockoutRounds.forEach(round => {
    rounds.add(round)
  })
  
  const existingRounds = matchesStore.matches
    .filter(m => m.tournamentId === formData.value.tournamentId && m.round)
    .map(m => m.round)
  
  existingRounds.forEach(round => {
    if (round && !round.startsWith('Group ')) {
      rounds.add(round)
    }
  })
  
  return Array.from(rounds).sort((a, b) => {
    const knockoutOrder = ['Quarter-Final', 'Semi-Final', 'Final']
    const aIndex = knockoutOrder.indexOf(a)
    const bIndex = knockoutOrder.indexOf(b)
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return 1
    if (bIndex !== -1) return -1
    
    return a.localeCompare(b)
  })
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
    const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
    const hasScores = match.scores && match.scores.length > 0 && match.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
    isScheduledMatch.value = match.status === 'scheduled' || (!hasScores && matchDate > new Date())
    isDoublesMatch.value = match.isDoubles || false
    
    formData.value = {
      ...match,
      date: matchDate.toISOString().split('T')[0],
      youtubeUrl: match.videoUrls && match.videoUrls.length > 0 ? match.videoUrls[0] : '',
      tacticsUsed: match.tacticsUsed || '',
      tacticsToImprove: match.tacticsToImprove || '',
      opponentWeaknesses: match.opponentWeaknesses || '',
      player3Id: match.player3Id || '',
      player4Id: match.player4Id || '',
      isDoubles: match.isDoubles || false
    }
    setTimeout(() => {
      checkRoundDate()
      if (formData.value.player1Id) onPlayer1Selected()
      if (formData.value.player2Id) onPlayer2Selected()
      if (formData.value.player3Id) onPlayer3Selected()
      if (formData.value.player4Id) onPlayer4Selected()
    }, 100)
  } else {
    editingMatch.value = null
    const today = new Date()
    const matchDate = new Date(today)
    matchDate.setDate(today.getDate() + 7)
    isScheduledMatch.value = true
    isDoublesMatch.value = false
    
    // Find default tournament
    const defaultTournament = tournamentsStore.tournaments.find(t => t.isDefault)
    formData.value = {
      tournamentId: defaultTournament ? defaultTournament.id : '',
      round: '',
      player1Id: '',
      player2Id: '',
      player3Id: '',
      player4Id: '',
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
    // For doubles matches, require all 4 players
    if (isDoublesMatch.value) {
      if (!formData.value.player3Id || !formData.value.player4Id) {
        alert('Please select all 4 players for doubles matches')
        return
      }
      // Validate doubles players are from correct teams
      if (formData.value.player1TeamId) {
        const player3TeamId = getPlayerTeamFromClub(formData.value.player3Id, formData.value.tournamentId)
        if (player3TeamId !== formData.value.player1TeamId) {
          alert('Player 3 must be from the same team as Player 1')
          return
        }
      }
      if (formData.value.player2TeamId) {
        const player4TeamId = getPlayerTeamFromClub(formData.value.player4Id, formData.value.tournamentId)
        if (player4TeamId !== formData.value.player2TeamId) {
          alert('Player 4 must be from the same team as Player 2')
          return
        }
      }
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
    status: status,
    isDoubles: isDoublesMatch.value
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
    newOpponent.value = { name: '', club: '' }
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

.match-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  margin-bottom: 16px;
  background: white !important;
}

.match-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(220, 20, 60, 0.25) !important;
}

.match-card-content {
  padding: 20px !important;
}

@media (max-width: 960px) {
  .match-card-content {
    padding: 16px !important;
  }
  
  .match-row {
    flex-direction: column;
  }
  
  .match-info-col {
    order: 1;
    padding-bottom: 12px !important;
    width: 100%;
  }
  
  .match-info-col {
    order: 1;
  }
  
  .match-right-col {
    order: 2;
    width: 100%;
    padding-top: 4px !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  
  .match-info-col {
    padding-bottom: 4px !important;
  }
  
  .match-right-content {
    width: 100%;
    justify-content: flex-start !important;
    flex-wrap: nowrap;
    gap: 12px;
  }
  
  .match-right-col {
    justify-content: flex-start !important;
  }
  
  .match-score-desktop {
    display: none !important;
  }
  
  .match-score-mobile {
    display: block !important;
    text-align: left;
  }
  
  .match-score-mobile .match-score-value {
    font-size: 2rem !important;
  }
  
  .match-actions {
    flex-shrink: 0;
  }
  
  .match-actions {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
  
  .match-title {
    font-size: 1.1rem !important;
    line-height: 1.4;
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  .match-header {
    flex-wrap: wrap;
  }
  
  .match-meta {
    font-size: 0.8rem !important;
    margin-bottom: 8px;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .match-meta span {
    display: inline;
    white-space: nowrap;
  }
  
  .match-meta .v-icon {
    flex-shrink: 0;
  }
  
  .upcoming-badge {
    min-width: 60px;
    padding: 8px 12px;
  }
  
  .upcoming-icon {
    font-size: 20px !important;
    margin-bottom: 2px;
  }
  
  .upcoming-text {
    font-size: 10px !important;
  }
  
  .match-score {
    text-align: center;
  }
  
  .match-score-value {
    font-size: 2rem !important;
  }
}

.scheduled-match {
  border-left: 5px solid #FFD700;
  border-color: rgba(255, 215, 0, 0.4);
  background: white !important;
}

.scheduled-match:hover {
  border-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%) !important;
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3) !important;
}

.completed-match {
  border-left: 5px solid #DC143C;
  border-color: rgba(220, 20, 60, 0.4);
  background: white !important;
}

.completed-match:hover {
  border-color: #DC143C;
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(200, 16, 46, 0.1) 100%) !important;
  box-shadow: 0 8px 24px rgba(220, 20, 60, 0.3) !important;
}

.scheduled-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF9800 100%);
  color: white;
  font-weight: 600;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.scheduled-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.scheduled-badge:hover::before {
  left: 100%;
}

.scheduled-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
}

.scheduled-icon {
  color: white !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.scheduled-text {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.3px;
}

.youtube-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #FF0000;
  border-radius: 6px;
  padding: 2px 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(255, 0, 0, 0.2);
  text-decoration: none;
}

.youtube-badge:hover {
  background: #FF0000;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(255, 0, 0, 0.4);
}

.youtube-badge:hover .youtube-icon {
  color: white !important;
}

.youtube-icon {
  transition: color 0.2s ease;
}

.upcoming-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF9800 100%);
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(255, 215, 0, 0.4);
  min-width: 70px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.upcoming-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.upcoming-badge:hover::before {
  left: 100%;
}

.upcoming-badge:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
}

.upcoming-icon {
  font-size: 24px !important;
  margin-bottom: 2px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.upcoming-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.match-header {
  margin-bottom: 8px;
}

.match-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.match-meta {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 960px) {
  .match-meta {
    flex-wrap: wrap;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    line-height: 1.5;
    max-height: 3em;
  }
}

.match-round {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
}

.match-teams {
  margin: 8px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.match-info-note {
  font-size: 0.75rem;
  color: #2196F3;
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.match-score {
  text-align: center;
  padding: 8px;
}

.match-score-mobile {
  display: none;
}

.match-score-desktop {
  display: none;
}

.match-score-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #DC143C;
  line-height: 1;
  margin-bottom: 4px;
}

.match-score-breakdown {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.match-right-col {
  flex: 0 0 auto;
}

.match-right-content {
  min-width: fit-content;
  justify-content: flex-start;
}

@media (min-width: 960px) {
  .match-score-desktop {
    display: block;
  }
  
  .match-info-col {
    flex: 0 0 auto;
  }
  
  .match-right-col {
    flex: 1 1 auto;
    display: flex;
    justify-content: flex-end;
  }
  
  .match-right-content {
    justify-content: flex-end;
  }
}

.match-right-col {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.match-right-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.match-actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
}

@media (min-width: 960px) {
  .match-actions {
    flex-direction: column;
    gap: 8px;
  }
}

.action-btn {
  min-width: 40px;
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

