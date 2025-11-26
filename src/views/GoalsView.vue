<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Goals</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openGoalDialog()">
          Add Goal
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="goal in goalsStore.goals" :key="goal.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">{{ getGoalIcon(goal.type) }}</v-icon>
            {{ goal.title }}
            <v-spacer></v-spacer>
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="openGoalDialog(goal)"></v-btn>
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(goal)"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="mb-2">{{ goal.description }}</div>
            <div class="text-caption text-medium-emphasis mb-3">
              Target: {{ formatGoalTarget(goal) }}
              <span v-if="goal.targetDate">
                by {{ formatDate(goal.targetDate) }}
              </span>
            </div>
            <v-progress-linear
              :model-value="getGoalProgress(goal)"
              :color="getProgressColor(goal)"
              height="20"
              rounded
            >
              <template v-slot:default="{ value }">
                <strong>{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>
            <div class="text-caption mt-2">
              Current: {{ getCurrentValue(goal) }} / {{ goal.targetValue }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="goalDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingGoal ? 'Edit Goal' : 'Add Goal' }}</v-card-title>
        <v-card-text>
          <v-form ref="goalForm">
            <v-text-field
              v-model="formData.title"
              label="Goal Title"
              variant="outlined"
              :rules="[v => !!v || 'Title is required']"
            ></v-text-field>

            <v-textarea
              v-model="formData.description"
              label="Description"
              variant="outlined"
              rows="3"
            ></v-textarea>

            <v-select
              v-model="formData.type"
              :items="goalTypes"
              item-title="label"
              item-value="value"
              label="Goal Type"
              variant="outlined"
              :rules="[v => !!v || 'Type is required']"
            ></v-select>

            <v-text-field
              v-model.number="formData.targetValue"
              label="Target Value"
              type="number"
              variant="outlined"
              :rules="[v => !!v || 'Target value is required', v => v > 0 || 'Must be greater than 0']"
            ></v-text-field>

            <v-text-field
              v-model="formData.targetDate"
              label="Target Date (Optional)"
              type="date"
              variant="outlined"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeGoalDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveGoal">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Goal</v-card-title>
        <v-card-text>Are you sure you want to delete this goal?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteGoal">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGoalsStore } from '../stores/goals'
import { useMatchesStore } from '../stores/matches'
import { formatDate } from '../utils/date'

const goalsStore = useGoalsStore()
const matchesStore = useMatchesStore()

const goalDialog = ref(false)
const deleteDialog = ref(false)
const editingGoal = ref(null)
const goalToDelete = ref(null)
const goalForm = ref(null)

const goalTypes = [
  { label: 'Win Rate', value: 'winRate' },
  { label: 'Total Matches', value: 'totalMatches' },
  { label: 'Wins', value: 'wins' },
  { label: 'Sets Won', value: 'setsWon' }
]

const formData = ref({
  title: '',
  description: '',
  type: '',
  targetValue: null,
  targetDate: null
})

const goals = computed(() => goalsStore.goals)

onMounted(async () => {
  await Promise.all([
    goalsStore.fetchGoals(),
    matchesStore.fetchMatches()
  ])
})

const openGoalDialog = (goal = null) => {
  if (goal) {
    editingGoal.value = goal
    formData.value = {
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      targetValue: goal.targetValue,
      targetDate: goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : null
    }
  } else {
    editingGoal.value = null
    formData.value = {
      title: '',
      description: '',
      type: '',
      targetValue: null,
      targetDate: null
    }
  }
  goalDialog.value = true
}

const closeGoalDialog = () => {
  goalDialog.value = false
  editingGoal.value = null
}

const saveGoal = async () => {
  const { valid } = await goalForm.value.validate()
  if (!valid) return

  try {
    const goalData = {
      ...formData.value,
      targetDate: formData.value.targetDate ? new Date(formData.value.targetDate) : null
    }

    if (editingGoal.value) {
      await goalsStore.updateGoal(editingGoal.value.id, goalData)
    } else {
      await goalsStore.addGoal(goalData)
    }
    closeGoalDialog()
  } catch (error) {
    console.error('Error saving goal:', error)
  }
}

const confirmDelete = (goal) => {
  goalToDelete.value = goal
  deleteDialog.value = true
}

const deleteGoal = async () => {
  try {
    await goalsStore.deleteGoal(goalToDelete.value.id)
    deleteDialog.value = false
    goalToDelete.value = null
  } catch (error) {
    console.error('Error deleting goal:', error)
  }
}

const getGoalIcon = (type) => {
  const icons = {
    winRate: 'mdi-percent',
    totalMatches: 'mdi-trophy',
    wins: 'mdi-trophy-award',
    setsWon: 'mdi-numeric'
  }
  return icons[type] || 'mdi-target'
}

const formatGoalTarget = (goal) => {
  if (goal.type === 'winRate') {
    return `${goal.targetValue}%`
  }
  return goal.targetValue
}

const getCurrentValue = (goal) => {
  switch (goal.type) {
    case 'winRate':
      return parseFloat(matchesStore.winPercentage).toFixed(1)
    case 'totalMatches':
      return matchesStore.totalMatches
    case 'wins':
      return matchesStore.winLossRecord.wins
    case 'setsWon':
      return matchesStore.advancedStats.totalSetsWon
    default:
      return 0
  }
}

const getGoalProgress = (goal) => {
  const current = parseFloat(getCurrentValue(goal))
  const target = parseFloat(goal.targetValue)
  if (target === 0) return 0
  const progress = (current / target) * 100
  return Math.min(progress, 100)
}

const getProgressColor = (goal) => {
  const progress = getGoalProgress(goal)
  if (progress >= 100) return 'success'
  if (progress >= 75) return 'info'
  if (progress >= 50) return 'warning'
  return 'error'
}
</script>

