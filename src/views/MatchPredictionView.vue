<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4 font-weight-bold mb-2">Match Prediction</h1>
        <p class="text-body-1 text-medium-emphasis">
          Compare two players based on their performance against common opponents in the current season league tournament and MTTA rankings
        </p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card elevation="3" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account</v-icon>
            Player 1
          </v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="selectedPlayer1"
              :items="opponentsList"
              item-title="name"
              item-value="id"
              label="Select Player 1"
              variant="outlined"
              return-object
              clearable
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon>mdi-account-circle</v-icon>
                  </template>
                  <v-list-item-subtitle v-if="item.raw.mttaRank">
                    MTTA Rank: #{{ item.raw.mttaRank }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>
            <div v-if="selectedPlayer1" class="mt-3">
              <v-chip v-if="selectedPlayer1.mttaRank" color="primary" variant="flat" class="mr-2">
                MTTA Rank: #{{ selectedPlayer1.mttaRank }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card elevation="3" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account</v-icon>
            Player 2
          </v-card-title>
          <v-card-text>
            <v-autocomplete
              v-model="selectedPlayer2"
              :items="opponentsList"
              item-title="name"
              item-value="id"
              label="Select Player 2"
              variant="outlined"
              return-object
              clearable
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon>mdi-account-circle</v-icon>
                  </template>
                  <v-list-item-subtitle v-if="item.raw.mttaRank">
                    MTTA Rank: #{{ item.raw.mttaRank }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-autocomplete>
            <div v-if="selectedPlayer2" class="mt-3">
              <v-chip v-if="selectedPlayer2.mttaRank" color="primary" variant="flat" class="mr-2">
                MTTA Rank: #{{ selectedPlayer2.mttaRank }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="prediction && selectedPlayer1 && selectedPlayer2">
      <v-col cols="12">
        <v-card elevation="3">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
              Prediction Result
            </div>
            <div class="d-flex align-center gap-2">
              <v-chip 
                :color="getConfidenceColor(prediction.confidence)" 
                variant="flat"
                class="mr-2"
              >
                {{ prediction.confidence.toUpperCase() }} Confidence
              </v-chip>
              <v-btn
                color="primary"
                prepend-icon="mdi-content-save"
                @click="savePrediction"
                :disabled="saving"
              >
                Save Prediction
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold mb-2" :style="{ color: getWinProbabilityColor(prediction.winProbability) }">
                    {{ prediction.winProbability }}%
                  </div>
                  <div class="text-body-1 text-medium-emphasis mb-4">
                    Win Probability for {{ selectedPlayer1.name }}
                  </div>
                  <v-progress-linear
                    :model-value="prediction.winProbability"
                    :color="getWinProbabilityColor(prediction.winProbability)"
                    height="20"
                    rounded
                    class="mb-2"
                  ></v-progress-linear>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ 100 - prediction.winProbability }}% for {{ selectedPlayer2.name }}
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="8">
                <v-alert
                  :color="getRecommendationColor(prediction.winProbability)"
                  variant="tonal"
                  class="mb-4"
                >
                  <div class="text-h6 mb-2">Recommendation</div>
                  <div>{{ prediction.recommendation }}</div>
                </v-alert>

                <div class="mb-4">
                  <div class="text-h6 mb-2">Analysis Factors</div>
                  <v-list density="compact">
                    <v-list-item
                      v-for="(factor, index) in prediction.factors"
                      :key="index"
                      class="px-0"
                    >
                      <template v-slot:prepend>
                        <v-icon size="small" color="primary">mdi-check-circle</v-icon>
                      </template>
                      <v-list-item-title class="text-body-2">{{ factor }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </div>

                <v-divider class="my-4"></v-divider>

                <div v-if="prediction.headToHead && prediction.headToHead.total > 0" class="mb-4">
                  <div class="text-h6 mb-2">Head-to-Head Record</div>
                  <v-card variant="outlined" class="pa-3">
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="text-body-1 font-weight-bold">{{ selectedPlayer1.name }}</div>
                        <div class="text-h5">{{ prediction.headToHead.player1Wins }} wins</div>
                      </div>
                      <div class="text-h4 text-medium-emphasis">vs</div>
                      <div class="text-right">
                        <div class="text-body-1 font-weight-bold">{{ selectedPlayer2.name }}</div>
                        <div class="text-h5">{{ prediction.headToHead.player2Wins }} wins</div>
                      </div>
                    </div>
                    <div class="text-center mt-2 text-body-2 text-medium-emphasis">
                      Total: {{ prediction.headToHead.total }} matches
                    </div>
                  </v-card>
                </div>

                <div v-if="prediction.mttaComparison" class="mb-4">
                  <div class="text-h6 mb-2">MTTA Ranking Comparison</div>
                  <v-card variant="outlined" class="pa-3">
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="text-body-1 font-weight-bold">{{ selectedPlayer1.name }}</div>
                        <div class="text-h5">Rank #{{ prediction.mttaComparison.player1Rank }}</div>
                      </div>
                      <div class="text-h4 text-medium-emphasis">vs</div>
                      <div class="text-right">
                        <div class="text-body-1 font-weight-bold">{{ selectedPlayer2.name }}</div>
                        <div class="text-h5">Rank #{{ prediction.mttaComparison.player2Rank }}</div>
                      </div>
                    </div>
                    <div class="text-center mt-2">
                      <v-chip 
                        :color="prediction.mttaComparison.advantage === 'player1' ? 'success' : prediction.mttaComparison.advantage === 'player2' ? 'error' : 'info'"
                        variant="flat"
                      >
                        {{ prediction.mttaComparison.advantage === 'player1' ? selectedPlayer1.name : prediction.mttaComparison.advantage === 'player2' ? selectedPlayer2.name : 'Even' }} 
                        {{ prediction.mttaComparison.rankDifference !== 0 ? `(${Math.abs(prediction.mttaComparison.rankDifference)} position${Math.abs(prediction.mttaComparison.rankDifference) !== 1 ? 's' : ''} ${prediction.mttaComparison.rankDifference < 0 ? 'higher' : 'lower'})` : '' }}
                      </v-chip>
                    </div>
                  </v-card>
                </div>

                <div v-if="prediction.commonOpponents && prediction.commonOpponents.length > 0" class="mb-4">
                  <div class="text-h6 mb-2">
                    Common Opponents ({{ prediction.commonOpponents.length }})
                  </div>
                  <v-card variant="outlined">
                    <v-expansion-panels variant="accordion">
                      <v-expansion-panel
                        v-for="(opponent, index) in prediction.commonOpponents"
                        :key="index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center justify-space-between w-100 pr-4">
                            <div class="d-flex align-center">
                              <v-icon size="small" color="primary" class="mr-2">mdi-account-multiple</v-icon>
                              <div>
                                <div class="text-body-1 font-weight-bold">{{ getPlayerName(opponent.opponentId) }}</div>
                                <div class="text-caption text-medium-emphasis">
                                  <span class="font-weight-medium">{{ selectedPlayer1.name }}:</span> 
                                  {{ opponent.player1Wins }}W-{{ opponent.player1Losses }}L 
                                  <span v-if="opponent.player1Matches && opponent.player1Matches.length > 0">
                                    ({{ opponent.player1WinRate.toFixed(1) }}%)
                                  </span>
                                  <span v-else class="text-grey">(no matches)</span>
                                  <span class="mx-1">|</span>
                                  <span class="font-weight-medium">{{ selectedPlayer2.name }}:</span> 
                                  {{ opponent.player2Wins }}W-{{ opponent.player2Losses }}L
                                  <span v-if="opponent.player2Matches && opponent.player2Matches.length > 0">
                                    ({{ opponent.player2WinRate.toFixed(1) }}%)
                                  </span>
                                  <span v-else class="text-grey">(no matches)</span>
                                </div>
                              </div>
                            </div>
                            <v-chip 
                              size="small"
                              :color="opponent.advantage > 0 ? 'success' : opponent.advantage < 0 ? 'error' : 'info'"
                              variant="flat"
                            >
                              {{ opponent.advantage > 0 ? selectedPlayer1.name : opponent.advantage < 0 ? selectedPlayer2.name : 'Even' }} 
                              +{{ Math.abs(opponent.advantage).toFixed(1) }}%
                            </v-chip>
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <v-row>
                            <v-col cols="12" md="6">
                              <div class="text-subtitle-2 font-weight-bold mb-2">
                                {{ selectedPlayer1.name }} vs {{ getPlayerName(opponent.opponentId) }}
                              </div>
                              <div v-if="opponent.player1Matches && opponent.player1Matches.length > 0">
                                <div
                                  v-for="(match, matchIndex) in opponent.player1Matches"
                                  :key="matchIndex"
                                  class="mb-2 pa-2 bg-grey-lighten-4 rounded"
                                >
                                  <div class="d-flex align-center justify-space-between">
                                    <div class="d-flex align-center">
                                      <v-chip
                                        :color="match.result === 'W' ? 'success' : match.result === 'L' ? 'error' : 'grey'"
                                        size="small"
                                        variant="flat"
                                        class="mr-2"
                                      >
                                        {{ match.result }}
                                      </v-chip>
                                      <span class="text-body-2 font-weight-bold">{{ match.setScore }}</span>
                                    </div>
                                    <span class="text-caption text-medium-emphasis">{{ match.detailedScores }}</span>
                                  </div>
                                </div>
                              </div>
                              <div v-else class="text-caption text-medium-emphasis">
                                No matches recorded
                              </div>
                            </v-col>
                            <v-col cols="12" md="6">
                              <div class="text-subtitle-2 font-weight-bold mb-2">
                                {{ selectedPlayer2.name }} vs {{ getPlayerName(opponent.opponentId) }}
                              </div>
                              <div v-if="opponent.player2Matches && opponent.player2Matches.length > 0">
                                <div
                                  v-for="(match, matchIndex) in opponent.player2Matches"
                                  :key="matchIndex"
                                  class="mb-2 pa-2 bg-grey-lighten-4 rounded"
                                >
                                  <div class="d-flex align-center justify-space-between">
                                    <div class="d-flex align-center">
                                      <v-chip
                                        :color="match.result === 'W' ? 'success' : match.result === 'L' ? 'error' : 'grey'"
                                        size="small"
                                        variant="flat"
                                        class="mr-2"
                                      >
                                        {{ match.result }}
                                      </v-chip>
                                      <span class="text-body-2 font-weight-bold">{{ match.setScore }}</span>
                                    </div>
                                    <span class="text-caption text-medium-emphasis">{{ match.detailedScores }}</span>
                                  </div>
                                </div>
                              </div>
                              <div v-else class="text-caption text-medium-emphasis">
                                No matches recorded
                              </div>
                            </v-col>
                          </v-row>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card>
                </div>
                <div v-else class="mb-4">
                  <v-alert type="info" variant="tonal">
                    No common opponents found in the current season league tournament. 
                    Prediction is based on head-to-head record and MTTA rankings only.
                  </v-alert>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else-if="selectedPlayer1 && selectedPlayer2">
      <v-col cols="12">
        <v-alert type="info" variant="tonal">
          Calculating prediction...
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="savedPredictions.length > 0" class="mt-6">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold mb-4">Saved Predictions</h2>
        <v-row>
          <v-col
            v-for="saved in savedPredictions"
            :key="saved.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card elevation="3" class="saved-prediction-card">
              <v-card-title class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
                  <div>
                    <div class="text-body-1 font-weight-bold">{{ saved.player1Name }} vs {{ saved.player2Name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDate(saved.createdAt) }}
                    </div>
                  </div>
                </div>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(saved)"
                ></v-btn>
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <div class="text-center mb-3">
                  <div class="text-h4 font-weight-bold mb-1" :style="{ color: getWinProbabilityColor(saved.winProbability) }">
                    {{ saved.winProbability }}%
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Win probability for {{ saved.player1Name }}
                  </div>
                  <v-chip 
                    size="small"
                    :color="getConfidenceColor(saved.confidence)" 
                    variant="flat"
                    class="mt-2"
                  >
                    {{ saved.confidence.toUpperCase() }} Confidence
                  </v-chip>
                </div>
                <v-divider class="my-3"></v-divider>
                <div class="text-body-2 mb-2">
                  <strong>Recommendation:</strong> {{ saved.recommendation }}
                </div>
                <div v-if="saved.mttaComparison" class="text-caption text-medium-emphasis mb-2">
                  MTTA: {{ saved.player1Name }} #{{ saved.mttaComparison.player1Rank }} vs {{ saved.player2Name }} #{{ saved.mttaComparison.player2Rank }}
                </div>
                <div v-if="saved.headToHead && saved.headToHead.total > 0" class="text-caption text-medium-emphasis">
                  H2H: {{ saved.headToHead.player1Wins }}-{{ saved.headToHead.player2Wins }}
                </div>
                <div v-if="saved.commonOpponentsCount > 0" class="text-caption text-medium-emphasis">
                  {{ saved.commonOpponentsCount }} common opponent(s)
                </div>
                <v-btn
                  block
                  variant="outlined"
                  color="primary"
                  class="mt-3"
                  @click="loadSavedPrediction(saved)"
                >
                  View Details
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-dialog v-model="viewDialog" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <div class="text-h6">{{ viewingPrediction?.player1Name }} vs {{ viewingPrediction?.player2Name }}</div>
            <div class="text-caption text-medium-emphasis">
              Saved on {{ viewingPrediction ? formatDate(viewingPrediction.createdAt) : '' }}
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="viewDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text v-if="viewingPrediction">
          <v-row>
            <v-col cols="12" md="4">
              <div class="text-center">
                <div class="text-h3 font-weight-bold mb-2" :style="{ color: getWinProbabilityColor(viewingPrediction.winProbability) }">
                  {{ viewingPrediction.winProbability }}%
                </div>
                <div class="text-body-1 text-medium-emphasis mb-4">
                  Win Probability for {{ viewingPrediction.player1Name }}
                </div>
                <v-chip 
                  :color="getConfidenceColor(viewingPrediction.confidence)" 
                  variant="flat"
                >
                  {{ viewingPrediction.confidence.toUpperCase() }} Confidence
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="8">
              <v-alert
                :color="getRecommendationColor(viewingPrediction.winProbability)"
                variant="tonal"
                class="mb-4"
              >
                <div class="text-h6 mb-2">Recommendation</div>
                <div>{{ viewingPrediction.recommendation }}</div>
              </v-alert>
              <div class="mb-4">
                <div class="text-h6 mb-2">Analysis Factors</div>
                <v-list density="compact">
                  <v-list-item
                    v-for="(factor, index) in viewingPrediction.factors"
                    :key="index"
                    class="px-0"
                  >
                    <template v-slot:prepend>
                      <v-icon size="small" color="primary">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ factor }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
              <div v-if="viewingPrediction.headToHead && viewingPrediction.headToHead.total > 0" class="mb-4">
                <div class="text-h6 mb-2">Head-to-Head Record</div>
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-body-1 font-weight-bold">{{ viewingPrediction.player1Name }}</div>
                      <div class="text-h5">{{ viewingPrediction.headToHead.player1Wins }} wins</div>
                    </div>
                    <div class="text-h4 text-medium-emphasis">vs</div>
                    <div class="text-right">
                      <div class="text-body-1 font-weight-bold">{{ viewingPrediction.player2Name }}</div>
                      <div class="text-h5">{{ viewingPrediction.headToHead.player2Wins }} wins</div>
                    </div>
                  </div>
                  <div class="text-center mt-2 text-body-2 text-medium-emphasis">
                    Total: {{ viewingPrediction.headToHead.total }} matches
                  </div>
                </v-card>
              </div>
              <div v-if="viewingPrediction.mttaComparison" class="mb-4">
                <div class="text-h6 mb-2">MTTA Ranking Comparison</div>
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-body-1 font-weight-bold">{{ viewingPrediction.player1Name }}</div>
                      <div class="text-h5">Rank #{{ viewingPrediction.mttaComparison.player1Rank }}</div>
                    </div>
                    <div class="text-h4 text-medium-emphasis">vs</div>
                    <div class="text-right">
                      <div class="text-body-1 font-weight-bold">{{ viewingPrediction.player2Name }}</div>
                      <div class="text-h5">Rank #{{ viewingPrediction.mttaComparison.player2Rank }}</div>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="viewDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Prediction</v-card-title>
        <v-card-text>Are you sure you want to delete this saved prediction?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deletePrediction">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMatchesStore } from '../stores/matches'
import { useOpponentsStore } from '../stores/opponents'
import { useTournamentsStore } from '../stores/tournaments'
import { usePredictionsStore } from '../stores/predictions'
import { formatDate } from '../utils/date'

const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()
const tournamentsStore = useTournamentsStore()
const predictionsStore = usePredictionsStore()

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    opponentsStore.fetchOpponents(),
    tournamentsStore.fetchTournaments(),
    predictionsStore.fetchPredictions()
  ])
})

const selectedPlayer1 = ref(null)
const selectedPlayer2 = ref(null)
const prediction = ref(null)
const saving = ref(false)
const viewDialog = ref(false)
const deleteDialog = ref(false)
const viewingPrediction = ref(null)
const predictionToDelete = ref(null)

const savedPredictions = computed(() => predictionsStore.savedPredictions)

const opponentsList = computed(() => {
  return opponentsStore.opponents.map(o => ({
    id: o.id,
    name: o.name,
    mttaRank: o.mttaRank || o.mttaData?.rank
  }))
})

watch([selectedPlayer1, selectedPlayer2], ([player1, player2]) => {
  if (player1 && player2 && player1.id && player2.id) {
    prediction.value = matchesStore.predictMatchBetweenPlayers(player1.id, player2.id)
  } else {
    prediction.value = null
  }
}, { deep: true })

const getPlayerName = (playerId) => {
  const player = opponentsStore.opponents.find(o => o.id === playerId)
  return player ? player.name : 'Unknown Player'
}

const getWinProbabilityColor = (probability) => {
  if (probability >= 70) return '#4CAF50'
  if (probability >= 60) return '#8BC34A'
  if (probability >= 50) return '#FFC107'
  if (probability >= 40) return '#FF9800'
  return '#F44336'
}

const getConfidenceColor = (confidence) => {
  switch (confidence) {
    case 'high': return 'success'
    case 'medium': return 'warning'
    case 'low': return 'error'
    default: return 'info'
  }
}

const getRecommendationColor = (probability) => {
  if (probability >= 70) return 'success'
  if (probability >= 60) return 'info'
  if (probability >= 50) return 'warning'
  if (probability >= 40) return 'warning'
  return 'error'
}

const savePrediction = async () => {
  if (!prediction.value || !selectedPlayer1.value || !selectedPlayer2.value) return

  saving.value = true
  try {
    const predictionData = {
      player1Id: selectedPlayer1.value.id,
      player1Name: selectedPlayer1.value.name,
      player2Id: selectedPlayer2.value.id,
      player2Name: selectedPlayer2.value.name,
      winProbability: prediction.value.winProbability,
      confidence: prediction.value.confidence,
      recommendation: prediction.value.recommendation,
      factors: prediction.value.factors,
      headToHead: prediction.value.headToHead,
      mttaComparison: prediction.value.mttaComparison,
      commonOpponentsCount: prediction.value.commonOpponents?.length || 0,
      tournamentId: prediction.value.tournamentId
    }
    await predictionsStore.addPrediction(predictionData)
  } catch (error) {
    console.error('Error saving prediction:', error)
  } finally {
    saving.value = false
  }
}

const loadSavedPrediction = (saved) => {
  viewingPrediction.value = saved
  viewDialog.value = true
}

const confirmDelete = (saved) => {
  predictionToDelete.value = saved
  deleteDialog.value = true
}

const deletePrediction = async () => {
  if (predictionToDelete.value) {
    try {
      await predictionsStore.deletePrediction(predictionToDelete.value.id)
      deleteDialog.value = false
      predictionToDelete.value = null
    } catch (error) {
      console.error('Error deleting prediction:', error)
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 16px;
}

.saved-prediction-card {
  transition: all 0.3s ease;
}

.saved-prediction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(220, 20, 60, 0.3) !important;
}
</style>
