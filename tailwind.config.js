import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Display style switch (per user): classes prefixed with `klassiek:` only apply
    // inside an element with class "stijl-klassiek" (the original colourful look).
    plugin(({ addVariant }) => {
      addVariant('klassiek', '.stijl-klassiek &');
    }),
  ],
}
