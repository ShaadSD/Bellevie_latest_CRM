'use client';

import React, { useState, useEffect } from 'react';
import { 
  fetchAmbulanceRequestsApi, 
  deleteAmbulanceRequestApi,
  AmbulanceRequestItem, 
  AmbulanceStatus, 
  AmbulancePriority, 
  AmbulanceVehicleType 
} from '@/lib/ambulanceApi';
import { 
  FileText, 
  UserCheck, 
  Truck, 
  Navigation, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Eye, 
  MoreHorizontal, 
  Calendar,
  RotateCcw,
  Check,
  AlertTriangle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { AmbulanceDetailsDrawer } from './AmbulanceDetailsDrawer';
import { CreateAmbulanceModal } from './CreateAmbulanceModal';
import { getNetworkCentres, NetworkCentre } from '@/lib/networkApi';

export const HqAmbulanceView: React.FC = () => {
  const [requests, setRequests] = useState<AmbulanceRequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterVehicleType, setFilterVehicleType] = useState<string>('All');
  const [filterCentre, setFilterCentre] = useState<string>('All');
  const [centresList, setCentresList] = useState<NetworkCentre[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Menu State
  const [selectedRequest, setSelectedRequest] = useState<AmbulanceRequestItem | null>(null);
  const [editingRequest, setEditingRequest] = useState<AmbulanceRequestItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AmbulanceRequestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    getNetworkCentres({ is_active: true })
      .then((data) => {
        if (Array.isArray(data)) setCentresList(data);
      })
      .catch((err) => {
        console.warn('Failed to load network centres for ambulance filter:', err);
      });
  }, []);

  useEffect(() => {
    loadRequests();
  }, [filterStatus, filterCentre]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchAmbulanceRequestsApi({
        status: filterStatus !== 'All' ? filterStatus : undefined,
        centre: filterCentre !== 'All' ? filterCentre : undefined,
      });
      setRequests(data);
    } catch (err) {
      console.error('Failed to load ambulance requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateSuccess = async (savedRequest: AmbulanceRequestItem) => {
    await loadRequests();
    setToastMessage(`Request #${savedRequest.id} saved successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
    setEditingRequest(null);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      await deleteAmbulanceRequestApi(deleteConfirmItem.rawId, deleteConfirmItem.publicId);
      setToastMessage(`Request #${deleteConfirmItem.id} deleted successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteConfirmItem(null);
      await loadRequests();
    } catch (err: any) {
      console.error('Failed to delete request:', err);
      alert(err.message || 'Failed to delete request');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setFilterStatus('All');
    setFilterPriority('All');
    setFilterVehicleType('All');
    setFilterCentre('All');
    setSearchQuery('');
  };

  // Filter local items based on active selections
  const filteredItems = requests.filter(item => {
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;
    if (filterPriority !== 'All' && item.priority !== filterPriority) return false;
    if (filterVehicleType !== 'All' && item.vehicleType !== filterVehicleType) return false;
    if (filterCentre !== 'All') {
      const matchId = item.centreId !== undefined && item.centreId !== null && String(item.centreId) === filterCentre;
      const matchedCentre = centresList.find(c => String(c.id) === filterCentre);
      const matchName = matchedCentre && item.centre.toLowerCase().includes(matchedCentre.name.toLowerCase());
      if (!matchId && !matchName) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchMember = item.memberName.toLowerCase().includes(q) || item.memberCode.toLowerCase().includes(q);
      const matchCentre = item.centre.toLowerCase().includes(q);
      if (!matchId && !matchMember && !matchCentre) return false;
    }
    return true;
  });

  // Calculate Metrics from request pool
  const pendingCount = requests.filter(r => r.status === 'PENDING' || r.status === 'VERIFYING').length;
  const assignedCount = requests.filter(r => r.status === 'ASSIGNED').length;
  const dispatchedCount = requests.filter(r => r.status === 'DISPATCHED').length;
  const inTransitCount = requests.filter(r => r.status === 'IN_TRANSIT').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;
  const cancelledCount = requests.filter(r => r.status === 'CANCELLED' || r.status === 'REJECTED').length;

  const handleUpdateRequest = async (updated: AmbulanceRequestItem) => {
    setSelectedRequest(updated);
    await loadRequests();
  };

  const renderPriorityBadge = (p: AmbulancePriority) => {
    switch (p) {
      case 'Emergency':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">Emergency</span>;
      case 'High':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">High</span>;
      case 'Medium':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Medium</span>;
      default:
        return <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Low</span>;
    }
  };

  const renderStatusBadge = (s: AmbulanceStatus) => {
    switch (s) {
      case 'PENDING':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 tracking-wide">PENDING</span>;
      case 'VERIFYING':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-800 tracking-wide">VERIFYING</span>;
      case 'ASSIGNED':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 tracking-wide">ASSIGNED</span>;
      case 'DISPATCHED':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 tracking-wide">DISPATCHED</span>;
      case 'IN_TRANSIT':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-cyan-100 text-cyan-800 tracking-wide">IN_TRANSIT</span>;
      case 'COMPLETED':
        return <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 tracking-wide">COMPLETED</span>;
      default:
        return <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 tracking-wide">{s}</span>;
    }
  };

  const renderPaymentPill = (status: string, paid: number, total: number) => {
    if (status === 'Paid') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </span>
          <span>Paid</span>
          <span className="text-slate-500 font-normal">৳ {paid.toLocaleString()}</span>
        </div>
      );
    }
    if (status === 'Partial') {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 text-[9px] font-bold">
            !
          </span>
          <span>Partial</span>
          <span className="text-slate-500 font-normal">৳ {paid.toLocaleString()} / {total.toLocaleString()}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
        <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-[9px] font-bold">
          ✕
        </span>
        <span>Unpaid</span>
        <span className="text-slate-500 font-normal">৳ 0 / {total.toLocaleString()}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ambulance Requests
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage all ambulance requests from network centres
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search requests, members, centres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
          </div>
          <button
            onClick={() => {
              setEditingRequest(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Request</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* 1. Pending Verification */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {pendingCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">
              Pending Verification
            </div>
          </div>
        </div>

        {/* 2. Assigned */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {assignedCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">
              Assigned
            </div>
          </div>
        </div>

        {/* 3. Dispatched */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {dispatchedCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">
              Dispatched
            </div>
          </div>
        </div>

        {/* 4. In Transit */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {inTransitCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">
              In Transit
            </div>
          </div>
        </div>

        {/* 5. Completed */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {completedCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">
              Completed
            </div>
          </div>
        </div>

        {/* 6. Rejected / Cancelled */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {cancelledCount}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-tight">
              Rejected / Cancelled
            </div>
          </div>
        </div>

      </div>

      {/* Filter Bar Row */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        
        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFYING">VERIFYING</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="Emergency">Emergency</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Vehicle Type Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Vehicle Type:</span>
          <select
            value={filterVehicleType}
            onChange={(e) => setFilterVehicleType(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            <option value="ICU">ICU</option>
            <option value="AC">AC</option>
            <option value="Basic">Basic</option>
          </select>
        </div>

        {/* Centre Dropdown (Dynamic from Backend) */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Centre:</span>
          <select
            value={filterCentre}
            onChange={(e) => setFilterCentre(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Centres</option>
            {centresList.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <button className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 bg-white font-medium flex items-center gap-2 hover:bg-slate-50">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Date Range</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="ml-auto px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Centre</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Pickup Date & Time</th>
                <th className="py-3 px-4">Vehicle Type</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Loading ambulance requests...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No ambulance requests found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Request ID */}
                    <td className="py-3.5 px-4 font-bold text-blue-600 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRequest(item)}
                        className="hover:underline text-left"
                      >
                        {item.id}
                      </button>
                    </td>

                    {/* Member */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      <div>{item.memberName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">({item.memberCode})</div>
                    </td>

                    {/* Centre */}
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-medium">
                      {item.centre}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderPriorityBadge(item.priority)}
                    </td>

                    {/* Pickup Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                      <div>{item.pickupDate}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{item.pickupTime}</div>
                    </td>

                    {/* Vehicle Type */}
                    <td className="py-3.5 px-4 text-slate-800 font-semibold whitespace-nowrap">
                      {item.vehicleType}
                    </td>

                    {/* Payment */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderPaymentPill(item.paymentStatus, item.paidAmount, item.estimatedFare)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Actions with 3-Dot Dropdown Menu */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center relative">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Request Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Actions menu"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openMenuId === item.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-20" 
                                onClick={() => setOpenMenuId(null)} 
                              />
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-30 py-1.5 text-xs text-left animate-fadeIn">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setSelectedRequest(item);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setEditingRequest(item);
                                    setIsCreateModalOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                                >
                                  <Edit className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Edit Request</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setDeleteConfirmItem(item);
                                  }}
                                  className="w-full px-3.5 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium border-t border-slate-100 mt-1 pt-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  <span>Delete Request</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Request Modal */}
      <CreateAmbulanceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRequest(null);
        }}
        onCreateSuccess={handleCreateOrUpdateSuccess}
        editRequest={editingRequest}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Ambulance Request</h3>
                <p className="text-xs text-slate-500">Request #{deleteConfirmItem.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete request for <strong className="text-slate-900">{deleteConfirmItem.memberName}</strong> ({deleteConfirmItem.centre})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Side Drawer */}
      <AmbulanceDetailsDrawer
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        isHqView={true}
        onUpdateRequest={handleUpdateRequest}
      />
    </div>
  );
};
