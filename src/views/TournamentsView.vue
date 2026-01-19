<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openTournamentDialog()"
          size="large"
          rounded="lg"
          elevation="2"
          :disabled="isGuest"
        >
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
        <v-card class="tournament-card" elevation="4" :class="tournament.type === 'League' ? 'league-card' : 'tournament-type-card'">
          <v-card-title class="tournament-card-title">
            <div class="d-flex align-center flex-wrap">
              <v-icon :color="tournament.type === 'League' ? 'primary' : 'warning'" size="24" class="mr-2">mdi-tournament</v-icon>
              <span class="font-weight-bold">{{ tournament.name }}</span>
            </div>
            <div class="mt-2">
              <v-chip size="small" class="mr-2" :color="tournament.type === 'League' ? 'primary' : 'warning'" variant="flat">
                {{ tournament.type }}
              </v-chip>
              <v-chip v-if="tournament.isDefault" size="small" color="warning" variant="flat" prepend-icon="mdi-star">
                Default {{ tournament.type }}
              </v-chip>
            </div>
          </v-card-title>
          <v-card-text class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon size="small" color="primary" class="mr-2">mdi-calendar</v-icon>
              <span class="text-body-1 font-weight-medium">{{ tournament.year }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" color="warning" class="mr-2">mdi-trophy</v-icon>
              <span class="text-body-2">{{ getMatchCount(tournament.id) }} matches</span>
            </div>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-btn 
              icon="mdi-star" 
              size="small" 
              :color="tournament.isDefault ? 'warning' : 'grey'" 
              variant="text" 
              @click.stop="toggleDefault(tournament)"
              :title="tournament.isDefault ? `Unset as default ${tournament.type}` : `Set as default ${tournament.type}`"
              :disabled="isGuest"
            >
              <v-icon>{{ tournament.isDefault ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
              <v-tooltip activator="parent">{{ tournament.isDefault ? `Unset as default ${tournament.type}` : `Set as default ${tournament.type}` }}</v-tooltip>
            </v-btn>
            <v-btn icon="mdi-pencil" size="small" variant="text" @click.stop="openTournamentDialog(tournament)" :disabled="isGuest"></v-btn>
            <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click.stop="confirmDelete(tournament)" :disabled="isGuest"></v-btn>
            <v-spacer></v-spacer>
            <v-btn variant="text" size="small" @click.stop="viewMatches(tournament)">View Matches</v-btn>
            <v-btn 
              v-if="tournament.type === 'Tournament'" 
              variant="flat" 
              color="primary"
              size="small"
              @click.stop="manageTournament(tournament)"
            >
              Manage
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
              :items="['League', 'Tournament', 'Simple League']"
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
              :label="`Set as default ${formData.type || 'tournament'}`"
              :hint="`This ${formData.type || 'tournament'} will be pre-selected in dropdowns for ${formData.type || 'tournament'} type`"
              persistent-hint
              :disabled="!formData.type"
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
          <v-btn color="primary" @click="saveTournament" :disabled="isGuest">Save</v-btn>
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
          <v-btn color="error" @click="deleteTournament" :disabled="isGuest">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTournamentsStore } from '../stores/tournaments'
import { useMatchesStore } from '../stores/matches'
import { useAuth } from '../composables/useAuth'
import { formatDate } from '../utils/date'

const router = useRouter()
const route = useRoute()
const tournamentsStore = useTournamentsStore()
const matchesStore = useMatchesStore()
const { isGuest } = useAuth()

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
  
  // Check if there's a type filter in the query parameters
  if (route.query.type) {
    filterType.value = route.query.type
  }
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
    // If setting this as default, unset all other defaults of the same type
    if (formData.value.isDefault && formData.value.type) {
      const allTournaments = tournamentsStore.tournaments
      const otherDefaults = allTournaments.filter(t => 
        t.isDefault && 
        t.type === formData.value.type && 
        t.id !== editingTournament.value?.id
      )
      
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

const toggleDefault = async (tournament) => {
  try {
    const newDefaultStatus = !tournament.isDefault
    
    // If setting as default, unset all other defaults of the same type
    if (newDefaultStatus && tournament.type) {
      const allTournaments = tournamentsStore.tournaments
      const otherDefaults = allTournaments.filter(t => 
        t.isDefault && 
        t.type === tournament.type && 
        t.id !== tournament.id
      )
      
      for (const otherTournament of otherDefaults) {
        await tournamentsStore.updateTournament(otherTournament.id, { ...otherTournament, isDefault: false })
      }
    }
    
    // Update the tournament's default status
    await tournamentsStore.updateTournament(tournament.id, { ...tournament, isDefault: newDefaultStatus })
  } catch (error) {
    console.error('Error toggling default tournament:', error)
  }
}
</script>

<style scoped>
.tournament-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  overflow: hidden;
  border: 3px solid transparent;
  background: white !important;
}

.tournament-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.25) !important;
}

.league-card {
  border-left: 5px solid #DC143C;
  border-color: rgba(220, 20, 60, 0.4);
  background: white !important;
}

.league-card:hover {
  border-color: #DC143C;
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(200, 16, 46, 0.1) 100%) !important;
  box-shadow: 0 12px 32px rgba(220, 20, 60, 0.3) !important;
}

.tournament-type-card {
  border-left: 5px solid #FFD700;
  border-color: rgba(255, 215, 0, 0.4);
  background: white !important;
}

.tournament-type-card:hover {
  border-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%) !important;
  box-shadow: 0 12px 32px rgba(255, 215, 0, 0.3) !important;
}

.tournament-card-title {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.12) 0%, rgba(255, 215, 0, 0.12) 100%);
  padding: 20px;
  border-bottom: 3px solid rgba(220, 20, 60, 0.25);
  color: rgba(0, 0, 0, 0.87) !important;
}
</style>
