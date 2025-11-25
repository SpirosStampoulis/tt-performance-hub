<template>
  <v-alert
    v-if="error"
    type="error"
    variant="tonal"
    closable
    @click:close="$emit('close')"
  >
    {{ error }}
  </v-alert>
</template>

<script setup>
defineProps({
  error: {
    type: String,
    default: null
  }
})

defineEmits(['close'])
</script>

