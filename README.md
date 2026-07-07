# 이지택시 (이지모드)

70대 이상 어르신이 **혼자서** 택시를 부를 수 있게 하는 간편 호출 서비스 프로토타입.

핵심은 **출발지 AI**: GPS로 위치를 잡고, 로드뷰에서 근처의 큰 건물 사진 1장을 보여줘
"이 건물 앞에 서 계세요"로 끝낸다 — 고령자가 가장 어려워하는 지도 핀 조작이 사라진다.

## 구성

- **어르신 화면** — 큰 글씨, 화면당 정보 1개, 예/아니오 선택만
  - `/` 홈(단골 목적지) → `/pickup` 출발지 확인 → `/call` 호출 → `/riding` 이동 중
  - `/search` 목적지 검색 · `/settings` 목적지/가족/내 정보 관리
- **운영자 데스크** — `/operator` 수동 배차 대시보드 (시범운영용, `x-operator-key` 헤더 인증)
- **기사 화면** — `/driver` 어르신 배차 안내
- **API** — `/api/rides` 호출 생성·목록, `/api/rides/[id]` 조회·상태 변경

## 기술 스택

Next.js (App Router) · React · Tailwind CSS · PostgreSQL (`pg`)

## 실행

### 1. 백엔드(DB) 준비 — PostgreSQL

로컬(Homebrew) 기준:

```bash
brew install postgresql@17          # 최초 1회
brew services start postgresql@17   # DB 서버 시작
createdb easy_taxi                  # DB 생성 (최초 1회)
```

클라우드(Supabase/Neon)를 쓰는 경우 프로젝트 생성 후 접속 URL만 받아오면 된다.
**rides 테이블은 서버가 첫 요청을 받을 때 자동 생성**되므로 별도 마이그레이션은 없다.

### 2. 환경변수

`.env.example`을 `.env.local`로 복사한 뒤 값을 채운다:

```
DATABASE_URL=postgresql://localhost:5432/easy_taxi   # 또는 Supabase/Neon URL
OPERATOR_KEY=원하는-비밀키    # 미설정 시 운영자 기능 전체 잠김
```

### 3. 앱 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

### 4. 운영자 데스크 접속

1. 브라우저에서 `http://localhost:3000/operator` 접속
2. `.env.local`의 `OPERATOR_KEY` 값을 입력하면 배차 대시보드가 열린다
3. 어르신 화면(`/`)에서 호출을 만들면 목록에 나타나고, 차량번호·기사명·도착 예정 시간을 입력해 배차한다

## 현재 구현 범위 (2026-07)

**실제 동작:**

- 호출 생성·조회·상태 변경 (PostgreSQL 저장, 승객/운영자 권한 분리)
- 운영자 수동 배차 대시보드 (`/operator`)

**프로토타입/더미 (실제 연동 전):**

- `/pickup` 출발지 확인 — 고정 주소 + CSS 목업 건물. 실제 GPS·카카오맵 로드뷰 연동은
  [`docs/프로젝트계획서_출발지AI.md`](docs/프로젝트계획서_출발지AI.md) 설계대로 재작성 예정 (M1~M2)
- `/search` 목적지 검색 — 실제 장소 검색 API 미연동
- `/riding` 가족 알림 — 화면 연출만 있음, 실제 SMS/카카오톡 전송 없음
- `/driver` 기사 화면 — 컨셉 데모 (하드코딩, 배차 DB 미연결)

현 단계 목표: 복지관·경로당 베타 설문으로 출발지 불편 검증

## 문서

- [`docs/제안서.md`](docs/제안서.md) — 카카오 T 이지모드 사업 제안서
- [`docs/프로젝트계획서_출발지AI.md`](docs/프로젝트계획서_출발지AI.md) — 출발지 AI 기술 설계·리스크·마일스톤
- [`docs/아키텍처_가이드.md`](docs/아키텍처_가이드.md) — 코드 구조
