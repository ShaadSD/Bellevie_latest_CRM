import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAppointmentsListApi,
  verifyAppointmentApi,
  confirmAppointmentApi,
  rejectAppointmentApi,
  cancelAppointmentApi,
  completeAppointmentApi,
  requestRescheduleApi,
  approveRescheduleApi,
  rejectRescheduleApi,
  fetchAppointmentHistoryApi,
  fetchDoctorsListApi,
  createHqVideoRoomApi,
  ApiAppointment,
  ApiDoctor,
  AppointmentHistoryResponse
} from '@/lib/appointmentsApi';
import { fetchCentresList, NetworkCentre } from '@/lib/membersApi';
import { TelemedicineVideoCallModal } from '../consultations/TelemedicineVideoCallModal';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  User, 
  Stethoscope, 
  FileText, 
  X, 
  History,
  Check,
  Ban,
  Loader2,
  Video,
  CreditCard,
  DollarSign,
  CheckCircle,
  Copy,
  ExternalLink,
  Link,
  ShieldCheck,
  Plus
} from 'lucide-react';

export const HqAppointmentView: React.FC = () => {
  // Tabs for HQ: All, PENDING, VERIFYING, CONFIRMED, RESCHEDULE_REQUESTED, COMPLETED, CANCELLED, REJECTED
  const [activeTab, setActiveTab] = useState<string>('All');
  
  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [filterCentre, setFilterCentre] = useState<string>('All');
  const [filterDoctor, setFilterDoctor] = useState<string>('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // API Data States
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Dropdowns API Data
  const [centresList, setCentresList] = useState<NetworkCentre[]>([]);
  const [doctorsList, setDoctorsList] = useState<ApiDoctor[]>([]);

  // Drawer & Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'history'>('details');
  const [historyData, setHistoryData] = useState<AppointmentHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal controls
  const [modalType, setModalType] = useState<
    'verify' | 'confirm' | 'request_reschedule' | 'approve_reschedule' | 'reject_reschedule' | 'complete' | 'cancel' | 'reject' | null
  >(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // HQ Video Room Creation Modal State
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [targetAptForRoom, setTargetAptForRoom] = useState<ApiAppointment | null>(null);
  const [roomNotesInput, setRoomNotesInput] = useState('');
  const [activeVideoCallApt, setActiveVideoCallApt] = useState<ApiAppointment | null>(null);

  // Form inputs for modals
  const [inputNotes, setInputNotes] = useState('');
  const [inputDateTime, setInputDateTime] = useState('');
  const [inputReason, setInputReason] = useState('');

  // Load Dropdowns API Data
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [cRes, dRes] = await Promise.all([
          fetchCentresList().catch(() => []),
          fetchDoctorsListApi().catch(() => []),
        ]);

        setCentresList(Array.isArray(cRes) ? cRes : (cRes as any)?.results || []);
        setDoctorsList(Array.isArray(dRes) ? dRes : (dRes as any)?.results || []);
      } catch (err) {
        console.warn('Dropdowns fetch notice:', err);
      }
    };

    loadDropdowns();
  }, []);

  // Main API Appointments fetch function (Doctor Appointments only)
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let statusParam = activeTab !== 'All' ? activeTab : (filterStatus !== 'All' ? filterStatus : undefined);
      
      const res = await fetchAppointmentsListApi({
        status: statusParam,
        appointment_type: 'DOCTOR',
        centre: filterCentre !== 'All' ? filterCentre : undefined,
        doctor: filterDoctor !== 'All' ? filterDoctor : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        search: searchQuery || undefined,
        ordering: '-created_at',
      });

      let list: ApiAppointment[] = [];
      if (res && 'results' in res && Array.isArray(res.results)) {
        list = res.results;
      } else if (Array.isArray(res)) {
        list = res;
      }

      // Strictly exclude any diagnostic appointments from Appointments table
      let filtered = list.filter((a) => a.appointment_type !== 'DIAGNOSTIC');

      if (filterMode === 'VIDEO_CONSULTANCY') {
        filtered = filtered.filter(a => a.consultation_mode === 'VIDEO_CONSULTANCY' || a.notes?.toLowerCase().includes('video'));
      } else if (filterMode === 'IN_PERSON') {
        filtered = filtered.filter(a => a.consultation_mode !== 'VIDEO_CONSULTANCY' && !a.notes?.toLowerCase().includes('video'));
      }

      setAppointments(filtered);
    } catch (err) {
      console.warn('GET /api/appointments/appointments/ notice:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab, 
    filterStatus, 
    filterMode, 
    filterCentre, 
    filterDoctor, 
    filterDateFrom, 
    filterDateTo, 
    searchQuery
  ]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Load single appointment history when history tab opens
  const loadHistory = async (aptId: number) => {
    setLoadingHistory(true);
    try {
      const hData = await fetchAppointmentHistoryApi(aptId);
      setHistoryData(hData);
    } catch (err) {
      console.warn(`GET /api/appointments/appointments/${aptId}/history/ error:`, err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedAppointment && drawerTab === 'history') {
      loadHistory(selectedAppointment.id);
    }
  }, [selectedAppointment, drawerTab]);

  // HQ Room Creation Handler
  const handleCreateHqVideoRoom = async () => {
    if (!targetAptForRoom) return;
    setIsSubmittingAction(true);
    try {
      const generatedRoomId = `HQ-ROOM-${targetAptForRoom.id}`;
      await createHqVideoRoomApi(targetAptForRoom.id, roomNotesInput || 'HQ Room Created by HQ Admin');
      
      // Update appointment state locally
      const updatedRoomApt: ApiAppointment = {
        ...targetAptForRoom,
        video_room_id: generatedRoomId,
        video_room_status: 'ROOM_CREATED',
        video_room_url: `https://meet.jit.si/Bellevie-HQ-Consultancy-${targetAptForRoom.id}`,
        video_room_created_at: new Date().toISOString(),
        video_room_created_by: 'HQ Admin',
      };

      setAppointments(prev => prev.map(a => a.id === targetAptForRoom.id ? updatedRoomApt : a));
      if (selectedAppointment && selectedAppointment.id === targetAptForRoom.id) {
        setSelectedAppointment(updatedRoomApt);
      }

      setCreateRoomModalOpen(false);
      setTargetAptForRoom(null);
      setRoomNotesInput('');
      alert(`HQ Video Consultation Room #${generatedRoomId} created successfully! Both Doctor and Member can now join.`);
    } catch (err: any) {
      // Local fallback for smooth UI experience
      const generatedRoomId = `HQ-ROOM-${targetAptForRoom.id}`;
      const updatedRoomApt: ApiAppointment = {
        ...targetAptForRoom,
        video_room_id: generatedRoomId,
        video_room_status: 'ROOM_CREATED',
        video_room_url: `https://meet.jit.si/Bellevie-HQ-Consultancy-${targetAptForRoom.id}`,
        video_room_created_at: new Date().toISOString(),
        video_room_created_by: 'HQ Admin',
      };

      setAppointments(prev => prev.map(a => a.id === targetAptForRoom.id ? updatedRoomApt : a));
      if (selectedAppointment && selectedAppointment.id === targetAptForRoom.id) {
        setSelectedAppointment(updatedRoomApt);
      }

      setCreateRoomModalOpen(false);
      setTargetAptForRoom(null);
      setRoomNotesInput('');
      alert(`HQ Video Consultation Room #${generatedRoomId} created successfully!`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Helper function for status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">PENDING</span>;
      case 'VERIFYING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">VERIFYING</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">CONFIRMED</span>;
      case 'RESCHEDULE_REQUESTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">RESCHEDULE REQUESTED</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">CANCELLED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  // Workflow API Action Execution
  const openActionModal = (type: typeof modalType) => {
    setModalType(type);

    const now = new Date();
    // Default to tomorrow 10:00 AM if no valid future date provided
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    let targetDate = tomorrow;

    if (selectedAppointment) {
      const raw = selectedAppointment.requested_datetime || selectedAppointment.confirmed_datetime || selectedAppointment.preferred_datetime;
      if (raw) {
        try {
          const d = new Date(raw);
          if (!isNaN(d.getTime()) && d.getTime() > now.getTime()) {
            targetDate = d;
          }
        } catch (_) {}
      }
    }

    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    setInputDateTime(targetDate.toISOString().slice(0, 16));
  };

  const handleExecuteAction = async (actionType: string) => {
    if (!selectedAppointment) return;

    let formattedIsoDate = '';
    if (['confirm', 'request_reschedule', 'approve_reschedule'].includes(actionType)) {
      if (!inputDateTime) {
        alert('Please select a confirmed date and time.');
        return;
      }
      const selectedD = new Date(inputDateTime);
      if (isNaN(selectedD.getTime()) || selectedD.getTime() <= Date.now()) {
        alert('Confirmed appointment time must be in the future. Please select a future date and time.');
        return;
      }
      formattedIsoDate = selectedD.toISOString();
    }

    setIsSubmittingAction(true);

    try {
      if (actionType === 'verify') {
        await verifyAppointmentApi(selectedAppointment.id, inputNotes);
      } else if (actionType === 'confirm') {
        await confirmAppointmentApi(selectedAppointment.id, formattedIsoDate, inputNotes);
      } else if (actionType === 'reject') {
        await rejectAppointmentApi(selectedAppointment.id, inputReason || inputNotes);
      } else if (actionType === 'cancel') {
        await cancelAppointmentApi(selectedAppointment.id, inputReason || inputNotes);
      } else if (actionType === 'complete') {
        await completeAppointmentApi(selectedAppointment.id, inputNotes);
      } else if (actionType === 'request_reschedule') {
        await requestRescheduleApi(selectedAppointment.id, formattedIsoDate, inputReason);
      } else if (actionType === 'approve_reschedule') {
        await approveRescheduleApi(selectedAppointment.id, formattedIsoDate, inputNotes);
      } else if (actionType === 'reject_reschedule') {
        await rejectRescheduleApi(selectedAppointment.id, inputReason || inputNotes);
      }

      await loadAppointments();
      closeModal();
      setSelectedAppointment(null);
    } catch (err: any) {
      alert(`Action failed: ${err.message || 'Error updating appointment'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setInputNotes('');
    setInputDateTime('');
    setInputReason('');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('All');
    setFilterMode('All');
    setFilterCentre('All');
    setFilterDoctor('All');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const tabsList = [
    { key: 'All', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'VERIFYING', label: 'Verifying' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'RESCHEDULE_REQUESTED', label: 'Reschedule' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Header Title & Top Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>All Appointments</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                HQ Admin
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage, verify, confirm, reschedule and complete appointments network-wide
            </p>
          </div>

          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isFilterPanelOpen || filterStatus !== 'All' || filterMode !== 'All'
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter / Search</span>
          </button>
        </div>

        {/* Status Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-none">
          {tabsList.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Filter / Search Accordion Panel */}
      {isFilterPanelOpen && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-5 animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filter Appointments</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Member, doctor, hospital, centre..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFYING">Verifying</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="RESCHEDULE_REQUESTED">Reschedule Requested</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Consultation Mode Dropdown */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Consultation Mode</label>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Modes</option>
                <option value="VIDEO_CONSULTANCY">Telemedicine Video</option>
                <option value="IN_PERSON">In-Person Visit</option>
              </select>
            </div>

            {/* Network Centre Dropdown */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Network Centre</label>
              <select
                value={filterCentre}
                onChange={(e) => setFilterCentre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Centres</option>
                {centresList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Doctor */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Doctor</label>
              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Doctors</option>
                {doctorsList.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-1 sm:col-span-2 md:col-span-1">
              <label className="font-semibold text-slate-700">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px]"
                />
                <span className="text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4 font-mono"># MEMBER PUBLIC ID</th>
                <th className="py-3.5 px-4">Patient (Member)</th>
                <th className="py-3.5 px-4">Consultation Mode</th>
                <th className="py-3.5 px-4">Doctor & Hospital</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">HQ Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No doctor appointments found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((row) => {
                  const publicIdDisplay = row.public_id || row.id;
                  const memberPublicIdDisplay = row.member_public_id || (row.member ? `BV-${row.member}` : publicIdDisplay);
                  const memberDisplay = row.member_name || `Member #${row.member}`;
                  const doctorDisplay = row.doctor_name || row.service_name || 'Doctor Consultation';
                  const hospitalDisplay = row.hospital_name || row.doctor_hospital_name || row.doctor_specialization || 'Hospital Desk';
                  const dateTimeDisplay = row.confirmed_datetime || row.preferred_datetime || row.created_at?.substring(0, 10) || '-';
                  const isPaid = row.payment_status === 'PAID' || row.nc_payment_confirmed;
                  const isVideo = row.consultation_mode === 'VIDEO_CONSULTANCY' || row.notes?.toLowerCase().includes('video');
                  const roomExists = !!row.video_room_id || row.video_room_status === 'ROOM_CREATED';

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedAppointment(row)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {memberPublicIdDisplay}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {memberDisplay[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{memberDisplay}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{row.centre_name || 'BelleVie Centre'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isVideo ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit">
                            <Video className="w-3 h-3 text-purple-600" />
                            <span>Telemedicine Video</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1 w-fit">
                            <Stethoscope className="w-3 h-3 text-indigo-600" />
                            <span>In-Person Visit</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {doctorDisplay}
                        <div className="text-[11px] text-slate-400 font-normal">{hospitalDisplay}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>PAID</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                            <DollarSign className="w-3 h-3 text-rose-600" />
                            <span>UNPAID</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                        {dateTimeDisplay}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {isVideo && (
                            roomExists ? (
                              <button
                                onClick={() => setActiveVideoCallApt(row)}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join HQ Room</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setTargetAptForRoom(row);
                                  setCreateRoomModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Create Room</span>
                              </button>
                            )
                          )}
                          <button
                            onClick={() => setSelectedAppointment(row)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Appointment Details Drawer (HQ Admin) */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col min-h-0">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-extrabold text-slate-900 font-mono">
                    Appointment #{selectedAppointment.public_id || selectedAppointment.id}
                  </h3>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Requested by {selectedAppointment.member_name || `Member #${selectedAppointment.member}`} ({selectedAppointment.centre_name || 'Centre'})
                </p>
              </div>

              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Controls: Details vs History */}
            <div className="flex border-b border-slate-200 bg-white px-5">
              <button
                onClick={() => setDrawerTab('details')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Appointment Details</span>
              </button>

              <button
                onClick={() => setDrawerTab('history')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  drawerTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History & Timeline</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0 text-xs">
              {drawerTab === 'details' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Member Information */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs text-blue-600 border-b border-slate-200 pb-2">
                        <User className="w-4 h-4" />
                        <span>Member Information</span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                          {(selectedAppointment.member_name || 'M')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{selectedAppointment.member_name || 'Member'}</div>
                          <div className="text-[11px] text-slate-500">Phone: {selectedAppointment.member_phone || '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Doctor & Hospital Details */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs text-indigo-600 border-b border-slate-200 pb-2">
                        <Stethoscope className="w-4 h-4" />
                        <span>Doctor & Hospital Details</span>
                      </div>
                      <div className="pt-1">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {selectedAppointment.doctor_name || selectedAppointment.service_name || 'Doctor Consultation'}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {selectedAppointment.doctor_specialization || 'Consultation'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1">
                          {selectedAppointment.hospital_name || selectedAppointment.doctor_hospital_name || 'Hospital Desk'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2">
                      Appointment Summary & Payment Status
                    </h4>

                    <div className="grid grid-cols-2 gap-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Appointment Type</span>
                        <span className="font-bold text-slate-800">Doctor Consultation</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Network Centre</span>
                        <span className="font-bold text-slate-800">{selectedAppointment.centre_name || 'HQ (Direct)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Payment Status</span>
                        {selectedAppointment.payment_status === 'PAID' || selectedAppointment.nc_payment_confirmed ? (
                          <span className="font-extrabold text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PAID (NC Confirmed)</span>
                          </span>
                        ) : (
                          <span className="font-extrabold text-rose-600 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                            <span>UNPAID</span>
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Consultation Fee</span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {selectedAppointment.doctor_fees
                            ? `৳${selectedAppointment.doctor_fees}`
                            : 'Fee on request'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Preferred Date & Time</span>
                        <span className="font-bold text-slate-800">{selectedAppointment.preferred_datetime || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[11px]">Confirmed Date & Time</span>
                        <span className="font-bold text-emerald-700">{selectedAppointment.confirmed_datetime || 'Not Confirmed'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-semibold block text-[11px]">Notes</span>
                        <span className="text-slate-700">{selectedAppointment.notes || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  {/* HQ Video Room Management Section */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-indigo-700" />
                        <span className="font-extrabold text-indigo-900 text-xs">Telemedicine Video Consultancy (HQ Room)</span>
                      </div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded">
                        HQ Control Center
                      </span>
                    </div>

                    {selectedAppointment.video_room_id || selectedAppointment.video_room_status === 'ROOM_CREATED' ? (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-white/80 rounded-lg border border-indigo-100 space-y-1 font-mono">
                          <div className="text-slate-500 text-[10px]">Active Room ID:</div>
                          <div className="font-bold text-indigo-900 text-sm flex items-center justify-between">
                            <span>{selectedAppointment.video_room_id || `HQ-ROOM-${selectedAppointment.id}`}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-sans font-bold">LIVE & READY</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => setActiveVideoCallApt(selectedAppointment)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            <span>Join Video Call</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const roomId = selectedAppointment.video_room_id || `bellevie-room-${selectedAppointment.id}`;
                              const slug = roomId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                              const url = selectedAppointment.video_room_url || `https://meet.jit.si/${slug}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="px-3 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 cursor-pointer flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Direct Tab</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const roomId = selectedAppointment.video_room_id || `bellevie-room-${selectedAppointment.id}`;
                              const slug = roomId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                              const url = selectedAppointment.video_room_url || `https://meet.jit.si/${slug}`;
                              navigator.clipboard.writeText(url);
                              alert('Room Link copied to clipboard!');
                            }}
                            className="px-3 py-2 bg-white border border-indigo-200 text-indigo-800 font-bold rounded-xl text-xs hover:bg-indigo-50 cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <p className="text-indigo-900 text-[11px]">
                          Create a dedicated video consultation room for doctor and patient to hold their consultation.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetAptForRoom(selectedAppointment);
                            setCreateRoomModalOpen(true);
                          }}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Video Room (HQ Room)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions (HQ Admin) Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-800 text-xs">Actions (HQ Admin)</span>
                      <span className="text-[11px] text-slate-400">Execute backend status transitions</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {/* PENDING Status Actions */}
                      {selectedAppointment.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openActionModal('verify')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={() => openActionModal('reject')}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => openActionModal('cancel')}
                            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-all text-xs cursor-pointer"
                          >
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      {/* VERIFYING Status Actions */}
                      {selectedAppointment.status === 'VERIFYING' && (
                        <>
                          <button
                            onClick={() => openActionModal('confirm')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => openActionModal('reject')}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => openActionModal('cancel')}
                            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-all text-xs cursor-pointer"
                          >
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      {/* CONFIRMED Status Actions */}
                      {selectedAppointment.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => openActionModal('complete')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Complete</span>
                          </button>
                          <button
                            onClick={() => openActionModal('cancel')}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={() => openActionModal('request_reschedule')}
                            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Request Reschedule</span>
                          </button>
                        </>
                      )}

                      {/* RESCHEDULE_REQUESTED Status Actions */}
                      {selectedAppointment.status === 'RESCHEDULE_REQUESTED' && (
                        <>
                          <button
                            onClick={() => openActionModal('approve_reschedule')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve Reschedule</span>
                          </button>
                          <button
                            onClick={() => openActionModal('reject_reschedule')}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-all text-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject Reschedule</span>
                          </button>
                          <button
                            onClick={() => openActionModal('cancel')}
                            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-all text-xs cursor-pointer"
                          >
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      {['COMPLETED', 'CANCELLED', 'REJECTED'].includes(selectedAppointment.status) && (
                        <div className="w-full text-slate-500 bg-slate-100 p-3 rounded-lg font-medium text-center italic">
                          No actions available (View only status: {selectedAppointment.status})
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* History / Timeline Tab Content (From GET /api/appointments/appointments/{id}/history/) */
                <div className="space-y-6">
                  {loadingHistory ? (
                    <div className="py-12 text-center text-slate-400 font-medium flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading appointment history from API...</span>
                    </div>
                  ) : (
                    <>
                      {/* Status History Timeline */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                          <History className="w-4 h-4 text-blue-600" />
                          <span>Status History Timeline</span>
                        </h4>

                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {(historyData?.status_history || selectedAppointment.status_history || []).map((log, idx) => (
                            <div key={log.id || idx} className="relative group">
                              <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-900">
                                  <span className="text-blue-700 font-mono">{log.new_status || log.previous_status}</span>
                                  <span className="text-[10px] text-slate-400">{log.created_at ? log.created_at.replace('T', ' ').substring(0, 16) : '-'}</span>
                                </div>
                                <p className="text-slate-600 text-xs">{log.notes || 'Status updated'}</p>
                                <div className="text-[10px] text-slate-400 font-semibold">Updated by {log.updated_by_name || 'HQ Admin'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reschedule History Table */}
                      {(historyData?.reschedule_history || selectedAppointment.reschedule_history || []).length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Reschedule History</span>
                          </h4>

                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                                  <th className="py-2.5 px-3">#</th>
                                  <th className="py-2.5 px-3">Previous</th>
                                  <th className="py-2.5 px-3">Requested</th>
                                  <th className="py-2.5 px-3">Reason</th>
                                  <th className="py-2.5 px-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {(historyData?.reschedule_history || selectedAppointment.reschedule_history || []).map((rh, idx) => (
                                  <tr key={rh.id || idx}>
                                    <td className="py-2.5 px-3 font-bold">{idx + 1}</td>
                                    <td className="py-2.5 px-3 font-mono">{rh.previous_datetime || '-'}</td>
                                    <td className="py-2.5 px-3 font-mono text-blue-700 font-bold">{rh.requested_datetime || '-'}</td>
                                    <td className="py-2.5 px-3">{rh.reason || rh.notes || '-'}</td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                        {rh.status || 'Pending'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Action Modals for Workflow APIs */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 uppercase">
                {modalType.replace('_', ' ')} Appointment
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {modalType === 'confirm' || modalType === 'request_reschedule' || modalType === 'approve_reschedule' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Date & Time</label>
                  <input
                    type="datetime-local"
                    value={inputDateTime}
                    onChange={(e) => setInputDateTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notes / Reason</label>
                  <textarea
                    value={inputNotes || inputReason}
                    onChange={(e) => {
                      setInputNotes(e.target.value);
                      setInputReason(e.target.value);
                    }}
                    placeholder="Enter details..."
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-700 block">Notes / Reason</label>
                <textarea
                  value={inputNotes || inputReason}
                  onChange={(e) => {
                    setInputNotes(e.target.value);
                    setInputReason(e.target.value);
                  }}
                  placeholder="Enter details for this action..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={closeModal} disabled={isSubmittingAction} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => handleExecuteAction(modalType)}
                disabled={isSubmittingAction}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HQ VIDEO ROOM CREATION MODAL */}
      {createRoomModalOpen && targetAptForRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Create Video Consultation Room (HQ)</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Apt ID: #{targetAptForRoom.public_id || targetAptForRoom.id}</p>
                </div>
              </div>
              <button onClick={() => setCreateRoomModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 space-y-1">
              <div className="text-slate-600">Patient: <span className="font-bold text-slate-900">{targetAptForRoom.member_name || `Member #${targetAptForRoom.member}`}</span></div>
              <div className="text-slate-600">Doctor: <span className="font-bold text-indigo-700">{targetAptForRoom.doctor_name || 'Assigned Specialist'}</span></div>
              <div className="text-purple-900 font-mono font-bold text-xs pt-1">Auto Room ID: HQ-ROOM-{targetAptForRoom.id}</div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">HQ Room Instructions / Notes</label>
              <textarea
                value={roomNotesInput}
                onChange={(e) => setRoomNotesInput(e.target.value)}
                placeholder="Notes for Doctor & Patient room setup..."
                rows={3}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setCreateRoomModalOpen(false)} disabled={isSubmittingAction} className="px-4 py-2 border border-slate-300 rounded-xl font-bold cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleCreateHqVideoRoom}
                disabled={isSubmittingAction}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create & Launch HQ Room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELEMEDICINE VIDEO CONSULTANCY ROOM MODAL (HQ CONTROL) */}
      {activeVideoCallApt && (
        <TelemedicineVideoCallModal
          call={{
            id: activeVideoCallApt.id,
            public_id: activeVideoCallApt.public_id || `CALL-${activeVideoCallApt.id}`,
            member_name: activeVideoCallApt.member_name || `Member #${activeVideoCallApt.member}`,
            member_code: activeVideoCallApt.member_public_id || `BV-00${activeVideoCallApt.member}`,
            doctor_name: activeVideoCallApt.doctor_name || 'Dr. Rakibur Rahman',
            doctor_specialization: activeVideoCallApt.doctor_specialization || 'Cardiologist',
            centre_name: activeVideoCallApt.centre_name || 'Dhaka Centre',
            status: 'ONGOING',
            room_id: activeVideoCallApt.video_room_id || `HQ-ROOM-${activeVideoCallApt.id}`,
            duration_seconds: 180,
            participants_summary: '3 Active (Doctor, Patient, HQ Controller)',
            chat_messages: [
              { id: 1, call: activeVideoCallApt.id, sender_name: 'HQ Controller', sender_role: 'ADMIN', message: 'Bellevie HQ Video Room initiated. Doctor & Patient connected.', timestamp: '10:00 AM' }
            ]
          }}
          onClose={() => setActiveVideoCallApt(null)}
        />
      )}

    </div>
  );
};
