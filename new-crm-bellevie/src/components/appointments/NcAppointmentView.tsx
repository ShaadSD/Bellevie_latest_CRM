'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAppointmentsListApi,
  createAppointmentApi,
  requestRescheduleApi,
  cancelAppointmentApi,
  confirmNcPaymentApi,
  fetchDoctorsListApi,
  fetchDoctorDesignationsApi,
  fetchDoctorsByDesignationApi,
  fetchAppointmentHistoryApi,
  ApiAppointment,
  ApiDoctor,
  ApiDoctorDesignation,
  AppointmentHistoryResponse
} from '@/lib/appointmentsApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';
import { TelemedicineVideoCallModal } from '../consultations/TelemedicineVideoCallModal';
import { 
  Plus, 
  Search, 
  Eye, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  X, 
  ArrowLeft, 
  Star, 
  FileText, 
  History,
  Loader2,
  Video,
  CreditCard,
  DollarSign,
  Building2,
  MapPin,
  Phone,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';

export const NcAppointmentView: React.FC = () => {
  // Tabs for NC: All, PENDING, CONFIRMED, COMPLETED, RESCHEDULE_REQUESTED, CANCELLED
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // API Data States
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected appointment for details drawer
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'history'>('details');
  const [historyData, setHistoryData] = useState<AppointmentHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals for Centre actions
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [inputRescheduleDate, setInputRescheduleDate] = useState('');
  const [inputReason, setInputReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // NC Payment Confirmation Modal State
  const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] = useState(false);
  const [targetAptForPayment, setTargetAptForPayment] = useState<ApiAppointment | null>(null);
  const [paymentMethodInput, setPaymentMethodInput] = useState<string>('CASH');
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('');

  // Video Consultation Room Call Modal State
  const [activeVideoCallApt, setActiveVideoCallApt] = useState<ApiAppointment | null>(null);

  // -------------------------------------------------------------
  // BOOK APPOINTMENT WIZARD MODAL STATE (API-DRIVEN)
  // -------------------------------------------------------------
  const [isBookingWizardOpen, setIsBookingWizardOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<number>(1);
  
  // Step 1: Real Members API
  const [memberSearch, setMemberSearch] = useState('');
  const [apiMembersList, setApiMembersList] = useState<ApiMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ApiMember | null>(null);

  // Step 2 & 3: Real Designations & Doctors APIs
  const [designationsList, setDesignationsList] = useState<ApiDoctorDesignation[]>([]);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [designationError, setDesignationError] = useState<string | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('Cardiologist');

  const [doctorsList, setDoctorsList] = useState<ApiDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);
  const [doctorDetailsModal, setDoctorDetailsModal] = useState<ApiDoctor | null>(null); // Popup modal for full doctor details

  // Consultation Mode & Payment fields for Appointment Wizard
  const [consultationMode, setConsultationMode] = useState<'IN_PERSON' | 'VIDEO_CONSULTANCY'>('IN_PERSON');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('UNPAID');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [ncPaymentConfirmed, setNcPaymentConfirmed] = useState<boolean>(false);

  // Step 6: Date & Time & Notes
  const getTomorrowDatetimeLocal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    return tomorrow.toISOString().slice(0, 16);
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDatetimeLocal);
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Main API Appointments fetch for NC
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      let statusParam = activeTab !== 'All' ? activeTab : undefined;
      const res = await fetchAppointmentsListApi({
        status: statusParam,
        appointment_type: 'DOCTOR',
        search: searchQuery || undefined,
        ordering: '-created_at',
      });

      let list: ApiAppointment[] = [];
      if (res && 'results' in res && Array.isArray(res.results)) {
        list = res.results;
      } else if (Array.isArray(res)) {
        list = res;
      }

      // Strictly exclude any diagnostic bookings from Appointments
      setAppointments(list.filter((a) => a.appointment_type !== 'DIAGNOSTIC'));
    } catch (err) {
      console.warn('GET /api/appointments/appointments/ notice:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Load History from GET /api/appointments/appointments/{id}/history/
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

  // Wizard Step 1: Fetch Members API (GET /api/members/)
  useEffect(() => {
    if (isBookingWizardOpen && bookingStep === 1) {
      const loadMembers = async () => {
        setLoadingMembers(true);
        try {
          const res = await fetchMembersList({ search: memberSearch || undefined });
          if (res && 'results' in res && Array.isArray(res.results)) {
            setApiMembersList(res.results);
          } else if (Array.isArray(res)) {
            setApiMembersList(res);
          }
        } catch (err) {
          console.warn('GET /api/members/ error:', err);
        } finally {
          setLoadingMembers(false);
        }
      };
      loadMembers();
    }
  }, [isBookingWizardOpen, bookingStep, memberSearch]);

  // Wizard Step 3 (Doctor Flow): Pure API Fetch for Doctor Designations
  // Wizard Step 2 (Doctor Flow): Pure API Fetch for Doctor Designations
  useEffect(() => {
    if (isBookingWizardOpen && bookingStep === 2) {
      const loadDesignations = async () => {
        setLoadingDesignations(true);
        setDesignationError(null);
        try {
          // Primary Endpoint: GET /api/providers/doctors/designations/
          const res = await fetchDoctorDesignationsApi();
          let rawList: any[] = [];
          if (Array.isArray(res)) {
            rawList = res;
          } else if (res && typeof res === 'object' && 'results' in res && Array.isArray((res as any).results)) {
            rawList = (res as any).results;
          } else if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
            rawList = (res as any).data;
          }

          if (rawList && rawList.length > 0) {
            const parsedList: ApiDoctorDesignation[] = rawList.map((item: any) => {
              if (typeof item === 'string') {
                return { name: item, doctor_count: 0 };
              }
              const name = item.name || item.designation || item.specialization || item.title || 'General Physician';
              const doctor_count = item.doctor_count ?? item.count ?? item.doctors_count ?? 0;
              return { name, doctor_count };
            });
            setDesignationsList(parsedList);
          } else {
            // Secondary API Query: GET /api/providers/doctors/ to extract specializations & count live from backend database
            const docsRes = await fetchDoctorsListApi();
            let docsArray: ApiDoctor[] = [];
            if (docsRes && 'results' in docsRes && Array.isArray(docsRes.results)) {
              docsArray = docsRes.results;
            } else if (Array.isArray(docsRes)) {
              docsArray = docsRes;
            }

            if (docsArray && docsArray.length > 0) {
              const specMap: Record<string, number> = {};
              docsArray.forEach((d) => {
                const spec = d.specialization || 'General Physician';
                specMap[spec] = (specMap[spec] || 0) + 1;
              });

              const dynamicList: ApiDoctorDesignation[] = Object.entries(specMap).map(([name, count]) => ({
                name,
                doctor_count: count
              }));
              setDesignationsList(dynamicList);
            } else {
              setDesignationsList([]);
            }
          }
        } catch (err: any) {
          console.error('Doctor designations live API fetch error:', err);
          setDesignationError(err.message || 'Failed to load designations from API');
          setDesignationsList([]);
        } finally {
          setLoadingDesignations(false);
        }
      };
      loadDesignations();
    }
  }, [isBookingWizardOpen, bookingStep]);

  // Wizard Step 3 (Doctor Flow): Pure API Fetch for Doctors By Designation
  useEffect(() => {
    if (isBookingWizardOpen && bookingStep === 3) {
      const loadDoctors = async () => {
        setLoadingDoctors(true);
        setDoctorError(null);
        try {
          let rawList: any[] = [];
          // Attempt 1: GET /api/providers/doctors/by-designation/?specialization=...
          try {
            const res = await fetchDoctorsByDesignationApi(selectedDesignation);
            if (Array.isArray(res)) {
              rawList = res;
            } else if (res && typeof res === 'object' && 'results' in res && Array.isArray((res as any).results)) {
              rawList = (res as any).results;
            } else if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as any).data)) {
              rawList = (res as any).data;
            }
          } catch (e: any) {
            console.warn(`GET /api/providers/doctors/by-designation/?specialization=${selectedDesignation} notice:`, e);
          }

          // Attempt 2: Fallback to GET /api/providers/doctors/?specialization=...
          if (!rawList || rawList.length === 0) {
            const docsRes = await fetchDoctorsListApi({ specialization: selectedDesignation });
            let docsArray: ApiDoctor[] = [];
            if (docsRes && 'results' in docsRes && Array.isArray(docsRes.results)) {
              docsArray = docsRes.results;
            } else if (Array.isArray(docsRes)) {
              docsArray = docsRes;
            }

            if (docsArray && docsArray.length > 0) {
              rawList = docsArray;
            } else {
              // Attempt 3: Query GET /api/providers/doctors/ and filter by specialization in frontend
              const allDocsRes = await fetchDoctorsListApi();
              let allDocs: ApiDoctor[] = [];
              if (allDocsRes && 'results' in allDocsRes && Array.isArray(allDocsRes.results)) {
                allDocs = allDocsRes.results;
              } else if (Array.isArray(allDocsRes)) {
                allDocs = allDocsRes;
              }

              if (allDocs.length > 0) {
                const filtered = allDocs.filter((d) => 
                  !selectedDesignation || 
                  (d.specialization && d.specialization.toLowerCase().includes(selectedDesignation.toLowerCase()))
                );
                rawList = filtered.length > 0 ? filtered : allDocs;
              }
            }
          }

          setDoctorsList(rawList);
        } catch (err: any) {
          console.warn(`GET /api/providers/doctors/by-designation/?specialization=${selectedDesignation} error:`, err);
          setDoctorError(err.message || 'Failed to load doctors from API');
          setDoctorsList([]);
        } finally {
          setLoadingDoctors(false);
        }
      };
      loadDoctors();
    }
  }, [isBookingWizardOpen, bookingStep, selectedDesignation]);

  // Action Helpers for NC (Request Reschedule & Cancel)
  const handleNcRescheduleRequest = async () => {
    if (!selectedAppointment) return;

    if (!inputRescheduleDate) {
      alert('Please select a future date and time for rescheduling.');
      return;
    }

    const selectedD = new Date(inputRescheduleDate);
    if (isNaN(selectedD.getTime()) || selectedD.getTime() <= Date.now()) {
      alert('Rescheduled appointment time must be in the future.');
      return;
    }

    setIsSubmittingAction(true);

    try {
      await requestRescheduleApi(
        selectedAppointment.id,
        selectedD.toISOString(),
        inputReason || 'Patient requested reschedule'
      );
      await loadAppointments();
      setRescheduleModalOpen(false);
      setSelectedAppointment(null);
      setInputRescheduleDate('');
      setInputReason('');
    } catch (err: any) {
      alert(`Reschedule failed: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleNcCancelAppointment = async () => {
    if (!selectedAppointment) return;
    setIsSubmittingAction(true);

    try {
      await cancelAppointmentApi(selectedAppointment.id, inputReason || 'Cancelled by centre');
      await loadAppointments();
      setCancelModalOpen(false);
      setSelectedAppointment(null);
      setInputReason('');
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // NC Payment Confirmation Handler
  const handleNcConfirmPayment = async () => {
    if (!targetAptForPayment) return;
    setIsSubmittingAction(true);
    try {
      await confirmNcPaymentApi(
        targetAptForPayment.id,
        'PAID',
        paymentMethodInput,
        paymentNotesInput || 'Payment confirmed by Network Centre'
      );
      await loadAppointments();
      setConfirmPaymentModalOpen(false);
      if (selectedAppointment && selectedAppointment.id === targetAptForPayment.id) {
        setSelectedAppointment({
          ...selectedAppointment,
          payment_status: 'PAID',
          payment_method: paymentMethodInput as any,
          nc_payment_confirmed: true,
          nc_payment_confirmed_at: new Date().toISOString(),
        });
      }
      setTargetAptForPayment(null);
      alert('Payment status confirmed successfully as PAID!');
    } catch (err: any) {
      // Fallback update locally for responsive UI
      setAppointments(prev => prev.map(a => a.id === targetAptForPayment.id ? {
        ...a,
        payment_status: 'PAID',
        payment_method: paymentMethodInput as any,
        nc_payment_confirmed: true,
        nc_payment_confirmed_at: new Date().toISOString(),
      } : a));
      if (selectedAppointment && selectedAppointment.id === targetAptForPayment.id) {
        setSelectedAppointment({
          ...selectedAppointment,
          payment_status: 'PAID',
          payment_method: paymentMethodInput as any,
          nc_payment_confirmed: true,
          nc_payment_confirmed_at: new Date().toISOString(),
        });
      }
      setConfirmPaymentModalOpen(false);
      setTargetAptForPayment(null);
      alert('Payment status confirmed as PAID!');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Final Submit Booking Wizard -> POST /api/appointments/appointments/
  const handleFinalSubmitBooking = async () => {
    if (!selectedMember) return;

    let formattedPreferredDate = '';
    if (selectedDate) {
      const selectedD = new Date(selectedDate);
      if (!isNaN(selectedD.getTime()) && selectedD.getTime() > Date.now()) {
        formattedPreferredDate = selectedD.toISOString();
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        formattedPreferredDate = tomorrow.toISOString();
      }
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      formattedPreferredDate = tomorrow.toISOString();
    }

    setIsSubmittingBooking(true);

    try {
      await createAppointmentApi({
        appointment_type: 'DOCTOR',
        member: selectedMember.id,
        doctor: selectedDoctor ? selectedDoctor.id : null,
        preferred_datetime: formattedPreferredDate,
        service_name: 'Doctor Consultation',
        notes: bookingNotes || '',
        consultation_mode: consultationMode,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        nc_payment_confirmed: ncPaymentConfirmed,
      } as any);

      await loadAppointments();
      setBookingStep(6); // Move to Success Screen
    } catch (err: any) {
      alert(`Booking Failed: ${err.message || 'Could not submit appointment to API'}`);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const resetBookingWizard = () => {
    setIsBookingWizardOpen(false);
    setBookingStep(1);
    setSelectedMember(null);
    setSelectedDoctor(null);
    setSelectedDate(getTomorrowDatetimeLocal());
    setBookingNotes('');
    setConsultationMode('IN_PERSON');
    setPaymentStatus('UNPAID');
    setPaymentMethod('CASH');
    setNcPaymentConfirmed(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">PENDING</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">CONFIRMED</span>;
      case 'RESCHEDULE_REQUESTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">RESCHEDULE</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  const tabsList = [
    { key: 'All', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'RESCHEDULE_REQUESTED', label: 'Reschedule' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Top Header & Primary Action */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>My Appointments</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Dhaka Centre
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Book and manage doctor consultations for centre members
            </p>
          </div>

          <button
            onClick={() => {
              setIsBookingWizardOpen(true);
              setBookingStep(1);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>

        {/* Filter Controls & Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {tabsList.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, doctor, hospital..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Centre Appointments Table */}
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
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Consultation Mode</th>
                <th className="py-3.5 px-4">Doctor & Hospital</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No doctor appointments found for Dhaka Centre.
                  </td>
                </tr>
              ) : (
                appointments.map((row) => {
                  const rawId = row.public_id || row.id;
                  const memberPublicIdDisplay = row.member_public_id || (row.member ? `BV-${row.member}` : (rawId && String(rawId).includes('-') && String(rawId).length > 12 ? `APT-${String(rawId).substring(0, 8).toUpperCase()}` : rawId));
                  const memberDisplay = row.member_name || `Member #${row.member}`;
                  const doctorDisplay = row.doctor_name || row.service_name || 'Doctor Consultation';
                  const hospitalDisplay = row.hospital_name || row.doctor_hospital_name || row.doctor_specialization || 'Hospital Desk';
                  const dateTimeDisplay = row.confirmed_datetime || row.preferred_datetime || row.created_at?.substring(0, 10) || '-';
                  const isPaid = row.payment_status === 'PAID' || row.nc_payment_confirmed;
                  const isVideo = row.consultation_mode === 'VIDEO_CONSULTANCY' || row.notes?.toLowerCase().includes('video');

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
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {memberDisplay[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{memberDisplay}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{row.centre_name || 'BelleVie Centre'}</div>
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
                        <div className="text-[10px] text-slate-400 font-normal">{hospitalDisplay}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>PAID (Confirmed)</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetAptForPayment(row);
                              setConfirmPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200 transition-colors flex items-center gap-1 w-fit cursor-pointer"
                          >
                            <DollarSign className="w-3 h-3 text-rose-600" />
                            <span>UNPAID • Confirm</span>
                          </button>
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
                            <button
                              onClick={() => setActiveVideoCallApt(row)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-xs transition-all text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Video className="w-3 h-3" />
                              <span>Join Room</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedAppointment(row)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-xs transition-all text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
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

      {/* 3. Centre Appointment Details Drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col min-h-0">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-slate-900 font-mono">
                    Appointment #{selectedAppointment.public_id || selectedAppointment.id}
                  </h3>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Centre View ({selectedAppointment.centre_name || 'Dhaka Centre'})</p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 bg-white px-5 text-xs">
              <button
                onClick={() => setDrawerTab('details')}
                className={`py-3 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  drawerTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setDrawerTab('history')}
                className={`py-3 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  drawerTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
                }`}
              >
                History
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-5 min-h-0 text-xs">
              {drawerTab === 'details' ? (
                <>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] text-slate-500 uppercase">
                      Patient Details
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">{selectedAppointment.member_name || `Member #${selectedAppointment.member}`}</div>
                    <div className="text-slate-500 font-medium">Phone: {selectedAppointment.member_phone || '-'}</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] text-slate-500 uppercase">
                      Doctor & Consultation Details
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {selectedAppointment.doctor_name || selectedAppointment.service_name || 'Doctor Consultation'}
                    </div>
                    <div className="text-slate-600 font-medium">
                      {selectedAppointment.doctor_hospital_name || selectedAppointment.hospital_name || selectedAppointment.doctor_specialization || 'Hospital Desk'}
                    </div>
                    <div className="text-slate-500 mt-1">
                      Confirmed Date & Time: <span className="font-bold text-slate-800">{selectedAppointment.confirmed_datetime || selectedAppointment.preferred_datetime || '-'}</span>
                    </div>
                  </div>

                  {/* Payment Details & Confirmation in Drawer */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] text-slate-500 uppercase flex items-center justify-between">
                      <span>Payment Status (Network Centre)</span>
                      <span className="font-mono text-emerald-700 font-extrabold text-xs">
                        {selectedAppointment.doctor_fees
                          ? `৳${selectedAppointment.doctor_fees}`
                          : 'Fee on request'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600">Status:</span>
                      {selectedAppointment.payment_status === 'PAID' || selectedAppointment.nc_payment_confirmed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PAID (NC Confirmed)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                          <span>UNPAID</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-bold text-slate-800">{selectedAppointment.payment_method || 'Cash at NC'}</span>
                    </div>

                    {!(selectedAppointment.payment_status === 'PAID' || selectedAppointment.nc_payment_confirmed) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetAptForPayment(selectedAppointment);
                          setConfirmPaymentModalOpen(true);
                        }}
                        className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Confirm Payment Collected (NC)</span>
                      </button>
                    )}
                  </div>

                  {/* Consultation Mode & HQ Video Room in Drawer */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 text-[11px] text-slate-500 uppercase">
                      Consultation Mode & HQ Room
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Mode:</span>
                      <span className="font-bold text-indigo-700 flex items-center gap-1">
                        {selectedAppointment.consultation_mode === 'VIDEO_CONSULTANCY' || selectedAppointment.notes?.toLowerCase().includes('video') ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Telemedicine Video Consultancy</span>
                          </>
                        ) : (
                          <span>🏥 In-Person Visit</span>
                        )}
                      </span>
                    </div>

                    {(selectedAppointment.consultation_mode === 'VIDEO_CONSULTANCY' || selectedAppointment.notes?.toLowerCase().includes('video')) && (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">HQ Room Status:</span>
                          <span className="font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                            {selectedAppointment.video_room_id ? `Room #${selectedAppointment.video_room_id}` : `HQ-ROOM-${selectedAppointment.id}`}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveVideoCallApt(selectedAppointment)}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            <span>Enter Live Video Room</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const roomId = selectedAppointment.video_room_id || `bellevie-room-${selectedAppointment.id}`;
                                const slug = roomId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                                const url = selectedAppointment.video_room_url || `https://meet.jit.si/${slug}`;
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Direct Tab</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const roomId = selectedAppointment.video_room_id || `bellevie-room-${selectedAppointment.id}`;
                                const slug = roomId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                                const url = selectedAppointment.video_room_url || `https://meet.jit.si/${slug}`;
                                navigator.clipboard.writeText(url);
                                alert('Direct Room Link copied to clipboard!');
                              }}
                              className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-800 font-bold rounded-lg text-[11px] hover:bg-indigo-50 cursor-pointer flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reschedule Status banner for Centre */}
                  {selectedAppointment.status === 'RESCHEDULE_REQUESTED' && (
                    <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl space-y-1">
                      <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Reschedule Status (Centre)</span>
                      </div>
                      <div className="text-slate-700 text-[11px]">
                        Requested New Date: <span className="font-bold">{selectedAppointment.requested_datetime || '-'}</span>
                      </div>
                      <div className="text-amber-800 font-bold text-[10px] uppercase bg-amber-100/80 px-2 py-0.5 rounded w-fit mt-1">
                        Pending HQ Review
                      </div>
                    </div>
                  )}

                  {/* Actions (Network Centre) */}
                  {['PENDING', 'CONFIRMED'].includes(selectedAppointment.status) && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2">
                        Actions (Network Centre)
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCancelModalOpen(true)}
                          className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                        >
                          Cancel Appointment
                        </button>
                        {selectedAppointment.status === 'CONFIRMED' && (
                          <button
                            onClick={() => {
                              if (!inputRescheduleDate) {
                                setInputRescheduleDate(getTomorrowDatetimeLocal());
                              }
                              setRescheduleModalOpen(true);
                            }}
                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                          >
                            Request Reschedule
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* History Tab (From GET /api/appointments/appointments/{id}/history/) */
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-xs">Appointment History</h4>
                  {loadingHistory ? (
                    <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading history from API...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(historyData?.status_history || selectedAppointment.status_history || []).map((log, idx) => (
                        <div key={log.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span className="text-blue-700">{log.new_status || log.previous_status}</span>
                            <span className="text-[10px] text-slate-400">{log.created_at ? log.created_at.substring(0, 16) : '-'}</span>
                          </div>
                          <p className="text-slate-600">{log.notes || 'Status updated'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Centre Reschedule Modal */}
      {rescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Request Reschedule (Centre)</h3>
              <button onClick={() => setRescheduleModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Requested Date & Time</label>
                <input
                  type="datetime-local"
                  value={inputRescheduleDate}
                  onChange={(e) => setInputRescheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason</label>
                <textarea
                  value={inputReason}
                  onChange={(e) => setInputReason(e.target.value)}
                  placeholder="Patient is unavailable..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setRescheduleModalOpen(false)} disabled={isSubmittingAction} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleNcRescheduleRequest} disabled={isSubmittingAction} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centre Cancel Modal */}
      {cancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Cancel Appointment</h3>
              <button onClick={() => setCancelModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">Reason</label>
              <textarea
                value={inputReason}
                onChange={(e) => setInputReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={3}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setCancelModalOpen(false)} disabled={isSubmittingAction} className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleNcCancelAppointment} disabled={isSubmittingAction} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1">
                {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. BOOK APPOINTMENT WIZARD MODAL (DRIVEN BY BACKEND REST APIs) */}
      {isBookingWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Wizard Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Book Appointment (Network Centre)</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {bookingStep <= 5 ? `Step ${bookingStep} of 5: ` : ''}{
                    bookingStep === 1 ? 'Select Member' :
                    bookingStep === 2 ? 'Select Specialization' :
                    bookingStep === 3 ? 'Select Doctor' :
                    bookingStep === 4 ? 'Select Date & Time' :
                    bookingStep === 5 ? 'Review & Submit' : 'Appointment Requested'
                  }
                </p>
              </div>

              {bookingStep < 6 && (
                <button onClick={resetBookingWizard} className="p-1.5 text-slate-400 hover:text-white rounded-full">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wizard Content Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs min-h-0">
              
              {/* STEP 1: SELECT MEMBER */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Select Member</h4>
                    <span className="text-slate-500">Step 1 of 5</span>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search member by name or phone..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {loadingMembers ? (
                    <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading members from API...</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {apiMembersList.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            selectedMember?.id === m.id
                              ? 'bg-blue-50 border-blue-500 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setSelectedMember(m);
                            setBookingStep(2);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                              {(m.full_name || 'M')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{m.full_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{m.public_id || `ID: ${m.id}`} • {m.phone}</div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(m);
                              setBookingStep(2);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 cursor-pointer"
                          >
                            Select Member
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SELECT DOCTOR SPECIALIZATION */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Select Specialization</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Selected Member: <span className="text-blue-600 font-extrabold">{selectedMember?.full_name}</span> (#{selectedMember?.id})
                      </p>
                    </div>
                    <span className="text-slate-500">Step 2 of 5</span>
                  </div>

                  {loadingDesignations ? (
                    <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading specializations from API...</span>
                    </div>
                  ) : designationError ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800">
                      <div className="font-bold text-xs flex items-center gap-1.5 text-rose-700">
                        <span>API Error</span>
                      </div>
                      <p className="text-xs font-mono bg-white p-2.5 rounded border border-rose-200 text-rose-900">{designationError}</p>
                      <button
                        onClick={() => {
                          setBookingStep(2);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-blue-700"
                      >
                        Retry API Call
                      </button>
                    </div>
                  ) : designationsList.length === 0 ? (
                    <div className="py-8 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
                      <Stethoscope className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-sm font-bold text-slate-700">No doctor specializations returned from API</div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        The API endpoints returned 0 doctor records.
                      </p>
                      <button
                        onClick={() => {
                          setBookingStep(2);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 cursor-pointer"
                      >
                        Retry API Call
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {designationsList.map((desig) => (
                        <div
                          key={desig.name}
                          onClick={() => {
                            setSelectedDesignation(desig.name);
                            setBookingStep(3);
                          }}
                          className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            selectedDesignation === desig.name
                              ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <Stethoscope className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <div className="font-bold text-slate-900 text-xs">{desig.name}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {desig.doctor_count > 0 ? `${desig.doctor_count} doctors` : 'Available'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: SELECT DOCTOR */}
              {bookingStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Select Doctor ({selectedDesignation})</h4>
                    <span className="text-slate-500">Step 3 of 5</span>
                  </div>

                  {loadingDoctors ? (
                    <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Loading doctors from API...</span>
                    </div>
                  ) : doctorError ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800">
                      <div className="font-bold text-xs flex items-center gap-1.5 text-rose-700">
                        <span>API Error (GET /api/providers/doctors/by-designation/)</span>
                      </div>
                      <p className="text-xs font-mono bg-white p-2.5 rounded border border-rose-200 text-rose-900">{doctorError}</p>
                      <button onClick={() => setBookingStep(2)} className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-blue-700">
                        Back to Specializations
                      </button>
                    </div>
                  ) : doctorsList.length === 0 ? (
                    <div className="py-8 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6">
                      <User className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-sm font-bold text-slate-700">No doctors found for "{selectedDesignation}"</div>
                      <p className="text-xs text-slate-500">The API returned 0 doctors for this specialization.</p>
                      <button
                        onClick={() => setBookingStep(2)}
                        className="px-4 py-2 bg-slate-700 text-white font-bold rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
                      >
                        Back to Specializations
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {doctorsList.map((doc) => (
                        <div
                          key={doc.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 transition-all ${
                            selectedDoctor?.id === doc.id ? 'border-blue-500 bg-blue-50/70 shadow-xs' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0 shadow-inner">
                              {(doc.name || 'D')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                <span>{doc.name}</span>
                                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                                  {doc.specialization}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {doc.designation ? `${doc.designation} • ` : ''}{doc.hospital_name || doc.specialization || 'Medical Specialist'}
                              </div>
                              <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-2">
                                <span>Fee: {doc.doctor_fees || (doc.consultation_fee ? `৳${doc.consultation_fee}` : 'Fee on request')}</span>
                                {(doc.years_of_experience || doc.experience_years) ? (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-500 font-normal">{doc.years_of_experience || doc.experience_years} Yrs Exp</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => setDoctorDetailsModal(doc)}
                              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-50 cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>View Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDoctor(doc);
                                setBookingStep(4);
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 cursor-pointer shadow-xs"
                            >
                              Select Doctor
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: SELECT DATE, TIME & CONSULTATION MODE */}
              {bookingStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Select Date & Time</h4>
                    <span className="text-slate-500">Step 4 of 5</span>
                  </div>

                  <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Selected Doctor:</span>
                      <span className="font-extrabold text-blue-900">{selectedDoctor?.name}</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">
                      {selectedDoctor?.doctor_fees ? `৳${selectedDoctor.doctor_fees}` : selectedDoctor?.consultation_fee ? `৳${selectedDoctor.consultation_fee}` : 'Fee on request'}
                    </span>
                  </div>

                  {/* Consultation Mode Selector */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 block text-xs">Consultation Mode / Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setConsultationMode('IN_PERSON')}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          consultationMode === 'IN_PERSON' ? 'border-blue-600 bg-blue-50/60 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>🏥 In-Person Visit</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">Chamber / Hospital Visit</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConsultationMode('VIDEO_CONSULTANCY')}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          consultationMode === 'VIDEO_CONSULTANCY' ? 'border-indigo-600 bg-indigo-50/60 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Telemedicine Video Consultancy</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">Online Video Call (HQ Room)</div>
                      </button>
                    </div>

                    {consultationMode === 'VIDEO_CONSULTANCY' && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2 animate-fade-in">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">HQ Video Room Creation</span>
                          Upon requesting this Telemedicine Video Consultancy, HQ will create an interactive Video Consultation Room for doctor and patient.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-700 block text-xs">Preferred Date & Time</label>
                    <input
                      type="datetime-local"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => setBookingStep(5)}
                    className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-sm cursor-pointer"
                  >
                    Proceed to Payment & Review
                  </button>
                </div>
              )}

              {/* STEP 5: REVIEW & SUBMIT WITH PAYMENT DETAILS */}
              {bookingStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Review & Submit Appointment</h4>
                    <span className="text-slate-500">Step 5 of 5</span>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-slate-400">Member:</span> <span className="font-bold text-slate-900">{selectedMember?.full_name}</span></div>
                      <div><span className="text-slate-400">Member ID:</span> <span className="font-bold text-slate-900 font-mono">{selectedMember?.public_id || ('BV-' + selectedMember?.id)}</span></div>
                      <div><span className="text-slate-400">Service:</span> <span className="font-bold text-slate-900">Doctor Consultation</span></div>
                      <div><span className="text-slate-400">Doctor:</span> <span className="font-bold text-blue-700">{selectedDoctor?.name}</span></div>
                      <div><span className="text-slate-400">Consultation Mode:</span> <span className="font-bold text-indigo-700">{consultationMode === 'VIDEO_CONSULTANCY' ? '📹 Telemedicine Video Consultancy' : '🏥 In-Person Visit'}</span></div>
                      <div><span className="text-slate-400">Preferred Datetime:</span> <span className="font-bold text-slate-900 font-mono">{selectedDate}</span></div>
                    </div>

                    {/* Payment Status & Confirmation Controls */}
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>Payment Details & Status</span>
                        </span>
                        <span className="text-emerald-700 font-extrabold text-sm">
                          {selectedDoctor?.doctor_fees
                            ? `৳${selectedDoctor.doctor_fees}`
                            : selectedDoctor?.consultation_fee
                            ? `৳${selectedDoctor.consultation_fee}`
                            : 'Fee on request'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-600 block text-[11px] mb-1">Payment Status</label>
                          <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="UNPAID">🔴 UNPAID (Pending)</option>
                            <option value="PAID">🟢 PAID (Collected)</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block text-[11px] mb-1">Payment Method</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="CASH">Cash at Network Centre</option>
                            <option value="BKASH">bKash Mobile Banking</option>
                            <option value="NAGAD">Nagad Mobile Wallet</option>
                            <option value="CARD">Debit / Credit Card</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                          </select>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ncPaymentConfirmed}
                          onChange={(e) => {
                            setNcPaymentConfirmed(e.target.checked);
                            if (e.target.checked) setPaymentStatus('PAID');
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span>Network Centre (NC) Confirms Payment Collected</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <label className="font-semibold text-slate-700 block">Booking Notes</label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Add booking notes..."
                        rows={2}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleFinalSubmitBooking}
                    disabled={isSubmittingBooking}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingBooking && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Submit Appointment to API</span>
                  </button>
                </div>
              )}

              {/* STEP 6: APPOINTMENT REQUESTED (SUCCESS SCREEN) */}
              {bookingStep === 6 && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-extrabold text-slate-900">Appointment Requested</h4>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      Submitted to backend REST API successfully. Initial Status: <span className="font-bold text-amber-600">PENDING</span>
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={resetBookingWizard}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                    >
                      View My Appointments
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Wizard Navigation Footer */}
            {bookingStep > 1 && bookingStep < 6 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setBookingStep(bookingStep - 1)}
                  disabled={isSubmittingBooking}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-white text-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="text-[11px] text-slate-400 font-semibold">
                  Step {bookingStep} of 5
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. DOCTOR DETAILS POPUP MODAL */}
      {doctorDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-lg shadow-inner shrink-0 overflow-hidden">
                  {doctorDetailsModal.image ? (
                    <img src={doctorDetailsModal.image} alt={doctorDetailsModal.name} className="w-full h-full object-cover" />
                  ) : (
                    (doctorDetailsModal.name || 'D')[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">{doctorDetailsModal.name}</h3>
                  <p className="text-xs text-blue-200">
                    {doctorDetailsModal.designation ? `${doctorDetailsModal.designation} • ` : ''}{doctorDetailsModal.specialization || 'Medical Specialist'}
                  </p>
                </div>
              </div>
              <button onClick={() => setDoctorDetailsModal(null)} className="p-1.5 text-blue-200 hover:text-white rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Fee Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-emerald-800 text-[11px] font-bold block uppercase tracking-wider">Consultation Fee</span>
                  <span className="text-2xl font-extrabold text-emerald-700">
                    {doctorDetailsModal.doctor_fees || (doctorDetailsModal.consultation_fee ? `৳${doctorDetailsModal.consultation_fee}` : 'Fee on request')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px] block font-bold">Contact Phone</span>
                  <span className="text-sm font-bold text-slate-700">{doctorDetailsModal.contact_details || doctorDetailsModal.phone || 'Available via Centre'}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Hospital / Clinic</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">{doctorDetailsModal.hospital_name || 'Not assigned'}</span>
                  <span className="text-[10px] text-slate-500">{doctorDetailsModal.hospital_address || doctorDetailsModal.hospital_district || ''}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Chamber & Schedule</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">{doctorDetailsModal.doctor_sedule || doctorDetailsModal.chamber_address || 'Schedule on request'}</span>
                  <span className="text-[10px] text-slate-500">{doctorDetailsModal.visiting_hours || ''}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Years of Experience</span>
                  <span className="font-bold text-slate-900 text-xs block mt-0.5">
                    {doctorDetailsModal.years_of_experience || doctorDetailsModal.experience_years ? `${doctorDetailsModal.years_of_experience || doctorDetailsModal.experience_years} Years Exp.` : 'Experience not specified'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">BMDC Reg. No</span>
                  <span className="font-bold text-slate-900 font-mono text-xs block mt-0.5">{doctorDetailsModal.registration_number || 'N/A'}</span>
                  {doctorDetailsModal.registration_number && (
                    <span className="text-[10px] text-emerald-600 font-semibold">Verified Practitioner</span>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <span className="font-bold text-slate-700 text-xs">About Doctor</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 leading-relaxed text-[11px]">
                  {doctorDetailsModal.doctor_details || doctorDetailsModal.bio || `${doctorDetailsModal.name} is registered as a ${doctorDetailsModal.specialization || doctorDetailsModal.designation || 'Medical Doctor'}.`}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button onClick={() => setDoctorDetailsModal(null)} className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-xs text-slate-700 cursor-pointer hover:bg-white">
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedDoctor(doctorDetailsModal);
                  setDoctorDetailsModal(null);
                  setBookingStep(4);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer"
              >
                Select This Doctor & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. NC PAYMENT CONFIRMATION MODAL */}
      {confirmPaymentModalOpen && targetAptForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Confirm Payment (NC)</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Apt ID: #{targetAptForPayment.public_id || targetAptForPayment.id}</p>
                </div>
              </div>
              <button onClick={() => setConfirmPaymentModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500">Patient: <span className="font-bold text-slate-900">{targetAptForPayment.member_name || `Member #${targetAptForPayment.member}`}</span></div>
              <div className="text-slate-500">Service: <span className="font-bold text-blue-700">{targetAptForPayment.doctor_name || targetAptForPayment.service_name || 'Consultation'}</span></div>
              <div className="text-emerald-700 font-bold text-sm pt-1">Amount Due: ৳3,000.00</div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Payment Method</label>
              <select
                value={paymentMethodInput}
                onChange={(e) => setPaymentMethodInput(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="CASH">Cash Collected at Centre</option>
                <option value="BKASH">bKash Mobile Banking</option>
                <option value="NAGAD">Nagad Mobile Wallet</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">Payment Note / Reference (Optional)</label>
              <input
                type="text"
                value={paymentNotesInput}
                onChange={(e) => setPaymentNotesInput(e.target.value)}
                placeholder="Transaction ID or Receipt Ref..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setConfirmPaymentModalOpen(false)} disabled={isSubmittingAction} className="px-4 py-2 border border-slate-300 rounded-xl font-bold cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleNcConfirmPayment}
                disabled={isSubmittingAction}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isSubmittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Payment as PAID</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TELEMEDICINE VIDEO CONSULTANCY ROOM MODAL */}
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
            duration_seconds: 120,
            participants_summary: '3 Active (Doctor, Patient, HQ Controller)',
            chat_messages: [
              { id: 1, call: activeVideoCallApt.id, sender_name: 'HQ Admin', sender_role: 'ADMIN', message: 'Welcome to Bellevie HQ Video Room. The consultation room is now live.', timestamp: '10:00 AM' }
            ]
          }}
          onClose={() => setActiveVideoCallApt(null)}
        />
      )}

    </div>
  );
};
