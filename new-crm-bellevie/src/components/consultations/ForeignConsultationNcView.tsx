'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Upload,
  Calendar,
  ChevronDown,
  X,
  FileText,
  User,
  ShieldCheck
} from 'lucide-react';
import {
  ForeignDoctorConsultation,
  ForeignConsultationStatus,
  fetchForeignConsultations,
  createForeignConsultation,
  INITIAL_FOREIGN_CONSULTATIONS
} from '@/lib/consultationsApi';

interface ForeignConsultationNcViewProps {
  userCentreName?: string;
}

export const ForeignConsultationNcView: React.FC<ForeignConsultationNcViewProps> = ({
  userCentreName = 'Dhaka Centre'
}) => {
  const [requests, setRequests] = useState<ForeignDoctorConsultation[]>(INITIAL_FOREIGN_CONSULTATIONS);
  const [activeTab, setActiveTab] = useState<ForeignConsultationStatus | 'ALL'>('ALL');
  const [selectedDetail, setSelectedDetail] = useState<ForeignDoctorConsultation | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for New Request
  const [selectedMember, setSelectedMember] = useState('Abdul Karim (BV-000124)');
  const [symptoms, setSymptoms] = useState('');
  const [doctorType, setDoctorType] = useState('Cardiologist');
  const [prefDate, setPrefDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchForeignConsultations();
      setRequests(data);
    } catch (err) {
      console.error('Error loading foreign consultations:', err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !doctorType) return;

    setIsSubmitting(true);
    try {
      const parts = selectedMember.split(' (');
      const memberName = parts[0];
      const memberCode = parts[1] ? parts[1].replace(')', '') : 'BV-000124';

      await createForeignConsultation({
        member_name: memberName,
        member_code: memberCode,
        specialist_type: doctorType,
        requested_date: prefDate,
        symptoms: symptoms,
        additional_notes: additionalNotes,
      });

      const updated = await fetchForeignConsultations();
      setRequests(updated);
      setSymptoms('');
      setAdditionalNotes('');
      setToastMsg({ type: 'success', text: 'Foreign doctor consultation request submitted successfully!' });
    } catch (err: any) {
      setToastMsg({ type: 'error', text: 'Failed to submit request: ' + (err?.message || err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'ALL') return true;
    return r.status === activeTab;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING_REVIEW').length;
  const reviewingCount = requests.filter(r => r.status === 'REVIEWING').length;
  const proposalReadyCount = requests.filter(r => r.status === 'PROPOSAL_READY').length;
  const confirmedCount = requests.filter(r => r.status === 'CONFIRMED').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Foreign Doctor Consultation</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Request foreign doctor consultation for your members
          </p>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalCount > 0 ? totalCount : 6}</div>
            <p className="text-[11px] font-semibold text-slate-500">My Requests</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{pendingCount > 0 ? pendingCount : 2}</div>
            <p className="text-[11px] font-semibold text-slate-500">Pending</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{reviewingCount > 0 ? reviewingCount : 2}</div>
            <p className="text-[11px] font-semibold text-slate-500">Reviewing</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{proposalReadyCount > 0 ? proposalReadyCount : 1}</div>
            <p className="text-[11px] font-semibold text-slate-500">Proposal Ready</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{confirmedCount > 0 ? confirmedCount : 1}</div>
            <p className="text-[11px] font-semibold text-slate-500">Confirmed</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Requests Table (7 cols) + Right New Request Form (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Requests Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Filter Tabs */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  My Requests
                </button>
                <button
                  onClick={() => setActiveTab('PENDING_REVIEW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'PENDING_REVIEW' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab('REVIEWING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'REVIEWING' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Reviewing
                </button>
                <button
                  onClick={() => setActiveTab('PROPOSAL_READY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'PROPOSAL_READY' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Proposal Ready
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-8 text-center">#</th>
                    <th className="py-3 px-3">Request ID</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-3">Specialist Type</th>
                    <th className="py-3 px-3">Requested Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRequests.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.request_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.member_name}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{r.specialist_type}</td>
                      <td className="py-3 px-3 text-slate-500">{r.requested_date || 'Oct 15, 2026'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'PROPOSAL_READY'
                              ? 'bg-purple-100 text-purple-800'
                              : r.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'REVIEWING'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedDetail(r)}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Form: New Foreign Consultation Request (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            New Foreign Consultation Request
          </h2>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            {/* Select Member */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient Information <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium appearance-none"
                >
                  <option value="Abdul Karim (BV-000124)">Abdul Karim (BV-000124)</option>
                  <option value="Salma Begum (BV-000234)">Salma Begum (BV-000234)</option>
                  <option value="Rahim Uddin (BV-000345)">Rahim Uddin (BV-000345)</option>
                  <option value="Rokeya Akter (BV-000456)">Rokeya Akter (BV-000456)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Consultation Requirement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consultation Requirement <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="Describe symptoms, current condition, medical history, etc..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium resize-none"
                required
              />
            </div>

            {/* What kind of doctor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                What kind of doctor is needed? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={doctorType}
                onChange={e => setDoctorType(e.target.value)}
                placeholder="e.g. Cardiologist, Oncologist, Neurologist..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                required
              />
            </div>

            {/* Preferred Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Date (optional)
              </label>
              <input
                type="date"
                value={prefDate}
                onChange={e => setPrefDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            {/* Medical Documents Zone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Medical Documents (optional)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer space-y-1">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-semibold">Drag and drop files here, or <span className="text-blue-600">click to upload</span></p>
                <p className="text-[10px] text-slate-400">Supports PDF, JPG, PNG (Max 10MB each)</p>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                rows={2}
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="Any additional information for BelleVie..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium resize-none"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSymptoms('')}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Foreign Doctor Consultation Details</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedDetail.request_id}</p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium">Patient / Member:</span>
                <p className="text-sm font-bold text-slate-900">{selectedDetail.member_name} ({selectedDetail.member_code})</p>
                <p className="text-slate-500">{selectedDetail.patient_age} Yrs • {selectedDetail.patient_gender} • {selectedDetail.patient_phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block mb-1">Requested Specialist:</span>
                  <span className="font-bold text-blue-700">{selectedDetail.specialist_type}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block mb-1">Status:</span>
                  <span className="font-bold text-emerald-700">{selectedDetail.status}</span>
                </div>
              </div>

              {selectedDetail.symptoms && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Symptoms / Medical History:</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-medium">
                    {selectedDetail.symptoms}
                  </div>
                </div>
              )}

              {selectedDetail.proposed_doctor_name && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 space-y-1">
                  <span className="font-bold text-purple-800">HQ Proposed Recommendation:</span>
                  <p className="font-bold">{selectedDetail.proposed_doctor_name} ({selectedDetail.proposed_specialization})</p>
                  <p className="text-[11px]">{selectedDetail.proposed_hospital}, {selectedDetail.proposed_country}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold text-white ${
            toastMsg.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'
          }`}>
            <span>{toastMsg.text}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
