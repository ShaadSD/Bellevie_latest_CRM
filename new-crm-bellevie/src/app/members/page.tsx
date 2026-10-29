'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initialMembersData, Member } from '@/data/membersData';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MemberDrawer } from '@/components/MemberDrawer';
import { RegisterMemberModal } from '@/components/RegisterMemberModal';
import { DigitalHealthTwinView } from '@/components/DigitalHealthTwinView';
import { hqDashboardData, ncDashboardData } from '@/data/dashboardData';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  ChevronRight as BreadcrumbArrow,
  Loader2,
  Activity
} from 'lucide-react';
import { 
  fetchMembersList, 
  getMembersMetrics, 
  fetchCentresList,
  fetchPartnersList,
  ApiMember,
  NetworkCentre,
  NetworkPartner
} from '@/lib/membersApi';
import { useAuth } from '@/context/AuthContext';

export default function MembersPage() {
  const { user } = useAuth();
  const currentView = user?.role === 'NC' ? 'NC' : 'HQ';
  const isNcView = currentView === 'NC';

  const activeConfig = isNcView ? ncDashboardData : hqDashboardData;

  const [members, setMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [inactiveCount, setInactiveCount] = useState<number>(0);
  const [centresCount, setCentresCount] = useState<number>(0);

  // Closed by default; opens ONLY when user clicks a row or view icon
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [digitalTwinMember, setDigitalTwinMember] = useState<Member | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCentre, setFilterCentre] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [centresList, setCentresList] = useState<NetworkCentre[]>([]);
  const [partnersList, setPartnersList] = useState<NetworkPartner[]>([]);
  const partnersMapRef = useRef<Record<number, string>>({});

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Map Django ApiMember to UI Model
  const mapApiMemberToUi = (m: ApiMember, partnerMap: Record<number | string, string> = {}): Member => {
    const fullName = m.full_name || 'Member';
    const centreName =
      m.assigned_centre_name ||
      m.registered_centre_name ||
      (m.assigned_centre ? `Centre #${m.assigned_centre}` : 'HQ (Direct)');
    
    // Resolve partner name from direct field, object, or lookup map
    const partnerId = m.partner ? Number(m.partner) : null;
    let partnerName = 
      m.partner_name || 
      (m as any).partner_display ||
      (m as any).partner_detail?.name ||
      (m as any).partner_info?.name ||
      (typeof m.partner === 'object' && (m.partner as any)?.name);

    if (!partnerName && partnerId && !isNaN(partnerId)) {
      partnerName = partnerMap[partnerId] || partnerMap[String(partnerId)];
    }

    if (!partnerName && m.partner) {
      partnerName = `Plan Holder #${m.partner}`;
    }

    if (!partnerName) {
      partnerName = '-';
    }

    const registeredBy = m.registered_by_name || (m.registered_by ? `User #${m.registered_by}` : '-');

    return {
      id: m.id,
      memberId: m.public_id || `BV-${m.id}`,
      name: fullName,
      phone: m.phone || '-',
      email: m.email || '-',
      gender: m.gender === 'FEMALE' ? 'Female' : 'Male',
      centre: centreName,
      partner: partnerName,
      status: m.is_active ? 'Active' : 'Inactive',
      dateOfBirth: m.date_of_birth || undefined,
      address: m.address || undefined,
      registeredBy: registeredBy,
      registeredOn: m.created_at ? m.created_at.replace('T', ' ').substring(0, 16) : undefined,
      avatarColor: m.gender === 'FEMALE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600',
    };
  };

  // Load API Metrics, Centres List, and Partners List
  const loadMetricsAndCentres = useCallback(async () => {
    try {
      const metrics = await getMembersMetrics();
      if (metrics) {
        setTotalCount(metrics.totalMembers);
        setActiveCount(metrics.activeMembers);
        setInactiveCount(metrics.inactiveMembers);
        setCentresCount(metrics.totalCentres || 12);
      }
      const [cRes, pRes] = await Promise.all([
        fetchCentresList(),
        fetchPartnersList(),
      ]);
      setCentresList(Array.isArray(cRes) ? cRes : cRes?.results || []);
      const pList = Array.isArray(pRes) ? pRes : pRes?.results || [];
      const pMap: Record<number, string> = {};
      pList.forEach((p) => { pMap[p.id] = p.name; });
      partnersMapRef.current = pMap;
      setPartnersList(pList);
    } catch (err) {
      console.warn('API metrics fallback:', err);
    }
  }, []);

  // Load Members List from GET /api/members/
  const loadMembers = useCallback(async () => {
    setIsLoadingApi(true);
    try {
      // Ensure partnersMapRef is populated before mapping members
      if (Object.keys(partnersMapRef.current).length === 0) {
        try {
          const pRes = await fetchPartnersList();
          const pList = Array.isArray(pRes) ? pRes : pRes?.results || [];
          const pMap: Record<number, string> = {};
          pList.forEach((p) => { pMap[p.id] = p.name; });
          partnersMapRef.current = pMap;
        } catch (err) {
          console.warn('Could not fetch partners lookup:', err);
        }
      }

      const statusParam = filterStatus === 'Active' ? true : filterStatus === 'Inactive' ? false : undefined;
      const centreParam = !isNcView && filterCentre !== 'All' ? filterCentre : undefined;

      const res = await fetchMembersList({
        search: searchQuery || undefined,
        is_active: statusParam,
        assigned_centre: centreParam,
        page: currentPage,
      });

      if (res && 'results' in res && Array.isArray(res.results)) {
        const mapped = res.results.map((m) => mapApiMemberToUi(m, partnersMapRef.current));
        setMembers(mapped);
        setTotalCount(res.count);
      } else if (Array.isArray(res)) {
        const mapped = res.map((m) => mapApiMemberToUi(m, partnersMapRef.current));
        setMembers(mapped);
        setTotalCount(mapped.length);
      }
    } catch (err) {
      console.warn('Backend API offline or unreachable', err);
    } finally {
      setIsLoadingApi(false);
    }
  }, [searchQuery, filterCentre, filterStatus, currentPage, isNcView]);

  useEffect(() => {
    loadMetricsAndCentres();
    loadMembers();
  }, [loadMetricsAndCentres, loadMembers]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(members.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans antialiased text-slate-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        collapsed={sidebarCollapsed}
        activeItem="Members"
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          config={activeConfig}
          currentView={currentView}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content Body with Right Drawer Flex Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {digitalTwinMember ? (
            <DigitalHealthTwinView
              member={digitalTwinMember}
              onBack={() => setDigitalTwinMember(null)}
            />
          ) : (
          /* Main Table Content */
          <main className="flex-1 p-6 space-y-5 overflow-y-auto min-w-0">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="hover:text-slate-800 cursor-pointer">Members</span>
              <BreadcrumbArrow className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-bold">
                {isNcView ? 'My Members' : 'All Members'}
              </span>
            </div>

            {/* Title & Controls Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {isNcView ? 'My Members' : 'All Members'}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isNcView ? "View and manage your centre's members" : 'View and manage all members across all centres'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by name, phone, public ID..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                </div>

                {/* Status Filter Dropdown */}
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>

                {/* Centre Filter Dropdown (HQ View Only - HQ Option Removed) */}
                {!isNcView && (
                  <div className="relative">
                    <select
                      value={filterCentre}
                      onChange={(e) => {
                        setFilterCentre(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="All">All Centres</option>
                      {centresList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                )}

                {/* Register Member Primary Button */}
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Member</span>
                </button>
              </div>
            </div>

            {/* Top Stat Cards (Interactive for HQ & NC views) */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isNcView ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
              <div 
                onClick={() => { setFilterStatus('All'); setCurrentPage(1); }}
                className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:border-blue-300 ${filterStatus === 'All' ? 'ring-2 ring-blue-500/20 bg-blue-50/10' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
                  <div className="text-xs font-medium text-slate-500">Total Members</div>
                </div>
              </div>

              <div 
                onClick={() => { setFilterStatus('Active'); setCurrentPage(1); }}
                className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:border-emerald-300 ${filterStatus === 'Active' ? 'ring-2 ring-emerald-500/20 bg-emerald-50/10' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{activeCount}</div>
                  <div className="text-xs font-medium text-slate-500">Active Members</div>
                </div>
              </div>

              <div 
                onClick={() => { setFilterStatus('Inactive'); setCurrentPage(1); }}
                className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:border-rose-300 ${filterStatus === 'Inactive' ? 'ring-2 ring-rose-500/20 bg-rose-50/10' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{inactiveCount}</div>
                  <div className="text-xs font-medium text-slate-500">Inactive Members</div>
                </div>
              </div>

              {!isNcView && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">{centresCount}</div>
                    <div className="text-xs font-medium text-slate-500">Centres</div>
                  </div>
                </div>
              )}
            </div>

            {/* Members Data Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="overflow-x-auto relative min-h-[300px]">
                {isLoadingApi && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                )}

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase text-[11px] select-none">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === members.length && members.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="py-3 px-3 text-slate-500">Member Public ID</th>
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Phone</th>
                      {!isNcView && <th className="py-3 px-3">Email</th>}
                      <th className="py-3 px-3">Gender</th>
                      {!isNcView && <th className="py-3 px-3">Centre</th>}
                      <th className="py-3 px-3">Plan Holder</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {members.map((row) => {
                      const isSelected = selectedIds.includes(row.id);
                      const isDrawerActive = selectedMember?.id === row.id;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedMember(row)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                            isDrawerActive ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOne(row.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>

                          {/* Member Public ID column using backend public_id (e.g. BV-1234455) */}
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {row.memberId}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                  row.avatarColor || 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                {row.name ? row.name[0].toUpperCase() : 'M'}
                              </div>
                              <span className="font-bold text-slate-900">{row.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-700 whitespace-nowrap">{row.phone}</td>
                          {!isNcView && <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">{row.email}</td>}
                          <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">{row.gender}</td>
                          {!isNcView && (
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${
                                  row.centre.includes('HQ')
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}
                              >
                                {row.centre}
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">{row.partner}</td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md ${
                                row.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDigitalTwinMember(row);
                                }}
                                className="px-2.5 py-1 text-[11px] font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                                title="View Digital Health Twin"
                              >
                                <Activity className="w-3.5 h-3.5 text-blue-600" />
                                <span>Digital Twin</span>
                              </button>
                              <button
                                onClick={() => setSelectedMember(row)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Member Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedMember(row)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Member"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Pagination */}
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Showing {members.length === 0 ? 0 : (currentPage - 1) * 10 + 1} to {(currentPage - 1) * 10 + members.length} of {totalCount} members
                </div>

                <div className="flex items-center gap-1.5 font-semibold">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentPage}
                  </button>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage * 10 >= totalCount}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </main>
          )}

          {/* Right Member Details Side Drawer (Opens ONLY when table row or Eye icon is clicked) */}
          {selectedMember && (
            <MemberDrawer
              member={selectedMember}
              onClose={() => setSelectedMember(null)}
              onRefreshList={loadMembers}
            />
          )}

        </div>
      </div>

      {/* Register Member Modal */}
      <RegisterMemberModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={() => {
          loadMembers();
          loadMetricsAndCentres();
        }}
      />
    </div>
  );
}
