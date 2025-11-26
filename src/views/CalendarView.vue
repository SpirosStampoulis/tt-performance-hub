<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Match Calendar</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openMatchDialog()"
        >
          Add Match
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>Filters</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-select
              v-model="filterTournament"
              :items="tournamentsList"
              item-title="name"
              item-value="id"
              label="Tournament"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"
            ></v-select>
            <v-select
              v-model="filterResult"
              :items="['All', 'Wins', 'Losses']"
              label="Result"
              variant="outlined"
              density="compact"
              class="mb-3"
            ></v-select>
            <v-btn
              block
              variant="outlined"
              @click="goToToday"
            >
              Go to Today
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card>
          <v-card-title>
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              @click="previousMonth"
            ></v-btn>
            <v-spacer></v-spacer>
            <span class="text-h6">{{ currentMonthYear }}</span>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              @click="nextMonth"
            ></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-calendar
            v-model="selectedDate"
            :events="calendarEvents"
            event-color="primary"
            type="month"
            :first-day-of-week="1"
            @click:date="viewDateMatches"
          >
            <template v-slot:day="{ date }">
              <div class="text-center">
                <div class="text-caption">{{ getDayMatchCount(date) }}</div>
              </div>
            </template>
          </v-calendar>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showDateMatchesDialog" max-width="600">
      <v-card>
        <v-card-title>
          Matches on {{ formatDate(selectedDateForDialog) }}
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div v-if="getMatchesForDate(selectedDateForDialog).length === 0" class="text-center text-medium-emphasis py-4">
            No matches on this date
          </div>
          <v-list v-else density="comfortable">
            <v-list-item
              v-for="match in getMatchesForDate(selectedDateForDialog)"
              :key="match.id"
              :to="`/matches/${match.id}`"
            >
              <v-list-item-title>
                {{ getPlayerName(match.player1Id) }} vs {{ getPlayerName(match.player2Id) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ getTournamentName(match.tournamentId) || 'Friendly Match' }}
                <span v-if="match.round"> • {{ match.round }}</span>
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip
                  size="small"
                  :color="getMatchResult(match) === 'Win' ? 'success' : 'error'"
                >
                  {{ getScoreSummary(match) }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDateMatchesDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchesStore } from '../stores/matches'
import { useTournamentsStore } from '../stores/tournaments'
import { useOpponentsStore } from '../stores/opponents'
import { formatDate } from '../utils/date'

const router = useRouter()
const matchesStore = useMatchesStore()
const tournamentsStore = useTournamentsStore()
const opponentsStore = useOpponentsStore()

const selectedDate = ref(new Date())
const filterTournament = ref(null)
const filterResult = ref('All')
const showDateMatchesDialog = ref(false)
const selectedDateForDialog = ref(null)

const tournamentsList = computed(() => {
  return tournamentsStore.tournaments.map(t => ({
    id: t.id,
    name: `${t.name} (${t.year})`
  }))
})

const currentMonthYear = computed(() => {
  return selectedDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const filteredMatches = computed(() => {
  let matches = matchesStore.matches

  if (filterTournament.value) {
    matches = matches.filter(m => m.tournamentId === filterTournament.value)
  }

  if (filterResult.value === 'Wins') {
    matches = matches.filter(m => getMatchResult(m) === 'Win')
  } else if (filterResult.value === 'Losses') {
    matches = matches.filter(m => getMatchResult(m) === 'Loss')
  }

  return matches
})

const calendarEvents = computed(() => {
  return filteredMatches.value.map(match => {
    const isScheduled = match.status === 'scheduled'
    const hasScores = match.scores && match.scores.length > 0 && 
      match.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
    const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
    const isFuture = matchDate > new Date()
    const isUpcoming = isScheduled || (!hasScores && isFuture)
    
    return {
      name: `${getPlayerName(match.player1Id)} vs ${getPlayerName(match.player2Id)}`,
      start: match.date,
      end: match.date,
      color: isUpcoming ? 'info' : (getMatchResult(match) === 'Win' ? 'success' : 'error'),
      timed: false
    }
  })
})

const getDayMatchCount = (date) => {
  const dateStr = date.split('T')[0]
  return filteredMatches.value.filter(m => {
    const matchDate = m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date?.toDate?.().toISOString().split('T')[0]
    return matchDate === dateStr
  }).length
}

const getMatchesForDate = (date) => {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date.split('T')[0]
  return filteredMatches.value.filter(m => {
    const matchDate = m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date?.toDate?.().toISOString().split('T')[0]
    return matchDate === dateStr
  })
}

const viewDateMatches = (date) => {
  selectedDateForDialog.value = date.date
  showDateMatchesDialog.value = true
}

const previousMonth = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  selectedDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(selectedDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  selectedDate.value = newDate
}

const goToToday = () => {
  selectedDate.value = new Date()
}

const getMatchResult = (match) => {
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score > p2Score) player1Sets++
    else if (p2Score > p1Score) player2Sets++
  })
  
  return player1Sets > player2Sets ? 'Win' : 'Loss'
}

const getScoreSummary = (match) => {
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score > p2Score) player1Sets++
    else if (p2Score > p1Score) player2Sets++
  })
  
  return `${player1Sets}-${player2Sets}`
}

const getPlayerName = (playerId) => {
  if (!playerId) return 'Unknown'
  const player = opponentsStore.opponents.find(p => p.id === playerId)
  return player ? player.name : 'Unknown'
}

const getTournamentName = (tournamentId) => {
  if (!tournamentId) return null
  const tournament = tournamentsStore.tournaments.find(t => t.id === tournamentId)
  return tournament ? tournament.name : null
}

const openMatchDialog = () => {
  router.push('/matches')
}

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    tournamentsStore.fetchTournaments(),
    opponentsStore.fetchOpponents()
  ])
})
</script>

