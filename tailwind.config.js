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
        aws: {
          squid: '#232f3e',     // AWS dark navy header
          squidDark: '#131921', // AWS dark footer/subnav
          orange: '#ec7211',    // AWS primary orange
          orangeHover: '#eb5f07',
          blue: '#0073bb',      // AWS link blue
          blueHover: '#005f9e',
          grayBg: '#f2f3f3',    // AWS light background
          border: '#eaeded',
          darkBg: '#0f172a',
          darkCard: '#1e293b',
          darkBorder: '#334155',
        },
        alarm: {
          ok: '#1d8102',        // CloudWatch green
          alarm: '#d13212',     // CloudWatch red
          insufficient: '#ff9900', // CloudWatch yellow/orange
        }
      },
    },
  },
  plugins: [],
}
