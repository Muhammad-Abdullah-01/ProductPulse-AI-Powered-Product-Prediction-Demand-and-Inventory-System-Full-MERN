import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, BarChart2, Upload, AlertTriangle,
  FileText, Zap, Shield, ChevronRight, ArrowRight,
  Package, Globe, Brain
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Demand Forecasting',
    desc: 'ML-powered predictions with 91%+ accuracy. Know what your customers want before they do.',
    color: '#1A7A3A',
    bg: '#EBF5EE',
  },
  {
    icon: AlertTriangle,
    title: 'Real-Time Stock Alerts',
    desc: 'Instant notifications when inventory hits critical thresholds. Never face an out-of-stock again.',
    color: '#D35400',
    bg: '#FDF0E8',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    desc: 'Heatmaps, regional breakdowns, gender-split sales, and category trends — all in one view.',
    color: '#2D9D5C',
    bg: '#E8F7EE',
  },
  {
    icon: Upload,
    title: 'Instant Data Import',
    desc: 'Upload CSV or Excel files in seconds. Auto-validation catches errors before they cause damage.',
    color: '#1A5276',
    bg: '#EAF2F8',
  },
  {
    icon: FileText,
    title: 'One-Click Reports',
    desc: 'Export polished PDF and Excel reports. Monthly summaries, category performance, inventory health.',
    color: '#4CAF72',
    bg: '#EDF8F2',
  },
  {
    icon: Globe,
    title: 'Regional Intelligence',
    desc: 'Drill into North, South, East, West performance. Find your strongest markets instantly.',
    color: '#76C893',
    bg: '#F2FAF5',
  },
];

const STATS = [
  { value: '91%', label: 'Forecast Accuracy' },
  { value: '3×',  label: 'Faster Decisions'  },
  { value: '40%', label: 'Less Overstock'    },
  { value: '24/7',label: 'Live Monitoring'   },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Head of Supply Chain · RetailCo',
    quote: 'ProductPulse cut our overstock by 38% in the first quarter. The AI insights are genuinely impressive.',
    avatar: 'SC',
  },
  {
    name: 'James Okafor',
    role: 'Operations Director · MegaMart',
    quote: 'We used to spend 3 days compiling monthly reports. Now it takes 30 seconds. Game changer.',
    avatar: 'JO',
  },
  {
    name: 'Priya Sharma',
    role: 'VP Inventory · FreshGrocer',
    quote: 'The regional breakdown feature alone saved us from a major stockout crisis. Worth every penny.',
    avatar: 'PS',
  },
];

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ value, label }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const isPercent = value.includes('%');
        const isX = value.includes('×');
        const isSlash = value.includes('/');
        if (isSlash) { setDisplay(value); return; }
        const num = parseFloat(value);
        const dur = 1200;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          const cur = (num * ease).toFixed(num % 1 !== 0 ? 0 : 0);
          setDisplay(cur + (isPercent ? '%' : isX ? '×' : ''));
          if (t < 1) requestAnimationFrame(tick);
          else setDisplay(value);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800,
        color: 'var(--accent)', letterSpacing: '-2px', lineHeight: 1,
      }}>{display}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Parallax offset for hero elements
  const parallax = scrollY * 0.25;

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', padding: '0 48px',
        height: 64,
        background: scrollY > 40 ? 'var(--header-bg)' : 'transparent',
        backdropFilter: scrollY > 40 ? 'blur(12px)' : 'none',
        borderBottom: scrollY > 40 ? '1px solid var(--border)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #1A7A3A, #4CAF72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={17} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
            color: 'var(--accent)', letterSpacing: '-0.5px',
          }}>ProductPulse</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32, margin: '0 auto' }}>
          {['Features', 'Analytics', 'Pricing', 'About'].map(item => (
            <a key={item} href="#features" style={{
              fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
            >{item}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '8px 20px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 13.5,
              fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          >Log In</button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none',
              background: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: 13.5,
              fontWeight: 600, color: 'white', cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(26,122,58,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,122,58,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,122,58,0.3)'; }}
          >Get Started</button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 48px 80px',
        position: 'relative', overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}>
        {/* Soft radial glow — no grid, no black-to-green gradient */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%',
          transform: `translateX(-50%) translateY(${parallax}px)`,
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(26,122,58,0.10) 0%, rgba(45,157,92,0.04) 50%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(76,175,114,0.08) 0%, transparent 70%)',
          filter: 'blur(32px)', pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 9999,
          background: 'var(--accent-light)', border: '1px solid var(--border)',
          marginBottom: 28,
          animation: 'fadeUp 0.5s ease forwards', opacity: 0,
        }}>
          <Zap size={13} color="var(--accent)" style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>
            AI-Powered Demand Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 6vw, 72px)',
          fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center',
          lineHeight: 1.1, letterSpacing: '-2px', maxWidth: 820,
          animation: 'fadeUp 0.5s 0.1s ease forwards', opacity: 0,
        }}>
          Predict Demand.{' '}
          <span style={{
            color: 'var(--accent)',
            borderBottom: '3px solid var(--accent)',
            paddingBottom: 2,
          }}>Eliminate</span>{' '}Stockouts.
          <br />Grow Smarter.
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 18, color: 'var(--text-secondary)', textAlign: 'center',
          maxWidth: 560, marginTop: 24, lineHeight: 1.7,
          animation: 'fadeUp 0.5s 0.2s ease forwards', opacity: 0,
        }}>
          ProductPulse uses machine learning to forecast what your customers want,
          alert you before stock runs dry, and turn your sales data into crystal-clear insights.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 14, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.5s 0.3s ease forwards', opacity: 0,
        }}>
          <button
            onClick={() => navigate('/signup')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 12, border: 'none',
              background: 'var(--accent)', color: 'white',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.25s',
              boxShadow: '0 4px 20px rgba(26,122,58,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(26,122,58,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,122,58,0.4)'; }}
          >
            Start Free Trial <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 12,
              background: 'var(--card-bg)', border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.25s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Sign In <ChevronRight size={16} />
          </button>
        </div>

        {/* Social proof */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 40,
          animation: 'fadeUp 0.5s 0.4s ease forwards', opacity: 0,
        }}>
          <div style={{ display: 'flex' }}>
            {['SC','JO','PS','MK','AL'].map((a, i) => (
              <div key={i} style={{
                width: 30, height: 30, borderRadius: '50%',
                background: `linear-gradient(135deg, ${['#1A7A3A','#2D9D5C','#4CAF72','#0D5C28','#76C893'][i]}, #A8DAB5)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white',
                border: '2px solid var(--bg-primary)',
                marginLeft: i > 0 ? -8 : 0,
              }}>{a}</div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>500+</strong> retailers already using ProductPulse
          </span>
        </div>

        {/* Dashboard preview mockup */}
        <div style={{
          marginTop: 64,
          width: '100%', maxWidth: 900,
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--border)',
          animation: 'fadeUp 0.6s 0.5s ease forwards', opacity: 0,
          transform: 'translateY(20px)',
        }}>
          {/* Browser chrome */}
          <div style={{
            background: 'var(--bg-tertiary)', padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {['#C0392B','#D35400','#1A7A3A'].map((c,i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
            <div style={{
              flex: 1, margin: '0 16px', height: 22, borderRadius: 6,
              background: 'var(--border)', display: 'flex', alignItems: 'center',
              padding: '0 12px',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>app.productpulse.io/dashboard</span>
            </div>
          </div>
          {/* Fake dashboard preview */}
          <div style={{ padding: 24, background: 'var(--bg-primary)' }}>
            {/* Mini KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { l:'Top Categories', v:'8', e:'🏷️' },
                { l:'Forecast 30d', v:'24.8K', e:'📈' },
                { l:'Overstock Risk', v:'14%', e:'📦' },
                { l:'OOS Alerts', v:'37', e:'⚠️' },
                { l:'Total Profit', v:'$182K', e:'💰' },
              ].map((k,i) => (
                <div key={i} style={{
                  background: 'var(--card-bg)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 14px',
                  borderTop: '3px solid #1A7A3A',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{k.l}</span>
                    <span style={{ fontSize: 14 }}>{k.e}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{k.v}</div>
                </div>
              ))}
            </div>
            {/* Mini chart bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Profit Trend</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
                  {[40,55,65,80,72,90,85,100].map((h,i) => (
                    <div key={i} style={{
                      flex: 1, height: h+'%', borderRadius: '3px 3px 0 0',
                      background: `rgba(26,122,58,${0.3 + i*0.1})`,
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Category Demand</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
                  {[70,62,85,40,32,50].map((h,i) => (
                    <div key={i} style={{
                      flex: 1, height: h+'%', borderRadius: '3px 3px 0 0',
                      background: ['#1A7A3A','#2D9D5C','#4CAF72','#76C893','#A8DAB5','#0D5C28'][i],
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 48px',
        background: 'var(--accent)',
      }}>
        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32,
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800,
                color: 'white', letterSpacing: '-2px', lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 48px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 9999,
              background: 'var(--accent-light)', border: '1px solid var(--border)',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Everything You Need
              </span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px',
              lineHeight: 1.15,
            }}>
              One platform for all your<br />
              <span style={{ color: 'var(--accent)' }}>inventory intelligence</span>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 16, maxWidth: 500, margin: '16px auto 0' }}>
              From demand forecasting to one-click exports — everything your team needs to make smarter stock decisions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: 28,
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(26,122,58,0.12)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Icon size={20} style={{ color: f.color }} />
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                    color: 'var(--text-primary)', marginBottom: 8,
                  }}>{f.title}</h3>
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 48px', background: 'var(--bg-tertiary)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 38px)',
              fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px',
            }}>Trusted by retail leaders</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 28,
              }}>
                <div style={{ fontSize: 28, color: 'var(--accent)', fontFamily: 'Georgia', marginBottom: 12, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 20 }}>
                  {t.quote}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'white',
                    fontFamily: 'var(--font-display)',
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 48px', textAlign: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Package size={28} color="white" />
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px',
            lineHeight: 1.15, marginBottom: 16,
          }}>
            Ready to stop guessing<br />and start <span style={{ color: 'var(--accent)' }}>knowing</span>?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 36, lineHeight: 1.7 }}>
            Join 500+ retailers who use ProductPulse to make smarter inventory decisions every single day.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 36px', borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: 'white',
                fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.25s',
                boxShadow: '0 4px 20px rgba(26,122,58,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Create Free Account <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 36px', borderRadius: 12,
                background: 'transparent', border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '32px 48px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg, #1A7A3A, #4CAF72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={12} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
            ProductPulse
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          © 2025 ProductPulse · AI Demand Intelligence
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
