import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#C0392B', '#D35400', '#2D9D5C', '#1A7A3A'];

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  return score;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    company: '', password: '', confirm: '',
  });
  const [showPw,    setShowPw]    = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [agreed,    setAgreed]    = useState(false);

  const strength = getStrength(form.password);
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirm) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.'); return;
    }
    if (strength < 2) {
      setError('Please choose a stronger password.'); return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service to continue.'); return;
    }

    setLoading(true);
    try {
      const data = await api.register({
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        password: form.password,
        company: form.company,
      });
      // Store token and user data so all pages work
      localStorage.setItem('pp_token', data.token);
      localStorage.setItem('pp_user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'var(--card-bg)', border: '1.5px solid var(--border)',
    borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 14,
    color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block', fontSize: 12.5, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 7,
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg-primary)',
    }}>

      {/* ── LEFT — Brand panel ───────────────────────────────────────────── */}
      <div style={{
        background: 'var(--accent)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-5%', left: '-5%',
          width: 380, height: 380, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-8%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)', filter: 'blur(32px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380, textAlign: 'center' }}>
          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, marginBottom: 48,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={22} color="white" />
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              color: 'white', letterSpacing: '-0.5px',
            }}>ProductPulse</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800,
            color: 'white', lineHeight: 1.2, letterSpacing: '-0.8px', marginBottom: 16,
          }}>
            Start making smarter<br />inventory decisions today
          </h2>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 40 }}>
            No credit card required. Get full access to AI forecasting, real-time alerts, and reporting from day one.
          </p>

          {/* What you get */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {[
              { e: '🆓', t: 'Free 14-day trial — no card needed'         },
              { e: '🤖', t: 'AI demand forecasting from day 1'            },
              { e: '📊', t: 'Full dashboard, analytics & alerts access'   },
              { e: '📑', t: 'Unlimited PDF & Excel report exports'        },
              { e: '🔒', t: 'Enterprise-grade security & data privacy'    },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '10px 16px', fontSize: 13, color: 'white',
              }}>
                <span style={{ fontSize: 16 }}>{item.e}</span>
                {item.t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px',
        background: 'var(--bg-primary)',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800,
              color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 8,
            }}>Create your account</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--status-red-light)', border: '1px solid var(--status-red)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              fontSize: 13, color: 'var(--status-red)',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>First Name <span style={{ color: 'var(--status-red)' }}>*</span></label>
                <input
                  value={form.firstName} onChange={set('firstName')}
                  placeholder="Alex" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name <span style={{ color: 'var(--status-red)' }}>*</span></label>
                <input
                  value={form.lastName} onChange={set('lastName')}
                  placeholder="Stevens" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Work Email <span style={{ color: 'var(--status-red)' }}>*</span></label>
              <input
                type="email" value={form.email} onChange={set('email')}
                placeholder="you@company.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Company */}
            <div>
              <label style={labelStyle}>Company Name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input
                value={form.company} onChange={set('company')}
                placeholder="RetailPro Inc." style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password <span style={{ color: 'var(--status-red)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength ? strengthColor[strength] : 'var(--border)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11.5, color: strengthColor[strength], fontWeight: 600 }}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={labelStyle}>Confirm Password <span style={{ color: 'var(--status-red)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConf ? 'text' : 'password'}
                  value={form.confirm} onChange={set('confirm')}
                  placeholder="Re-enter password"
                  style={{
                    ...inputStyle, paddingRight: 44,
                    borderColor: form.confirm && form.confirm !== form.password
                      ? 'var(--status-red)' : 'var(--border)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => {
                    e.target.style.borderColor =
                      form.confirm && form.confirm !== form.password
                        ? 'var(--status-red)' : 'var(--border)';
                  }}
                />
                <button type="button" onClick={() => setShowConf(p => !p)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle2 size={16} style={{
                    position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--status-green)',
                  }} />
                )}
              </div>
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ accentColor: 'var(--accent)', width: 15, height: 15, marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                I agree to the{' '}
                <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                  Terms of Service
                </a>{' '}and{' '}
                <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'var(--accent-2)' : 'var(--accent)',
                color: 'white', border: 'none', borderRadius: 10,
                fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, marginTop: 4,
                boxShadow: '0 4px 16px rgba(26,122,58,0.35)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? 'var(--accent-2)' : 'var(--accent)'; }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }} />
                  Creating your account…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Create Free Account <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>or sign up with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Google', icon: '🌐' },
              { label: 'Microsoft', icon: '🪟' },
            ].map(s => (
              <button key={s.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10,
                background: 'var(--card-bg)', border: '1.5px solid var(--border)',
                fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600,
                color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
