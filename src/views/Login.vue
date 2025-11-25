<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="text-h5 text-center pa-6">
            <v-icon size="large" class="mr-2">mdi-table-tennis</v-icon>
            TT Performance Hub
          </v-card-title>
          <v-card-subtitle class="text-center pb-4">Login Required</v-card-subtitle>
          <v-divider></v-divider>
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
              ></v-text-field>
              <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
              <v-btn 
                type="submit" 
                color="primary" 
                block 
                size="large"
                :loading="loggingIn"
                prepend-icon="mdi-login"
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

