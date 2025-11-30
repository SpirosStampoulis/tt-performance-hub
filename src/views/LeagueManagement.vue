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
        <v-btn 
          v-if="isSimpleLeague" 
          color="success" 
          prepend-icon="mdi-account-group" 
          @click="showAddTeamMatchDialog = true" 
          class="mr-2"
        >
          Add Team Match
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-tournament" @click="openCreateTournamentDialog">
          Create Tournament
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="selectedTournament">
      <v-col cols="12" md="8" :order-md="1" :order="2">
        <v-card class="mb-4" v-if="!isSimpleLeague && tournamentTeams.length > 0">
          <v-card-title>
            <v-icon class="mr-2">mdi-podium</v-icon>
            Standings
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="standings-table-wrapper">
              <v-table density="compact" class="standings-table">
                <thead>
                  <tr>
                    <th class="text-left fixed-col-1">Pos</th>
                    <th class="text-left fixed-col-2">Team</th>
                    <th class="text-center scrollable-col">P</th>
                    <th class="text-center scrollable-col">W</th>
                    <th class="text-center scrollable-col">L</th>
                    <th class="text-center scrollable-col">MD</th>
                    <th class="text-center scrollable-col">Pts</th>
                    <th class="text-center scrollable-col">Last 5</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(team, index) in standings" 
                    :key="team.id" 
                    :class="[
                      { 'bg-primary-lighten-4': team.isMyTeam },
                      team.positionClass
                    ]"
                  >
                    <td class="fixed-col-1">
                      <div class="d-flex align-center" style="max-width: 100%; overflow: hidden;">
                        <span 
                          :class="getPositionNumberClass(team.positionClass)"
                          class="position-number-circle"
                        >
                          {{ index + 1 }}
                        </span>
                      </div>
                    </td>
                    <td class="fixed-col-2">
                      <a @click="viewTeamMatches(team)" style="cursor: pointer; text-decoration: none; color: inherit; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ team.name }}
                      </a>
                    </td>
                    <td class="text-center scrollable-col">{{ team.played }}</td>
                    <td class="text-center scrollable-col">{{ team.won }}</td>
                    <td class="text-center scrollable-col">{{ team.lost }}</td>
                    <td class="text-center scrollable-col" :class="team.matchDifference > 0 ? 'text-success' : team.matchDifference < 0 ? 'text-error' : ''">
                      {{ team.matchDifference > 0 ? '+' : '' }}{{ team.matchDifference }}
                    </td>
                    <td class="text-center scrollable-col"><strong>{{ team.points }}</strong></td>
                    <td class="text-center scrollable-col">
                      <div class="last-five-matches">
                        <span 
                          v-for="(result, idx) in team.lastFive.split(' ')" 
                          :key="idx"
                          :class="['match-result', result === 'W' ? 'win' : result === 'L' ? 'loss' : '']"
                        >
                          {{ result }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mb-4" v-if="upcomingMatches.length > 0">
          <v-card-title>
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            Upcoming Matches
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-card
              v-for="round in upcomingMatchesByRound"
              :key="round.round"
              class="mb-3"
              variant="outlined"
            >
              <v-card-title class="text-subtitle-1">
                <v-icon size="small" class="mr-2">mdi-calendar-range</v-icon>
                Round {{ round.round }}
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="match in round.matches"
                    :key="match.id"
                    @click="openMatchForScores(match)"
                    class="mb-1"
                    style="border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; cursor: pointer;"
                  >
                    <v-list-item-title class="text-body-1">
                      <span v-if="match.player1Id && match.player2Id">
                        {{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}
                      </span>
                      <span v-else-if="match.player1TeamId && match.player2TeamId">
                        {{ getTeamName(match.player1TeamId) }} vs {{ getTeamName(match.player2TeamId) }}
                      </span>
                      <span v-else>
                        Match TBD
                      </span>
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                      {{ formatDate(match.date) }}
                      <span v-if="match.player1TeamId || match.player2TeamId" class="ml-2">
                        • {{ getTeamName(match.player1TeamId) }} vs {{ getTeamName(match.player2TeamId) }}
                      </span>
                      <span v-if="!match.player1Id || !match.player2Id" class="ml-2 text-info">
                        <v-icon size="x-small" class="mr-1">mdi-information</v-icon>
                        Players TBD
                      </span>
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        size="small"
                        color="primary"
                        variant="outlined"
                        prepend-icon="mdi-pencil"
                        @click.stop="openMatchForScores(match)"
                      >
                        Add Scores
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Team Matches
            <v-spacer></v-spacer>
            <v-btn 
              v-if="!isSimpleLeague"
              icon="mdi-refresh" 
              size="small" 
              variant="text"
              @click="refreshTeamMatches"
              :loading="refreshing || isCalculating"
            >
              <v-icon>mdi-refresh</v-icon>
              <v-tooltip activator="parent">Refresh team matches and standings</v-tooltip>
            </v-btn>
            <v-btn 
              v-if="!isSimpleLeague"
              icon="mdi-broom" 
              size="small" 
              variant="text"
              color="warning"
              @click="showCleanupDialog = true"
            >
              <v-icon>mdi-broom</v-icon>
              <v-tooltip activator="parent">Clean up duplicates</v-tooltip>
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="tournamentTeamMatches.length === 0" class="text-center text-medium-emphasis py-8">
            <span v-if="isSimpleLeague">No team matches yet. Click "Add Team Match" to create one.</span>
            <span v-else>No team matches calculated yet. Matches will be automatically calculated when 6 individual matches are added for a round.</span>
          </v-card-text>
          <div v-else>
            <v-card
              v-for="round in groupedByRound"
              :key="round.round"
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                <v-icon class="mr-2">mdi-calendar-range</v-icon>
                Round {{ round.round }}
                <span v-if="round.matches.length > 0 && round.matches[0].date" class="text-body-2 text-medium-emphasis ml-2">
                  • {{ formatDate(round.matches[0].date) }}
                </span>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-list density="comfortable">
                  <v-list-item
                    v-for="teamMatch in round.matches"
                    :key="teamMatch.id"
                    @click="viewTeamMatch(teamMatch)"
                    class="mb-2"
                    style="border: 1px solid rgba(0,0,0,0.12); border-radius: 4px;"
                  >
                    <v-list-item-title class="mb-1" style="white-space: normal; word-break: break-word; line-height: 1.4; overflow: visible;">
                      <span class="text-body-1 text-md-h6">
                        {{ getTeamName(teamMatch.team1Id || teamMatch.myTeamId) }} vs {{ getTeamName(teamMatch.team2Id || teamMatch.opponentTeamId) }}
                      </span>
                      <v-icon 
                        v-if="teamMatch.photoUrl" 
                        size="small" 
                        color="primary" 
                        class="ml-2"
                        style="display: inline-block; vertical-align: middle;"
                      >
                        mdi-image
                      </v-icon>
                    </v-list-item-title>
                    <template v-slot:append>
                      <div class="text-right">
                        <div class="text-h5">
                          {{ (teamMatch.team1Score ?? teamMatch.myTeamScore ?? 0) }}-{{ (teamMatch.team2Score ?? teamMatch.opponentTeamScore ?? 0) }}
                        </div>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4" v-if="!isSimpleLeague" :order-md="2" :order="1">
      </v-col>
    </v-row>

    <v-dialog v-model="showAddTeamMatchDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingTeamMatch ? 'Edit Team Match' : 'Add Team Match' }}</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-form ref="teamMatchForm">
            <v-select
              v-model="newTeamMatch.team1Id"
              :items="tournamentTeams"
              item-title="name"
              item-value="id"
              label="Team 1"
              variant="outlined"
              :rules="[v => !!v || 'Team 1 is required']"
            ></v-select>

            <v-select
              v-model="newTeamMatch.team2Id"
              :items="tournamentTeams"
              item-title="name"
              item-value="id"
              label="Team 2"
              variant="outlined"
              :rules="[
                v => !!v || 'Team 2 is required',
                v => v !== newTeamMatch.team1Id || 'Team 2 must be different from Team 1'
              ]"
            ></v-select>

            <v-text-field
              v-model="newTeamMatch.round"
              label="Round"
              variant="outlined"
              :rules="[v => !!v || 'Round is required']"
            ></v-text-field>

            <v-text-field
              v-model="newTeamMatch.date"
              label="Date"
              type="date"
              variant="outlined"
              :rules="[v => !!v || 'Date is required']"
            ></v-text-field>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="newTeamMatch.team1Score"
                  label="Team 1 Score"
                  type="number"
                  variant="outlined"
                  min="0"
                  :rules="[v => v >= 0 || 'Score must be 0 or greater']"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="newTeamMatch.team2Score"
                  label="Team 2 Score"
                  type="number"
                  variant="outlined"
                  min="0"
                  :rules="[v => v >= 0 || 'Score must be 0 or greater']"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-file-input
              v-model="newTeamMatch.photoFile"
              label="Upload Photo (Optional)"
              variant="outlined"
              accept="image/*"
              prepend-icon=""
              prepend-inner-icon="mdi-camera"
              :clearable="true"
              @update:model-value="handleNewTeamMatchPhotoChange"
            ></v-file-input>

            <v-img
              v-if="newTeamMatchPhotoPreview"
              :src="newTeamMatchPhotoPreview"
              aspect-ratio="16/9"
              cover
              class="mb-2"
            ></v-img>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeAddTeamMatchDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveTeamMatch" :loading="savingTeamMatch">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showTeamMatchDetail" max-width="600">
      <v-card v-if="selectedTeamMatch">
        <v-card-title class="dialog-header">
          <span>Team Match Details</span>
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            size="small"
            class="dialog-close-btn"
            @click="showTeamMatchDetail = false"
          ></v-btn>
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
                Score: {{ (selectedTeamMatch.team1Score ?? selectedTeamMatch.myTeamScore ?? 0) }}-{{ (selectedTeamMatch.team2Score ?? selectedTeamMatch.opponentTeamScore ?? 0) }}
              </div>
              
              <v-card v-if="!isSimpleLeague" variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">Individual Matches</v-card-title>
                <v-card-text>
                  <div v-if="getTeamMatchIndividualMatches(selectedTeamMatch).length === 0" class="text-center text-medium-emphasis py-2">
                    No individual matches found
                  </div>
                  <v-table density="compact" v-else>
                    <thead>
                      <tr>
                        <th class="text-left" style="width: 50px;">#</th>
                        <th class="text-left">Match</th>
                        <th class="text-center">Score</th>
                        <th class="text-center">Team Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(match, index) in getTeamMatchIndividualMatches(selectedTeamMatch)"
                        :key="match.id"
                        @click="match.id && $router.push(`/matches/${match.id}`)"
                        style="cursor: pointer;"
                        class="match-row-hover"
                      >
                        <td>
                          <v-chip size="x-small" color="primary" variant="flat">{{ index + 1 }}</v-chip>
                        </td>
                        <td>
                          <span :class="getMatchWinnerClass(match, selectedTeamMatch.team1Id || selectedTeamMatch.myTeamId)">
                            {{ getPlayerName(match.player1Id) }}
                          </span>
                          <span class="mx-2">vs</span>
                          <span :class="getMatchWinnerClass(match, selectedTeamMatch.team2Id || selectedTeamMatch.opponentTeamId)">
                            {{ getPlayerName(match.player2Id) }}
                          </span>
                        </td>
                        <td class="text-center">
                          <v-chip size="x-small" :color="getMatchWinnerChipColor(match, selectedTeamMatch.team1Id || selectedTeamMatch.myTeamId)">
                            {{ getMatchScore(match) }}
                          </v-chip>
                        </td>
                        <td class="text-center">
                          <strong>{{ getProgressiveScore(selectedTeamMatch, index) }}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
              
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
              
              <div v-if="selectedTeamMatch.notes && selectedTeamMatch.notes !== 'Auto-calculated from individual matches'" class="mt-4">
                <div class="text-subtitle-1 mb-2">Notes</div>
                <p style="white-space: pre-wrap">{{ selectedTeamMatch.notes }}</p>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            v-if="isSimpleLeague" 
            color="error" 
            prepend-icon="mdi-delete" 
            @click="confirmDeleteTeamMatch"
          >
            Delete
          </v-btn>
          <v-btn 
            v-if="isSimpleLeague" 
            color="primary" 
            prepend-icon="mdi-pencil" 
            @click="editTeamMatch"
          >
            Edit
          </v-btn>
          <v-btn text @click="showTeamMatchDetail = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDeleteTeamMatchDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Team Match</v-card-title>
        <v-card-text>
          Are you sure you want to delete this team match? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteTeamMatchDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteTeamMatch">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showTeamMatchesDialog" max-width="700">
      <v-card v-if="selectedTeamForMatches">
        <v-card-title class="dialog-header">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            <span>{{ selectedTeamForMatches.name }} - Team Matches</span>
          </div>
          <v-btn 
            icon="mdi-close" 
            variant="text" 
            size="small"
            class="dialog-close-btn"
            @click="showTeamMatchesDialog = false"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div v-if="getTeamMatches(selectedTeamForMatches.id).length === 0" class="text-center text-medium-emphasis py-8">
            No team matches found for this team
          </div>
          <v-list v-else density="comfortable">
            <v-list-item
              v-for="teamMatch in getTeamMatches(selectedTeamForMatches.id)"
              :key="teamMatch.id"
              @click="viewTeamMatch(teamMatch)"
              class="mb-2"
              style="border: 1px solid rgba(0,0,0,0.12); border-radius: 4px;"
            >
              <template v-slot:prepend>
                <v-avatar v-if="teamMatch.photoUrl" size="50" class="mr-3">
                  <v-img :src="teamMatch.photoUrl"></v-img>
                </v-avatar>
                <v-avatar v-else size="50" color="grey-lighten-2" class="mr-3">
                  <v-icon>mdi-trophy</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="text-h6 mb-1">
                vs {{ getOpponentTeamName(teamMatch, selectedTeamForMatches.id) }}
                <v-icon 
                  v-if="teamMatch.photoUrl" 
                  size="small" 
                  color="primary" 
                  class="ml-2"
                >
                  mdi-image
                </v-icon>
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-icon size="small" class="mr-1">mdi-calendar-range</v-icon>
                Round {{ teamMatch.round }} • {{ formatDate(teamMatch.date) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-right">
                  <div class="text-h5 mb-1">
                    {{ getTeamScore(teamMatch, selectedTeamForMatches.id) }}-{{ getOpponentScore(teamMatch, selectedTeamForMatches.id) }}
                  </div>
                  <v-chip 
                    size="small" 
                    :color="getTeamMatchResult(teamMatch, selectedTeamForMatches.id) === 'Won' ? 'success' : 'error'"
                  >
                    {{ getTeamMatchResult(teamMatch, selectedTeamForMatches.id) }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showTeamMatchesDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showCleanupDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="warning">mdi-alert</v-icon>
          Clean Up Duplicate Team Matches
        </v-card-title>
        <v-card-text>
          <p class="mb-3">This will scan for duplicate team matches in the selected tournament and remove them.</p>
          <p class="mb-3">Duplicates are identified by: <strong>Tournament + Round + Team Pair</strong></p>
          <p class="mb-0">When duplicates are found, the system will keep:</p>
          <ul class="mt-2">
            <li>The match with a photo (if available), OR</li>
            <li>The most recently created match</li>
          </ul>
          <v-alert v-if="cleanupResults" :type="cleanupResults.type" class="mt-4">
            {{ cleanupResults.message }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeCleanupDialog" :disabled="cleaningUp">
            {{ cleanupResults ? 'Close' : 'Cancel' }}
          </v-btn>
          <v-btn 
            v-if="!cleanupResults"
            color="warning" 
            @click="cleanupDuplicates"
            :loading="cleaningUp"
            :disabled="cleaningUp"
          >
            Clean Up
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentsStore } from '../stores/tournaments'
import { useTeamsStore } from '../stores/teams'
import { useTeamMatchesStore } from '../stores/teamMatches'
import { useMatchesStore } from '../stores/matches'
import { useOpponentsStore } from '../stores/opponents'
import { formatDate } from '../utils/date'
import { uploadImage } from '../utils/storage'

const router = useRouter()
const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()
const teamMatchesStore = useTeamMatchesStore()
const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()

const selectedTournament = ref(null)
const refreshing = ref(false)
const isCalculating = ref(false)
const showCleanupDialog = ref(false)
const cleaningUp = ref(false)
const cleanupResults = ref(null)
const showTeamMatchesDialog = ref(false)
const selectedTeamForMatches = ref(null)
const showAddTeamMatchDialog = ref(false)
const editingTeamMatch = ref(null)
const teamMatchToDelete = ref(null)
const showDeleteTeamMatchDialog = ref(false)
const newTeamMatch = ref({
  team1Id: '',
  team2Id: '',
  round: '',
  date: new Date().toISOString().split('T')[0],
  team1Score: 0,
  team2Score: 0,
  photoFile: null
})
const newTeamMatchPhotoPreview = ref(null)
const savingTeamMatch = ref(false)
const teamMatchForm = ref(null)
const photoPreview = ref(null)


onMounted(async () => {
  await Promise.all([
    tournamentsStore.fetchTournaments(),
    teamsStore.fetchTeams(),
    teamMatchesStore.fetchTeamMatches(),
    matchesStore.fetchMatches(),
    opponentsStore.fetchOpponents()
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
  
  // Clean up invalid team matches for Simple League tournaments
  if (selectedTournament.value && isSimpleLeague.value) {
    await cleanupInvalidSimpleLeagueTeamMatches()
  }
  
  if (selectedTournament.value && !isSimpleLeague.value) {
    await calculateTeamMatches()
  }
  
  // Recalculate when page becomes visible (user switches back to tab)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && selectedTournament.value && !isSimpleLeague.value) {
      console.log('Page became visible, refreshing data...')
      await Promise.all([
        matchesStore.fetchMatches(),
        teamsStore.fetchTeams(),
        opponentsStore.fetchOpponents()
      ])
      await calculateTeamMatches()
    }
  })
  
  // Also recalculate when window gains focus (user switches back to browser)
  window.addEventListener('focus', async () => {
    if (selectedTournament.value && !isSimpleLeague.value) {
      console.log('Window gained focus, refreshing data...')
      await Promise.all([
        matchesStore.fetchMatches(),
        teamsStore.fetchTeams(),
        opponentsStore.fetchOpponents()
      ])
      await calculateTeamMatches()
    }
  })
})

watch(selectedTournament, async (newVal) => {
  if (newVal) {
    if (isSimpleLeague.value) {
      // For Simple League, clean up invalid team matches
      await cleanupInvalidSimpleLeagueTeamMatches()
    } else {
      await Promise.all([
        matchesStore.fetchMatches(),
        teamsStore.fetchTeams(),
        opponentsStore.fetchOpponents()
      ])
      await calculateTeamMatches()
    }
  }
})

// Watch for team matches changes to update standings
watch(() => teamMatchesStore.teamMatches, () => {
  // Standings are computed, so they'll update automatically
  // This watch just ensures reactivity
}, { deep: true })

watch(() => matchesStore.matches.length, async (newLength, oldLength) => {
  if (!selectedTournament.value || isSimpleLeague.value) return
  if (newLength === oldLength) return
  
  console.log(`Match count changed: ${oldLength} → ${newLength}, triggering recalculation...`)
  
  // Always fetch latest matches to ensure we have the most up-to-date data
  await matchesStore.fetchMatches()
  
  const tournamentMatches = matchesStore.matches.filter(
    m => m.tournamentId === selectedTournament.value && m.round
  )
  
  if (tournamentMatches.length === 0) {
    console.log('No tournament matches found, skipping calculation')
    return
  }
  
  console.log(`Found ${tournamentMatches.length} matches for tournament ${selectedTournament.value}`)
  console.log(`Rounds: ${[...new Set(tournamentMatches.map(m => m.round))].join(', ')}`)
  
  // Small delay to ensure matches are fully updated
  await new Promise(resolve => setTimeout(resolve, 300))
  
  await Promise.all([
    teamsStore.fetchTeams(),
    opponentsStore.fetchOpponents()
  ])
  
  await calculateTeamMatches()
}, { immediate: false })

// Also watch the matches array itself for deep changes
watch(() => matchesStore.matches, async (newMatches, oldMatches) => {
  if (!selectedTournament.value || isSimpleLeague.value) return
  if (isCalculating.value) {
    console.log('Calculation already in progress, skipping watcher trigger')
    return
  }
  
  // Check if matches actually changed for this tournament
  const oldTournamentMatches = oldMatches?.filter(m => m.tournamentId === selectedTournament.value && m.round) || []
  const newTournamentMatches = newMatches.filter(m => m.tournamentId === selectedTournament.value && m.round)
  
  if (oldTournamentMatches.length === newTournamentMatches.length) {
    // Check if any match IDs changed (new matches added)
    const oldIds = new Set(oldTournamentMatches.map(m => m.id))
    const newIds = new Set(newTournamentMatches.map(m => m.id))
    const hasNewMatches = [...newIds].some(id => !oldIds.has(id))
    
    if (!hasNewMatches) {
      return // No new matches, skip
    }
  }
  
  console.log(`Tournament matches changed: ${oldTournamentMatches.length} → ${newTournamentMatches.length}`)
  
  // Small delay to ensure matches are fully updated
  await new Promise(resolve => setTimeout(resolve, 300))
  
  await Promise.all([
    teamsStore.fetchTeams(),
    opponentsStore.fetchOpponents()
  ])
  
  await calculateTeamMatches()
}, { deep: true, immediate: false })

const leagueTournaments = computed(() => {
  return tournamentsStore.tournaments
    .filter(t => t.type === 'League' || t.type === 'Simple League')
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
  
  // Get team matches for this tournament
  let matches = teamMatchesStore.getTeamMatchesByTournament(selectedTournament.value)
  
  // Additional safety check: verify tournament type matches
  const tournament = tournamentsStore.tournaments.find(t => t.id === selectedTournament.value)
  if (tournament?.type === 'Simple League') {
    // For Simple League, only show team matches that were manually created
    // Filter out any team matches that have the old calculated structure (myTeamId/opponentTeamId)
    // Simple League team matches should only have team1Id/team2Id structure
    matches = matches.filter(tm => {
      // Exclude team matches that have the old calculated structure
      if (tm.myTeamId || tm.opponentTeamId) {
        return false
      }
      // Must have team1Id and team2Id (the manual structure)
      if (!tm.team1Id || !tm.team2Id) {
        return false
      }
      // Verify that both teams actually exist in the tournament
      const team1 = tournamentTeams.value.find(t => t.id === tm.team1Id)
      const team2 = tournamentTeams.value.find(t => t.id === tm.team2Id)
      return team1 && team2
    })
  }
  
  return matches
})

const isSimpleLeague = computed(() => {
  if (!selectedTournament.value) return false
  const tournament = tournamentsStore.tournaments.find(t => t.id === selectedTournament.value)
  return tournament?.type === 'Simple League'
})

const groupedByRound = computed(() => {
  const rounds = {}
  tournamentTeamMatches.value.forEach(tm => {
    const round = tm.round || 'Unknown'
    if (!rounds[round]) {
      rounds[round] = []
    }
    rounds[round].push(tm)
  })
  
  // Sort rounds numerically if they're numbers, otherwise alphabetically
  return Object.keys(rounds).sort((a, b) => {
    const aNum = parseInt(a)
    const bNum = parseInt(b)
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum
    }
    return a.localeCompare(b)
  }).map(round => ({
    round,
    matches: rounds[round].sort((a, b) => {
      // Sort matches within each round by date (newest first)
      const dateA = a.date ? new Date(a.date) : new Date(0)
      const dateB = b.date ? new Date(b.date) : new Date(0)
      return dateB - dateA
    })
  }))
})

const upcomingMatches = computed(() => {
  if (!selectedTournament.value) return []
  
  return matchesStore.matches.filter(match => {
    if (match.tournamentId !== selectedTournament.value) return false
    
    const isScheduled = match.status === 'scheduled'
    const hasScores = match.scores && match.scores.length > 0 && 
      match.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
    const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
    const isFuture = matchDate > new Date()
    
    return isScheduled || (!hasScores && isFuture)
  })
})

const upcomingMatchesByRound = computed(() => {
  const grouped = {}
  upcomingMatches.value.forEach(match => {
    const round = match.round || 'Unknown'
    if (!grouped[round]) {
      grouped[round] = []
    }
    grouped[round].push(match)
  })
  
  return Object.keys(grouped).sort((a, b) => {
    const aNum = parseInt(a)
    const bNum = parseInt(b)
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum
    }
    return a.localeCompare(b)
  }).map(round => ({
    round,
    matches: grouped[round].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : a.date.toDate()
      const dateB = b.date instanceof Date ? b.date : b.date.toDate()
      return dateA - dateB
    })
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
      points: 0,
      matchesWon: 0,
      matchesLost: 0,
      recentMatches: []
    }
  })
  
  tournamentTeamMatches.value.forEach(tm => {
    const team1Id = tm.team1Id || tm.myTeamId
    const team2Id = tm.team2Id || tm.opponentTeamId
    const team1Score = tm.team1Score !== undefined ? tm.team1Score : tm.myTeamScore
    const team2Score = tm.team2Score !== undefined ? tm.team2Score : tm.opponentTeamScore
    
    if (teamStats[team1Id]) {
      teamStats[team1Id].played++
      teamStats[team1Id].matchesWon += team1Score
      teamStats[team1Id].matchesLost += team2Score
      if (team1Score >= 4) {
        teamStats[team1Id].won++
        teamStats[team1Id].points += 3
      } else {
        teamStats[team1Id].lost++
      }
      teamStats[team1Id].recentMatches.push({
        date: tm.date instanceof Date ? tm.date : (tm.date?.toDate ? tm.date.toDate() : new Date(tm.date || 0)),
        result: team1Score >= 4 ? 'W' : 'L'
      })
    }
    
    if (teamStats[team2Id]) {
      teamStats[team2Id].played++
      teamStats[team2Id].matchesWon += team2Score
      teamStats[team2Id].matchesLost += team1Score
      if (team2Score >= 4) {
        teamStats[team2Id].won++
        teamStats[team2Id].points += 3
      } else {
        teamStats[team2Id].lost++
      }
      teamStats[team2Id].recentMatches.push({
        date: tm.date instanceof Date ? tm.date : (tm.date?.toDate ? tm.date.toDate() : new Date(tm.date || 0)),
        result: team2Score >= 4 ? 'W' : 'L'
      })
    }
  })
  
  const sorted = Object.values(teamStats).map(team => ({
    ...team,
    matchDifference: team.matchesWon - team.matchesLost
  })).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points
    }
    return b.matchDifference - a.matchDifference
  })
  
  return sorted.map((team, index) => {
    const position = index + 1
    const totalTeams = sorted.length
    let positionClass = ''
    let positionLabel = ''
    
    if (position <= 2) {
      positionClass = 'promoted'
      positionLabel = 'Promoted'
    } else if (position === 3) {
      positionClass = 'playoff'
      positionLabel = 'Playoff'
    } else if (position === totalTeams - 2) {
      positionClass = 'playout'
      positionLabel = 'Playout'
    } else if (position === totalTeams - 1) {
      positionClass = 'demoted'
      positionLabel = 'Demoted'
    } else if (position === totalTeams) {
      positionClass = 'demoted'
      positionLabel = 'Demoted'
    }
    
    const sortedRecent = team.recentMatches
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
      .map(m => m.result)
    
    return {
      ...team,
      positionClass,
      positionLabel,
      lastFive: sortedRecent.length > 0 ? sortedRecent.join(' ') : '-'
    }
  })
})

const getTeamName = (teamId) => {
  const team = tournamentTeams.value.find(t => t.id === teamId)
  return team ? team.name : 'Unknown'
}

const getPositionNumberClass = (positionClass) => {
  const classes = {
    'promoted': 'text-success',
    'playoff': 'text-warning',
    'playout': 'text-warning',
    'demoted': 'text-error'
  }
  return classes[positionClass] || ''
}

const getPlayerName = (playerId) => {
  if (!playerId) return 'Unknown'
  const player = opponentsStore.opponents.find(p => p.id === playerId)
  return player ? player.name : 'Unknown'
}

const getTeamMatchIndividualMatches = (teamMatch) => {
  if (!teamMatch || !selectedTournament.value) return []
  
  const team1Id = teamMatch.team1Id || teamMatch.myTeamId
  const team2Id = teamMatch.team2Id || teamMatch.opponentTeamId
  const round = String(teamMatch.round || '')
  
  const matches = matchesStore.matches.filter(match => 
    match.tournamentId === selectedTournament.value &&
    String(match.round) === round &&
    ((match.player1TeamId === team1Id && match.player2TeamId === team2Id) ||
     (match.player1TeamId === team2Id && match.player2TeamId === team1Id))
  )
  
  // Sort by creation date to maintain the order they were created
  return matches.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt instanceof Date ? a.createdAt : new Date(a.date || 0))
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt instanceof Date ? b.createdAt : new Date(b.date || 0))
    return dateA - dateB
  })
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

const getMatchWinner = (match, teamId) => {
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
  
  const player1TeamId = match.player1TeamId
  const player2TeamId = match.player2TeamId
  
  if (player1Sets > player2Sets) {
    return player1TeamId === teamId
  } else {
    return player2TeamId === teamId
  }
}

const getMatchWinnerClass = (match, teamId) => {
  const won = getMatchWinner(match, teamId)
  if (won === null) return ''
  return won ? 'font-weight-bold text-primary' : 'text-medium-emphasis'
}

const getMatchWinnerChipColor = (match, teamId) => {
  const won = getMatchWinner(match, teamId)
  if (won === null) return 'default'
  return won ? 'success' : 'error'
}

const getProgressiveScore = (teamMatch, matchIndex) => {
  const team1Id = teamMatch.team1Id || teamMatch.myTeamId
  const team2Id = teamMatch.team2Id || teamMatch.opponentTeamId
  const individualMatches = getTeamMatchIndividualMatches(teamMatch)
  
  let team1Score = 0
  let team2Score = 0
  
  // Calculate progressive score up to the current match index
  for (let i = 0; i <= matchIndex && i < individualMatches.length; i++) {
    const match = individualMatches[i]
    const winner = getMatchWinner(match, team1Id)
    
    if (winner === true) {
      team1Score++
    } else if (winner === false) {
      team2Score++
    }
  }
  
  return `${team1Score}-${team2Score}`
}

const viewTeamMatches = (team) => {
  selectedTeamForMatches.value = team
  showTeamMatchesDialog.value = true
}

const getTeamMatches = (teamId) => {
  if (!selectedTournament.value) return []
  return tournamentTeamMatches.value.filter(tm => 
    (tm.team1Id === teamId || tm.myTeamId === teamId) ||
    (tm.team2Id === teamId || tm.opponentTeamId === teamId)
  )
}

const getOpponentTeamName = (teamMatch, teamId) => {
  const team1Id = teamMatch.team1Id || teamMatch.myTeamId
  const team2Id = teamMatch.team2Id || teamMatch.opponentTeamId
  
  if (team1Id === teamId) {
    return getTeamName(team2Id)
  } else {
    return getTeamName(team1Id)
  }
}

const getTeamScore = (teamMatch, teamId) => {
  const team1Id = teamMatch.team1Id || teamMatch.myTeamId
  const team2Id = teamMatch.team2Id || teamMatch.opponentTeamId
  const team1Score = teamMatch.team1Score ?? teamMatch.myTeamScore ?? 0
  const team2Score = teamMatch.team2Score ?? teamMatch.opponentTeamScore ?? 0
  
  if (team1Id === teamId) {
    return team1Score
  } else {
    return team2Score
  }
}

const getOpponentScore = (teamMatch, teamId) => {
  const team1Id = teamMatch.team1Id || teamMatch.myTeamId
  const team2Id = teamMatch.team2Id || teamMatch.opponentTeamId
  const team1Score = teamMatch.team1Score ?? teamMatch.myTeamScore ?? 0
  const team2Score = teamMatch.team2Score ?? teamMatch.opponentTeamScore ?? 0
  
  if (team1Id === teamId) {
    return team2Score
  } else {
    return team1Score
  }
}

const getTeamMatchResult = (teamMatch, teamId) => {
  const teamScore = getTeamScore(teamMatch, teamId)
  const opponentScore = getOpponentScore(teamMatch, teamId)
  
  if (teamScore >= 4) {
    return 'Won'
  } else {
    return 'Lost'
  }
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

const handleNewTeamMatchPhotoChange = (value) => {
  const file = getFileFromInput(value)
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      newTeamMatchPhotoPreview.value = e.target.result
    }
    reader.onerror = () => {
      console.error('Error reading file')
      newTeamMatchPhotoPreview.value = null
    }
    reader.readAsDataURL(file)
  } else {
    newTeamMatchPhotoPreview.value = null
  }
}

const closeAddTeamMatchDialog = () => {
  showAddTeamMatchDialog.value = false
  editingTeamMatch.value = null
  newTeamMatch.value = {
    team1Id: '',
    team2Id: '',
    round: '',
    date: new Date().toISOString().split('T')[0],
    team1Score: 0,
    team2Score: 0,
    photoFile: null
  }
  newTeamMatchPhotoPreview.value = null
  if (teamMatchForm.value) {
    teamMatchForm.value.reset()
  }
}

const editTeamMatch = () => {
  if (!selectedTeamMatch.value) return
  
  editingTeamMatch.value = selectedTeamMatch.value
  newTeamMatch.value = {
    team1Id: selectedTeamMatch.value.team1Id || '',
    team2Id: selectedTeamMatch.value.team2Id || '',
    round: selectedTeamMatch.value.round || '',
    date: selectedTeamMatch.value.date 
      ? (selectedTeamMatch.value.date instanceof Date 
          ? selectedTeamMatch.value.date.toISOString().split('T')[0]
          : (selectedTeamMatch.value.date?.toDate 
              ? selectedTeamMatch.value.date.toDate().toISOString().split('T')[0]
              : new Date(selectedTeamMatch.value.date).toISOString().split('T')[0]))
      : new Date().toISOString().split('T')[0],
    team1Score: selectedTeamMatch.value.team1Score || 0,
    team2Score: selectedTeamMatch.value.team2Score || 0,
    photoFile: null
  }
  newTeamMatchPhotoPreview.value = selectedTeamMatch.value.photoUrl || null
  showTeamMatchDetail.value = false
  showAddTeamMatchDialog.value = true
}

const confirmDeleteTeamMatch = () => {
  if (!selectedTeamMatch.value) return
  teamMatchToDelete.value = selectedTeamMatch.value
  showDeleteTeamMatchDialog.value = true
}

const deleteTeamMatch = async () => {
  if (!teamMatchToDelete.value) return
  
  try {
    await teamMatchesStore.deleteTeamMatch(teamMatchToDelete.value.id)
    showDeleteTeamMatchDialog.value = false
    showTeamMatchDetail.value = false
    teamMatchToDelete.value = null
    await teamMatchesStore.fetchTeamMatches()
  } catch (error) {
    console.error('Error deleting team match:', error)
    alert('Error deleting team match. Please try again.')
  }
}

const saveTeamMatch = async () => {
  if (!teamMatchForm.value) return
  
  const { valid } = await teamMatchForm.value.validate()
  if (!valid) return

  if (!selectedTournament.value) {
    alert('Please select a tournament first')
    return
  }

  savingTeamMatch.value = true
  try {
    let photoUrl = null
    
    // Upload photo if provided
    if (newTeamMatch.value.photoFile) {
      const file = getFileFromInput(newTeamMatch.value.photoFile)
      if (file) {
        // Create a temporary ID for the photo path
        const tempId = `temp_${Date.now()}`
        photoUrl = await uploadImage(file, `teamMatches/${tempId}`)
      }
    }

    const teamMatchData = {
      tournamentId: selectedTournament.value,
      team1Id: newTeamMatch.value.team1Id,
      team2Id: newTeamMatch.value.team2Id,
      round: String(newTeamMatch.value.round),
      date: new Date(newTeamMatch.value.date),
      team1Score: newTeamMatch.value.team1Score || 0,
      team2Score: newTeamMatch.value.team2Score || 0,
      photoUrl: photoUrl || (editingTeamMatch.value?.photoUrl || null)
    }

    if (editingTeamMatch.value) {
      // Update existing team match
      await teamMatchesStore.updateTeamMatch(editingTeamMatch.value.id, teamMatchData)
    } else {
      // Create new team match
      const teamMatchId = await teamMatchesStore.addTeamMatch(teamMatchData)
      
      // If we uploaded a photo with a temp ID, update it with the real ID
      if (photoUrl && teamMatchId) {
        // The photo was already uploaded with the temp path, but we can re-upload with the real ID if needed
        // For now, we'll keep the temp path as it works fine
      }
    }

    closeAddTeamMatchDialog()
    await teamMatchesStore.fetchTeamMatches()
  } catch (error) {
    console.error('Error saving team match:', error)
    alert('Error saving team match. Please try again.')
  } finally {
    savingTeamMatch.value = false
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
const teamMatchPhotoPreview = ref(null)

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

const backfillTeamIds = async () => {
  if (!selectedTournament.value) return

  const tournamentMatches = matchesStore.matches.filter(
    m => m.tournamentId === selectedTournament.value && m.round && (!m.player1TeamId || !m.player2TeamId)
  )

  if (tournamentMatches.length === 0) {
    console.log('No matches need team ID backfilling')
    return
  }

  console.log(`Backfilling team IDs for ${tournamentMatches.length} matches`)

  for (const match of tournamentMatches) {
    let needsUpdate = false
    const updateData = {}

    if (!match.player1TeamId && match.player1Id) {
      const teamId = getPlayerTeamFromClub(match.player1Id, selectedTournament.value)
      if (teamId) {
        updateData.player1TeamId = teamId
        needsUpdate = true
        console.log(`Backfilled player1TeamId for match ${match.id}: ${teamId}`)
      }
    }

    if (!match.player2TeamId && match.player2Id) {
      const teamId = getPlayerTeamFromClub(match.player2Id, selectedTournament.value)
      if (teamId) {
        updateData.player2TeamId = teamId
        needsUpdate = true
        console.log(`Backfilled player2TeamId for match ${match.id}: ${teamId}`)
      }
    }

    if (needsUpdate) {
      try {
        const matchUpdate = {
          ...match,
          ...updateData,
          date: match.date instanceof Date ? match.date : (match.date?.toDate ? match.date.toDate() : new Date(match.date))
        }
        await matchesStore.updateMatch(match.id, matchUpdate)
        console.log(`Updated match ${match.id} with team IDs:`, updateData)
      } catch (error) {
        console.error(`Error updating match ${match.id}:`, error)
      }
    }
  }

  await matchesStore.fetchMatches()
}

const calculateTeamMatches = async () => {
  if (!selectedTournament.value) {
    console.log('No tournament selected')
    return
  }

  // Skip calculation for Simple League tournaments - they use manual team matches
  if (isSimpleLeague.value) {
    console.log('Skipping team match calculation for Simple League')
    return
  }

  if (isCalculating.value) {
    console.log('Already calculating team matches, skipping...')
    return
  }

  isCalculating.value = true
  try {
    await Promise.all([
      teamsStore.fetchTeams(),
      opponentsStore.fetchOpponents()
    ])

    await backfillTeamIds()

    const tournamentMatches = matchesStore.matches.filter(
      m => m.tournamentId === selectedTournament.value && m.round
    )
    
    console.log('Calculating team matches for tournament:', selectedTournament.value, 'Matches:', tournamentMatches.length)
    
    tournamentMatches.forEach(match => {
      console.log(`Match ${match.id}: Round ${match.round}, Player1Team: ${match.player1TeamId}, Player2Team: ${match.player2TeamId}, Scores: ${match.scores?.length || 0} sets`)
    })

    const rounds = {}
    tournamentMatches.forEach(match => {
      const roundKey = String(match.round || '')
      if (!rounds[roundKey]) {
        rounds[roundKey] = []
      }
      rounds[roundKey].push(match)
    })
    
    console.log('Rounds found:', Object.keys(rounds).map(r => `${r}: ${rounds[r].length} matches`))
    console.log('Round details:', Object.entries(rounds).map(([r, m]) => 
      `Round "${r}": ${m.length} matches (${m.map(mm => mm.id).join(', ')})`
    ))

    for (const [round, matches] of Object.entries(rounds)) {
      console.log(`\n=== Processing Round ${round} with ${matches.length} matches ===`)
      
      const teamPairs = {}
      
      matches.forEach(match => {
        const player1TeamId = match.player1TeamId
        const player2TeamId = match.player2TeamId

        if (!player1TeamId || !player2TeamId) {
          console.log(`Match ${match.id} skipped - missing team IDs. Player1Team: ${player1TeamId}, Player2Team: ${player2TeamId}`)
          return
        }

        const pairKey = [player1TeamId, player2TeamId].sort().join('_')
        
        if (!teamPairs[pairKey]) {
          teamPairs[pairKey] = {
            team1Id: player1TeamId,
            team2Id: player2TeamId,
            matches: []
          }
        }
        teamPairs[pairKey].matches.push(match)
      })
      
      console.log(`Round ${round}: Found ${Object.keys(teamPairs).length} unique team pairs`)
      Object.entries(teamPairs).forEach(([key, data]) => {
        console.log(`  Team pair ${key}: ${data.matches.length} matches between Team ${data.team1Id} and Team ${data.team2Id}`)
      })
      
      for (const [pairKey, pairData] of Object.entries(teamPairs)) {
        const { team1Id, team2Id, matches: pairMatches } = pairData
        
        console.log(`\n--- Processing team pair: ${team1Id} vs ${team2Id}, ${pairMatches.length} matches ---`)
        
        if (pairMatches.length < 6) {
          console.log(`✗ Team pair ${team1Id} vs ${team2Id} has only ${pairMatches.length} matches, need 6 - SKIPPING`)
          console.log(`  Match IDs: ${pairMatches.map(m => m.id).join(', ')}`)
          continue
        }
        
        console.log(`✓ Team pair ${team1Id} vs ${team2Id} has ${pairMatches.length} matches - proceeding with calculation`)

        const teamScores = {}
        teamScores[team1Id] = 0
        teamScores[team2Id] = 0
        let matchesWithScores = 0
        let matchesProcessed = 0

        pairMatches.forEach(match => {
          matchesProcessed++
          let player1Sets = 0
          let player2Sets = 0

          if (!match.scores || match.scores.length === 0) {
            console.log(`Match ${match.id} (${matchesProcessed}/${pairMatches.length}) has no scores array - skipping`)
            return
          }

          let hasValidSet = false
          match.scores.forEach(score => {
            const p1Score = score.player1Score || score.myScore || 0
            const p2Score = score.player2Score || score.oppScore || 0
            if (p1Score !== null && p2Score !== null && (p1Score > 0 || p2Score > 0)) {
              hasValidSet = true
              if (p1Score > p2Score) player1Sets++
              else if (p2Score > p1Score) player2Sets++
            }
          })
          
          if (!hasValidSet || (player1Sets === 0 && player2Sets === 0)) {
            console.log(`Match ${match.id} (${matchesProcessed}/${pairMatches.length}) has no valid scores - skipping from calculation`)
            return
          }

          matchesWithScores++
          const matchTeam1Id = match.player1TeamId
          const matchTeam2Id = match.player2TeamId
          
          console.log(`  Match ${match.id}: Player1 (Team ${matchTeam1Id}) won ${player1Sets} sets, Player2 (Team ${matchTeam2Id}) won ${player2Sets} sets`)
          
          if (player1Sets > player2Sets) {
            teamScores[matchTeam1Id]++
            console.log(`    → Team ${matchTeam1Id} wins this match`)
          } else if (player2Sets > player1Sets) {
            teamScores[matchTeam2Id]++
            console.log(`    → Team ${matchTeam2Id} wins this match`)
          } else {
            console.log(`    → Match is a tie (${player1Sets}-${player2Sets} sets) - no team point awarded`)
          }
        })

        const team1Score = teamScores[team1Id] || 0
        const team2Score = teamScores[team2Id] || 0

        console.log(`Round ${round}, Team pair ${team1Id} vs ${team2Id}: Team scores - Team1: ${team1Score}, Team2: ${team2Score}, Total: ${team1Score + team2Score}, Matches with scores: ${matchesWithScores}/${pairMatches.length}`)

        if (pairMatches.length >= 6 && matchesWithScores > 0) {
          // Create/update team match if we have 6 matches, even if not all have scores yet
          // But we need at least some scores to determine a result

          const roundStr = String(round)
          
          // Refresh team matches to get latest before checking for existing
          await teamMatchesStore.fetchTeamMatches()
          
          console.log(`Looking for existing team match: Round="${roundStr}", Tournament=${selectedTournament.value}, Teams=${team1Id} vs ${team2Id}`)
          console.log(`Current team matches in store: ${teamMatchesStore.teamMatches.length} total`)
          
          const existingTeamMatch = teamMatchesStore.teamMatches.find(
            tm => {
              const tmRound = String(tm.round || '')
              const tmTournament = tm.tournamentId
              const isSameRound = tmRound === roundStr
              const isSameTournament = tmTournament === selectedTournament.value
              const isSamePair = (tm.team1Id === team1Id && tm.team2Id === team2Id) ||
                                 (tm.team1Id === team2Id && tm.team2Id === team1Id)
              
              if (isSameTournament && isSameRound && isSamePair) {
                console.log(`  Found existing team match: ${tm.id} (Round: "${tmRound}", Teams: ${tm.team1Id} vs ${tm.team2Id})`)
                return true
              }
              return false
            }
          )
          
          if (!existingTeamMatch) {
            console.log(`  No existing team match found - will create new one`)
          }

          // Get the most recent match date from the pair
          const matchDates = pairMatches
            .filter(m => m.date)
            .map(m => m.date instanceof Date ? m.date : (m.date?.toDate ? m.date.toDate() : new Date(m.date)))
            .sort((a, b) => b - a)
          const matchDate = matchDates[0] || new Date()

          if (existingTeamMatch) {
            await teamMatchesStore.updateTeamMatch(existingTeamMatch.id, {
              team1Id: team1Id,
              team2Id: team2Id,
              team1Score: team1Score,
              team2Score: team2Score,
              date: matchDate,
              round: roundStr,
              photoUrl: existingTeamMatch.photoUrl || null
            })
            console.log(`✓ Updated team match for Round ${roundStr}, ${team1Id} vs ${team2Id}: ${team1Score}-${team2Score}`)
          } else {
            await teamMatchesStore.addTeamMatch({
              tournamentId: selectedTournament.value,
              round: roundStr,
              team1Id: team1Id,
              team2Id: team2Id,
              team1Score: team1Score,
              team2Score: team2Score,
              date: matchDate,
              notes: null,
              photoUrl: null
            })
            console.log(`✓ Created new team match for Round ${roundStr}, ${team1Id} vs ${team2Id}: ${team1Score}-${team2Score}`)
          }
        } else {
          console.log(`✗ Skipping team match for ${team1Id} vs ${team2Id}: ${pairMatches.length} matches, ${matchesWithScores} with scores`)
        }
      }
    }

    await teamMatchesStore.fetchTeamMatches()
    
    // Clean up orphaned team matches (e.g., when matches are moved to different rounds)
    // Skip cleanup for Simple League tournaments - they use manually created team matches
    const tournament = tournamentsStore.tournaments.find(t => t.id === selectedTournament.value)
    if (tournament?.type !== 'Simple League') {
      console.log('\n=== Cleaning up orphaned team matches ===')
      const tournamentTeamMatches = teamMatchesStore.teamMatches.filter(
        tm => tm.tournamentId === selectedTournament.value
      )
      
      for (const teamMatch of tournamentTeamMatches) {
        const teamMatchRound = String(teamMatch.round || '')
        const team1Id = teamMatch.team1Id || teamMatch.myTeamId
        const team2Id = teamMatch.team2Id || teamMatch.opponentTeamId
        
        if (!team1Id || !team2Id) {
          console.log(`Skipping team match ${teamMatch.id} - missing team IDs`)
          continue
        }
        
        // Check if there are still 6 matches for this team pair in this round
        const matchesForThisRoundAndPair = tournamentMatches.filter(m => {
          const matchRound = String(m.round || '')
          const matchTeam1Id = m.player1TeamId
          const matchTeam2Id = m.player2TeamId
          
          const isSameRound = matchRound === teamMatchRound
          const isSamePair = (matchTeam1Id === team1Id && matchTeam2Id === team2Id) ||
                            (matchTeam1Id === team2Id && matchTeam2Id === team1Id)
          
          return isSameRound && isSamePair && matchTeam1Id && matchTeam2Id
        })
        
        if (matchesForThisRoundAndPair.length < 6) {
          console.log(`✗ Deleting orphaned team match ${teamMatch.id}: Round ${teamMatchRound}, Teams ${team1Id} vs ${team2Id} - only ${matchesForThisRoundAndPair.length} matches found (need 6)`)
          try {
            await teamMatchesStore.deleteTeamMatch(teamMatch.id)
            console.log(`  ✓ Deleted team match ${teamMatch.id}`)
          } catch (error) {
            console.error(`  ✗ Error deleting team match ${teamMatch.id}:`, error)
          }
        } else {
          console.log(`✓ Team match ${teamMatch.id} is valid: Round ${teamMatchRound}, Teams ${team1Id} vs ${team2Id} - ${matchesForThisRoundAndPair.length} matches`)
        }
      }
    } else {
      console.log('Skipping cleanup for Simple League tournament')
    }
    
    // Refresh team matches after cleanup
    await teamMatchesStore.fetchTeamMatches()
    
    const finalTeamMatches = teamMatchesStore.teamMatches.filter(
      tm => tm.tournamentId === selectedTournament.value
    )
    
    console.log('=== Team matches calculation complete ===')
    console.log(`Total team matches for tournament: ${finalTeamMatches.length}`)
    finalTeamMatches.forEach(tm => {
      console.log(`  Round ${tm.round}: ${tm.team1Id} vs ${tm.team2Id} - ${tm.team1Score}-${tm.team2Score}`)
    })
  } finally {
    isCalculating.value = false
  }
}

const cleanupInvalidSimpleLeagueTeamMatches = async () => {
  if (!selectedTournament.value) return
  
  const tournament = tournamentsStore.tournaments.find(t => t.id === selectedTournament.value)
  if (tournament?.type !== 'Simple League') return
  
  console.log('Cleaning up invalid Simple League team matches...')
  
  const allTeamMatches = teamMatchesStore.getTeamMatchesByTournament(selectedTournament.value)
  let deletedCount = 0
  
  for (const tm of allTeamMatches) {
    let shouldDelete = false
    
    // Delete if it has the old calculated structure
    if (tm.myTeamId || tm.opponentTeamId) {
      shouldDelete = true
      console.log(`Deleting team match ${tm.id}: has old calculated structure`)
    }
    // Delete if it's missing team IDs
    else if (!tm.team1Id || !tm.team2Id) {
      shouldDelete = true
      console.log(`Deleting team match ${tm.id}: missing team IDs`)
    }
    // Delete if teams don't exist in the tournament
    else {
      const team1 = tournamentTeams.value.find(t => t.id === tm.team1Id)
      const team2 = tournamentTeams.value.find(t => t.id === tm.team2Id)
      if (!team1 || !team2) {
        shouldDelete = true
        console.log(`Deleting team match ${tm.id}: teams don't exist (${tm.team1Id}, ${tm.team2Id})`)
      }
    }
    
    if (shouldDelete) {
      try {
        await teamMatchesStore.deleteTeamMatch(tm.id)
        deletedCount++
      } catch (error) {
        console.error(`Error deleting team match ${tm.id}:`, error)
      }
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} invalid Simple League team matches`)
    await teamMatchesStore.fetchTeamMatches()
  } else {
    console.log('No invalid Simple League team matches found')
  }
}

const refreshTeamMatches = async () => {
  if (isSimpleLeague.value) {
    // For Simple League, refresh team matches and clean up invalid ones
    await teamMatchesStore.fetchTeamMatches()
    await cleanupInvalidSimpleLeagueTeamMatches()
    return
  }
  
  refreshing.value = true
  try {
    await Promise.all([
      matchesStore.fetchMatches(),
      teamsStore.fetchTeams(),
      opponentsStore.fetchOpponents()
    ])
    await backfillTeamIds()
    await calculateTeamMatches()
  } catch (error) {
    console.error('Error refreshing team matches:', error)
  } finally {
    refreshing.value = false
  }
}

const closeCleanupDialog = () => {
  showCleanupDialog.value = false
  cleanupResults.value = null
}

const openScheduleMatchDialog = () => {
  router.push({
    path: '/matches',
    query: {
      tournament: selectedTournament.value,
      scheduled: 'true'
    }
  })
}

const openCreateTournamentDialog = () => {
  router.push('/tournaments')
}

const openMatchForScores = (match) => {
  router.push({
    path: '/matches',
    query: {
      edit: match.id
    }
  })
}

const cleanupDuplicates = async () => {
  if (!selectedTournament.value) {
    cleanupResults.value = {
      type: 'error',
      message: 'No tournament selected'
    }
    return
  }

  cleaningUp.value = true
  cleanupResults.value = null

  try {
    await teamMatchesStore.fetchTeamMatches()
    
    const tournamentMatches = teamMatchesStore.teamMatches.filter(
      tm => tm.tournamentId === selectedTournament.value
    )

    console.log(`Found ${tournamentMatches.length} team matches for tournament ${selectedTournament.value}`)

    const duplicateGroups = {}
    
    tournamentMatches.forEach(tm => {
      const team1Id = tm.team1Id || tm.myTeamId
      const team2Id = tm.team2Id || tm.opponentTeamId
      const round = String(tm.round || '')
      
      const teamPairKey = [team1Id, team2Id].sort().join('_')
      const duplicateKey = `${selectedTournament.value}_${round}_${teamPairKey}`
      
      if (!duplicateGroups[duplicateKey]) {
        duplicateGroups[duplicateKey] = []
      }
      duplicateGroups[duplicateKey].push(tm)
    })

    const duplicatesToDelete = []
    
    Object.entries(duplicateGroups).forEach(([key, matches]) => {
      if (matches.length > 1) {
        console.log(`Found ${matches.length} duplicates for key: ${key}`)
        
        matches.sort((a, b) => {
          if (a.photoUrl && !b.photoUrl) return -1
          if (!a.photoUrl && b.photoUrl) return 1
          
          const aCreated = a.createdAt?.toDate?.() || new Date(0)
          const bCreated = b.createdAt?.toDate?.() || new Date(0)
          return bCreated - aCreated
        })
        
        const toKeep = matches[0]
        const toDelete = matches.slice(1)
        
        console.log(`Keeping match ${toKeep.id}, deleting ${toDelete.length} duplicates`)
        duplicatesToDelete.push(...toDelete)
      }
    })

    if (duplicatesToDelete.length === 0) {
      cleanupResults.value = {
        type: 'success',
        message: 'No duplicates found! Your team matches are clean.'
      }
    } else {
      for (const match of duplicatesToDelete) {
        console.log(`Deleting duplicate team match: ${match.id}`)
        await teamMatchesStore.deleteTeamMatch(match.id)
      }
      
      cleanupResults.value = {
        type: 'success',
        message: `Successfully removed ${duplicatesToDelete.length} duplicate team match${duplicatesToDelete.length > 1 ? 'es' : ''}!`
      }
      
      await teamMatchesStore.fetchTeamMatches()
    }
  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    cleanupResults.value = {
      type: 'error',
      message: `Error cleaning up duplicates: ${error.message}`
    }
  } finally {
    cleaningUp.value = false
  }
}
</script>

<style scoped>
.standings-table-wrapper {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  position: relative;
  isolation: isolate;
}

.standings-table {
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  position: relative;
}

.standings-table tbody tr {
  position: relative;
  z-index: 1;
}

.standings-table th.scrollable-col,
.standings-table td.scrollable-col {
  position: relative;
  z-index: 1;
  background-color: inherit;
}

.standings-table th.fixed-col-1,
.standings-table td.fixed-col-1 {
  position: sticky;
  left: 0;
  z-index: 100;
  background-color: white !important;
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  isolation: isolate;
  padding-left: 8px !important;
  padding-right: 4px !important;
  overflow: hidden;
  box-sizing: border-box;
}

.standings-table th.fixed-col-1,
.standings-table td.fixed-col-1 > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  width: 100%;
}

.standings-table th.fixed-col-2,
.standings-table td.fixed-col-2 {
  position: sticky;
  left: 50px;
  z-index: 101;
  background-color: white !important;
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  isolation: isolate;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.standings-table th.fixed-col-1 {
  z-index: 100;
  background-color: white !important;
}

.standings-table th.fixed-col-2 {
  z-index: 101;
  background-color: white !important;
}

.standings-table tr.promoted td.fixed-col-1 {
  z-index: 100 !important;
}

.standings-table tr.promoted td.fixed-col-2 {
  z-index: 101 !important;
}

.standings-table tr.playoff td.fixed-col-1,
.standings-table tr.playout td.fixed-col-1 {
  z-index: 100 !important;
}

.standings-table tr.playoff td.fixed-col-2,
.standings-table tr.playout td.fixed-col-2 {
  z-index: 101 !important;
}

.standings-table tr.demoted td.fixed-col-1 {
  z-index: 100 !important;
}

.standings-table tr.demoted td.fixed-col-2 {
  z-index: 101 !important;
}

.standings-table tr.bg-primary-lighten-4 td.fixed-col-1 {
  z-index: 100 !important;
}

.standings-table tr.bg-primary-lighten-4 td.fixed-col-2 {
  z-index: 101 !important;
}

.position-number-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
  background-color: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.87);
}

.position-number-circle.text-success {
  background-color: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.position-number-circle.text-error {
  background-color: rgba(244, 67, 54, 0.2);
  color: #F44336;
}

.position-number-circle.text-warning {
  background-color: rgba(255, 193, 7, 0.2);
  color: #FFC107;
}

.match-row-hover:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

@media (min-width: 960px) {
  .standings-table-wrapper {
    overflow-x: visible;
  }
  
  .standings-table th.fixed-col-1,
  .standings-table td.fixed-col-1,
  .standings-table th.fixed-col-2,
  .standings-table td.fixed-col-2 {
    position: static;
  }
}

.last-five-matches {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.match-result {
  display: inline-block;
  min-width: 20px;
  text-align: center;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 2px 4px;
  border-radius: 4px;
}

.match-result.win {
  background-color: #4CAF50;
  color: white;
}

.match-result.loss {
  background-color: #F44336;
  color: white;
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


