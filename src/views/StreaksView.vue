<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Streaks & Milestones</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="success">mdi-fire</v-icon>
            <span class="font-weight-bold">Current Streaks</span>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-center pa-4">
                  <v-icon size="64" color="success" class="mb-2">mdi-trending-up</v-icon>
                  <div class="text-h2 font-weight-bold text-success">{{ streaksStore.currentWinStreak }}</div>
                  <div class="text-subtitle-1">Current Win Streak</div>
                  <v-chip 
                    v-if="streaksStore.currentWinStreak >= 5" 
                    color="success" 
                    size="small" 
                    class="mt-2"
                  >
                    On Fire!
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-center pa-4">
                  <v-icon size="64" color="error" class="mb-2">mdi-trending-down</v-icon>
                  <div class="text-h2 font-weight-bold text-error">{{ streaksStore.currentLossStreak }}</div>
                  <div class="text-subtitle-1">Current Loss Streak</div>
                  <v-chip 
                    v-if="streaksStore.currentLossStreak >= 3" 
                    color="warning" 
                    size="small" 
                    class="mt-2"
                  >
                    Time to Bounce Back
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="primary">mdi-trophy</v-icon>
            <span class="font-weight-bold">Personal Records</span>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-primary">{{ records.mostConsecutiveWins }}</div>
                  <div class="text-caption text-medium-emphasis">Longest Win Streak</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-error">{{ records.mostConsecutiveLosses }}</div>
                  <div class="text-caption text-medium-emphasis">Longest Loss Streak</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-success">{{ records.totalWins }}</div>
                  <div class="text-caption text-medium-emphasis">Total Wins</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-info">{{ records.totalMatches }}</div>
                  <div class="text-caption text-medium-emphasis">Total Matches</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="modern-card" elevation="3">
          <v-card-title class="modern-card-title">
            <v-icon class="mr-2" color="accent">mdi-star</v-icon>
            <span class="font-weight-bold">Milestones & Achievements</span>
            <v-spacer></v-spacer>
            <v-btn 
              icon="mdi-refresh" 
              size="small" 
              variant="text" 
              @click="checkForNewMilestones"
              :loading="streaksStore.loading"
            ></v-btn>
          </v-card-title>
          <v-divider class="mx-4"></v-divider>
          <v-card-text v-if="streaksStore.milestones.length === 0" class="text-center text-medium-emphasis pa-6">
            No milestones yet. Keep playing matches to unlock achievements!
          </v-card-text>
          <v-list v-else class="pa-2">
            <v-list-item
              v-for="milestone in streaksStore.milestones"
              :key="milestone.id"
              class="modern-list-item mb-2"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-avatar 
                  :color="getMilestoneColor(milestone.category)" 
                  size="48"
                >
                  <v-icon color="white">{{ getMilestoneIcon(milestone.type) }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">{{ milestone.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ milestone.description }}</v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-caption text-medium-emphasis mr-2">
                  {{ formatDate(milestone.date) }}
                </div>
                <v-btn 
                  icon="mdi-delete" 
                  size="small" 
                  variant="text" 
                  color="error"
                  @click="confirmDelete(milestone)"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Milestone</v-card-title>
        <v-card-text>Are you sure you want to delete this milestone?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteMilestone">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStreaksStore } from '../stores/streaks'
import { useMatchesStore } from '../stores/matches'
import { useTournamentsStore } from '../stores/tournaments'
import { useOpponentsStore } from '../stores/opponents'
import { formatDate } from '../utils/date'

const streaksStore = useStreaksStore()
const matchesStore = useMatchesStore()
const tournamentsStore = useTournamentsStore()
const opponentsStore = useOpponentsStore()
const deleteDialog = ref(false)
const milestoneToDelete = ref(null)

const records = computed(() => streaksStore.personalRecords)

onMounted(async () => {
  await Promise.all([
    matchesStore.fetchMatches(),
    tournamentsStore.fetchTournaments(),
    opponentsStore.fetchOpponents(),
    streaksStore.fetchMilestones()
  ])
  await checkForNewMilestones()
})

const checkForNewMilestones = async () => {
  await streaksStore.checkMilestones()
  await streaksStore.fetchMilestones()
}

const getMilestoneColor = (category) => {
  switch (category) {
    case 'achievement':
      return 'success'
    case 'record':
      return 'primary'
    case 'milestone':
      return 'accent'
    default:
      return 'primary'
  }
}

const getMilestoneIcon = (type) => {
  switch (type) {
    case 'matches':
      return 'mdi-trophy'
    case 'wins':
      return 'mdi-star'
    case 'streak':
      return 'mdi-fire'
    case 'longest_streak':
      return 'mdi-chart-line'
    case 'tournament_top4':
      return 'mdi-trophy-variant'
    case 'tournament_final_win':
      return 'mdi-trophy-award'
    case 'tournament_quarter_final':
      return 'mdi-medal'
    case 'tournament_semi_final':
      return 'mdi-medal-outline'
    case 'tournament_final_reached':
      return 'mdi-trophy-variant-outline'
    default:
      return 'mdi-trophy'
  }
}

const confirmDelete = (milestone) => {
  milestoneToDelete.value = milestone
  deleteDialog.value = true
}

const deleteMilestone = async () => {
  if (milestoneToDelete.value) {
    await streaksStore.deleteMilestone(milestoneToDelete.value.id)
    deleteDialog.value = false
    milestoneToDelete.value = null
  }
}
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

