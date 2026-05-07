import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MoreHorizontal, Clock, X, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

const G = { 1: '#1A7A3A', 2: '#2D9D5C', 3: '#4CAF72', 4: '#76C893', 5: '#A8DAB5' };
const TT = { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' };
const COLORS = [G[1], G[2], G[3], G[4]];

function KpiCard({ label, value, change, changeDir, icon, isDown }) {
  return (
    <div className="kpi-card fade-up" style={{ opacity: 0 }}>
      <div className="kpi-top-row"><span className="kpi-label">{label}</span><span className="kpi-emoji">{icon}</span></div>
      <div className="kpi-bottom-row">
        <span className="kpi-value">{value}</span>
        <span className={`kpi-change ${isDown ? 'down' : 'up'}`}>{changeDir === 'up' ? '↑' : '↓'} {change}</span>
      </div>
    </div>
  );
}

function AnimatedDonut({ data }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startTs = useRef(null);
  useEffect(() => {
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(function tick(ts) {
        if (!startTs.current) startTs.current = ts;
        const t = Math.min((ts - startTs.current) / 1000, 1);
        setProgress(easeOut(t) * 100);
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      });
    }, 300);
    return () => { clearTimeout(timeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const animated = (data || []).map((d, i) => ({ ...d, value: Math.round(d.value * progress / 100), color: COLORS[i % COLORS.length] }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={animated} cx="50%" cy="50%" innerRadius={62} outerRadius={90} startAngle={90} endAngle={-270} paddingAngle={3} dataKey="value" isAnimationActive={false}>
          {animated.map((e, i) => <Cell key={i} fill={e.color} />)}
        </Pie>
        <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={TT} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const user = JSON.parse(localStorage.getItem('pp_user') || '{}');

  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [catDemand, setCatDemand] = useState([]);
  const [regional, setRegional] = useState([]);
  const [activity, setActivity] = useState([]);
  const [topAlerts, setTopAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('pp_onboarded'));
  const lastFetch = useRef(0);

  const fetchData = useCallback((force = false) => {
    // Skip if fetched recently (within 10s) and not forced
    if (!force && Date.now() - lastFetch.current < 10000 && kpis) return;
    setLoading(true);
    Promise.all([
      api.getKPIs(), api.getProfitTrend(), api.getCategoryDemand(),
      api.getRegional(), api.getActivity(), api.getTopAlerts(),
    ]).then(([k, t, c, r, a, al]) => {
      setKpis(k.kpis);
      setTrend(t.trend || []);
      setCatDemand((c.demand || []).map((d, i) => ({ ...d, color: Object.values(G)[i] || G[3] })));
      setRegional(r.data || []);
      setActivity(a.activity || []);
      setTopAlerts(al.alerts || []);
      lastFetch.current = Date.now();
    }).catch(console.error).finally(() => setLoading(false));
  }, [kpis]);

  useEffect(() => {
    // Fetch on mount. Check if data was updated since last fetch.
    const dataVersion = localStorage.getItem('pp_data_updated');
    const needsRefresh = !kpis || (dataVersion && parseInt(dataVersion) > lastFetch.current);
    if (needsRefresh) fetchData(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpiCards = kpis ? [
    { label: 'Top-Selling Categories', value: kpis.topCategoryCount, change: kpis.topCategoryChange, changeDir: String(kpis.topCategoryChange).startsWith('-') ? 'dn' : 'up', icon: '🏷️', isDown: String(kpis.topCategoryChange).startsWith('-') },
    { label: 'Forecasted Demand (30d)', value: kpis.forecastedDemand > 0 ? (kpis.forecastedDemand/1000).toFixed(1)+'K' : '0', change: kpis.forecastChange, changeDir: String(kpis.forecastChange).startsWith('-') ? 'dn' : 'up', icon: '📈', isDown: String(kpis.forecastChange).startsWith('-') },
    { label: 'Overstock Risk', value: kpis.overstockRisk+'%', change: kpis.overstockChange, changeDir: String(kpis.overstockChange).startsWith('-') ? 'up' : 'dn', icon: '📦', isDown: !String(kpis.overstockChange).startsWith('-') },
    { label: 'Out-of-Stock Alerts', value: kpis.outOfStockAlerts, change: kpis.alertChange, changeDir: 'dn', icon: '⚠️', isDown: true },
    { label: 'Total Profit', value: kpis.totalProfit > 0 ? '$'+(kpis.totalProfit/1000).toFixed(0)+'K' : '$0', change: kpis.profitChange, changeDir: String(kpis.profitChange).startsWith('-') ? 'dn' : 'up', icon: '💰', isDown: String(kpis.profitChange).startsWith('-') },
  ] : [];

  if (loading && !kpis) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading dashboard…</div>;

  const hasData = kpis && (kpis.totalProfit > 0 || kpis.topCategoryCount > 0);

  return (
    <div>
      {showOnboarding && (
        <div style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 20 }}>👋</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent)' }}>Welcome to ProductPulse!</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Start by uploading your sales data to generate AI-powered demand forecasts.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>Upload Data <ArrowRight size={13} /></button>
          <button onClick={() => { localStorage.setItem('pp_onboarded', '1'); setShowOnboarding(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={16} /></button>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-greeting fade-up" style={{ opacity: 0 }}>{greeting}, <span>{user.name?.split(' ')[0] || 'there'}</span> 👋</h1>
          <p className="page-subtitle fade-up" style={{ opacity: 0, animationDelay: '.08s' }}>Monitor trends and inventory insights</p>
        </div>
        <button className="btn btn-secondary btn-sm fade-up" style={{ opacity: 0, animationDelay: '.08s' }} onClick={() => fetchData(true)}><RefreshCw size={13} /> Refresh</button>
      </div>

      {!hasData && (
        <div className="card fade-up" style={{ opacity: 0, animationDelay: '.1s', padding: 40, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No Data Yet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>Upload your sales data to populate the dashboard with real-time analytics.</p>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>📤 Upload Your First File</button>
        </div>
      )}

      <div className="kpi-grid">{kpiCards.map((card, i) => <KpiCard key={i} {...card} />)}</div>

      <div className="charts-grid" style={{ marginBottom: 16 }}>
        <div className="card chart-container fade-up" style={{ opacity: 0, animationDelay: '.15s' }}>
          <div className="card-header"><div><div className="card-title">Profit Trend</div><div className="card-subtitle">Actual vs Forecast</div></div></div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
                <Tooltip formatter={v => [`$${(v/1000).toFixed(1)}K`]} contentStyle={TT} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="profit" stroke={G[1]} strokeWidth={2.5} dot={{ r: 3, fill: G[1] }} name="Actual" />
                <Line type="monotone" dataKey="forecast" stroke={G[4]} strokeWidth={2} strokeDasharray="5 4" dot={false} name="Forecast" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see profit trends</div>}
        </div>

        <div className="card chart-container fade-up" style={{ opacity: 0, animationDelay: '.2s' }}>
          <div className="card-header"><div><div className="card-title">Category Demand</div><div className="card-subtitle">Units sold by category</div></div></div>
          {catDemand.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catDemand} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="demand" radius={[4, 4, 0, 0]} name="Demand">{catDemand.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see category demand</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card chart-container fade-up" style={{ opacity: 0, animationDelay: '.25s', minWidth: 0 }}>
          <div className="card-header"><div><div className="card-title">Regional Distribution</div><div className="card-subtitle">Sales share by region</div></div></div>
          {regional.length > 0 ? <AnimatedDonut data={regional} /> : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see regional distribution</div>}
        </div>

        <div className="card fade-up" style={{ opacity: 0, animationDelay: '.25s', minWidth: 0 }}>
          <div className="card-header">
            <div><div className="card-title">⚠️ Stock Alerts</div><div className="card-subtitle">Top critical items</div></div>
            <span className="badge badge-danger">{topAlerts.length} active</span>
          </div>
          <div style={{ padding: '0 20px 16px' }}>
            {topAlerts.map((a, i) => (
              <div key={i} className="alert-item">
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: a.severity === 'critical' ? 'var(--status-red)' : 'var(--status-orange)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.product}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    {a.category} · Stock: <strong style={{ color: a.severity === 'critical' ? 'var(--status-red)' : 'var(--status-orange)' }}>{a.stock}</strong>
                    {' '}/ reorder point: <strong>{a.required}</strong>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }} title="Reorder point = average daily demand × lead time + safety stock">(safety stock level)</span>
                  </div>
                </div>
                <span className={`badge ${a.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>{a.severity}</span>
              </div>
            ))}
            {topAlerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No active alerts — all stock levels healthy!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card fade-up" style={{ opacity: 0, animationDelay: '.3s' }}>
        <div className="card-header"><div><div className="card-title">Recent Activity</div><div className="card-subtitle">Uploads, predictions, reorders & alerts</div></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Type</th><th>Description</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {activity.length === 0 ? (
                <tr><td colSpan={4}><div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>No activity yet. Upload a file to get started!</div></td></tr>
              ) : activity.map((item, i) => (
                <tr key={i}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.statusType === 'success' ? G[1] : item.statusType === 'danger' ? 'var(--status-red)' : item.statusType === 'warning' ? 'var(--status-orange)' : G[2] }} />
                    <span style={{ fontWeight: 500 }}>{item.type}</span>
                  </div></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.file || item.alert || ''}</td>
                  <td><span className={`badge badge-${item.statusType}`}>{item.status}</span></td>
                  <td style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
