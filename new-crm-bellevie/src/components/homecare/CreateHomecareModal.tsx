'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, ChevronRight, User, Stethoscope, Clock, Calendar, MapPin, AlertCircle, Loader2, Info } from 'lucide-react';
import { ApiHomecareService, homecareServiceApi, homecareRequestsApi } from '@/lib/homecareApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';

interface CreateHomecareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateHomecareModal: React.FC<CreateHomecareModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [memberSearch, setMemberSearch] = useState('');
  const [membersList, setMembersList] = useState<ApiMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ApiMember | null>(null);
  const [selectedService, setSelectedService] = useState<ApiHomecareService | null>(null);
  const [viewingDetailService, setViewingDetailService] = useState<ApiHomecareService | null>(null);
  const [services, setServices] = useState<ApiHomecareService[]>([]);

  // Generate default datetime: 1 hour from now in datetime-local format (YYYY-MM-DDTHH:MM)
  const getDefaultDatetime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // datetime-local picker value (YYYY-MM-DDTHH:MM)
  const [datetimeLocal, setDatetimeLocal] = useState(getDefaultDatetime);
  const [serviceAddress, setServiceAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      homecareServiceApi.getAllServices({ is_active: true, is_published: true })
        .then(setServices)
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === 1) {
      const loadMembers = async () => {
        setLoadingMembers(true);
        try {
          const res = await fetchMembersList({ search: memberSearch || undefined });
          let list: ApiMember[] = [];
          if (res && 'results' in res && Array.isArray(res.results)) {
            list = res.results;
          } else if (Array.isArray(res)) {
            list = res;
          }
          setMembersList(list);
        } catch (err) {
          console.error('Failed to fetch members list:', err);
        } finally {
          setLoadingMembers(false);
        }
      };
      loadMembers();
    }
  }, [isOpen, step, memberSearch]);

  if (!isOpen) return null;

  const handleSelectMember = (mem: ApiMember) => {
    setSelectedMember(mem);
    setServiceAddress(mem.address || '');
    setStep(2);
  };

  const handleSelectService = (srv: ApiHomecareService) => {
    setSelectedService(srv);
    setStep(3);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedService) return;

    setLoading(true);
    setError(null);
    try {
      await homecareRequestsApi.createRequest({
        member: selectedMember.id,
        service: selectedService.id,
        service_address: serviceAddress || selectedMember.address || '',
        preferred_datetime: `${datetimeLocal}:00+06:00`,
        notes,
        member_name: selectedMember.full_name,
        centre: selectedMember.assigned_centre || undefined,
        centre_name: selectedMember.assigned_centre_name || undefined,
      });

      onCreated();
      onClose();
      // Reset state
      setStep(1);
      setSelectedMember(null);
      setSelectedService(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit homecare request');
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
            <h3 className="text-lg font-bold text-slate-900">New Homecare Request</h3>
            <p className="text-xs text-slate-500">Book homecare medical service for a registered member</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
            <span>Select Member</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />

          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
            <span>Select Service</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />

          <div className={`flex items-center gap-2 ${step === 3 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
            <span>Details & Address</span>
          </div>
        </div>

        {/* Step 1: Member Selection */}
        {step === 1 && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member by name, code or phone..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {loadingMembers ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Loading members list from API...</p>
              </div>
            ) : membersList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No members found matching your search.
              </div>
            ) : (
              <div className="space-y-2">
                {membersList.map((mem) => {
                  const initials = mem.full_name
                    ? mem.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'M';
                  const displayCode = mem.public_id || `BV-${10000 + mem.id}`;
                  const displayPhone = mem.phone || 'N/A';

                  return (
                    <div
                      key={mem.id}
                      className="p-3.5 border border-slate-200 hover:border-blue-400 rounded-xl flex items-center justify-between hover:bg-blue-50/30 transition-all cursor-pointer"
                      onClick={() => handleSelectMember(mem)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{mem.full_name}</h4>
                          <p className="text-xs text-slate-500">{displayCode} • {displayPhone}</p>
                        </div>
                      </div>

                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Service */}
        {step === 2 && (
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="text-xs text-slate-500 mb-2">
              Selected Member: <strong className="text-slate-900">{selectedMember?.full_name}</strong> ({selectedMember?.public_id || `BV-${selectedMember?.id}`})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => handleSelectService(srv)}
                  className="p-5 border border-slate-200 hover:border-blue-500 rounded-2xl bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-3 group relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {srv.duration_minutes ? `${srv.duration_minutes} min` : 'Flex min'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{srv.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{srv.category_name || srv.category}</p>
                    {srv.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {srv.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <span className="text-sm font-extrabold text-blue-700">à§³{srv.base_price}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingDetailService(srv);
                        }}
                        className="px-2.5 py-1.5 border border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectService(srv);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Schedule & Address */}
        {step === 3 && (
          <form onSubmit={handleSubmitRequest} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium">Member: </span>
                <strong className="text-slate-900">{selectedMember?.full_name}</strong>
                {selectedMember?.assigned_centre_name && (
                  <span className="ml-2 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                    Centre: {selectedMember.assigned_centre_name}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 font-medium">Service: </span>
                <strong className="text-blue-700">{selectedService?.name}</strong>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Preferred Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={datetimeLocal}
                min={(() => {
                  const now = new Date();
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                })()}
                onChange={(e) => setDatetimeLocal(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Select a future date and time for the homecare visit.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Service Address</label>
              <textarea
                rows={2}
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Patient Notes</label>
              <textarea
                rows={2}
                placeholder="Mention any post-operative or special requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Back to Services
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-colors"
              >
                Submit Homecare Request
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Service Details Modal Popup */}
      {viewingDetailService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingDetailService.name}</h3>
                  <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md mt-0.5">
                    Category: {viewingDetailService.category_name || viewingDetailService.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingDetailService(null)}
                className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {viewingDetailService.duration_minutes ? `${viewingDetailService.duration_minutes} min` : 'Flexible'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="text-[11px] font-semibold text-blue-600 uppercase">Base Price</div>
                  <div className="text-base font-black text-blue-700 mt-0.5">
                    à§³{viewingDetailService.base_price}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">Service Description</h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                  {viewingDetailService.description || 'No specific description provided for this service.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingDetailService(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const srv = viewingDetailService;
                  setViewingDetailService(null);
                  handleSelectService(srv);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                Select This Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

