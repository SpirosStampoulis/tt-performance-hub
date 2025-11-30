<template>
  <v-container v-if="match">
    <v-row>
      <v-col>
        <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="$router.back()">
          Back to Matches
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="mb-4 match-header-card">
          <v-card-title class="match-header-title">
            <div class="d-flex align-center flex-wrap gap-2">
              <v-chip v-if="getTournamentName" size="small" variant="outlined">
                <v-icon start size="small">mdi-tournament</v-icon>
                {{ getTournamentName }}
              </v-chip>
              <v-chip v-if="match.round" size="small" variant="outlined">
                Round {{ match.round }}
              </v-chip>
            </div>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="match-players-section">
              <div class="text-h4 font-weight-bold mb-2">
                <a 
                  v-if="match.player1Id || match.opponentId"
                  @click="$router.push(`/opponents/${match.player1Id || match.opponentId}`)"
                  style="cursor: pointer; text-decoration: none; color: inherit;"
                  class="player-link"
                >
                  {{ getPlayer1Name }}
                </a>
                <span v-else>{{ getPlayer1Name }}</span>
                <span class="mx-2">vs</span>
                <a 
                  v-if="match.player2Id"
                  @click="$router.push(`/opponents/${match.player2Id}`)"
                  style="cursor: pointer; text-decoration: none; color: inherit;"
                  class="player-link"
                >
                  {{ getPlayer2Name }}
                </a>
                <span v-else>{{ getPlayer2Name }}</span>
              </div>
              <div v-if="match.player1TeamId || match.player2TeamId" class="mb-3">
                <v-chip size="small" class="mr-1">
                  <v-icon start size="small">mdi-shield-account</v-icon>
                  {{ getTeamName(match.player1TeamId) }}
                </v-chip>
                <span class="mx-2">vs</span>
                <v-chip size="small" class="ml-1">
                  <v-icon start size="small">mdi-shield-account</v-icon>
                  {{ getTeamName(match.player2TeamId) }}
                </v-chip>
              </div>
              <div class="match-score-display">
                <div class="text-h3 font-weight-bold text-primary">{{ getSetsScore }}</div>
                <div class="text-subtitle-1 text-medium-emphasis mt-2">
                  <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
                  {{ formatDate(match.date) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>Set Breakdown</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Set</th>
                  <th>{{ getPlayer1Name }}</th>
                  <th>{{ getPlayer2Name }}</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(score, index) in match.scores" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ score.player1Score || score.myScore || 0 }}</td>
                  <td>{{ score.player2Score || score.oppScore || 0 }}</td>
                  <td>
                    <v-chip :color="(score.player1Score || score.myScore || 0) > (score.player2Score || score.oppScore || 0) ? 'success' : 'error'" size="small">
                      {{ (score.player1Score || score.myScore || 0) > (score.player2Score || score.oppScore || 0) ? getPlayer1Name : getPlayer2Name }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card v-if="match.serveStats" class="mb-4">
          <v-card-title>Serve & Return Statistics</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="text-h6">{{ match.serveStats.successRate || 0 }}%</div>
                <div class="text-caption">Serve Success Rate</div>
              </v-col>
              <v-col cols="6">
                <div class="text-h6">{{ match.serveStats.returnPoints || 0 }}</div>
                <div class="text-caption">Return Points Won</div>
              </v-col>
            </v-row>
            <v-btn size="small" prepend-icon="mdi-pencil" class="mt-2" @click="editServeStats = true">
              Edit Stats
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card v-if="match.notes" class="mb-4">
          <v-card-title>Match Notes</v-card-title>
          <v-card-text>
            <p style="white-space: pre-wrap">{{ match.notes }}</p>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>
            Videos
            <v-spacer></v-spacer>
            <v-btn prepend-icon="mdi-video-plus" size="small" @click="showVideoDialog = true">
              Add Video
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-row v-if="match.videoUrls && match.videoUrls.length > 0">
              <v-col v-for="(video, index) in match.videoUrls" :key="index" cols="12" md="6">
                <div class="video-container">
                  <iframe
                    :src="getYouTubeEmbedUrl(video)"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                </div>
                <v-btn block size="small" prepend-icon="mdi-delete" class="mt-2" @click="deleteVideo(index)">
                  Remove Video
                </v-btn>
              </v-col>
            </v-row>
            <div v-else class="text-center text-medium-emphasis py-4">
              No videos added yet
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showVideoDialog" max-width="500">
      <v-card>
        <v-card-title>Add Video URL</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newVideoUrl"
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showVideoDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="addVideo">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editServeStats" max-width="500">
      <v-card>
        <v-card-title>Edit Serve & Return Stats</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="serveStatsForm.successRate"
            label="Serve Success Rate (%)"
            type="number"
            variant="outlined"
          ></v-text-field>
          <v-text-field
            v-model.number="serveStatsForm.returnPoints"
            label="Return Points Won"
            type="number"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editServeStats = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveServeStats">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

const match = ref(null)
const showVideoDialog = ref(false)
const editServeStats = ref(false)
const newVideoUrl = ref('')

const serveStatsForm = ref({
  successRate: 0,
  returnPoints: 0
})

onMounted(async () => {
  await Promise.all([
    opponentsStore.fetchOpponents(),
    tournamentsStore.fetchTournaments(),
    teamsStore.fetchTeams()
  ])
  match.value = await matchesStore.getMatch(route.params.id)
  if (match.value?.serveStats) {
    serveStatsForm.value = { ...match.value.serveStats }
  }
})

const getTeamName = (teamId) => {
  if (!teamId) return ''
  const team = teamsStore.teams.find(t => t.id === teamId)
  return team ? team.name : ''
}

const getMatchResult = computed(() => {
  if (!match.value) return ''
  const player1Total = match.value.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
  const player2Total = match.value.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
  return player1Total > player2Total ? 'Player 1 Win' : 'Player 2 Win'
})

const getSetsScore = computed(() => {
  if (!match.value || !match.value.scores) return '0-0'
  let player1Sets = 0
  let player2Sets = 0
  
  match.value.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score > p2Score) {
      player1Sets++
    } else if (p2Score > p1Score) {
      player2Sets++
    }
  })
  
  return `${player1Sets}-${player2Sets}`
})

const getPlayer1Name = computed(() => {
  if (!match.value) return ''
  const player = opponentsStore.opponents.find(o => o.id === (match.value.player1Id || match.value.opponentId))
  return player ? player.name : 'Unknown'
})

const getPlayer2Name = computed(() => {
  if (!match.value) return ''
  const player = opponentsStore.opponents.find(o => o.id === match.value.player2Id)
  return player ? player.name : 'Unknown'
})

const getTournamentName = computed(() => {
  if (!match.value) return ''
  const tournament = tournamentsStore.tournaments.find(t => t.id === match.value.tournamentId)
  return tournament ? tournament.name : null
})

const headToHead = computed(() => {
  return { wins: 0, losses: 0, total: 0, winRate: 0 }
})

const addVideo = async () => {
  if (!newVideoUrl.value) return
  
  const updatedVideos = [...(match.value.videoUrls || []), newVideoUrl.value]
  
  await matchesStore.updateMatch(match.value.id, {
    ...match.value,
    videoUrls: updatedVideos
  })
  
  match.value = await matchesStore.getMatch(match.value.id)
  showVideoDialog.value = false
  newVideoUrl.value = ''
}

const deleteVideo = async (index) => {
  const updatedVideos = [...match.value.videoUrls]
  updatedVideos.splice(index, 1)
  
  await matchesStore.updateMatch(match.value.id, {
    ...match.value,
    videoUrls: updatedVideos
  })
  
  match.value = await matchesStore.getMatch(match.value.id)
}

const saveServeStats = async () => {
  await matchesStore.updateMatch(match.value.id, {
    ...match.value,
    serveStats: serveStatsForm.value
  })
  
  match.value = await matchesStore.getMatch(match.value.id)
  editServeStats.value = false
}

</script>

<style scoped>
.player-link {
  transition: color 0.2s ease;
}

.player-link:hover {
  color: #DC143C;
  text-decoration: underline;
}
.match-header-card {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.05) 0%, rgba(255, 215, 0, 0.05) 100%);
  border: 2px solid rgba(220, 20, 60, 0.2);
}

.match-header-title {
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%);
}

.match-players-section {
  padding: 8px 0;
}

.match-score-display {
  text-align: center;
  padding: 16px 0;
  margin-top: 16px;
  border-top: 2px solid rgba(220, 20, 60, 0.2);
}

.video-container {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>

