/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#135bec',
                'background-dark': '#0a0e17',
                'card-dark': '#161e2d',
                'border-dark': '#232f48',
                'surface-dark': '#111722',
            },
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
            },
            animation: {
                'pulse-soft': 'pulse-soft 3s infinite ease-in-out',
            },
            keyframes: {
                'pulse-soft': {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.8', transform: 'scale(0.98)' },
                }
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
