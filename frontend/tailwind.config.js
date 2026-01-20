/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        sans: ['Manrope', 'IBM Plex Sans Arabic', 'sans-serif'],
                        heading: ['Cairo', 'Manrope', 'sans-serif'],
                        arabic: ['IBM Plex Sans Arabic', 'Cairo', 'sans-serif'],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)',
                        xl: '1rem',
                        '2xl': '1.5rem',
                        '3xl': '2rem',
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: '#0F4C81',
                                foreground: '#FFFFFF',
                                light: '#89CFF0',
                        },
                        secondary: {
                                DEFAULT: '#89CFF0',
                                foreground: '#0F4C81'
                        },
                        accent: {
                                DEFAULT: '#F4E4C1',
                                foreground: '#0F4C81'
                        },
                        muted: {
                                DEFAULT: '#F1F5F9',
                                foreground: '#64748B'
                        },
                        destructive: {
                                DEFAULT: '#EF4444',
                                foreground: '#FFFFFF'
                        },
                        success: {
                                DEFAULT: '#10B981',
                                foreground: '#FFFFFF'
                        },
                        warning: {
                                DEFAULT: '#F59E0B',
                                foreground: '#FFFFFF'
                        },
                        border: '#E2E8F0',
                        input: '#E2E8F0',
                        ring: '#0F4C81',
                        surface: '#FFFFFF',
                        chart: {
                                '1': '#0F4C81',
                                '2': '#89CFF0',
                                '3': '#F4E4C1',
                                '4': '#10B981',
                                '5': '#F59E0B'
                        }
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
                        'fade-in-up': {
                                '0%': { opacity: '0', transform: 'translateY(20px)' },
                                '100%': { opacity: '1', transform: 'translateY(0)' }
                        },
                        'fade-in': {
                                '0%': { opacity: '0' },
                                '100%': { opacity: '1' }
                        },
                        'slide-in-right': {
                                '0%': { transform: 'translateX(100%)' },
                                '100%': { transform: 'translateX(0)' }
                        },
                        'pulse-soft': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0.7' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'fade-in-up': 'fade-in-up 0.5s ease-out',
                        'fade-in': 'fade-in 0.3s ease-out',
                        'slide-in-right': 'slide-in-right 0.3s ease-out',
                        'pulse-soft': 'pulse-soft 2s ease-in-out infinite'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
