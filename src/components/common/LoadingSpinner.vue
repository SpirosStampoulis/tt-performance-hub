<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="auto">
        <v-progress-circular indeterminate color="primary" :size="size"></v-progress-circular>
        <div v-if="message" class="text-center mt-4">{{ message }}</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
defineProps({
  size: {
    type: Number,
    default: 64
  },
  message: {
    type: String,
    default: ''
  }
})
</script>

