# Financial Benchmark Analysis

금융 자산들의 성과를 비교 분석하는 Node.js 프로젝트입니다. Yahoo Finance API와 Coinone API를 활용하여 다양한 자산의 수익률과 최대 낙폭(MDD)을 계산합니다.

## 📊 분석 대상 자산

- **Gold (GLD)**: 금 ETF
- **S&P500 (^GSPC)**: 미국 S&P 500 지수
- **KOSPI (^KS11)**: 한국 종합주가지수
- **Bitcoin (KRW)**: 원화 기준 비트코인

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 실행
```bash
npm start
```

## 📈 분석 지표

### 수익률 (Return %)
- 분석 기간 동안의 총 수익률을 백분율로 표시
- `(최종가격 / 초기가격 - 1) × 100`

### 최대 낙폭 (MDD %)
- 분석 기간 동안 발생한 최대 손실률
- 고점 대비 최저점까지의 하락폭

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

## 📋 출력 예시

```
┌───────────────┬────────────┬──────────┐
│    (index)    │ Return (%) │ MDD (%)  │
├───────────────┼────────────┼──────────┤
│     Gold      │  '27.98'   │ '-7.11'  │
│    S&P500     │  '-0.21'   │ '-18.90' │
│     KOSPI     │  '27.42'   │ '-14.14' │
│ Bitcoin (KRW) │   '1.07'   │ '-28.02' │
└───────────────┴────────────┴──────────┘
```

## 🛠️ 개발

### 프로젝트 구조
```
benchmark/
├── package.json      # 프로젝트 설정 및 의존성
├── index.js            # 메인 분석 스크립트
└── README.md        # 프로젝트 문서
```

### 주요 함수

- `getMdd(arr)`: 최대 낙폭 계산
- `fetchYahoo(symbol)`: Yahoo Finance 데이터 로딩
- `fetchCoinoneKRW_BTC()`: Coinone 비트코인 데이터 로딩
- `main()`: 메인 실행 함수
