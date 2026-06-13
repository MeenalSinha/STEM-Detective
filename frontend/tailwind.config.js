/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core dark detective palette (matches the UI screenshot)
        bg: {
          primary: '#110a05',     // Darkest warm black
          secondary: '#1b1109',   // Card background
          tertiary: '#2a1e12',    // Elevated surfaces
          overlay: '#3b2b1d',     // Hover/active states
        },
        // Accent colors
        amber: {
          glow: '#c8860a',        // Primary amber accent
          light: '#e8a020',       // Light amber
          dim: '#8a5c06',         // Muted amber
        },
        crimson: {
          DEFAULT: '#8b1a1a',     // Red accent
          light: '#c42e2e',
          glow: '#ff4444',
        },
        // Subject colors matching the screenshot
        subject: {
          environmental: '#22a066',   // Green
          physics: '#3b82f6',         // Blue
          chemistry: '#a855f7',       // Purple
          biology: '#10b981',         // Emerald
          mathematics: '#f59e0b',     // Amber
          engineering: '#ef4444',     // Red
        },
        // XP and progress
        xp: '#f59e0b',
        coin: '#fbbf24',
        gem: '#a855f7',
        // Text hierarchy
        text: {
          primary: '#f5e6c8',     // Warm cream
          secondary: '#c8a87a',   // Muted gold
          muted: '#7a5c3a',       // Very muted
          dim: '#4a3520',         // Barely visible
        },
        // Borders
        border: {
          DEFAULT: '#4a3520',
          subtle: '#3b2b1d',
          glow: '#c8860a',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'Consolas', 'monospace'],
        detective: ['var(--font-special-elite)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'grain': "url('/textures/grain.png')",
        'vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(10,5,0,0.8) 100%)',
        'card-glow': 'radial-gradient(ellipse at top, rgba(200,134,10,0.08) 0%, transparent 70%)',
        'amber-glow': 'radial-gradient(ellipse at center, rgba(200,134,10,0.15) 0%, transparent 60%)',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(200,134,10,0.1)',
        'amber': '0 0 20px rgba(200,134,10,0.3)',
        'amber-strong': '0 0 40px rgba(200,134,10,0.5)',
        'crimson': '0 0 20px rgba(200,30,30,0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(200,134,10,0.15)',
      },
      animation: {
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(200,134,10,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(200,134,10,0.7)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
          '75%': { opacity: '0.95' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
