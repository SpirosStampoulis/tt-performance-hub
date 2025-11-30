<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">My Match Calendar</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          {{ PLAYER_NAME }} & {{ TEAM_NAME }}
        </p>
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
              v-model="filterType"
              :items="['All', 'Individual', 'Team']"
              label="Match Type"
              variant="outlined"
              density="compact"
              class="mb-3"
            ></v-select>
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

    <v-dialog v-model="showDateMatchesDialog" max-width="700">
      <v-card>
        <v-card-title>
          Matches on {{ formatDate(selectedDateForDialog) }}
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div v-if="allMatchesForDate.length === 0" class="text-center text-medium-emphasis py-4">
            No matches on this date
          </div>
          <v-list v-else density="comfortable">
            <v-list-item
              v-for="item in allMatchesForDate"
              :key="item.id"
              :to="item.type === 'team' ? null : `/matches/${item.id}`"
              @click="item.type === 'team' ? viewTeamMatch(item) : null"
            >
              <template v-slot:prepend>
                <v-icon
                  :color="item.type === 'team' ? 'purple' : 'primary'"
                  class="mr-2"
                >
                  {{ item.type === 'team' ? 'mdi-account-group' : 'mdi-account' }}
                </v-icon>
              </template>
              <v-list-item-title>
                <span v-if="item.type === 'team'">
                  {{ item.teamName }} vs {{ item.opponentTeamName }}
                </span>
                <span v-else>
                  {{ getPlayerName(item.player1Id) }} vs {{ getPlayerName(item.player2Id) }}
                </span>
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  v-if="item.type === 'team'"
                  size="x-small"
                  color="purple"
                  variant="flat"
                  class="mr-1"
                >
                  Team Match
                </v-chip>
                {{ getTournamentName(item.tournamentId) || 'Friendly Match' }}
                <span v-if="item.round"> • {{ item.round }}</span>
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip
                  v-if="item.type === 'team'"
                  size="small"
                  :color="getTeamMatchResult(item) === 'Win' ? 'success' : getTeamMatchResult(item) === 'Loss' ? 'error' : 'default'"
                >
                  {{ getTeamMatchScore(item) }}
                </v-chip>
                <v-chip
                  v-else
                  size="small"
                  :color="getMatchResult(item) === 'Win' ? 'success' : getMatchResult(item) === 'Loss' ? 'error' : 'default'"
                >
                  {{ getScoreSummary(item) }}
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
import { useTeamMatchesStore } from '../stores/teamMatches'
import { useTeamsStore } from '../stores/teams'
import { formatDate } from '../utils/date'

const router = useRouter()
const matchesStore = useMatchesStore()
const tournamentsStore = useTournamentsStore()
const opponentsStore = useOpponentsStore()
const teamMatchesStore = useTeamMatchesStore()
const teamsStore = useTeamsStore()

const PLAYER_NAME = 'Spiros Stampoulis'
const TEAM_NAME = 'Topspin TTA Skelton'

const selectedDate = ref(new Date())
const filterType = ref('All')
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

const currentPlayer = computed(() => {
  return opponentsStore.opponents.find(o => o.name === PLAYER_NAME)
})

const currentTeam = computed(() => {
  return teamsStore.teams.find(t => t.name === TEAM_NAME)
})

const myIndividualMatches = computed(() => {
  if (!currentPlayer.value) return []
  
  return matchesStore.matches.filter(match => {
    return match.player1Id === currentPlayer.value.id || 
           match.player2Id === currentPlayer.value.id ||
           match.opponentId === currentPlayer.value.id
  })
})

const myTeamMatches = computed(() => {
  if (!currentTeam.value) return []
  
  return teamMatchesStore.teamMatches.filter(teamMatch => {
    return teamMatch.team1Id === currentTeam.value.id || 
           teamMatch.team2Id === currentTeam.value.id ||
           teamMatch.myTeamId === currentTeam.value.id ||
           teamMatch.opponentTeamId === currentTeam.value.id
  })
})

const filteredMatches = computed(() => {
  let matches = myIndividualMatches.value

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

const filteredTeamMatches = computed(() => {
  let teamMatches = myTeamMatches.value

  if (filterTournament.value) {
    teamMatches = teamMatches.filter(tm => tm.tournamentId === filterTournament.value)
  }

  if (filterResult.value === 'Wins') {
    teamMatches = teamMatches.filter(tm => getTeamMatchResult(tm) === 'Win')
  } else if (filterResult.value === 'Losses') {
    teamMatches = teamMatches.filter(tm => getTeamMatchResult(tm) === 'Loss')
  }

  return teamMatches
})

const calendarEvents = computed(() => {
  const events = []
  
  if (filterType.value === 'All' || filterType.value === 'Individual') {
    filteredMatches.value.forEach(match => {
      const isScheduled = match.status === 'scheduled'
      const hasScores = match.scores && match.scores.length > 0 && 
        match.scores.some(s => (s.player1Score || s.myScore) && (s.player2Score || s.oppScore))
      const matchDate = match.date instanceof Date ? match.date : match.date.toDate()
      const isFuture = matchDate > new Date()
      const isUpcoming = isScheduled || (!hasScores && isFuture)
      const result = getMatchResult(match)
      
      events.push({
        name: `${getPlayerName(match.player1Id)} vs ${getPlayerName(match.player2Id)}`,
        start: match.date,
        end: match.date,
        color: isUpcoming || result === 'Pending' ? 'info' : (result === 'Win' ? 'success' : 'error'),
        timed: false,
        type: 'individual'
      })
    })
  }
  
  if (filterType.value === 'All' || filterType.value === 'Team') {
    filteredTeamMatches.value.forEach(teamMatch => {
      const matchDate = teamMatch.date instanceof Date ? teamMatch.date : teamMatch.date.toDate()
      const isFuture = matchDate > new Date()
      const hasResult = getTeamMatchResult(teamMatch) !== 'Pending'
      
      events.push({
        name: `${getTeamName(teamMatch, true)} vs ${getTeamName(teamMatch, false)}`,
        start: teamMatch.date,
        end: teamMatch.date,
        color: isFuture ? 'info' : (getTeamMatchResult(teamMatch) === 'Win' ? 'success' : getTeamMatchResult(teamMatch) === 'Loss' ? 'error' : 'purple'),
        timed: false,
        type: 'team'
      })
    })
  }
  
  return events
})

const getDayMatchCount = (date) => {
  const dateStr = date.split('T')[0]
  let count = 0
  
  if (filterType.value === 'All' || filterType.value === 'Individual') {
    count += filteredMatches.value.filter(m => {
      const matchDate = m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date?.toDate?.().toISOString().split('T')[0]
      return matchDate === dateStr
    }).length
  }
  
  if (filterType.value === 'All' || filterType.value === 'Team') {
    count += filteredTeamMatches.value.filter(tm => {
      const matchDate = tm.date instanceof Date ? tm.date.toISOString().split('T')[0] : tm.date?.toDate?.().toISOString().split('T')[0]
      return matchDate === dateStr
    }).length
  }
  
  return count
}

const allMatchesForDate = computed(() => {
  if (!selectedDateForDialog.value) return []
  
  const dateStr = selectedDateForDialog.value instanceof Date 
    ? selectedDateForDialog.value.toISOString().split('T')[0] 
    : selectedDateForDialog.value.split('T')[0]
  
  const items = []
  
  if (filterType.value === 'All' || filterType.value === 'Individual') {
    filteredMatches.value.filter(m => {
      const matchDate = m.date instanceof Date ? m.date.toISOString().split('T')[0] : m.date?.toDate?.().toISOString().split('T')[0]
      return matchDate === dateStr
    }).forEach(match => {
      items.push({ ...match, type: 'individual' })
    })
  }
  
  if (filterType.value === 'All' || filterType.value === 'Team') {
    filteredTeamMatches.value.filter(tm => {
      const matchDate = tm.date instanceof Date ? tm.date.toISOString().split('T')[0] : tm.date?.toDate?.().toISOString().split('T')[0]
      return matchDate === dateStr
    }).forEach(teamMatch => {
      const teamId = currentTeam.value?.id
      const isMyTeam = teamMatch.team1Id === teamId || teamMatch.team2Id === teamId || 
                       teamMatch.myTeamId === teamId || teamMatch.opponentTeamId === teamId
      const myTeamId = teamMatch.team1Id === teamId ? teamMatch.team1Id : 
                       (teamMatch.team2Id === teamId ? teamMatch.team2Id :
                       (teamMatch.myTeamId === teamId ? teamMatch.myTeamId : teamMatch.opponentTeamId))
      const oppTeamId = teamMatch.team1Id === teamId ? teamMatch.team2Id : 
                        (teamMatch.team2Id === teamId ? teamMatch.team1Id :
                        (teamMatch.myTeamId === teamId ? teamMatch.opponentTeamId : teamMatch.myTeamId))
      
      items.push({
        ...teamMatch,
        type: 'team',
        teamName: getTeamNameById(myTeamId),
        opponentTeamName: getTeamNameById(oppTeamId)
      })
    })
  }
  
  return items.sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : a.date.toDate()
    const dateB = b.date instanceof Date ? b.date : b.date.toDate()
    return dateA - dateB
  })
})

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
  if (!match.scores || match.scores.length === 0) {
    const matchDate = match.date instanceof Date ? match.date : match.date?.toDate?.()
    return matchDate && matchDate > new Date() ? 'Pending' : 'Pending'
  }
  
  let player1Sets = 0
  let player2Sets = 0
  
  match.scores.forEach(score => {
    const p1Score = score.player1Score || score.myScore || 0
    const p2Score = score.player2Score || score.oppScore || 0
    if (p1Score > p2Score) player1Sets++
    else if (p2Score > p1Score) player2Sets++
  })
  
  if (player1Sets === player2Sets) return 'Pending'
  return player1Sets > player2Sets ? 'Win' : 'Loss'
}

const getScoreSummary = (match) => {
  if (!match.scores || match.scores.length === 0) {
    return 'TBD'
  }
  
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

const getTeamName = (teamMatch, isMyTeam) => {
  if (!currentTeam.value) return 'Unknown'
  const teamId = currentTeam.value.id
  const myTeamId = teamMatch.team1Id === teamId ? teamMatch.team1Id : 
                   (teamMatch.team2Id === teamId ? teamMatch.team2Id :
                   (teamMatch.myTeamId === teamId ? teamMatch.myTeamId : teamMatch.opponentTeamId))
  const oppTeamId = teamMatch.team1Id === teamId ? teamMatch.team2Id : 
                    (teamMatch.team2Id === teamId ? teamMatch.team1Id :
                    (teamMatch.myTeamId === teamId ? teamMatch.opponentTeamId : teamMatch.myTeamId))
  
  if (isMyTeam) {
    return getTeamNameById(myTeamId)
  } else {
    return getTeamNameById(oppTeamId)
  }
}

const getTeamNameById = (teamId) => {
  if (!teamId) return 'Unknown'
  const team = teamsStore.teams.find(t => t.id === teamId)
  return team ? team.name : 'Unknown'
}

const getTeamMatchResult = (teamMatch) => {
  if (!teamMatch.scores || teamMatch.scores.length === 0) {
    const matchDate = teamMatch.date instanceof Date ? teamMatch.date : teamMatch.date.toDate()
    return matchDate > new Date() ? 'Pending' : 'Pending'
  }
  
  if (!currentTeam.value) return 'Pending'
  const teamId = currentTeam.value.id
  const myTeamId = teamMatch.team1Id === teamId ? teamMatch.team1Id : 
                   (teamMatch.team2Id === teamId ? teamMatch.team2Id :
                   (teamMatch.myTeamId === teamId ? teamMatch.myTeamId : teamMatch.opponentTeamId))
  
  let myTeamSets = 0
  let oppTeamSets = 0
  
  teamMatch.scores.forEach(score => {
    const team1Score = score.team1Score || score.myTeamScore || 0
    const team2Score = score.team2Score || score.oppTeamScore || 0
    
    if (teamMatch.team1Id === myTeamId || teamMatch.myTeamId === myTeamId) {
      if (team1Score > team2Score) myTeamSets++
      else if (team2Score > team1Score) oppTeamSets++
    } else {
      if (team2Score > team1Score) myTeamSets++
      else if (team1Score > team2Score) oppTeamSets++
    }
  })
  
  if (myTeamSets > oppTeamSets) return 'Win'
  if (oppTeamSets > myTeamSets) return 'Loss'
  return 'Pending'
}

const getTeamMatchScore = (teamMatch) => {
  if (!teamMatch.scores || teamMatch.scores.length === 0) {
    return 'TBD'
  }
  
  if (!currentTeam.value) return 'TBD'
  const teamId = currentTeam.value.id
  const myTeamId = teamMatch.team1Id === teamId ? teamMatch.team1Id : 
                   (teamMatch.team2Id === teamId ? teamMatch.team2Id :
                   (teamMatch.myTeamId === teamId ? teamMatch.myTeamId : teamMatch.opponentTeamId))
  
  let myTeamSets = 0
  let oppTeamSets = 0
  
  teamMatch.scores.forEach(score => {
    const team1Score = score.team1Score || score.myTeamScore || 0
    const team2Score = score.team2Score || score.oppTeamScore || 0
    
    if (teamMatch.team1Id === myTeamId || teamMatch.myTeamId === myTeamId) {
      if (team1Score > team2Score) myTeamSets++
      else if (team2Score > team1Score) oppTeamSets++
    } else {
      if (team2Score > team1Score) myTeamSets++
      else if (team1Score > team2Score) oppTeamSets++
    }
  })
  
  return `${myTeamSets}-${oppTeamSets}`
}

const viewTeamMatch = (teamMatch) => {
  router.push(`/league/${teamMatch.tournamentId}`)
}

const openMatchDialog = () => {
  router.push('/matches')
}

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    tournamentsStore.fetchTournaments(),
    opponentsStore.fetchOpponents(),
    teamMatchesStore.fetchTeamMatches(),
    teamsStore.fetchTeams()
  ])
})
</script>

