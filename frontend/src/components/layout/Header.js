import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, ChevronDown, Menu, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ onMenuToggle }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('pp_user') || '{}');
  const userName = user.name || 'User';
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const displayName = userName.split(' ').map((n, i) => i === 0 ? n : n[0] + '.').join(' ');

  const handleLogout = () => {
    localStorage.removeItem('pp_token');
    localStorage.removeItem('pp_user');
    localStorage.removeItem('pp_data_updated');
    navigate('/login');
  };

  return (
    <header className="header">
      {/* Mobile Hamburger */}
      <button className="hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
        <span /><span /><span />
      </button>

      {/* Logo */}
      <div className="header-logo">
        <span className="header-logo-name">ProductPulse</span>
        <span className="header-logo-subtitle">AI Demand Intelligence</span>
      </div>

      {/* Theme Toggle */}
      <div className="theme-toggle" title="Toggle theme">
        <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => toggle('light')} aria-label="Light mode">☀️</button>
        <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => toggle('dark')} aria-label="Dark mode">🌙</button>
      </div>

      {/* Search */}
      <div className="header-search">
        <Search size={15} className="header-search-icon" />
        <input type="text" placeholder="Search products, categories…" />
      </div>

      {/* Actions */}
      <div className="header-actions">
        <div className="tooltip-wrap">
          <button className="icon-btn" aria-label="Notifications" onClick={() => navigate('/alerts')}>
            <Bell size={17} />
            <span className="notif-badge" />
          </button>
          <span className="tooltip-box">View alerts</span>
        </div>

        <div className="tooltip-wrap">
          <button className="icon-btn" aria-label="Settings" onClick={() => navigate('/settings')}>
            <Settings size={17} />
          </button>
          <span className="tooltip-box">Settings</span>
        </div>

        <div className="user-avatar-btn">
          <div className="user-avatar">{initials}</div>
          <span className="user-name">{displayName}</span>
          <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
        </div>

        <div className="tooltip-wrap">
          <button className="icon-btn" aria-label="Logout" onClick={handleLogout} style={{ marginLeft: 4 }}>
            <LogOut size={16} />
          </button>
          <span className="tooltip-box">Sign out</span>
        </div>
      </div>
    </header>
  );
}
