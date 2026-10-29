'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  ChevronRight,
  Eye,
  FileText,
  User,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import {
  ForeignDoctorConsultation,
  ForeignConsultationStatus,
  fetchForeignConsultations,
  updateForeignConsultationStatus,
  INITIAL_FOREIGN_CONSULTATIONS
} from '@/lib/consultationsApi';

export const ForeignConsultationHqView: React.FC = () => {
  const [requests, setRequests] = useState<ForeignDoctorConsultation[]>(INITIAL_FOREIGN_CONSULTATIONS);
  const [activeTab, setActiveTab] = useState<ForeignConsultationStatus | 'ALL'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<ForeignDoctorConsultation | null>(INITIAL_FOREIGN_CONSULTATIONS[1]);

  // Modal / Form state for HQ Proposal Info
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    doctor_name: 'Dr. S. K. Gupta',
    specialization: 'Senior Oncologist',
    hospital: 'Apollo Hospital, Chennai',
    country: 'India',
    consultation_fee: '150',
    consultation_method: 'Video Call Consultation',
    hq_notes: 'Proposed India Oncology specialist.',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchForeignConsultations();
      setRequests(data);
      if (data.length > 0) {
        setSelectedRequest(data.find(d => d.request_id === 'FDC-002') || data[0]);
      }
    } catch (err) {
      console.error('Error loading foreign consultations:', err);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await updateForeignConsultationStatus(id, 'CONFIRMED', 'Confirmed by HQ Admin');
      const updated = await fetchForeignConsultations();
      setRequests(updated);
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: 'CONFIRMED' } : null);
      }
      alert('Consultation request confirmed!');
    } catch (err) {
      alert('Failed to confirm: ' + err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await updateForeignConsultationStatus(id, 'REJECTED', 'Rejected by HQ Admin');
      const updated = await fetchForeignConsultations();
      setRequests(updated);
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: 'REJECTED' } : null);
      }
      alert('Consultation request rejected.');
    } catch (err) {
      alert('Failed to reject: ' + err);
    }
  };

  const handleRequestInfo = async (id: number) => {
    try {
      await updateForeignConsultationStatus(id, 'REVIEWING', 'Requested more info from centre');
      const updated = await fetchForeignConsultations();
      setRequests(updated);
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: 'REVIEWING' } : null);
      }
      alert('Requested more info from centre.');
    } catch (err) {
      alert('Failed: ' + err);
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Foreign Doctor Consultation (HQ)</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Review requests, find suitable doctors, prepare proposals and manage consultation process
          </p>
        </div>
      </div>

      {/* 6 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{totalCount > 0 ? totalCount : 28}</div>
            <p className="text-[10px] font-semibold text-slate-500">Total Requests</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{pendingCount > 0 ? pendingCount : 8}</div>
            <p className="text-[10px] font-semibold text-slate-500">Pending Review</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{reviewingCount > 0 ? reviewingCount : 6}</div>
            <p className="text-[10px] font-semibold text-slate-500">Reviewing</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{proposalReadyCount > 0 ? proposalReadyCount : 5}</div>
            <p className="text-[10px] font-semibold text-slate-500">Proposal Ready</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{confirmedCount > 0 ? confirmedCount : 6}</div>
            <p className="text-[10px] font-semibold text-slate-500">Confirmed</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{completedCount > 0 ? completedCount : 3}</div>
            <p className="text-[10px] font-semibold text-slate-500">Completed</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Requests Table (7 cols) + Right Selected Request Drawer (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Filter Tabs */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  All Requests
                </button>
                <button
                  onClick={() => setActiveTab('PENDING_REVIEW')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'PENDING_REVIEW' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Pending Review
                </button>
                <button
                  onClick={() => setActiveTab('PROPOSAL_READY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'PROPOSAL_READY' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Proposal Ready
                </button>
                <button
                  onClick={() => setActiveTab('CONFIRMED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'CONFIRMED' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  Confirmed
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
                    <th className="py-3 px-3">Created By</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRequests.map((r, idx) => {
                    const isSelected = selectedRequest?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedRequest(r)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                          }`}
                      >
                        <td className="py-3 px-3 font-medium text-slate-400 text-center">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.request_id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.member_name}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{r.specialist_type}</td>
                        <td className="py-3 px-3 text-slate-500">{r.requested_date || 'Oct 15, 2026'}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${r.status === 'PROPOSAL_READY'
                                ? 'bg-purple-100 text-purple-800'
                                : r.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'PRICING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : r.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{r.created_by_centre_name}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedRequest(r);
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg text-xs transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Details Drawer (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between space-y-4">
          {selectedRequest ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">{selectedRequest.request_id} - Foreign Consultation</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800">
                  {selectedRequest.status}
                </span>
              </div>

              {/* Drawer Navigation Tabs */}
              <div className="flex border-b border-slate-100 gap-4 text-xs font-bold text-slate-500">
                <button className="pb-2 border-b-2 border-blue-600 text-blue-600">Overview</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-slate-800">Documents (4)</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-slate-800">Timeline</button>
                <button className="pb-2 border-b-2 border-transparent hover:text-slate-800">Updates</button>
              </div>

              {/* Patient Information Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Patient Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium pt-1">
                  <div>
                    <span className="block text-[11px] text-slate-400">Name</span>
                    <span className="font-bold text-slate-900">{selectedRequest.member_name}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Member ID</span>
                    <span className="font-mono text-slate-800">{selectedRequest.member_code}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Age / Gender</span>
                    <span className="text-slate-800">{selectedRequest.patient_age} yrs, {selectedRequest.patient_gender}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Phone</span>
                    <span className="text-slate-800">{selectedRequest.patient_phone}</span>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div className="space-y-1.5 text-xs text-slate-700">
                <h3 className="font-bold text-slate-900">Request Information</h3>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="block text-[11px] text-slate-400">Requested Specialist</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.specialist_type}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Preferred Country</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.preferred_country}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Preferred Date</span>
                    <span className="text-slate-800">{selectedRequest.requested_date || 'Oct 15, 2026'}</span>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="block text-[11px] font-semibold text-slate-500">Symptoms / Problems</span>
                  <p className="text-slate-700 font-medium mt-0.5">{selectedRequest.symptoms || 'Patient has been experiencing persistent pain and fatigue.'}</p>
                </div>
              </div>

              {/* Proposed Information (By HQ) */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2 text-xs">
                <h3 className="font-bold text-blue-900">Proposed Information (by HQ)</h3>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="block text-[11px] text-slate-400">Doctor Name</span>
                    <span className="font-bold text-slate-900">{selectedRequest.proposed_doctor_name || 'Dr. (To be added)'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Specialization</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.proposed_specialization || 'Senior Specialist'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Hospital / Institution</span>
                    <span className="text-slate-800">{selectedRequest.proposed_hospital || 'Apollo Hospital'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Country</span>
                    <span className="text-slate-800">{selectedRequest.proposed_country || 'India'}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Consultation Fee</span>
                    <span className="font-bold text-emerald-700">${selectedRequest.consultation_fee || 150}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Consultation Method</span>
                    <span className="text-slate-800">{selectedRequest.consultation_method || 'Video Call'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleConfirm(selectedRequest.id)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleRequestInfo(selectedRequest.id)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  Request More Info
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">
              Select a request from the table to view details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
