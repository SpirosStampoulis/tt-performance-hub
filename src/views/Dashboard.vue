<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-h6 mb-2">Total Matches</div>
            <div class="text-h3">{{ matchesStore.totalMatches }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-h6 mb-2">Win Rate</div>
            <div class="text-h3">{{ matchesStore.winPercentage }}%</div>
            <div class="text-caption">{{ matchesStore.winLossRecord.wins }}W - {{ matchesStore.winLossRecord.losses }}L</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="text-h6 mb-2">Players Tracked</div>
            <div class="text-h3">{{ opponentsStore.opponents.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Recent Matches
          </v-card-title>
          <v-divider></v-divider>
          <v-list v-if="matchesStore.recentMatches.length > 0">
            <v-list-item
              v-for="match in matchesStore.recentMatches"
              :key="match.id"
              :to="`/matches/${match.id}`"
            >
              <template v-slot:prepend>
                <v-avatar :color="getMatchResult(match) === 'Win' ? 'success' : 'error'">
                  <v-icon>{{ getMatchResult(match) === 'Win' ? 'mdi-check' : 'mdi-close' }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ getPlayerName(match.player1Id || match.opponentId) }} vs {{ getPlayerName(match.player2Id || match.opponentId) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDateShort(match.date) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-caption">{{ getScoreSummary(match) }}</div>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-center text-medium-emphasis">
            No matches recorded yet
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-tournament</v-icon>
            Recent Tournaments
          </v-card-title>
          <v-divider></v-divider>
          <v-list v-if="recentTournaments.length > 0">
            <v-list-item
              v-for="tournament in recentTournaments"
              :key="tournament.id"
              :to="`/tournaments`"
            >
              <v-list-item-title>{{ tournament.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ getTournamentMatchCount(tournament.id) }} matches
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-icon>mdi-arrow-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
          <v-card-text v-else class="text-center text-medium-emphasis">
            No tournaments yet
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card v-if="matchesStore.matches.length > 0">
          <v-card-text>
            <WinRateChart :matches="matchesStore.matches" />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card v-if="recentTournaments.length > 0">
          <v-card-text>
            <DivisionChart :recordByDivision="recordByTournament" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-school</v-icon>
            Skills in Development
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="skillsStore.skills.length === 0" class="text-center text-medium-emphasis">
            No skills added yet
          </v-card-text>
          <v-list v-else>
            <v-list-item
              v-for="skill in skillsStore.skills.slice(0, 5)"
              :key="skill.id"
              :to="`/skills`"
            >
              <template v-slot:prepend>
                <v-avatar color="primary">
                  <v-icon>mdi-bullseye-arrow</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ skill.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ skill.category }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-chip size="small">{{ skill.difficulty }}</v-chip>
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

const router = useRouter()
const matchesStore = useMatchesStore()
const opponentsStore = useOpponentsStore()
const skillsStore = useSkillsStore()
const tournamentsStore = useTournamentsStore()
const showQuickActions = ref(false)

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

