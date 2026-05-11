# HUFS Dorm

> 한국외국어대학교 기숙사생을 위한 커뮤니티 + 생활 서비스 앱
> **React Native (Expo) · TypeScript · Firebase** · 1인 풀스택 개발

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_55-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

---

## 📌 한눈에 보기

| 항목 | 내용 |
|---|---|
| **목적** | 기숙사생이 매일 겪는 불편(세탁기 확인, 룸메이트·배달팟, 거래) 해결 |
| **플랫폼** | iOS / Android |
| **기여도** | **기획·설계·개발 100% (1인)** |
| **기간** | 2026.04 ~ 진행 중 |
| **기술 스택** | React Native (Expo SDK 55), TypeScript, Firebase (Firestore / Auth / Storage), react-native-webview |

---

## 🚀 기획 배경

한국외대 기숙사 생활에서 반복적으로 마주치는 문제들을 직접 해결하기 위해 시작한 프로젝트입니다.

- 🧺 세탁기·건조기가 비어 있는지 **직접 가서 확인**해야 하는 불편
- 🛏️ 방 배정이 선착순이라 **경쟁률을 예측할 수 없음**
- 👥 룸메이트·배달팟을 구하는 **공식 채널 부재**
- 🛒 중고거래·물품 공유 **플랫폼 부재**

---

## ✨ 핵심 기능

### 🔐 2단계 인증 시스템
- `@hufs.ac.kr` **학교 이메일 인증** (Firebase Auth)
- **HUFSDORM 합격 화면 이미지 업로드** → 관리자 승인
- 학기별 재인증 만료일(`verifiedUntil`) 자동 관리

### 💬 커뮤니티 / 거래 게시판
- 남자·여자 기숙사 **성별 게이트 분리 게시판**
- 게시글 CRUD · 댓글 · 대댓글 · 좋아요
- 검색 기능 (제목 + 본문)
- 거래글: 이미지 최대 5장 첨부, **판매중 / 판매완료** 상태 토글
- 핫게시글 상단 노출, 시간 표시 ("X분 전" → "X시" → "X월 X일")

### 📨 1:1 실시간 채팅
- Firestore 실시간 구독 (`onSnapshot`)
- 거래글 / 게시글 어디서든 채팅 진입
- 판매완료 시 채팅 버튼 비활성화

### 🧺 세탁기 / 건조기 실시간 현황
- 사용자가 사용 시작을 입력 → **타이머가 동 단위로 공유**
- **1초 단위 갱신**으로 다른 사용자가 실시간 확인

### 🛏️ 방 배정 희망 집계
- **희망하는 방** 탭: 동·호수 선택 후 등록, 길게 눌러 삭제
- **현재 방 상황** 탭: 컬러 막대그래프로 방별 경쟁률 시각화
- 학기별 데이터 분리 (`roomWish/{semester}/...`)

### 📢 HUFSDORM 공지사항 크롤링
- 공식 홈페이지에서 HTML fetch → 본문 추출
- **WebView 기반 상세 화면**: 이미지·표·서식 그대로 표시
- 상대 경로(`src`, `href`) → 절대 URL 자동 변환
- 모바일 최적화 CSS 인젝션 (이미지 반응형, 표 디자인, GNB/footer 숨김)
- 외부 링크는 기기 브라우저로 열기

### 👤 마이페이지
- 내가 작성한 글 / 내가 작성한 댓글 별도 화면
- 닉네임 변경, 회원탈퇴 (재확인 다이얼로그)

---

## 🏗️ 아키텍처

### 레이어 구조

```
App.tsx
└── ErrorBoundary
    └── AuthProvider (Context)
        └── Navigation
            ├── AuthStack    — 로그인 / 회원가입 / 이메일인증 / 합격화면인증
            └── MainTab      — 커뮤니티 / 거래 / 채팅 / 세탁기 / 방배정 / 공지사항
```

> **인증 단계별 게이트**: 미인증 사용자는 AuthStack 안에서만 이동, 인증 완료 시 MainTab으로 전환.

### 폴더 구조

```
src/
├── constants/      건물 데이터 (A~E동, 성별, 층수)
├── utils/          입력값 검증, 학기 계산
├── firebase/       Firebase 초기화 (Auth, Firestore, Storage)
├── services/       Firebase 쿼리 함수 (UI와 완전 분리)
├── context/        AuthContext — 전역 인증 상태
├── hooks/          usePosts, useMessages, useLaundry
├── components/     ErrorBoundary, LoadingScreen
├── navigation/     스택 / 탭 네비게이터
├── screens/        기능별 화면
└── types/          TypeScript 공통 타입
```

### Firestore 컬렉션 설계

```
users/{uid}
posts/{postId}/comments/{commentId}
chats/{chatId}/messages/{msgId}
groups/{groupId}
laundry/{building}/machines/{machineId}
roomWish/{semester}/{building}/{roomNumber}
```

### 의사결정 메모

- **Services / Hooks 분리** — Firebase 쿼리는 `services/`에 모아 UI에서 직접 호출하지 않음. UI는 `hooks/`를 통해서만 데이터를 받는 단방향 흐름.
- **AuthContext + Navigation 게이트** — 인증 상태에 따라 보여줄 화면 자체를 분기. 화면별 권한 체크를 흩뿌리지 않음.
- **보안** — Firebase 키는 `.env`로 분리하고 `.gitignore`에 등록. Firestore Security Rules 작성·배포로 클라이언트 우회 차단.

---

## 🐞 트러블슈팅

### 1. 이미지 업로드 후 게시글에 사진이 보이지 않던 버그

**증상** — 거래글 작성 시 사진을 올려도 게시 후 상세 화면에 이미지가 나오지 않음.

**원인** — `uploadPostImages`가 Storage 업로드까지는 성공하지만, **Firestore 문서의 `imageUrls` 필드 업데이트를 누락**하고 있었음. 또한 같은 파일명으로 재업로드할 경우 CDN/Storage 캐시 충돌이 일어남.

**해결** — 업로드 후 `imageUrls` 업데이트를 명시적으로 추가하고, 파일명에 타임스탬프를 붙여 캐시 충돌 차단. `MarketplaceCreateScreen`도 동일 패턴으로 일관성 있게 수정.

### 2. 채팅 목록이 무한 로딩 상태로 멈춤

**증상** — 채팅 탭에 들어가면 로딩 인디케이터가 계속 돌고 끝나지 않는 경우 발생.

**원인** — `try/catch`만 있고 `finally`가 없어, Firestore 인덱스 미생성 등 예외 상황에서 `setLoading(false)`가 호출되지 않음.

**해결** — `try/catch/finally`로 정리해 어떤 경로로도 로딩 플래그를 풀리도록 변경. 사용자에게는 "채팅을 불러올 수 없습니다" 메시지를 함께 노출.

### 3. 공지사항 키 중복 경고

**증상** — `Encountered two children with the same key` 경고가 콘솔에 발생.

**원인** — 크롤링한 공지 항목의 URL을 key로 사용했는데, 일부 공지가 같은 상세 URL을 공유.

**해결** — index 기반의 합성 key로 변경해 고유성 보장.

---

## 📦 기술적 디테일

### WebView 기반 공지사항 상세
- 외부 HTML을 fetch → 본문 영역만 추출 → WebView에 주입
- 인젝션 CSS로 모바일 최적화 (이미지 `max-width: 100%`, 표 헤더 색상, `word-break: keep-all` 등)
- WebView 로드 진행률에 맞춰 채워지는 Animated 프로그레스 바
- 본문 내 외부 링크 클릭 시 기기 브라우저로 열기

### 실시간성
- 채팅 / 세탁기 현황 / 게시글 목록은 모두 Firestore `onSnapshot` 기반 실시간 구독
- 글 작성 후 목록 새로고침은 `useFocusEffect`로 자동 처리 (별도 새로고침 액션 불필요)

---

## 🛠️ 개발 진행 현황

- [x] 요구사항 분석 및 기능 정의
- [x] Firestore 데이터 모델 설계
- [x] React Native (Expo) + Firebase 프로젝트 초기화
- [x] 환경변수 / `.gitignore` 보안 설정
- [x] Firestore 보안 규칙 작성·배포
- [x] TypeScript 공통 타입 정의
- [x] Services / Hooks 레이어 분리
- [x] AuthContext + Navigation 인증 게이트
- [x] 로그인 / 회원가입 / 이메일·이미지 2단계 인증
- [x] 커뮤니티 게시판 (CRUD, 댓글, 검색, 핫게시글)
- [x] 거래게시판 (이미지, 판매상태, 채팅 연동)
- [x] 1:1 실시간 채팅
- [x] 세탁기 / 건조기 실시간 현황
- [x] 방 배정 희망 (희망 / 현황 서브탭, 시각화)
- [x] HUFSDORM 공지사항 WebView 크롤링
- [x] 마이페이지 (내 글 / 내 댓글, 닉네임 변경, 회원탈퇴)
- [x] 실 디바이스 테스트
- [x] 앱 아이콘 / 스플래시 스크린
- [x] 공지사항 스크래핑 Cloud Functions화
- [ ] 앱스토어 / 플레이스토어 배포

---

## 🏃‍♂️ 로컬 실행 방법

```bash
git clone https://github.com/bovo22/HufsDorm.git
cd HufsDorm
npm install

# .env 파일 생성 (Firebase 콘솔 키 입력)
cp .env.example .env

# Expo 개발 서버 실행
npx expo start
```

> Firebase 프로젝트와 Firestore Security Rules가 별도로 필요합니다.

---

## 👤 개발자

**김보경** · 한국외국어대학교 통계학 · 컴퓨터공학
📧 bggim24@gmail.com · 💻 [github.com/bovo22](https://github.com/bovo22)
