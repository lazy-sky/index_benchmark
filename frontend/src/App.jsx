import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// 자산 섹션 정의
const ASSET_SECTIONS = {
  '원자재': ['GOLD', 'OIL'],
  '주요 지수': ['S&P500', 'KOSPI', 'NASDAQ', 'EURO_STOXX', 'NIKKEI', 'HANG_SENG'],
  '채권': ['BOND_ETF'],
  '통화': ['DOLLAR_INDEX', 'EURO', 'YEN'],
  '섹터 ETF': ['TECH_ETF', 'FINANCIAL_ETF', 'HEALTHCARE_ETF', 'ENERGY_ETF'],
  '개별 기업': ['SAMSUNG', 'NAVER', 'KAKAO', 'APPLE', 'TESLA', 'NVIDIA'],
  '암호화폐': ['BTC', 'ETH', 'XRP', 'DOGE', 'SOL']
}

// 자산 설명 정의
const ASSET_DESCRIPTIONS = {
  'GOLD': '금 (SPDR Gold Trust ETF)',
  'OIL': '원유 (United States Oil Fund ETF)',
  'S&P500': 'S&P 500 지수',
  'KOSPI': '코스피 종합지수',
  'NASDAQ': '나스닥 종합지수',
  'EURO_STOXX': '유럽 STOXX 50 지수',
  'NIKKEI': '니케이 225 지수',
  'HANG_SENG': '항셍 지수',
  'BOND_ETF': '미국 20년 국채 ETF (iShares 20+ Year Treasury Bond ETF)',
  'DOLLAR_INDEX': '달러 인덱스 (Invesco DB US Dollar Index Bullish Fund)',
  'EURO': '유로 (Invesco CurrencyShares Euro Trust)',
  'YEN': '엔화 (Invesco CurrencyShares Japanese Yen Trust)',
  'TECH_ETF': '기술주 (Technology Select Sector SPDR Fund)',
  'FINANCIAL_ETF': '금융주 (Financial Select Sector SPDR Fund)',
  'HEALTHCARE_ETF': '헬스케어 (Health Care Select Sector SPDR Fund)',
  'ENERGY_ETF': '에너지 (Energy Select Sector SPDR Fund)',
  'SAMSUNG': '삼성전자',
  'NAVER': '네이버',
  'KAKAO': '카카오',
  'APPLE': '애플',
  'TESLA': '테슬라',
  'NVIDIA': '엔비디아',
  'BTC': '비트코인',
  'ETH': '이더리움',
  'XRP': '리플',
  'DOGE': '도지코인',
  'SOL': '솔라나'
}

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('benchmark')
        .select('*')
        .order('name')

      if (error) throw error
      setData(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-'
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`
  }

  const groupAssetsBySection = (assets) => {
    const grouped = {}
    
    Object.entries(ASSET_SECTIONS).forEach(([sectionName, assetNames]) => {
      grouped[sectionName] = assets.filter(asset => assetNames.includes(asset.name))
    })
    
    return grouped
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            height: '48px',
            width: '48px',
            borderBottom: '2px solid #2563eb',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', color: '#4b5563' }}>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626' }}>오류: {error}</p>
        </div>
      </div>
    )
  }

  const groupedAssets = groupAssetsBySection(data)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1e3a8a' }}>자산 벤치마크 대시보드</h1>
          <p style={{ marginTop: '8px', color: '#6b7280' }}>다양한 자산의 수익률 및 최대 낙폭 분석</p>
        </div>

        {Object.entries(groupedAssets).map(([sectionName, assets]) => (
          <div key={sectionName} style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#374151', 
              marginBottom: '16px',
              padding: '12px 16px',
              backgroundColor: '#e5e7eb',
              borderRadius: '8px'
            }}>
              {sectionName}
            </h2>
            
            {assets.length > 0 ? (
              <div style={{ backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                          자산
                        </th>
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                          1개월
                        </th>
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                          3개월
                        </th>
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                          6개월
                        </th>
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase' }}>
                          12개월
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: 'white' }}>
                      {assets.map((asset) => (
                        <tr key={asset.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            <div>
                              <div>{asset.name}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                {ASSET_DESCRIPTIONS[asset.name] || ''}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ color: asset.ror_1m > 0 ? '#059669' : '#dc2626' }}>
                                ROR: {formatNumber(asset.ror_1m)}
                              </div>
                              <div style={{ color: '#6b7280' }}>
                                MDD: {formatNumber(asset.mdd_1m)}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ color: asset.ror_3m > 0 ? '#059669' : '#dc2626' }}>
                                ROR: {formatNumber(asset.ror_3m)}
                              </div>
                              <div style={{ color: '#6b7280' }}>
                                MDD: {formatNumber(asset.mdd_3m)}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ color: asset.ror_6m > 0 ? '#059669' : '#dc2626' }}>
                                ROR: {formatNumber(asset.ror_6m)}
                              </div>
                              <div style={{ color: '#6b7280' }}>
                                MDD: {formatNumber(asset.mdd_6m)}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ color: asset.ror_12m > 0 ? '#059669' : '#dc2626' }}>
                                ROR: {formatNumber(asset.ror_12m)}
                              </div>
                              <div style={{ color: '#6b7280' }}>
                                MDD: {formatNumber(asset.mdd_12m)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '24px', 
                textAlign: 'center', 
                color: '#6b7280',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                이 섹션에 데이터가 없습니다.
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={fetchData}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            데이터 새로고침
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
