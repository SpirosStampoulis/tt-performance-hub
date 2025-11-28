<template>
  <v-container>
    <v-row class="mb-4">
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
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card stat-card-1" elevation="4">
          <v-card-text class="pa-6 stat-card-content">
            <div class="d-flex align-center mb-3">
              <v-icon size="32" color="white" class="mr-3">mdi-trophy</v-icon>
              <div class="text-h6 text-white font-weight-bold">Total Matches</div>
            </div>
            <div class="text-h2 text-white font-weight-bold mb-1">{{ dashboardStats.totalMatches }}</div>
            <div class="text-caption text-white text-opacity-90">All time matches</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card stat-card-2" elevation="4">
          <v-card-text class="pa-6 stat-card-content">
            <div class="d-flex align-center mb-3">
              <v-icon size="32" color="white" class="mr-3">mdi-chart-line</v-icon>
              <div class="text-h6 text-white font-weight-bold">Win Rate</div>
            </div>
            <div class="text-h2 text-white font-weight-bold mb-1">{{ dashboardStats.winPercentage }}%</div>
            <div class="text-caption text-white text-opacity-90">{{ dashboardStats.wins }}W - {{ dashboardStats.losses }}L</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card stat-card-3" elevation="4">
          <v-card-text class="pa-6 stat-card-content">
            <div class="d-flex align-center mb-3">
              <v-icon size="32" color="white" class="mr-3">mdi-chart-pie</v-icon>
              <div class="text-h6 text-white font-weight-bold">Sets Won %</div>
            </div>
            <div class="text-h2 text-white font-weight-bold mb-1">{{ matchesStore.advancedStats.setsWonPercentage }}%</div>
            <div class="text-caption text-white text-opacity-90">{{ matchesStore.advancedStats.totalSetsWon }}W - {{ matchesStore.advancedStats.totalSetsLost }}L</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card stat-card-4" elevation="4">
          <v-card-text class="pa-6 stat-card-content">
            <div class="d-flex align-center mb-3">
              <v-icon size="32" color="white" class="mr-3">mdi-account-group</v-icon>
              <div class="text-h6 text-white font-weight-bold">Players Tracked</div>
            </div>
            <div class="text-h2 text-white font-weight-bold mb-1">{{ opponentsStore.opponents.length }}</div>
            <div class="text-caption text-white text-opacity-90">Total opponents</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="matchesStore.advancedStats.averageServeSuccess > 0 || matchesStore.advancedStats.averageReturnPoints > 0">
      <v-col cols="12" md="4">
        <v-card class="modern-card" elevation="3">
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-3">
              <v-icon class="mr-2" color="primary" size="28">mdi-tennis</v-icon>
              <div class="text-h6 font-weight-bold">Avg Serve Success</div>
            </div>
            <div class="text-h3 font-weight-bold text-primary">{{ matchesStore.advancedStats.averageServeSuccess }}%</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="modern-card" elevation="3">
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-3">
              <v-icon class="mr-2" color="secondary" size="28">mdi-swap-horizontal</v-icon>
              <div class="text-h6 font-weight-bold">Avg Return Points</div>
            </div>
            <div class="text-h3 font-weight-bold text-secondary">{{ matchesStore.advancedStats.averageReturnPoints }}%</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4" v-if="matchesStore.advancedStats.averageMatchDuration > 0">
        <v-card class="modern-card" elevation="3">
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-3">
              <v-icon class="mr-2" color="info" size="28">mdi-clock-outline</v-icon>
              <div class="text-h6 font-weight-bold">Avg Match Duration</div>
            </div>
            <div class="text-h3 font-weight-bold text-info">{{ matchesStore.advancedStats.averageMatchDuration }} min</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="primary">mdi-trophy</v-icon>
            <span class="font-weight-bold">Recent Matches</span>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-list v-if="filteredMatches.slice(0, 5).length > 0" class="pa-2">
            <v-list-item
              v-for="match in filteredMatches.slice(0, 5)"
              :key="match.id"
              :to="`/matches/${match.id}`"
              class="modern-list-item mb-2"
              rounded="lg"
            >
              <v-list-item-title class="font-weight-medium">
                {{ getPlayerName(match.player1Id || match.opponentId) }} vs {{ getPlayerName(match.player2Id || match.opponentId) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDateShort(match.date) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip size="small" color="primary" variant="flat">{{ getScoreSummary(match) }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-center text-medium-emphasis pa-6">
            No matches recorded yet
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="secondary">mdi-tournament</v-icon>
            <span class="font-weight-bold">Recent Tournaments</span>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-list v-if="recentTournaments.length > 0" class="pa-2">
            <v-list-item
              v-for="tournament in recentTournaments"
              :key="tournament.id"
              :to="`/tournaments`"
              class="modern-list-item mb-2"
              rounded="lg"
            >
              <v-list-item-title class="font-weight-medium">{{ tournament.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ getTournamentMatchCount(tournament.id) }} matches
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-icon color="secondary">mdi-arrow-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-center text-medium-emphasis pa-6">
            No tournaments yet
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card v-if="matchesStore.matches.length > 0" class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="primary">mdi-chart-arc</v-icon>
            <span class="font-weight-bold">Win Rate</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <WinRateChart :matches="matchesStore.matches" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card v-if="recentTournaments.length > 0" class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="secondary">mdi-chart-donut</v-icon>
            <span class="font-weight-bold">Division Performance</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <DivisionChart :recordByDivision="recordByTournament" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="matchesStore.performanceByMonth.length > 0">
      <v-col cols="12" md="6">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="info">mdi-chart-line-variant</v-icon>
            <span class="font-weight-bold">Performance Trend</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <PerformanceTrendChart :monthlyData="matchesStore.performanceByMonth" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" v-if="matchesStore.setsTrend.length > 0">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="success">mdi-chart-bar</v-icon>
            <span class="font-weight-bold">Sets Trend</span>
          </v-card-title>
          <v-card-text class="pa-4">
            <SetsTrendChart :setsTrend="matchesStore.setsTrend" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="accent">mdi-school</v-icon>
            <span class="font-weight-bold">Skills in Development</span>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-card-text v-if="skillsStore.skills.length === 0" class="text-center text-medium-emphasis pa-6">
            No skills added yet
          </v-card-text>
          <v-list v-else class="pa-2">
            <v-list-item
              v-for="skill in skillsStore.skills.slice(0, 5)"
              :key="skill.id"
              :to="`/skills`"
              class="modern-list-item mb-2"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-avatar color="accent" size="48">
                  <v-icon color="white">mdi-bullseye-arrow</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">{{ skill.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ skill.category }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-chip size="small" color="accent" variant="flat">{{ skill.difficulty }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-fab
      icon="mdi-plus"
      color="primary"
      location="bottom end"
      size="large"
      app
      @click="showQuickActions = true"
    ></v-fab>

    <v-dialog v-model="showQuickActions" max-width="400">
      <v-card>
        <v-card-title>Quick Actions</v-card-title>
        <v-list>
          <v-list-item prepend-icon="mdi-trophy" title="Add Match" @click="goToMatches"></v-list-item>
          <v-list-item prepend-icon="mdi-tournament" title="Add Tournament" @click="goToTournaments"></v-list-item>
          <v-list-item prepend-icon="mdi-account-plus" title="Add Player" @click="goToOpponents"></v-list-item>
          <v-list-item prepend-icon="mdi-bullseye-arrow" title="Add Skill" @click="goToSkills"></v-list-item>
        </v-list>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showQuickActions = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchesStore } from '../stores/matches'
import { useOpponentsStore } from '../stores/opponents'
import { useSkillsStore } from '../stores/skills'
import { useTournamentsStore } from '../stores/tournaments'
import { formatDateShort } from '../utils/date'
import WinRateChart from '../components/dashboard/WinRateChart.vue'
import DivisionChart from '../components/dashboard/DivisionChart.vue'
import PerformanceTrendChart from '../components/dashboard/PerformanceTrendChart.vue'
import SetsTrendChart from '../components/dashboard/SetsTrendChart.vue'

const router = useRouter()
const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()
const skillsStore = useSkillsStore()
const tournamentsStore = useTournamentsStore()
const showQuickActions = ref(false)
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

const filteredMatches = computed(() => {
  if (!selectedTournament.value) return matchesStore.matches
  return matchesStore.matches.filter(m => m.tournamentId === selectedTournament.value)
})

const dashboardStats = computed(() => {
  const matches = filteredMatches.value
  const totalMatches = matches.length
  
  let wins = 0
  let losses = 0
  let totalSetsWon = 0
  let totalSetsLost = 0
  
  matches.forEach(match => {
    const myTotalScore = match.scores?.reduce((sum, s) => sum + (s.myScore || 0), 0) || 0
    const oppTotalScore = match.scores?.reduce((sum, s) => sum + (s.oppScore || 0), 0) || 0
    
    if (myTotalScore > oppTotalScore) wins++
    else if (oppTotalScore > myTotalScore) losses++
    
    match.scores?.forEach(score => {
      const myScore = score.myScore || 0
      const oppScore = score.oppScore || 0
      if (myScore > oppScore) totalSetsWon++
      else if (oppScore > myScore) totalSetsLost++
    })
  })
  
  const winPercentage = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0
  const setsWonPercentage = (totalSetsWon + totalSetsLost) > 0 
    ? ((totalSetsWon / (totalSetsWon + totalSetsLost)) * 100).toFixed(1) 
    : 0
  
  return {
    totalMatches,
    wins,
    losses,
    winPercentage,
    totalSetsWon,
    totalSetsLost,
    setsWonPercentage
  }
})

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    opponentsStore.fetchOpponents(),
    skillsStore.fetchSkills(),
    tournamentsStore.fetchTournaments()
  ])
})

const recentTournaments = computed(() => {
  return tournamentsStore.tournaments.slice(0, 5)
})

const recordByTournament = computed(() => {
  const tournaments = {}
  
  matchesStore.matches.forEach(match => {
    const tournament = tournamentsStore.tournaments.find(t => t.id === match.tournamentId)
    const tournamentName = tournament ? tournament.name : 'Unknown'
    
    if (!tournaments[tournamentName]) {
      tournaments[tournamentName] = { wins: 0, losses: 0 }
    }
    
    const myTotalScore = match.scores.reduce((sum, s) => sum + s.myScore, 0)
    const oppTotalScore = match.scores.reduce((sum, s) => sum + s.oppScore, 0)
    
    if (myTotalScore > oppTotalScore) {
      tournaments[tournamentName].wins++
    } else {
      tournaments[tournamentName].losses++
    }
  })
  
  return tournaments
})

const getTournamentMatchCount = (tournamentId) => {
  return matchesStore.matches.filter(m => m.tournamentId === tournamentId).length
}

const getMatchResult = (match) => {
  const player1Total = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
  const player2Total = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
  return player1Total > player2Total ? 'Win' : 'Loss'
}

const getScoreSummary = (match) => {
  const player1Total = match.scores.reduce((sum, s) => sum + (s.player1Score || s.myScore || 0), 0)
  const player2Total = match.scores.reduce((sum, s) => sum + (s.player2Score || s.oppScore || 0), 0)
  return `${player1Total}-${player2Total}`
}

const getPlayerName = (playerId) => {
  const player = opponentsStore.opponents.find(o => o.id === playerId)
  return player ? player.name : 'Unknown'
}

const goToMatches = () => {
  showQuickActions.value = false
  router.push('/matches')
}

const goToTournaments = () => {
  showQuickActions.value = false
  router.push('/tournaments')
}

const goToOpponents = () => {
  showQuickActions.value = false
  router.push('/opponents')
}

const goToSkills = () => {
  showQuickActions.value = false
  router.push('/skills')
}
</script>

<style scoped>
.stat-card {
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  background: white !important;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
}

.stat-card-1 {
  background: linear-gradient(135deg, #DC143C 0%, #C8102E 100%) !important;
}

.stat-card-2 {
  background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%) !important;
}

.stat-card-3 {
  background: linear-gradient(135deg, #DC143C 0%, #FF6B35 100%) !important;
}

.stat-card-4 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%) !important;
}

.stat-card :deep(.v-card) {
  background: transparent !important;
}

.stat-card :deep(.v-card-text) {
  background: transparent !important;
}

.stat-card-content {
  background: transparent !important;
}

.stat-card :deep(*) {
  background: transparent !important;
}

.stat-card-1 :deep(.v-card),
.stat-card-1 :deep(.v-card-text),
.stat-card-2 :deep(.v-card),
.stat-card-2 :deep(.v-card-text),
.stat-card-3 :deep(.v-card),
.stat-card-3 :deep(.v-card-text),
.stat-card-4 :deep(.v-card),
.stat-card-4 :deep(.v-card-text) {
  background: transparent !important;
}

.modern-card {
  border-radius: 16px;
  border: 2px solid rgba(220, 20, 60, 0.25);
  transition: all 0.3s ease;
  overflow: hidden;
  background: white !important;
}

.modern-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(220, 20, 60, 0.3) !important;
  border-color: rgba(220, 20, 60, 0.5);
}

.modern-card-title {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.15) 0%, rgba(255, 215, 0, 0.15) 100%);
  padding: 16px 20px;
  border-bottom: 3px solid rgba(220, 20, 60, 0.3);
  color: rgba(0, 0, 0, 0.87) !important;
}

.modern-list-item {
  transition: all 0.2s ease;
  border: 2px solid rgba(220, 20, 60, 0.2);
  background: white !important;
  margin-bottom: 8px;
}

.modern-list-item:hover {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%) !important;
  border-color: rgba(220, 20, 60, 0.5);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(220, 20, 60, 0.2) !important;
}
</style>

