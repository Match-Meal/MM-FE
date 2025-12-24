# 🥗 MatchMeal (MM) Frontend

> **건강한 식단 관리와 챌린지를 통한 습관 형성, AI 영양 코치의 맞춤형 조언까지.**  
> MatchMeal은 당신의 건강한 라이프스타일을 위한 올인원 플랫폼입니다.

## 📖 프로젝트 개요

**MatchMeal**은 Vue 3와 TypeScript를 기반으로 구축된 모던 웹 애플리케이션입니다.  
사용자 친화적인 **Mobile-First** 디자인을 채택하여, 데스크탑에서도 앱과 같은 경험을 제공합니다.  
Spring Boot 백엔드 및 FastAPI 기반 AI 서버와 연동되어 실시간 데이터 처리와 지능형 서비스를 제공합니다.

- **개발 기간**: 2024.11 ~ 2024.12
- **서비스 형태**: SPA (Single Page Application) / PWA Ready

---

## ✨ 주요 기능

### 1. 📝 스마트한 식단 관리
- **간편 기록**: 음식 데이터베이스를 활용하여 손쉽게 아침/점심/저녁/간식 식단을 기록합니다.
- **영양 분석**: 칼로리 및 탄·단·지 비율을 차트로 시각화하여 제공합니다.
- **캘린더 뷰**: 월별 식단 및 영양 상태를 캘린더에서 한눈에 파악할 수 있습니다.
- **통계**: 주간 및 월간 섭취 트렌드를 분석합니다.

### 2. 🤖 AI 영양 코치 (With LLM)
- **AI 채팅 상담**: 식단 고민이나 궁금한 점을 AI 코치와 상담할 수 있습니다.
- **맞춤형 코칭**: 사용자 데이터(선호/비선호 음식, 알레르기 등)를 기반으로 개인화된 답변을 제공합니다.
- **식단 추천**: 목표 달성을 위한 최적의 식단을 AI가 제안해줍니다.

### 3. 🔥 동기부여 챌린지
- **공식 챌린지**: "물 마시기", "샐러드 먹기" 등 다양한 공식 챌린지에 참여할 수 있습니다.
- **그룹 챌린지**: 친구들과 함께하는 프라이빗 챌린지를 생성하고 코드로 초대할 수 있습니다.
- **인증 시스템**: 사진 인증을 통해 챌린지를 수행하고 달성률을 추적합니다.

### 4. 👥 커뮤니티
- **정보 공유**: 다이어트 꿀팁, 식단 사진 등을 자유롭게 공유합니다.
- **소통**: 좋아요와 댓글 기능을 통해 다른 사용자들과 응원과 정보를 주고받습니다.

### 5. � 실시간 알림 & 결제
- **실시간 알림**: 챌린지 초대, 댓글, 좋아요 등의 알림을 실시간으로 수신합니다.
- **포인트 결제**: 카카오페이를 연동하여 포인트를 충전하고 유료 서비스(예: 프리미엄 챌린지 등)에 사용할 수 있습니다.

### 6. 👤 마이페이지
- **프로필 관리**: 신체 정보(키, 몸무게) 및 목표를 설정하고 BMI 변화를 확인합니다.
- **보관함**: 내가 쓴 글, 스크랩한 정보 등을 모아봅니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend Core
![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)

### State Management & Communication
![Pinia](https://img.shields.io/badge/Pinia-yellow?style=for-the-badge&logo=pinia&logoColor=black)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Styling & UI
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_Icons-F05032?style=for-the-badge&logo=lucide&logoColor=white)

### Utilities & Etc
- **Chart.js / Vue-Chartjs**: 데이터 시각화 (영양 통계)
- **SockJS & StompJS**: 실시간 웹소켓 통신 (알림)
- **PortOne (Iamport)**: 결제 모듈 연동
- **Day.js**: 날짜 핸들링

---

## 📂 프로젝트 구조 (Project Structure)

```bash
MM-FE/
├── matchmeal-project/       # 메인 Vue 프로젝트
│   ├── src/
│   │   ├── api/             # API 인터페이스 정의 (선택적)
│   │   ├── assets/          # 정적 리소스 (이미지, 폰트)
│   │   ├── components/      # Vue 컴포넌트
│   │   │   ├── common/      # 공통 컴포넌트 (Button, Modal, Toast)
│   │   │   ├── layout/      # 레이아웃 (AppLayout, BottomNav)
│   │   ├── views/           # 페이지 라우트 뷰
│   │   ├── router/          # 라우터 설정
│   │   ├── stores/          # Pinia 스토어
│   │   ├── services/        # API 통신 로직
│   │   ├── types/           # TypeScript 타입 선언
│   │   └── utils/           # 유틸리티 함수
│   └── ...
└── README.md                # 통합 문서
```

---

## 🚀 시작하기 (Getting Started)

### 1. 설치 (Installation)

```bash
# 프로젝트 클론
git clone [repository-url]

# 프로젝트 폴더 이동
cd MM-FE/matchmeal-project

# 패키지 설치
npm install
```

### 2. 실행 (Run)

```bash
# 개발 서버 실행
npm run dev
```
`http://localhost:5173` 접속

### 3. 빌드 (Build)

```bash
# 프로덕션 빌드
npm run build
```

---

## 📱 디자인 시스템 (Mobile First)
본 프로젝트는 **375px x 812px** 해상도의 모바일 환경에 최적화되어 있습니다.
Web 환경 접속 시 중앙 정렬된 모바일 프레임 레이아웃이 적용됩니다.

---

## 🤝 기여하기 (Contributing)
1. Fork Project
2. Create Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit Changes (`git commit -m 'Add NewFeature'`)
4. Push to Branch (`git push origin feature/NewFeature`)
5. Open Pull Request

---

## 📝 라이센스
This project is licensed under the MIT License.
