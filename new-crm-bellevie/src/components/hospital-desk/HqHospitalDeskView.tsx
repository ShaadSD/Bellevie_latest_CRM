'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Plus,
  Edit2,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  FileText,
  AlertCircle,
  Check
} from 'lucide-react';
import {
  HospitalBookingRecord,
  BedAvailabilityRecord,
  HospitalDeskMetrics,
  HospitalBookingStatus,
  BedType,
  fetchHospitalDeskMetrics,
  fetchBedAvailabilitiesApi,
  fetchHospitalBookingsApi,
  saveBedAvailabilityApi,
  toggleBedPublishApi,
  createHospitalBookingApi,
  updateBookingStatusApi,
  ALLOWED_STATUS_TRANSITIONS,
  fetchHospitalsApi
} from '@/lib/hospitalDeskApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';
import { ApiHospital } from '@/lib/appointmentsApi';

export const HqHospitalDeskView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bed-availability' | 'bookings'>('overview');
  const [metrics, setMetrics] = useState<HospitalDeskMetrics | null>(null);
  const [beds, setBeds] = useState<BedAvailabilityRecord[]>([]);
  const [bookings, setBookings] = useState<HospitalBookingRecord[]>([]);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [hospitalsList, setHospitalsList] = useState<ApiHospital[]>([]);

  // Modals & Active Selections
  const [selectedBooking, setSelectedBooking] = useState<HospitalBookingRecord | null>(null);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<BedAvailabilityRecord | null>(null);
  const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);

  // Filters for Bed Availability
  const [bedSearchQuery, setBedSearchQuery] = useState('');
  const [bedDistrictFilter, setBedDistrictFilter] = useState('ALL');
  const [bedTypeFilter, setBedTypeFilter] = useState('ALL');
  const [bedPublishFilter, setBedPublishFilter] = useState('ALL');

  // Filters for Hospital Bookings
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
  const [bookingBedTypeFilter, setBookingBedTypeFilter] = useState('ALL');
  const [bookingHospitalFilter, setBookingHospitalFilter] = useState('ALL');

  // Status Change State inside Modal
  const [newStatus, setNewStatus] = useState<HospitalBookingStatus>('CONFIRMED');
  const [hqNotesInput, setHqNotesInput] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [bedError, setBedError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    verifiedAvailability: true,
    verificationRecent: true,
    bedsAvailable: true,
    memberActive: true
  });

  // Bed Modal Form state
  const [bedForm, setBedForm] = useState({
    hospital: '',
    district: 'Dhaka',
    bedType: 'ICU' as BedType,
    total: 10,
    available: 5,
    rate: 5000,
    isPublished: true
  });

  // Add Booking HQ Form state
  const [bookingForm, setBookingForm] = useState({
    memberId: 0,
    memberName: '',
    hospital: '',
    bedType: 'ICU' as BedType,
    centre: 'Dhaka Centre',
    notes: ''
  });

  // Load initial data from backend API
  const loadData = async () => {
    const [m, bList, bkList, hList] = await Promise.all([
      fetchHospitalDeskMetrics(),
      fetchBedAvailabilitiesApi(),
      fetchHospitalBookingsApi(),
      fetchHospitalsApi()
    ]);
    setMetrics(m);
    setBeds(bList);
    setBookings(bkList);
    setHospitalsList(hList);

    try {
      const memRes = await fetchMembersList();
      const mList = Array.isArray(memRes) ? memRes : memRes?.results || [];
      setMembers(mList);

      if (hList.length > 0) {
        setBedForm(prev => ({ ...prev, hospital: prev.hospital || hList[0].name }));
        setBookingForm(prev => ({
          ...prev,
          hospital: prev.hospital || hList[0].name,
          memberId: mList[0]?.id || 0,
          memberName: mList[0]?.full_name || ''
        }));
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublish = async (id: string) => {
    await toggleBedPublishApi(id);
    await loadData();
  };

  const handleSaveBedModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setBedError(null);
    try {
      await saveBedAvailabilityApi({
        id: editingBed ? editingBed.id : undefined,
        hospital: bedForm.hospital,
        district: bedForm.district,
        bedType: bedForm.bedType,
        total: Number(bedForm.total),
        available: Number(bedForm.available),
        rate: Number(bedForm.rate),
        isPublished: bedForm.isPublished
      });
      setIsAddBedModalOpen(false);
      setEditingBed(null);
      await loadData();
    } catch (err: any) {
      console.error('Save bed error:', err);
      setBedError(err.message || 'Failed to save bed availability record.');
    }
  };

  const handleSaveBookingModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.memberName) return;
    setBookingError(null);
    try {
      await createHospitalBookingApi({
        memberId: bookingForm.memberId || (members[0]?.id ?? 1),
        memberName: bookingForm.memberName,
        hospital: bookingForm.hospital,
        bedType: bookingForm.bedType,
        centre: bookingForm.centre,
        notes: bookingForm.notes,
        requestedBy: 'HQ Admin'
      });
      setIsAddBookingModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Booking creation error:', err);
      setBookingError(err.message || 'Failed to create booking.');
    }
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setStatusError(null);

    try {
      const updated = await updateBookingStatusApi(
        selectedBooking.id,
        newStatus,
        hqNotesInput,
        'HQ Admin'
      );
      setSelectedBooking(updated);
      setIsUpdateStatusModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Status update error:', err);
      setStatusError(err.message || 'Failed to update booking status.');
    }
  };

  // Status Badge Render Helper
  const renderStatusBadge = (status: HospitalBookingStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            PENDING
          </span>
        );
      case 'VERIFYING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            VERIFYING
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            CONFIRMED
          </span>
        );
      case 'ADMITTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
            ADMITTED
          </span>
        );
      case 'DISCHARGED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
            DISCHARGED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Filtered Lists
  const filteredBeds = beds.filter(b => {
    const hospStr = String(b.hospitalName || b.hospital || '');
    if (bedSearchQuery && !hospStr.toLowerCase().includes(bedSearchQuery.toLowerCase()) && !b.district.toLowerCase().includes(bedSearchQuery.toLowerCase())) return false;
    if (bedDistrictFilter !== 'ALL' && b.district !== bedDistrictFilter) return false;
    if (bedTypeFilter !== 'ALL' && b.bedType !== bedTypeFilter) return false;
    if (bedPublishFilter === 'PUBLISHED' && !b.isPublished) return false;
    if (bedPublishFilter === 'UNPUBLISHED' && b.isPublished) return false;
    return true;
  });

  const filteredBookings = bookings.filter(b => {
    if (bookingSearchQuery && !b.memberName.toLowerCase().includes(bookingSearchQuery.toLowerCase()) && !b.id.toLowerCase().includes(bookingSearchQuery.toLowerCase()) && !b.hospital.toLowerCase().includes(bookingSearchQuery.toLowerCase())) return false;
    if (bookingStatusFilter !== 'ALL' && b.status !== bookingStatusFilter) return false;
    if (bookingBedTypeFilter !== 'ALL' && b.bedType !== bookingBedTypeFilter) return false;
    if (bookingHospitalFilter !== 'ALL' && b.hospital !== bookingHospitalFilter) return false;
    return true;
  });

  // Extract unique districts dynamically for filter
  const uniqueDistricts = Array.from(new Set(beds.map(b => b.district).filter(Boolean)));

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Top Header Badge & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md tracking-wide">
                HQ Admin
              </span>
              <h1 className="text-xl font-bold text-slate-900">Hospital Desk</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage hospital bed availability and booking requests
            </p>
          </div>
        </div>

        {/* View Switcher Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard / Overview
          </button>
          <button
            onClick={() => setActiveTab('bed-availability')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'bed-availability'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bed Availability
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-white text-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hospital Bookings
          </button>
        </div>
      </div>

      {/* Metric Cards Row (100% Dynamic API Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Hospitals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hospitals</span>
            <div className="text-2xl font-black text-slate-900">{metrics?.totalHospitals ?? 0}</div>
            <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <span>{metrics?.activeHospitals ?? 0} Active</span>
              <span className="text-slate-300">•</span>
              <span>{metrics?.approvedHospitals ?? 0} Approved</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Published Bed Records */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Published Bed Records</span>
            <div className="text-2xl font-black text-slate-900">{metrics?.publishedBedRecords ?? 0}</div>
            <div className="text-[11px] font-semibold text-amber-600">
              {metrics?.unpublishedBedRecords ?? 0} Unpublished
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Available Beds (Published) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Beds (Published)</span>
            <div className="text-2xl font-black text-slate-900">{metrics?.availableBedsPublished ?? 0}</div>
            <div className="text-[11px] font-semibold text-emerald-600">
              Live Realtime Count
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Total Bookings */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="text-2xl font-black text-slate-900">{metrics?.totalBookings ?? 0}</div>
            <div className="text-[11px] font-semibold text-blue-600">
              Across all centres
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Status Summary Cards Row (6 Status Pills matching dynamic API data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* Pending */}
        <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-sm bg-amber-50/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-amber-800 font-bold">Pending</div>
            <div className="text-lg font-black text-amber-900">{metrics?.statusCounts.pending ?? 0}</div>
            <div className="text-[10px] text-amber-600">Needs verification</div>
          </div>
        </div>

        {/* Verifying */}
        <div className="bg-white p-3 rounded-xl border border-blue-200/80 shadow-sm bg-blue-50/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="text-xs text-blue-800 font-bold">Verifying</div>
            <div className="text-lg font-black text-blue-900">{metrics?.statusCounts.verifying ?? 0}</div>
            <div className="text-[10px] text-blue-600">In progress</div>
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-sm bg-emerald-50/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-emerald-800 font-bold">Confirmed</div>
            <div className="text-lg font-black text-emerald-900">{metrics?.statusCounts.confirmed ?? 0}</div>
            <div className="text-[10px] text-emerald-600">Bed reserved</div>
          </div>
        </div>

        {/* Admitted */}
        <div className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-sm bg-purple-50/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
            <Bed className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-purple-800 font-bold">Admitted</div>
            <div className="text-lg font-black text-purple-900">{metrics?.statusCounts.admitted ?? 0}</div>
            <div className="text-[10px] text-purple-600">In hospital</div>
          </div>
        </div>

        {/* Discharged */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm bg-slate-50/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-700 font-bold">Discharged</div>
            <div className="text-lg font-black text-slate-800">{metrics?.statusCounts.discharged ?? 0}</div>
            <div className="text-[10px] text-slate-500">Completed</div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-sm bg-rose-50/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-rose-800 font-bold">Rejected</div>
            <div className="text-lg font-black text-rose-900">{metrics?.statusCounts.rejected ?? 0}</div>
            <div className="text-[10px] text-rose-600">Cancelled</div>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Booking Requests Table (Left Box) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent Booking Requests</h2>
              <button
                onClick={() => setActiveTab('bookings')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Hospital</th>
                    <th className="py-2.5 px-3">Bed Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Requested</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.length > 0 ? (
                    bookings.slice(0, 5).map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">{row.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{row.memberName}</td>
                        <td className="py-3 px-3 text-slate-600">{row.hospital}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 font-semibold text-slate-700 rounded text-[11px]">
                            {row.bedType}
                          </span>
                        </td>
                        <td className="py-3 px-3">{renderStatusBadge(row.status)}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">{row.createdAt}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedBooking(row)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-semibold transition-colors text-[11px]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No hospital booking requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bed Availability Overview Matrix (Right Box - 100% DYNAMIC) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Bed Availability Overview</h2>
              <button
                onClick={() => setActiveTab('bed-availability')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-200">
                    <th className="py-2.5 px-2 text-left">Hospital</th>
                    <th className="py-2.5 px-1">ICU</th>
                    <th className="py-2.5 px-1">CCU</th>
                    <th className="py-2.5 px-1">HDU</th>
                    <th className="py-2.5 px-1">NICU</th>
                    <th className="py-2.5 px-1">PICU</th>
                    <th className="py-2.5 px-1">Cabin</th>
                    <th className="py-2.5 px-1">Ward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {(() => {
                    const matrixMap: Record<string, any> = {};
                    beds.forEach(b => {
                      const hName = b.hospitalName || String(b.hospital);
                      if (!matrixMap[hName]) {
                        matrixMap[hName] = { name: hName, icu: '-', ccu: '-', hdu: '-', nicu: '-', picu: '-', cabin: '-', ward: '-' };
                      }
                      const key = b.bedType.toLowerCase();
                      if (key in matrixMap[hName]) {
                        matrixMap[hName][key] = `${b.available}/${b.total}`;
                      }
                    });

                    const rows = Object.values(matrixMap);
                    if (rows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            No bed availability records published yet
                          </td>
                        </tr>
                      );
                    }

                    return rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2 text-left font-semibold text-slate-900 whitespace-nowrap">{row.name}</td>
                        <td className="py-3 px-1 text-emerald-600 font-bold">{row.icu}</td>
                        <td className="py-3 px-1 text-emerald-600 font-bold">{row.ccu}</td>
                        <td className="py-3 px-1 text-slate-600">{row.hdu}</td>
                        <td className="py-3 px-1 text-slate-600">{row.nicu}</td>
                        <td className="py-3 px-1 text-slate-600">{row.picu}</td>
                        <td className="py-3 px-1 text-blue-600 font-bold">{row.cabin}</td>
                        <td className="py-3 px-1 text-slate-600">{row.ward}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BED AVAILABILITY MANAGEMENT */}
      {activeTab === 'bed-availability' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bed Availability Management (HQ)</h2>
              <div className="text-xs text-slate-500">Hospital Desk &gt; Bed Availability</div>
            </div>
            <button
              onClick={() => {
                setEditingBed(null);
                setBedForm({
                  hospital: hospitalsList[0]?.name || '',
                  district: 'Dhaka',
                  bedType: 'ICU',
                  total: 10,
                  available: 5,
                  rate: 5000,
                  isPublished: true
                });
                setIsAddBedModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Bed Availability
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search hospital, district..."
                value={bedSearchQuery}
                onChange={(e) => setBedSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={bedDistrictFilter}
                onChange={(e) => setBedDistrictFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Districts</option>
                {uniqueDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={bedTypeFilter}
                onChange={(e) => setBedTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Bed Types</option>
                <option value="ICU">ICU</option>
                <option value="CCU">CCU</option>
                <option value="HDU">HDU</option>
                <option value="NICU">NICU</option>
                <option value="PICU">PICU</option>
                <option value="CABIN">CABIN</option>
                <option value="WARD">WARD</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBedSearchQuery('');
                  setBedDistrictFilter('ALL');
                  setBedTypeFilter('ALL');
                  setBedPublishFilter('ALL');
                }}
                className="w-full px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Bed Type</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Available</th>
                  <th className="py-2.5 px-3">Rate (BDT)</th>
                  <th className="py-2.5 px-3">Published</th>
                  <th className="py-2.5 px-3">Last Verified</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBeds.length > 0 ? (
                  filteredBeds.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-500">{index + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{row.hospitalName || row.hospital}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                          {row.bedType}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600">{row.total}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">{row.available}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">৳ {row.rate.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleTogglePublish(row.id)}
                          className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                            row.isPublished ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                          }`}
                          title={row.isPublished ? 'Published' : 'Unpublished'}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                        </button>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">{row.lastVerified}</td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingBed(row);
                            setBedForm({
                              hospital: String(row.hospitalName || row.hospital),
                              district: row.district,
                              bedType: row.bedType,
                              total: row.total,
                              available: row.available,
                              rate: row.rate,
                              isPublished: row.isPublished
                            });
                            setIsAddBedModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                          title="Edit Bed Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No bed availability records match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HOSPITAL BOOKINGS MANAGEMENT */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hospital Booking Management (HQ)</h2>
              <div className="text-xs text-slate-500">Hospital Desk &gt; Hospital Bookings</div>
            </div>
            <button
              onClick={() => {
                setBookingForm({
                  memberId: members[0]?.id || 0,
                  memberName: members[0]?.full_name || '',
                  hospital: hospitalsList[0]?.name || '',
                  bedType: 'ICU',
                  centre: 'Dhaka Centre',
                  notes: ''
                });
                setIsAddBookingModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Booking (HQ)
            </button>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member, hospital..."
                value={bookingSearchQuery}
                onChange={(e) => setBookingSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">PENDING</option>
                <option value="VERIFYING">VERIFYING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="ADMITTED">ADMITTED</option>
                <option value="DISCHARGED">DISCHARGED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <select
                value={bookingBedTypeFilter}
                onChange={(e) => setBookingBedTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="ALL">All Bed Types</option>
                <option value="ICU">ICU</option>
                <option value="CCU">CCU</option>
                <option value="HDU">HDU</option>
                <option value="CABIN">CABIN</option>
                <option value="WARD">WARD</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => {
                  setBookingSearchQuery('');
                  setBookingStatusFilter('ALL');
                  setBookingBedTypeFilter('ALL');
                  setBookingHospitalFilter('ALL');
                }}
                className="w-full px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Bed Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Centre</th>
                  <th className="py-2.5 px-3">Requested By</th>
                  <th className="py-2.5 px-3">Created At</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{row.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{row.memberName}</td>
                      <td className="py-3 px-3 text-slate-700">{row.hospital}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                          {row.bedType}
                        </span>
                      </td>
                      <td className="py-3 px-3">{renderStatusBadge(row.status)}</td>
                      <td className="py-3 px-3 text-slate-600">{row.centre}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{row.requestedBy}</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">{row.createdAt}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedBooking(row)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-semibold transition-colors text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                      No hospital booking records match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: BOOKING DETAILS (HQ) */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold">Booking Details (HQ)</h3>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Hospital Desk &gt; Hospital Bookings &gt; {selectedBooking.id}
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Grid Section 1: Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Booking Information */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking Information</h4>
                  <div className="text-xs space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Booking ID:</span>
                      <span className="font-bold text-slate-900">{selectedBooking.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Public ID:</span>
                      <span className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]" title={selectedBooking.publicId}>
                        {selectedBooking.publicId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Status:</span>
                      {renderStatusBadge(selectedBooking.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Created At:</span>
                      <span className="font-medium text-slate-800">{selectedBooking.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requested By:</span>
                      <span className="font-medium text-slate-800">{selectedBooking.requestedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Network Centre:</span>
                      <span className="font-semibold text-blue-600">{selectedBooking.centre}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Member Information */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Member Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{selectedBooking.memberName}</div>
                      <div
                        className="text-[11px] text-slate-500 font-mono truncate max-w-[190px]"
                        title={selectedBooking.memberPublicId || String(selectedBooking.memberId)}
                      >
                        Public ID: {selectedBooking.memberPublicId || selectedBooking.memberId}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedBooking.memberPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedBooking.memberEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedBooking.memberAddress || selectedBooking.hospitalDistrict || selectedBooking.centre}</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Hospital Information */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hospital Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{selectedBooking.hospital}</div>
                      <div className="text-[11px] text-slate-500">{selectedBooking.hospitalDistrict}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded">
                      Active
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold text-[10px] rounded">
                      Approved
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone: {selectedBooking.hospitalPhone}</span>
                  </div>
                </div>
              </div>

              {/* Grid Section 2: Details & Live Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Booking Request Details</h4>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bed Type:</span>
                      <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                        {selectedBooking.bedType}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Notes:</span>
                      <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 text-xs italic border border-slate-200/60">
                        "{selectedBooking.notes || 'No notes provided'}"
                      </p>
                    </div>
                    {selectedBooking.hqNotes && (
                      <div>
                        <span className="text-slate-500 block mb-1">HQ Internal Notes:</span>
                        <p className="p-2.5 bg-blue-50/50 rounded-lg text-blue-900 text-xs border border-blue-100">
                          {selectedBooking.hqNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Current Bed Availability</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                      <Bed className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {selectedBooking.totalAvailableAtTime} Beds Available
                      </div>
                      <div className="text-xs text-slate-500">
                        Daily Rate: <span className="font-bold text-slate-900">৳ {selectedBooking.dailyRate?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Last Verified: Recently</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Live Sync
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Status Progress Timeline</h4>
                <div className="flex items-center justify-between overflow-x-auto py-2 px-4">
                  {['PENDING', 'VERIFYING', 'CONFIRMED', 'ADMITTED', 'DISCHARGED'].map((stepStatus, idx) => {
                    const isCurrent = selectedBooking.status === stepStatus;
                    const isPassed = ['CONFIRMED', 'ADMITTED', 'DISCHARGED'].includes(selectedBooking.status) && idx <= 2;
                    return (
                      <div key={stepStatus} className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCurrent
                                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                : isPassed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] font-bold mt-1 ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                            {stepStatus}
                          </span>
                        </div>
                        {idx < 4 && <div className="w-12 h-0.5 bg-slate-200" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const allowed = ALLOWED_STATUS_TRANSITIONS[selectedBooking.status] || [];
                  setNewStatus(allowed[0] || selectedBooking.status);
                  setHqNotesInput(selectedBooking.hqNotes || '');
                  setStatusError(null);
                  setIsUpdateStatusModalOpen(true);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Update Status (HQ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE BOOKING STATUS (HQ) */}
      {isUpdateStatusModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" /> Update Booking Status (HQ)
              </h3>
              <button
                onClick={() => setIsUpdateStatusModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4 text-xs">
              {statusError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Update Failed</span>
                    <span>{statusError}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">Current Status:</span>
                {renderStatusBadge(selectedBooking.status)}
              </div>

              {ALLOWED_STATUS_TRANSITIONS[selectedBooking.status]?.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Next Status Transition *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as HospitalBookingStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {ALLOWED_STATUS_TRANSITIONS[selectedBooking.status].map((st) => (
                      <option key={st} value={st}>
                        {st === 'VERIFYING' && 'VERIFYING (HQ In Progress)'}
                        {st === 'CONFIRMED' && 'CONFIRMED (Reserve Bed & Decrement Capacity)'}
                        {st === 'ADMITTED' && 'ADMITTED (Patient Admitted)'}
                        {st === 'DISCHARGED' && 'DISCHARGED (Patient Discharged)'}
                        {st === 'REJECTED' && 'REJECTED (Reject Request)'}
                        {!['VERIFYING', 'CONFIRMED', 'ADMITTED', 'DISCHARGED', 'REJECTED'].includes(st) && st}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
                  This booking is in final status ({selectedBooking.status}). No further status transitions are allowed.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">HQ Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add notes for this status change..."
                  value={hqNotesInput}
                  onChange={(e) => setHqNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Before Confirming Checklist */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Before confirming, ensure:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.verifiedAvailability}
                      onChange={(e) => setChecklist({ ...checklist, verifiedAvailability: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Hospital verified availability</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.verificationRecent}
                      onChange={(e) => setChecklist({ ...checklist, verificationRecent: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Verification is recent</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.bedsAvailable}
                      onChange={(e) => setChecklist({ ...checklist, bedsAvailable: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Available beds &gt; 0</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.memberActive}
                      onChange={(e) => setChecklist({ ...checklist, memberActive: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Member is active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateStatusModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-blue-500/20"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BED AVAILABILITY */}
      {isAddBedModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Bed className="w-4 h-4 text-blue-400" />
                {editingBed ? 'Edit Bed Availability' : 'Add Bed Availability (HQ)'}
              </h3>
              <button
                onClick={() => setIsAddBedModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBedModal} className="p-5 space-y-3 text-xs">
              {bedError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Save Failed</span>
                    <span>{bedError}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital Name *</label>
                <select
                  value={bedForm.hospital}
                  onChange={(e) => setBedForm({ ...bedForm, hospital: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                >
                  {hospitalsList.length > 0 ? (
                    hospitalsList.map(h => (
                      <option key={h.id} value={h.name}>
                        {h.name} ({h.district || 'Dhaka'})
                      </option>
                    ))
                  ) : (
                    <option value="">No hospitals loaded from API</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={bedForm.district}
                    onChange={(e) => setBedForm({ ...bedForm, district: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bed Type *</label>
                  <select
                    value={bedForm.bedType}
                    onChange={(e) => setBedForm({ ...bedForm, bedType: e.target.value as BedType })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="ICU">ICU</option>
                    <option value="CCU">CCU</option>
                    <option value="HDU">HDU</option>
                    <option value="NICU">NICU</option>
                    <option value="PICU">PICU</option>
                    <option value="CABIN">CABIN</option>
                    <option value="WARD">WARD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Beds</label>
                  <input
                    type="number"
                    value={bedForm.total}
                    onChange={(e) => setBedForm({ ...bedForm, total: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available</label>
                  <input
                    type="number"
                    value={bedForm.available}
                    onChange={(e) => setBedForm({ ...bedForm, available: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate (BDT)</label>
                  <input
                    type="number"
                    value={bedForm.rate}
                    onChange={(e) => setBedForm({ ...bedForm, rate: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">Published Status:</span>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={bedForm.isPublished}
                    onChange={(e) => setBedForm({ ...bedForm, isPublished: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>{bedForm.isPublished ? 'Published' : 'Unpublished'}</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBedModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BOOKING (HQ) */}
      {isAddBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" /> Create Booking (HQ)
              </h3>
              <button
                onClick={() => setIsAddBookingModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBookingModal} className="p-5 space-y-3 text-xs">
              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Booking Failed</span>
                    <span>{bookingError}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Member *</label>
                <select
                  value={bookingForm.memberId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const found = members.find(m => m.id === id);
                    setBookingForm({
                      ...bookingForm,
                      memberId: id,
                      memberName: found ? found.full_name : ''
                    });
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {members.length > 0 ? (
                    members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.phone})
                      </option>
                    ))
                  ) : (
                    <option value={0}>No members loaded from API</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital *</label>
                  <select
                    value={bookingForm.hospital}
                    onChange={(e) => setBookingForm({ ...bookingForm, hospital: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                  >
                    {hospitalsList.length > 0 ? (
                      hospitalsList.map(h => (
                        <option key={h.id} value={h.name}>
                          {h.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No hospitals loaded from API</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bed Type *</label>
                  <select
                    value={bookingForm.bedType}
                    onChange={(e) => setBookingForm({ ...bookingForm, bedType: e.target.value as BedType })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="ICU">ICU</option>
                    <option value="CCU">CCU</option>
                    <option value="HDU">HDU</option>
                    <option value="CABIN">CABIN</option>
                    <option value="WARD">WARD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Centre</label>
                <select
                  value={bookingForm.centre}
                  onChange={(e) => setBookingForm({ ...bookingForm, centre: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Dhaka Centre">Dhaka Centre</option>
                  <option value="Chattogram Centre">Chattogram Centre</option>
                  <option value="Sylhet Centre">Sylhet Centre</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Patient details and special requirements..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBookingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md shadow-blue-500/20"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
