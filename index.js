import axios from 'axios';
import yf from 'yahoo-finance2';

const ASSETS = {
  Gold: 'GLD',
  'S&P500': '^GSPC',
  KOSPI: '^KS11',
};

const END = new Date().toISOString().slice(0, 10); // 오늘 날짜
const START = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 6개월 전

console.log(START, END);

const COINONE_QUOTE = 'KRW';
const COINONE_TARGET = 'BTC';

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

const main = async () => {
  const results = {};

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
        'MDD (%)': mdd.toFixed(2),
      };
    } catch (e) {
      console.warn(`⚠️ ${name}(${symbol}) 에러:`, e.message);
      results[name] = { 'Return (%)': null, 'MDD (%)': null };
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
    results['Bitcoin (KRW)'] = {
      'Return (%)': ret.toFixed(2),
      'MDD (%)': mdd.toFixed(2),
    };
  } catch (e) {
    console.warn(`⚠️ Bitcoin(KRW) 에러:`, e.message);
    results['Bitcoin (KRW)'] = { 'Return (%)': null, 'MDD (%)': null };
  }

  console.table(results);
};

main();
