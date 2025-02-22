/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        spotlight: "spotlight 2s ease .75s 1 forwards",
      },
      keyframes: {
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors],
}

function addVariablesForColors({ addBase, theme }) {
  let allColors = theme("colors"); // ✅ FIXED

  let newVars = Object.fromEntries(
    Object.entries(allColors).flatMap(([key, val]) => 
      typeof val === "string" ? [[`--${key}`, val]] : Object.entries(val).map(([shade, color]) => [`--${key}-${shade}`, color])
    )
  );

  addBase({
    ":root": newVars,
  });
}
