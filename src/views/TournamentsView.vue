<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openTournamentDialog()">
          Add Tournament
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search tournaments"
          variant="outlined"
          density="compact"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="filterType"
          :items="['League', 'Tournament']"
          label="Filter by Type"
          variant="outlined"
          density="compact"
          clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="tournament in filteredTournaments" :key="tournament.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title>
            {{ tournament.name }}
            <v-chip size="small" class="ml-2" :color="tournament.type === 'League' ? 'primary' : 'secondary'">
              {{ tournament.type }}
            </v-chip>
            <v-chip v-if="tournament.isDefault" size="small" color="success" class="ml-2" prepend-icon="mdi-star">
              Default
            </v-chip>
          </v-card-title>
          <v-card-subtitle>
            <v-icon size="small">mdi-calendar</v-icon> {{ tournament.year }}
          </v-card-subtitle>
          <v-card-text>
            <div class="text-caption">
              <v-icon size="small">mdi-trophy</v-icon> {{ getMatchCount(tournament.id) }} matches
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn icon="mdi-pencil" size="small" @click="openTournamentDialog(tournament)"></v-btn>
            <v-btn icon="mdi-delete" size="small" color="error" @click="confirmDelete(tournament)"></v-btn>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="viewMatches(tournament)">View Matches</v-btn>
            <v-btn 
              v-if="tournament.type === 'Tournament'" 
              variant="text" 
              color="primary"
              @click="manageTournament(tournament)"
            >
              Manage Tournament
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="tournamentDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingTournament ? 'Edit Tournament' : 'Add New Tournament' }}</v-card-title>
        <v-card-text>
          <v-form ref="tournamentForm">
            <v-text-field
              v-model="formData.name"
              label="Tournament/League Name"
              variant="outlined"
              :rules="[v => !!v || 'Name is required']"
              placeholder="e.g., National League, City Championship"
            ></v-text-field>

            <v-select
              v-model="formData.type"
              :items="['League', 'Tournament']"
              label="Type"
              variant="outlined"
              :rules="[v => !!v || 'Type is required']"
            ></v-select>

            <v-text-field
              v-model.number="formData.year"
              label="Year"
              type="number"
              variant="outlined"
              :rules="[v => !!v || 'Year is required']"
              placeholder="2024"
            ></v-text-field>

            <v-checkbox
              v-model="formData.isDefault"
              label="Set as default tournament"
              hint="This tournament will be pre-selected in dropdowns"
              persistent-hint
            ></v-checkbox>

            <v-divider class="my-4" v-if="formData.type === 'Tournament'"></v-divider>

            <template v-if="formData.type === 'Tournament'">
              <div class="text-subtitle-1 mb-2">Tournament Configuration</div>
              
              <v-text-field
                v-model.number="formData.numberOfGroups"
                label="Number of Groups"
                type="number"
                variant="outlined"
                :min="2"
                :max="8"
                hint="How many groups in the group stage"
                persistent-hint
              ></v-text-field>

              <v-text-field
                v-model.number="formData.playersAdvancingPerGroup"
                label="Players Advancing Per Group"
                type="number"
                variant="outlined"
                :min="1"
                :max="4"
                hint="How many players advance from each group (default: 2)"
                persistent-hint
              ></v-text-field>

              <v-select
                v-model="formData.groupAssignmentMethod"
                :items="['Manual', 'Random']"
                label="Group Assignment Method"
                variant="outlined"
                hint="How players will be assigned to groups"
                persistent-hint
              ></v-select>
            </template>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeTournamentDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveTournament">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Tournament</v-card-title>
        <v-card-text>
          Are you sure you want to delete this tournament? Matches linked to this tournament will not be deleted.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteTournament">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentsStore } from '../stores/tournaments'
import { useMatchesStore } from '../stores/matches'
import { formatDate } from '../utils/date'

const router = useRouter()
const tournamentsStore = useTournamentsStore()
const matchesStore = useMatchesStore()

const tournamentDialog = ref(false)
const deleteDialog = ref(false)
const editingTournament = ref(null)
const tournamentToDelete = ref(null)
const search = ref('')
const filterType = ref(null)
const tournamentForm = ref(null)

const formData = ref({
  name: '',
  type: '',
  year: new Date().getFullYear(),
  isDefault: false,
  numberOfGroups: null,
  playersAdvancingPerGroup: 2,
  groupAssignmentMethod: 'Manual',
  groups: []
})

onMounted(async () => {
  await Promise.all([
    tournamentsStore.fetchTournaments(),
    matchesStore.fetchMatches()
  ])
})

const filteredTournaments = computed(() => {
  let tournaments = tournamentsStore.tournaments
  
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    tournaments = tournaments.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.year?.toString().includes(searchLower)
    )
  }
  
  if (filterType.value) {
    tournaments = tournaments.filter(t => t.type === filterType.value)
  }
  
  return tournaments
})

const openTournamentDialog = (tournament = null) => {
  if (tournament) {
    editingTournament.value = tournament
    formData.value = { ...tournament }
  } else {
    editingTournament.value = null
    formData.value = {
      name: '',
      type: '',
      year: new Date().getFullYear(),
      isDefault: false,
      numberOfGroups: null,
      playersAdvancingPerGroup: 2,
      groupAssignmentMethod: 'Manual',
      groups: []
    }
  }
  tournamentDialog.value = true
}

const closeTournamentDialog = () => {
  tournamentDialog.value = false
  editingTournament.value = null
}

const saveTournament = async () => {
  const { valid } = await tournamentForm.value.validate()
  if (!valid) return

  try {
    // If setting this as default, unset all other defaults
    if (formData.value.isDefault) {
      const allTournaments = tournamentsStore.tournaments
      const otherDefaults = allTournaments.filter(t => t.isDefault && t.id !== editingTournament.value?.id)
      
      for (const tournament of otherDefaults) {
        await tournamentsStore.updateTournament(tournament.id, { ...tournament, isDefault: false })
      }
    }

    if (editingTournament.value) {
      await tournamentsStore.updateTournament(editingTournament.value.id, formData.value)
    } else {
      await tournamentsStore.addTournament(formData.value)
    }
    closeTournamentDialog()
  } catch (error) {
    console.error('Error saving tournament:', error)
  }
}

const confirmDelete = (tournament) => {
  tournamentToDelete.value = tournament
  deleteDialog.value = true
}

const deleteTournament = async () => {
  try {
    await tournamentsStore.deleteTournament(tournamentToDelete.value.id)
    deleteDialog.value = false
    tournamentToDelete.value = null
  } catch (error) {
    console.error('Error deleting tournament:', error)
  }
}

const getMatchCount = (tournamentId) => {
  return matchesStore.matches.filter(m => m.tournamentId === tournamentId).length
}

const viewMatches = (tournament) => {
  router.push({ name: 'Matches', query: { tournament: tournament.id } })
}

const manageTournament = (tournament) => {
  router.push({ path: '/tournaments/manage', query: { id: tournament.id } })
}
</script>

