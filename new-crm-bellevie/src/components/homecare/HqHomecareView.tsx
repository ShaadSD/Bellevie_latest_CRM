'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Search, 
  Stethoscope, 
  ChevronRight
} from 'lucide-react';
import { ApiHomecareRequest, ApiHomecareStatus, homecareRequestsApi } from '@/lib/homecareApi';
import { HomecareDetailsDrawer } from './HomecareDetailsDrawer';
import { AssignStaffModal } from './AssignStaffModal';
import { ConfirmServiceModal } from './ConfirmServiceModal';
import { ManageServicesSection } from './ManageServicesModal';
import { CreateHomecareModal } from './CreateHomecareModal';

const statusStyles: Record<ApiHomecareStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  VERIFYING: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  ASSIGNED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  CONFIRMED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  COMPLETED: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
  REJECTED: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  CANCELLED: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export const HqHomecareView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'services'>('dashboard');
  const [requests, setRequests] = useState<ApiHomecareRequest[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedRequest, setSelectedRequest] = useState<ApiHomecareRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [isConfirmServiceOpen, setIsConfirmServiceOpen] = useState(false);

  const refreshData = () => {
    homecareRequestsApi.getRequests({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: searchTerm || undefined,
    }).then(res => setRequests(Array.isArray(res) ? res : [])).catch(err => {
      console.error(err);
      setRequests([]);
    });
  };

  useEffect(() => {
    refreshData();
  }, [statusFilter, searchTerm]);

  const safeRequests = Array.isArray(requests) ? requests : [];

  // Calculate KPIs directly from backend API requests data
  const kpiCounts = {
    pending: safeRequests.filter(r => r.status === 'PENDING').length,
    verifying: safeRequests.filter(r => r.status === 'VERIFYING').length,
    assigned: safeRequests.filter(r => r.status === 'ASSIGNED').length,
    confirmed: safeRequests.filter(r => r.status === 'CONFIRMED').length,
    completed: safeRequests.filter(r => r.status === 'COMPLETED').length,
    rejected: safeRequests.filter(r => r.status === 'REJECTED').length,
    cancelled: safeRequests.filter(r => r.status === 'CANCELLED').length,
  };

  const handleOpenDetails = (req: ApiHomecareRequest) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            Homecare Management Module (HQ Admin)
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Overview, request dispatching, and service catalog configuration
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          HQ Dashboard
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Requests List ({safeRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'services'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Services Management
        </button>
      </div>

      {/* TAB 1: HQ DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl shadow-xs text-center">
              <span className="text-2xl font-black text-amber-700 block">{kpiCounts.pending}</span>
              <span className="text-[11px] font-bold text-amber-800 tracking-wide uppercase mt-0.5 block">Pending</span>
            </div>

            <div className="bg-yellow-50/80 border border-yellow-200 p-4 rounded-xl shadow-xs text-center">
              <span className="text-2xl font-black text-yellow-700 block">{kpiCounts.verifying}</span>
              <span className="text-[11px] font-bold text-yellow-800 tracking-wide uppercase mt-0.5 block">Verifying</span>
            </div>

            <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl shadow-xs text-center">
              <span className="text-2xl font-black text-blue-700 block">{kpiCounts.assigned}</span>
              <span className="text-[11px] font-bold text-blue-800 tracking-wide uppercase mt-0.5 block">Assigned</span>
            </div>

            <div className="bg-teal-50/80 border border-teal-200 p-4 rounded-xl shadow-xs text-center">
              <span className="text-2xl font-black text-teal-700 block">{kpiCounts.confirmed}</span>
              <span className="text-[11px] font-bold text-teal-800 tracking-wide uppercase mt-0.5 block">Confirmed</span>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl shadow-xs text-center">
              <span className="text-2xl font-black text-emerald-700 block">{kpiCounts.completed}</span>
              <span className="text-[11px] font-bold text-emerald-800 tracking-wide uppercase mt-0.5 block">Completed</span>
            </div>

            <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-xl shadow-xs text-center">
              <span className="text-2xl font-black text-rose-700 block">{kpiCounts.rejected}</span>
              <span className="text-[11px] font-bold text-rose-800 tracking-wide uppercase mt-0.5 block">Rejected</span>
            </div>

            <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl shadow-xs text-center">
              <span className="text-2xl font-black text-slate-700 block">{kpiCounts.cancelled}</span>
              <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase mt-0.5 block">Cancelled</span>
            </div>
          </div>

          {/* Today's Homecare Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Today's Homecare Schedule</h3>
                <p className="text-xs text-slate-500">Live operational timetable for assigned homecare staff</p>
              </div>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All Requests <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4"># MEMBER PUBLIC ID</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Centre</th>
                    <th className="py-3 px-4">Assigned Staff</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {safeRequests.slice(0, 5).map((req) => {
                    const style = statusStyles[req.status];
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {req.member_public_id || (req.member ? `BV-${req.member}` : req.public_id)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-blue-900">{req.service_name}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{req.member_name || `Member #${req.member}`}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{req.centre_name || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {req.staff_name || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {req.status_display || req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenDetails(req)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition-colors"
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
      )}

      {/* TAB 2: REQUESTS LIST */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Homecare Requests Master Table</h3>
              <p className="text-xs text-slate-500">Filter, verify, assign staff, and manage homecare service dispatch</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFYING">Verifying</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search member / staff / service / ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-mono"># MEMBER PUBLIC ID</th>
                  <th className="py-3.5 px-4">Member</th>
                  <th className="py-3.5 px-4">Centre</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {safeRequests.map((req) => {
                  const style = statusStyles[req.status];
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {req.member_public_id || (req.member ? `BV-${req.member}` : req.public_id)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{req.member_name || `Member #${req.member}`}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{req.centre_name || '-'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{req.service_name}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{req.staff_name || 'Unassigned'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {req.status_display || req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(req)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
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
      )}

      {/* TAB 3: SERVICES MANAGEMENT */}
      {activeTab === 'services' && <ManageServicesSection />}

      {/* Drawers & Modals */}
      <HomecareDetailsDrawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={selectedRequest}
        isHqView={true}
        onOpenAssignStaff={() => setIsAssignStaffOpen(true)}
        onOpenConfirmService={() => setIsConfirmServiceOpen(true)}
        onRefreshData={refreshData}
      />

      <AssignStaffModal
        isOpen={isAssignStaffOpen}
        onClose={() => setIsAssignStaffOpen(false)}
        request={selectedRequest}
        onStaffAssigned={refreshData}
      />

      <ConfirmServiceModal
        isOpen={isConfirmServiceOpen}
        onClose={() => setIsConfirmServiceOpen(false)}
        request={selectedRequest}
        onServiceConfirmed={refreshData}
      />

    </div>
  );
};
