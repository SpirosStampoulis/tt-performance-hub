<template>
  <v-container>
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="primary">mdi-calendar</v-icon>
            <span class="font-weight-bold">Spiros Stampoulis - Match Calendar</span>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-chevron-left"
              variant="text"
              size="small"
              @click="previousMonth"
            ></v-btn>
            <span class="mx-4 text-h6">{{ currentMonthYear }}</span>
            <v-btn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
              @click="nextMonth"
            ></v-btn>
            <v-btn
              icon="mdi-calendar-today"
              variant="text"
              size="small"
              class="ml-2"
              @click="goToToday"
            ></v-btn>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-card-text>
            <div class="calendar-container">
              <div class="calendar-header">
                <div v-for="day in weekDays" :key="day" class="calendar-day-header">
                  {{ day }}
                </div>
              </div>
              <div class="calendar-grid">
                <div
                  v-for="(day, index) in calendarDays"
                  :key="index"
                  class="calendar-day"
                  :class="{
                    'other-month': !day.isCurrentMonth,
                    'today': day.isToday,
                    'has-matches': day.matches.length > 0
                  }"
                  @click="selectDate(day.date)"
                >
                  <div class="calendar-day-number">{{ day.dayNumber }}</div>
                  <div class="calendar-day-matches">
                    <v-chip
                      v-for="(match, matchIndex) in day.matches.slice(0, 2)"
                      :key="match.id"
                      :color="match.status === 'scheduled' ? 'warning' : 'primary'"
                      size="x-small"
                      variant="flat"
                      class="match-chip"
                    >
                      {{ getMatchShortLabel(match) }}
                    </v-chip>
                    <span v-if="day.matches.length > 2" class="more-matches">
                      +{{ day.matches.length - 2 }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="selectedDateMatches.length > 0">
      <v-col cols="12">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="primary">mdi-calendar-clock</v-icon>
            <span class="font-weight-bold">Matches on {{ formatSelectedDate }}</span>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="match in selectedDateMatches"
                :key="match.id"
                :to="`/matches/${match.id}`"
                class="match-list-item"
              >
                <template v-slot:prepend>
                  <v-icon
                    :color="match.status === 'scheduled' ? 'warning' : 'primary'"
                    class="mr-3"
                  >
                    {{ match.status === 'scheduled' ? 'mdi-clock-outline' : 'mdi-trophy' }}
                  </v-icon>
                </template>
                <v-list-item-title>
                  <span v-if="match.isDoubles && match.player1Id && match.player2Id && match.player3Id && match.player4Id">
                    {{ getPlayerName(match.player1Id) }} & {{ getPlayerName(match.player3Id) }} vs {{ getPlayerName(match.player2Id) }} & {{ getPlayerName(match.player4Id) }}
                  </span>
                  <span v-else-if="match.player1Id && match.player2Id">
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
                  {{ getTournamentName(match.tournamentId) || 'Friendly Match' }}
                  <span v-if="match.round"> • Round {{ match.round }}</span>
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip
                    v-if="!isScheduled(match)"
                    size="small"
                    color="primary"
                    variant="flat"
                  >
                    {{ getSetsWon(match) }}
                  </v-chip>
                  <v-chip
                    v-else
                    size="small"
                    color="warning"
                    variant="flat"
                  >
                    Scheduled
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else-if="selectedDate">
      <v-col cols="12">
        <v-card class="modern-card" elevation="3">
          <v-card-text class="text-center text-medium-emphasis pa-6">
            No matches for Spiros Stampoulis on {{ formatSelectedDate }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMatchesStore } from '../stores/matches'
import { useOpponentsStore } from '../stores/opponents'
import { useTournamentsStore } from '../stores/tournaments'
import { useTeamsStore } from '../stores/teams'
import { formatDate } from '../utils/date'

const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()
const tournamentsStore = useTournamentsStore()
const teamsStore = useTeamsStore()

const PLAYER_NAME = 'Spiros Stampoulis'
const currentPlayer = computed(() => {
  return opponentsStore.opponents.find(o => o.name === PLAYER_NAME)
})

const currentDate = ref(new Date())
const selectedDate = ref(null)

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  return formatDate(selectedDate.value)
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    const prevMonthDate = new Date(year, month, -i)
    days.unshift({
      date: new Date(prevMonthDate),
      dayNumber: prevMonthDate.getDate(),
      isCurrentMonth: false,
      isToday: false,
      matches: []
    })
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    
    const matchesForDay = matchesStore.matches.filter(match => {
      if (!match.date) return false
      if (!currentPlayer.value) return false
      
      const isPlayerInMatch = 
        match.player1Id === currentPlayer.value.id ||
        match.player2Id === currentPlayer.value.id ||
        match.player3Id === currentPlayer.value.id ||
        match.player4Id === currentPlayer.value.id ||
        match.opponentId === currentPlayer.value.id
      
      if (!isPlayerInMatch) return false
      
      const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
      const matchDateOnly = new Date(matchDate)
      matchDateOnly.setHours(0, 0, 0, 0)
      return matchDateOnly.getTime() === dateOnly.getTime()
    })
    
    days.push({
      date: dateOnly,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateOnly.getTime() === today.getTime(),
      matches: matchesForDay
    })
  }
  
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonthDate = new Date(year, month + 1, day)
    days.push({
      date: new Date(nextMonthDate),
      dayNumber: nextMonthDate.getDate(),
      isCurrentMonth: false,
      isToday: false,
      matches: []
    })
  }
  
  return days
})

const selectedDateMatches = computed(() => {
  if (!selectedDate.value) return []
  
  const dateStr = selectedDate.value.toISOString().split('T')[0]
  const dateOnly = new Date(selectedDate.value)
  dateOnly.setHours(0, 0, 0, 0)
  
  return matchesStore.matches.filter(match => {
    if (!match.date) return false
    if (!currentPlayer.value) return false
    
    const isPlayerInMatch = 
      match.player1Id === currentPlayer.value.id ||
      match.player2Id === currentPlayer.value.id ||
      match.player3Id === currentPlayer.value.id ||
      match.player4Id === currentPlayer.value.id ||
      match.opponentId === currentPlayer.value.id
    
    if (!isPlayerInMatch) return false
    
    const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
    const matchDateOnly = new Date(matchDate)
    matchDateOnly.setHours(0, 0, 0, 0)
    return matchDateOnly.getTime() === dateOnly.getTime()
  }).sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : a.date.toDate()
    const dateB = b.date instanceof Date ? b.date : b.date.toDate()
    return dateA - dateB
  })
})

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  selectedDate.value = null
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  selectedDate.value = null
}

const goToToday = () => {
  currentDate.value = new Date()
  selectedDate.value = new Date()
  selectedDate.value.setHours(0, 0, 0, 0)
}

const selectDate = (date) => {
  if (date) {
    selectedDate.value = new Date(date)
    selectedDate.value.setHours(0, 0, 0, 0)
  }
}

const getMatchShortLabel = (match) => {
  if (match.player1Id && match.player2Id) {
    const p1 = getPlayerName(match.player1Id)
    const p2 = getPlayerName(match.player2Id)
    return `${p1.split(' ')[0]} vs ${p2.split(' ')[0]}`
  } else if (match.player1TeamId && match.player2TeamId) {
    const t1 = getTeamName(match.player1TeamId)
    const t2 = getTeamName(match.player2TeamId)
    return `${t1.substring(0, 8)} vs ${t2.substring(0, 8)}`
  }
  return 'Match'
}

const getPlayerName = (playerId) => {
  if (!playerId) return 'Unknown'
  const player = opponentsStore.opponents.find(o => o.id === playerId)
  return player ? player.name : 'Unknown'
}

const getTeamName = (teamId) => {
  if (!teamId) return ''
  const team = teamsStore.teams.find(t => t.id === teamId)
  return team ? team.name : ''
}

const getTournamentName = (tournamentId) => {
  if (!tournamentId) return null
  const tournament = tournamentsStore.tournaments.find(t => t.id === tournamentId)
  return tournament ? tournament.name : null
}

const isScheduled = (match) => {
  if (match.status === 'scheduled') return true
  const hasScores = match.scores && match.scores.length > 0 && 
    match.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
  if (!match.date) return false
  const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
  return !hasScores && matchDate > new Date()
}

const getSetsWon = (match) => {
  if (!match.scores || match.scores.length === 0) return '0-0'
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const player1Score = score.player1Score || score.myScore || 0
    const player2Score = score.player2Score || score.oppScore || 0
    
    if (player1Score > player2Score) {
      player1Sets++
    } else if (player2Score > player1Score) {
      player2Sets++
    }
  })
  
  return `${player1Sets}-${player2Sets}`
}

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    opponentsStore.fetchOpponents(),
    tournamentsStore.fetchTournaments(),
    teamsStore.fetchTeams()
  ])
  
  selectedDate.value = new Date()
  selectedDate.value.setHours(0, 0, 0, 0)
})
</script>

<style scoped>
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

.calendar-container {
  width: 100%;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.calendar-day-header {
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  padding: 8px 4px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  min-height: 100px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  background: rgba(220, 20, 60, 0.05);
  border-color: rgba(220, 20, 60, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.calendar-day.other-month {
  opacity: 0.4;
  background: rgba(0, 0, 0, 0.02);
}

.calendar-day.today {
  border-color: #DC143C;
  background: rgba(220, 20, 60, 0.1);
  font-weight: 700;
}

.calendar-day.has-matches {
  border-color: rgba(220, 20, 60, 0.4);
  background: rgba(220, 20, 60, 0.05);
}

.calendar-day-number {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.calendar-day-matches {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.match-chip {
  font-size: 0.65rem !important;
  height: 18px !important;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-matches {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 600;
  margin-top: 2px;
}

.match-list-item {
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.match-list-item:hover {
  background: rgba(220, 20, 60, 0.05);
  border-color: rgba(220, 20, 60, 0.3);
  transform: translateX(4px);
}

@media (max-width: 960px) {
  .calendar-day {
    min-height: 60px;
    padding: 4px;
  }
  
  .calendar-day-number {
    font-size: 0.75rem;
  }
  
  .match-chip {
    font-size: 0.55rem !important;
    height: 14px !important;
  }
  
  .more-matches {
    font-size: 0.6rem;
  }
}
</style>
