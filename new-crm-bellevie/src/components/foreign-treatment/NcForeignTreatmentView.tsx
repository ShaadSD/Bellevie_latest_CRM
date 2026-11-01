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
  Info,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import {
  ForeignTreatmentCase,
  ForeignCaseStatus,
  ForeignCountry,
  DocumentType,
  DocumentStatus,
  QuotationStatus,
  TreatmentDocument,
  TreatmentQuotation,
  fetchForeignCasesApi,
  fetchForeignCaseByIdApi,
  fetchForeignCountriesApi,
  createForeignCaseApi,
  uploadForeignDocumentApi,
  updateQuotationStatusApi
} from '@/lib/foreignTreatmentApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';

interface NcForeignTreatmentViewProps {
  userCentreName?: string;
}

export const NcForeignTreatmentView: React.FC<NcForeignTreatmentViewProps> = ({
  userCentreName = 'Dhanmondi Centre'
}) => {
  // Navigation & Subviews: 'dashboard' | 'cases-list' | 'case-details'
  const [currentView, setCurrentView] = useState<'dashboard' | 'cases-list' | 'case-details'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'quotations' | 'activity'>('overview');

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data States
  const [cases, setCases] = useState<ForeignTreatmentCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<ForeignTreatmentCase | null>(null);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [countries, setCountries] = useState<ForeignCountry[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');

  // Modals visibility
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [docPreviewModal, setDocPreviewModal] = useState<TreatmentDocument | null>(null);
  const [quotationDetailsModal, setQuotationDetailsModal] = useState<TreatmentQuotation | null>(null);

  // Form states
  const [docForm, setDocForm] = useState<{ type: DocumentType; description: string; file: File | null }>({
    type: 'MEDICAL_REPORT',
    description: '',
    file: null
  });

  // New Case form + inline document uploads
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [medicalReportFiles, setMedicalReportFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCaseForm, setNewCaseForm] = useState({
    memberId: 1,
    memberName: '',
    countryId: null as number | null,
    // Patient intake fields (from notebook)
    patientAge: '' as string | number,
    patientGender: '',
    patientPhone: '',
    patientEmail: '',
    patientNationality: '',
    attendants: [{ name: '', passport_number: '' }] as { name: string; passport_number: string }[],
    chiefComplaints: '',
    requiredDate: '',
    // Case fields
    treatmentRequired: '',
    preferredCountry: 'India',
    description: ''
  });

  // Load Data for Network Centre (Spec: Backend isolates cases for NC, or client filters by centre)
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [cList, memList, countryList] = await Promise.all([
        fetchForeignCasesApi({ centre: userCentreName }),
        fetchMembersList(),
        fetchForeignCountriesApi(),
      ]);
      setCases(cList);
      const membersArray = Array.isArray(memList) ? memList : (memList?.results || []);
      setMembers(membersArray);
      setCountries(countryList);

      if (membersArray.length > 0) {
        setNewCaseForm(prev => {
          if (prev.memberId === 12 || !membersArray.some(m => m.id === prev.memberId)) {
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
      setErrorMsg(err.message || 'Failed to load cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userCentreName, selectedCaseId]);

  // Open case details
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
      (c.treatment_required && c.treatment_required.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesCountry = countryFilter === 'ALL' || c.preferred_country === countryFilter;
    return matchesSearch && matchesStatus && matchesCountry;
  });

  // NC Action Handlers (Upload Document using multipart/form-data, Spec Rule 32 & 33)
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

  // Create Case + auto-upload documents
  const handleCreateCase = async () => {
    if (!newCaseForm.treatmentRequired) return;
    setIsSubmitting(true);
    try {
      const selectedMember = members.find(m => m.id === newCaseForm.memberId) || members[0];
      const targetMemberId = selectedMember ? selectedMember.id : (members[0]?.id || 1);
      const mName = selectedMember ? selectedMember.full_name : newCaseForm.memberName || `Member #${targetMemberId}`;
      const caseDesc = newCaseForm.description.trim() || `Patient requires ${newCaseForm.treatmentRequired} evaluation and treatment.`;
      const cleanAttendants = newCaseForm.attendants.filter(a => a.name.trim() !== '');

      // Step 1: Create the case
      const created = await createForeignCaseApi({
        member: targetMemberId,
        member_name: mName,
        country: newCaseForm.countryId,
        treatment_required: newCaseForm.treatmentRequired,
        preferred_country: newCaseForm.preferredCountry,
        description: caseDesc,
        centre_name: userCentreName,
        requested_by_name: `${userCentreName} User`,
        patient_age: newCaseForm.patientAge !== '' ? Number(newCaseForm.patientAge) : null,
        patient_gender: newCaseForm.patientGender,
        patient_phone: newCaseForm.patientPhone,
        patient_email: newCaseForm.patientEmail,
        patient_nationality: newCaseForm.patientNationality,
        attendants: cleanAttendants,
        chief_complaints: newCaseForm.chiefComplaints,
        required_date: newCaseForm.requiredDate || null,
      });

      // Step 2: Auto-upload documents immediately after case creation
      if (created && created.id) {
        const uploadTasks: Promise<any>[] = [];

        // Upload passport
        if (passportFile) {
          const fd = new FormData();
          fd.append('case', String(created.id));
          fd.append('document_type', 'PASSPORT');
          fd.append('description', 'Patient Passport');
          fd.append('file', passportFile);
          uploadTasks.push(uploadForeignDocumentApi(fd).catch(e => console.warn('Passport upload failed:', e)));
        }

        // Upload medical reports (multiple files)
        for (const mFile of medicalReportFiles) {
          const fd = new FormData();
          fd.append('case', String(created.id));
          fd.append('document_type', 'MEDICAL_REPORT');
          fd.append('description', mFile.name);
          fd.append('file', mFile);
          uploadTasks.push(uploadForeignDocumentApi(fd).catch(e => console.warn('Medical report upload failed:', e)));
        }

        if (uploadTasks.length > 0) {
          await Promise.all(uploadTasks);
        }
      }

      // Reset form
      setIsNewCaseModalOpen(false);
      setPassportFile(null);
      setMedicalReportFiles([]);
      setNewCaseForm({
        memberId: members[0]?.id || 1,
        memberName: members[0]?.full_name || '',
        countryId: countries[0]?.id || null,
        patientAge: '',
        patientGender: '',
        patientPhone: '',
        patientEmail: '',
        patientNationality: '',
        attendants: [{ name: '', passport_number: '' }],
        chiefComplaints: '',
        requiredDate: '',
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuotationStatus = async (quoId: number, status: QuotationStatus) => {
    if (!selectedCase) return;
    try {
      await updateQuotationStatusApi(quoId, status);
      const updatedCase = await fetchForeignCaseByIdApi(selectedCase.id);
      if (updatedCase) {
        setSelectedCase(updatedCase);
      }
      if (quotationDetailsModal && quotationDetailsModal.id === quoId) {
        setQuotationDetailsModal({ ...quotationDetailsModal, status });
      }
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Filter quotations for NC (shows all quotations attached to the case)
  const sharedQuotations = selectedCase?.quotations || [];

  // Processing checklist checks
  const isHospitalAssigned = !!selectedCase?.hospital;
  const isQuotationAccepted = sharedQuotations.some(q => q.status === 'ACCEPTED');
  const docsList = selectedCase?.documents || [];
  const isPassportVerified = docsList.some(d => d.document_type === 'PASSPORT' && d.status === 'VERIFIED');
  const isMedicalReportVerified = docsList.some(d => d.document_type === 'MEDICAL_REPORT' && (d.status === 'VERIFIED' || d.status === 'RECEIVED'));

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

      {/* Top Header Navigation bar for Network Centre */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Foreign Treatment</h2>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-md">
                {userCentreName}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manage your centre's international treatment cases.
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
            <FileText className="w-3.5 h-3.5" /> My Cases ({cases.length})
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
            <Plus className="w-3.5 h-3.5" /> New Treatment Case
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. NETWORK CENTRE DASHBOARD VIEW                                          */}
      {/* ========================================================================= */}
      {currentView === 'dashboard' && (
        <div className="space-y-6">

          {/* NC Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* My Cases */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">My Cases</span>
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Plane className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{cases.length}</div>
            </div>

            {/* Documents */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Documents</span>
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {cases.reduce((acc, c) => acc + (c.documents?.length || 0), 0)}
              </div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">Pending verification</div>
            </div>

            {/* Quotations */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Quotations</span>
                <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {cases.reduce((acc, c) => acc + (c.quotations?.length || 0), 0)}
              </div>
              <div className="text-[11px] text-purple-600 font-bold mt-1">Shared with you</div>
            </div>

            {/* Completed */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-600">Completed</span>
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {cases.filter(c => c.status === 'COMPLETED').length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">This year</div>
            </div>
          </div>

          {/* Case Status Overview Pill Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Case Status Overview</h3>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">New ({cases.filter(c => c.status === 'NEW').length})</span>
              <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">Reviewing ({cases.filter(c => c.status === 'REVIEWING').length})</span>
              <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">Documents Pending ({cases.filter(c => c.status === 'DOCUMENTS_PENDING').length})</span>
              <span className="px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">Hospital Contacted ({cases.filter(c => c.status === 'HOSPITAL_CONTACTED').length})</span>
              <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">Quotation Received ({cases.filter(c => c.status === 'QUOTATION_RECEIVED').length})</span>
              <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">Patient Decision ({cases.filter(c => c.status === 'PATIENT_DECISION').length})</span>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">Processing ({cases.filter(c => c.status === 'PROCESSING').length})</span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Completed ({cases.filter(c => c.status === 'COMPLETED').length})</span>
            </div>
          </div>

          {/* Recent Cases Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent Cases</h3>
              <button
                onClick={() => setCurrentView('cases-list')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
              >
                View All My Cases <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Case ID</th>
                    <th className="p-3">Member</th>
                    <th className="p-3">Treatment</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cases.slice(0, 5).map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-3 font-bold text-blue-600">FT-{String(item.id).padStart(3, '0')}</td>
                      <td className="p-3 font-bold text-slate-900">{item.member_name}</td>
                      <td className="p-3 text-slate-800">{item.treatment_required}</td>
                      <td className="p-3 text-slate-600">{item.preferred_country}</td>
                      <td className="p-3">{getStatusBadge(item.status)}</td>
                      <td className="p-3 text-slate-500">
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenCaseDetails(item.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors"
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
      )}

      {/* ========================================================================= */}
      {/* 2. NETWORK CENTRE CASES LIST VIEW                                         */}
      {/* ========================================================================= */}
      {currentView === 'cases-list' && (
        <div className="space-y-4">

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">My Foreign Treatment Cases</h3>
              <button
                onClick={() => setIsNewCaseModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Case
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

              {/* Reset button */}
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCountryFilter('ALL'); }}
                className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
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
                      <td className="p-3.5 text-slate-800">{item.treatment_required}</td>
                      <td className="p-3.5 text-slate-600">{item.preferred_country}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">
                        {item.hospital_name || '-'}
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
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        No foreign treatment cases found for {userCentreName}.
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
      {/* 3. NETWORK CENTRE CASE DETAILS VIEW (WITH READONLY HQ CONTROLS)            */}
      {/* ========================================================================= */}
      {currentView === 'case-details' && selectedCase && (
        <div className="space-y-5">

          {/* Banner note: Status can only be updated by HQ (Spec Rule 41) */}
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Status can only be updated by HQ. Network Centre users can upload documents and view quotations.</span>
          </div>

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
                  <span className="text-xs text-slate-500 font-mono">Member ID: {selectedCase.member_public_id || 'N/A'}</span>
                </div>
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
                  {sharedQuotations.length}
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
                    Patient Information
                  </h3>

                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Full Name</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedCase.member_name}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Member ID</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedCase.member_public_id || 'N/A'}</span>
                    </div>

                    {selectedCase.patient_age && (
                      <div>
                        <span className="text-slate-400 block font-medium">Age</span>
                        <span className="font-bold text-slate-800">{selectedCase.patient_age} years</span>
                      </div>
                    )}

                    {selectedCase.patient_gender && (
                      <div>
                        <span className="text-slate-400 block font-medium">Gender</span>
                        <span className="font-bold text-slate-800 capitalize">{selectedCase.patient_gender.toLowerCase()}</span>
                      </div>
                    )}

                    {selectedCase.patient_phone && (
                      <div>
                        <span className="text-slate-400 block font-medium">Phone</span>
                        <span className="font-bold text-slate-800">{selectedCase.patient_phone}</span>
                      </div>
                    )}

                    {selectedCase.patient_email && (
                      <div>
                        <span className="text-slate-400 block font-medium">Email</span>
                        <span className="font-bold text-slate-800 break-all">{selectedCase.patient_email}</span>
                      </div>
                    )}

                    {selectedCase.patient_nationality && (
                      <div>
                        <span className="text-slate-400 block font-medium">Nationality</span>
                        <span className="font-bold text-slate-800">{selectedCase.patient_nationality}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 block font-medium">Network Centre</span>
                      <span className="font-bold text-slate-800">{selectedCase.centre_name || userCentreName}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Treatment Required</span>
                      <span className="font-bold text-blue-600">{selectedCase.treatment_required}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Preferred Country</span>
                      <span className="font-bold text-slate-800">{selectedCase.preferred_country}</span>
                    </div>

                    {selectedCase.required_date && (
                      <div>
                        <span className="text-slate-400 block font-medium">Required Date & Time</span>
                        <span className="font-bold text-slate-800">
                          {new Date(selectedCase.required_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-400 block font-medium">Created At</span>
                      <span className="font-bold text-slate-800">
                        {new Date(selectedCase.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Chief Complaints */}
                  {selectedCase.chief_complaints && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium text-xs mb-1">Chief Complaints</span>
                      <p className="text-xs text-slate-700 bg-orange-50 border border-orange-100 rounded-lg p-2.5 leading-relaxed font-medium">
                        {selectedCase.chief_complaints}
                      </p>
                    </div>
                  )}

                  {/* Attendants */}
                  {selectedCase.attendants && selectedCase.attendants.length > 0 && selectedCase.attendants.some(a => a.name) && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium text-xs mb-2">Attendant(s)</span>
                      <div className="space-y-1.5">
                        {selectedCase.attendants.filter(a => a.name).map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-bold text-slate-800">{att.name}</span>
                            </div>
                            {att.passport_number && (
                              <span className="font-mono text-slate-500 text-[11px]">PP: {att.passport_number}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description Box */}
                {selectedCase.description && (
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">Description</h3>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedCase.description}
                    </p>
                  </div>
                )}
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
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">Not Assigned by HQ yet</span>
                    </div>
                  )}
                </div>

                {/* Current Status Box (Read-only for NC, Spec Rule 41) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-400 block">Current Status</span>
                  <div className="space-y-2">
                    <div>{getStatusBadge(selectedCase.status)}</div>
                    <span className="text-[11px] text-slate-400 italic block">Status updated by HQ only.</span>
                  </div>
                </div>

                {/* Processing Requirements Checklist Box (View only) */}
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
                      {isPassportVerified && isMedicalReportVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={isPassportVerified && isMedicalReportVerified ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                        All Documents Verified
                      </span>
                    </div>
                  </div>
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
                  <p className="text-xs text-slate-500">Upload member medical files, passports, visas and test reports.</p>
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
                        <p className="text-xs text-slate-500 mt-0.5">{doc.description || 'Uploaded File'}</p>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Uploaded by: {doc.uploaded_by_name || 'Network Centre'}
                        </div>

                        {doc.notes && (
                          <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                            <strong>Note:</strong> {doc.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Actions */}
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

                      {doc.status === 'REQUIRED' || doc.status === 'REJECTED' ? (
                        <button
                          onClick={() => setIsUploadDocModalOpen(true)}
                          className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors shadow-sm"
                        >
                          Upload
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {(!selectedCase.documents || selectedCase.documents.length === 0) && (
                  <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No documents uploaded yet. Click "Upload Document" to attach member files.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: QUOTATIONS TAB (VIEW ONLY FOR NC) */}
          {activeTab === 'quotations' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Treatment Quotations</h3>
                  <p className="text-xs text-slate-500">Treatment estimates provided by HQ Admin and international hospitals.</p>
                </div>
              </div>

              <div className="space-y-4">
                {sharedQuotations.map(quo => (
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

                      {/* Cost Summary */}
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

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 mt-2">
                      <button
                        onClick={() => setQuotationDetailsModal(quo)}
                        className="px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}

                {sharedQuotations.length === 0 && (
                  <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    No quotations shared by HQ Admin yet.
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

      {/* 1. NC Upload Document Modal (multipart/form-data) */}
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

      {/* 2. NC New Case Modal — Full Intake Form */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plane className="w-5 h-5 text-blue-600" /> Create Foreign Treatment Case
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Fill all patient details for international treatment referral</p>
              </div>
              <button onClick={() => setIsNewCaseModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">✕</button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 text-xs">

              {/* Section: Patient Identity */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 border-b border-blue-100 pb-1.5">① Patient Identity</h4>

                {/* Select Member */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Member *</label>
                  <select
                    value={newCaseForm.memberId}
                    onChange={e => {
                      const idNum = Number(e.target.value);
                      const mem = members.find(m => m.id === idNum);
                      setNewCaseForm({ ...newCaseForm, memberId: idNum, memberName: mem ? mem.full_name : '' });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name} ({m.public_id || `BV-${m.id}`})</option>
                    ))}
                    {members.length === 0 && <option value={12}>test (BV-1234462)</option>}
                  </select>
                </div>

                {/* Age, Gender, Phone */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">② Age</label>
                    <input
                      type="number" min={1} max={150}
                      placeholder="e.g. 45"
                      value={newCaseForm.patientAge}
                      onChange={e => setNewCaseForm({ ...newCaseForm, patientAge: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">③ Gender</label>
                    <select
                      value={newCaseForm.patientGender}
                      onChange={e => setNewCaseForm({ ...newCaseForm, patientGender: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">④ Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+880 1700-000000"
                      value={newCaseForm.patientPhone}
                      onChange={e => setNewCaseForm({ ...newCaseForm, patientPhone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email, Nationality */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">⑤ Email</label>
                    <input
                      type="email"
                      placeholder="patient@email.com"
                      value={newCaseForm.patientEmail}
                      onChange={e => setNewCaseForm({ ...newCaseForm, patientEmail: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">⑥ Nationality</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangladeshi"
                      value={newCaseForm.patientNationality}
                      onChange={e => setNewCaseForm({ ...newCaseForm, patientNationality: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Document Upload */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 border-b border-blue-100 pb-1.5">⑦ Passport & ⑧ Medical Reports (Upload)</h4>

                {/* Passport Upload */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">⑦ Patient Passport</label>
                  <label className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${passportFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={e => setPassportFile(e.target.files?.[0] || null)}
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${passportFile ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      {passportFile ? <Check className="w-4 h-4 text-emerald-600" /> : <Upload className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {passportFile ? (
                        <div>
                          <p className="font-bold text-emerald-700 truncate text-[11px]">{passportFile.name}</p>
                          <p className="text-[10px] text-emerald-600">{(passportFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-600 text-[11px]">Click to upload passport</p>
                          <p className="text-[10px] text-slate-400">PDF, JPG, PNG</p>
                        </div>
                      )}
                    </div>
                    {passportFile && (
                      <button type="button" onClick={e => { e.preventDefault(); setPassportFile(null); }}
                        className="text-red-400 hover:text-red-600 font-bold text-sm shrink-0">✕</button>
                    )}
                  </label>
                </div>

                {/* Medical Reports Upload */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">⑧ Medical Reports (multiple allowed)</label>
                  <label className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${medicalReportFiles.length > 0 ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        setMedicalReportFiles(prev => [...prev, ...files]);
                      }}
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${medicalReportFiles.length > 0 ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      {medicalReportFiles.length > 0 ? <Check className="w-4 h-4 text-emerald-600" /> : <Upload className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {medicalReportFiles.length > 0 ? (
                        <p className="font-bold text-emerald-700 text-[11px]">{medicalReportFiles.length} file(s) selected — click to add more</p>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-600 text-[11px]">Click to upload medical reports</p>
                          <p className="text-[10px] text-slate-400">PDF, JPG, PNG, DOC — multiple files allowed</p>
                        </div>
                      )}
                    </div>
                  </label>
                  {/* Show selected medical report files */}
                  {medicalReportFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {medicalReportFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="text-slate-700 font-medium truncate">{f.name}</span>
                            <span className="text-slate-400 shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button type="button"
                            onClick={() => setMedicalReportFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-red-400 hover:text-red-600 font-bold ml-2 shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>


              {/* Section: Attendants */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 border-b border-blue-100 pb-1.5 flex-1">⑨ Attendant(s) — Name & Passport No.</h4>
                  {newCaseForm.attendants.length < 2 && (
                    <button
                      type="button"
                      onClick={() => setNewCaseForm(prev => ({ ...prev, attendants: [...prev.attendants, { name: '', passport_number: '' }] }))}
                      className="ml-3 px-2.5 py-1 text-[11px] font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3 h-3" /> Add (max 2)
                    </button>
                  )}
                </div>
                {newCaseForm.attendants.map((att, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder={`Attendant ${idx + 1} Full Name`}
                        value={att.name}
                        onChange={e => {
                          const updated = [...newCaseForm.attendants];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setNewCaseForm({ ...newCaseForm, attendants: updated });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Passport Number"
                        value={att.passport_number}
                        onChange={e => {
                          const updated = [...newCaseForm.attendants];
                          updated[idx] = { ...updated[idx], passport_number: e.target.value };
                          setNewCaseForm({ ...newCaseForm, attendants: updated });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {newCaseForm.attendants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewCaseForm(prev => ({ ...prev, attendants: prev.attendants.filter((_, i) => i !== idx) }))}
                        className="text-red-400 hover:text-red-600 font-bold text-base leading-none p-1"
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>

              {/* Section: Treatment Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 border-b border-blue-100 pb-1.5">Treatment Details</h4>

                {/* Country, Treatment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">⑩ Country Name *</label>
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {countries.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.flag_emoji ? `${c.flag_emoji} ` : (c.code ? `${c.code} ` : '')}{c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Treatment Required *</label>
                    <input
                      type="text"
                      placeholder="e.g. Kidney Transplant, Cancer Treatment"
                      value={newCaseForm.treatmentRequired}
                      onChange={e => setNewCaseForm({ ...newCaseForm, treatmentRequired: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Chief Complaints */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">⑪ Chief Complaints</label>
                  <textarea
                    rows={2}
                    placeholder="Patient's chief medical complaints..."
                    value={newCaseForm.chiefComplaints}
                    onChange={e => setNewCaseForm({ ...newCaseForm, chiefComplaints: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Required Date & Time */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">⑫ Required Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newCaseForm.requiredDate}
                    onChange={e => setNewCaseForm({ ...newCaseForm, requiredDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Additional Description</label>
                  <textarea
                    rows={2}
                    placeholder="Any extra details about patient condition..."
                    value={newCaseForm.description}
                    onChange={e => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

            </div>{/* end scroll body */}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/80 rounded-b-2xl">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                {passportFile && <span className="flex items-center gap-1 text-emerald-600 font-semibold"><Check className="w-3 h-3" /> Passport ready</span>}
                {medicalReportFiles.length > 0 && <span className="flex items-center gap-1 text-emerald-600 font-semibold"><Check className="w-3 h-3" /> {medicalReportFiles.length} report(s)</span>}
                {!passportFile && medicalReportFiles.length === 0 && <span className="text-slate-400">* Treatment Required is mandatory</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setIsNewCaseModalOpen(false); setPassportFile(null); setMedicalReportFiles([]); }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCase}
                  disabled={!newCaseForm.treatmentRequired || isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving & Uploading...</>
                  ) : (
                    <><Plane className="w-3.5 h-3.5" /> Create Case</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Quotation Details Modal (View Only) */}
      {quotationDetailsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Treatment Quotation Details</h3>
              <button onClick={() => setQuotationDetailsModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Hospital:</span>
                <span className="font-bold text-slate-900 text-sm">{quotationDetailsModal.hospital_name}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block">Currency & Cost:</span>
                <span className="font-extrabold text-blue-600 text-sm">{quotationDetailsModal.currency} {Number(quotationDetailsModal.estimated_cost).toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block">Estimated Stay:</span>
                <span className="font-bold text-slate-800">{quotationDetailsModal.estimated_stay_days} Days</span>
              </div>

              <div>
                <span className="text-slate-400 font-bold block">Valid Until:</span>
                <span className="font-bold text-slate-800">
                  {quotationDetailsModal.valid_until ? new Date(quotationDetailsModal.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 font-bold block">Details:</span>
                <p className="text-slate-700 leading-relaxed mt-0.5">{quotationDetailsModal.details}</p>
              </div>

              {(quotationDetailsModal.attachment_url || quotationDetailsModal.attachment) && (
                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5 truncate">
                    <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">Attachment Document</span>
                  </span>
                  <a
                    href={quotationDetailsModal.attachment_url || (typeof quotationDetailsModal.attachment === 'string' ? quotationDetailsModal.attachment : '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> View / Download
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setQuotationDetailsModal(null)}
                className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Document Preview Modal */}
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
              {docPreviewModal.uploaded_by_name && (
                <div>
                  <span className="text-slate-400 font-bold block">Uploaded By:</span>
                  <span className="text-slate-700">{docPreviewModal.uploaded_by_name}</span>
                </div>
              )}

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
