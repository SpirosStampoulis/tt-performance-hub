<template>
  <v-container v-if="opponent">
    <v-row>
      <v-col>
        <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="$router.back()">
          Back
        </v-btn>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedTournament"
          :items="allTournaments"
          item-title="displayName"
          item-value="id"
          label="Filter by Tournament/League"
          variant="outlined"
          density="comfortable"
          clearable
          prepend-inner-icon="mdi-filter"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :title="null">
              <v-list-item-title>{{ item.raw.displayName }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.raw.type }}</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center">
            <v-avatar size="120" :color="opponent.photoUrl ? undefined : 'primary'" class="mb-4">
              <v-img v-if="opponent.photoUrl" :src="opponent.photoUrl"></v-img>
              <span v-else class="text-h3">{{ getInitials(opponent.name) }}</span>
            </v-avatar>
            <div class="text-h4">{{ opponent.name }}</div>
            <div class="text-subtitle-1 mt-4">{{ opponent.club || 'No team' }}</div>
            
            <v-divider class="my-4"></v-divider>
            
            <div v-if="opponent.mttaStartPosition || opponent.mttaCurrentPosition || opponent.mttaTotalPoints || opponent.alphaRanking || opponent.topspinRanking" class="text-center">
              <div v-if="opponent.mttaStartPosition || opponent.mttaCurrentPosition || opponent.mttaTotalPoints" class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">MTTA Ranking</div>
                <div v-if="opponent.mttaStartPosition" class="text-body-2">Start: {{ opponent.mttaStartPosition }}</div>
                <div v-if="opponent.mttaCurrentPosition" class="text-body-2">Current: {{ opponent.mttaCurrentPosition }}</div>
                <div v-if="opponent.mttaTotalPoints" class="text-body-2">Points: {{ opponent.mttaTotalPoints }}</div>
              </div>
              <div v-if="opponent.alphaRanking" class="mb-2">
                <div class="text-caption text-medium-emphasis">Alpha Ranking</div>
                <div class="text-h6">{{ opponent.alphaRanking }}</div>
              </div>
              <div v-if="opponent.topspinRanking" class="mb-2">
                <div class="text-caption text-medium-emphasis">Topspin Ranking</div>
                <div class="text-h6">{{ opponent.topspinRanking }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title>Head-to-Head Record</v-card-title>
          <v-card-text>
            <div class="text-center">
              <div class="text-h3">{{ headToHead.wins }}-{{ headToHead.losses }}</div>
              <div class="text-caption mb-4">Win-Loss</div>
              <v-progress-circular
                :model-value="headToHead.winRate"
                :size="120"
                :width="15"
                color="primary"
              >
                <div class="text-h6">{{ headToHead.winRate }}%</div>
              </v-progress-circular>
              <div class="text-caption mt-4">Win Rate</div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="mt-4" v-if="opponent.notes">
          <v-card-title>Notes</v-card-title>
          <v-card-text>
            <p style="white-space: pre-wrap">{{ opponent.notes }}</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title>Match Statistics</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" md="3">
                <div class="text-h5">{{ headToHead.total }}</div>
                <div class="text-caption">Total Matches</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-h5">{{ headToHead.wins }}</div>
                <div class="text-caption">Wins</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-h5">{{ headToHead.losses }}</div>
                <div class="text-caption">Losses</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-h5">{{ averageScoreDiff }}</div>
                <div class="text-caption">Avg Score Diff</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-4" v-if="matchupPrediction">
          <v-card-title>
            <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
            Matchup Prediction
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <div class="text-center pa-4 bg-grey-lighten-4 rounded">
                  <div 
                    class="text-h3 font-weight-bold mb-2"
                    :class="getProbabilityColor(matchupPrediction.winProbability)"
                  >
                    {{ matchupPrediction.winProbability }}%
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">Win Probability</div>
                  <v-chip 
                    size="small" 
                    :color="getConfidenceColor(matchupPrediction.confidence)"
                    class="mb-2"
                  >
                    {{ matchupPrediction.confidence }} confidence
                  </v-chip>
                </div>
                
                <div v-if="matchupPrediction.mttaRanking && matchupPrediction.mttaRanking.opponent" class="mt-4 pa-3 bg-info-lighten-5 rounded">
                  <div class="text-subtitle-2 mb-2 text-center">MTTA Ranking</div>
                  <div v-if="matchupPrediction.mttaRanking.opponent.startPosition" class="text-body-2 mb-1">
                    <strong>Start Position:</strong> {{ matchupPrediction.mttaRanking.opponent.startPosition }}
                  </div>
                  <div v-if="matchupPrediction.mttaRanking.opponent.currentPosition" class="text-body-2 mb-1">
                    <strong>Current Position:</strong> {{ matchupPrediction.mttaRanking.opponent.currentPosition }}
                  </div>
                  <div v-if="matchupPrediction.mttaRanking.opponent.totalPoints" class="text-body-2">
                    <strong>Total Points:</strong> {{ matchupPrediction.mttaRanking.opponent.totalPoints }}
                  </div>
                </div>

                <div v-if="matchupPrediction.playerToPlayerH2H && matchupPrediction.playerToPlayerH2H.total > 0" class="mt-4 pa-3 bg-success-lighten-5 rounded">
                  <div class="text-subtitle-2 mb-2 text-center">Direct Head-to-Head</div>
                  <div class="text-body-2 text-center">
                    <div class="text-h6 mb-1">
                      {{ matchupPrediction.playerToPlayerH2H.player1Wins }} - {{ matchupPrediction.playerToPlayerH2H.player2Wins }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ matchupPrediction.playerToPlayerH2H.total }} match{{ matchupPrediction.playerToPlayerH2H.total !== 1 ? 'es' : '' }}
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      Win Rate: {{ matchupPrediction.playerToPlayerH2H.player1WinRate }}%
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="8">
                <div class="text-subtitle-1 mb-2">Recommendation</div>
                <div class="text-body-1 mb-3">{{ matchupPrediction.recommendation }}</div>
                <div class="text-subtitle-1 mb-2">Key Factors</div>
                <ul class="text-body-2">
                  <li v-for="(factor, index) in matchupPrediction.factors" :key="index">{{ factor }}</li>
                </ul>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="text-subtitle-1 mb-2">Head-to-Head Record</div>
                <div class="text-body-2 mb-1">
                  <strong>Overall:</strong> {{ matchupPrediction.headToHead.wins }}W - {{ matchupPrediction.headToHead.losses }}L 
                  ({{ matchupPrediction.headToHead.winRate }}% win rate)
                </div>
                <div v-if="matchupPrediction.recentForm.total > 0" class="text-body-2">
                  <strong>Recent Form:</strong> {{ matchupPrediction.recentForm.wins }}W - {{ matchupPrediction.recentForm.total - matchupPrediction.recentForm.wins }}L 
                  in last {{ matchupPrediction.recentForm.total }} matches
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-4" v-if="matches.length > 0">
          <v-card-title>Recent Form & Patterns</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-2">Recent Form (Last 5)</div>
                <div class="d-flex">
                  <v-chip
                    v-for="(result, index) in recentForm"
                    :key="index"
                    :color="result === 'W' ? 'success' : 'error'"
                    size="small"
                    class="mr-1"
                  >
                    {{ result }}
                  </v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mt-2">
                  Current Streak: {{ currentStreak.type }} {{ currentStreak.count }}
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-2">Performance Insights</div>
                <div v-if="bestPerformance" class="text-body-2 mb-1">
                  <v-icon size="small" color="success" class="mr-1">mdi-trophy</v-icon>
                  Best: {{ bestPerformance.score }} ({{ formatDate(bestPerformance.date) }})
                </div>
                <div v-if="worstPerformance" class="text-body-2">
                  <v-icon size="small" color="error" class="mr-1">mdi-alert</v-icon>
                  Worst: {{ worstPerformance.score }} ({{ formatDate(worstPerformance.date) }})
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>
            Match History
            <v-spacer></v-spacer>
            <v-chip size="small">{{ matches.length }} matches</v-chip>
          </v-card-title>
          <v-divider></v-divider>
          <v-list v-if="matches.length > 0">
            <v-list-item
              v-for="match in matches"
              :key="match.id"
              :to="`/matches/${match.id}`"
            >
              <template v-slot:prepend>
                <v-avatar :color="getMatchResult(match) === 'Win' ? 'success' : 'error'">
                  <v-icon>{{ getMatchResult(match) === 'Win' ? 'mdi-check' : 'mdi-close' }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ getMatchResult(match) }} vs {{ getOpponentName(match) }} - {{ getScoreSummary(match) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDate(match.date) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn icon="mdi-arrow-right" variant="text" size="small"></v-btn>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-center text-medium-emphasis">
            No matches recorded yet
          </v-card-text>
        </v-card>

        <v-card v-if="weaknesses">
          <v-card-title>
            Weakness Analysis
            <v-spacer></v-spacer>
            <v-btn icon="mdi-pencil" size="small" @click="editWeaknesses = true"></v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="weaknesses" style="white-space: pre-wrap">{{ weaknesses }}</div>
            <div v-else class="text-medium-emphasis">No weakness analysis added yet</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="editWeaknesses" max-width="600">
      <v-card>
        <v-card-title>Edit Weakness Analysis</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="weaknessForm"
            label="Weakness Analysis"
            hint="What tactics or shots give you trouble against this opponent?"
            variant="outlined"
            rows="8"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editWeaknesses = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveWeaknesses">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOpponentsStore } from '../stores/opponents'
import { useMatchesStore } from '../stores/matches'
import { useTournamentsStore } from '../stores/tournaments'
import { formatDate } from '../utils/date'

const route = useRoute()
const opponentsStore = useOpponentsStore()
const matchesStore = useMatchesStore()
const tournamentsStore = useTournamentsStore()

const opponent = ref(null)
const editWeaknesses = ref(false)
const weaknessForm = ref('')
const weaknesses = ref('')

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    opponentsStore.fetchOpponents(),
    tournamentsStore.fetchTournaments()
  ])
  opponent.value = await opponentsStore.getOpponent(route.params.id)
  weaknesses.value = opponent.value?.weaknesses || ''
  weaknessForm.value = weaknesses.value
})

const selectedTournament = ref(null)

const allTournaments = computed(() => {
  return tournamentsStore.tournaments
    .map(t => ({
      ...t,
      displayName: `${t.name} (${t.year})`
    }))
    .sort((a, b) => {
      if (b.year !== a.year) return (b.year || 0) - (a.year || 0)
      return a.name.localeCompare(b.name)
    })
})

const matches = computed(() => {
  let playerMatches = matchesStore.getMatchesByOpponent(route.params.id)
  
  if (selectedTournament.value) {
    playerMatches = playerMatches.filter(m => m.tournamentId === selectedTournament.value)
  }
  
  return playerMatches
})

const headToHead = computed(() => {
  return matchesStore.headToHeadStats(route.params.id)
})

const averageScoreDiff = computed(() => {
  if (matches.value.length === 0) return 0
  
  const playerId = route.params.id
  const totalDiff = matches.value.reduce((sum, match) => {
    const isPlayer1 = match.player1Id === playerId || match.opponentId === playerId
    
    let player1Sets = 0
    let player2Sets = 0
    
    match.scores.forEach(score => {
      const p1Score = score.player1Score || score.myScore || 0
      const p2Score = score.player2Score || score.oppScore || 0
      if (p1Score > p2Score) player1Sets++
      else if (p2Score > p1Score) player2Sets++
    })
    
    if (isPlayer1) {
      return sum + (player1Sets - player2Sets)
    } else {
      return sum + (player2Sets - player1Sets)
    }
  }, 0)
  
  return (totalDiff / matches.value.length).toFixed(1)
})

const recentForm = computed(() => {
  const sortedMatches = [...matches.value]
    .filter(m => m.date)
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : a.date.toDate()
      const dateB = b.date instanceof Date ? b.date : b.date.toDate()
      return dateB - dateA
    })
    .slice(0, 5)
  
  return sortedMatches.map(m => getMatchResult(m) === 'Win' ? 'W' : 'L')
})

const currentStreak = computed(() => {
  if (matches.value.length === 0) return { type: 'None', count: 0 }
  
  const sortedMatches = [...matches.value]
    .filter(m => m.date)
    .sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : a.date.toDate()
      const dateB = b.date instanceof Date ? b.date : b.date.toDate()
      return dateB - dateA
    })
  
  if (sortedMatches.length === 0) return { type: 'None', count: 0 }
  
  const firstResult = getMatchResult(sortedMatches[0])
  let count = 1
  
  for (let i = 1; i < sortedMatches.length; i++) {
    if (getMatchResult(sortedMatches[i]) === firstResult) {
      count++
    } else {
      break
    }
  }
  
  return {
    type: firstResult === 'Win' ? 'Winning' : 'Losing',
    count
  }
})

const bestPerformance = computed(() => {
  if (matches.value.length === 0) return null
  
  const playerId = route.params.id
  let best = null
  let bestDiff = -Infinity
  
  matches.value.forEach(match => {
    const isPlayer1 = match.player1Id === playerId || match.opponentId === playerId
    let player1Sets = 0
    let player2Sets = 0
    
    match.scores.forEach(score => {
      const p1Score = score.player1Score || score.myScore || 0
      const p2Score = score.player2Score || score.oppScore || 0
      if (p1Score > p2Score) player1Sets++
      else if (p2Score > p1Score) player2Sets++
    })
    
    const diff = isPlayer1 ? (player1Sets - player2Sets) : (player2Sets - player1Sets)
    
    if (diff > bestDiff && getMatchResult(match) === 'Win') {
      bestDiff = diff
      best = {
        score: isPlayer1 ? `${player1Sets}-${player2Sets}` : `${player2Sets}-${player1Sets}`,
        date: match.date instanceof Date ? match.date : match.date.toDate()
      }
    }
  })
  
  return best
})

const worstPerformance = computed(() => {
  if (matches.value.length === 0) return null
  
  const playerId = route.params.id
  let worst = null
  let worstDiff = Infinity
  
  matches.value.forEach(match => {
    const isPlayer1 = match.player1Id === playerId || match.opponentId === playerId
    let player1Sets = 0
    let player2Sets = 0
    
    match.scores.forEach(score => {
      const p1Score = score.player1Score || score.myScore || 0
      const p2Score = score.player2Score || score.oppScore || 0
      if (p1Score > p2Score) player1Sets++
      else if (p2Score > p1Score) player2Sets++
    })
    
    const diff = isPlayer1 ? (player1Sets - player2Sets) : (player2Sets - player1Sets)
    
    if (diff < worstDiff && getMatchResult(match) === 'Loss') {
      worstDiff = diff
      worst = {
        score: isPlayer1 ? `${player1Sets}-${player2Sets}` : `${player2Sets}-${player1Sets}`,
        date: match.date instanceof Date ? match.date : match.date.toDate()
      }
    }
  })
  
  return worst
})

const matchupPrediction = computed(() => {
  if (matches.value.length === 0 && !opponent.value) return null
  
  const PLAYER_NAME = 'Spiros Stampoulis'
  const currentPlayer = opponentsStore.opponents.find(o => o.name === PLAYER_NAME)
  const currentPlayerId = currentPlayer ? currentPlayer.id : null
  
  return matchesStore.predictMatchup(route.params.id, opponent.value, currentPlayerId)
})

const winProbability = computed(() => {
  return matchupPrediction.value ? matchupPrediction.value.winProbability : 0
})

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}


const getMatchResult = (match) => {
  const playerId = route.params.id
  const isPlayer1 = match.player1Id === playerId || match.opponentId === playerId
  
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score > p2Score) player1Sets++
    else if (p2Score > p1Score) player2Sets++
  })
  
  if (isPlayer1) {
    return player1Sets > player2Sets ? 'Win' : 'Loss'
  } else {
    return player2Sets > player1Sets ? 'Win' : 'Loss'
  }
}

const getScoreSummary = (match) => {
  const playerId = route.params.id
  const isPlayer1 = match.player1Id === playerId || match.opponentId === playerId
  
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score > p2Score) player1Sets++
    else if (p2Score > p1Score) player2Sets++
  })
  
  if (isPlayer1) {
    return `${player1Sets}-${player2Sets}`
  } else {
    return `${player2Sets}-${player1Sets}`
  }
}

const getOpponentName = (match) => {
  const playerId = route.params.id
  const opponentId = match.player1Id === playerId ? match.player2Id : (match.player2Id === playerId ? match.player1Id : match.opponentId)
  const opponentPlayer = opponentsStore.opponents.find(o => o.id === opponentId)
  return opponentPlayer ? opponentPlayer.name : 'Unknown'
}

const saveWeaknesses = async () => {
  await opponentsStore.updateOpponent(opponent.value.id, {
    ...opponent.value,
    weaknesses: weaknessForm.value
  })
  
  opponent.value = await opponentsStore.getOpponent(opponent.value.id)
  weaknesses.value = opponent.value.weaknesses || ''
  editWeaknesses.value = false
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

