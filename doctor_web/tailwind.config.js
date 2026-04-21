/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563EB", // Vibrant Blue
                secondary: "#1E40AF", // Darker Blue
                accent: "#10B981", // Emerald Green for success/health
                dark: "#1F2937", // Gray 900
                light: "#F3F4F6", // Gray 100
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
