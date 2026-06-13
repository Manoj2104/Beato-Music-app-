import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Beato Design System
        ss: {
          bg: '#0a0a0a',
          surface: '#121212',
          elevated: '#16201a',
          hover: '#1f2d25',
          border: '#1f2e26',
          primary: '#1db954',
          'primary-hover': '#1ed760',
          secondary: '#10b981',
          accent: '#34d399',
          'text-primary': '#ffffff',
          'text-secondary': '#a3a3a3',
          'text-muted': '#525252',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'slide-up': 'slideUp 0.3s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'scale-in': 'scaleIn 0.2s ease forwards',
        'waveform': 'waveform 1.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1db954 0%, #10b981 50%, #34d399 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        'sidebar': '280px',
        'player': '90px',
      },
      zIndex: {
        'player': '100',
        'sidebar': '50',
        'topbar': '40',
        'modal': '200',
        'toast': '300',
      },
      boxShadow: {
        'glow-green': '0 0 30px rgba(29, 185, 84, 0.3)',
        'glow-purple': '0 0 30px rgba(16, 185, 129, 0.3)',
        'glow-pink': '0 0 30px rgba(52, 211, 153, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'player': '0 -4px 30px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
