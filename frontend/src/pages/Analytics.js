import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { TrendingUp, AlertCircle, Zap, ArrowUpRight, MoreHorizontal, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

const G = { 1: '#1A7A3A', 2: '#2D9D5C', 3: '#4CAF72', 4: '#76C893', 5: '#A8DAB5' };
const TT_STYLE = { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' };

function Heatmap({ data }) {
  if (!data || data.length === 0) return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see category heatmap</div>;
  const months = [...new Set(data.flatMap(r => r.values.map(v => v.month)))];
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${months.length}, 1fr)`, gap: 4, minWidth: 420 }}>
        <div />
        {months.map(m => <div key={m} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', paddingBottom: 4 }}>{m}</div>)}
        {data.map(row => (
          <React.Fragment key={row.category}>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{row.category}</div>
            {months.map(m => {
              const v = row.values.find(x => x.month === m);
              const maxVal = Math.max(...data.flatMap(r => r.values.map(x => x.value)));
              const intensity = v ? v.value / maxVal : 0;
              return (
                <div key={m} className="tooltip-wrap" style={{ aspectRatio: '1', borderRadius: 6, background: `rgba(26,122,58,${0.1 + intensity * 0.85})`, minHeight: 32 }}>
                  <span className="tooltip-box">{row.category} · {m}: {v?.value || 0} units</span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Low</span>
        {[0.1, 0.3, 0.5, 0.7, 0.95].map(o => <div key={o} style={{ width: 20, height: 12, borderRadius: 3, background: `rgba(26,122,58,${o})` }} />)}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>High</span>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [category, setCategory] = useState('All');
  const [region, setRegion] = useState('All');
  const [forecast, setForecast] = useState([]);
  const [gender, setGender] = useState([]);
  const [genderSource, setGenderSource] = useState('');
  const [regGrowth, setRegGrowth] = useState([]);
  const [quarterInfo, setQuarterInfo] = useState({});
  const [heatmap, setHeatmap] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastFetch = useRef(0);

  const fetchData = useCallback((force = false) => {
    if (!force && Date.now() - lastFetch.current < 10000 && forecast.length > 0) return;
    setLoading(true);
    const params = `?category=${category}&region=${region}`;
    Promise.all([
      api.getForecast(params), api.getGenderSales(), api.getRegionalGrowth(),
      api.getHeatmap(), api.getAIInsights(),
    ]).then(([f, g, rg, h, ins]) => {
      setForecast(f.data || []);
      setGender(g.data || []);
      setGenderSource(g.source || '');
      setRegGrowth(rg.data || []);
      setQuarterInfo(rg.quarterInfo || {});
      setHeatmap(h.data || []);
      setInsights(ins.insights || []);
      lastFetch.current = Date.now();
    }).catch(console.error).finally(() => setLoading(false));
  }, [category, region]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const dataVersion = localStorage.getItem('pp_data_updated');
    const needsRefresh = forecast.length === 0 || (dataVersion && parseInt(dataVersion) > lastFetch.current);
    if (needsRefresh) fetchData(true);
    else fetchData(false);
  }, [category, region]); // eslint-disable-line react-hooks/exhaustive-deps

  const insightConfig = [
    { type: 'growth', icon: TrendingUp, color: 'var(--accent)', bg: 'var(--accent-light)' },
    { type: 'alert', icon: AlertCircle, color: 'var(--status-red)', bg: 'var(--status-red-light)' },
    { type: 'model', icon: Zap, color: 'var(--accent-2)', bg: 'var(--accent-2-light)' },
  ];

  // Build quarter subtitle
  const qSubtitle = Object.entries(quarterInfo).map(([q, info]) => `${q}: ${info.first}–${info.last}`).join(' · ') || 'Quarter-over-quarter';

  if (loading && forecast.length === 0) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading analytics…</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-greeting fade-up" style={{ opacity: 0 }}>Analytics</h1>
          <p className="page-subtitle fade-up" style={{ opacity: 0, animationDelay: '.08s' }}>Deep-dive into demand forecasts and market trends</p>
        </div>
        <button className="btn btn-secondary btn-sm fade-up" style={{ opacity: 0, animationDelay: '.08s' }} onClick={() => fetchData(true)}><RefreshCw size={13} /> Refresh</button>
      </div>

      <div className="filter-bar fade-up" style={{ opacity: 0, animationDelay: '.1s' }}>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
          {['All', 'Electronics', 'Fashion', 'Groceries', 'Sports', 'Beauty', 'Home & Garden', 'Appliances'].map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
          {['All', 'North', 'South', 'East', 'West'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="charts-grid fade-up" style={{ opacity: 0, animationDelay: '.15s' }}>
        <div className="card chart-container">
          <div className="card-header">
            <div><div className="card-title">Demand Forecast</div><div className="card-subtitle">Actual vs Predicted · {category}</div></div>
            <button className="icon-btn" style={{ width: 30, height: 30 }}><MoreHorizontal size={15} /></button>
          </div>
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={forecast} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="actual" fill={G[5]} stroke={G[3]} strokeWidth={1} radius={[3, 3, 0, 0]} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke={G[1]} strokeWidth={2.5} dot={{ r: 3, fill: G[1] }} name="Predicted" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see demand forecasts</div>}
        </div>

        <div className="card chart-container">
          <div className="card-header">
            <div>
              <div className="card-title">Gender-Based Sales</div>
              <div className="card-subtitle">
                Male vs Female · by category
                {genderSource === 'estimated' && <span style={{ fontSize: 10, color: 'var(--status-orange)', marginLeft: 6 }}>(estimated — add gender column for real data)</span>}
                {genderSource === 'uploaded' && <span style={{ fontSize: 10, color: 'var(--status-green)', marginLeft: 6 }}>✓ from uploaded data</span>}
              </div>
            </div>
          </div>
          {gender.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={gender} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="male" stackId="1" fill={G[5]} stroke={G[2]} strokeWidth={2} name="Male" fillOpacity={0.6} />
                <Area type="monotone" dataKey="female" stackId="1" fill={G[4]} stroke={G[1]} strokeWidth={2} name="Female" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see gender-based sales</div>}
        </div>
      </div>

      <div className="charts-grid fade-up" style={{ opacity: 0, animationDelay: '.2s' }}>
        <div className="card chart-container">
          <div className="card-header"><div><div className="card-title">Category Heatmap</div><div className="card-subtitle">Demand intensity by month</div></div></div>
          <Heatmap data={heatmap} />
        </div>

        <div className="card chart-container">
          <div className="card-header">
            <div>
              <div className="card-title">Regional Growth</div>
              <div className="card-subtitle" style={{ fontSize: 11 }}>{qSubtitle}</div>
            </div>
          </div>
          {regGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={regGrowth} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT_STYLE} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Q1" fill={G[5]} stroke={G[4]} strokeWidth={1.5} name={quarterInfo.Q1 ? `Q1 (${quarterInfo.Q1.first}–${quarterInfo.Q1.last})` : 'Q1'} fillOpacity={0.5} />
                <Area type="monotone" dataKey="Q2" fill={G[4]} stroke={G[3]} strokeWidth={1.5} name={quarterInfo.Q2 ? `Q2 (${quarterInfo.Q2.first}–${quarterInfo.Q2.last})` : 'Q2'} fillOpacity={0.5} />
                <Area type="monotone" dataKey="Q3" fill={G[3]} stroke={G[2]} strokeWidth={1.5} name={quarterInfo.Q3 ? `Q3 (${quarterInfo.Q3.first}–${quarterInfo.Q3.last})` : 'Q3'} fillOpacity={0.5} />
                <Area type="monotone" dataKey="Q4" fill={G[2]} stroke={G[1]} strokeWidth={1.5} name={quarterInfo.Q4 ? `Q4 (${quarterInfo.Q4.first}–${quarterInfo.Q4.last})` : 'Q4'} fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see regional growth</div>}
        </div>
      </div>

      <div className="card fade-up" style={{ opacity: 0, animationDelay: '.25s' }}>
        <div className="card-header">
          <div><div className="card-title">🧠 AI-Generated Insights</div><div className="card-subtitle">Powered by ProductPulse ML engine</div></div>
          <span className="badge badge-info">{insights.length} insights</span>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          {insights.map((ins, i) => {
            const cfg = insightConfig.find(c => c.type === ins.type) || insightConfig[0];
            const Icon = cfg.icon;
            return (
              <div key={i} className="insight-item">
                <div className="insight-icon" style={{ background: cfg.bg, color: cfg.color }}><Icon size={15} /></div>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5, flex: 1 }}>{ins.text}</p>
              </div>
            );
          })}
          {insights.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Upload data to generate AI-powered insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
