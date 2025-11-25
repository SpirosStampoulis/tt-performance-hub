<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  recordByDivision: {
    type: Object,
    required: true
  }
})

const chartData = computed(() => {
  const divisions = Object.keys(props.recordByDivision)
  const wins = divisions.map(div => props.recordByDivision[div].wins)
  const losses = divisions.map(div => props.recordByDivision[div].losses)

  return {
    labels: divisions,
    datasets: [
      {
        label: 'Wins',
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        data: wins
      },
      {
        label: 'Losses',
        backgroundColor: 'rgba(244, 67, 54, 0.7)',
        data: losses
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    title: {
      display: true,
      text: 'Performance by Tournament'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
}
</script>

