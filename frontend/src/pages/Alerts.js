import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Eye, Filter, X, AlertTriangle, Upload } from 'lucide-react';
import { api } from '../api/client';

const sevConfig = {
  critical: { label: 'Critical', badgeCls: 'badge-danger',  strip: 'var(--status-red)',    bg: 'var(--status-red-light)'    },
  warning:  { label: 'Warning',  badgeCls: 'badge-warning', strip: 'var(--status-orange)', bg: 'var(--status-orange-light)' },
  stable:   { label: 'Stable',   badgeCls: 'badge-success', strip: 'var(--status-green)',  bg: 'var(--status-green-light)'  },
};

function ConfirmModal({ product, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, maxWidth: 400, width: '90%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--status-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} style={{ color: 'var(--status-orange)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm Reorder</h3>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
          Place a reorder for <strong style={{ color: 'var(--text-primary)' }}>{product?.product || product?.name}</strong>? This will notify your supplier.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}><RefreshCw size={13} /> Confirm Reorder</button>
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts,     setAlerts]     = useState([]);
  const [counts,     setCounts]     = useState({ critical: 0, warning: 0, stable: 0 });
  const [loading,    setLoading]    = useState(true);
  const [catFilter,  setCatFilter]  = useState('All');
  const [sevFilter,  setSevFilter]  = useState('All');
  const [regFilter,  setRegFilter]  = useState('All');
  const [confirmItem, setConfirmItem] = useState(null);

  const fetchAlerts = useCallback(() => {
    const params = new URLSearchParams();
    if (catFilter !== 'All') params.set('category', catFilter);
    if (sevFilter !== 'All') params.set('severity', sevFilter);
    if (regFilter !== 'All') params.set('region',   regFilter);
    const qs = params.toString() ? '?' + params.toString() : '';

    setLoading(true);
    api.getAlerts(qs).then(d => {
      setAlerts(d.alerts || []);
      setCounts(d.counts || { critical: 0, warning: 0, stable: 0 });
    }).catch(console.error).finally(() => setLoading(false));
  }, [catFilter, sevFilter, regFilter]);

  // Re-fetch on filter change and on mount
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReorder = async () => {
    try {
      await api.placeReorder(confirmItem._id);
      setConfirmItem(null);
      fetchAlerts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.dismissAlert(id);
      fetchAlerts();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeFilters = [
    catFilter !== 'All' && { key: 'cat', label: `Category: ${catFilter}`, clear: () => setCatFilter('All') },
    sevFilter !== 'All' && { key: 'sev', label: `Severity: ${sevFilter}`, clear: () => setSevFilter('All') },
    regFilter !== 'All' && { key: 'reg', label: `Region: ${regFilter}`,   clear: () => setRegFilter('All') },
  ].filter(Boolean);

  const summaryCards = [
    { key: 'critical', emoji: '🔴', label: 'Critical', color: 'var(--status-red)'    },
    { key: 'warning',  emoji: '🟠', label: 'Warning',  color: 'var(--status-orange)' },
    { key: 'stable',   emoji: '🟢', label: 'Stable',   color: 'var(--status-green)'  },
  ];

  const totalAlerts = counts.critical + counts.warning + counts.stable;

  return (
    <div>
      {confirmItem && <ConfirmModal product={confirmItem} onConfirm={handleReorder} onCancel={() => setConfirmItem(null)} />}

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-greeting fade-up" style={{ opacity: 0 }}>Alerts</h1>
          <p className="page-subtitle fade-up" style={{ opacity: 0, animationDelay: '.08s' }}>Stock alerts and inventory risk monitoring</p>
        </div>
        <button className="btn btn-secondary btn-sm fade-up" style={{ opacity: 0, animationDelay: '.08s' }} onClick={fetchAlerts}><RefreshCw size={13} /> Refresh</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: activeFilters.length ? 12 : 24, flexWrap: 'wrap' }}>
        {summaryCards.map(s => (
          <div key={s.key} className="card fade-up" style={{ opacity: 0, padding: 0, overflow: 'hidden', minWidth: 120 }}>
            <div style={{ height: 4, background: s.color, borderRadius: '12px 12px 0 0' }} />
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{counts[s.key] || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ flex: 1 }} />
        <div className="fade-up" style={{ opacity: 0, animationDelay: '.2s', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {['All', 'Electronics', 'Fashion', 'Groceries', 'Sports', 'Beauty', 'Home & Garden', 'Appliances'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
            {['All', 'Critical', 'Warning', 'Stable'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="filter-select" value={regFilter} onChange={e => setRegFilter(e.target.value)}>
            {['All', 'North', 'South', 'East', 'West'].map(r => <option key={r}>{r}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchAlerts}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active filters:</span>
          {activeFilters.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, background: 'var(--accent-light)', border: '1px solid var(--accent)', fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
              {f.label}
              <button onClick={f.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center', padding: 0 }}><X size={12} /></button>
            </div>
          ))}
          <button onClick={() => { setCatFilter('All'); setSevFilter('All'); setRegFilter('All'); }} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{alerts.length}</strong> alerts
      </div>

      {loading ? <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div> : totalAlerts === 0 && catFilter === 'All' && sevFilter === 'All' && regFilter === 'All' ? (
        /* No alerts at all — show upload guidance */
        <div className="card fade-up" style={{ opacity: 0, animationDelay: '.25s', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No Alerts Yet</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
            Alerts are automatically generated when you upload sales data. The AI engine analyzes stock levels and creates critical, warning, and stable alerts based on forecasted demand.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}><Upload size={15} /> Upload Data to Generate Alerts</button>
        </div>
      ) : (
        <div className="card fade-up" style={{ opacity: 0, animationDelay: '.25s' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Product</th><th>Category</th><th>Region</th><th>Status</th><th>Stock</th><th>Shortage Date</th><th>Severity</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div style={{ fontSize: 32 }}>🔍</div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No alerts match your filters</p>
                      <button onClick={() => { setCatFilter('All'); setSevFilter('All'); setRegFilter('All'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>Clear all filters</button>
                    </div>
                  </td></tr>
                ) : alerts.map(alert => (
                  <tr key={alert._id}>
                    <td style={{ fontWeight: 600 }}>{alert.product}</td>
                    <td><span className="badge badge-info">{alert.category}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{alert.region}</td>
                    <td><span className={`badge ${sevConfig[alert.severity]?.badgeCls}`}>{alert.stockStatus}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 56 }}>
                          <div className="progress-fill" style={{ width: `${Math.min((alert.stock / Math.max(alert.required, 1)) * 100, 100)}%`, background: alert.severity === 'critical' ? 'var(--status-red)' : alert.severity === 'warning' ? 'var(--status-orange)' : 'var(--status-green)' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: alert.severity === 'critical' ? 'var(--status-red)' : 'var(--text-primary)' }}>{alert.stock}</span>
                      </div>
                    </td>
                    <td style={{ color: alert.shortageDate === '—' ? 'var(--text-muted)' : 'var(--status-orange)', fontWeight: alert.shortageDate !== '—' ? 600 : 400 }}>{alert.shortageDate}</td>
                    <td><span className={`badge ${sevConfig[alert.severity]?.badgeCls}`}>{sevConfig[alert.severity]?.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {alert.severity !== 'stable' ? (
                          alert.reorderPlaced ? (
                            <span className="badge badge-success" style={{ fontSize: 11 }}>✓ Reordered</span>
                          ) : (
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmItem(alert)}><RefreshCw size={11} /> Reorder</button>
                          )
                        ) : (
                          <button className="btn btn-secondary btn-sm"><Eye size={11} /> Monitor</button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDismiss(alert._id)} title="Dismiss alert"><X size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
