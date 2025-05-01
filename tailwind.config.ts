
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        campus: {
          DEFAULT: "#141621",
          header: "#141621",
          bg: "#0F1015",
          accent: "#8E6BF5",
          purple: "#8E6BF5",
          pink: "#FF6B95",
          "light-bg": "#F8F9FC",
          "light-header": "#FFFFFF"
        },
        status: {
          active: "#10B981",
          pending: "#F59E0B",
          error: "#EF4444"
        },
        interest: {
          high: "#8E6BF5",
          medium: "#FF6B95",
          low: "#9CA3AF"
        },
        dark: {
          100: "#141621",
          200: "#191B28", 
          300: "#1E2044",
          400: "#222333",
          500: "#282A3A",
          card: "#141621CC",
          glass: "#14162199",
          border: "rgba(255, 255, 255, 0.05)"
        },
        light: {
          100: "#FFFFFF",
          200: "#F8F9FC",
          300: "#F1F3F9",
          400: "#E5E7F0",
          500: "#D0D5E1",
          card: "#FFFFFFCC",
          glass: "#FFFFFF99",
          border: "rgba(0, 0, 0, 0.05)"
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'pulse-light': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(142, 107, 245, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(142, 107, 245, 0.4)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
        'slide-in': 'slide-in 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
        'pulse-light': 'pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 3s ease-in-out infinite'
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(to bottom right, rgba(20, 22, 33, 0.7), rgba(20, 22, 33, 0.5))',
        'card-gradient': 'linear-gradient(145deg, rgba(20, 22, 33, 0.85) 0%, rgba(25, 27, 40, 0.85) 100%)',
        'auth-gradient': 'linear-gradient(145deg, rgba(20, 22, 33, 0.9) 0%, rgba(30, 32, 53, 0.8) 100%)',
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addVariant }) {
      addVariant('light', '.light &');
    }
  ],
} satisfies Config

export default config
