<template>
  <Line :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  matches: {
    type: Array,
    required: true
  }
})

const chartData = computed(() => {
  const sortedMatches = [...props.matches].sort((a, b) => a.date - b.date)
  
  const labels = []
  const winRates = []
  let wins = 0
  let total = 0

  sortedMatches.forEach((match, index) => {
    total++
    const myTotal = match.scores.reduce((sum, s) => sum + s.myScore, 0)
    const oppTotal = match.scores.reduce((sum, s) => sum + s.oppScore, 0)
    
    if (myTotal > oppTotal) wins++
    
    const winRate = (wins / total) * 100
    
    if (index % Math.max(1, Math.floor(sortedMatches.length / 10)) === 0 || index === sortedMatches.length - 1) {
      labels.push(match.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      winRates.push(winRate.toFixed(1))
    }
  })

  return {
    labels,
    datasets: [
      {
        label: 'Win Rate %',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        borderColor: 'rgba(25, 118, 210, 1)',
        data: winRates,
        tension: 0.4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: 'Win Rate Trend'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: (value) => value + '%'
      }
    }
  }
}
</script>

