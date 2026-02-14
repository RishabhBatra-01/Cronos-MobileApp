/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#820AD1', // Nu Purple
          dark: '#5c0296',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E8D9F5', // Light Lavender
          foreground: '#820AD1',
        },
      },
    },
  },
  plugins: [],
}
