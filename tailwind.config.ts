import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#FAFAF8',
        'bg-secondary': '#F5F5F3',
        'bg-card': '#FFFFFF',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        'text-tertiary': '#9B9B9B',
        'accent': '#C4785A',
        'accent-light': '#F5EDE8',
        'success': '#7C8B6F',
        'error': '#C75050',
        'border-light': '#EBEBEB',
        'border-medium': '#DEDEDE',
      },
      minWidth: {
        'mobile': '320px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
