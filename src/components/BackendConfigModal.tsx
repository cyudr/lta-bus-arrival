import React, { useState } from 'react';
import { ApiConfiguration } from '../types/bus';
import { X, Server, CheckCircle2, AlertCircle, Copy, Check, Terminal, ExternalLink, RefreshCw } from 'lucide-react';

interface BackendConfigModalProps {
  config: ApiConfiguration;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newConfig: ApiConfiguration) => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ApiConfiguration>(config);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (formData.mode === 'simulation') {
      setTestStatus('success');
      setTestMessage('Simulation telemetry engine active with live GPS interpolation and LTA arrival formats.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging backend endpoint...');

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (formData.ltaAccountKey) {
        headers['AccountKey'] = formData.ltaAccountKey;
      }

      let testUrl = formData.customBackendUrl.trim() || '/api/busarrival';
      if (testUrl.includes('?')) {
        testUrl += '&BusStopCode=83139';
      } else if (testUrl.endsWith('/busarrival') || testUrl.endsWith('/busarrival.ts')) {
        testUrl += '?BusStopCode=83139';
      } else {
        testUrl = `${testUrl.replace(/\/$/, '')}/BusArrival?BusStopCode=83139`;
      }

      const res = await fetch(testUrl, { headers });
      const data = await res.json();

      if (!res.ok) {
        if (data && data.error === 'LTA_ACCOUNT_KEY_NOT_CONFIGURED') {
          setTestStatus('error');
          setTestMessage('Serverless endpoint is reachable! However, LTA_ACCOUNT_KEY is not yet configured.');
          return;
        }
        throw new Error(data?.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data && Array.isArray(data.Services)) {
        setTestStatus('success');
        setTestMessage(`Connection successful! Retrieved ${data.Services.length} live bus services from LTA DataMall v3.`);
      } else {
        setTestStatus('success');
        setTestMessage('Backend replied with JSON successfully.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Failed to connect to backend: ${err.message || 'Network error / CORS restriction'}`);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const sampleExpressSnippet = `// express-lta-proxy.ts
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

const LTA_KEY = process.env.LTA_DATAMALL_KEY; // Your LTA DataMall AccountKey

app.get('/api/lta/BusArrivalv2', async (req, res) => {
  const { BusStopCode } = req.query;
  const url = \`http://datamall2.mytransport.sg/ltaodataservice/v3/BusArrivalv2?BusStopCode=\${BusStopCode}\`;
  
  const response = await fetch(url, {
    headers: { 'AccountKey': LTA_KEY, 'accept': 'application/json' }
  });
  const data = await response.json();
  res.json(data);
});

app.listen(3000, () => console.log('LTA proxy listening on :3000'));`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">LTA DataMall & Backend Connection</h2>
              <p className="text-xs text-slate-400">
                Seamlessly toggle between live simulation and your custom backend API
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-slate-300">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Data Source Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'simulation' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.mode === 'simulation'
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-sm mb-1 flex items-center justify-between">
                  <span>Live Simulator Mode</span>
                  {formData.mode === 'simulation' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400">
                  Full Singapore fleet simulation with moving GPS vehicles and real arrival algorithms. Zero setup needed.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'backend' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.mode === 'backend'
                    ? 'bg-emerald-950/40 border-emerald-500/70 text-white shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-sm mb-1 flex items-center justify-between">
                  <span>Custom Backend API</span>
                  {formData.mode === 'backend' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-xs text-slate-400">
                  Connect your Node.js, Express, Go, or Python backend proxy that queries LTA DataMall v2.
                </p>
              </button>
            </div>
          </div>

          {/* Backend Configuration Fields */}
          {formData.mode === 'backend' && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Backend Base URL / Serverless Route
                </label>
                <input
                  type="text"
                  value={formData.customBackendUrl}
                  onChange={(e) => setFormData({ ...formData, customBackendUrl: e.target.value })}
                  placeholder="e.g. /api/busarrival or http://localhost:3000/api/busarrival"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Serverless endpoint: <code className="text-slate-400 font-mono">/api/busarrival?BusStopCode=&#123;code&#125;</code> (Health: <code className="text-slate-400 font-mono">/api/health</code>)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  LTA DataMall AccountKey (Optional header)
                </label>
                <input
                  type="password"
                  value={formData.ltaAccountKey || ''}
                  onChange={(e) => setFormData({ ...formData, ltaAccountKey: e.target.value })}
                  placeholder="Leave empty if your backend injects this key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Arrival Refresh Interval
                </label>
                <select
                  value={formData.refreshIntervalSeconds}
                  onChange={(e) =>
                    setFormData({ ...formData, refreshIntervalSeconds: parseInt(e.target.value, 10) })
                  }
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value={10}>Every 10 seconds (High frequency)</option>
                  <option value={15}>Every 15 seconds (Standard)</option>
                  <option value={30}>Every 30 seconds (Data saver)</option>
                </select>
              </div>

              {/* Test Button & Result */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Backend Connection</span>
                </button>

                {testStatus !== 'idle' && (
                  <div
                    className={`mt-2.5 p-3 rounded-lg text-xs flex items-start gap-2 ${
                      testStatus === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                        : testStatus === 'error'
                        ? 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {testStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span>{testMessage}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Backend Proxy Code Template */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 overflow-hidden">
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Backend Express Proxy Snippet (Ready to Plug In)</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sampleExpressSnippet);
                  setCopiedSnippet(true);
                  setTimeout(() => setCopiedSnippet(false), 2000);
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-40">
              {sampleExpressSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Compliant with LTA DataMall v2 API Specification
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-medium text-slate-950 font-semibold transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
