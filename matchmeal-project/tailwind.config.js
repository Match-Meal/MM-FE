/** @type {import('tailwindcss').Config} */
export default {
  // src 폴더 내의 모든 vue, js, ts 파일을 감시하도록 설정
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}