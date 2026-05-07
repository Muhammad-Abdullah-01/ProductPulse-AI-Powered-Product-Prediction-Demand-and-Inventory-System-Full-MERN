import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 40, textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: 'var(--accent-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, marginBottom: 24,
      }}>🔍</div>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800,
        color: 'var(--accent)', letterSpacing: '-2px', lineHeight: 1, marginBottom: 8,
      }}>404</h1>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
        color: 'var(--text-primary)', marginBottom: 12,
      }}>Page Not Found</h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 380, lineHeight: 1.6, marginBottom: 32 }}>
        The page you're looking for doesn't exist or has been moved. Head back to the dashboard to continue.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn btn-primary"
        style={{ fontSize: 15, padding: '12px 28px' }}
      >
        Go to Dashboard <ArrowRight size={16} />
      </button>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-secondary"
        style={{ fontSize: 14, marginTop: 12 }}
      >
        ← Go Back
      </button>
    </div>
  );
}
