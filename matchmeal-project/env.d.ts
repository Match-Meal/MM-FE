/// <reference types="vite/client" />

interface ImportMetaEnv {
  // .env 파일에 정의된 변수들에 대한 타입을 정의합니다.
  // 여기에 정의하면 코드 칠 때 자동완성이 됩니다.
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  // 필요한 환경 변수들을 여기에 추가하세요
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}