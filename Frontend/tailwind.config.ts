import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"],
      },
      colors: {
        // Deep Indigo Palette
        indigo: {
          950: "#0B1120",
          900: "#0F172A",
          800: "#1E3A8A",
          700: "#1D4ED8",
          600: "#4F46E5",
          500: "#6366F1",
          400: "#818CF8",
          300: "#A5B4FC",
        },
        // Emerald for income
        emerald: {
          500: "#10B981",
          400: "#34D399",
        },
        // Rose for expense
        rose: {
          500: "#EF4444",
          400: "#FB7185",
        },
        // Amber/gold for premium highlights
        amber: {
          500: "#F59E0B",
          400: "#FBBF24",
        },
      },
      backgroundImage: {
        "gradient-indigo": "linear-gradient(135deg, #1E3A8A 0%, #4F46E5 50%, #6366F1 100%)",
        "gradient-emerald": "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        "gradient-rose": "linear-gradient(135deg, #EF4444 0%, #FB7185 100%)",
        "gradient-amber": "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
        "gradient-dark": "linear-gradient(180deg, #0B1120 0%, #0F172A 100%)",
        "gradient-light": "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        "glass": "0px 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        "glass-dark": "0px 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glow-indigo": "0 0 20px rgba(99,102,241,0.35)",
        "glow-emerald": "0 0 20px rgba(16,185,129,0.35)",
        "glow-rose": "0 0 20px rgba(239,68,68,0.35)",
        "glow-amber": "0 0 20px rgba(245,158,11,0.35)",
        "card": "0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -10px rgba(0,0,0,0.1)",
        "card-dark": "0 4px 6px -1px rgba(0,0,0,0.3), 0 20px 40px -10px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
        "4xl": "28px",
      },
      backdropBlur: {
        xs: "4px",
      },
      animation: {
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
