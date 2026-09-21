/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        arts: {
          light: '#fdf4ff',
          badge: '#fae8ff',
          text: '#a21caf',
          border: '#f0abfc',
          accent: '#d946ef',
          darkBg: 'rgba(217, 70, 239, 0.08)'
        },
        sports: {
          light: '#eff6ff',
          badge: '#dbeafe',
          text: '#1d4ed8',
          border: '#93c5fd',
          accent: '#3b82f6',
          darkBg: 'rgba(59, 130, 246, 0.08)'
        },
        linear: {
          surface: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          accent: '#58a6ff',
          highlight: '#1f2937'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-arts': '0 0 20px -5px rgba(217, 70, 239, 0.35)',
        'glow-sports': '0 0 20px -5px rgba(59, 130, 246, 0.35)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.35)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
