import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, FileText, ArrowUpRight, ArrowDownRight, TrendingUp, RefreshCw, Loader } from 'lucide-react';
import { api } from '../api/client';

const G = { 1: '#1A7A3A', 2: '#2D9D5C', 3: '#4CAF72', 4: '#76C893', 5: '#A8DAB5' };
const TT_STYLE = { background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' };
const reportTypes = ['Monthly', 'Category', 'Inventory'];

export default function Reports() {
  const [activeType, setActiveType] = useState('Monthly');
  const [dateRange, setDateRange] = useState('All Time');
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [catDemand, setCatDemand] = useState([]);
  const [alertTrend, setAlertTrend] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastFetch = useRef(0);

  const fetchData = useCallback((force = false) => {
    if (!force && Date.now() - lastFetch.current < 10000 && summary) return;
    setLoading(true);
    Promise.all([
      api.getReportSummary(`?range=${encodeURIComponent(dateRange)}`),
      api.getReportTrend(), api.getReportCategory(),
      api.getAlertTrend(), api.getRecentReports(),
    ]).then(([s, t, c, at, r]) => {
      setSummary(s.summary);
      setTrend(t.trend || []);
      setCatDemand((c.demand || []).map((d, i) => ({ ...d, color: [G[1], G[2], G[3], G[4], G[5], '#0D5C28'][i] || G[3] })));
      setAlertTrend(at.trend || []);
      setRecentReports(r.reports || []);
      lastFetch.current = Date.now();
    }).catch(console.error).finally(() => setLoading(false));
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const dataVersion = localStorage.getItem('pp_data_updated');
    const needsRefresh = !summary || (dataVersion && parseInt(dataVersion) > lastFetch.current);
    if (needsRefresh) fetchData(true);
    else fetchData(false);
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async (format) => {
    setGenerating(true);
    try {
      const result = await api.generateReport({ reportType: activeType, format, dateRangeLabel: dateRange });
      const r = await api.getRecentReports();
      setRecentReports(r.reports || []);

      // Auto-download the generated report
      if (result.report?._id) {
        await handleDownload(result.report._id, result.report.name);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id, name) => {
    setDownloading(id);
    try {
      const blob = await api.downloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || 'report'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed: ' + err.message);
    } finally {
      setDownloading(null);
    }
  };

  const summaryCards = summary ? [
    { label: 'Total Profit', value: summary.totalProfit > 0 ? '$' + (summary.totalProfit / 1000).toFixed(0) + 'K' : '$0', change: summary.profitChange != null ? `${summary.profitChange >= 0 ? '+' : ''}${summary.profitChange}%` : '—', dir: (summary.profitChange || 0) >= 0 ? 'up' : 'down', color: 'var(--accent)' },
    { label: 'Top Category', value: summary.topCategory, change: summary.topCategoryUnits > 0 ? summary.topCategoryUnits.toLocaleString() + ' units' : '—', dir: 'up', color: 'var(--accent-2)' },
    { label: 'Growth Region', value: summary.growthRegion, change: summary.topRegGrowth != null ? `${summary.topRegGrowth >= 0 ? '+' : ''}${summary.topRegGrowth}%` : '—', dir: (summary.topRegGrowth || 0) >= 0 ? 'up' : 'down', color: 'var(--accent-3)' },
    { label: 'Risk %', value: summary.riskPercent + '%', change: summary.riskChange != null ? `${summary.riskChange >= 0 ? '+' : ''}${summary.riskChange}%` : '—', dir: (summary.riskChange || 0) <= 0 ? 'up' : 'down', color: 'var(--status-orange)' },
  ] : [];

  const formatFileSize = (bytes) => !bytes ? '—' : bytes > 1000000 ? (bytes / 1000000).toFixed(1) + ' MB' : (bytes / 1000).toFixed(0) + ' KB';
  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading && !summary) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading reports…</div>;

  const profitSparkData = trend.map(t => ({ m: t.month, v: t.profit }));
  const demandSparkData = catDemand.slice(0, 8).map((d, i) => ({ m: i, v: d.demand }));
  const alertSparkData = alertTrend.length > 0 ? alertTrend.map(a => ({ m: a.month, v: a.total })) : [];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-greeting fade-up" style={{ opacity: 0 }}>Reports</h1>
          <p className="page-subtitle fade-up" style={{ opacity: 0, animationDelay: '.08s' }}>Export and analyze business performance reports</p>
        </div>
        <button className="btn btn-secondary btn-sm fade-up" style={{ opacity: 0, animationDelay: '.08s' }} onClick={() => fetchData(true)}><RefreshCw size={13} /> Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {summaryCards.map((s, i) => (
          <div key={s.label} className="card fade-up" style={{ opacity: 0, animationDelay: `${0.05 + i * 0.07}s`, padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent)', borderRadius: '12px 12px 0 0' }} />
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: s.color }}>{s.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              {s.dir === 'up' ? <ArrowUpRight size={13} color="var(--status-green)" /> : <ArrowDownRight size={13} color="var(--status-red)" />}
              <span style={{ fontSize: 12, color: s.dir === 'up' ? 'var(--status-green)' : 'var(--status-red)', fontWeight: 600 }}>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {reportTypes.map(t => (
              <button key={t} className={`btn btn-sm ${activeType === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveType(t)}>{t}</button>
            ))}
          </div>

          <div className="charts-grid-3 fade-up" style={{ opacity: 0, animationDelay: '.15s' }}>
            {[
              { title: 'Profit Trend', data: profitSparkData, color: G[1], fmt: v => '$' + (v/1000).toFixed(0) + 'K' },
              { title: 'Demand Trend', data: demandSparkData, color: G[2], fmt: v => v },
              { title: 'Alert Count', data: alertSparkData, color: G[3], fmt: v => v },
            ].map(chart => (
              <div key={chart.title} className="card chart-container">
                <div className="card-header" style={{ paddingBottom: 8 }}>
                  <div className="card-title" style={{ fontSize: 12.5 }}>{chart.title}</div>
                  <TrendingUp size={13} style={{ color: chart.color }} />
                </div>
                {chart.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={chart.data}><Line type="monotone" dataKey="v" stroke={chart.color} strokeWidth={2.5} dot={false} /><Tooltip formatter={v => [chart.fmt(v)]} contentStyle={TT_STYLE} /></LineChart>
                  </ResponsiveContainer>
                ) : <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No data</div>}
              </div>
            ))}
          </div>

          <div className="card chart-container fade-up" style={{ opacity: 0, animationDelay: '.2s' }}>
            <div className="card-header"><div><div className="card-title">Category Breakdown</div><div className="card-subtitle">Units sold by category · {dateRange}</div></div></div>
            {catDemand.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={catDemand} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="demand" name="Demand" radius={[4, 4, 0, 0]}>{catDemand.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Upload data to see category breakdown</div>}
          </div>
        </div>

        <div>
          <div className="card fade-up" style={{ opacity: 0, animationDelay: '.15s' }}>
            <div className="card-header"><div className="card-title">Export Report</div></div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label">Report Type</label>
                <select className="filter-select" style={{ width: '100%' }} value={activeType} onChange={e => setActiveType(e.target.value)}>
                  {reportTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Date Range</label>
                <select className="filter-select" style={{ width: '100%' }} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                  {['All Time', 'This Month', 'Last 3 Months', 'YTD'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <button className="btn btn-primary" disabled={generating} onClick={() => handleGenerate('excel')}>
                  {generating ? <><Loader size={14} className="spin" /> Generating…</> : <><Download size={15} /> Export as Excel</>}
                </button>
              </div>
            </div>
          </div>

          <div className="card fade-up" style={{ opacity: 0, animationDelay: '.2s', marginTop: 16 }}>
            <div className="card-header"><div className="card-title">Recent Exports</div></div>
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentReports.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No reports yet. Generate your first report above.</p>}
              {recentReports.map(r => (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}.xlsx</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(r.readyAt)} · {formatFileSize(r.fileSize)}</div>
                  </div>
                  <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => handleDownload(r._id, r.name)} disabled={downloading === r._id}>
                    {downloading === r._id ? <Loader size={13} className="spin" /> : <Download size={13} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
