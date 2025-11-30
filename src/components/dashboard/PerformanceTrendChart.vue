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
  monthlyData: {
    type: Array,
    required: true
  }
})

const chartData = computed(() => {
  const labels = props.monthlyData.map(d => {
    const [year, month] = d.month.split('-')
    return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  })

  return {
    labels,
    datasets: [
      {
        label: 'Win Rate %',
        data: props.monthlyData.map(d => parseFloat(d.winRate)),
        borderColor: 'rgba(25, 118, 210, 1)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
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
      text: 'Monthly Win Rate Trend'
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const data = props.monthlyData[context.dataIndex]
          return [
            `Win Rate: ${context.parsed.y}%`,
            `Wins: ${data.wins}`,
            `Losses: ${data.losses}`,
            `Total Matches: ${data.matches}`
          ]
        }
      }
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


