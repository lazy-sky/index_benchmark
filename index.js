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
};

// 최근 6개월 기준으로 설정
const END = new Date().toISOString().slice(0, 10); // 오늘 날짜
const START = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 6개월 전
const COINONE_QUOTE = 'KRW';
const COINONE_TARGET = 'BTC';

// Supabase 설정 (환경 변수에서 로드)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getMdd = (arr) => {
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

const fetchYahoo = async (symbol) => {
  const queryOptions = { period1: START, period2: END, interval: '1d' };
  const result = await yf.chart(symbol, queryOptions);
  const quotes = result.quotes;
  return quotes.map((r) => r.close);
};

const fetchCoinoneKRW_BTC = async () => {
  const url = `https://api.coinone.co.kr/public/v2/chart/${COINONE_QUOTE}/${COINONE_TARGET}`;
  // interval=1d 로 일별 캔들, size=500 까지 한번에 최대 500개
  const { data } = await axios.get(url, {
    params: { interval: '1d', size: 500 },
    headers: { Accept: 'application/json' },
  });
  if (data.result !== 'success') {
    throw new Error(`Coinone API error: ${data.error_code}`);
  }
  const entries = data.chart
    .map((c) => ({
      date: new Date(c.timestamp).toISOString().slice(0, 10), // 'YYYY-MM-DD'
      close: parseFloat(c.close),
    }))
    .filter(({ date }) => date >= START && date <= END);

  entries.sort((a, b) => a.date.localeCompare(b.date));

  const priceMap = {};
  for (const { date, close } of entries) {
    priceMap[date] = close;
  }

  return priceMap;
};

const saveToSupabase = async (results) => {
  const today = new Date().toISOString().slice(0, 10);
  
  for (const [assetName, data] of Object.entries(results)) {
    const record = {
      name: assetName,
      ror: data['Return (%)'] ? parseFloat(data['Return (%)']) : null,
      mdd: data['Max Drawdown (%)'] ? parseFloat(data['Max Drawdown (%)']) : null,
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

  console.log(`📊 분석 기간: ${START} ~ ${END}`);
  console.log('🔄 데이터 수집 중...\n');

  for (const [name, symbol] of Object.entries(ASSETS)) {
    try {
      const prices = await fetchYahoo(symbol);
      if (prices.length < 2) {
        throw new Error('데이터 부족');
      }
      const ret = (prices.at(-1) / prices[0] - 1) * 100;
      const mdd = getMdd(prices);
      results[name] = {
        'Return (%)': ret.toFixed(2),
        'Max Drawdown (%)': mdd.toFixed(2),
      };
    } catch (e) {
      console.warn(`⚠️ ${name}(${symbol}) 에러:`, e.message);
      results[name] = { 'Return (%)': null, 'Max Drawdown (%)': null };
    }
  }

  try {
    const priceDict = await fetchCoinoneKRW_BTC();
    const btcPrices = Object.values(priceDict);

    if (btcPrices.length < 2) {
      throw new Error('데이터 부족');
    }
    
    const ret = (btcPrices.at(-1) / btcPrices[0] - 1) * 100;
    const mdd = getMdd(btcPrices);
    results['BTC'] = {
      'Return (%)': ret.toFixed(2),
      'Max Drawdown (%)': mdd.toFixed(2),
    };
  } catch (e) {
    console.warn(`⚠️ Bitcoin(KRW) 에러:`, e.message);
    results['BTC'] = { 'Return (%)': null, 'Max Drawdown (%)': null };
  }

  console.log('📈 분석 결과:');
  console.table(results);
  
  console.log('\n💾 Supabase에 저장 중...');
  await saveToSupabase(results);
  console.log('✅ 모든 작업 완료!');
};

main();
