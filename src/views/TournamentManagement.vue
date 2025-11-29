<template>
  <v-container>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedTournament"
          :items="tournamentTournaments"
          item-title="displayName"
          item-value="id"
          label="Select Tournament"
          variant="outlined"
          density="comfortable"
        ></v-select>
      </v-col>
      <v-col cols="12" md="6" v-if="selectedTournament">
        <v-btn 
          color="secondary" 
          prepend-icon="mdi-tournament" 
          @click="openCreateTournamentDialog"
        >
          Create Tournament
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="tournament" class="mb-4">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-trophy</v-icon>
            {{ tournament.name }} ({{ tournament.year }})
          </v-card-title>
          <v-card-text>
            <div class="text-body-1 mb-2">
              <strong>Number of Groups:</strong> {{ tournament.numberOfGroups || 'Not set' }}
            </div>
            <div class="text-body-1 mb-2">
              <strong>Players Advancing Per Group:</strong> {{ tournament.playersAdvancingPerGroup || 2 }}
            </div>
            <div class="text-body-1">
              <strong>Group Assignment:</strong> {{ tournament.groupAssignmentMethod || 'Manual' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <!-- Tournament Info -->
        <v-card>
          <v-card-title>Tournament Info</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="text-body-2 mb-2">
              <strong>Total Matches:</strong> {{ allTournamentMatches.length }}
            </div>
            <div class="text-body-2 mb-2">
              <strong>Group Matches:</strong> {{ groupMatches.length }}
            </div>
            <div class="text-body-2 mb-2">
              <strong>Knockout Matches:</strong> {{ knockoutMatches.length }}
            </div>
            <div class="text-body-2">
              <strong>Groups:</strong> {{ groups.length }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <!-- Quick Actions -->
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-btn 
              block 
              color="primary" 
              prepend-icon="mdi-account-group" 
              class="mb-2"
              @click="showGroupManagement = true"
              :disabled="!tournament?.numberOfGroups"
            >
              Manage Groups
            </v-btn>
            <v-btn 
              block 
              color="info" 
              prepend-icon="mdi-format-list-bulleted" 
              @click="$router.push({ path: '/matches', query: { tournament: tournament?.id } })"
            >
              View All Matches
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="tournament">
      <v-col cols="12">
        <!-- Groups Section -->
        <v-card v-if="groupMatches.length > 0 || groups.length > 0" class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-account-group</v-icon>
            Group Stage
            <v-spacer></v-spacer>
            <v-btn 
              icon="mdi-cog" 
              size="small" 
              @click="showGroupManagement = true"
            >
              <v-icon>mdi-cog</v-icon>
              <v-tooltip activator="parent">Manage Groups</v-tooltip>
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-card
              v-for="group in groupsWithMatches"
              :key="group.id"
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                <v-icon class="mr-2">mdi-account-group</v-icon>
                Group {{ group.name }}
                <v-spacer></v-spacer>
                <v-chip size="small" color="info">
                  {{ group.players?.length || 0 }} players
                </v-chip>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-2">Standings</div>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th class="text-left" style="width: 40px">Pos</th>
                          <th class="text-left">Player</th>
                          <th class="text-center">P</th>
                          <th class="text-center">W</th>
                          <th class="text-center">L</th>
                          <th class="text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr 
                          v-for="(player, index) in getGroupStandings(group.id)"
                          :key="player.id"
                          :class="{ 'bg-success-lighten-4': index < (tournament?.playersAdvancingPerGroup || 2) }"
                        >
                          <td>
                            <v-chip 
                              v-if="index < (tournament?.playersAdvancingPerGroup || 2)" 
                              size="small" 
                              color="success"
                            >
                              Q
                            </v-chip>
                            <span v-else>{{ index + 1 }}</span>
                          </td>
                          <td>{{ getPlayerName(player.id) }}</td>
                          <td class="text-center">{{ player.played }}</td>
                          <td class="text-center">{{ player.won }}</td>
                          <td class="text-center">{{ player.lost }}</td>
                          <td class="text-center"><strong>{{ player.points }}</strong></td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="text-subtitle-2 mb-2">Matches</div>
                    <v-list density="compact">
                      <v-list-item
                        v-for="match in getGroupMatches(group.id)"
                        :key="match.id"
                        @click="viewMatch(match)"
                        class="mb-1"
                        style="border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; cursor: pointer;"
                      >
                        <v-list-item-title>
                          {{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                          {{ formatDate(match.date) }}
                        </v-list-item-subtitle>
                        <template v-slot:append>
                          <v-chip size="small" v-if="getMatchScore(match) !== 'No score'">
                            {{ getMatchScore(match) }}
                          </v-chip>
                          <v-chip size="small" color="info" v-else>
                            Scheduled
                          </v-chip>
                        </template>
                      </v-list-item>
                    </v-list>
                    <v-btn 
                      size="small" 
                      color="primary" 
                      prepend-icon="mdi-plus" 
                      class="mt-2"
                      @click="scheduleGroupMatch(group.id)"
                    >
                      Add Match
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <!-- Knockout Stages Section -->
        <v-card v-if="knockoutMatches.length > 0 || (groups.length === 4 && groupMatches.length > 0)">
          <v-card-title>
            <v-icon class="mr-2">mdi-trophy-variant</v-icon>
            Knockout Stages
            <v-spacer></v-spacer>
            <v-btn 
              v-if="groups.length === 4"
              size="small" 
              color="primary" 
              prepend-icon="mdi-refresh"
              @click="checkAndCreateNextRound"
              :loading="isCreatingSemiFinals || isCreatingFinal"
            >
              Update Next Round
            </v-btn>
            <v-btn 
              v-if="groups.length === 4 && knockoutMatches.filter(m => m.round === 'Quarter-Final').length >= 4"
              size="small" 
              color="success" 
              prepend-icon="mdi-trophy"
              @click="createSemiFinals"
              :loading="isCreatingSemiFinals"
              class="ml-2"
            >
              Create Semi-Finals
            </v-btn>
            <v-btn 
              v-if="groups.length === 4 && knockoutMatches.filter(m => m.round === 'Semi-Final').length >= 2"
              size="small" 
              color="warning" 
              prepend-icon="mdi-trophy-variant"
              @click="createFinal"
              :loading="isCreatingFinal"
              class="ml-2"
            >
              Create Final
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-card
              v-for="stage in knockoutStages"
              :key="stage.round"
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                <v-icon class="mr-2">mdi-trophy-variant</v-icon>
                {{ stage.round }}
                <span v-if="stage.matches.length > 0 && stage.matches[0].date" class="text-body-2 text-medium-emphasis ml-2">
                  • {{ formatDate(stage.matches[0].date) }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-list density="comfortable">
                  <v-list-item
                    v-for="match in stage.matches"
                    :key="match.id"
                    @click="viewMatch(match)"
                    class="mb-2"
                    style="border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; cursor: pointer;"
                  >
                    <v-list-item-title class="text-h6 mb-1">
                      {{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatDate(match.date) }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <div class="text-right">
                        <div class="text-h5" v-if="getMatchScore(match) !== 'No score'">
                          {{ getMatchScore(match) }}
                        </div>
                        <v-chip size="small" color="info" v-else>
                          Scheduled
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <v-card v-if="groupMatches.length === 0 && knockoutMatches.length === 0">
          <v-card-text class="text-center text-medium-emphasis py-8">
            No matches yet. Start by creating groups and scheduling matches.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col>
        <v-card>
          <v-card-text class="text-center text-medium-emphasis py-8">
            Please select a tournament from the dropdown above
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Groups Dialog -->
    <v-dialog v-model="showCreateGroupDialog" max-width="500" v-if="tournament">
      <v-card>
        <v-card-title>Create Groups</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            This will create {{ tournament.numberOfGroups }} groups (A, B, C, etc.)
          </v-alert>
          <div v-if="tournament.groupAssignmentMethod === 'Random'">
            <v-alert type="warning" variant="tonal" class="mb-4">
              Players will be randomly assigned to groups. Make sure all players are added to the tournament first.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showCreateGroupDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createGroups">Create Groups</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Assign Player Dialog -->
    <v-dialog v-model="showAssignPlayerDialog" max-width="500" v-if="selectedGroup">
      <v-card>
        <v-card-title>Assign Player to Group {{ selectedGroup.name }}</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="playerToAssign"
            :items="availablePlayers"
            item-title="name"
            item-value="id"
            label="Select Player"
            variant="outlined"
          >
            <template v-slot:append>
              <v-btn icon="mdi-plus" size="small" @click="showCreatePlayerDialog = true">
                <v-icon>mdi-plus</v-icon>
                <v-tooltip activator="parent">Create New Player</v-tooltip>
              </v-btn>
            </template>
          </v-autocomplete>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showAssignPlayerDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="assignPlayerToGroup" :disabled="!playerToAssign">Assign</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Player Dialog -->
    <v-dialog v-model="showCreatePlayerDialog" max-width="500">
      <v-card>
        <v-card-title>Create New Player</v-card-title>
        <v-card-text>
          <v-form ref="playerForm">
            <v-text-field
              v-model="newPlayer.name"
              label="Name"
              variant="outlined"
              :rules="[v => !!v || 'Name is required']"
            ></v-text-field>
            <v-select
              v-model="newPlayer.club"
              :items="allTeamsList"
              item-title="name"
              item-value="name"
              label="Team/Club"
              variant="outlined"
              clearable
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showCreatePlayerDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createAndAssignPlayer" :loading="creatingPlayer">Create & Assign</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Group Management Dialog -->
    <v-dialog v-model="showGroupManagement" max-width="1200" scrollable>
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-account-group</v-icon>
          Manage Groups
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-card>
                <v-card-title>
                  <v-icon class="mr-2">mdi-account-group</v-icon>
                  Groups
                  <v-spacer></v-spacer>
                  <v-btn 
                    icon="mdi-plus" 
                    size="small" 
                    @click="showCreateGroupDialog = true"
                    :disabled="!tournament?.numberOfGroups"
                  >
                    <v-icon>mdi-plus</v-icon>
                    <v-tooltip activator="parent">Create Groups</v-tooltip>
                  </v-btn>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text v-if="groups.length === 0" class="text-center text-medium-emphasis py-8">
                  <div v-if="!tournament?.numberOfGroups" class="mb-4">
                    Please configure the tournament first (set number of groups)
                  </div>
                  <div v-else>
                    No groups created yet. Click the + button to create groups.
                  </div>
                </v-card-text>
                <v-list v-else density="comfortable">
                  <v-list-item
                    v-for="group in groups"
                    :key="group.id"
                    @click="selectedGroup = group"
                    :class="{ 'bg-primary-lighten-4': selectedGroup?.id === group.id }"
                  >
                    <v-list-item-title class="text-h6">
                      Group {{ group.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ group.players?.length || 0 }} players
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        color="error"
                        variant="text"
                        @click.stop="confirmDeleteGroup(group)"
                      >
                        <v-icon>mdi-delete</v-icon>
                        <v-tooltip activator="parent">Delete Group</v-tooltip>
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <v-col cols="12" md="8">
              <v-card v-if="selectedGroup">
                <v-card-title>
                  <v-icon class="mr-2">mdi-account-group</v-icon>
                  Group {{ selectedGroup.name }}
                  <v-spacer></v-spacer>
                  <v-btn 
                    icon="mdi-account-plus" 
                    size="small" 
                    @click="showAssignPlayerDialog = true"
                  >
                    <v-icon>mdi-account-plus</v-icon>
                    <v-tooltip activator="parent">Assign Player</v-tooltip>
                  </v-btn>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                  <v-tabs v-model="groupTab" class="mb-4">
                    <v-tab value="players">Players</v-tab>
                    <v-tab value="standings">Standings</v-tab>
                    <v-tab value="matches">Matches</v-tab>
                  </v-tabs>

                  <v-window v-model="groupTab">
                    <v-window-item value="players">
                      <div v-if="getGroupPlayers(selectedGroup.id).length === 0" class="text-center text-medium-emphasis py-8">
                        No players assigned to this group yet
                      </div>
                      <v-list v-else density="comfortable">
                        <v-list-item
                          v-for="playerId in getGroupPlayers(selectedGroup.id)"
                          :key="playerId"
                        >
                          <v-list-item-title>{{ getPlayerName(playerId) }}</v-list-item-title>
                          <template v-slot:append>
                            <v-btn 
                              icon="mdi-close" 
                              size="small" 
                              color="error"
                              @click="removePlayerFromGroup(selectedGroup.id, playerId)"
                            ></v-btn>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-window-item>

                    <v-window-item value="standings">
                      <v-alert 
                        v-if="getGroupStandings(selectedGroup.id).length > 0"
                        type="info" 
                        variant="tonal" 
                        class="mb-4"
                      >
                        Top {{ tournament?.playersAdvancingPerGroup || 2 }} players (highlighted) will advance to the next stage
                      </v-alert>
                      <v-table density="compact">
                        <thead>
                          <tr>
                            <th class="text-left">Pos</th>
                            <th class="text-left">Player</th>
                            <th class="text-center">P</th>
                            <th class="text-center">W</th>
                            <th class="text-center">L</th>
                            <th class="text-center">SD</th>
                            <th class="text-center">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr 
                            v-for="(player, index) in getGroupStandings(selectedGroup.id)"
                            :key="player.id"
                            :class="{ 'bg-success-lighten-4': index < (tournament?.playersAdvancingPerGroup || 2) }"
                          >
                            <td>
                              <v-chip 
                                v-if="index < (tournament?.playersAdvancingPerGroup || 2)" 
                                size="small" 
                                color="success"
                              >
                                Q
                              </v-chip>
                              <span v-else>{{ index + 1 }}</span>
                            </td>
                            <td>{{ getPlayerName(player.id) }}</td>
                            <td class="text-center">{{ player.played }}</td>
                            <td class="text-center">{{ player.won }}</td>
                            <td class="text-center">{{ player.lost }}</td>
                            <td class="text-center" :class="player.setDifference > 0 ? 'text-success' : player.setDifference < 0 ? 'text-error' : ''">
                              {{ player.setDifference > 0 ? '+' : '' }}{{ player.setDifference }}
                            </td>
                            <td class="text-center"><strong>{{ player.points }}</strong></td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-window-item>

                    <v-window-item value="matches">
                      <div v-if="getGroupMatches(selectedGroup.id).length === 0" class="text-center text-medium-emphasis py-8">
                        No matches played in this group yet
                      </div>
                      <v-list v-else density="comfortable">
                        <v-list-item
                          v-for="match in getGroupMatches(selectedGroup.id)"
                          :key="match.id"
                          @click="viewMatch(match)"
                        >
                          <v-list-item-title>
                            {{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatDate(match.date) }}
                          </v-list-item-subtitle>
                          <template v-slot:append>
                            <v-chip size="small">
                              {{ getMatchScore(match) }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                      <v-btn 
                        color="primary" 
                        prepend-icon="mdi-plus" 
                        class="mt-4"
                        @click="scheduleGroupMatch(selectedGroup.id)"
                      >
                        Schedule Match
                      </v-btn>
                    </v-window-item>
                  </v-window>
                </v-card-text>
              </v-card>

              <v-card v-else>
                <v-card-text class="text-center text-medium-emphasis py-8">
                  Select a group to view details
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showGroupManagement = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Group Dialog -->
    <v-dialog v-model="showDeleteGroupDialog" max-width="500">
      <v-card>
        <v-card-title>Delete Group</v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            Are you sure you want to delete <strong>Group {{ groupToDelete?.name }}</strong>?
          </v-alert>
          <div class="text-body-2">
            This will remove the group and all player assignments. Matches associated with this group will not be deleted, but they will no longer be linked to a group.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteGroupDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteGroup">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentsStore } from '../stores/tournaments'
import { useOpponentsStore } from '../stores/opponents'
import { useMatchesStore } from '../stores/matches'
import { useTeamsStore } from '../stores/teams'
import { formatDate } from '../utils/date'

const route = useRoute()
const router = useRouter()
const tournamentsStore = useTournamentsStore()
const opponentsStore = useOpponentsStore()
const matchesStore = useMatchesStore()
const teamsStore = useTeamsStore()

const selectedTournament = ref(null)
const tournament = ref(null)
const groups = ref([])
const selectedGroup = ref(null)
const groupTab = ref('players')
const showCreateGroupDialog = ref(false)
const showAssignPlayerDialog = ref(false)
const playerToAssign = ref(null)
const showGroupManagement = ref(false)
const showDeleteGroupDialog = ref(false)
const groupToDelete = ref(null)
const showCreatePlayerDialog = ref(false)
const creatingPlayer = ref(false)
const playerForm = ref(null)
const isCreatingKnockoutMatches = ref(false)
const isCreatingSemiFinals = ref(false)
const isCreatingFinal = ref(false)
const newPlayer = ref({
  name: '',
  club: ''
})

const allTeamsList = computed(() => {
  return teamsStore.teams.map(t => ({ name: t.name }))
})

const tournamentTournaments = computed(() => {
  return tournamentsStore.tournaments
    .filter(t => t.type === 'Tournament')
    .map(t => ({
      ...t,
      displayName: `${t.name} (${t.year})`
    }))
    .sort((a, b) => {
      if (b.year !== a.year) return (b.year || 0) - (a.year || 0)
      return a.name.localeCompare(b.name)
    })
})

const availablePlayers = computed(() => {
  // Get all players who have matches in this tournament or are available
  const tournamentPlayerIds = new Set()
  matchesStore.matches
    .filter(m => m.tournamentId === tournament.value?.id)
    .forEach(m => {
      if (m.player1Id) tournamentPlayerIds.add(m.player1Id)
      if (m.player2Id) tournamentPlayerIds.add(m.player2Id)
    })
  
  return opponentsStore.opponents
    .filter(p => !isPlayerInAnyGroup(p.id))
    .map(p => ({ id: p.id, name: p.name }))
})

const isPlayerInAnyGroup = (playerId) => {
  return groups.value.some(g => g.players?.includes(playerId))
}

const allTournamentMatches = computed(() => {
  if (!tournament.value?.id) return []
  return matchesStore.matches.filter(m => m.tournamentId === tournament.value.id)
})

const groupMatches = computed(() => {
  return allTournamentMatches.value.filter(m => {
    const round = m.round || ''
    return round.startsWith('Group ')
  })
})

const knockoutMatches = computed(() => {
  return allTournamentMatches.value.filter(m => {
    const round = m.round || ''
    return !round.startsWith('Group ') && round !== ''
  })
})

const groupsWithMatches = computed(() => {
  return groups.value.map(group => ({
    ...group,
    matches: getGroupMatches(group.id)
  })).filter(group => group.matches.length > 0 || group.players?.length > 0)
})

const knockoutStages = computed(() => {
  const stages = {}
  knockoutMatches.value.forEach(match => {
    const round = match.round || 'Unknown'
    if (!stages[round]) {
      stages[round] = []
    }
    stages[round].push(match)
  })
  
  const stageOrder = ['Quarter-Final', 'Semi-Final', 'Final']
  return Object.keys(stages)
    .sort((a, b) => {
      const aIndex = stageOrder.indexOf(a)
      const bIndex = stageOrder.indexOf(b)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.localeCompare(b)
    })
    .map(round => ({
      round,
      matches: stages[round].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : (a.date?.toDate ? a.date.toDate() : new Date(0))
        const dateB = b.date instanceof Date ? b.date : (b.date?.toDate ? b.date.toDate() : new Date(0))
        return dateA - dateB
      })
    }))
})

const openScheduleMatchDialog = () => {
  if (!tournament.value?.id) return
  router.push({
    path: '/matches',
    query: {
      tournament: tournament.value.id,
      scheduled: 'true'
    }
  })
}

const openCreateTournamentDialog = () => {
  router.push('/tournaments')
}

const getGroupPlayers = (groupId) => {
  const group = groups.value.find(g => g.id === groupId)
  return group?.players || []
}

const getGroupMatches = (groupId) => {
  const group = groups.value.find(g => g.id === groupId)
  if (!group) return []
  
  const groupName = group.name
  return matchesStore.matches.filter(m => 
    m.tournamentId === tournament.value?.id &&
    m.round === `Group ${groupName}`
  )
}

const getGroupStandings = (groupId) => {
  const group = groups.value.find(g => g.id === groupId)
  if (!group) return []
  
  const playerIds = group.players || []
  const groupMatches = getGroupMatches(groupId)
  
  const stats = {}
  playerIds.forEach(playerId => {
    stats[playerId] = {
      id: playerId,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0
    }
  })
  
  groupMatches.forEach(match => {
    if (!match.scores || match.scores.length === 0) return
    
    let player1Sets = 0
    let player2Sets = 0
    
    match.scores.forEach(score => {
      const p1Score = score.player1Score || score.myScore || 0
      const p2Score = score.player2Score || score.oppScore || 0
      if (p1Score && p2Score) {
        if (p1Score > p2Score) player1Sets++
        else if (p2Score > p1Score) player2Sets++
      }
    })
    
    const p1Id = match.player1Id
    const p2Id = match.player2Id
    
    if (stats[p1Id]) {
      stats[p1Id].played++
      stats[p1Id].setsWon += player1Sets
      stats[p1Id].setsLost += player2Sets
      if (player1Sets > player2Sets) {
        stats[p1Id].won++
        stats[p1Id].points += 3
      } else {
        stats[p1Id].lost++
      }
    }
    
    if (stats[p2Id]) {
      stats[p2Id].played++
      stats[p2Id].setsWon += player2Sets
      stats[p2Id].setsLost += player1Sets
      if (player2Sets > player1Sets) {
        stats[p2Id].won++
        stats[p2Id].points += 3
      } else {
        stats[p2Id].lost++
      }
    }
  })
  
  return Object.values(stats)
    .map(p => ({
      ...p,
      setDifference: p.setsWon - p.setsLost
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return b.setDifference - a.setDifference
    })
}

const getPlayerName = (playerId) => {
  const player = opponentsStore.opponents.find(p => p.id === playerId)
  return player ? player.name : 'Unknown'
}

const getMatchScore = (match) => {
  if (!match.scores || match.scores.length === 0) return 'No score'
  
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score && p2Score) {
      if (p1Score > p2Score) player1Sets++
      else if (p2Score > p1Score) player2Sets++
    }
  })
  
  return `${player1Sets}-${player2Sets}`
}

const getMatchWinner = (match) => {
  if (!match.scores || match.scores.length === 0) return null
  
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score && p2Score) {
      if (p1Score > p2Score) player1Sets++
      else if (p2Score > p1Score) player2Sets++
    }
  })
  
  if (player1Sets === player2Sets) return null
  return player1Sets > player2Sets ? match.player1Id : match.player2Id
}

const createGroups = async () => {
  if (!tournament.value?.numberOfGroups) return
  
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const newGroups = []
  
  for (let i = 0; i < tournament.value.numberOfGroups; i++) {
    newGroups.push({
      id: `group_${i}`,
      name: groupNames[i],
      players: []
    })
  }
  
  // If random assignment, distribute players
  if (tournament.value.groupAssignmentMethod === 'Random') {
    const allPlayerIds = availablePlayers.value.map(p => p.id)
    const shuffled = [...allPlayerIds].sort(() => Math.random() - 0.5)
    
    newGroups.forEach((group, index) => {
      const playersPerGroup = Math.ceil(shuffled.length / newGroups.length)
      const startIndex = index * playersPerGroup
      group.players = shuffled.slice(startIndex, startIndex + playersPerGroup)
    })
  }
  
  groups.value = newGroups
  await saveGroups()
  showCreateGroupDialog.value = false
}

const assignPlayerToGroup = async () => {
  if (!selectedGroup.value || !playerToAssign.value) return
  
  const group = groups.value.find(g => g.id === selectedGroup.value.id)
  if (group && !group.players.includes(playerToAssign.value)) {
    group.players.push(playerToAssign.value)
    await saveGroups()
    playerToAssign.value = null
    showAssignPlayerDialog.value = false
  }
}

const createAndAssignPlayer = async () => {
  if (playerForm.value) {
    const { valid } = await playerForm.value.validate()
    if (!valid) return
  }

  creatingPlayer.value = true
  try {
    const opponentData = {
      name: newPlayer.value.name,
      club: newPlayer.value.club || null
    }

    const newPlayerId = await opponentsStore.addOpponent(opponentData)
    
    // Refresh opponents list
    await opponentsStore.fetchOpponents()
    
    // Assign the newly created player to the group
    playerToAssign.value = newPlayerId
    await assignPlayerToGroup()
    
    // Reset form
    newPlayer.value = { name: '', club: '' }
    showCreatePlayerDialog.value = false
  } catch (error) {
    console.error('Error creating player:', error)
    alert('Error creating player: ' + error.message)
  } finally {
    creatingPlayer.value = false
  }
}

const removePlayerFromGroup = async (groupId, playerId) => {
  const group = groups.value.find(g => g.id === groupId)
  if (group) {
    group.players = group.players.filter(p => p !== playerId)
    await saveGroups()
  }
}

const confirmDeleteGroup = (group) => {
  groupToDelete.value = group
  showDeleteGroupDialog.value = true
}

const deleteGroup = async () => {
  if (!groupToDelete.value) return
  
  const groupId = groupToDelete.value.id
  groups.value = groups.value.filter(g => g.id !== groupId)
  
  // Clear selection if the deleted group was selected
  if (selectedGroup.value?.id === groupId) {
    selectedGroup.value = null
  }
  
  await saveGroups()
  showDeleteGroupDialog.value = false
  groupToDelete.value = null
}

const saveGroups = async () => {
  if (!tournament.value) return
  
  await tournamentsStore.updateTournament(tournament.value.id, {
    ...tournament.value,
    groups: groups.value
  })
  
  tournament.value = await tournamentsStore.getTournament(tournament.value.id)
  
  if (groups.value.length === 4) {
    await createKnockoutMatchesFor4Groups()
  }
}

const scheduleGroupMatch = (groupId) => {
  if (!tournament.value?.id) return
  const group = groups.value.find(g => g.id === groupId)
  if (!group) return
  
  router.push({
    path: '/matches',
    query: {
      tournament: tournament.value.id,
      round: `Group ${group.name}`,
      group: groupId
    }
  })
}

const viewMatch = (match) => {
  router.push(`/matches/${match.id}`)
}

const createKnockoutMatchesFor4Groups = async () => {
  if (!tournament.value?.id || groups.value.length !== 4) return
  
  if (isCreatingKnockoutMatches.value) return
  
  isCreatingKnockoutMatches.value = true
  
  try {
    await matchesStore.fetchMatches()
    
    const existingQuarterFinals = allTournamentMatches.value.filter(m => m.round === 'Quarter-Final')
    
    if (existingQuarterFinals.length >= 4) {
      isCreatingKnockoutMatches.value = false
      return
    }
    
    const groupNames = ['A', 'B', 'C', 'D']
    const sortedGroups = groups.value
      .filter(g => groupNames.includes(g.name))
      .sort((a, b) => groupNames.indexOf(a.name) - groupNames.indexOf(b.name))
    
    if (sortedGroups.length !== 4) {
      isCreatingKnockoutMatches.value = false
      return
    }
    
    const advancingPlayers = {}
    
    for (const group of sortedGroups) {
      const standings = getGroupStandings(group.id)
      const playersAdvancing = tournament.value?.playersAdvancingPerGroup || 2
      
      if (standings.length < playersAdvancing) {
        isCreatingKnockoutMatches.value = false
        return
      }
      
      advancingPlayers[group.name] = {
        first: standings[0]?.id,
        second: standings[1]?.id
      }
    }
    
    const quarterFinalMatches = [
      {
        player1Id: advancingPlayers.A.second,
        player2Id: advancingPlayers.D.first,
        round: 'Quarter-Final'
      },
      {
        player1Id: advancingPlayers.A.first,
        player2Id: advancingPlayers.D.second,
        round: 'Quarter-Final'
      },
      {
        player1Id: advancingPlayers.B.first,
        player2Id: advancingPlayers.C.second,
        round: 'Quarter-Final'
      },
      {
        player1Id: advancingPlayers.B.second,
        player2Id: advancingPlayers.C.first,
        round: 'Quarter-Final'
      }
    ]
    
    const getTournamentDate = () => {
      const existingMatch = allTournamentMatches.value.find(m => m.date)
      if (existingMatch && existingMatch.date) {
        const matchDate = existingMatch.date instanceof Date 
          ? existingMatch.date 
          : (existingMatch.date?.toDate ? existingMatch.date.toDate() : new Date(existingMatch.date))
        return matchDate
      }
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      return today
    }
    
    const tournamentDate = getTournamentDate()
    
    for (const matchData of quarterFinalMatches) {
      if (!matchData.player1Id || !matchData.player2Id) continue
      
      await matchesStore.fetchMatches()
      const currentMatches = allTournamentMatches.value.filter(m => m.round === 'Quarter-Final')
      
      const matchExists = currentMatches.some(existing => {
        const samePlayers = (
          (existing.player1Id === matchData.player1Id && existing.player2Id === matchData.player2Id) ||
          (existing.player1Id === matchData.player2Id && existing.player2Id === matchData.player1Id)
        )
        return samePlayers && existing.round === 'Quarter-Final'
      })
      
      if (matchExists) continue
      
      if (currentMatches.length >= 4) break
      
      try {
        await matchesStore.addMatch({
          tournamentId: tournament.value.id,
          player1Id: matchData.player1Id,
          player2Id: matchData.player2Id,
          round: matchData.round,
          date: today,
          status: 'scheduled',
          scores: []
        })
        
        await matchesStore.fetchMatches()
      } catch (error) {
        console.error('Error creating knockout match:', error)
      }
    }
  } finally {
    isCreatingKnockoutMatches.value = false
  }
}

const createSemiFinals = async () => {
  if (!tournament.value?.id) return
  
  if (isCreatingSemiFinals.value) return
  
  isCreatingSemiFinals.value = true
  
  try {
    await matchesStore.fetchMatches()
    
    const existingSemiFinals = allTournamentMatches.value.filter(m => m.round === 'Semi-Final')
    
    if (existingSemiFinals.length >= 2) {
      isCreatingSemiFinals.value = false
      return
    }
    
    const quarterFinals = allTournamentMatches.value.filter(m => m.round === 'Quarter-Final')
    
    if (quarterFinals.length < 4) {
      isCreatingSemiFinals.value = false
      return
    }
    
    const groupNames = ['A', 'B', 'C', 'D']
    const sortedGroups = groups.value
      .filter(g => groupNames.includes(g.name))
      .sort((a, b) => groupNames.indexOf(a.name) - groupNames.indexOf(b.name))
    
    if (sortedGroups.length !== 4) {
      isCreatingSemiFinals.value = false
      return
    }
    
    const advancingPlayers = {}
    
    for (const group of sortedGroups) {
      const standings = getGroupStandings(group.id)
      const playersAdvancing = tournament.value?.playersAdvancingPerGroup || 2
      
      if (standings.length < playersAdvancing) {
        isCreatingSemiFinals.value = false
        return
      }
      
      advancingPlayers[group.name] = {
        first: standings[0]?.id,
        second: standings[1]?.id
      }
    }
    
    const findQuarterFinal = (player1Id, player2Id) => {
      return quarterFinals.find(m => {
        const samePlayers = (
          (m.player1Id === player1Id && m.player2Id === player2Id) ||
          (m.player1Id === player2Id && m.player2Id === player1Id)
        )
        return samePlayers
      })
    }
    
    const qf1 = findQuarterFinal(advancingPlayers.A.second, advancingPlayers.D.first)
    const qf2 = findQuarterFinal(advancingPlayers.B.first, advancingPlayers.C.second)
    const qf3 = findQuarterFinal(advancingPlayers.A.first, advancingPlayers.D.second)
    const qf4 = findQuarterFinal(advancingPlayers.B.second, advancingPlayers.C.first)
    
    if (!qf1 || !qf2 || !qf3 || !qf4) {
      isCreatingSemiFinals.value = false
      return
    }
    
    const winner1 = getMatchWinner(qf1)
    const winner2 = getMatchWinner(qf2)
    const winner3 = getMatchWinner(qf3)
    const winner4 = getMatchWinner(qf4)
    
    if (!winner1 || !winner2 || !winner3 || !winner4) {
      isCreatingSemiFinals.value = false
      return
    }
    
    const semiFinalMatches = [
      {
        player1Id: winner1,
        player2Id: winner2,
        round: 'Semi-Final'
      },
      {
        player1Id: winner3,
        player2Id: winner4,
        round: 'Semi-Final'
      }
    ]
    
    const getTournamentDate = () => {
      const existingMatch = allTournamentMatches.value.find(m => m.date)
      if (existingMatch && existingMatch.date) {
        const matchDate = existingMatch.date instanceof Date 
          ? existingMatch.date 
          : (existingMatch.date?.toDate ? existingMatch.date.toDate() : new Date(existingMatch.date))
        return matchDate
      }
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      return today
    }
    
    const tournamentDate = getTournamentDate()
    
    let created = 0
    
    for (const matchData of semiFinalMatches) {
      if (!matchData.player1Id || !matchData.player2Id) continue
      
      await matchesStore.fetchMatches()
      const currentMatches = allTournamentMatches.value.filter(m => m.round === 'Semi-Final')
      
      const matchExists = currentMatches.some(existing => {
        const samePlayers = (
          (existing.player1Id === matchData.player1Id && existing.player2Id === matchData.player2Id) ||
          (existing.player1Id === matchData.player2Id && existing.player2Id === matchData.player1Id)
        )
        return samePlayers && existing.round === 'Semi-Final'
      })
      
      if (matchExists) continue
      
      if (currentMatches.length >= 2) break
      
      try {
        await matchesStore.addMatch({
          tournamentId: tournament.value.id,
          player1Id: matchData.player1Id,
          player2Id: matchData.player2Id,
          round: matchData.round,
          date: tournamentDate,
          status: 'scheduled',
          scores: []
        })
        await matchesStore.fetchMatches()
        created++
      } catch (error) {
        console.error('Error creating semi-final match:', error)
      }
    }
    
  } finally {
    isCreatingSemiFinals.value = false
  }
}

const createFinal = async () => {
  if (!tournament.value?.id) return
  
  if (isCreatingFinal.value) return
  
  isCreatingFinal.value = true
  
  try {
    await matchesStore.fetchMatches()
    
    const existingFinal = allTournamentMatches.value.filter(m => m.round === 'Final')
    
    if (existingFinal.length >= 1) {
      isCreatingFinal.value = false
      return
    }
    
    const semiFinals = allTournamentMatches.value
      .filter(m => m.round === 'Semi-Final')
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : (a.date?.toDate ? a.date.toDate() : new Date(0))
        const dateB = b.date instanceof Date ? b.date : (b.date?.toDate ? b.date.toDate() : new Date(0))
        return dateA - dateB
      })
    
    if (semiFinals.length !== 2) {
      isCreatingFinal.value = false
      return
    }
    
    const winners = semiFinals.map(match => getMatchWinner(match))
    
    if (winners.some(w => !w)) {
      isCreatingFinal.value = false
      return
    }
    
    await matchesStore.fetchMatches()
    const currentFinal = allTournamentMatches.value.filter(m => m.round === 'Final')
    
    if (currentFinal.length >= 1) {
      isCreatingFinal.value = false
      return
    }
    
    const matchExists = currentFinal.some(existing => {
      const samePlayers = (
        (existing.player1Id === winners[0] && existing.player2Id === winners[1]) ||
        (existing.player1Id === winners[1] && existing.player2Id === winners[0])
      )
      return samePlayers && existing.round === 'Final'
    })
    
    if (matchExists) {
      isCreatingFinal.value = false
      return
    }
    
    const getTournamentDate = () => {
      const existingMatch = allTournamentMatches.value.find(m => m.date)
      if (existingMatch && existingMatch.date) {
        const matchDate = existingMatch.date instanceof Date 
          ? existingMatch.date 
          : (existingMatch.date?.toDate ? existingMatch.date.toDate() : new Date(existingMatch.date))
        return matchDate
      }
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      return today
    }
    
    const tournamentDate = getTournamentDate()
    
    try {
      await matchesStore.addMatch({
        tournamentId: tournament.value.id,
        player1Id: winners[0],
        player2Id: winners[1],
        round: 'Final',
        date: tournamentDate,
        status: 'scheduled',
        scores: []
      })
      await matchesStore.fetchMatches()
    } catch (error) {
      console.error('Error creating final match:', error)
    }
  } finally {
    isCreatingFinal.value = false
  }
}

const checkAndCreateNextRound = async () => {
  if (!tournament.value?.id) return
  
  if (isCreatingSemiFinals.value || isCreatingFinal.value) return
  
  await matchesStore.fetchMatches()
  
  await createSemiFinals()
  await createFinal()
}

const loadTournament = async (tournamentId) => {
  if (!tournamentId) {
    tournament.value = null
    groups.value = []
    return
  }
  
  tournament.value = await tournamentsStore.getTournament(tournamentId)
  
  if (tournament.value?.groups && Array.isArray(tournament.value.groups)) {
    groups.value = tournament.value.groups
  } else if (tournament.value?.groups && typeof tournament.value.groups === 'object') {
    groups.value = Object.values(tournament.value.groups)
  } else {
    groups.value = []
  }
}

watch(selectedTournament, async (newVal) => {
  if (newVal) {
    await loadTournament(newVal)
    router.replace({ path: '/tournaments/manage', query: { id: newVal } })
  }
})

onMounted(async () => {
  await Promise.all([
    tournamentsStore.fetchTournaments(),
    opponentsStore.fetchOpponents(),
    matchesStore.fetchMatches(),
    teamsStore.fetchTeams()
  ])
  
  // Check if there's a tournament ID in route params or query
  const tournamentId = route.params.id || route.query.id
  
  if (tournamentId) {
    selectedTournament.value = tournamentId
    await loadTournament(tournamentId)
  } else if (tournamentTournaments.value.length > 0) {
    // Auto-select first tournament if available
    selectedTournament.value = tournamentTournaments.value[0].id
    await loadTournament(selectedTournament.value)
  }
})
</script>

