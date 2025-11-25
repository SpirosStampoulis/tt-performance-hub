<template>
  <v-container v-if="opponent">
    <v-row>
      <v-col>
        <v-btn prepend-icon="mdi-arrow-left" variant="text" @click="$router.back()">
          Back to Opponents
        </v-btn>
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
            <v-chip :color="getStyleColor(opponent.playingStyle)" class="mt-2">
              {{ opponent.playingStyle }}
            </v-chip>
            <div class="text-subtitle-1 mt-4">{{ opponent.club || 'No club' }}</div>
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
                {{ getMatchResult(match) }} - {{ getScoreSummary(match) }}
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
import { formatDate } from '../utils/date'

const route = useRoute()
const opponentsStore = useOpponentsStore()
const matchesStore = useMatchesStore()

const opponent = ref(null)
const editWeaknesses = ref(false)
const weaknessForm = ref('')
const weaknesses = ref('')

onMounted(async () => {
  await matchesStore.fetchMatches()
  opponent.value = await opponentsStore.getOpponent(route.params.id)
  weaknesses.value = opponent.value?.weaknesses || ''
  weaknessForm.value = weaknesses.value
})

const matches = computed(() => {
  return matchesStore.getMatchesByOpponent(route.params.id)
})

const headToHead = computed(() => {
  return matchesStore.headToHeadStats(route.params.id)
})

const averageScoreDiff = computed(() => {
  if (matches.value.length === 0) return 0
  
  const totalDiff = matches.value.reduce((sum, match) => {
    const myTotal = match.scores.reduce((s, score) => s + score.myScore, 0)
    const oppTotal = match.scores.reduce((s, score) => s + score.oppScore, 0)
    return sum + (myTotal - oppTotal)
  }, 0)
  
  return (totalDiff / matches.value.length).toFixed(1)
})

const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStyleColor = (style) => {
  const colors = {
    Aggressive: 'error',
    Defensive: 'success',
    Mixed: 'info'
  }
  return colors[style] || 'grey'
}

const getMatchResult = (match) => {
  const myTotal = match.scores.reduce((sum, s) => sum + s.myScore, 0)
  const oppTotal = match.scores.reduce((sum, s) => sum + s.oppScore, 0)
  return myTotal > oppTotal ? 'Win' : 'Loss'
}

const getScoreSummary = (match) => {
  const myTotal = match.scores.reduce((sum, s) => sum + s.myScore, 0)
  const oppTotal = match.scores.reduce((sum, s) => sum + s.oppScore, 0)
  return `${myTotal}-${oppTotal}`
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
</script>

