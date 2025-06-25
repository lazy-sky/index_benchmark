import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// SEO 메타 정보 업데이트 함수
const updateMetaTags = () => {
  // 동적 메타 정보 업데이트
  document.title = '자산 벤치마크 대시보드 - 투자 수익률 및 최대 낙폭 분석'
  
  // 메타 설명 업데이트
  let metaDescription = document.querySelector('meta[name="description"]')
  if (!metaDescription) {
    metaDescription = document.createElement('meta')
    metaDescription.name = 'description'
    document.head.appendChild(metaDescription)
  }
  metaDescription.content = '다양한 자산(주식, 채권, 원자재, 암호화폐)의 수익률과 최대 낙폭(MDD)을 실시간으로 비교 분석하는 투자 벤치마크 대시보드입니다.'
  
  // Open Graph 메타 정보 업데이트
  let ogTitle = document.querySelector('meta[property="og:title"]')
  if (!ogTitle) {
    ogTitle = document.createElement('meta')
    ogTitle.setAttribute('property', 'og:title')
    document.head.appendChild(ogTitle)
  }
  ogTitle.content = '자산 벤치마크 대시보드 - 투자 수익률 및 최대 낙폭 분석'
  
  let ogDescription = document.querySelector('meta[property="og:description"]')
  if (!ogDescription) {
    ogDescription = document.createElement('meta')
    ogDescription.setAttribute('property', 'og:description')
    document.head.appendChild(ogDescription)
  }
  ogDescription.content = '다양한 자산의 수익률과 최대 낙폭을 실시간으로 비교 분석하는 투자 벤치마크 대시보드입니다.'
}

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
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  useEffect(() => {
    fetchData()
    updateMetaTags() // SEO 메타 정보 업데이트
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('benchmark')
        .select('*')
        .order('name')

      const { data: updatedAtData } = await supabase
        .from('benchmark_updated_at')
        .select('*')

      if (error) throw error
      setData(data || [])
      setUpdatedAt(updatedAtData[0].updated_at || null)
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

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortData = (assets) => {
    if (!sortConfig.key) return assets

    return [...assets].sort((a, b) => {
      let aValue, bValue

      // 정렬할 값 추출
      if (sortConfig.key === 'name') {
        aValue = a.name
        bValue = b.name
      } else {
        const [metric, period] = sortConfig.key.split('_')
        aValue = a[`${metric}_${period}`]
        bValue = b[`${metric}_${period}`]
      }

      // null 값 처리
      if (aValue === null || aValue === undefined) aValue = sortConfig.direction === 'asc' ? Infinity : -Infinity
      if (bValue === null || bValue === undefined) bValue = sortConfig.direction === 'asc' ? Infinity : -Infinity

      // 문자열 정렬
      if (typeof aValue === 'string') {
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }

      // 숫자 정렬
      if (sortConfig.direction === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
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
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px', 
            backgroundColor: '#dbeafe', 
            borderRadius: '6px',
            border: '1px solid #93c5fd'
          }}>
            <p style={{ 
              margin: '0', 
              fontSize: '14px', 
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🕘</span>
              최근 업데이트: {new Date(updatedAt).toLocaleString()}
            </p>
          </div>
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
                    <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <tr>
                        <th 
                          style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'left', cursor: 'pointer' }}
                          onClick={() => handleSort('name')}
                        >
                          자산 {getSortIcon('name')}
                        </th>
                        <th 
                          style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'right', cursor: 'pointer' }}
                          onClick={() => handleSort('ror_1m')}
                        >
                          1개월 수익률 {getSortIcon('ror_1m')}
                        </th>
                        <th 
                          style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'right', cursor: 'pointer' }}
                          onClick={() => handleSort('ror_3m')}
                        >
                          3개월 수익률 {getSortIcon('ror_3m')}
                        </th>
                        <th 
                          style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'right', cursor: 'pointer' }}
                          onClick={() => handleSort('ror_6m')}
                        >
                          6개월 수익률 {getSortIcon('ror_6m')}
                        </th>
                        <th 
                          style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'right', cursor: 'pointer' }}
                          onClick={() => handleSort('ror_12m')}
                        >
                          1년 수익률 {getSortIcon('ror_12m')}
                        </th>
                        <th 
                          style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#374151', textAlign: 'right', cursor: 'pointer' }}
                          onClick={() => handleSort('mdd_12m')}
                        >
                          1년 MDD {getSortIcon('mdd_12m')}
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: 'white' }}>
                      {sortData(assets).map((asset) => (
                        <tr key={asset.name} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            <div>
                              <div>{asset.name}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                {ASSET_DESCRIPTIONS[asset.name] || ''}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px', textAlign: 'right' }}>
                            <div style={{ color: asset.ror_1m > 0 ? '#059669' : '#dc2626' }}>
                              {formatNumber(asset.ror_1m)}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px', textAlign: 'right' }}>
                            <div style={{ color: asset.ror_3m > 0 ? '#059669' : '#dc2626' }}>
                              {formatNumber(asset.ror_3m)}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px', textAlign: 'right' }}>
                            <div style={{ color: asset.ror_6m > 0 ? '#059669' : '#dc2626' }}>
                              {formatNumber(asset.ror_6m)}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px', textAlign: 'right' }}>
                            <div style={{ color: asset.ror_12m > 0 ? '#059669' : '#dc2626' }}>
                              {formatNumber(asset.ror_12m)}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '14px', textAlign: 'right' }}>
                            <div style={{ color: '#dc2626' }}>
                              {formatNumber(asset.mdd_12m)}
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
      </div>
    </div>
  )
}

export default App
