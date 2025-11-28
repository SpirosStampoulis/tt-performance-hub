import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#DC143C',
          secondary: '#FFD700',
          accent: '#FF6B35',
          error: '#C8102E',
          info: '#3B82F6',
          success: '#10B981',
          warning: '#FCD116',
          surface: '#FFFFFF',
          background: '#F8FAFC',
        },
      },
      dark: {
        colors: {
          primary: '#818CF8',
          secondary: '#A78BFA',
          accent: '#F472B6',
          error: '#F87171',
          info: '#60A5FA',
          success: '#34D399',
          warning: '#FBBF24',
          surface: '#1E293B',
          background: '#0F172A',
        },
      },
    },
  },
})

