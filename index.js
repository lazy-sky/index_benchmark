import axios from 'axios';
import yf from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const STOCKS = {
  // 원자재
  GOLD: 'GLD',                    // 금 (SPDR Gold Trust ETF)
  OIL: 'USO',                     // 원유 (United States Oil Fund ETF)
  
  // 주요 지수
  'S&P500': '^GSPC',              // S&P 500 지수
  KOSPI: '^KS11',                 // 코스피 종합지수
  NASDAQ: '^IXIC',                // 나스닥 종합지수
  EURO_STOXX: '^STOXX50E',        // 유럽 STOXX 50 지수
  NIKKEI: '^N225',                // 니케이 225 지수
  HANG_SENG: '^HSI',              // 항셍 지수 (홍콩 대형주 50개)
  
  // 채권
  BOND_ETF: 'TLT',               // 미국 20년 국채 ETF (iShares 20+ Year Treasury Bond ETF)
  
  // 통화
  DOLLAR_INDEX: 'UUP',            // 달러 인덱스 (Invesco DB US Dollar Index Bullish Fund)
  EURO: 'FXE',                    // 유로 (Invesco CurrencyShares Euro Trust)
  YEN: 'FXY',                     // 엔화 (Invesco CurrencyShares Japanese Yen Trust)
  
  // 섹터 ETF
  TECH_ETF: 'XLK',                // 기술주 (Technology Select Sector SPDR Fund)
  FINANCIAL_ETF: 'XLF',           // 금융주 (Financial Select Sector SPDR Fund)
  HEALTHCARE_ETF: 'XLV',          // 헬스케어 (Health Care Select Sector SPDR Fund)
  ENERGY_ETF: 'XLE',              // 에너지 (Energy Select Sector SPDR Fund)
  
  // 개별 기업 주식
  SAMSUNG: '005930.KS',           // 삼성전자 (한국)
  NAVER: '035420.KS',             // 네이버 (한국)
  KAKAO: '035720.KS',             // 카카오 (한국)
  APPLE: 'AAPL',                  // 애플 (미국)
  TESLA: 'TSLA',                  // 테슬라 (미국)
  NVIDIA: 'NVDA',                 // 엔비디아 (미국)
};

const CRYPTOS = ['BTC', 'ETH', 'XRP', 'DOGE', 'SOL']; // 암호화폐 목록

const END = new Date().toISOString().slice(0, 10); // 오늘 날짜
const PERIODS = {
  '1m': 30,    // 1개월
  '3m': 90,    // 3개월
  '6m': 180,   // 6개월
  '12m': 365   // 1년
};

const COINONE_QUOTE = 'KRW';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const maxDrawdown = (arr) => {
  let peak = -Infinity;
  let mdd = 0;
  for (const price of arr) {
    if (price > peak) {
      peak = price;
    }
    const dd = (price - peak) / peak;
    if (dd < mdd) {
      mdd = dd;
    }
  }
  return mdd * 100;
};

const fetchYahoo = async (symbol, startDate) => {
  const queryOptions = { period1: startDate, period2: END, interval: '1d' };
  const result = await yf.chart(symbol, queryOptions);
  const quotes = result.quotes;
  return quotes.map((r) => r.close);
};

const fetchCoinoneCrypto = async (target, startDate) => {
  const url = `https://api.coinone.co.kr/public/v2/chart/${COINONE_QUOTE}/${target}`;
  const { data } = await axios.get(url, {
    params: { interval: '1d', size: 500 },
    headers: { Accept: 'application/json' },
  });
  if (data.result !== 'success') {
    throw new Error(`Coinone API error: ${data.error_code}`);
  }
  const entries = data.chart
    .map((c) => ({
      date: new Date(c.timestamp).toISOString().slice(0, 10),
      close: parseFloat(c.close),
    }))
    .filter(({ date }) => date >= startDate && date <= END);

  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries.map(e => e.close);
};

const calculatePeriodMetrics = async (symbol, periodDays, isBitcoin = false) => {
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  try {
    let prices;
    if (isBitcoin) {
      prices = await fetchCoinoneCrypto(symbol, startDate);
    } else {
      prices = await fetchYahoo(symbol, startDate);
    }
    
    if (prices.length < 2) {
      throw new Error('데이터 부족');
    }
    
    const ret = (prices.at(-1) / prices[0] - 1) * 100;
    const mdd = maxDrawdown(prices);
    
    return {
      ror: parseFloat(ret.toFixed(2)),
      mdd: parseFloat(mdd.toFixed(2))
    };
  } catch (e) {
    console.warn(`⚠️ ${symbol} ${periodDays}일 분석 에러:`, e.message);
    return { ror: null, mdd: null };
  }
};

const saveToSupabase = async (results) => {
  for (const [assetName, data] of Object.entries(results)) {
    const record = {
      name: assetName,
      'ror_1m': data['1m']?.ror || null,
      'mdd_1m': data['1m']?.mdd || null,
      'ror_3m': data['3m']?.ror || null,
      'mdd_3m': data['3m']?.mdd || null,
      'ror_6m': data['6m']?.ror || null,
      'mdd_6m': data['6m']?.mdd || null,
      'ror_12m': data['12m']?.ror || null,
      'mdd_12m': data['12m']?.mdd || null,
    };

    try {
      const { error } = await supabase
        .from('benchmark')
        .upsert(record, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`❌ ${assetName} 업데이트 실패:`, error.message);
      } else {
        console.log(`✅ ${assetName} 업데이트 완료`);
      }
    } catch (e) {
      console.error(`❌ ${assetName} 업데이트 중 오류:`, e.message);
    }
  }
};

const main = async () => {
  const results = {};
  
  console.log(`📊 분석 기간: ${END} 기준`);
  console.log('🔄 데이터 수집 중...\n');
  
  for (const [name, symbol] of Object.entries(STOCKS)) {
    if (symbol === null) continue; // 암호화폐들은 아래에서 따로 처리
    results[name] = {};
    console.log(`📈 ${name} 분석 중...`);
    
    for (const [period, days] of Object.entries(PERIODS)) {
      const metrics = await calculatePeriodMetrics(symbol, days);
      results[name][period] = metrics;
      console.log(`  ${period}: ROR ${metrics.ror}%, MDD ${metrics.mdd}%`);
    }
    console.log('');
  }

  for (const crypto of CRYPTOS) {
    results[crypto] = {};
    console.log(`📈 ${crypto} 분석 중...`);
    
    for (const [period, days] of Object.entries(PERIODS)) {
      const metrics = await calculatePeriodMetrics(crypto, days, true);
      results[crypto][period] = metrics;
      console.log(`  ${period}: ROR ${metrics.ror}%, MDD ${metrics.mdd}%`);
    }
    console.log('');
  }

  console.log('📈 최종 분석 결과:');
  for (const [assetName, periods] of Object.entries(results)) {
    console.log(`\n${assetName}:`);
    for (const [period, metrics] of Object.entries(periods)) {
      console.log(`  ${period}: ROR ${metrics.ror}%, MDD ${metrics.mdd}%`);
    }
  }
  
  console.log('\n💾 Supabase에 저장 중...');
  await saveToSupabase(results);
  console.log('✅ 모든 작업 완료!');
};

main();
