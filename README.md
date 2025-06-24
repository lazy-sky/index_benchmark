# Financial Benchmark Analysis

금융 자산들의 성과를 비교 분석하는 Node.js 프로젝트입니다. Yahoo Finance API와 Coinone API를 활용하여 다양한 자산의 수익률과 최대 낙폭(MDD)을 계산하고, Supabase에 자동으로 저장합니다.

## 📊 분석 대상 자산

- **Gold (GLD)**: 금 ETF
- **S&P500 (^GSPC)**: 미국 S&P 500 지수
- **KOSPI (^KS11)**: 한국 종합주가지수
- **Bitcoin (KRW)**: 원화 기준 비트코인

## 📈 분석 기간

각 자산별로 다음 기간의 성과를 분석합니다:
- **1개월 (1m)**: 최근 30일
- **3개월 (3m)**: 최근 90일
- **6개월 (6m)**: 최근 180일
- **1년 (12m)**: 최근 365일

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집하여 Supabase 정보 입력
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. 실행 옵션

#### 일회성 실행
```bash
npm start
```

#### 자동화 스케줄러 실행 (매일 오전 9시)
```bash
npm run scheduler
```

## 📈 분석 지표

### 수익률 (ROR - Return on Return %)
- 분석 기간 동안의 총 수익률을 백분율로 표시
- `(최종가격 / 초기가격 - 1) × 100`

### 최대 낙폭 (MDD - Maximum Drawdown %)
- 분석 기간 동안 발생한 최대 손실률
- 고점 대비 최저점까지의 하락폭

## 💾 데이터 저장

### Supabase 테이블 구조
분석 결과는 `benchmark` 테이블에 다음 구조로 저장됩니다:

```sql
CREATE TABLE benchmark (
  name TEXT NOT NULL PRIMARY KEY,
  ror_1m DECIMAL(10,2),
  mdd_1m DECIMAL(10,2),
  ror_3m DECIMAL(10,2),
  mdd_3m DECIMAL(10,2),
  ror_6m DECIMAL(10,2),
  mdd_6m DECIMAL(10,2),
  ror_12m DECIMAL(10,2),
  mdd_12m DECIMAL(10,2)
);
```

### 저장되는 데이터
- **name**: 자산명 (Primary Key)
- **ror_1m**: 1개월 수익률 (%)
- **mdd_1m**: 1개월 최대 낙폭 (%)
- **ror_3m**: 3개월 수익률 (%)
- **mdd_3m**: 3개월 최대 낙폭 (%)
- **ror_6m**: 6개월 수익률 (%)
- **mdd_6m**: 6개월 최대 낙폭 (%)
- **ror_12m**: 1년 수익률 (%)
- **mdd_12m**: 1년 최대 낙폭 (%)

### 업데이트 방식
- **Upsert 방식**: 기존 데이터가 있으면 업데이트, 없으면 새로 생성
- **Primary Key**: `name` 필드를 기준으로 중복 처리
- **실행 시점**: 매일 스케줄러 실행 시 최신 데이터로 업데이트

## ⚙️ 설정

### 분석 기간 설정
`index.js` 파일에서 분석 기간을 수정할 수 있습니다:

```javascript
const PERIODS = {
  '1m': 30,    // 1개월
  '3m': 90,    // 3개월
  '6m': 180,   // 6개월
  '12m': 365   // 1년
};
```

### 자산 설정
`ASSETS` 객체에서 분석할 자산을 추가/수정할 수 있습니다:

```javascript
const ASSETS = {
  Gold: 'GLD',
  'S&P500': '^GSPC',
  KOSPI: '^KS11',
  // 새로운 자산 추가 가능
  // '자산명': 'Yahoo Finance 심볼'
};
```

## 📦 사용된 기술

- **Node.js**: 런타임 환경
- **yahoo-finance2**: Yahoo Finance API 클라이언트
- **axios**: HTTP 클라이언트 (Coinone API 호출용)
- **@supabase/supabase-js**: Supabase 클라이언트
- **dotenv**: 환경 변수 관리
- **ES Modules**: 최신 JavaScript 모듈 시스템

## 🔧 API 정보

### Yahoo Finance API
- 주식, ETF, 지수 데이터 제공
- 무료 사용 가능
- 일별 종가 데이터 활용

### Coinone API
- 비트코인 원화 거래 데이터 제공
- 공개 API (인증 불필요)
- 일별 캔들 데이터 활용

### Supabase
- PostgreSQL 기반 백엔드 서비스
- 실시간 데이터베이스
- RESTful API 제공

## 📋 출력 예시

```
📊 분석 기간: 2024-12-31 기준
🔄 데이터 수집 중...

📈 Gold 분석 중...
  1m: ROR 2.15%, MDD -1.23%
  3m: ROR 8.45%, MDD -3.67%
  6m: ROR 15.23%, MDD -7.89%
  12m: ROR 27.98%, MDD -12.34%

📈 S&P500 분석 중...
  1m: ROR -1.23%, MDD -5.67%
  3m: ROR 3.45%, MDD -8.90%
  6m: ROR -0.21%, MDD -15.67%
  12m: ROR 12.34%, MDD -18.90%

💾 Supabase에 저장 중...
✅ GOLD 업데이트 완료
✅ S&P500 업데이트 완료
✅ KOSPI 업데이트 완료
✅ BTC 업데이트 완료
✅ 모든 작업 완료!
```

## 🛠️ 개발

### 프로젝트 구조
```
benchmark/
├── package.json      # 프로젝트 설정 및 의존성
├── index.js          # 메인 분석 스크립트
├── scheduler.js      # 자동화 스케줄러
├── .env              # 환경 변수 (로컬)
├── .gitignore        # Git 제외 파일 설정
└── README.md         # 프로젝트 문서
```

### 주요 함수

- `maxDrawdown(arr)`: 최대 낙폭 계산
- `fetchYahoo(symbol, startDate)`: Yahoo Finance 데이터 로딩
- `fetchCoinoneKRW_BTC(startDate)`: Coinone 비트코인 데이터 로딩
- `calculatePeriodMetrics(symbol, periodDays)`: 특정 기간 분석
- `saveToSupabase(results)`: Supabase에 데이터 저장
- `main()`: 메인 실행 함수

## 🔄 자동화

### 스케줄러 실행
```bash
npm run scheduler
```

### 백그라운드 실행 (Linux/Mac)
```bash
nohup npm run scheduler > scheduler.log 2>&1 &
```

### PM2를 사용한 프로덕션 실행
```bash
npm install -g pm2
pm2 start scheduler.js --name "benchmark-scheduler"
pm2 save
pm2 startup
```

## 📝 라이선스

ISC License

## 🤝 기여

이슈나 개선사항이 있으시면 언제든지 제안해주세요!
