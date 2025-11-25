<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openOpponentDialog()">
          Add Player
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
      <v-col cols="12" md="6">
        <v-select
          v-model="filterStyle"
          :items="['Aggressive', 'Defensive', 'Mixed']"
          label="Filter by Playing Style"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="opponent in filteredOpponents" :key="opponent.id" cols="12" md="6" lg="4">
        <v-card hover @click="$router.push(`/opponents/${opponent.id}`)">
          <v-card-text>
            <v-row align="center">
              <v-col cols="auto">
                <v-avatar size="80" :color="opponent.photoUrl ? undefined : 'primary'">
                  <v-img v-if="opponent.photoUrl" :src="opponent.photoUrl"></v-img>
                  <span v-else class="text-h5">{{ getInitials(opponent.name) }}</span>
                </v-avatar>
              </v-col>
              <v-col>
                <div class="text-h6">{{ opponent.name }}</div>
                <v-chip size="small" class="mr-1" :color="getStyleColor(opponent.playingStyle)">
                  {{ opponent.playingStyle }}
                </v-chip>
                <div class="text-caption mt-2">{{ opponent.club || 'No team' }}</div>
                <div v-if="opponent.mttaStartPosition || opponent.mttaCurrentPosition || opponent.mttaTotalPoints || opponent.alphaRanking || opponent.topspinRanking" class="text-caption mt-1">
                  <div v-if="opponent.mttaStartPosition || opponent.mttaCurrentPosition || opponent.mttaTotalPoints" class="mb-1">
                    <span v-if="opponent.mttaStartPosition" class="mr-2">MTTA Start: {{ opponent.mttaStartPosition }}</span>
                    <span v-if="opponent.mttaCurrentPosition" class="mr-2">Current: {{ opponent.mttaCurrentPosition }}</span>
                    <span v-if="opponent.mttaTotalPoints">Points: {{ opponent.mttaTotalPoints }}</span>
                  </div>
                  <div>
                    <span v-if="opponent.alphaRanking" class="mr-2">Alpha: {{ opponent.alphaRanking }}</span>
                    <span v-if="opponent.topspinRanking">Topspin: {{ opponent.topspinRanking }}</span>
                  </div>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ getMatchCount(opponent.id) }} matches
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn icon="mdi-pencil" size="small" @click.stop="openOpponentDialog(opponent)"></v-btn>
            <v-btn icon="mdi-delete" size="small" color="error" @click.stop="confirmDelete(opponent)"></v-btn>
            <v-spacer></v-spacer>
            <v-btn append-icon="mdi-arrow-right" variant="text">View Profile</v-btn>
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
              v-model="formData.playingStyle"
              :items="['Aggressive', 'Defensive', 'Mixed']"
              label="Playing Style"
              variant="outlined"
              :rules="[v => !!v || 'Playing style is required']"
            ></v-select>

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
                <v-btn icon="mdi-plus" size="small" @click="showTeamDialog = true"></v-btn>
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
              :clearable="true"
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
          <v-btn color="primary" @click="saveOpponent" :loading="saving">Save</v-btn>
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
        <v-card-title>Delete Player</v-card-title>
        <v-card-text>
          Are you sure you want to delete this player? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteOpponent">Delete</v-btn>
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
import { uploadImage } from '../utils/storage'

const opponentsStore = useOpponentsStore()
const matchesStore = useMatchesStore()
const teamsStore = useTeamsStore()
const tournamentsStore = useTournamentsStore()

const opponentDialog = ref(false)
const showTeamDialog = ref(false)
const deleteDialog = ref(false)
const editingOpponent = ref(null)
const opponentToDelete = ref(null)
const search = ref('')
const filterStyle = ref(null)
const opponentForm = ref(null)
const photoFile = ref(null)
const saving = ref(false)

const newTeam = ref({
  name: '',
  tournamentId: '',
  isMyTeam: false
})

const formData = ref({
  name: '',
  playingStyle: '',
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

  if (filterStyle.value) {
    opponents = opponents.filter(o => o.playingStyle === filterStyle.value)
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
      playingStyle: '',
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
      playingStyle: formData.value.playingStyle,
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

const getStyleColor = (style) => {
  const colors = {
    Aggressive: 'error',
    Defensive: 'success',
    Mixed: 'info'
  }
  return colors[style] || 'grey'
}

const getMatchCount = (opponentId) => {
  return matchesStore.getMatchesByOpponent(opponentId).length
}
</script>

