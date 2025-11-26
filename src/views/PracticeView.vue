<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4">Practice Log</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openPracticeDialog()">
          Add Practice Session
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="session in practiceStore.practiceSessions" :key="session.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-dumbbell</v-icon>
            {{ formatDate(session.date) }}
            <v-spacer></v-spacer>
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="openPracticeDialog(session)"></v-btn>
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(session)"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div v-if="session.duration" class="mb-2">
              <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
              Duration: {{ session.duration }} minutes
            </div>
            <div v-if="session.focusAreas && session.focusAreas.length > 0" class="mb-2">
              <div class="text-caption text-medium-emphasis mb-1">Focus Areas:</div>
              <v-chip
                v-for="area in session.focusAreas"
                :key="area"
                size="small"
                class="mr-1 mb-1"
              >
                {{ area }}
              </v-chip>
            </div>
            <div v-if="session.notes" class="mt-2">
              <div class="text-caption text-medium-emphasis mb-1">Notes:</div>
              <p class="text-body-2" style="white-space: pre-wrap">{{ session.notes }}</p>
            </div>
            <div v-if="session.drills && session.drills.length > 0" class="mt-2">
              <div class="text-caption text-medium-emphasis mb-1">Drills:</div>
              <ul class="text-body-2">
                <li v-for="drill in session.drills" :key="drill">{{ drill }}</li>
              </ul>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="practiceDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>{{ editingSession ? 'Edit Practice Session' : 'Add Practice Session' }}</v-card-title>
        <v-card-text>
          <v-form ref="practiceForm">
            <v-text-field
              v-model="formData.date"
              label="Date"
              type="date"
              variant="outlined"
              :rules="[v => !!v || 'Date is required']"
            ></v-text-field>

            <v-text-field
              v-model.number="formData.duration"
              label="Duration (minutes)"
              type="number"
              variant="outlined"
              :min="1"
            ></v-text-field>

            <v-combobox
              v-model="formData.focusAreas"
              :items="focusAreaOptions"
              label="Focus Areas"
              variant="outlined"
              multiple
              chips
              closable-chips
            ></v-combobox>

            <v-combobox
              v-model="formData.drills"
              :items="drillOptions"
              label="Drills Practiced"
              variant="outlined"
              multiple
              chips
              closable-chips
            ></v-combobox>

            <v-textarea
              v-model="formData.notes"
              label="Notes"
              variant="outlined"
              rows="4"
              placeholder="What did you work on? What went well? What needs improvement?"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closePracticeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="savePractice">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Practice Session</v-card-title>
        <v-card-text>Are you sure you want to delete this practice session?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deletePractice">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePracticeStore } from '../stores/practice'
import { formatDate } from '../utils/date'

const practiceStore = usePracticeStore()

const practiceDialog = ref(false)
const deleteDialog = ref(false)
const editingSession = ref(null)
const sessionToDelete = ref(null)
const practiceForm = ref(null)

const focusAreaOptions = [
  'Forehand',
  'Backhand',
  'Serve',
  'Return',
  'Footwork',
  'Spin',
  'Power',
  'Control',
  'Strategy',
  'Mental Game'
]

const drillOptions = [
  'Multi-ball',
  'Shadow Play',
  'Serve Practice',
  'Return Practice',
  'Footwork Drills',
  'Point Play',
  'Match Simulation'
]

const formData = ref({
  date: new Date().toISOString().split('T')[0],
  duration: null,
  focusAreas: [],
  drills: [],
  notes: ''
})

onMounted(async () => {
  await practiceStore.fetchPracticeSessions()
})

const openPracticeDialog = (session = null) => {
  if (session) {
    editingSession.value = session
    formData.value = {
      date: session.date.toISOString().split('T')[0],
      duration: session.duration || null,
      focusAreas: session.focusAreas || [],
      drills: session.drills || [],
      notes: session.notes || ''
    }
  } else {
    editingSession.value = null
    formData.value = {
      date: new Date().toISOString().split('T')[0],
      duration: null,
      focusAreas: [],
      drills: [],
      notes: ''
    }
  }
  practiceDialog.value = true
}

const closePracticeDialog = () => {
  practiceDialog.value = false
  editingSession.value = null
}

const savePractice = async () => {
  const { valid } = await practiceForm.value.validate()
  if (!valid) return

  try {
    const sessionData = {
      ...formData.value,
      date: new Date(formData.value.date)
    }

    if (editingSession.value) {
      await practiceStore.updatePracticeSession(editingSession.value.id, sessionData)
    } else {
      await practiceStore.addPracticeSession(sessionData)
    }
    closePracticeDialog()
  } catch (error) {
    console.error('Error saving practice session:', error)
  }
}

const confirmDelete = (session) => {
  sessionToDelete.value = session
  deleteDialog.value = true
}

const deletePractice = async () => {
  try {
    await practiceStore.deletePracticeSession(sessionToDelete.value.id)
    deleteDialog.value = false
    sessionToDelete.value = null
  } catch (error) {
    console.error('Error deleting practice session:', error)
  }
}
</script>

