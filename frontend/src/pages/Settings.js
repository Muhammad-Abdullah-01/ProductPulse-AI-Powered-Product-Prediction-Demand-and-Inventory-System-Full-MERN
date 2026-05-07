import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Camera, Lock, Bell, Globe, Shield, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}

function RevokeModal({ onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, maxWidth: 400, width: '90%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--status-red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={20} style={{ color: 'var(--status-red)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Revoke All Sessions?</h3>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
          This will sign out all other devices. You will remain logged in here.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}><Shield size={13} /> Revoke All Sessions</button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, toggle } = useTheme();
  const [user, setUser]   = useState(JSON.parse(localStorage.getItem('pp_user') || '{}'));
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [twofa,   set2fa]     = useState(user.twoFactorEnabled || false);
  const [notifs,  setNotifs]  = useState(user.notifications || { email: true, push: false, alerts: true, reports: true });
  const [prefs,   setPrefs]   = useState(user.preferences   || { defaultRegion: 'All', defaultCategory: 'All' });
  const [showRevoke, setShowRevoke] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data = await api.updateProfile({
        name:          user.name,
        email:         user.email,
        phone:         user.phone,
        company:       user.company,
        notifications: notifs,
        preferences:   { ...prefs, theme },
      });
      localStorage.setItem('pp_user', JSON.stringify(data.user));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await api.revokeSessions();
      setShowRevoke(false);
      alert('All other sessions have been revoked.');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {showRevoke && <RevokeModal onConfirm={handleRevoke} onCancel={() => setShowRevoke(false)} />}

      <div className="page-header">
        <h1 className="page-greeting fade-up" style={{ opacity: 0 }}>Settings</h1>
        <p className="page-subtitle fade-up" style={{ opacity: 0, animationDelay: '.08s' }}>Manage your profile, security, and preferences</p>
      </div>

      {/* Profile */}
      <div className="settings-section fade-up" style={{ opacity: 0, animationDelay: '.1s' }}>
        <div className="settings-section-header"><Camera size={14} style={{ color: 'var(--text-muted)' }} /> Profile</div>
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'white' }}>
                {(user.name || 'AS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{user.name}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</p>
              <span className="badge badge-info" style={{ marginTop: 6 }}>{user.role || 'analyst'}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 20 }}>
            {[
              { label: 'Full Name',     key: 'name',    type: 'text'  },
              { label: 'Email Address', key: 'email',   type: 'email' },
              { label: 'Phone Number',  key: 'phone',   type: 'tel'   },
              { label: 'Company',       key: 'company', type: 'text'  },
            ].map(f => (
              <div key={f.key}>
                <label className="input-label">{f.label}</label>
                <input className="input-field" type={f.type} value={user[f.key] || ''}
                  onChange={e => setUser(u => ({ ...u, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="settings-section fade-up" style={{ opacity: 0, animationDelay: '.15s' }}>
        <div className="settings-section-header"><Lock size={14} style={{ color: 'var(--text-muted)' }} /> Security</div>
        <div className="settings-row">
          <div><div className="settings-label">Two-Factor Authentication</div><div className="settings-desc">{twofa ? 'Active' : 'Disabled — recommended for security'}</div></div>
          <ToggleSwitch checked={twofa} onChange={set2fa} />
        </div>
        <div className="settings-row" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="settings-label">Active Sessions</div>
            <div className="settings-desc">{user.sessions?.length || 1} device(s) signed in</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 5, fontWeight: 500 }}>ℹ️ You will remain logged in on this device.</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setShowRevoke(true)}><Shield size={12} /> Revoke All</button>
        </div>
      </div>

      {/* Preferences */}
      <div className="settings-section fade-up" style={{ opacity: 0, animationDelay: '.2s' }}>
        <div className="settings-section-header"><Globe size={14} style={{ color: 'var(--text-muted)' }} /> Preferences</div>
        <div className="settings-row">
          <div><div className="settings-label">Theme</div><div className="settings-desc">Choose light or dark interface</div></div>
          <div className="theme-toggle">
            <button className={`theme-btn${theme === 'light' ? ' active' : ''}`} onClick={() => toggle('light')}>☀️</button>
            <button className={`theme-btn${theme === 'dark' ? ' active' : ''}`}  onClick={() => toggle('dark')}>🌙</button>
          </div>
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Default Region</div></div>
          <select className="filter-select" value={prefs.defaultRegion} onChange={e => setPrefs(p => ({ ...p, defaultRegion: e.target.value }))}>
            {['All', 'North', 'South', 'East', 'West'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Default Category</div></div>
          <select className="filter-select" value={prefs.defaultCategory} onChange={e => setPrefs(p => ({ ...p, defaultCategory: e.target.value }))}>
            {['All', 'Electronics', 'Fashion', 'Groceries', 'Sports', 'Beauty'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Notifications */}
      <div className="settings-section fade-up" style={{ opacity: 0, animationDelay: '.25s' }}>
        <div className="settings-section-header"><Bell size={14} style={{ color: 'var(--text-muted)' }} /> Notifications</div>
        {[
          { key: 'email',   label: 'Email Notifications',        desc: 'Receive daily digest via email'           },
          { key: 'push',    label: 'Push Notifications',         desc: 'Browser push alerts for critical events'  },
          { key: 'alerts',  label: 'Stock Alert Notifications',  desc: 'Notify when items reach critical threshold'},
          { key: 'reports', label: 'Report Ready Notifications', desc: 'Notify when scheduled reports are ready'  },
        ].map(n => (
          <div key={n.key} className="settings-row">
            <div><div className="settings-label">{n.label}</div><div className="settings-desc">{n.desc}</div></div>
            <ToggleSwitch checked={notifs[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
          </div>
        ))}
      </div>
    </div>
  );
}
