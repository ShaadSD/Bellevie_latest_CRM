'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bed,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  RefreshCw,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  Check,
  XCircle,
  AlertCircle,
  FileText,
  Building
} from 'lucide-react';
import {
  HospitalBookingRecord,
  BedAvailabilityRecord,
  HospitalBookingStatus,
  BedType,
  fetchBedAvailabilitiesApi,
  fetchHospitalBookingsApi,
  createHospitalBookingApi,
  fetchHospitalsApi
} from '@/lib/hospitalDeskApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';
import { ApiHospital } from '@/lib/appointmentsApi';

interface NcHospitalDeskViewProps {
  userCentreName?: string;
}

export const NcHospitalDeskView: React.FC<NcHospitalDeskViewProps> = ({
  userCentreName = 'Chattogram Centre'
}) => {
  const [activeTab, setActiveTab] = useState<'find-beds' | 'my-bookings'>('find-beds');
  const [beds, setBeds] = useState<BedAvailabilityRecord[]>([]);
  const [bookings, setBookings] = useState<HospitalBookingRecord[]>([]);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const [hospitalsList, setHospitalsList] = useState<ApiHospital[]>([]);

  // Filter state for Find Available Beds
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [bedTypeFilter, setBedTypeFilter] = useState('ALL');
  const [minAvailableFilter, setMinAvailableFilter] = useState('ANY');

  // Filter state for My Bookings
  const [bookingStatusTab, setBookingStatusTab] = useState<'ALL' | HospitalBookingStatus>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<HospitalBookingRecord | null>(null);

  // Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<string>('');
  const [selectedBedTypeForModal, setSelectedBedTypeForModal] = useState<BedType>('ICU');
  const [requestForm, setRequestForm] = useState({
    memberId: 0,
    memberName: '',
    notes: 'Patient requires ICU admission. Please allocate bed.'
  });

  const [bookingError, setBookingError] = useState<string | null>(null);

  const loadData = async () => {
    const [bList, bkList, hList] = await Promise.all([
      fetchBedAvailabilitiesApi({ is_published: true }),
      fetchHospitalBookingsApi(),
      fetchHospitalsApi()
    ]);
    setBeds(bList);
    setBookings(bkList);
    setHospitalsList(hList);

    if (hList.length > 0) {
      setSelectedHospitalForModal(hList[0].name);
    }

    try {
      const memRes = await fetchMembersList();
      const mList = Array.isArray(memRes) ? memRes : memRes?.results || [];
      setMembers(mList);
      if (mList.length > 0) {
        setRequestForm(prev => ({
          ...prev,
          memberId: mList[0].id,
          memberName: mList[0].full_name
        }));
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRequestModal = (hospitalName?: string, bedType: BedType = 'ICU') => {
    setSelectedHospitalForModal(hospitalName || (hospitalsList[0]?.name ?? ''));
    setSelectedBedTypeForModal(bedType);
    setBookingError(null);
    if (members.length > 0) {
      setRequestForm({
        memberId: members[0].id,
        memberName: members[0].full_name,
        notes: 'Patient requires ICU admission. Please allocate bed.'
      });
    }
    setIsRequestModalOpen(true);
  };

  const handleCreateBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.memberName) return;
    setBookingError(null);

    try {
      await createHospitalBookingApi({
        memberId: requestForm.memberId || (members[0]?.id ?? 1),
        memberName: requestForm.memberName,
        hospital: selectedHospitalForModal,
        bedType: selectedBedTypeForModal,
        centre: userCentreName,
        notes: requestForm.notes,
        requestedBy: 'Centre User'
      });

      setIsRequestModalOpen(false);
      await loadData();
      setActiveTab('my-bookings');
    } catch (err: any) {
      console.error('Booking creation error:', err);
      setBookingError(err.message || 'Failed to create booking request.');
    }
  };

  // Group beds by hospital for card view
  const hospitalGroupedMap = beds.reduce((acc, bed) => {
    const hospKey = String(bed.hospitalName || bed.hospital);
    if (!acc[hospKey]) {
      acc[hospKey] = {
        name: hospKey,
        district: bed.district,
        image: bed.image,
        beds: [] as BedAvailabilityRecord[]
      };
    }
    acc[hospKey].beds.push(bed);
    return acc;
  }, {} as Record<string, { name: string; district: string; image?: string; beds: BedAvailabilityRecord[] }>);

  const hospitalCards = Object.values(hospitalGroupedMap).filter(h => {
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase()) && !h.district.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (districtFilter !== 'ALL' && h.district !== districtFilter) return false;
    if (bedTypeFilter !== 'ALL' && !h.beds.some(b => b.bedType === bedTypeFilter)) return false;
    if (minAvailableFilter !== 'ANY') {
      const minVal = Number(minAvailableFilter);
      if (!h.beds.some(b => b.available >= minVal)) return false;
    }
    return true;
  });

  // Extract unique districts dynamically
  const uniqueDistricts = Array.from(new Set(beds.map(b => b.district).filter(Boolean)));

  // Filter My Bookings
  const filteredBookings = bookings.filter(b => {
    if (bookingStatusTab === 'ALL') return true;
    return b.status === bookingStatusTab;
  });

  // Status Badge Helper
  const renderStatusBadge = (status: HospitalBookingStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">PENDING</span>;
      case 'VERIFYING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">VERIFYING</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">CONFIRMED</span>;
      case 'ADMITTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">ADMITTED</span>;
      case 'DISCHARGED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">DISCHARGED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">REJECTED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Top Header Badge & Nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-md tracking-wide">
                Network Centre
              </span>
              <h1 className="text-xl font-bold text-slate-900">Hospital Desk</h1>
              <span className="text-xs font-semibold text-slate-500">({userCentreName})</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Find available hospital beds and request bookings for your members
            </p>
          </div>
        </div>

        {/* View Switcher Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('find-beds')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'find-beds'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Find Available Beds
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'my-bookings'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {/* TAB 1: FIND AVAILABLE BEDS */}
      {activeTab === 'find-beds' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-600" /> Find Available Beds
              </h2>
              <button
                onClick={() => handleOpenRequestModal()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" /> Request Hospital Booking
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search hospital, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="ALL">All Bed Types</option>
                  <option value="ICU">ICU</option>
                  <option value="CCU">CCU</option>
                  <option value="HDU">HDU</option>
                  <option value="CABIN">CABIN</option>
                  <option value="WARD">WARD</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDistrictFilter('ALL');
                    setBedTypeFilter('ALL');
                    setMinAvailableFilter('ANY');
                  }}
                  className="w-full px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-semibold transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Hospital Cards Grid (Matching reference screenshot card layout) */}
          {hospitalCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {hospitalCards.map((hospital, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                >
                  {/* Hospital Header Image & Name */}
                  <div>
                    <div className="h-28 bg-slate-100 relative overflow-hidden">
                      <img
                        src={hospital.image || 'https://images.unsplash.com/photo-1587354246490-7e29e31ecb58?auto=format&fit=crop&w=400&q=80'}
                        alt={hospital.name}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-3">
                        <div>
                          <h3 className="font-bold text-white text-sm leading-tight">{hospital.name}</h3>
                          <p className="text-[11px] text-slate-200">{hospital.district}, Bangladesh</p>
                        </div>
                      </div>
                    </div>

                    {/* Hospital Badges */}
                    <div className="p-3 border-b border-slate-100 flex items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Active
                      </span>
                    </div>

                    {/* Bed Breakdown Table inside Card */}
                    <div className="p-3 space-y-2 text-xs">
                      <div className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Bed Availability</div>
                      <div className="space-y-1.5">
                        {hospital.beds.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-emerald-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 w-10 text-[11px]">{b.bedType}</span>
                              <span className={`font-bold text-[11px] ${b.available > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {b.available} / {b.total} beds
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-slate-900 text-xs">৳ {b.rate.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="p-3 pt-0">
                    <button
                      onClick={() => handleOpenRequestModal(hospital.name, hospital.beds[0]?.bedType || 'ICU')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      View Details & Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200/80 text-center space-y-2">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Published Beds Found</h3>
              <p className="text-xs text-slate-500">There are currently no published bed availability records from HQ.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKINGS (CENTRE) */}
      {activeTab === 'my-bookings' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">My Bookings ({userCentreName})</h2>
            <button
              onClick={() => handleOpenRequestModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Request Booking
            </button>
          </div>

          {/* Status Tabs Filter */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
            {[
              { label: 'All', value: 'ALL', count: bookings.length },
              { label: 'Pending', value: 'PENDING', count: bookings.filter(b => b.status === 'PENDING').length },
              { label: 'Verifying', value: 'VERIFYING', count: bookings.filter(b => b.status === 'VERIFYING').length },
              { label: 'Confirmed', value: 'CONFIRMED', count: bookings.filter(b => b.status === 'CONFIRMED').length },
              { label: 'Admitted', value: 'ADMITTED', count: bookings.filter(b => b.status === 'ADMITTED').length },
              { label: 'Discharged', value: 'DISCHARGED', count: bookings.filter(b => b.status === 'DISCHARGED').length },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setBookingStatusTab(tab.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  bookingStatusTab === tab.value
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 bg-white/80 rounded-full text-[10px] font-bold">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Bookings Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Hospital</th>
                  <th className="py-2.5 px-3">Bed Type</th>
                  <th className="py-2.5 px-3">Status</th>
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
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">{row.createdAt}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedBooking(row)}
                          className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold transition-colors text-xs"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      No hospital bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST HOSPITAL BOOKING (CENTRE) */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-200" /> Request Hospital Booking (Centre)
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-100 hover:bg-emerald-900 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBookingSubmit} className="p-5 space-y-3.5 text-xs">
              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Booking Request Failed</span>
                    <span>{bookingError}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Member *</label>
                <select
                  value={requestForm.memberId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const found = members.find(m => m.id === id);
                    setRequestForm({
                      ...requestForm,
                      memberId: id,
                      memberName: found ? found.full_name : ''
                    });
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
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
                    value={selectedHospitalForModal}
                    onChange={(e) => setSelectedHospitalForModal(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
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
                    value={selectedBedTypeForModal}
                    onChange={(e) => setSelectedBedTypeForModal(e.target.value as BedType)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
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
                <label className="block font-bold text-slate-700 mb-1">Notes *</label>
                <textarea
                  rows={3}
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  placeholder="Patient requires ICU admission. Please allocate bed."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-emerald-500/20"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING DETAILS MODAL (NC VIEW) */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-200" /> Booking Details ({selectedBooking.id})
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-100 hover:bg-emerald-900 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">Booking Status:</span>
                {renderStatusBadge(selectedBooking.status)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Member:</span>
                  <span className="font-bold text-slate-900">{selectedBooking.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hospital:</span>
                  <span className="font-semibold text-slate-800">{selectedBooking.hospital}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bed Type:</span>
                  <span className="font-bold text-slate-900">{selectedBooking.bedType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested At:</span>
                  <span className="text-slate-700">{selectedBooking.createdAt}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Notes:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
                  {selectedBooking.notes || 'No notes provided'}
                </p>
              </div>

              {selectedBooking.hqNotes && (
                <div>
                  <span className="text-slate-500 block mb-1">HQ Response / Notes:</span>
                  <p className="p-2.5 bg-blue-50 text-blue-900 rounded-lg border border-blue-100 font-medium">
                    {selectedBooking.hqNotes}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
