import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({ email: '', password: '', global: '' });
  const [touched,  setTouched]  = useState({ email: false, password: false });

  const validate = (field, value) => {
    if (field === 'email') {
      if (!value) return 'Email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email.';
      return '';
    }
    if (field === 'password') {
      if (!value) return 'Password is required.';
      if (value.length < 6) return 'Password must be at least 6 characters.';
      return '';
    }
    return '';
  };

  const handleBlur = (field, value) => {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(p => ({ ...p, [field]: validate(field, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validate('email', email);
    const pwErr    = validate('password', password);
    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: pwErr, global: '' });
    if (emailErr || pwErr) return;

    setLoading(true);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem('pp_token', data.token);
      localStorage.setItem('pp_user',  JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setErrors(p => ({ ...p, global: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (field) => ({
    width: '100%', padding: '11px 14px',
    background: 'var(--card-bg)',
    border: `1.5px solid ${touched[field] && errors[field] ? 'var(--status-red)' : 'var(--border)'}`,
    borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 14,
    color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg-primary)' }}>
      {/* LEFT brand panel */}
      <div style={{ background: 'var(--accent)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white' }}>ProductPulse</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
            Welcome back to your<br />demand intelligence hub
          </h2>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 40 }}>
            Sign in to access dashboards, forecasts, alerts, and reports — all powered by AI.
          </p>
          {['📈  AI demand forecasting with 91% accuracy', '⚠️  Real-time stock alerts & reorder triggers', '📑  One-click PDF & Excel report exports'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: 'white', marginBottom: 8, textAlign: 'left' }}>{item}</div>
          ))}
        </div>
      </div>

      {/* RIGHT form */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 48px', background: 'var(--bg-primary)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 28, padding: 0 }}>
            <ArrowLeft size={14} /> Back to home
          </button>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Sign in</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
            </p>
          </div>

          {/* Global error */}
          {errors.global && (
            <div style={{ background: 'var(--status-red-light)', border: '1px solid var(--status-red)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--status-red)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {errors.global}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>Email address</label>
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); if (touched.email) setErrors(p => ({ ...p, email: validate('email', e.target.value) })); }}
                onBlur={e => handleBlur('email', e.target.value)}
                placeholder="you@company.com" style={fieldStyle('email')}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              />
              {touched.email && errors.email && <p style={{ fontSize: 12, color: 'var(--status-red)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={12} />{errors.email}</p>}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                <a href="#" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); if (touched.password) setErrors(p => ({ ...p, password: validate('password', e.target.value) })); }}
                  onBlur={e => handleBlur('password', e.target.value)}
                  placeholder="••••••••" style={{ ...fieldStyle('password'), paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.password && errors.password && <p style={{ fontSize: 12, color: 'var(--status-red)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}><AlertCircle size={12} />{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? 'var(--accent-2)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? (<><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Signing in…</>) : (<>Sign In <ArrowRight size={16} /></>)}
            </button>
          </form>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            Demo: <strong>alex@demo.com</strong> / <strong>demo1234</strong>
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
