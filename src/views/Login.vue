<template>
  <v-container class="fill-height login-container" fluid>
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card class="login-card" elevation="8">
          <div class="login-header">
            <v-icon size="48" color="white" class="mb-3">mdi-table-tennis</v-icon>
            <div class="text-h4 text-white font-weight-bold mb-2">TT Performance Hub</div>
            <div class="text-body-1 text-white text-opacity-90">Login to continue</div>
          </div>
          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleLogin" ref="loginForm">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
                required
                class="mb-4"
                rounded="lg"
              ></v-text-field>
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                variant="outlined"
                prepend-inner-icon="mdi-lock"
                :rules="[v => !!v || 'Password is required']"
                required
                class="mb-4"
                rounded="lg"
              ></v-text-field>
              <v-alert v-if="error" type="error" density="compact" class="mb-4" rounded="lg">{{ error }}</v-alert>
              <v-btn 
                type="submit" 
                color="primary" 
                block 
                size="large"
                :loading="loggingIn"
                prepend-icon="mdi-login"
                rounded="lg"
                elevation="2"
              >
                Login
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login } = useAuth()
const email = ref('')
const password = ref('')
const error = ref('')
const loggingIn = ref(false)
const loginForm = ref(null)

const handleLogin = async () => {
  const { valid } = await loginForm.value.validate()
  if (!valid) return

  try {
    error.value = ''
    loggingIn.value = true
    await login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message || 'Invalid email or password'
  } finally {
    loggingIn.value = false
  }
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #DC143C 0%, #C8102E 50%, #FFD700 100%);
  min-height: 100vh;
}

.login-card {
  border-radius: 24px;
  overflow: hidden;
}

.login-header {
  background: linear-gradient(135deg, #DC143C 0%, #C8102E 50%, #FFD700 100%);
  padding: 40px 32px;
  text-align: center;
}
</style>

