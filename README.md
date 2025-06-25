# 자산 벤치마크 분석 시스템

다양한 자산의 수익률(ROR)과 최대 낙폭(MDD)을 분석하고 시각화하는 시스템입니다.

## 기능

### 백엔드 (Node.js)
- Yahoo Finance API를 통한 주식/지수/ETF 데이터 수집
- 코인원 API를 통한 암호화폐 데이터 수집
- Supabase를 통한 데이터 저장
- 스케줄러를 통한 자동 데이터 업데이트

### 프론트엔드 (React + Vite)
- Supabase 데이터를 실시간으로 표시하는 대시보드
- 반응형 테이블 형태의 데이터 시각화
- Tailwind CSS를 통한 모던한 UI

## 지원하는 자산

### 주식/지수/ETF (Yahoo Finance)
- **원자재**: GOLD, SILVER, OIL
- **주요 지수**: S&P500, KOSPI, KOSDAQ, NASDAQ, DOW, EURO_STOXX, NIKKEI, HANG_SENG
- **채권**: 미국 10년/30년 국채 수익률
- **통화**: 달러 인덱스, 유로, 엔화
- **섹터 ETF**: 부동산, 기술주, 금융주, 헬스케어, 에너지
- **개별 기업**: 삼성전자, 네이버, 카카오, 애플, 테슬라, 엔비디아

### 암호화폐 (코인원 API)
- BTC, ETH, XRP, DOGE, SOL

## 설치 및 실행

### 1. 의존성 설치
```bash
# 백엔드 의존성
npm install

# 프론트엔드 의존성
cd frontend
pnpm install
```

### 2. 환경 변수 설정
루트 디렉토리에 `.env` 파일 생성:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

프론트엔드 디렉토리에 `.env` 파일 생성:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 실행

#### 백엔드 (데이터 수집)
```bash
# 일회성 실행
npm start

# 스케줄러 실행 (매일 자동 업데이트)
npm run scheduler
```

#### 프론트엔드 (대시보드)
```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## 프로젝트 구조

```
├── index.js              # 메인 데이터 수집 스크립트
├── scheduler.js          # 스케줄러
├── package.json          # 백엔드 의존성
├── .env                  # 백엔드 환경 변수
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   ├── App.jsx       # 메인 앱 컴포넌트
│   │   └── index.css     # Tailwind CSS
│   ├── package.json      # 프론트엔드 의존성
│   └── .env              # 프론트엔드 환경 변수
└── README.md
```

## 데이터베이스 스키마

Supabase의 `benchmark` 테이블 구조:
```sql
CREATE TABLE benchmark (
  name TEXT PRIMARY KEY,
  ror_1m DECIMAL,
  mdd_1m DECIMAL,
  ror_3m DECIMAL,
  mdd_3m DECIMAL,
  ror_6m DECIMAL,
  mdd_6m DECIMAL,
  ror_12m DECIMAL,
  mdd_12m DECIMAL
);
```

## 분석 지표

- **ROR (Rate of Return)**: 수익률 (%)
- **MDD (Maximum Drawdown)**: 최대 낙폭 (%)

## 기술 스택

### 백엔드
- Node.js
- Yahoo Finance API
- 코인원 API
- Supabase
- Axios

### 프론트엔드
- React 19
- Vite
- Tailwind CSS
- Supabase Client
- pnpm

## 라이선스

ISC
