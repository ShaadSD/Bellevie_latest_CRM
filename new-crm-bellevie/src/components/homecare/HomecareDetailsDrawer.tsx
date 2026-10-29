'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Building2, 
  Calendar, 
  FileText, 
  XCircle,
  ShieldCheck,
  AlertCircle,
  History
} from 'lucide-react';
import { 
  ApiHomecareRequest, 
  ApiHomecareStatus, 
  ApiHomecareHistoryItem, 
  homecareRequestsApi 
} from '@/lib/homecareApi';
import { fetchCentresList } from '@/lib/membersApi';

interface HomecareDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: ApiHomecareRequest | null;
  isHqView: boolean;
  onOpenAssignStaff: () => void;
  onOpenConfirmService: () => void;
  onRefreshData: () => void;
}

const statusBadgeStyles: Record<ApiHomecareStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  VERIFYING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ASSIGNED: 'bg-blue-100 text-blue-800 border-blue-300',
  CONFIRMED: 'bg-teal-100 text-teal-800 border-teal-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const HomecareDetailsDrawer: React.FC<HomecareDetailsDrawerProps> = ({
  isOpen,
  onClose,
  request,
  isHqView,
  onOpenAssignStaff,
  onOpenConfirmService,
  onRefreshData,
}) => {
  const [history, setHistory] = useState<ApiHomecareHistoryItem[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [centreMap, setCentreMap] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchCentresList().then(res => {
      const list = Array.isArray(res) ? res : (res && 'results' in res && Array.isArray(res.results)) ? res.results : [];
      const map: Record<number, string> = {};
      list.forEach((c: any) => { map[c.id] = c.name; });
      setCentreMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (request && isOpen) {
      setErrorMessage(null);
      homecareRequestsApi.getRequestHistory(request.id).then(setHistory).catch(console.error);
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  // Endpoint API Trigger Handlers
  const handleVerify = async () => {
    setLoadingAction(true);
    setErrorMessage(null);
    try {
      await homecareRequestsApi.verifyRequest(request.id);
      onRefreshData();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify request');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompleteService = async () => {
    setLoadingAction(true);
    setErrorMessage(null);
    try {
      await homecareRequestsApi.updateStatus(request.id, { status: 'COMPLETED', notes: 'Homecare service completed successfully' });
      onRefreshData();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Service cannot be completed before the expected service end time.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async () => {
    setLoadingAction(true);
    setErrorMessage(null);
    try {
      await homecareRequestsApi.rejectRequest(request.id, { notes: 'No suitable staff available for this service' });
      onRefreshData();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject request');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancel = async () => {
    setLoadingAction(true);
    setErrorMessage(null);
    try {
      await homecareRequestsApi.cancelRequest(request.id, { notes: 'Request cancelled by user' });
      onRefreshData();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel request');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Homecare Request</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeStyles[request.status]}`}>
                  {request.status_display || request.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {request.member_public_id || (request.member ? `BV-${request.member}` : (request.public_id && request.public_id.includes('-') && request.public_id.length > 12 ? `HC-${request.public_id.substring(0, 8).toUpperCase()}` : request.public_id))}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* API Error Notification */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Bar Based on Role & Status Specification */}
          <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap gap-2">
            
            {/* PENDING Status Logic */}
            {request.status === 'PENDING' && (
              <>
                {isHqView ? (
                  <>
                    <button
                      disabled={loadingAction}
                      onClick={handleVerify}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Verify Request
                    </button>
                    <button
                      disabled={loadingAction}
                      onClick={handleReject}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      disabled={loadingAction}
                      onClick={handleCancel}
                      className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    disabled={loadingAction}
                    onClick={handleCancel}
                    className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    Cancel Request
                  </button>
                )}
              </>
            )}

            {/* VERIFYING Status Logic */}
            {request.status === 'VERIFYING' && isHqView && (
              <>
                <button
                  disabled={loadingAction}
                  onClick={onOpenAssignStaff}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Assign Staff
                </button>
                <button
                  disabled={loadingAction}
                  onClick={handleReject}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Reject
                </button>
                <button
                  disabled={loadingAction}
                  onClick={handleCancel}
                  className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {/* ASSIGNED Status Logic */}
            {request.status === 'ASSIGNED' && isHqView && (
              <>
                <button
                  disabled={loadingAction}
                  onClick={onOpenConfirmService}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Confirm Schedule
                </button>
                <button
                  disabled={loadingAction}
                  onClick={onOpenAssignStaff}
                  className="px-3 py-2 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                  title="Reassign staff or update agreed price"
                >
                  Edit Price / Staff
                </button>
                <button
                  disabled={loadingAction}
                  onClick={handleCancel}
                  className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {/* CONFIRMED Status Logic */}
            {request.status === 'CONFIRMED' && isHqView && (
              <>
                <button
                  disabled={loadingAction}
                  onClick={handleCompleteService}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Completed
                </button>
                <button
                  disabled={loadingAction}
                  onClick={handleCancel}
                  className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Patient & Service Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{request.member_name || `Member #${request.member}`}</h4>
                  <p className="text-xs text-slate-500">Service: <strong className="text-blue-900">{request.service_name}</strong></p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Category</span>
                  <span className="font-bold text-slate-800">{request.service_category || 'NURSING'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Centre</span>
                  <span className="font-bold text-slate-800">
                    {request.centre_name || (request.centre ? centreMap[Number(request.centre)] : '') || 'Not Assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Preferred Time</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(request.preferred_datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Assigned Staff</span>
                  <span className="font-semibold text-blue-700">{request.staff_name || 'Not assigned yet'}</span>
                </div>
                {(request.base_price || request.service_base_price) && (
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Base Price</span>
                    <span className="font-extrabold text-emerald-700">৳{request.base_price || request.service_base_price}</span>
                  </div>
                )}
                {request.confirmed_datetime && (
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Confirmed Time</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(request.confirmed_datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-xs">
                <span className="text-slate-500 block text-[11px] font-medium">Service Address</span>
                <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {request.service_address}
                </span>
              </div>

              {request.notes && (
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-500 block text-[11px] font-medium">Patient Notes</span>
                  <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-1 italic">
                    "{request.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Service Status History Stepper */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" /> Audit Log & History Stepper
              </h3>
              
              {(!Array.isArray(history) || history.length === 0) ? (
                <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                  No history records found for this request.
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {history.map((item, idx) => (
                    <div key={item.id || idx} className="relative flex items-start gap-3">
                      <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {item.new_status}
                          {item.previous_status && (
                            <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                              (from {item.previous_status})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          By {item.changed_by_name || 'System'} • {item.created_at ? new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded mt-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
