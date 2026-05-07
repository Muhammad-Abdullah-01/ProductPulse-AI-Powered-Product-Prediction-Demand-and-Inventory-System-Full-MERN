import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, Upload,
  FileText, AlertTriangle, Settings
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/analytics', icon: BarChart2,        label: 'Analytics'   },
  { to: '/upload',    icon: Upload,            label: 'Upload Data' },
  { to: '/reports',   icon: FileText,          label: 'Reports'     },
  { to: '/alerts',    icon: AlertTriangle,     label: 'Alerts'      },
  { to: '/settings',  icon: Settings,          label: 'Settings'    },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Dark overlay — mobile only */}
      {isOpen && (
        <div className="sidebar-overlay visible" onClick={onClose} />
      )}

      <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              // NOTE: no "end" prop — every route is unique so exact match
              // is automatic. "end" on /dashboard would de-activate it on
              // child routes; removing it keeps highlight stable.
              className={({ isActive }) =>
                `sidebar-item${isActive ? ' active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={20} className="sidebar-icon" />
              <span className="sidebar-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
