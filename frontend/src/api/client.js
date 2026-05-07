const BASE = 'http://localhost:5000/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('pp_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}

export async function apiDownload(path) {
  const token = localStorage.getItem('pp_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  return blob;
}

export const api = {
  // Auth
  login:          (body) => apiFetch('/auth/login',          { method: 'POST', body: JSON.stringify(body) }),
  register:       (body) => apiFetch('/auth/register',       { method: 'POST', body: JSON.stringify(body) }),
  getMe:          ()     => apiFetch('/auth/me'),
  updateProfile:  (body) => apiFetch('/auth/update-profile', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body) => apiFetch('/auth/change-password',{ method: 'PATCH', body: JSON.stringify(body) }),
  revokeSessions: ()     => apiFetch('/auth/revoke-sessions', { method: 'DELETE' }),

  // Dashboard
  getKPIs:          () => apiFetch('/dashboard/kpis'),
  getProfitTrend:   () => apiFetch('/dashboard/profit-trend'),
  getCategoryDemand:() => apiFetch('/dashboard/category-demand'),
  getRegional:      () => apiFetch('/dashboard/regional-distribution'),
  getActivity:      () => apiFetch('/dashboard/recent-activity'),
  getTopAlerts:     () => apiFetch('/dashboard/top-alerts'),

  // Analytics
  getForecast:      (params = '') => apiFetch(`/analytics/forecast${params}`),
  getGenderSales:   ()            => apiFetch('/analytics/gender-sales'),
  getRegionalGrowth:()            => apiFetch('/analytics/regional-growth'),
  getHeatmap:       ()            => apiFetch('/analytics/heatmap'),
  getAIInsights:    ()            => apiFetch('/analytics/ai-insights'),

  // Alerts
  getAlerts:       (params = '') => apiFetch(`/alerts${params}`),
  getAlertsSummary:()            => apiFetch('/alerts/summary'),
  placeReorder:    (id)          => apiFetch(`/alerts/${id}/reorder`, { method: 'POST' }),
  dismissAlert:    (id)          => apiFetch(`/alerts/${id}/dismiss`, { method: 'PATCH' }),

  // Reports
  getReportSummary:  (params = '') => apiFetch(`/reports/summary${params}`),
  getReportTrend:    ()            => apiFetch('/reports/profit-trend'),
  getReportCategory: ()            => apiFetch('/reports/category-demand'),
  getAlertTrend:     ()            => apiFetch('/reports/alert-trend'),
  getRecentReports:  ()            => apiFetch('/reports/recent'),
  generateReport:    (body)        => apiFetch('/reports/generate', { method: 'POST', body: JSON.stringify(body) }),
  downloadReport:    (id)          => apiDownload(`/reports/${id}/download`),

  // Uploads
  listUploads:      ()  => apiFetch('/uploads'),
  getUploadStatus:  (id)=> apiFetch(`/uploads/${id}/status`),
  getUploadPreview: (id)=> apiFetch(`/uploads/${id}/preview`),
};
