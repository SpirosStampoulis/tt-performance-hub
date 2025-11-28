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
          <v-list v-else density="compact">
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

const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()

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
    teamsStore.fetchTeams()
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
</script>

