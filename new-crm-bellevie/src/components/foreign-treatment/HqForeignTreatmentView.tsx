'use client';

import React, { useState, useEffect } from 'react';
import {
  Plane,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Plus,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  AlertCircle,
  Check,
  Eye,
  Download,
  Upload,
  ShieldCheck,
  DollarSign,
  Calendar,
  ArrowLeft,
  Filter,
  FileCheck,
  Layers,
  Paperclip,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import {
  ForeignTreatmentCase,
  ForeignHospital,
  ForeignCountry,
  ForeignTreatmentMetrics,
  ForeignCaseStatus,
  DocumentType,
  DocumentStatus,
  QuotationStatus,
  TreatmentDocument,
  TreatmentQuotation,
  CaseActivity,
  fetchForeignCasesApi,
  fetchForeignCaseByIdApi,
  fetchForeignCountriesApi,
  fetchForeignHospitalsApi,
  fetchForeignMetricsApi,
  createForeignCaseApi,
  updateForeignCaseStatusApi,
  assignForeignHospitalApi,
  uploadForeignDocumentApi,
  updateForeignDocumentStatusApi,
  createForeignQuotationApi,
  updateQuotationStatusApi,
  createForeignHospitalApi,
  ALLOWED_FOREIGN_STATUS_TRANSITIONS
} from '@/lib/foreignTreatmentApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';

export const HqForeignTreatmentView: React.FC = () => {
  // Navigation & Subviews: 'dashboard' | 'cases-list' | 'case-details'
  const [currentView, setCurrentView] = useState<'dashboard' | 'cases-list' | 'case-details'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'quotations' | 'activity'>('overview');

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data States
  const [metrics, setMetrics] = useState<ForeignTreatmentMetrics | null>(null);
  const [cases, setCases] = useState<ForeignTreatmentCase[]>([]);
  const [hospitals, setHospitals] = useState<ForeignHospital[]>([]);
  const [countries, setCountries] = useState<ForeignCountry[]>([]);
  const [selectedCase, setSelectedCase] = useState<ForeignTreatmentCase | null>(null);
  const [members, setMembers] = useState<ApiMember[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [centreFilter, setCentreFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [hospitalFilter, setHospitalFilter] = useState<string>('ALL');

  // Modals visibility
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isAddHospitalModalOpen, setIsAddHospitalModalOpen] = useState(false);
  const [isAssignHospitalModalOpen, setIsAssignHospitalModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isAddQuotationModalOpen, setIsAddQuotationModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [docPreviewModal, setDocPreviewModal] = useState<TreatmentDocument | null>(null);

  // Form states
  const [statusForm, setStatusForm] = useState<{ newStatus: ForeignCaseStatus; notes: string }>({
    newStatus: 'DOCUMENTS_PENDING',
    notes: ''
  });
  const [assignForm, setAssignForm] = useState<{ hospitalId: number; hospitalName: string }>({
    hospitalId: 0,
    hospitalName: ''
  });
  const [docForm, setDocForm] = useState<{ type: DocumentType; description: string; file: File | null }>({
    type: 'MEDICAL_REPORT',
    description: '',
    file: null
  });
  const [quotationForm, setQuotationForm] = useState<{
    hospitalId: number;
    hospitalName: string;
    currency: string;
    estimatedCost: number;
    estimatedStayDays: number;
    validUntil: string;
    details: string;
    attachment: File | null;
  }>({
    hospitalId: 0,
    hospitalName: '',
    currency: 'INR',
    estimatedCost: 850000,
    estimatedStayDays: 20,
    validUntil: '2026-10-30',
    details: 'Treatment package includes surgery, hospital stay, medications and post-op follow-up.',
    attachment: null
  });
  const [newCaseForm, setNewCaseForm] = useState({
    memberId: 1,
    memberName: '',
    countryId: null as number | null,
    treatmentRequired: '',
    preferredCountry: 'India',
    description: ''
  });
  const [newHospitalForm, setNewHospitalForm] = useState({
    name: '',
    city: '',
    country: 'India',
    address: 'Central Healthcare Road',
    contactEmail: '',
    phone: ''
  });

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [m, cList, hList, memList, countryList] = await Promise.all([
        fetchForeignMetricsApi(),
        fetchForeignCasesApi(),
        fetchForeignHospitalsApi(),
        fetchMembersList(),
        fetchForeignCountriesApi(),
      ]);
      setMetrics(m);
      setCases(cList);
      setHospitals(hList);
      setCountries(countryList);
      const membersArray = Array.isArray(memList) ? memList : (memList?.results || []);
      setMembers(membersArray);

      if (membersArray.length > 0) {
        setNewCaseForm(prev => {
          if (prev.memberId === 12 || !membersArray.some(mem => mem.id === prev.memberId)) {
            return { ...prev, memberId: membersArray[0].id, memberName: membersArray[0].full_name };
          }
          return prev;
        });
      }

      if (countryList.length > 0) {
        setNewCaseForm(prev => {
          if (!prev.countryId) {
            const defaultC = countryList.find(c => c.name.toLowerCase() === prev.preferredCountry.toLowerCase()) || countryList[0];
            return { ...prev, countryId: defaultC.id, preferredCountry: defaultC.name };
          }
          return prev;
        });
      }

      if (selectedCaseId) {
        const fullCase = await fetchForeignCaseByIdApi(selectedCaseId);
        if (fullCase) setSelectedCase(fullCase);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch foreign treatment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCaseId]);

  // Open single case details
  const handleOpenCaseDetails = async (id: number, initialTab: 'overview' | 'documents' | 'quotations' | 'activity' = 'overview') => {
    setSelectedCaseId(id);
    setActiveTab(initialTab);
    setCurrentView('case-details');
    const c = await fetchForeignCaseByIdApi(id);
    if (c) setSelectedCase(c);
  };

  // Status badge styling helper
  const getStatusBadge = (status: ForeignCaseStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">NEW</span>;
      case 'REVIEWING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">REVIEWING</span>;
      case 'DOCUMENTS_PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-200">DOCUMENTS_PENDING</span>;
      case 'HOSPITAL_CONTACTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">HOSPITAL_CONTACTED</span>;
      case 'QUOTATION_RECEIVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">QUOTATION_RECEIVED</span>;
      case 'PATIENT_DECISION':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">PATIENT_DECISION</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">PROCESSING</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getDocStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">Status: VERIFIED</span>;
      case 'RECEIVED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-800">Status: RECEIVED</span>;
      case 'REQUIRED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-red-100 text-red-800">Status: REQUIRED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-rose-100 text-rose-800">Status: REJECTED</span>;
    }
  };

  // Filtered cases
  const filteredCases = cases.filter(c => {
    const caseIdStr = `FT-${String(c.id).padStart(3, '0')}`;
    const matchesSearch =
      caseIdStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.member_name && c.member_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.treatment_required && c.treatment_required.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.preferred_country && c.preferred_country.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCentre = centreFilter === 'ALL' || (c.centre_name && c.centre_name.includes(centreFilter));
    const matchesCountry = countryFilter === 'ALL' || c.preferred_country === countryFilter;
    const matchesHospital = hospitalFilter === 'ALL' || (c.hospital_name && c.hospital_name.includes(hospitalFilter));
    return matchesSearch && matchesStatus && matchesCentre && matchesCountry && matchesHospital;
  });

  // Action Handlers
  const handleUpdateStatus = async () => {
    if (!selectedCase) return;
    try {
      await updateForeignCaseStatusApi(selectedCase.id, statusForm.newStatus, statusForm.notes);
      setIsStatusUpdateModalOpen(false);
      setStatusForm({ newStatus: 'DOCUMENTS_PENDING', notes: '' });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAssignHospital = async () => {
    if (!selectedCase || !assignForm.hospitalId) return;
    try {
      await assignForeignHospitalApi(selectedCase.id, assignForm.hospitalId, assignForm.hospitalName);
      setIsAssignHospitalModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUploadDoc = async () => {
    if (!selectedCase) return;
    try {
      const formData = new FormData();
      formData.append('case', String(selectedCase.id));
      formData.append('document_type', docForm.type);
      formData.append('description', docForm.description);
      if (docForm.file) {
        formData.append('file', docForm.file);
      }
      await uploadForeignDocumentApi(formData);
      setIsUploadDocModalOpen(false);
      setDocForm({ type: 'MEDICAL_REPORT', description: '', file: null });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleVerifyDoc = async (docId: number, status: DocumentStatus, notes?: string) => {
    if (!selectedCase) return;
    try {
      await updateForeignDocumentStatusApi(docId, status, notes || `Document marked as ${status} by HQ Admin`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleOpenAddQuotationModal = () => {
    if (!selectedCase) return;
    const initialHospId = selectedCase.hospital || (hospitals.length > 0 ? hospitals[0].id : 0);
    const selHosp = hospitals.find(h => h.id === initialHospId);
    setQuotationForm({
      hospitalId: initialHospId,
      hospitalName: selHosp ? selHosp.name : (selectedCase.hospital_name || ''),
      currency: 'INR',
      estimatedCost: 850000,
      estimatedStayDays: 20,
      validUntil: '2026-10-30',
      details: 'Treatment package includes surgery, hospital stay, medications and post-op follow-up.',
      attachment: null
    });
    setIsAddQuotationModalOpen(true);
  };

  const handleAddQuotation = async () => {
    if (!selectedCase) return;
    const targetHospId = quotationForm.hospitalId || selectedCase.hospital || (hospitals.length > 0 ? hospitals[0].id : 0);
    if (!targetHospId) {
      setErrorMsg('Please select a hospital.');
      return;
    }
    const selHosp = hospitals.find(h => h.id === targetHospId);
    try {
      await createForeignQuotationApi({
        case: selectedCase.id,
        hospital: targetHospId,
        hospital_name: selHosp ? selHosp.name : (quotationForm.hospitalName || selectedCase.hospital_name || ''),
        currency: quotationForm.currency,
        estimated_cost: quotationForm.estimatedCost,
        estimated_stay_days: quotationForm.estimatedStayDays,
        valid_until: quotationForm.validUntil,
        details: quotationForm.details,
        attachment: quotationForm.attachment,
        status: 'SHARED'
      });
      setIsAddQuotationModalOpen(false);
      const updatedCase = await fetchForeignCaseByIdApi(selectedCase.id);
      if (updatedCase) {
        setSelectedCase(updatedCase);
      }
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateQuotationStatus = async (quoId: number, status: QuotationStatus) => {
    if (!selectedCase) return;
    try {
      await updateQuotationStatusApi(quoId, status);

      // Auto transition case to PATIENT_DECISION when quotation is accepted
      if (status === 'ACCEPTED' && ['NEW', 'REVIEWING', 'DOCUMENTS_PENDING', 'HOSPITAL_CONTACTED', 'QUOTATION_RECEIVED'].includes(selectedCase.status)) {
        await updateForeignCaseStatusApi(selectedCase.id, 'PATIENT_DECISION', 'Patient accepted hospital quotation.');
      }

      // Re-fetch case to immediately update UI state
      const updatedCase = await fetchForeignCaseByIdApi(selectedCase.id);
      if (updatedCase) {
        setSelectedCase(updatedCase);
      }
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateCase = async () => {
    if (!newCaseForm.treatmentRequired) return;
    try {
      const selectedMember = members.find(m => m.id === newCaseForm.memberId) || members[0];
      const targetMemberId = selectedMember ? selectedMember.id : (members[0]?.id || 1);
      const mName = selectedMember ? selectedMember.full_name : newCaseForm.memberName || `Member #${targetMemberId}`;
      const caseDesc = newCaseForm.description.trim() || `Patient requires ${newCaseForm.treatmentRequired} evaluation and treatment.`;
      const created = await createForeignCaseApi({
        member: targetMemberId,
        member_name: mName,
        country: newCaseForm.countryId,
        treatment_required: newCaseForm.treatmentRequired,
        preferred_country: newCaseForm.preferredCountry,
        description: caseDesc,
        requested_by_name: 'HQ Admin'
      });
      setIsNewCaseModalOpen(false);
      setNewCaseForm({
        memberId: members[0]?.id || 1,
        memberName: members[0]?.full_name || '',
        countryId: countries[0]?.id || null,
        treatmentRequired: '',
        preferredCountry: countries[0]?.name || 'India',
        description: ''
      });
      if (created && created.id) {
        setSelectedCase(created);
        setSelectedCaseId(created.id);
        await loadData();
        handleOpenCaseDetails(created.id);
      } else {
        await loadData();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateHospital = async () => {
    if (!newHospitalForm.name) return;
    try {
      await createForeignHospitalApi({
        name: newHospitalForm.name,
        city: newHospitalForm.city || 'Primary City',
        country: newHospitalForm.country,
        address: newHospitalForm.address,
        contact_email: newHospitalForm.contactEmail || 'contact@hospital.com',
        phone: newHospitalForm.phone || '+1 800 0000',
        is_verified: true,
        is_active: true
      });
      setIsAddHospitalModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Processing checklist validation helper
  const isHospitalAssigned = !!selectedCase?.hospital;
  const acceptedQuotation = selectedCase?.quotations?.find(q => q.status === 'ACCEPTED');
  const isQuotationAccepted = !!acceptedQuotation;
  const isQuotationValid = acceptedQuotation ? !acceptedQuotation.is_expired : false;
  const isHospitalMatches = acceptedQuotation ? acceptedQuotation.hospital === selectedCase?.hospital : false;
  const docsList = selectedCase?.documents || [];
  const isPassportVerified = docsList.some(d => d.document_type === 'PASSPORT' && d.status === 'VERIFIED');
  const isMedicalReportVerified = docsList.some(d => d.document_type === 'MEDICAL_REPORT' && (d.status === 'VERIFIED' || d.status === 'RECEIVED'));

  const allRequirementsMet = isHospitalAssigned && isQuotationAccepted && isPassportVerified && isMedicalReportVerified;

  return (
    <div className="space-y-6">

      {/* Backend Error Alert Banner */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      {/* Top Header Navigation bar with View Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Foreign Treatment (HQ Admin)</h2>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-md">HQ Admin</span>
            </div>
            <p className="text-xs text-slate-500">
              Manage international treatment cases, hospitals, quotations and patient documents via Django REST API.
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${currentView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <Layers className="w-3.5 h-3.5" /> Dashboard
          </button>
          <button
            onClick={() => setCurrentView('cases-list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${currentView === 'cases-list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
          >
            <FileText className="w-3.5 h-3.5" /> Treatment Cases ({cases.length})
          </button>
          {selectedCase && (
            <button
              onClick={() => setCurrentView('case-details')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${currentView === 'case-details'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <FileCheck className="w-3.5 h-3.5" /> Case Details (FT-{String(selectedCase.id).padStart(3, '0')})
            </button>
          )}

          <div className="h-5 w-px bg-slate-200 mx-1" />

          <button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Case
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HQ ADMIN DASHBOARD VIEW                                               */}
      {/* ========================================================================= */}
      {currentView === 'dashboard' && (
        <div className="space-y-6">

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Total Cases */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Total Cases</span>
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Plane className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics?.totalCases ?? cases.length}</div>
            </div>

            {/* New Cases */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">New Cases</span>
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics?.newCases ?? 0}</div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">Need review</div>
            </div>

            {/* In Process */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">In Process</span>
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <RefreshCw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics?.inProcess ?? 0}</div>
              <div className="text-[11px] text-blue-600 font-bold mt-1">Active</div>
            </div>

            {/* Completed */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Completed</span>
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics?.completed ?? 0}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">This year</div>
            </div>

            {/* Documents Pending */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Documents Pending</span>
                <div className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics?.documentsPending ?? 0}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Action required</div>
            </div>

            {/* Quotations Pending */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Quotations Pending</span>
                <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics?.quotationsPending ?? 0}</div>
              <div className="text-[11px] text-purple-600 font-medium mt-1">Hospital desk</div>
            </div>

            {/* Verified Hospitals */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Verified Hospitals</span>
                <div className="p-1.5 bg-teal-100 text-teal-600 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{metrics?.verifiedHospitals ?? hospitals.length}</div>
              <div className="text-[11px] text-teal-600 font-bold mt-1">International</div>
            </div>
          </div>

          {/* Case Pipeline Kanban / Summary Cards */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Case Pipeline
              </h3>
              <button
                onClick={() => setCurrentView('cases-list')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                View Full Cases List <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* New Column */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>New ({cases.filter(c => c.status === 'NEW').length})</span>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
                <div className="space-y-2.5">
                  {cases.filter(c => c.status === 'NEW').slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenCaseDetails(item.id)}
                      className="bg-white p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600">FT-{String(item.id).padStart(3, '0')}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.centre_name || 'Centre'}</span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 mt-1">{item.member_name}</div>
                      <div className="text-xs text-slate-500">{item.treatment_required}</div>
                    </div>
                  ))}
                  <button
                    onClick={() => { setStatusFilter('NEW'); setCurrentView('cases-list'); }}
                    className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-800 py-1.5 transition-colors"
                  >
                    View All New
                  </button>
                </div>
              </div>

              {/* Reviewing Column */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>Reviewing ({cases.filter(c => c.status === 'REVIEWING').length})</span>
                </div>
                <div className="space-y-2.5">
                  {cases.filter(c => c.status === 'REVIEWING').slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenCaseDetails(item.id)}
                      className="bg-white p-3 rounded-lg border border-slate-200 hover:border-amber-500 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-600">FT-{String(item.id).padStart(3, '0')}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.centre_name || 'Centre'}</span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 mt-1">{item.member_name}</div>
                      <div className="text-xs text-slate-500">{item.treatment_required}</div>
                    </div>
                  ))}
                  <button
                    onClick={() => { setStatusFilter('REVIEWING'); setCurrentView('cases-list'); }}
                    className="w-full text-center text-xs font-bold text-amber-600 hover:text-amber-800 py-1.5 transition-colors"
                  >
                    View All Reviewing
                  </button>
                </div>
              </div>

              {/* Documents Pending Column */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="bg-teal-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>Documents Pending ({cases.filter(c => c.status === 'DOCUMENTS_PENDING').length})</span>
                </div>
                <div className="space-y-2.5">
                  {cases.filter(c => c.status === 'DOCUMENTS_PENDING').slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenCaseDetails(item.id)}
                      className="bg-white p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-600">FT-{String(item.id).padStart(3, '0')}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.centre_name || 'Centre'}</span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 mt-1">{item.member_name}</div>
                      <div className="text-xs text-slate-500">{item.treatment_required}</div>
                    </div>
                  ))}
                  <button
                    onClick={() => { setStatusFilter('DOCUMENTS_PENDING'); setCurrentView('cases-list'); }}
                    className="w-full text-center text-xs font-bold text-teal-600 hover:text-teal-800 py-1.5 transition-colors"
                  >
                    View All Pending Docs
                  </button>
                </div>
              </div>

              {/* Hospital Contacted Column */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg mb-3 flex items-center justify-between">
                  <span>Hospital Contacted ({cases.filter(c => c.status === 'HOSPITAL_CONTACTED').length})</span>
                </div>
                <div className="space-y-2.5">
                  {cases.filter(c => c.status === 'HOSPITAL_CONTACTED').slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenCaseDetails(item.id)}
                      className="bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">FT-{String(item.id).padStart(3, '0')}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.centre_name || 'Centre'}</span>
                      </div>
                      <div className="font-bold text-sm text-slate-900 mt-1">{item.member_name}</div>
                      <div className="text-xs text-slate-500">{item.treatment_required}</div>
                    </div>
                  ))}
                  <button
                    onClick={() => { setStatusFilter('HOSPITAL_CONTACTED'); setCurrentView('cases-list'); }}
                    className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1.5 transition-colors"
                  >
                    View All Contacted
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* International Hospitals Directory Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" /> Partner Hospitals Directory ({hospitals.length})
                </h3>
                <p className="text-xs text-slate-500">Verified medical institutions for international treatment referrals.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hospitals.map(h => (
                <div key={h.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {h.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{h.name}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {h.city}, {h.country}
                        </div>
                      </div>
                    </div>
                    {h.is_verified && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400" /> {h.contact_email || 'contact@hospital.com'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HQ ADMIN TREATMENT CASES LIST VIEW                                      */}
      {/* ========================================================================= */}
      {currentView === 'cases-list' && (
        <div className="space-y-4">

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Foreign Treatment Cases List</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewCaseModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> New Case
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search member, case, or treatment..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Status: All</option>
                <option value="NEW">Status: NEW</option>
                <option value="REVIEWING">Status: REVIEWING</option>
                <option value="DOCUMENTS_PENDING">Status: DOCUMENTS_PENDING</option>
                <option value="HOSPITAL_CONTACTED">Status: HOSPITAL_CONTACTED</option>
                <option value="QUOTATION_RECEIVED">Status: QUOTATION_RECEIVED</option>
                <option value="PATIENT_DECISION">Status: PATIENT_DECISION</option>
                <option value="PROCESSING">Status: PROCESSING</option>
                <option value="COMPLETED">Status: COMPLETED</option>
                <option value="CANCELLED">Status: CANCELLED</option>
              </select>

              {/* Centre filter */}
              <select
                value={centreFilter}
                onChange={e => setCentreFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Centre: All</option>
                <option value="Dhanmondi">Dhanmondi Centre</option>
                <option value="Uttara">Uttara Centre</option>
                <option value="Gulshan">Gulshan Centre</option>
                <option value="Mirpur">Mirpur Centre</option>
              </select>

              {/* Country filter */}
              <select
                value={countryFilter}
                onChange={e => setCountryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Country: All</option>
                {countries.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.flag_emoji ? `${c.flag_emoji} ` : ''}{c.name}
                  </option>
                ))}
              </select>

              {/* Hospital filter */}
              <select
                value={hospitalFilter}
                onChange={e => setHospitalFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Hospital: All</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.name}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Case ID</th>
                    <th className="p-3.5">Member</th>
                    <th className="p-3.5">Centre</th>
                    <th className="p-3.5">Treatment</th>
                    <th className="p-3.5">Country</th>
                    <th className="p-3.5">Hospital</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCases.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-3.5 font-bold text-blue-600">FT-{String(item.id).padStart(3, '0')}</td>
                      <td className="p-3.5 font-bold text-slate-900">{item.member_name}</td>
                      <td className="p-3.5 text-slate-600">{item.centre_name || 'N/A'}</td>
                      <td className="p-3.5 text-slate-800">{item.treatment_required}</td>
                      <td className="p-3.5 text-slate-600">{item.preferred_country}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">
                        {item.hospital_name ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" /> {item.hospital_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="p-3.5">{getStatusBadge(item.status)}</td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenCaseDetails(item.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        No foreign treatment cases found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HQ ADMIN CASE DETAILS VIEW                                             */}
      {/* ========================================================================= */}
      {currentView === 'case-details' && selectedCase && (
        <div className="space-y-5">

          {/* Top Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setCurrentView('cases-list')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Cases
                </button>

                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">FT-{String(selectedCase.id).padStart(3, '0')}</h2>
                  {getStatusBadge(selectedCase.status)}
                </div>
                <div className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                  <span>{selectedCase.member_name}</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <span className="text-xs text-slate-500 font-mono">Member ID: #{selectedCase.member}</span>
                </div>
              </div>

              {/* HQ Action Buttons Top Right */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStatusUpdateModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  Update Status
                </button>

                {/* Disable hospital assignment if an accepted quotation exists (Spec Rule 12) */}
                <button
                  disabled={isQuotationAccepted}
                  onClick={() => setIsAssignHospitalModalOpen(true)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${isQuotationAccepted
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  title={isQuotationAccepted ? 'Hospital is locked because an accepted quotation exists' : undefined}
                >
                  Assign Hospital
                </button>
              </div>
            </div>

            {/* Case Sub-Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 pt-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 transition-colors border-b-2 ${activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'documents'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Documents
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                  {selectedCase.documents?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('quotations')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'quotations'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Quotations
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                  {selectedCase.quotations?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${activeTab === 'activity'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                Activity
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                  {selectedCase.activities?.length || 0}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Left 2 columns: Case Info & Description */}
              <div className="lg:col-span-2 space-y-5">

                {/* Case Information Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                    Case Information
                  </h3>

                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Member</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedCase.member_name}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Member ID</span>
                      <span className="font-bold text-slate-800 font-mono">#{selectedCase.member}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Network Centre</span>
                      <span className="font-bold text-slate-800">{selectedCase.centre_name || 'Network Centre'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Treatment Required</span>
                      <span className="font-bold text-blue-600">{selectedCase.treatment_required}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Preferred Country</span>
                      <span className="font-bold text-slate-800">{selectedCase.preferred_country}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Assigned Hospital</span>
                      <span className="font-bold text-slate-800">
                        {selectedCase.hospital_name || 'Not Assigned'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Created At</span>
                      <span className="font-bold text-slate-800">
                        {new Date(selectedCase.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description Box */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Description</h3>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedCase.description || 'Patient requires international medical evaluation.'}
                  </p>
                </div>
              </div>

              {/* Right column: Status, Assigned Hospital, Processing Checklist */}
              <div className="space-y-5">

                {/* Assigned Hospital Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-400 block">Assigned Hospital</span>
                  {selectedCase.hospital_name ? (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-blue-900">{selectedCase.hospital_name}</div>
                        <div className="text-xs text-blue-700">{selectedCase.preferred_country}</div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center space-y-2">
                      <span className="text-xs text-slate-500 font-medium block">Not Assigned</span>
                      <button
                        onClick={() => setIsAssignHospitalModalOpen(true)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        Assign Hospital
                      </button>
                    </div>
                  )}
                </div>

                {/* Current Status Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-400 block">Current Status</span>
                  <div className="flex items-center justify-between">
                    <div>{getStatusBadge(selectedCase.status)}</div>
                    <button
                      onClick={() => setIsStatusUpdateModalOpen(true)}
                      className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Update Status
                    </button>
                  </div>
                </div>

                {/* Processing Requirements Checklist Box (Spec Rule 16) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Processing Requirements
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      {isHospitalAssigned ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={isHospitalAssigned ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                        Hospital Assigned
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isQuotationAccepted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={isQuotationAccepted ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                        Accepted Quotation
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPassportVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={isPassportVerified ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                        Passport Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMedicalReportVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={isMedicalReportVerified ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                        Medical Report Verified
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={!allRequirementsMet}
                    onClick={() => handleUpdateStatus()}
                    className={`w-full py-2 text-xs font-bold rounded-lg transition-colors ${allRequirementsMet
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    Move to Processing
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Treatment Documents</h3>
                  <p className="text-xs text-slate-500">Manage patient medical records, passports, visas and test reports.</p>
                </div>
                <button
                  onClick={() => setIsUploadDocModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Document
                </button>
              </div>

              <div className="space-y-3">
                {selectedCase.documents?.map(doc => (
                  <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{doc.document_type}</h4>
                          {getDocStatusBadge(doc.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{doc.description || 'Uploaded Document'}</p>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Uploaded by: {doc.uploaded_by_name || 'System'}
                        </div>
                      </div>
                    </div>

                    {/* Document Action Controls for HQ Admin */}
                    <div className="flex items-center gap-2">
                      {(doc.file_url || doc.file) && (
                        <a
                          href={doc.file_url || doc.file || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> File
                        </a>
                      )}
                      <button
                        onClick={() => setDocPreviewModal(doc)}
                        className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>

                      {/* HQ Action to Verify / Reject */}
                      {doc.status !== 'VERIFIED' && (
                        <button
                          onClick={() => handleVerifyDoc(doc.id, 'VERIFIED')}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-colors"
                        >
                          Verify
                        </button>
                      )}

                      {doc.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleVerifyDoc(doc.id, 'REJECTED', 'Document invalid or illegible')}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {(!selectedCase.documents || selectedCase.documents.length === 0) && (
                  <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No documents uploaded yet for this case.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUOTATIONS TAB */}
          {activeTab === 'quotations' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Treatment Quotations</h3>
                  <p className="text-xs text-slate-500">Official medical estimates and cost breakdowns shared with the patient.</p>
                </div>
                <button
                  onClick={handleOpenAddQuotationModal}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Quotation
                </button>
              </div>

              <div className="space-y-4">
                {selectedCase.quotations?.map(quo => (
                  <div key={quo.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-base text-slate-900">{quo.hospital_name}</h4>
                          </div>
                        </div>
                      </div>

                      {/* Cost Summary Box */}
                      <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Cost</span>
                          <span className="font-extrabold text-sm text-slate-900">
                            {quo.currency} {Number(quo.estimated_cost).toLocaleString()}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Stay</span>
                          <span className="font-bold text-xs text-slate-800">{quo.estimated_stay_days} Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                      {quo.details}
                    </div>

                    {(quo.attachment_url || quo.attachment) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between bg-blue-50/50 p-2.5 rounded-lg">
                        <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5 truncate">
                          <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">Attachment: {typeof quo.attachment === 'string' ? quo.attachment.split('/').pop() : 'Quotation Document'}</span>
                        </span>
                        <a
                          href={quo.attachment_url || (typeof quo.attachment === 'string' ? quo.attachment : '#')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded border border-blue-200 shrink-0 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5" /> View / Download
                        </a>
                      </div>
                    )}

                    {/* Patient Decision Record Buttons (Spec Rule 26) */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 mt-2">
                      {quo.status !== 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateQuotationStatus(quo.id, 'ACCEPTED')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          Patient Accepted
                        </button>
                      )}
                      {quo.status !== 'DECLINED' && (
                        <button
                          onClick={() => handleUpdateQuotationStatus(quo.id, 'DECLINED')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors shadow-xs"
                        >
                          Patient Declined
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {(!selectedCase.quotations || selectedCase.quotations.length === 0) && (
                  <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No treatment quotations added yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Activity Timeline
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedCase.activities?.map((item, idx) => (
                  <div key={item.id || idx} className="relative flex items-start gap-3">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 w-full space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          Status: {item.previous_status} → {item.new_status}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{item.notes}</p>
                      <div className="text-[10px] text-slate-400 font-semibold pt-1">
                        By: <span className="text-slate-700 font-bold">{item.performed_by_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. Status Update Modal */}
      {isStatusUpdateModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Update Case Status</h3>
              <button onClick={() => setIsStatusUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Status</label>
                <div>{getStatusBadge(selectedCase.status)}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Status</label>
                <select
                  value={statusForm.newStatus}
                  onChange={e => setStatusForm({ ...statusForm, newStatus: e.target.value as ForeignCaseStatus })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="NEW">NEW</option>
                  <option value="REVIEWING">REVIEWING</option>
                  <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
                  <option value="HOSPITAL_CONTACTED">HOSPITAL_CONTACTED</option>
                  <option value="QUOTATION_RECEIVED">QUOTATION_RECEIVED</option>
                  <option value="PATIENT_DECISION">PATIENT_DECISION</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Remarks</label>
                <textarea
                  rows={3}
                  value={statusForm.notes}
                  onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                  placeholder="Documents verified and hospital contacted."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsStatusUpdateModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Confirm Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Assign Hospital Modal */}
      {isAssignHospitalModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Assign Hospital</h3>
              <button onClick={() => setIsAssignHospitalModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Partner Hospital</label>
                <select
                  value={assignForm.hospitalId}
                  onChange={e => {
                    const selId = Number(e.target.value);
                    const sel = hospitals.find(h => h.id === selId);
                    setAssignForm({
                      hospitalId: selId,
                      hospitalName: sel ? sel.name : ''
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>-- Choose Active Verified Hospital --</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.city}, {h.country})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAssignHospitalModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignHospital}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Upload Document Modal */}
      {isUploadDocModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Upload Treatment Document</h3>
              <button onClick={() => setIsUploadDocModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Type *</label>
                <select
                  value={docForm.type}
                  onChange={e => setDocForm({ ...docForm, type: e.target.value as DocumentType })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="MEDICAL_REPORT">Medical Report</option>
                  <option value="VISA">Visa</option>
                  <option value="PRESCRIPTION">Prescription</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Patient's latest medical report"
                  value={docForm.description}
                  onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">File Upload (multipart/form-data)</label>
                <input
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setDocForm({ ...docForm, file: e.target.files[0] });
                    }
                  }}
                  className="w-full text-xs text-slate-500 border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsUploadDocModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDoc}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Quotation Modal */}
      {isAddQuotationModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add Treatment Quotation</h3>
              <button onClick={() => setIsAddQuotationModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital *</label>
                <select
                  value={quotationForm.hospitalId}
                  disabled={!!selectedCase?.hospital}
                  onChange={e => {
                    const selId = Number(e.target.value);
                    const sel = hospitals.find(h => h.id === selId);
                    setQuotationForm({
                      ...quotationForm,
                      hospitalId: selId,
                      hospitalName: sel ? sel.name : ''
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold disabled:bg-slate-100 disabled:text-slate-600"
                >
                  <option value={0}>-- Select Hospital --</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                {selectedCase?.hospital && (
                  <p className="text-[10px] text-blue-600 font-semibold mt-1">
                    Locked to case assigned hospital ({selectedCase.hospital_name || `Hospital #${selectedCase.hospital}`})
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Currency</label>
                <select
                  value={quotationForm.currency}
                  onChange={e => setQuotationForm({ ...quotationForm, currency: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="THB">THB (฿)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Cost *</label>
                <input
                  type="number"
                  value={quotationForm.estimatedCost}
                  onChange={e => setQuotationForm({ ...quotationForm, estimatedCost: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Stay (Days)</label>
                <input
                  type="number"
                  value={quotationForm.estimatedStayDays}
                  onChange={e => setQuotationForm({ ...quotationForm, estimatedStayDays: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Valid Until</label>
                <input
                  type="date"
                  value={quotationForm.validUntil}
                  onChange={e => setQuotationForm({ ...quotationForm, validUntil: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Details & Breakdown</label>
                <textarea
                  rows={3}
                  value={quotationForm.details}
                  onChange={e => setQuotationForm({ ...quotationForm, details: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Quotation Document / Attachment (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={e => setQuotationForm({ ...quotationForm, attachment: e.target.files?.[0] || null })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                {quotationForm.attachment && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    Selected file: {quotationForm.attachment.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddQuotationModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuotation}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Save Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. New Case Modal */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create Foreign Treatment Case</h3>
              <button onClick={() => setIsNewCaseModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Member *</label>
                <select
                  value={newCaseForm.memberId}
                  onChange={e => {
                    const idNum = Number(e.target.value);
                    const mem = members.find(m => m.id === idNum);
                    setNewCaseForm({
                      ...newCaseForm,
                      memberId: idNum,
                      memberName: mem ? mem.full_name : ''
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.public_id})</option>
                  ))}
                  {members.length === 0 && <option value={12}>Rahim Ahmed (BV-M-000123)</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Treatment Required *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kidney Transplant"
                    value={newCaseForm.treatmentRequired}
                    onChange={e => setNewCaseForm({ ...newCaseForm, treatmentRequired: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preferred Country</label>
                  <select
                    value={newCaseForm.preferredCountry}
                    onChange={e => {
                      const val = e.target.value;
                      const matched = countries.find(c => c.name === val);
                      setNewCaseForm({
                        ...newCaseForm,
                        preferredCountry: val,
                        countryId: matched ? matched.id : null,
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {countries.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.flag_emoji ? `${c.flag_emoji} ` : (c.code ? `${c.code} ` : '')}{c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Patient Condition</label>
                <textarea
                  rows={3}
                  placeholder="Provide treatment details, patient condition and specific requirements..."
                  value={newCaseForm.description}
                  onChange={e => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsNewCaseModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Create Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Hospital Modal */}
      {isAddHospitalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add International Hospital</h3>
              <button onClick={() => setIsAddHospitalModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Hospital Name *</label>
                <input
                  type="text"
                  placeholder="Apollo Hospitals"
                  value={newHospitalForm.name}
                  onChange={e => setNewHospitalForm({ ...newHospitalForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Chennai"
                    value={newHospitalForm.city}
                    onChange={e => setNewHospitalForm({ ...newHospitalForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={newHospitalForm.country}
                    onChange={e => setNewHospitalForm({ ...newHospitalForm, country: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="international@hospital.com"
                  value={newHospitalForm.contactEmail}
                  onChange={e => setNewHospitalForm({ ...newHospitalForm, contactEmail: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddHospitalModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHospital}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                Save Hospital
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Document Preview Modal */}
      {docPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">{docPreviewModal.document_type} Preview</h3>
              <button onClick={() => setDocPreviewModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">Description:</span>
                <span className="font-bold text-slate-900 text-sm">{docPreviewModal.description || 'Medical Document'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Status:</span>
                <div>{getDocStatusBadge(docPreviewModal.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Uploaded By:</span>
                <span className="text-slate-700">{docPreviewModal.uploaded_by_name || 'System'}</span>
              </div>

              {/* DOCUMENT FILE PREVIEW & DOWNLOAD LINK */}
              {(docPreviewModal.file_url || docPreviewModal.file) ? (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <span className="text-slate-400 font-bold block">Attached Document File:</span>

                  {/* Render Image Preview if file URL exists */}
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 max-h-64 flex items-center justify-center p-2">
                    <img
                      src={docPreviewModal.file_url || docPreviewModal.file || ''}
                      alt={docPreviewModal.document_type}
                      className="max-h-60 w-auto object-contain rounded-lg shadow-xs"
                      onError={(e) => {
                        // Fallback UI if file is not directly renderable as image
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 truncate">
                        {(docPreviewModal.file_url || docPreviewModal.file)?.split('/').pop()}
                      </span>
                    </div>
                    <a
                      href={docPreviewModal.file_url || docPreviewModal.file || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open / Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 text-slate-400 italic">
                  No file attached to this document record.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDocPreviewModal(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
