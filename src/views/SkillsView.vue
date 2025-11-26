<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openSkillDialog()">
          Add Skill
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-tabs v-model="selectedCategory" bg-color="primary">
          <v-tab value="all">All Skills</v-tab>
          <v-tab v-for="category in skillsStore.categories" :key="category" :value="category">
            {{ category }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col v-for="skill in displayedSkills" :key="skill.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title>
            {{ skill.name }}
            <v-spacer></v-spacer>
            <v-chip size="small" :color="getDifficultyColor(skill.difficulty)">
              {{ skill.difficulty }}
            </v-chip>
          </v-card-title>
          <v-card-subtitle>{{ skill.category }}</v-card-subtitle>
          <v-card-text>
            <div v-if="getCurrentRating(skill.id)" class="mb-3">
              <div class="text-caption text-medium-emphasis mb-1">Current Rating</div>
              <div class="d-flex align-center">
                <v-rating
                  :model-value="getCurrentRating(skill.id)"
                  readonly
                  size="small"
                  density="compact"
                  class="mr-2"
                ></v-rating>
                <span class="text-body-2">{{ getCurrentRating(skill.id) }}/5</span>
                <v-chip
                  v-if="getRatingTrend(skill.id)"
                  size="x-small"
                  :color="getRatingTrend(skill.id).isImproving ? 'success' : 'error'"
                  class="ml-2"
                >
                  <v-icon size="x-small" class="mr-1">
                    {{ getRatingTrend(skill.id).isImproving ? 'mdi-trending-up' : 'mdi-trending-down' }}
                  </v-icon>
                  {{ getRatingTrend(skill.id).change > 0 ? '+' : '' }}{{ getRatingTrend(skill.id).change.toFixed(1) }}
                </v-chip>
              </div>
            </div>
            <div v-if="skill.notes" class="mb-2" style="max-height: 100px; overflow: hidden">
              {{ skill.notes.substring(0, 150) }}{{ skill.notes.length > 150 ? '...' : '' }}
            </div>
            <div v-if="skill.videoUrls && skill.videoUrls.length > 0" class="text-caption">
              <v-icon size="small">mdi-video</v-icon> {{ skill.videoUrls.length }} tutorial(s)
            </div>
            <div v-if="skill.relatedSkills && skill.relatedSkills.length > 0" class="text-caption">
              <v-icon size="small">mdi-link</v-icon> {{ skill.relatedSkills.length }} related skill(s)
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn icon="mdi-star" size="small" @click="openRatingDialog(skill)" color="primary"></v-btn>
            <v-btn icon="mdi-pencil" size="small" @click="openSkillDialog(skill)"></v-btn>
            <v-btn icon="mdi-delete" size="small" color="error" @click="confirmDelete(skill)"></v-btn>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="viewSkillDetail(skill)">View Details</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="skillDialog" max-width="800" persistent>
      <v-card>
        <v-card-title>{{ editingSkill ? 'Edit Skill' : 'Add New Skill' }}</v-card-title>
        <v-card-text>
          <v-form ref="skillForm">
            <v-text-field
              v-model="formData.name"
              label="Skill Name"
              variant="outlined"
              :rules="[v => !!v || 'Skill name is required']"
            ></v-text-field>

            <v-select
              v-model="formData.category"
              :items="skillsStore.categories"
              label="Category"
              variant="outlined"
              :rules="[v => !!v || 'Category is required']"
            ></v-select>

            <v-card variant="outlined" class="mb-4">
              <v-card-subtitle>Difficulty Level</v-card-subtitle>
              <v-card-text>
                <v-slider
                  v-model="formData.difficulty"
                  :ticks="difficultyLabels"
                  :max="4"
                  step="1"
                  show-ticks="always"
                  tick-size="4"
                ></v-slider>
              </v-card-text>
            </v-card>

            <v-textarea
              v-model="formData.notes"
              label="Coaching Notes & Tips"
              variant="outlined"
              rows="4"
            ></v-textarea>

            <v-card variant="outlined" class="mb-4">
              <v-card-subtitle>YouTube Tutorial Links</v-card-subtitle>
              <v-card-text>
                <v-row v-for="(url, index) in formData.videoUrls" :key="index" align="center">
                  <v-col>
                    <v-text-field
                      v-model="formData.videoUrls[index]"
                      placeholder="https://www.youtube.com/watch?v=..."
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon="mdi-close" size="small" @click="removeVideoUrl(index)"></v-btn>
                  </v-col>
                </v-row>
                <v-btn prepend-icon="mdi-plus" size="small" @click="addVideoUrl">Add Video</v-btn>
              </v-card-text>
            </v-card>

            <v-select
              v-model="formData.relatedSkills"
              :items="availableRelatedSkills"
              item-title="name"
              item-value="id"
              label="Related Skills"
              variant="outlined"
              multiple
              chips
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeSkillDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveSkill">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="ratingDialog" max-width="500">
      <v-card v-if="ratingSkill">
        <v-card-title>Rate Skill: {{ ratingSkill.name }}</v-card-title>
        <v-card-text>
          <v-form ref="ratingForm">
            <v-text-field
              v-model="ratingFormData.date"
              label="Date"
              type="date"
              variant="outlined"
              :rules="[v => !!v || 'Date is required']"
            ></v-text-field>

            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Your Rating (1-5)</div>
              <v-rating
                v-model="ratingFormData.rating"
                :rules="[v => v > 0 || 'Please select a rating']"
                size="large"
                color="primary"
              ></v-rating>
            </div>

            <v-textarea
              v-model="ratingFormData.notes"
              label="Notes (Optional)"
              variant="outlined"
              rows="3"
              placeholder="What's your assessment? What needs work?"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeRatingDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveRating">Save Rating</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog" max-width="900">
      <v-card v-if="viewingSkill">
        <v-card-title>
          {{ viewingSkill.name }}
          <v-spacer></v-spacer>
          <v-chip :color="getDifficultyColor(viewingSkill.difficulty)">
            {{ getDifficultyLabel(viewingSkill.difficulty) }}
          </v-chip>
        </v-card-title>
        <v-card-subtitle>{{ viewingSkill.category }}</v-card-subtitle>
        <v-card-text>
          <div v-if="viewingSkill.notes" class="mb-4">
            <div class="text-h6 mb-2">Notes</div>
            <p style="white-space: pre-wrap">{{ viewingSkill.notes }}</p>
          </div>

          <div v-if="viewingSkill.videoUrls && viewingSkill.videoUrls.length > 0" class="mb-4">
            <div class="text-h6 mb-2">Tutorial Videos</div>
            <v-row>
              <v-col v-for="(video, index) in viewingSkill.videoUrls" :key="index" cols="12" md="6">
                <div class="video-container">
                  <iframe
                    :src="getYouTubeEmbedUrl(video)"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                </div>
              </v-col>
            </v-row>
          </div>

          <div v-if="relatedSkillsList.length > 0">
            <div class="text-h6 mb-2">Related Skills</div>
            <v-chip
              v-for="relatedSkill in relatedSkillsList"
              :key="relatedSkill.id"
              class="mr-2 mb-2"
              @click="viewSkillDetail(relatedSkill)"
            >
              {{ relatedSkill.name }}
            </v-chip>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn prepend-icon="mdi-pencil" @click="openSkillDialog(viewingSkill)">Edit</v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="detailDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Skill</v-card-title>
        <v-card-text>Are you sure you want to delete this skill?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteSkill">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSkillsStore } from '../stores/skills'
import { useSkillRatingsStore } from '../stores/skillRatings'
import { getYouTubeEmbedUrl } from '../utils/storage'

const skillsStore = useSkillsStore()
const skillRatingsStore = useSkillRatingsStore()

const selectedCategory = ref('all')
const skillDialog = ref(false)
const detailDialog = ref(false)
const deleteDialog = ref(false)
const ratingDialog = ref(false)
const editingSkill = ref(null)
const viewingSkill = ref(null)
const skillToDelete = ref(null)
const ratingSkill = ref(null)
const skillForm = ref(null)
const ratingForm = ref(null)

const difficultyLabels = {
  0: 'Beginner',
  1: 'Intermediate',
  2: 'Advanced',
  3: 'Expert',
  4: 'Professional'
}

const formData = ref({
  name: '',
  category: '',
  difficulty: 1,
  notes: '',
  videoUrls: [],
  relatedSkills: []
})

const ratingFormData = ref({
  date: new Date().toISOString().split('T')[0],
  rating: 0,
  notes: ''
})

onMounted(async () => {
  await Promise.all([
    skillsStore.fetchSkills(),
    skillRatingsStore.fetchRatings()
  ])
})

const displayedSkills = computed(() => {
  if (selectedCategory.value === 'all') {
    return skillsStore.skills
  }
  return skillsStore.skills.filter(s => s.category === selectedCategory.value)
})

const availableRelatedSkills = computed(() => {
  return skillsStore.skills.filter(s => s.id !== editingSkill.value?.id)
})

const relatedSkillsList = computed(() => {
  if (!viewingSkill.value?.relatedSkills) return []
  return skillsStore.skills.filter(s => viewingSkill.value.relatedSkills.includes(s.id))
})

const openSkillDialog = (skill = null) => {
  if (skill) {
    editingSkill.value = skill
    formData.value = {
      ...skill,
      videoUrls: skill.videoUrls ? [...skill.videoUrls] : [],
      relatedSkills: skill.relatedSkills ? [...skill.relatedSkills] : []
    }
  } else {
    editingSkill.value = null
    formData.value = {
      name: '',
      category: '',
      difficulty: 1,
      notes: '',
      videoUrls: [],
      relatedSkills: []
    }
  }
  detailDialog.value = false
  skillDialog.value = true
}

const closeSkillDialog = () => {
  skillDialog.value = false
  editingSkill.value = null
}

const addVideoUrl = () => {
  formData.value.videoUrls.push('')
}

const removeVideoUrl = (index) => {
  formData.value.videoUrls.splice(index, 1)
}

const saveSkill = async () => {
  const { valid } = await skillForm.value.validate()
  if (!valid) return

  const skillData = {
    ...formData.value,
    difficulty: getDifficultyLabel(formData.value.difficulty),
    videoUrls: formData.value.videoUrls.filter(url => url.trim() !== '')
  }

  try {
    if (editingSkill.value) {
      await skillsStore.updateSkill(editingSkill.value.id, skillData)
    } else {
      await skillsStore.addSkill(skillData)
    }
    closeSkillDialog()
  } catch (error) {
    console.error('Error saving skill:', error)
  }
}

const viewSkillDetail = (skill) => {
  viewingSkill.value = skill
  detailDialog.value = true
}

const confirmDelete = (skill) => {
  skillToDelete.value = skill
  deleteDialog.value = true
}

const deleteSkill = async () => {
  try {
    await skillsStore.deleteSkill(skillToDelete.value.id)
    deleteDialog.value = false
    skillToDelete.value = null
  } catch (error) {
    console.error('Error deleting skill:', error)
  }
}

const getDifficultyColor = (difficulty) => {
  const colors = {
    Beginner: 'success',
    Intermediate: 'info',
    Advanced: 'warning',
    Expert: 'error',
    Professional: 'purple'
  }
  return colors[difficulty] || 'grey'
}

const openRatingDialog = (skill) => {
  ratingSkill.value = skill
  ratingFormData.value = {
    date: new Date().toISOString().split('T')[0],
    rating: skillRatingsStore.getCurrentRating(skill.id) || 0,
    notes: ''
  }
  ratingDialog.value = true
}

const closeRatingDialog = () => {
  ratingDialog.value = false
  ratingSkill.value = null
}

const saveRating = async () => {
  const { valid } = await ratingForm.value.validate()
  if (!valid) return

  try {
    await skillRatingsStore.addRating({
      skillId: ratingSkill.value.id,
      rating: ratingFormData.value.rating,
      date: new Date(ratingFormData.value.date),
      notes: ratingFormData.value.notes || ''
    })
    closeRatingDialog()
  } catch (error) {
    console.error('Error saving rating:', error)
  }
}

const getCurrentRating = (skillId) => {
  return skillRatingsStore.getCurrentRating(skillId)
}

const getRatingTrend = (skillId) => {
  return skillRatingsStore.getRatingTrend(skillId)
}

const getDifficultyLabel = (value) => {
  if (typeof value === 'number') {
    return difficultyLabels[value]
  }
  return value
}
</script>

<style scoped>
.video-container {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>

