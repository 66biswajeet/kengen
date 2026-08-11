/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0C54A4",
          light: "#4CA3DD",
          dark: "#083A75",
          surface: "#E8F1F9",
        },
        accent: {
          DEFAULT: "#8D3E00",
          light: "#B56124",
          dark: "#6B2F00",
          surface: "#F5E6D9",
        },
        mist: "#F4F7FA",
        charcoal: "#1A1F2E",
        slate: "#75777D",
        success: "#2E9E6D",
        error: "#E5484D",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(12,84,164,0.07)",
        floating: "0 12px 40px rgba(0,0,0,0.12)",
        button: "0 4px 12px rgba(12,84,164,0.22)",
        accent: "0 4px 12px rgba(141,62,0,0.25)",
      },
      keyframes: {
        "slide-up": {
          from: { opacity: 0, transform: "translateY(24px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        "slide-up": "slide-up 400ms ease-out",
        "fade-in": "fade-in 300ms ease-out",
      },
    },
  },
  plugins: [],
};
