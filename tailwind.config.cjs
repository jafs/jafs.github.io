/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    // No sobrescribimos colores, así que se usan todos los utilitarios por defecto
    extend: {},
  },
  plugins: [],
}
