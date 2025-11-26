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
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title>
            {{ getMatchResult }}
          </v-card-title>
          <v-card-text>
            <div class="text-h4 mb-2">{{ getPlayer1Name }} vs {{ getPlayer2Name }}</div>
            <div class="text-h5 mb-4">{{ getScoreSummary }}</div>
            <v-chip v-if="getTournamentName" class="mr-2">
              <v-icon start>mdi-tournament</v-icon>
              {{ getTournamentName }}
            </v-chip>
            <v-chip v-if="match.round" class="mr-2">
              {{ match.round }}
            </v-chip>
            <div v-if="match.player1TeamId || match.player2TeamId" class="mt-2">
              <v-chip size="small" class="mr-1">
                <v-icon start size="small">mdi-shield-account</v-icon>
                {{ getTeamName(match.player1TeamId) }}
              </v-chip>
              vs
              <v-chip size="small" class="ml-1">
                <v-icon start size="small">mdi-shield-account</v-icon>
                {{ getTeamName(match.player2TeamId) }}
              </v-chip>
            </div>
            <div class="text-subtitle-1 mt-4">{{ formatDate(match.date) }}</div>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>Set Breakdown</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Set</th>
                  <th>Player 1</th>
                  <th>Player 2</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="score in match.scores" :key="score.set">
                  <td>{{ score.set }}</td>
                  <td>{{ score.player1Score || score.myScore || 0 }}</td>
                  <td>{{ score.player2Score || score.oppScore || 0 }}</td>
                  <td>
                    <v-chip :color="(score.player1Score || score.myScore || 0) > (score.player2Score || score.oppScore || 0) ? 'success' : 'error'" size="small">
                      {{ (score.player1Score || score.myScore || 0) > (score.player2Score || score.oppScore || 0) ? 'Player 1' : 'Player 2' }}
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

        <v-card class="mb-4">
          <v-card-title>
            Photos
            <v-spacer></v-spacer>
            <v-btn prepend-icon="mdi-camera" size="small" @click="$refs.photoInput.click()">
              Add Photos
            </v-btn>
            <input
              ref="photoInput"
              type="file"
              accept="image/*"
              multiple
              style="display: none"
              @change="handlePhotoUpload"
            />
          </v-card-title>
          <v-card-text>
            <v-row v-if="match.photos && match.photos.length > 0">
              <v-col v-for="(photo, index) in match.photos" :key="index" cols="6" md="4">
                <v-card>
                  <v-img :src="photo" aspect-ratio="1" cover @click="openGallery(index)"></v-img>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-delete" size="small" @click="deletePhoto(index)"></v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <div v-else class="text-center text-medium-emphasis py-4">
              No photos added yet
            </div>
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

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Players</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Player 1</v-list-item-title>
                <v-list-item-subtitle>{{ getPlayer1Name }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Player 2</v-list-item-title>
                <v-list-item-subtitle>{{ getPlayer2Name }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
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

    <v-dialog v-model="galleryDialog" fullscreen>
      <v-card>
        <v-toolbar>
          <v-btn icon="mdi-close" @click="galleryDialog = false"></v-btn>
          <v-toolbar-title>Photo Gallery</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="d-flex align-center justify-center" style="height: 100%">
          <v-img v-if="match.photos && match.photos[galleryIndex]" :src="match.photos[galleryIndex]" contain max-height="90vh"></v-img>
        </v-card-text>
        <v-card-actions>
          <v-btn icon="mdi-chevron-left" @click="prevPhoto" :disabled="galleryIndex === 0"></v-btn>
          <v-spacer></v-spacer>
          <div>{{ galleryIndex + 1 }} / {{ match.photos?.length || 0 }}</div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-chevron-right" @click="nextPhoto" :disabled="galleryIndex === (match.photos?.length || 0) - 1"></v-btn>
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
import { uploadMultipleImages, getYouTubeEmbedUrl } from '../utils/storage'

const route = useRoute()
const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()
const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()

const match = ref(null)
const showVideoDialog = ref(false)
const editServeStats = ref(false)
const galleryDialog = ref(false)
const galleryIndex = ref(0)
const newVideoUrl = ref('')
const uploading = ref(false)

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

const getScoreSummary = computed(() => {
  if (!match.value) return ''
  const player1Total = match.value.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
  const player2Total = match.value.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
  return `${player1Total}-${player2Total}`
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

const handlePhotoUpload = async (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  uploading.value = true
  try {
    const urls = await uploadMultipleImages(files, `matches/${match.value.id}`)
    const updatedPhotos = [...(match.value.photos || []), ...urls]
    
    await matchesStore.updateMatch(match.value.id, {
      ...match.value,
      photos: updatedPhotos
    })
    
    match.value = await matchesStore.getMatch(match.value.id)
  } catch (error) {
    console.error('Error uploading photos:', error)
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

const deletePhoto = async (index) => {
  const updatedPhotos = [...match.value.photos]
  updatedPhotos.splice(index, 1)
  
  await matchesStore.updateMatch(match.value.id, {
    ...match.value,
    photos: updatedPhotos
  })
  
  match.value = await matchesStore.getMatch(match.value.id)
}

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

const openGallery = (index) => {
  galleryIndex.value = index
  galleryDialog.value = true
}

const nextPhoto = () => {
  if (galleryIndex.value < match.value.photos.length - 1) {
    galleryIndex.value++
  }
}

const prevPhoto = () => {
  if (galleryIndex.value > 0) {
    galleryIndex.value--
  }
}
</script>

<style scoped>
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

