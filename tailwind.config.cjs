/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./articles/**/*.html",
    "./books/**/*.html",
    "./js/**/*.js",
    "./scripts/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
