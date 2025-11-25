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
        <v-btn color="primary" prepend-icon="mdi-plus" @click="showTeamDialog = true">
          Add Team
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="selectedTournament">
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Team Matches
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="tournamentTeamMatches.length === 0" class="text-center text-medium-emphasis py-8">
            No team matches calculated yet. Click "Calculate Team Matches" to process individual matches.
          </v-card-text>
          <v-list v-else>
            <v-list-group v-for="round in groupedByRound" :key="round.round">
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" :title="round.round"></v-list-item>
              </template>
              <v-list-item
                v-for="teamMatch in round.matches"
                :key="teamMatch.id"
                @click="viewTeamMatch(teamMatch)"
              >
                <template v-slot:prepend>
                  <v-avatar v-if="teamMatch.photoUrl" size="40" class="mr-2">
                    <v-img :src="teamMatch.photoUrl"></v-img>
                  </v-avatar>
                </template>
                <v-list-item-title>
                  {{ getTeamName(teamMatch.team1Id || teamMatch.myTeamId) }} vs {{ getTeamName(teamMatch.team2Id || teamMatch.opponentTeamId) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(teamMatch.date) }} • Score: {{ teamMatch.team1Score || teamMatch.myTeamScore }}-{{ teamMatch.team2Score || teamMatch.opponentTeamScore }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip size="small" :color="(teamMatch.team1Score || teamMatch.myTeamScore) >= 4 ? 'success' : 'error'">
                    {{ (teamMatch.team1Score || teamMatch.myTeamScore) >= 4 ? 'Team 1 Won' : 'Team 2 Won' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list-group>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-podium</v-icon>
            Standings
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="tournamentTeams.length === 0" class="text-center text-medium-emphasis">
            No teams added yet
          </v-card-text>
          <v-table v-else density="compact">
            <thead>
              <tr>
                <th class="text-left">Pos</th>
                <th class="text-left">Team</th>
                <th class="text-center">P</th>
                <th class="text-center">W</th>
                <th class="text-center">L</th>
                <th class="text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(team, index) in standings" :key="team.id" :class="{ 'bg-primary-lighten-4': team.isMyTeam }">
                <td>{{ index + 1 }}</td>
                <td>{{ team.name }}</td>
                <td class="text-center">{{ team.played }}</td>
                <td class="text-center">{{ team.won }}</td>
                <td class="text-center">{{ team.lost }}</td>
                <td class="text-center"><strong>{{ team.points }}</strong></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <v-card class="mt-4" v-if="tournamentTeams.length > 0">
          <v-card-title>Teams</v-card-title>
          <v-divider></v-divider>
          <v-list density="compact">
            <v-list-item v-for="team in tournamentTeams" :key="team.id">
              <v-list-item-title>
                {{ team.name }}
                <v-chip v-if="team.isMyTeam" size="x-small" color="primary" class="ml-2">My Team</v-chip>
              </v-list-item-title>
              <template v-slot:append>
                <v-btn icon="mdi-delete" size="x-small" @click="confirmDeleteTeam(team)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
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
          <v-btn color="primary" @click="addTeam">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="showTeamMatchDetail" max-width="600">
      <v-card v-if="selectedTeamMatch">
        <v-card-title>
          Team Match Details
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showTeamMatchDetail = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col>
              <div class="text-h6 mb-2">
                {{ getTeamName(selectedTeamMatch.team1Id || selectedTeamMatch.myTeamId) }} vs 
                {{ getTeamName(selectedTeamMatch.team2Id || selectedTeamMatch.opponentTeamId) }}
              </div>
              <div class="text-subtitle-1 mb-2">
                {{ selectedTeamMatch.round }} • {{ formatDate(selectedTeamMatch.date) }}
              </div>
              <div class="text-h5 mb-4">
                Score: {{ selectedTeamMatch.team1Score || selectedTeamMatch.myTeamScore }}-{{ selectedTeamMatch.team2Score || selectedTeamMatch.opponentTeamScore }}
              </div>
              
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">Team Match Photo</v-card-title>
                <v-card-text>
                  <div v-if="selectedTeamMatch.photoUrl || photoPreview">
                    <v-img 
                      :src="photoPreview || selectedTeamMatch.photoUrl" 
                      aspect-ratio="16/9" 
                      cover
                      class="mb-2"
                    ></v-img>
                  </div>
                  <div v-else class="text-center text-medium-emphasis py-4">
                    No photo uploaded yet
                  </div>
                  <v-file-input
                    v-model="photoFile"
                    label="Upload Photo"
                    variant="outlined"
                    accept="image/*"
                    prepend-icon=""
                    prepend-inner-icon="mdi-camera"
                    :clearable="true"
                    @update:model-value="handlePhotoFileChange"
                  ></v-file-input>
                  <v-progress-linear v-if="uploadingPhoto" indeterminate class="mt-2"></v-progress-linear>
                  <v-btn
                    v-if="photoPreview"
                    color="primary"
                    block
                    class="mt-2"
                    @click="handlePhotoUpload"
                    :loading="uploadingPhoto"
                    :disabled="uploadingPhoto"
                  >
                    Upload Photo
                  </v-btn>
                </v-card-text>
              </v-card>
              
              <div v-if="selectedTeamMatch.notes" class="mt-4">
                <div class="text-subtitle-1 mb-2">Notes</div>
                <p style="white-space: pre-wrap">{{ selectedTeamMatch.notes }}</p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTeamMatchDetail = false">Close</v-btn>
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
          <v-btn color="error" @click="deleteTeam">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTournamentsStore } from '../stores/tournaments'
import { useTeamsStore } from '../stores/teams'
import { useTeamMatchesStore } from '../stores/teamMatches'
import { useMatchesStore } from '../stores/matches'
import { formatDate } from '../utils/date'
import { uploadImage } from '../utils/storage'

const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()
const teamMatchesStore = useTeamMatchesStore()
const matchesStore = useMatchesStore()

const selectedTournament = ref(null)
const showTeamDialog = ref(false)
const deleteTeamDialog = ref(false)
const teamToDelete = ref(null)

const newTeam = ref({
  name: '',
  isMyTeam: false
})


onMounted(async () => {
  await Promise.all([
    tournamentsStore.fetchTournaments(),
    teamsStore.fetchTeams(),
    teamMatchesStore.fetchTeamMatches(),
    matchesStore.fetchMatches()
  ])
  
  // Set default tournament if not already set
  if (!selectedTournament.value && leagueTournaments.value.length > 0) {
    const defaultTournament = leagueTournaments.value.find(t => t.isDefault)
    if (defaultTournament) {
      selectedTournament.value = defaultTournament.id
    } else {
      selectedTournament.value = leagueTournaments.value[0].id
    }
  }
  
  if (selectedTournament.value) {
    await calculateTeamMatches()
  }
})

watch(selectedTournament, async (newVal) => {
  if (newVal) {
    await matchesStore.fetchMatches()
    await calculateTeamMatches()
  }
})

watch(() => matchesStore.matches, async () => {
  if (selectedTournament.value) {
    await calculateTeamMatches()
  }
}, { deep: true })

const leagueTournaments = computed(() => {
  return tournamentsStore.tournaments
    .filter(t => t.type === 'League')
    .map(t => ({
      ...t,
      displayName: `${t.name} (${t.year})`
    }))
})

// Watch for changes to league tournaments and set default if needed
watch(leagueTournaments, (newTournaments) => {
  if (!selectedTournament.value && newTournaments.length > 0) {
    // First try to find a default tournament
    const defaultTournament = newTournaments.find(t => t.isDefault)
    if (defaultTournament) {
      selectedTournament.value = defaultTournament.id
    } else {
      // Fallback to first tournament if no default is set
      selectedTournament.value = newTournaments[0].id
    }
  }
}, { immediate: true })

const tournamentTeams = computed(() => {
  if (!selectedTournament.value) return []
  return teamsStore.teams.filter(t => t.tournamentId === selectedTournament.value)
})


const tournamentTeamMatches = computed(() => {
  if (!selectedTournament.value) return []
  return teamMatchesStore.getTeamMatchesByTournament(selectedTournament.value)
})

const groupedByRound = computed(() => {
  const rounds = {}
  tournamentTeamMatches.value.forEach(tm => {
    if (!rounds[tm.round]) {
      rounds[tm.round] = []
    }
    rounds[tm.round].push(tm)
  })
  
  return Object.keys(rounds).map(round => ({
    round,
    matches: rounds[round]
  }))
})

const standings = computed(() => {
  const teamStats = {}
  
  tournamentTeams.value.forEach(team => {
    teamStats[team.id] = {
      id: team.id,
      name: team.name,
      isMyTeam: team.isMyTeam,
      played: 0,
      won: 0,
      lost: 0,
      points: 0
    }
  })
  
  tournamentTeamMatches.value.forEach(tm => {
    const team1Id = tm.team1Id || tm.myTeamId
    const team2Id = tm.team2Id || tm.opponentTeamId
    const team1Score = tm.team1Score !== undefined ? tm.team1Score : tm.myTeamScore
    const team2Score = tm.team2Score !== undefined ? tm.team2Score : tm.opponentTeamScore
    
    if (teamStats[team1Id]) {
      teamStats[team1Id].played++
      if (team1Score >= 4) {
        teamStats[team1Id].won++
        teamStats[team1Id].points += 3
      } else {
        teamStats[team1Id].lost++
      }
    }
    
    if (teamStats[team2Id]) {
      teamStats[team2Id].played++
      if (team2Score >= 4) {
        teamStats[team2Id].won++
        teamStats[team2Id].points += 3
      } else {
        teamStats[team2Id].lost++
      }
    }
  })
  
  return Object.values(teamStats).sort((a, b) => b.points - a.points)
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


const getTeamName = (teamId) => {
  const team = tournamentTeams.value.find(t => t.id === teamId)
  return team ? team.name : 'Unknown'
}

const getFileFromInput = (input) => {
  if (!input) return null
  
  // Vuetify v-file-input returns an array of files
  if (Array.isArray(input)) {
    return input.length > 0 ? input[0] : null
  }
  
  // Or it might be a FileList
  if (input instanceof FileList) {
    return input.length > 0 ? input[0] : null
  }
  
  // Or a single File
  if (input instanceof File) {
    return input
  }
  
  return null
}

const handlePhotoFileChange = (value) => {
  const file = getFileFromInput(value || photoFile.value)
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target.result
    }
    reader.onerror = () => {
      console.error('Error reading file')
      photoPreview.value = null
    }
    reader.readAsDataURL(file)
  } else {
    photoPreview.value = null
  }
}

const handlePhotoUpload = async () => {
  const file = getFileFromInput(photoFile.value)
  
  if (!selectedTeamMatch.value || !file) {
    alert('Please select a photo first')
    return
  }

  uploadingPhoto.value = true
  try {
    const photoUrl = await uploadImage(file, `teamMatches/${selectedTeamMatch.value.id}`)
    
    await teamMatchesStore.updateTeamMatch(selectedTeamMatch.value.id, {
      ...selectedTeamMatch.value,
      photoUrl: photoUrl
    })
    
    await teamMatchesStore.fetchTeamMatches()
    selectedTeamMatch.value = await teamMatchesStore.getTeamMatch(selectedTeamMatch.value.id)
    photoFile.value = null
    photoPreview.value = null
  } catch (error) {
    console.error('Error uploading photo:', error)
    alert('Error uploading photo: ' + error.message)
  } finally {
    uploadingPhoto.value = false
  }
}

const viewTeamMatch = (teamMatch) => {
  selectedTeamMatch.value = teamMatch
  photoFile.value = null
  photoPreview.value = null
  showTeamMatchDetail.value = true
}


const selectedTeamMatch = ref(null)
const showTeamMatchDetail = ref(false)
const photoFile = ref(null)
const uploadingPhoto = ref(false)
const photoPreview = ref(null)

const calculateTeamMatches = async () => {
  if (!selectedTournament.value) return

  const tournamentMatches = matchesStore.matches.filter(
    m => m.tournamentId === selectedTournament.value && m.round
  )

  const rounds = {}
  tournamentMatches.forEach(match => {
    if (!rounds[match.round]) {
      rounds[match.round] = []
    }
    rounds[match.round].push(match)
  })

  for (const [round, matches] of Object.entries(rounds)) {
    if (matches.length < 6) continue

    const teamScores = {}
    let team1Id = null
    let team2Id = null

    matches.forEach(match => {
      const player1TeamId = match.player1TeamId
      const player2TeamId = match.player2TeamId

      if (!player1TeamId || !player2TeamId) return

      if (!team1Id) team1Id = player1TeamId
      if (!team2Id && player2TeamId !== team1Id) team2Id = player2TeamId

      if (!teamScores[player1TeamId]) teamScores[player1TeamId] = 0
      if (!teamScores[player2TeamId]) teamScores[player2TeamId] = 0

      let player1Sets = 0
      let player2Sets = 0

      match.scores.forEach(score => {
        const p1Score = score.player1Score || score.myScore || 0
        const p2Score = score.player2Score || score.oppScore || 0
        if (p1Score > p2Score) player1Sets++
        else if (p2Score > p1Score) player2Sets++
      })

      if (player1Sets > player2Sets) {
        teamScores[player1TeamId]++
      } else if (player2Sets > player1Sets) {
        teamScores[player2TeamId]++
      }
    })

    if (!team1Id || !team2Id) continue

    const team1Score = teamScores[team1Id] || 0
    const team2Score = teamScores[team2Id] || 0

    if (team1Score + team2Score < 6) continue

    const existingTeamMatch = teamMatchesStore.teamMatches.find(
      tm => tm.tournamentId === selectedTournament.value &&
            tm.round === round &&
            ((tm.team1Id === team1Id && tm.team2Id === team2Id) ||
             (tm.team1Id === team2Id && tm.team2Id === team1Id))
    )

    const matchDate = matches[0].date

    if (existingTeamMatch) {
      await teamMatchesStore.updateTeamMatch(existingTeamMatch.id, {
        team1Id: team1Id,
        team2Id: team2Id,
        team1Score: team1Score,
        team2Score: team2Score,
        date: matchDate,
        round: round,
        photoUrl: existingTeamMatch.photoUrl || null
      })
    } else {
      await teamMatchesStore.addTeamMatch({
        tournamentId: selectedTournament.value,
        round: round,
        team1Id: team1Id,
        team2Id: team2Id,
        team1Score: team1Score,
        team2Score: team2Score,
        date: matchDate,
        notes: 'Auto-calculated from individual matches',
        photoUrl: null
      })
    }
  }

  await teamMatchesStore.fetchTeamMatches()
}
</script>

