/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B132B',       // Very dark blue
          deep: '#1C2541',       // Dark blue
          royal: '#3A506B',      // Slate blue
          primary: '#1E40AF',    // Royal Blue
          secondary: '#3B82F6',  // Bright Blue
          accent: '#60A5FA',     // Light Blue
          gray: '#F1F5F9',       // Light gray background
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
