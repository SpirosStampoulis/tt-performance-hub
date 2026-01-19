<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openOpponentDialog()"
          size="large"
          rounded="lg"
          elevation="2"
          :disabled="isGuest"
          class="mr-2"
        >
          Add Player
        </v-btn>
        <v-btn
          color="info"
          prepend-icon="mdi-cloud-download"
          @click="showMTTASyncDialog = true"
          size="large"
          rounded="lg"
          elevation="2"
          :disabled="isGuest"
        >
          Sync from MTTA
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search players"
          variant="outlined"
          density="compact"
          clearable
        ></v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="opponent in filteredOpponents" :key="opponent.id" cols="12" md="6" lg="4">
        <v-card
          class="opponent-card"
          hover
          elevation="4"
          @click="$router.push(`/opponents/${opponent.id}`)"
        >
          <v-card-text class="pa-5">
            <v-row align="center">
              <v-col cols="auto">
                <v-avatar size="80" :color="opponent.photoUrl ? undefined : 'primary'" class="opponent-avatar">
                  <v-img v-if="opponent.photoUrl" :src="opponent.photoUrl"></v-img>
                  <span v-else class="text-h5 text-white font-weight-bold">{{ getInitials(opponent.name) }}</span>
                </v-avatar>
              </v-col>
              <v-col>
                <div class="text-h6 font-weight-bold mb-2">{{ opponent.name }}</div>
                <div class="text-caption mb-2">
                  <v-chip size="x-small" color="secondary" variant="flat">{{ opponent.club || 'No team' }}</v-chip>
                </div>
                <div v-if="opponent.mttaStartPosition || opponent.mttaCurrentPosition || opponent.mttaTotalPoints || opponent.mttaRank || opponent.alphaRanking || opponent.topspinRanking" class="text-caption mt-2 mb-2">
                  <div v-if="opponent.mttaStartPosition || opponent.mttaCurrentPosition || opponent.mttaTotalPoints || opponent.mttaRank" class="mb-1">
                    <v-chip size="x-small" color="info" variant="flat" class="mr-1" v-if="opponent.mttaRank">MTTA Rank: #{{ opponent.mttaRank }}</v-chip>
                    <v-chip size="x-small" color="info" variant="flat" class="mr-1" v-if="opponent.mttaStartPosition">Start: {{ opponent.mttaStartPosition }}</v-chip>
                    <v-chip size="x-small" color="info" variant="flat" class="mr-1" v-if="opponent.mttaCurrentPosition">Current: {{ opponent.mttaCurrentPosition }}</v-chip>
                    <v-chip size="x-small" color="info" variant="flat" v-if="opponent.mttaTotalPoints">Points: {{ opponent.mttaTotalPoints }}</v-chip>
                  </div>
                  <div>
                    <v-chip size="x-small" color="warning" variant="flat" class="mr-1" v-if="opponent.alphaRanking">Alpha: {{ opponent.alphaRanking }}</v-chip>
                    <v-chip size="x-small" color="warning" variant="flat" v-if="opponent.topspinRanking">Topspin: {{ opponent.topspinRanking }}</v-chip>
                  </div>
                </div>
                <div class="text-caption text-medium-emphasis mt-2">
                  <v-icon size="small" class="mr-1">mdi-trophy</v-icon>
                  {{ getMatchCount(opponent.id) }} matches
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn icon="mdi-pencil" size="small" variant="text" @click.stop="openOpponentDialog(opponent)" :disabled="isGuest"></v-btn>
            <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click.stop="confirmDelete(opponent)" :disabled="isGuest"></v-btn>
            <v-spacer></v-spacer>
            <v-btn append-icon="mdi-arrow-right" variant="text" size="small">View Profile</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="opponentDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingOpponent ? 'Edit Player' : 'Add Player' }}</v-card-title>
        <v-card-text>
          <v-form ref="opponentForm">
            <v-text-field
              v-model="formData.name"
              label="Name"
              variant="outlined"
              :rules="[v => !!v || 'Name is required']"
            ></v-text-field>

            <v-select
              v-model="formData.club"
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

            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-subtitle-2">MTTA Ranking</v-card-title>
              <v-card-text>
                <v-text-field
                  v-model.number="formData.mttaStartPosition"
                  label="Start Position"
                  type="number"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., 150"
                ></v-text-field>
                <v-text-field
                  v-model.number="formData.mttaCurrentPosition"
                  label="Current Position"
                  type="number"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., 145"
                ></v-text-field>
                <v-text-field
                  v-model.number="formData.mttaTotalPoints"
                  label="Total Points"
                  type="number"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., 2500"
                ></v-text-field>
              </v-card-text>
            </v-card>

            <v-text-field
              v-model.number="formData.alphaRanking"
              label="Alpha Ranking"
              type="number"
              variant="outlined"
              placeholder="e.g., 1200"
            ></v-text-field>

            <v-text-field
              v-model.number="formData.topspinRanking"
              label="Topspin Ranking"
              type="number"
              variant="outlined"
              placeholder="e.g., 1800"
            ></v-text-field>

            <v-file-input
              v-model="photoFile"
              label="Profile Photo"
              variant="outlined"
              accept="image/*"
              prepend-icon=""
              prepend-inner-icon="mdi-camera"
              :clearable="!isGuest"
              :disabled="isGuest"
            ></v-file-input>

            <v-textarea
              v-model="formData.notes"
              label="Notes"
              variant="outlined"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeOpponentDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveOpponent" :loading="saving" :disabled="isGuest">Save</v-btn>
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
        <v-card-title>Delete Player</v-card-title>
        <v-card-text>
          Are you sure you want to delete this player? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteOpponent" :disabled="isGuest">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showMTTASyncDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="dialog-header">
          <span>Sync Players from MTTA</span>
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            size="small"
            class="dialog-close-btn"
            @click="closeMTTASyncDialog"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-alert v-if="mttaError" type="error" class="mb-4">
            {{ mttaError }}
            <div v-if="mttaError.includes('CORS')" class="mt-2 text-caption">
              <strong>Note:</strong> Due to CORS restrictions, you may need to set up a CORS proxy. 
              Add <code>VITE_CORS_PROXY=https://your-proxy-url.com/</code> to your <code>.env</code> file.
            </div>
          </v-alert>
          
          <v-text-field
            v-model="mttaTeamName"
            label="MTTA Team Name"
            variant="outlined"
            placeholder='e.g., TopSpin TTA "Skelton"'
            hint="Enter the exact team name as it appears on results.mtta.mt"
            persistent-hint
            class="mb-4"
          ></v-text-field>

          <v-card v-if="mttaTeamData" variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1">Team Stats</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Wins</div>
                  <div class="text-h6">{{ mttaTeamData.stats.wins ?? 'N/A' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Losses</div>
                  <div class="text-h6">{{ mttaTeamData.stats.losses ?? 'N/A' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Total Games</div>
                  <div class="text-h6">{{ mttaTeamData.stats.totalGames ?? 'N/A' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Win Rate</div>
                  <div class="text-h6">{{ mttaTeamData.stats.winRate ? `${mttaTeamData.stats.winRate}%` : 'N/A' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-card v-if="mttaTeamData?.teamFormation?.length > 0" variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1">Team Formation ({{ mttaTeamData.teamFormation.length }} players)</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="(player, index) in mttaTeamData.teamFormation"
                  :key="index"
                >
                  <v-list-item-title>{{ player.name }}</v-list-item-title>
                  <v-list-item-subtitle>Rank #{{ player.rank }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <v-card v-if="mttaPotentialMatches && mttaPotentialMatches.length > 0" variant="outlined" class="mb-4" color="warning">
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" color="warning">mdi-alert</v-icon>
              Potential Matches Found ({{ mttaPotentialMatches.length }})
            </v-card-title>
            <v-card-text>
              <v-alert type="info" variant="tonal" class="mb-4">
                The system found similar names in your database. Please confirm if these are the same person or create new players.
              </v-alert>
              <v-list density="compact">
                <v-list-item
                  v-for="(match, index) in mttaPotentialMatches"
                  :key="index"
                  class="mb-2"
                  style="border: 1px solid rgba(0,0,0,0.12); border-radius: 8px;"
                >
                  <v-list-item-title class="mb-2">
                    <strong>MTTA:</strong> {{ match.mttaName }} (Rank #{{ match.mttaRank }})
                  </v-list-item-title>
                  <v-list-item-subtitle class="mb-2">
                    <strong>Your DB:</strong> {{ match.existingPlayer.name }}
                    <v-chip size="x-small" color="info" class="ml-2">
                      {{ (match.matchScore * 100).toFixed(0) }}% match
                    </v-chip>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption text-medium-emphasis mb-2">
                    {{ match.reason }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <div class="d-flex flex-column gap-2">
                      <v-btn
                        size="small"
                        color="success"
                        variant="flat"
                        @click="confirmMatch(match.mttaName, match.existingPlayer.id)"
                        :disabled="mttaNameMappings[match.mttaName] === match.existingPlayer.id"
                      >
                        <v-icon size="small" class="mr-1">mdi-check</v-icon>
                        Match
                      </v-btn>
                      <v-btn
                        size="small"
                        color="grey"
                        variant="text"
                        @click="rejectMatch(match.mttaName)"
                        :disabled="!mttaNameMappings[match.mttaName]"
                      >
                        <v-icon size="small" class="mr-1">mdi-close</v-icon>
                        New Player
                      </v-btn>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeMTTASyncDialog" :disabled="mttaLoading">Cancel</v-btn>
          <v-btn 
            color="info" 
            prepend-icon="mdi-download" 
            @click="fetchMTTAData"
            :loading="mttaLoading"
            :disabled="!mttaTeamName || mttaLoading"
          >
            Fetch Data
          </v-btn>
          <v-btn 
            color="success" 
            prepend-icon="mdi-sync" 
            @click="syncMTTAPlayers"
            :loading="mttaSyncing"
            :disabled="!mttaTeamData || mttaSyncing || isGuest"
          >
            Sync Players
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOpponentsStore } from '../stores/opponents'
import { useMatchesStore } from '../stores/matches'
import { useTeamsStore } from '../stores/teams'
import { useTournamentsStore } from '../stores/tournaments'
import { useAuth } from '../composables/useAuth'
import { useMTTA } from '../composables/useMTTA'
import { uploadImage } from '../utils/storage'

const opponentsStore = useOpponentsStore()
const matchesStore = useMatchesStore()
const teamsStore = useTeamsStore()
const tournamentsStore = useTournamentsStore()
const { isGuest } = useAuth()
const { loading: mttaLoading, error: mttaError, teamData: mttaTeamData, potentialMatches: mttaPotentialMatches, fetchTeamData, syncPlayers } = useMTTA()

const opponentDialog = ref(false)
const showTeamDialog = ref(false)
const deleteDialog = ref(false)
const editingOpponent = ref(null)
const opponentToDelete = ref(null)
const search = ref('')
const opponentForm = ref(null)
const photoFile = ref(null)
const saving = ref(false)

const newTeam = ref({
  name: '',
  tournamentId: '',
  isMyTeam: false
})

const showMTTASyncDialog = ref(false)
const mttaTeamName = ref('TopSpin TTA "Skelton"')
const mttaSyncing = ref(false)
const mttaNameMappings = ref({})

const formData = ref({
  name: '',
  club: '',
  mttaStartPosition: null,
  mttaCurrentPosition: null,
  mttaTotalPoints: null,
  alphaRanking: null,
  topspinRanking: null,
  notes: '',
  photoUrl: ''
})

onMounted(async () => {
  await Promise.all([
    opponentsStore.fetchOpponents(),
    matchesStore.fetchMatches(),
    teamsStore.fetchTeams(),
    tournamentsStore.fetchTournaments()
  ])
})

const allTeamsList = computed(() => {
  return teamsStore.teams.map(t => ({
    id: t.id,
    name: t.name
  }))
})

const leagueTournaments = computed(() => {
  return tournamentsStore.tournaments
    .filter(t => t.type === 'League')
    .map(t => ({
      ...t,
      displayName: `${t.name} (${t.year})`
    }))
})

const filteredOpponents = computed(() => {
  let opponents = opponentsStore.opponents

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    opponents = opponents.filter(o =>
      o.name.toLowerCase().includes(searchLower) ||
      o.club?.toLowerCase().includes(searchLower)
    )
  }


  return opponents
})

const openOpponentDialog = (opponent = null) => {
  if (opponent) {
    editingOpponent.value = opponent
    formData.value = { ...opponent }
  } else {
    editingOpponent.value = null
    formData.value = {
      name: '',
      club: '',
      mttaStartPosition: null,
      mttaCurrentPosition: null,
      mttaTotalPoints: null,
      alphaRanking: null,
      topspinRanking: null,
      notes: '',
      photoUrl: ''
    }
  }
  photoFile.value = null
  opponentDialog.value = true
}

const closeOpponentDialog = () => {
  opponentDialog.value = false
  editingOpponent.value = null
}

const saveOpponent = async () => {
  if (opponentForm.value) {
    const { valid } = await opponentForm.value.validate()
    if (!valid) return
  }

  saving.value = true
  try {
    let photoUrl = formData.value.photoUrl || null

    if (photoFile.value && photoFile.value.length > 0) {
      photoUrl = await uploadImage(photoFile.value[0], 'opponents')
    }

    const opponentData = {
      name: formData.value.name,
      club: formData.value.club || null,
      mttaStartPosition: formData.value.mttaStartPosition || null,
      mttaCurrentPosition: formData.value.mttaCurrentPosition || null,
      mttaTotalPoints: formData.value.mttaTotalPoints || null,
      alphaRanking: formData.value.alphaRanking || null,
      topspinRanking: formData.value.topspinRanking || null,
      notes: formData.value.notes || null,
      photoUrl: photoUrl || null
    }

    // Remove undefined values
    Object.keys(opponentData).forEach(key => {
      if (opponentData[key] === undefined) {
        opponentData[key] = null
      }
    })

    if (editingOpponent.value) {
      await opponentsStore.updateOpponent(editingOpponent.value.id, opponentData)
    } else {
      await opponentsStore.addOpponent(opponentData)
    }
    
    closeOpponentDialog()
  } catch (error) {
    console.error('Error saving opponent:', error)
    alert('Error saving player: ' + error.message)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (opponent) => {
  opponentToDelete.value = opponent
  deleteDialog.value = true
}

const deleteOpponent = async () => {
  try {
    await opponentsStore.deleteOpponent(opponentToDelete.value.id)
    deleteDialog.value = false
    opponentToDelete.value = null
  } catch (error) {
    console.error('Error deleting opponent:', error)
  }
}

const addTeam = async () => {
  try {
    await teamsStore.addTeam(newTeam.value)
    showTeamDialog.value = false
    newTeam.value = { name: '', tournamentId: '', isMyTeam: false }
  } catch (error) {
    console.error('Error adding team:', error)
  }
}

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}


const getMatchCount = (opponentId) => {
  return matchesStore.getMatchesByOpponent(opponentId).length
}

const fetchMTTAData = async () => {
  try {
    await fetchTeamData(mttaTeamName.value)
  } catch (error) {
    console.error('Error fetching MTTA data:', error)
  }
}

const confirmMatch = (mttaName, opponentId) => {
  mttaNameMappings.value[mttaName] = opponentId
}

const rejectMatch = (mttaName) => {
  delete mttaNameMappings.value[mttaName]
}

const syncMTTAPlayers = async () => {
  if (!mttaTeamName.value) return
  
  mttaSyncing.value = true
  try {
    const result = await syncPlayers(mttaTeamName.value, mttaNameMappings.value)
    alert(`Successfully synced ${result.syncedCount} player(s) from MTTA!`)
    await opponentsStore.fetchOpponents()
    closeMTTASyncDialog()
  } catch (error) {
    console.error('Error syncing MTTA players:', error)
    alert('Error syncing players: ' + (error.message || 'Unknown error'))
  } finally {
    mttaSyncing.value = false
  }
}

const closeMTTASyncDialog = () => {
  showMTTASyncDialog.value = false
  mttaTeamName.value = 'TopSpin TTA "Skelton"'
  mttaNameMappings.value = {}
}
</script>

<style scoped>
.opponent-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 3px solid rgba(220, 20, 60, 0.25);
  background: white !important;
}

.opponent-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(220, 20, 60, 0.3) !important;
  border-color: rgba(220, 20, 60, 0.6);
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.08) 0%, rgba(255, 215, 0, 0.08) 100%) !important;
}

.opponent-avatar {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  border: 3px solid rgba(99, 102, 241, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  padding: 16px 20px;
}

.dialog-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  color: rgba(0, 0, 0, 0.6) !important;
  transition: all 0.3s ease;
}

.dialog-close-btn:hover {
  color: #DC143C !important;
  background-color: rgba(220, 20, 60, 0.1) !important;
  transform: scale(1.1);
}
</style>
