import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080a0f",
        surface: "#11141d",
        surfaceBorder: "#1e2433",
        accentPrimary: "#00d09c", // Groww signature green
      },
    },
  },
  plugins: [],
};
export default config;