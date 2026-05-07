import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, X, ArrowRight, BarChart3, Bell } from 'lucide-react';

const ACCEPTED_EXT = ['.csv', '.xlsx', '.xls'];

export default function UploadData() {
  const navigate = useNavigate();
  const [file,       setFile]       = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [prog,       setProg]       = useState(0);
  const [proc,       setProc]       = useState(false);
  const [done,       setDone]       = useState(false);
  const [typeError,  setTypeError]  = useState('');
  const [uploadId,   setUploadId]   = useState(null);
  const [validation, setValidation] = useState([]);
  const [preview,    setPreview]    = useState([]);
  const [uploadSummary, setUploadSummary] = useState(null);
  const inputRef    = useRef();
  const pollRef     = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) {
      setTypeError(`"${f.name}" is not supported. Please upload .csv, .xlsx, or .xls`);
      setFile(null);
      return;
    }
    setTypeError('');
    setFile(f);
    setProg(0);
    setDone(false);
    setValidation([]);
    setPreview([]);
    setUploadSummary(null);
  };

  // Poll upload status while processing
  useEffect(() => {
    if (!uploadId || done) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/uploads/${uploadId}/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('pp_token')}` }
        });
        const data = await res.json();
        const status = data.upload?.status;
        const total  = data.upload?.rowsTotal || 100;
        const imp    = data.upload?.rowsImported || 0;

        setProg(total > 0 ? Math.round((imp / total) * 100) : 50);

        if (status === 'completed') {
          setProg(100);
          setDone(true);
          setProc(false);
          setValidation(data.upload?.validationWarnings || []);
          setUploadSummary(data.upload?.predictionSummary || null);
          clearInterval(pollRef.current);
          // Signal other pages to re-fetch data
          localStorage.setItem('pp_data_updated', Date.now().toString());

          // Fetch preview
          const prev = await fetch(`http://localhost:5000/api/uploads/${uploadId}/preview`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('pp_token')}` }
          });
          const prevData = await prev.json();
          setPreview(prevData.rows || []);
        } else if (status === 'failed') {
          setProc(false);
          setTypeError(data.upload?.errorMessage || 'Upload failed.');
          clearInterval(pollRef.current);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000);
    return () => clearInterval(pollRef.current);
  }, [uploadId, done]);

  const handleProcess = async () => {
    if (!file) return;
    setProc(true);
    setProg(5);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:5000/api/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('pp_token')}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUploadId(data.uploadId);
    } catch (err) {
      setTypeError(err.message);
      setProc(false);
    }
  };

  const handleCancel = () => {
    clearInterval(pollRef.current);
    setProc(false);
    setProg(0);
    setFile(null);
    setDone(false);
    setUploadId(null);
    setValidation([]);
    setPreview([]);
    setUploadSummary(null);
  };

  const iconMap = { error: XCircle, warning: AlertTriangle, info: CheckCircle, success: CheckCircle };
  const colorMap = { error: 'var(--status-red)', warning: 'var(--status-orange)', info: 'var(--status-green)', success: 'var(--status-green)' };
  const bgMap    = { error: 'var(--status-red-light)', warning: 'var(--status-orange-light)', info: 'var(--status-green-light)', success: 'var(--status-green-light)' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-greeting fade-up" style={{ opacity: 0 }}>Upload Data</h1>
        <p className="page-subtitle fade-up" style={{ opacity: 0, animationDelay: '.08s' }}>Import CSV or Excel files to feed the AI prediction engine</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card fade-up" style={{ opacity: 0, animationDelay: '.1s' }}>
            <div className="card-header"><div><div className="card-title">Upload Data File</div><div className="card-subtitle">Drag & drop or click to browse</div></div></div>
            <div style={{ padding: '0 20px 20px' }}>
              {typeError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--status-red-light)', border: '1px solid var(--status-red)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--status-red)' }}>
                  <XCircle size={15} style={{ flexShrink: 0 }} />{typeError}
                  <button onClick={() => setTypeError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-red)' }}><X size={14} /></button>
                </div>
              )}
              <div className={`dropzone${dragging ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current.click()}
              >
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={e => handleFile(e.target.files[0])} />
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>📤</div>
                {file ? (
                  <><p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{file.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB · Click to replace</p></>
                ) : (
                  <><p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Drag & drop your file here</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Accepted: <strong>.csv, .xlsx, .xls</strong> · Max 50 MB</p></>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(proc || done) && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{done ? 'Processing complete' : 'Processing…'}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{prog}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${prog}%`, background: done ? 'var(--status-green)' : 'var(--accent)' }} /></div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" disabled={!file || proc} onClick={handleProcess} style={{ opacity: (!file || proc) ? 0.6 : 1 }}>
                    <Upload size={15} />{proc ? 'Processing…' : done ? '✓ Processed' : 'Upload & Process'}
                  </button>
                  {proc  && <button className="btn btn-secondary" onClick={handleCancel}><X size={14} /> Cancel</button>}
                  {done  && <button className="btn btn-secondary" onClick={handleCancel}>Upload Another</button>}
                </div>
              </div>
            </div>
          </div>

          {/* Post-upload navigation CTAs */}
          {done && (
            <div className="card fade-up" style={{ opacity: 0, animationDelay: '.05s' }}>
              <div className="card-header"><div><div className="card-title">🎉 Upload Complete — What's Next?</div><div className="card-subtitle">Your data has been processed and AI predictions are ready</div></div></div>
              <div style={{ padding: '0 20px 20px' }}>
                {uploadSummary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: 14, borderRadius: 10, background: 'var(--accent-light)', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{uploadSummary.forecastedDemand?.toLocaleString() || 0}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Forecasted Demand</div>
                    </div>
                    <div style={{ padding: 14, borderRadius: 10, background: 'var(--status-red-light)', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-red)', fontFamily: 'var(--font-display)' }}>{uploadSummary.criticalAlerts || 0}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Critical Alerts</div>
                    </div>
                    <div style={{ padding: 14, borderRadius: 10, background: 'var(--status-green-light)', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-green)', fontFamily: 'var(--font-display)' }}>{uploadSummary.modelConfidence || 0}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Model Confidence</div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/dashboard')}><BarChart3 size={14} /> View Dashboard <ArrowRight size={13} /></button>
                  <button className="btn btn-secondary" onClick={() => navigate('/analytics')}><BarChart3 size={14} /> View Analytics</button>
                  <button className="btn btn-secondary" onClick={() => navigate('/alerts')}><Bell size={14} /> View Alerts</button>
                </div>
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <div className="card fade-up" style={{ opacity: 0, animationDelay: '.05s' }}>
              <div className="card-header">
                <div><div className="card-title">Data Preview</div><div className="card-subtitle">First {preview.length} rows</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} style={{ color: 'var(--text-muted)' }} /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{file?.name}</span></div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Product ID</th><th>Product Name</th><th>Category</th><th>Region</th><th>Sales</th><th>Month</th></tr></thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{row.productId}</span></td>
                        <td style={{ fontWeight: 500 }}>{row.productName}</td>
                        <td><span className="badge badge-info">{row.category}</span></td>
                        <td>{row.region}</td>
                        <td><strong>{row.sales?.toLocaleString()}</strong></td>
                        <td style={{ color: 'var(--text-muted)' }}>{row.month}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card fade-up" style={{ opacity: 0, animationDelay: '.15s' }}>
            <div className="card-header"><div className="card-title">Validation Results</div></div>
            <div style={{ padding: '0 16px 20px' }}>
              {!file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8, color: 'var(--text-muted)', textAlign: 'center' }}>
                  <span style={{ fontSize: 24 }}>📋</span>
                  <p style={{ fontSize: 13, lineHeight: 1.5 }}>Upload a file to see validation results.</p>
                </div>
              ) : validation.length === 0 && !done ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>{proc ? 'Validating…' : 'Results will appear after processing.'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {validation.map((v, i) => {
                    const Icon = iconMap[v.type] || CheckCircle;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: bgMap[v.type], border: `1px solid ${colorMap[v.type]}33` }}>
                        <Icon size={16} style={{ color: colorMap[v.type], flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>{v.message}</span>
                      </div>
                    );
                  })}
                  {done && validation.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--status-green-light)', border: '1px solid var(--status-green)33' }}>
                      <CheckCircle size={16} style={{ color: 'var(--status-green)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>All rows validated successfully!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card fade-up" style={{ opacity: 0, animationDelay: '.2s' }}>
            <div className="card-header"><div className="card-title">Accepted Formats</div></div>
            <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ fmt: 'CSV', ext: '.csv', desc: 'Comma-separated values' }, { fmt: 'Excel', ext: '.xlsx', desc: 'Microsoft Excel workbook' }, { fmt: 'Legacy Excel', ext: '.xls', desc: 'Older Excel format' }].map(f => (
                <div key={f.fmt} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '3px 7px', background: 'var(--bg-tertiary)', borderRadius: 5, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{f.ext}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{f.fmt}</div><div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{f.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card fade-up" style={{ opacity: 0, animationDelay: '.25s' }}>
            <div className="card-header"><div className="card-title">Required Columns</div></div>
            <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { col: 'product_name', req: true,  desc: 'Product name' },
                { col: 'category',     req: true,  desc: 'Electronics, Fashion, etc.' },
                { col: 'region',       req: true,  desc: 'North, South, East, West' },
                { col: 'sales',        req: true,  desc: 'Units sold' },
                { col: 'month / date', req: true,  desc: '"Mar 2025" or "2025-03-01"' },
                { col: 'stock',        req: false, desc: 'Current inventory (for AI)' },
                { col: 'price',        req: false, desc: 'Selling price per unit' },
                { col: 'cost',         req: false, desc: 'Cost per unit' },
              ].map(c => (
                <div key={c.col} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 6px', background: c.req ? 'var(--accent-light)' : 'var(--bg-tertiary)', borderRadius: 4, color: c.req ? 'var(--accent)' : 'var(--text-muted)', border: `1px solid ${c.req ? 'var(--accent)' : 'var(--border)'}`, fontWeight: 600 }}>{c.col}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{c.desc}</span>
                  {c.req && <span style={{ fontSize: 10, color: 'var(--status-red)', fontWeight: 700 }}>*</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
