<template>
  <v-app>
    <template v-if="route.name !== 'Login'">
      <v-navigation-drawer v-model="drawer" app class="modern-drawer">
        <div class="drawer-header">
          <div class="drawer-header-content">
            <img 
              :src="topSpainLogo" 
              alt="Topspin Logo" 
              class="topspin-logo mb-3"
            />
            <div class="text-h6 font-weight-bold text-white">TT Performance Hub</div>
            <div class="text-caption text-white text-opacity-75">Track Your Game</div>
          </div>
        </div>

        <v-divider class="mx-4 my-2"></v-divider>

        <v-list density="comfortable" nav class="px-2">
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            value="dashboard"
            to="/"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-trophy"
            title="Matches"
            value="matches"
            to="/matches"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-shield-account"
            title="MTTA League"
            value="leagues"
            to="/leagues"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-trophy-variant"
            title="Tournament"
            value="tournament"
            to="/tournaments/manage"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Tournament Management"
            value="tournament-management"
            to="/tournaments"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            v-if="!isGuest"
            prepend-icon="mdi-calendar"
            title="Calendar"
            value="calendar"
            to="/calendar"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-account-group-outline"
            title="Teams"
            value="teams"
            to="/teams"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-account-group"
            title="Players"
            value="opponents"
            to="/opponents"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            v-if="!isGuest"
            prepend-icon="mdi-school"
            title="Skills"
            value="skills"
            to="/skills"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            v-if="!isGuest"
            prepend-icon="mdi-fire"
            title="Streaks"
            value="streaks"
            to="/streaks"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-crystal-ball"
            title="Match Prediction"
            value="match-prediction"
            to="/match-prediction"
            class="modern-nav-item"
            rounded="lg"
          ></v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-3">
            <v-btn
              block
              @click="handleLogout"
              prepend-icon="mdi-logout"
              color="error"
              variant="elevated"
              rounded="lg"
            >
              Logout
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <v-app-bar app elevation="2" class="modern-app-bar">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title class="font-weight-bold">{{ pageTitle }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip v-if="isGuest" color="warning" variant="flat" prepend-icon="mdi-account-outline" class="mr-2">
          Guest Mode
        </v-chip>
      </v-app-bar>
    </template>

    <v-main class="modern-main">
      <div class="main-content">
        <router-view></router-view>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuth } from './composables/useAuth'
import topSpainLogo from './assets/topspin logo white wording.png'

const drawer = ref(true)
const route = useRoute()
const router = useRouter()
const theme = useTheme()
const { logout, isGuest } = useAuth()

const pageTitle = computed(() => {
  // Check if we're on tournaments page with League filter
  if (route.name === 'Tournaments' && route.query.type === 'League') {
    return 'MTTA League'
  }
  
  const titles = {
    Dashboard: 'Dashboard',
    Matches: 'Match Tracker',
    MatchDetail: 'Match Details',
    Calendar: 'Match Calendar',
    Tournaments: route.query.type ? `Tournaments - ${route.query.type}` : 'Tournament Management',
    TournamentManagement: 'Tournament',
    LeagueManagement: 'MTTA League',
    Teams: 'Teams',
    Opponents: 'Players',
    OpponentDetail: 'Player Profile',
    Skills: 'Skill Library',
    Streaks: 'Streaks & Milestones',
    MatchPrediction: 'Match Prediction',
    Login: 'Login'
  }
  return titles[route.name] || 'TT Performance Hub'
})

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.modern-drawer {
  background: linear-gradient(180deg, #DC143C 0%, #C8102E 50%, #FFD700 100%);
}

.drawer-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  padding: 24px 16px;
  margin: 8px;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.drawer-header-content {
  text-align: center;
}

.topspin-logo {
  max-width: 180px;
  width: 100%;
  height: auto;
  margin: 0 auto;
  display: block;
}

.modern-nav-item {
  margin-bottom: 4px;
  transition: all 0.3s ease;
  color: white !important;
}

.modern-nav-item :deep(.v-list-item__prepend) {
  margin-inline-end: 12px;
  color: white !important;
}

.modern-nav-item :deep(.v-list-item__content) {
  font-weight: 500;
  color: white !important;
}

.modern-nav-item :deep(.v-list-item-title) {
  color: white !important;
}

.modern-nav-item:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  transform: translateX(4px);
}

.modern-nav-item.v-list-item--active {
  background: rgba(255, 255, 255, 0.25) !important;
  border-left: 4px solid white;
  font-weight: 600;
  color: white !important;
}

.modern-action-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modern-app-bar {
  background: linear-gradient(135deg, #DC143C 0%, #C8102E 50%, #FFD700 100%) !important;
}

.modern-app-bar :deep(.v-toolbar-title) {
  color: white;
}

.modern-app-bar :deep(.v-btn) {
  color: white;
}

.modern-main {
  background: linear-gradient(135deg, #FFF5F5 0%, #FFF9E6 30%, #FFF4E6 60%, #FFE6E6 100%);
  min-height: 100vh;
  position: relative;
}

.modern-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(220, 20, 60, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(200, 16, 46, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.main-content {
  position: relative;
  z-index: 1;
}
</style>

<style>
/* Global Modern Styles */
.v-container {
  max-width: 1400px;
}

.v-card {
  border-radius: 16px !important;
  background: white !important;
}

.v-btn {
  text-transform: none !important;
  font-weight: 500 !important;
}

.v-text-field,
.v-select,
.v-autocomplete {
  border-radius: 8px;
  background: white !important;
}

.v-chip {
  font-weight: 500;
}

.v-list-item {
  border-radius: 8px;
}

/* Smooth transitions for all interactive elements */
.v-card,
.v-btn,
.v-list-item,
.v-chip {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* Enhanced shadows with color */
.v-card {
  box-shadow: 0 2px 12px rgba(220, 20, 60, 0.15) !important;
  background: white !important;
}

.v-card:hover {
  box-shadow: 0 8px 24px rgba(220, 20, 60, 0.25) !important;
}

/* Modern input fields */
.v-field {
  border-radius: 8px;
  background: white !important;
}

.v-field--focused {
  box-shadow: 0 0 0 2px rgba(220, 20, 60, 0.3) !important;
}

/* Gradient text utility */
.gradient-text {
  background: linear-gradient(135deg, #DC143C 0%, #FFD700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Ensure text is readable */
.v-card-text,
.v-card-title,
.v-card-subtitle {
  color: rgba(0, 0, 0, 0.87) !important;
}

.v-list-item-title {
  color: rgba(0, 0, 0, 0.87) !important;
}

/* Fix white background under dropdown buttons */
.v-select :deep(.v-field__append-inner),
.v-autocomplete :deep(.v-field__append-inner),
.v-text-field :deep(.v-field__append-inner) {
  background: transparent !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.v-select :deep(.v-field__append-inner .v-btn),
.v-autocomplete :deep(.v-field__append-inner .v-btn),
.v-text-field :deep(.v-field__append-inner .v-btn) {
  background: transparent !important;
  box-shadow: none !important;
  margin: 0 !important;
}

.v-select :deep(.v-field__input),
.v-autocomplete :deep(.v-field__input),
.v-text-field :deep(.v-field__input) {
  background: white !important;
}

.v-select :deep(.v-field),
.v-autocomplete :deep(.v-field),
.v-text-field :deep(.v-field) {
  background: white !important;
}

/* Remove extra white space/padding under select buttons */
.v-select :deep(.v-field__append-inner::before),
.v-autocomplete :deep(.v-field__append-inner::before),
.v-select :deep(.v-field__append-inner::after),
.v-autocomplete :deep(.v-field__append-inner::after) {
  display: none !important;
}

/* Fix the field wrapper to remove extra background */
.v-select :deep(.v-field__wrapper),
.v-autocomplete :deep(.v-field__wrapper) {
  background: white !important;
}

/* Fix menu/dropdown background */
.v-menu :deep(.v-overlay__content),
.v-select :deep(.v-menu .v-overlay__content) {
  background: white !important;
}

/* Remove any extra background layers */
.v-select :deep(.v-field__prepend-inner),
.v-select :deep(.v-field__append-inner) {
  background: transparent !important;
}

/* Remove white background from v-input__details (messages area) */
.v-input__details {
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
}

.v-input__details::before,
.v-input__details::after {
  display: none !important;
}

/* Hide empty v-messages containers completely */
.v-messages {
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  height: 0 !important;
}

.v-messages:empty {
  display: none !important;
  height: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Hide v-input__details when empty or only has empty v-messages */
.v-input__details:empty,
.v-input__details:has(.v-messages:empty) {
  display: none !important;
  min-height: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Remove background from all input details */
.v-text-field .v-input__details,
.v-select .v-input__details,
.v-autocomplete .v-input__details,
.v-textarea .v-input__details {
  background: transparent !important;
  background-color: transparent !important;
}

/* Only show when there's actual message content */
.v-input__details:has(.v-messages__message:not(:empty)) {
  display: block !important;
  min-height: auto !important;
  height: auto !important;
}

/* Dialog close button styling */
.v-dialog .v-card-title {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.v-dialog .v-card-title .v-btn.dialog-close-btn,
.v-dialog .v-card-title .v-btn[icon="mdi-close"] {
  position: absolute;
  top: 8px;
  right: 8px;
  color: rgba(0, 0, 0, 0.6) !important;
  transition: all 0.3s ease;
  z-index: 1;
}

.v-dialog .v-card-title .v-btn.dialog-close-btn:hover,
.v-dialog .v-card-title .v-btn[icon="mdi-close"]:hover {
  color: #DC143C !important;
  background-color: rgba(220, 20, 60, 0.1) !important;
  transform: scale(1.1);
}

.v-dialog .v-card-title.dialog-header {
  padding-right: 48px;
}

.v-dialog .v-toolbar.dialog-header {
  position: relative;
  padding-right: 48px;
}

.v-dialog .v-toolbar .v-btn.dialog-close-btn,
.v-dialog .v-toolbar .v-btn[icon="mdi-close"] {
  position: absolute;
  top: 8px;
  right: 8px;
  color: rgba(0, 0, 0, 0.6) !important;
  transition: all 0.3s ease;
  z-index: 1;
}

.v-dialog .v-toolbar .v-btn.dialog-close-btn:hover,
.v-dialog .v-toolbar .v-btn[icon="mdi-close"]:hover {
  color: #DC143C !important;
  background-color: rgba(220, 20, 60, 0.1) !important;
  transform: scale(1.1);
}
</style>
