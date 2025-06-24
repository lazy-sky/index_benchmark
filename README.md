# Financial Benchmark Analysis

금융 자산들의 성과를 비교 분석하는 Node.js 프로젝트입니다. Yahoo Finance API와 Coinone API를 활용하여 다양한 자산의 수익률과 최대 낙폭(MDD)을 계산하고, Supabase에 자동으로 저장합니다.

## 📊 분석 대상 자산

- **GOLD (GLD)**: 금 ETF
- **S&P500 (^GSPC)**: 미국 S&P 500 지수
- **KOSPI (^KS11)**: 한국 종합주가지수
- **BTC (BTC-KRW)**: 원화 기준 비트코인

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

### 수익률 (Return %)
- 분석 기간 동안의 총 수익률을 백분율로 표시
- `(최종가격 / 초기가격 - 1) × 100`

### 최대 낙폭 (MDD %)
- 분석 기간 동안 발생한 최대 손실률
- 고점 대비 최저점까지의 하락폭

## 💾 데이터 저장

### Supabase 테이블 구조
분석 결과는 `benchmark` 테이블에 다음 구조로 저장됩니다:

```sql
CREATE TABLE benchmark (
  name TEXT NOT NULL PRIMARY KEY,
  ror DECIMAL(10,2),
  mdd DECIMAL(10,2)
);
```

### 저장되는 데이터
- **name**: 자산명 (Primary Key)
- **ror**: 수익률 (Return on Return, %)
- **mdd**: 최대 낙폭 (Maximum Drawdown, %)

### 업데이트 방식
- **Upsert 방식**: 기존 데이터가 있으면 업데이트, 없으면 새로 생성
- **Primary Key**: `name` 필드를 기준으로 중복 처리
- **실행 시점**: 매일 스케줄러 실행 시 최신 데이터로 업데이트

## ⚙️ 설정

### 분석 기간
- **기본값**: 최근 6개월 (180일)
- `index.js` 파일에서 `START`와 `END` 변수 수정 가능

```javascript
const END = new Date().toISOString().slice(0, 10); // 오늘 날짜
const START = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 6개월 전
```

### 자산 설정
`ASSETS` 객체에서 분석할 자산을 추가/수정할 수 있습니다:

```javascript
const ASSETS = {
  GOLD: 'GLD',
  'S&P500': '^GSPC',
  KOSPI: '^KS11',
  BTC: 'BTC-KRW',
  // 새로운 자산 추가 가능
  // '자산명': 'Yahoo Finance 심볼'
};
```