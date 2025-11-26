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
  setsTrend: {
    type: Array,
    required: true
  }
})

const chartData = computed(() => {
  const groupedData = {}
  
  props.setsTrend.forEach(match => {
    const dateKey = match.date.toISOString().split('T')[0]
    if (!groupedData[dateKey]) {
      groupedData[dateKey] = { setsWon: 0, setsLost: 0 }
    }
    groupedData[dateKey].setsWon += match.setsWon
    groupedData[dateKey].setsLost += match.setsLost
  })

  const sortedDates = Object.keys(groupedData).sort()
  const sampleSize = Math.min(20, sortedDates.length)
  const step = Math.max(1, Math.floor(sortedDates.length / sampleSize))
  
  const labels = []
  const setsWonData = []
  const setsLostData = []

  sortedDates.forEach((date, index) => {
    if (index % step === 0 || index === sortedDates.length - 1) {
      const data = groupedData[date]
      labels.push(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      setsWonData.push(data.setsWon)
      setsLostData.push(data.setsLost)
    }
  })

  return {
    labels,
    datasets: [
      {
        label: 'Sets Won',
        data: setsWonData,
        borderColor: 'rgba(76, 175, 80, 1)',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Sets Lost',
        data: setsLostData,
        borderColor: 'rgba(244, 67, 54, 1)',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    title: {
      display: true,
      text: 'Sets Won/Lost Trend'
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

