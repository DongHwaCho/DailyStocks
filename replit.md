# replit.md

## 개요

이 애플리케이션은 한국 주식 시장의 "상한가" 및 급등주 추적기입니다. 한국 거래소(KOSPI 및 KOSDAQ)에서 일일 가격 제한폭에 도달하거나 20% 이상 상승한 종목을 표시하고, 네이버에서 관련 뉴스 기사를 크롤링하며, AI(OpenAI)를 사용하여 각 종목이 급등한 이유를 설명하는 요약을 생성합니다. UI는 한국어 사용자를 위해 한국어 로케일 형식, 한국어 글꼴 및 한국 주식 시장 관행(빨간색 = 상승, 파란색 = 하락)을 적용하여 구축되었습니다.

## 사용자 기본 설정

선호하는 커뮤니케이션 스타일: 단순하고 일상적인 언어.

## 시스템 아키텍처

### 프론트엔드
- **프레임워크**: Vite로 번들링된 React 18 및 TypeScript
- **라우팅**: Wouter (경량 클라이언트 사이드 라우터)
- **상태 관리**: 서버 상태를 위한 TanStack React Query (페치, 캐시, 뮤테이션)
- **UI 컴포넌트**: Tailwind CSS가 포함된 Radix UI 기본 요소를 기반으로 구축된 shadcn/ui (New York 스타일)
- **애니메이션**: 페이지 전환 및 카드 애니메이션을 위한 Framer Motion
- **스타일링**: 테마 지정을 위한 CSS 변수가 포함된 Tailwind CSS, 사용자 정의 한국어 최적화 글꼴 (Noto Sans KR, Inter)
- **경로 별칭**: `@/`는 `client/src/`로, `@shared/`는 `shared/`로 매핑됨
- **주요 페이지**: 
  - 랜딩 페이지: 서비스 소개 및 시작하기
  - 홈 페이지: 주식 카드를 그리드 형태로 표시하고 개별 종목에 대한 상세 대화 상자 제공

### 백엔드
- **프레임워크**: Node에서 실행되는 Express.js (개발 시 tsx, 프로덕션 시 esbuild 사용)
- **API 패턴**: Zod 스키마를 사용하여 `shared/routes.ts`에 정의된 유형화된 계약이 있는 REST API
- **주요 엔드포인트**:
  - `GET /api/stocks` — 모든 급등 종목 목록 (선택적으로 날짜별 필터링 가능)
  - `GET /api/stocks/:id` — 관련 뉴스가 포함된 단일 종목 가져오기
  - `POST /api/stocks/:id/analyze` — 종목 급등 이유에 대한 AI 분석 트리거
  - `POST /api/stocks/crawl` — 종목 데이터 크롤링 및 시드 데이터 생성
- **웹 스크래핑**: axios + cheerio를 사용하여 종목 관련 기사를 위해 네이버 뉴스를 크롤링함
- **AI 통합**: 이유 요약 생성을 위한 OpenAI API (Replit AI Integrations 사용)
- **정적 서비스**: 프로덕션에서는 `dist/public`에서 빌드된 Vite 출력을 제공하고, 개발 중에는 HMR과 함께 Vite 개발 서버 미들웨어를 사용함
- **스케줄링**: `node-cron`을 사용하여 매일 오후 5시(KST)에 자동 크롤링 및 분석 수행

### 데이터베이스
- **데이터베이스**: PostgreSQL (필수, `DATABASE_URL` 환경 변수를 통한 연결)
- **ORM**: schema-to-Zod 유효성 검사를 위한 `drizzle-zod`가 포함된 Drizzle ORM
- **스키마 위치**: `shared/schema.ts` (주요 앱 테이블), `shared/models/chat.ts` (채팅 통합 테이블)
- **주요 테이블**:
  - `upper_limit_stocks` — 날짜, 심볼, 이름, 가격, 변동률, 섹터, 시장 유형, AI 이유 요약이 포함된 주식 레코드
  - `news_articles` — `stock_id` 외래 키를 통해 주식에 연결된 뉴스 기사
  - `conversations` 및 `messages` — 채팅 통합 테이블 (Replit AI integrations 사용)
- **마이그레이션**: `drizzle-kit push`를 통해 관리됨 (마이그레이션 파일이 아닌 스키마 푸시 방식)

### 공용 계층 (Shared Layer)
- `shared/schema.ts` — 데이터베이스 테이블 정의, Drizzle 관계, Zod 삽입 스키마 및 TypeScript 유형
- `shared/routes.ts` — 요청/응답 유형에 대한 Zod 유효성 검사 스키마가 포함된 API 계약 정의
- `Stock`, `News`, `StockWithNews`, `CreateStockRequest`와 같은 유형이 스키마에서 내보내짐

### Replit 통합
프로젝트에는 `server/replit_integrations/` 및 `client/replit_integrations/` 아래에 여러 Replit AI 통합 모듈이 포함되어 있습니다.
- **채팅(Chat)** — OpenAI를 사용한 대화 저장 및 채팅 경로
- **오디오(Audio)** — AudioWorklet을 통한 음성 녹음, 스트리밍 재생, 음성-텍스트 변환
- **이미지(Image)** — gpt-image-1을 사용한 이미지 생성
- **배치(Batch)** — 속도 제한 및 재시도가 포함된 배치 프로세싱 유틸리티 (p-limit, p-retry)

### 빌드 시스템
- **개발(Dev)**: Vite 개발 미들웨어를 포함한 `tsx server/index.ts` (HMR 지원)
- **빌드(Build)**: 클라이언트용 Vite 빌드 및 서버용 esbuild를 실행하여 `dist/`로 출력하는 사용자 정의 `script/build.ts`
- **프로덕션(Production)**: `node dist/index.cjs`

## 외부 종속성

- **PostgreSQL** — 세션을 위해 `connect-pg-simple`과 함께 `pg` Pool을 사용하는 기본 데이터베이스
- **OpenAI API** — AI 기반 주식 분석 요약 및 채팅에 사용됨. `AI_INTEGRATIONS_OPENAI_API_KEY` 및 `AI_INTEGRATIONS_OPENAI_BASE_URL` 환경 변수를 통해 구성됨
- **네이버 검색** — 종목 관련 뉴스 검색 결과를 위한 웹 스크래핑 (API 키 불필요, cheerio 파싱과 함께 HTTP 요청 사용)
- **Google Fonts** — CDN을 통해 로드된 Noto Sans KR, Inter, DM Sans, Fira Code, Geist Mono
- **주요 npm 패키지**: express, drizzle-orm, @tanstack/react-query, framer-motion, wouter, axios, cheerio, zod, date-fns, lucide-react, shadcn/ui 컴포넌트 (Radix UI)
