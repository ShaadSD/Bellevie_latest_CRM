'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, ShieldCheck, User, Clock, MapPin, AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { ApiHomecareRequest, ApiHomecareStaff, homecareStaffApi, homecareRequestsApi } from '@/lib/homecareApi';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ApiHomecareRequest | null;
  onStaffAssigned: () => void;
}

export const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  isOpen,
  onClose,
  request,
  onStaffAssigned,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agreedPrice, setAgreedPrice] = useState<string>('');
  const [hqNotes, setHqNotes] = useState('Staff assigned for home visit');
  const [staffList, setStaffList] = useState<ApiHomecareStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && request) {
      setError(null);
      setLoadingStaff(true);
      const basePrice = request.base_price || request.service_base_price || '';
      setAgreedPrice(basePrice ? String(basePrice) : '');
      homecareStaffApi.getAllStaff()
        .then((res) => {
          const list = Array.isArray(res) ? res : [];
          setStaffList(list);
        })
        .catch((err) => {
          console.error('Failed to load staff list:', err);
          setStaffList([]);
        })
        .finally(() => {
          setLoadingStaff(false);
        });
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const filteredStaff = staffList.filter((staff) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = staff.name.toLowerCase().includes(searchLower);
    const districtMatch = staff.district ? staff.district.toLowerCase().includes(searchLower) : false;
    const phoneMatch = staff.phone ? staff.phone.includes(searchLower) : false;
    const qualMatch = staff.qualification ? staff.qualification.toLowerCase().includes(searchLower) : false;
    const catDisplay = (staff.category_name || staff.category_display || String(staff.category || '')).toLowerCase();
    const catMatch = catDisplay.includes(searchLower);

    return nameMatch || districtMatch || phoneMatch || qualMatch || catMatch;
  });

  const handleSelectStaff = async (staff: ApiHomecareStaff) => {
    setLoading(true);
    setError(null);
    try {
      await homecareRequestsApi.assignStaff(request.id, {
        assigned_staff: staff.id,
        agreed_price: agreedPrice || request.base_price || request.service_base_price || undefined,
        hq_notes: hqNotes,
      });
      onStaffAssigned();
      onClose();
    } catch (err: any) {
      const msg =
        typeof err === 'object' && err !== null
          ? err.assigned_staff || err.detail || err.message || JSON.stringify(err)
          : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Assign Homecare Staff (HQ)</h3>
            <p className="text-xs text-slate-500 font-mono">Request ID: {request.member_public_id || (request.member ? `BV-${request.member}` : (request.public_id && request.public_id.includes('-') && request.public_id.length > 12 ? `HC-${request.public_id.substring(0, 8).toUpperCase()}` : request.public_id))}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request Summary & Price Config */}
        <div className="px-6 py-4 bg-blue-50/60 border-b border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Service</span>
            <span className="font-bold text-blue-900">{request.service_name} ({request.service_category})</span>
            {(request.base_price || request.service_base_price) && (
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Base Price: <strong className="text-blue-700">৳{request.base_price || request.service_base_price}</strong>
              </span>
            )}
          </div>
          <div>
            <span className="text-slate-500 block font-medium">Price (৳)</span>
            <input
              type="text"
              placeholder={request.base_price || request.service_base_price || 'Optional'}
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              className="w-full px-2 py-1 border border-blue-300 rounded bg-white font-bold text-blue-900 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>
          <div>
            <span className="text-slate-500 block font-medium">HQ Dispatch Notes</span>
            <input
              type="text"
              value={hqNotes}
              onChange={(e) => setHqNotes(e.target.value)}
              className="w-full px-2 py-1 border border-blue-300 rounded bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name, phone, qualification or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100/70 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {loadingStaff ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Loading homecare staff members...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No homecare staff members found matching your search.
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const catLabel = staff.category_name || staff.category_display || String(staff.category || 'Staff');
              const initials = staff.name
                ? staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : 'ST';

              return (
                <div
                  key={staff.id}
                  className="p-4 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between gap-4 transition-all hover:shadow-md bg-white"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{staff.name}</h4>
                        {staff.is_verified && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                          {catLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{staff.qualification || 'Certified Professional'}</span>
                        <span>• {staff.district || 'Dhaka'}</span>
                        <span>• Phone: {staff.phone || 'N/A'}</span>
                        {staff.registration_number && <span>• Reg: {staff.registration_number}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={() => handleSelectStaff(staff)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0 disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Assign Staff'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
