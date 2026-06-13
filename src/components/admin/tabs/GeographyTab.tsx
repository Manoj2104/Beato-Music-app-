'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

type SortKey = 'users' | 'revenue' | 'growth';

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#121212', border: '1px solid #1a1a1a', borderRadius: 14, padding: 20, ...style,
});

const countryToRegion: Record<string, string> = {
  IN: 'Asia-Pacific', JP: 'Asia-Pacific', KR: 'Asia-Pacific', ID: 'Asia-Pacific', PH: 'Asia-Pacific', AU: 'Asia-Pacific', CN: 'Asia-Pacific', SG: 'Asia-Pacific', MY: 'Asia-Pacific', TH: 'Asia-Pacific', VN: 'Asia-Pacific', NZ: 'Asia-Pacific',
  US: 'Americas', CA: 'Americas', BR: 'Americas', MX: 'Americas', AR: 'Americas', CO: 'Americas', CL: 'Americas', PE: 'Americas', VE: 'Americas',
  GB: 'Europe', DE: 'Europe', FR: 'Europe', ES: 'Europe', IT: 'Europe', NL: 'Europe', SE: 'Europe', PL: 'Europe', CH: 'Europe', BE: 'Europe', AT: 'Europe', DK: 'Europe', FI: 'Europe', NO: 'Europe', RU: 'Europe', IE: 'Europe',
  NG: 'Africa & Middle East', ZA: 'Africa & Middle East', EG: 'Africa & Middle East', SA: 'Africa & Middle East', AE: 'Africa & Middle East', TR: 'Africa & Middle East', IL: 'Africa & Middle East', KE: 'Africa & Middle East', MA: 'Africa & Middle East',
};

const regionColors: Record<string, string> = {
  'Asia-Pacific': '#1db954',
  'Americas': '#10b981',
  'Europe': '#10b981',
  'Africa & Middle East': '#f59e0b',
};

function getCountryFlag(countryCode: string): string {
  if (!countryCode) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🏳️';
  }
}

function getCountryName(code: string): string {
  if (!code) return 'Unknown';
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(code.toUpperCase()) || code;
  } catch (e) {
    return code === 'IN' ? 'India' : code === 'US' ? 'United States' : code === 'GB' ? 'United Kingdom' : code === 'BR' ? 'Brazil' : code;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export default function GeographyTab() {
  const [sort, setSort] = useState<SortKey>('users');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/analytics?timeframe=all');
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          toast.error('Failed to load geographic data');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch geographic analytics');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 40, height: 40, border: `3px solid rgba(29, 185, 84, 0.15)`, borderTopColor: '#1db954', borderRadius: '50%' }} 
        />
        <div style={{ color: '#6b7280', fontSize: 14 }}>Aggregating Beato geographic data...</div>
      </div>
    );
  }

  const geoData = data.geoData || [];
  const currencySymbol = data.currency?.symbol || '$';
  const totalUsers = data.stats?.totalUsers || 0;

  // KPIs
  const countriesActive = geoData.length;
  
  let topCountry = 'N/A';
  if (geoData.length > 0) {
    const sortedByStreams = [...geoData].sort((a, b) => b.streams - a.streams);
    topCountry = `${getCountryFlag(sortedByStreams[0].countryCode)} ${getCountryName(sortedByStreams[0].countryCode)}`;
  }

  let fastestGrowing = 'N/A';
  if (geoData.length > 0) {
    const sortedByGrowth = [...geoData].sort((a, b) => b.growth - a.growth);
    fastestGrowing = `${getCountryFlag(sortedByGrowth[0].countryCode)} ${getCountryName(sortedByGrowth[0].countryCode)}`;
  }

  const globalCoverage = countriesActive > 0 ? Math.min(100, Math.round((countriesActive / 195) * 100)) : 0;

  // Regional computations
  const regionStats = ['Asia-Pacific', 'Americas', 'Europe', 'Africa & Middle East'].map(regionName => {
    const regionCountries = geoData.filter((c: any) => {
      const r = countryToRegion[c.countryCode.toUpperCase()] || 'Europe';
      return r === regionName;
    });

    const regionUsers = regionCountries.reduce((sum: number, c: any) => sum + c.users, 0);
    const regionRevenue = regionCountries.reduce((sum: number, c: any) => sum + c.revenue, 0);
    
    // Average growth of countries in the region weighted by user count
    const regionGrowth = regionUsers > 0
      ? Math.round(regionCountries.reduce((sum: number, c: any) => sum + (c.growth * c.users), 0) / regionUsers)
      : 0;

    const pct = totalUsers > 0 ? Math.round((regionUsers / totalUsers) * 100) : 0;

    return {
      name: regionName,
      users: formatNumber(regionUsers),
      revenue: `${currencySymbol}${formatNumber(regionRevenue)}`,
      growth: `+${regionGrowth}%`,
      color: regionColors[regionName],
      pct
    };
  });

  // Table computations
  const sortedCountries = [...geoData].sort((a: any, b: any) => {
    if (sort === 'users') return b.users - a.users;
    if (sort === 'revenue') return b.revenue - a.revenue;
    if (sort === 'growth') return b.growth - a.growth;
    return 0;
  });

  return (
    <div style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Countries Active', value: String(countriesActive), color: '#1db954' },
          { label: 'Top Country', value: topCountry, color: '#fff' },
          { label: 'Fastest Growing', value: fastestGrowing, color: '#f59e0b' },
          { label: 'Global Coverage', value: `${globalCoverage}%`, color: '#10b981' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={card()}>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 6px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Regional Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {regionStats.map(r => (
          <div key={r.name} style={{ ...card(), borderTop: `3px solid ${r.color}` }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{r.name}</p>
            <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 800, color: '#fff' }}>{r.users}</p>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>users</p>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 1 }}
                style={{ height: '100%', background: r.color, borderRadius: 3 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{r.revenue}</span>
              <span style={{ fontSize: 11, color: '#1db954', fontWeight: 700 }}>{r.growth}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Country Table */}
      <div style={card()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Top Countries</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['users', 'revenue', 'growth'] as SortKey[]).map(s => (
              <button key={s} onClick={() => setSort(s)} style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                background: sort === s ? '#1db954' : '#1a1a1a', color: sort === s ? '#000' : '#9ca3af',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {sortedCountries.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
              No active geographic records found in database.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['#', 'Country', 'Users', 'Streams', 'Revenue', 'Growth'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCountries.map((c: any, index: number) => (
                  <tr key={c.countryCode} style={{ borderBottom: '1px solid #0f0f0f' }}>
                    <td style={{ padding: '10px 12px', color: '#6b7280', fontWeight: 600 }}>{index + 1}</td>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>
                      <span style={{ marginRight: 8 }}>{getCountryFlag(c.countryCode)}</span>{getCountryName(c.countryCode)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#e5e7eb' }}>{formatNumber(c.users)}</td>
                    <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{formatNumber(c.streams)}</td>
                    <td style={{ padding: '10px 12px', color: '#1db954', fontWeight: 600 }}>{currencySymbol}{c.revenue.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: '#1db954', fontWeight: 700 }}>↑ +{c.growth}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
