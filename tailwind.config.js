/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'spin-slower': 'spin 8s linear infinite',
            },
            fontFamily: {
                brittany: ['"Brittany Signature"', 'cursive'],
            },
            colors: {
                nos: {
                    dark: '#0B0E14',
                    paper: '#F5F5F0',
                    accent: '#FF4D4D',
                }
            }
        },
    },
    plugins: [],
}
