import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Cores para HP e Chakra
        hp: "hsl(var(--hp-color))",
        chakra: "hsl(var(--chakra-color))",
      },
      backgroundImage: {
        // O gradiente que você gostou
        'ninja-gradient': "linear-gradient(to right, #f97316, #ef4444)",
        'ninja-gradient-hover': "linear-gradient(to right, #ea580c, #dc2626)",
        // Fundo ninja com padrão sutil
        'ninja-pattern': `
          radial-gradient(ellipse at top, rgba(249, 115, 22, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(239, 68, 68, 0.03) 0%, transparent 50%),
          repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            rgba(249, 115, 22, 0.01) 100px,
            rgba(249, 115, 22, 0.01) 200px
          )
        `,
      },
      boxShadow: {
        // O efeito de brilho (glow) laranja
        'ninja-glow': '0 0 20px rgba(249, 115, 22, 0.4)',
        'ninja-glow-intense': '0 0 30px rgba(249, 115, 22, 0.6)',
        // Glow para HP e Chakra
        'hp-glow': '0 0 10px rgba(239, 68, 68, 0.5)',
        'chakra-glow': '0 0 10px rgba(59, 130, 246, 0.5)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;