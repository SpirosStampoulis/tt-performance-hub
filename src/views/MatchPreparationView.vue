<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Match Preparation & Scouting</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn 
          color="primary" 
          prepend-icon="mdi-plus" 
          @click="openReportDialog()"
        >
          Create Scouting Report
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="preparationStore.scoutingReports.length === 0">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center text-medium-emphasis pa-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-text-outline</v-icon>
            <div class="text-h6 mb-2">No scouting reports yet</div>
            <div class="text-body-2">Create a scouting report to prepare for your next match</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col 
        v-for="report in preparationStore.scoutingReports" 
        :key="report.id" 
        cols="12" 
        md="6"
      >
        <v-card class="scouting-card" elevation="3">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-account-box</v-icon>
            <span class="font-weight-bold">{{ report.opponentName }}</span>
            <v-spacer></v-spacer>
            <v-btn 
              icon="mdi-pencil" 
              size="small" 
              variant="text" 
              @click="openReportDialog(report)"
            ></v-btn>
            <v-btn 
              icon="mdi-delete" 
              size="small" 
              variant="text" 
              color="error"
              @click="confirmDelete(report)"
            ></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis mb-1">Match Date</div>
              <div class="text-body-1 font-weight-medium">{{ formatDate(report.matchDate) }}</div>
            </div>

            <v-row class="mb-3">
              <v-col cols="6">
                <div class="text-center pa-2 bg-grey-lighten-4 rounded">
                  <div class="text-h5 font-weight-bold text-primary">{{ report.winProbability }}%</div>
                  <div class="text-caption">Win Probability</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center pa-2 bg-grey-lighten-4 rounded">
                  <div class="text-h6 font-weight-bold">{{ report.headToHeadRecord }}</div>
                  <div class="text-caption">Head-to-Head</div>
                </div>
              </v-col>
            </v-row>

            <div class="mb-3">
              <div class="text-caption text-medium-emphasis mb-1">Recent Form</div>
              <div class="d-flex">
                <v-chip
                  v-for="(result, index) in report.recentForm.split('')"
                  :key="index"
                  :color="result === 'W' ? 'success' : 'error'"
                  size="small"
                  class="mr-1"
                >
                  {{ result }}
                </v-chip>
              </div>
            </div>

            <div class="mb-3" v-if="report.mttaRanking && report.mttaRanking.opponent">
              <div class="text-caption text-medium-emphasis mb-1">MTTA Ranking</div>
              <div class="text-body-2">
                <div v-if="report.mttaRanking.opponent.startPosition">
                  <strong>Start Position:</strong> {{ report.mttaRanking.opponent.startPosition }}
                </div>
                <div v-if="report.mttaRanking.opponent.currentPosition">
                  <strong>Current Position:</strong> {{ report.mttaRanking.opponent.currentPosition }}
                </div>
                <div v-if="report.mttaRanking.opponent.totalPoints">
                  <strong>Total Points:</strong> {{ report.mttaRanking.opponent.totalPoints }}
                </div>
              </div>
            </div>

            <div class="mb-3" v-if="report.playerToPlayerH2H && report.playerToPlayerH2H.total > 0">
              <div class="text-caption text-medium-emphasis mb-1">Direct Head-to-Head</div>
              <div class="text-body-2">
                <strong>Record:</strong> {{ report.playerToPlayerH2H.player1Wins }}W - {{ report.playerToPlayerH2H.player2Wins }}L
                <br>
                <strong>Win Rate:</strong> {{ report.playerToPlayerH2H.player1WinRate }}%
                <br>
                <span class="text-caption">({{ report.playerToPlayerH2H.total }} match{{ report.playerToPlayerH2H.total !== 1 ? 'es' : '' }})</span>
              </div>
            </div>

            <div class="mb-3" v-if="report.weaknesses">
              <div class="text-caption text-medium-emphasis mb-1">Opponent Weaknesses</div>
              <div class="text-body-2">{{ report.weaknesses }}</div>
            </div>

            <div class="mb-3" v-if="report.gamePlan && report.gamePlan.length > 0">
              <div class="text-caption text-medium-emphasis mb-1">Game Plan</div>
              <ul class="text-body-2">
                <li v-for="(plan, index) in report.gamePlan" :key="index">{{ plan }}</li>
              </ul>
            </div>

            <div class="mb-3" v-if="report.keyTactics && report.keyTactics.length > 0">
              <div class="text-caption text-medium-emphasis mb-1">Key Tactics</div>
              <ul class="text-body-2">
                <li v-for="(tactic, index) in report.keyTactics" :key="index">{{ tactic }}</li>
              </ul>
            </div>

            <div v-if="report.notes">
              <div class="text-caption text-medium-emphasis mb-1">Additional Notes</div>
              <div class="text-body-2" style="white-space: pre-wrap">{{ report.notes }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="reportDialog" max-width="800" persistent>
      <v-card>
        <v-card-title>
          {{ editingReport ? 'Edit Scouting Report' : 'Create Scouting Report' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="reportForm">
            <v-select
              v-model="formData.opponentId"
              :items="opponentsList"
              item-title="name"
              item-value="id"
              label="Opponent"
              variant="outlined"
              :rules="[v => !!v || 'Opponent is required']"
              @update:model-value="onOpponentSelected"
            ></v-select>

            <v-text-field
              v-model="formData.matchDate"
              label="Match Date"
              type="date"
              variant="outlined"
              :rules="[v => !!v || 'Match date is required']"
            ></v-text-field>

            <v-card v-if="prediction" class="mb-4" variant="outlined">
              <v-card-title class="text-subtitle-1">Matchup Prediction</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4">
                    <div class="text-center">
                      <div class="text-h4 font-weight-bold" :class="getProbabilityColor(prediction.winProbability)">
                        {{ prediction.winProbability }}%
                      </div>
                      <div class="text-caption">Win Probability</div>
                      <v-chip size="small" :color="getConfidenceColor(prediction.confidence)" class="mt-2">
                        {{ prediction.confidence }} confidence
                      </v-chip>
                    </div>
                    
                    <div v-if="prediction.mttaRanking && prediction.mttaRanking.opponent" class="mt-3 pa-2 bg-info-lighten-5 rounded">
                      <div class="text-caption font-weight-bold mb-1">MTTA Ranking</div>
                      <div v-if="prediction.mttaRanking.opponent.startPosition" class="text-caption">
                        Start: {{ prediction.mttaRanking.opponent.startPosition }}
                      </div>
                      <div v-if="prediction.mttaRanking.opponent.currentPosition" class="text-caption">
                        Current: {{ prediction.mttaRanking.opponent.currentPosition }}
                      </div>
                      <div v-if="prediction.mttaRanking.opponent.totalPoints" class="text-caption">
                        Points: {{ prediction.mttaRanking.opponent.totalPoints }}
                      </div>
                    </div>

                    <div v-if="prediction.playerToPlayerH2H && prediction.playerToPlayerH2H.total > 0" class="mt-3 pa-2 bg-success-lighten-5 rounded">
                      <div class="text-caption font-weight-bold mb-1">Direct H2H</div>
                      <div class="text-body-2 text-center">
                        {{ prediction.playerToPlayerH2H.player1Wins }}-{{ prediction.playerToPlayerH2H.player2Wins }}
                      </div>
                      <div class="text-caption text-center">
                        {{ prediction.playerToPlayerH2H.player1WinRate }}% win rate
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="8">
                    <div class="text-body-2 mb-2">
                      <strong>Recommendation:</strong> {{ prediction.recommendation }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <strong>Factors:</strong>
                      <ul class="mt-1">
                        <li v-for="(factor, index) in prediction.factors" :key="index">{{ factor }}</li>
                      </ul>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-textarea
              v-model="formData.notes"
              label="Additional Notes"
              variant="outlined"
              rows="4"
              placeholder="Add any additional preparation notes, tactics, or reminders..."
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeReportDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveReport">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Scouting Report</v-card-title>
        <v-card-text>Are you sure you want to delete this scouting report?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteReport">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMatchPreparationStore } from '../stores/matchPreparation'
import { useOpponentsStore } from '../stores/opponents'
import { useMatchesStore } from '../stores/matches'
import { formatDate } from '../utils/date'

const preparationStore = useMatchPreparationStore()
const opponentsStore = useOpponentsStore()
const matchesStore = useMatchesStore()

const reportDialog = ref(false)
const deleteDialog = ref(false)
const editingReport = ref(null)
const reportToDelete = ref(null)
const reportForm = ref(null)
const prediction = ref(null)

const opponentsList = computed(() => opponentsStore.opponents)

const formData = ref({
  opponentId: null,
  matchDate: new Date().toISOString().split('T')[0],
  notes: ''
})

onMounted(async () => {
  await Promise.all([
    opponentsStore.fetchOpponents(),
    matchesStore.fetchMatches(),
    preparationStore.fetchScoutingReports()
  ])
})

const onOpponentSelected = async (opponentId) => {
  if (opponentId) {
    prediction.value = matchesStore.predictMatchup(opponentId)
    
    const generatedReport = preparationStore.generateScoutingReport(
      opponentId,
      formData.value.matchDate ? new Date(formData.value.matchDate) : null
    )
    
    if (generatedReport) {
      formData.value.gamePlan = generatedReport.gamePlan
      formData.value.keyTactics = generatedReport.keyTactics
    }
  } else {
    prediction.value = null
  }
}

const openReportDialog = (report = null) => {
  if (report) {
    editingReport.value = report
    formData.value = {
      opponentId: report.opponentId,
      matchDate: report.matchDate ? report.matchDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: report.notes || '',
      gamePlan: report.gamePlan || [],
      keyTactics: report.keyTactics || []
    }
    onOpponentSelected(report.opponentId)
  } else {
    editingReport.value = null
    formData.value = {
      opponentId: null,
      matchDate: new Date().toISOString().split('T')[0],
      notes: '',
      gamePlan: [],
      keyTactics: []
    }
    prediction.value = null
  }
  reportDialog.value = true
}

const closeReportDialog = () => {
  reportDialog.value = false
  editingReport.value = null
  prediction.value = null
}

const saveReport = async () => {
  const { valid } = await reportForm.value.validate()
  if (!valid) return

  const opponent = opponentsStore.opponents.find(o => o.id === formData.value.opponentId)
  if (!opponent) return

  const generatedReport = preparationStore.generateScoutingReport(
    formData.value.opponentId,
    new Date(formData.value.matchDate)
  )

  const reportData = {
    opponentId: formData.value.opponentId,
    opponentName: opponent.name,
    matchDate: new Date(formData.value.matchDate),
    headToHeadRecord: generatedReport.headToHeadRecord,
    winRate: generatedReport.winRate,
    recentForm: generatedReport.recentForm,
    winProbability: generatedReport.winProbability,
    weaknesses: generatedReport.weaknesses,
    playingStyle: generatedReport.playingStyle,
    gamePlan: generatedReport.gamePlan,
    keyTactics: generatedReport.keyTactics,
    notes: formData.value.notes
  }

  try {
    if (editingReport.value) {
      await preparationStore.updateScoutingReport(editingReport.value.id, reportData)
    } else {
      await preparationStore.addScoutingReport(reportData)
    }
    closeReportDialog()
  } catch (error) {
    console.error('Error saving report:', error)
  }
}

const confirmDelete = (report) => {
  reportToDelete.value = report
  deleteDialog.value = true
}

const deleteReport = async () => {
  if (reportToDelete.value) {
    await preparationStore.deleteScoutingReport(reportToDelete.value.id)
    deleteDialog.value = false
    reportToDelete.value = null
  }
}

const getProbabilityColor = (probability) => {
  if (probability >= 70) return 'text-success'
  if (probability >= 55) return 'text-primary'
  if (probability >= 45) return 'text-info'
  if (probability >= 30) return 'text-warning'
  return 'text-error'
}

const getConfidenceColor = (confidence) => {
  switch (confidence) {
    case 'high':
      return 'success'
    case 'medium':
      return 'primary'
    case 'low':
      return 'warning'
    default:
      return 'grey'
  }
}
</script>

<style scoped>
.scouting-card {
  border-radius: 16px;
  border: 2px solid rgba(220, 20, 60, 0.25);
  transition: all 0.3s ease;
}

.scouting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(220, 20, 60, 0.3) !important;
  border-color: rgba(220, 20, 60, 0.5);
}
</style>

