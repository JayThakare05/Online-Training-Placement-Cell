/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E95918", // our orange accent
      },
      fontFamily: {
        sans: ["Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
}
