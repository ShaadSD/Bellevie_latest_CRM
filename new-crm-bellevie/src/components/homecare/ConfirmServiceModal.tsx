'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiHomecareRequest, homecareRequestsApi } from '@/lib/homecareApi';

interface ConfirmServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ApiHomecareRequest | null;
  onServiceConfirmed: () => void;
}

export const ConfirmServiceModal: React.FC<ConfirmServiceModalProps> = ({
  isOpen,
  onClose,
  request,
  onServiceConfirmed,
}) => {
  const [confirmedDatetime, setConfirmedDatetime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && request) {
      setConfirmedDatetime(request.preferred_datetime || new Date().toISOString());
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await homecareRequestsApi.confirmService(request.id, {
        confirmed_datetime: confirmedDatetime,
      });
      onServiceConfirmed();
      onClose();
    } catch (err: any) {
      const msg =
        typeof err === 'object' && err !== null
          ? err.confirmed_datetime || err.detail || err.message || JSON.stringify(err)
          : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Homecare Service Schedule (HQ)</h3>
            <p className="text-xs text-slate-500 font-mono">Request ID: {request.member_public_id || (request.member ? `BV-${request.member}` : (request.public_id && request.public_id.includes('-') && request.public_id.length > 12 ? `HC-${request.public_id.substring(0, 8).toUpperCase()}` : request.public_id))}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Staff</label>
              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>{request.staff_name || 'Rakib Hasan'}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Service Type</label>
              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-800">
                {request.service_name}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmed Datetime (ISO Format)</label>
            <input
              type="text"
              value={confirmedDatetime}
              onChange={(e) => setConfirmedDatetime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">Example: 2026-10-10T10:00:00+06:00</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Schedule
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
