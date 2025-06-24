import axios from 'axios';
import yf from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 2) 설정
const ASSETS = {
  GOLD: 'GLD',
  'S&P500': '^GSPC',
  KOSPI: '^KS11',
  BTC: null, // 비트코인은 별도 처리
};

// 분석 기간 설정
const END = new Date().toISOString().slice(0, 10); // 오늘 날짜
const PERIODS = {
  '1m': 30,    // 1개월
  '3m': 90,    // 3개월
  '6m': 180,   // 6개월
  '12m': 365   // 1년
};

const COINONE_QUOTE = 'KRW';
const COINONE_TARGET = 'BTC';

// Supabase 설정 (환경 변수에서 로드)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 3) 유틸 함수: 최대 낙폭 계산
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

// 4) Yahoo Finance 로딩 함수
const fetchYahoo = async (symbol, startDate) => {
  const queryOptions = { period1: startDate, period2: END, interval: '1d' };
  const result = await yf.chart(symbol, queryOptions);
  const quotes = result.quotes;
  return quotes.map((r) => r.close);
};

// 5) 코인원 KRW-BTC 로딩 함수
const fetchCoinoneKRW_BTC = async (startDate) => {
  const url = `https://api.coinone.co.kr/public/v2/chart/${COINONE_QUOTE}/${COINONE_TARGET}`;
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

// 6) 특정 기간의 분석 결과 계산
const calculatePeriodMetrics = async (symbol, periodDays, isBitcoin = false) => {
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  
  try {
    let prices;
    if (isBitcoin) {
      prices = await fetchCoinoneKRW_BTC(startDate);
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

// 7) Supabase에 데이터 저장 함수
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

// 8) 메인 로직
const main = async () => {
  const results = {};
  
  console.log(`📊 분석 기간: ${END} 기준`);
  console.log('🔄 데이터 수집 중...\n');
  
  // 8.1) Yahoo Finance 자산들 분석
  for (const [name, symbol] of Object.entries(ASSETS)) {
    if (name === 'BTC') continue; // BTC는 아래에서 따로 처리
    results[name] = {};
    console.log(`📈 ${name} 분석 중...`);
    
    for (const [period, days] of Object.entries(PERIODS)) {
      const metrics = await calculatePeriodMetrics(symbol, days);
      results[name][period] = metrics;
      console.log(`  ${period}: ROR ${metrics.ror}%, MDD ${metrics.mdd}%`);
    }
    console.log('');
  }

  // 8.2) 비트코인 (BTC) 분석
  results['BTC'] = {};
  console.log(`📈 BTC 분석 중...`);
  
  for (const [period, days] of Object.entries(PERIODS)) {
    const metrics = await calculatePeriodMetrics('BTC', days, true);
    results['BTC'][period] = metrics;
    console.log(`  ${period}: ROR ${metrics.ror}%, MDD ${metrics.mdd}%`);
  }
  console.log('');

  // 9) 결과 출력
  console.log('📈 최종 분석 결과:');
  for (const [assetName, periods] of Object.entries(results)) {
    console.log(`\n${assetName}:`);
    for (const [period, metrics] of Object.entries(periods)) {
      console.log(`  ${period}: ROR ${metrics.ror}%, MDD ${metrics.mdd}%`);
    }
  }
  
  // 10) Supabase에 저장
  console.log('\n💾 Supabase에 저장 중...');
  await saveToSupabase(results);
  console.log('✅ 모든 작업 완료!');
};

main();
