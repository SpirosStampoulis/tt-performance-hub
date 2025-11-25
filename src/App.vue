<template>
  <v-app>
    <template v-if="route.name !== 'Login'">
      <v-navigation-drawer v-model="drawer" app>
        <v-list>
          <v-list-item prepend-icon="mdi-table-tennis" title="TT Performance Hub" subtitle="Track Your Game"></v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list density="compact" nav>
          <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" value="dashboard" to="/"></v-list-item>
          <v-list-item prepend-icon="mdi-trophy" title="Matches" value="matches" to="/matches"></v-list-item>
          <v-list-item prepend-icon="mdi-tournament" title="Tournaments" value="tournaments" to="/tournaments"></v-list-item>
          <v-list-item prepend-icon="mdi-shield-account" title="League Management" value="leagues" to="/leagues"></v-list-item>
          <v-list-item prepend-icon="mdi-account-group" title="Opponents" value="opponents" to="/opponents"></v-list-item>
          <v-list-item prepend-icon="mdi-school" title="Skills" value="skills" to="/skills"></v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <v-btn block @click="toggleTheme" prepend-icon="mdi-theme-light-dark">
              Toggle Theme
            </v-btn>
            <v-btn block @click="handleLogout" prepend-icon="mdi-logout" class="mt-2" color="error" variant="outlined">
              Logout
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <v-app-bar app>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-magnify"></v-btn>
      </v-app-bar>
    </template>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuth } from './composables/useAuth'

const drawer = ref(true)
const route = useRoute()
const router = useRouter()
const theme = useTheme()
const { logout } = useAuth()

const pageTitle = computed(() => {
  const titles = {
    Dashboard: 'Dashboard',
    Matches: 'Match Tracker',
    MatchDetail: 'Match Details',
    Tournaments: 'Tournaments',
    LeagueManagement: 'League Management',
    Opponents: 'Opponents',
    OpponentDetail: 'Opponent Profile',
    Skills: 'Skill Library',
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
