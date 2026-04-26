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

        background: 'var(--background)',

        foreground: 'var(--foreground)',

      },

      fontFamily: {

        'paralucent': ['Paralucent', 'Arial', 'Helvetica', 'sans-serif'],

      },

      keyframes: {
        'marquee-scroll': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'marquee-scroll': 'marquee-scroll 12s linear infinite',
      },

    },

  },

  plugins: [],

}

