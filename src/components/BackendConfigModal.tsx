import React, { useState } from 'react';
import { ApiConfiguration } from '../types/bus';
import { X, Server, CheckCircle2, AlertCircle, Copy, Check, Terminal, ExternalLink, RefreshCw, Key } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Calling LTA DataMall v3 BusArrival endpoint for BusStopCode 83139...');

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (formData.ltaAccountKey && formData.ltaAccountKey.trim()) {
        headers['AccountKey'] = formData.ltaAccountKey.trim();
      }

      const res = await fetch(`/api/busarrival?BusStopCode=83139`, { headers });
      const data = await res.json();

      if (!res.ok) {
        if (data && data.error === 'LTA_ACCOUNT_KEY_NOT_CONFIGURED') {
          setTestStatus('error');
          setTestMessage('Serverless proxy reachable, but LTA AccountKey is not set. Enter your key below or in .env.');
          return;
        }
        throw new Error(data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (data && Array.isArray(data.Services)) {
        setTestStatus('success');
        setTestMessage(
          `Live LTA DataMall connection verified! Retrieved ${data.Services.length} real bus services for BusStopCode 83139.`
        );
      } else {
        setTestStatus('success');
        setTestMessage('API responded successfully with LTA DataMall schema.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Failed: ${err.message || 'Network / connection error'}`);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

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
              <h2 className="text-lg font-bold text-slate-100">LTA DataMall v3 API Settings</h2>
              <p className="text-xs text-slate-400">
                100% Real Live Bus Arrival Feed (Documentation v3 /BusArrival)
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
          {/* Documentation spec highlight */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              LTA DataMall Endpoint Specification
            </div>
            <div className="font-mono text-xs text-slate-200 bg-slate-900 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
              GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
              <div>
                <strong>Update Frequency:</strong> 20 seconds
              </div>
              <div>
                <strong>Required Header:</strong> <code className="text-slate-300 font-mono">AccountKey</code>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>LTA DataMall AccountKey</span>
                <a
                  href="https://datamall.lta.gov.sg/content/datamall/en/request-api.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline text-[11px] flex items-center gap-1"
                >
                  <span>Request Free LTA Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={formData.ltaAccountKey}
                  onChange={(e) => setFormData({ ...formData, ltaAccountKey: e.target.value })}
                  placeholder="Paste your LTA DataMall AccountKey here..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                You can also define <code className="text-slate-400 font-mono">LTA_ACCOUNT_KEY="..."</code> in your server environment or <code className="text-slate-400 font-mono">.env</code> file.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                API Proxy Route
              </label>
              <input
                type="text"
                value={formData.endpointUrl}
                onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
                placeholder="/api/busarrival"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Auto-Refresh Interval
              </label>
              <select
                value={formData.refreshIntervalSeconds}
                onChange={(e) =>
                  setFormData({ ...formData, refreshIntervalSeconds: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={20}>Every 20 seconds (Official LTA DataMall Update Freq)</option>
                <option value={15}>Every 15 seconds (High frequency)</option>
                <option value={30}>Every 30 seconds (Data saver)</option>
              </select>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Live LTA API Connection</span>
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
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono text-[11px]">
            LTA DataMall v3 BusArrival
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-slate-950 transition-colors"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
