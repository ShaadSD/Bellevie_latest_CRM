'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Stethoscope, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  User, 
  Calendar,
  Info,
  X
} from 'lucide-react';
import { ApiHomecareRequest, ApiHomecareStatus, homecareRequestsApi, homecareServiceApi, ApiHomecareService } from '@/lib/homecareApi';
import { HomecareDetailsDrawer } from './HomecareDetailsDrawer';
import { CreateHomecareModal } from './CreateHomecareModal';

interface NcHomecareViewProps {
  userCentreName?: string;
}

const statusStyles: Record<ApiHomecareStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  VERIFYING: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  ASSIGNED: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  CONFIRMED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  COMPLETED: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
  REJECTED: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
  CANCELLED: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const getDisplayId = (req: ApiHomecareRequest) => {
  if (req.member_public_id) return req.member_public_id;
  if (req.member) return `BV-${req.member}`;
  if (req.public_id && req.public_id.includes('-') && req.public_id.length > 12) {
    return `HC-${req.public_id.substring(0, 8).toUpperCase()}`;
  }
  return req.public_id || `HC-${req.id}`;
};

export const NcHomecareView: React.FC<NcHomecareViewProps> = ({
  userCentreName = 'Mirpur Centre',
}) => {
  const [requests, setRequests] = useState<ApiHomecareRequest[]>([]);
  const [servicesList, setServicesList] = useState<ApiHomecareService[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'my_requests' | 'services'>('dashboard');
  
  // Modals & Details Drawer
  const [selectedRequest, setSelectedRequest] = useState<ApiHomecareRequest | null>(null);
  const [selectedCatalogService, setSelectedCatalogService] = useState<ApiHomecareService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const refreshData = () => {
    homecareRequestsApi.getRequests()
      .then(res => setRequests(Array.isArray(res) ? res : []))
      .catch(err => { console.error(err); setRequests([]); });
    homecareServiceApi.getAllServices({ is_active: true, is_published: true })
      .then(res => setServicesList(Array.isArray(res) ? res : []))
      .catch(err => { console.error(err); setServicesList([]); });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const safeRequests = Array.isArray(requests) ? requests : [];
  const safeServices = Array.isArray(servicesList) ? servicesList : [];

  const kpis = {
    myRequests: safeRequests.length,
    pending: safeRequests.filter(r => r.status === 'PENDING').length,
    confirmed: safeRequests.filter(r => r.status === 'CONFIRMED').length,
    completed: safeRequests.filter(r => r.status === 'COMPLETED').length,
  };

  const handleOpenDetails = (req: ApiHomecareRequest) => {
    setSelectedRequest(req);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Network Centre Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            Homecare Service Dispatch ({userCentreName})
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Book medical home visits, track patient timelines, and manage local centre bookings
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Homecare Request
        </button>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Centre Dashboard
        </button>

        <button
          onClick={() => setActiveSubTab('my_requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'my_requests'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          My Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveSubTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'services'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Services Catalog
        </button>
      </div>

      {/* SUB TAB 1: CENTRE DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900 block">{kpis.myRequests}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1 block">My Requests</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-amber-700 block">{kpis.pending}</span>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide mt-1 block">Pending</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-emerald-700 block">{kpis.confirmed}</span>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide mt-1 block">Confirmed</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-teal-50/80 border border-teal-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-3xl font-black text-teal-700 block">{kpis.completed}</span>
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wide mt-1 block">Completed</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Recent Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Centre Requests</h3>
                <p className="text-xs text-slate-500">Latest homecare requests logged at {userCentreName}</p>
              </div>
              <button
                onClick={() => setActiveSubTab('my_requests')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-4 font-mono"># MEMBER PUBLIC ID</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {safeRequests.map((req) => {
                    const style = statusStyles[req.status];
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{getDisplayId(req)}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{req.member_name || `Member #${req.member}`}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{req.service_name}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {req.status_display || req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenDetails(req)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                          >
                            Details
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

      {/* SUB TAB 2: MY REQUESTS */}
      {activeSubTab === 'my_requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Centre Requests List</h3>
              <p className="text-xs text-slate-500">Track real-time updates and timeline for your members</p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Homecare Request
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="py-3.5 px-4 font-mono"># MEMBER PUBLIC ID</th>
                  <th className="py-3.5 px-4">Member Name</th>
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
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{getDisplayId(req)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{req.member_name || `Member #${req.member}`}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{req.service_name}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {req.staff_name || 'Pending Assignment'}
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
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                        >
                          View Details
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

      {/* SUB TAB 3: SERVICES CATALOG */}
      {activeSubTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Choose Homecare Service</h3>
            <p className="text-xs text-slate-500">Active and Published Services Catalog</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {safeServices.map((srv) => (
              <div
                key={srv.id}
                className="h-full min-w-0 p-6 border border-slate-200 hover:border-blue-500 rounded-2xl bg-white hover:shadow-xl transition-all flex flex-col group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {srv.duration_minutes ? `${srv.duration_minutes} min` : 'Flex min'}
                  </span>
                </div>

                <div className="mt-4 flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-lg">{srv.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{srv.category_name || srv.category}</p>
                  {srv.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 overflow-hidden mt-2 min-h-[3.75rem] bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-5">
                      {srv.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-4">
                  <span className="text-base font-black text-blue-700">৳{srv.base_price}</span>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCatalogService(srv)}
                      className="px-3 py-2 border border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(true)}
                      className="px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawers and Modals */}
      <HomecareDetailsDrawer
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={selectedRequest}
        isHqView={false}
        onOpenAssignStaff={() => {}}
        onOpenConfirmService={() => {}}
        onRefreshData={refreshData}
      />

      <CreateHomecareModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={refreshData}
      />

      {/* Service Details Modal Popup in Catalog */}
      {selectedCatalogService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCatalogService.name}</h3>
                  <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md mt-0.5">
                    Category: {selectedCatalogService.category_name || selectedCatalogService.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCatalogService(null)}
                className="p-1.5 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {selectedCatalogService.duration_minutes ? `${selectedCatalogService.duration_minutes} min` : 'Flexible'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="text-[11px] font-semibold text-blue-600 uppercase">Base Price</div>
                  <div className="text-base font-black text-blue-700 mt-0.5">
                    ৳{selectedCatalogService.base_price}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">Service Description</h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedCatalogService.description || 'No specific description provided for this service.'}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedCatalogService(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCatalogService(null);
                  setIsCreateOpen(true);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                Book This Service
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
