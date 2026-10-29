'use client';

import React, { useState, useEffect } from 'react';
import { 
  fetchAmbulanceRequestsApi, 
  deleteAmbulanceRequestApi,
  AmbulanceRequestItem, 
  AmbulanceStatus, 
  AmbulancePriority 
} from '@/lib/ambulanceApi';
import { 
  Plus, 
  Search, 
  Eye, 
  MoreHorizontal, 
  Check, 
  Send,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { CreateAmbulanceModal } from './CreateAmbulanceModal';
import { AmbulanceDetailsDrawer } from './AmbulanceDetailsDrawer';

interface NcAmbulanceViewProps {
  userCentreName?: string;
}

export const NcAmbulanceView: React.FC<NcAmbulanceViewProps> = ({
  userCentreName = 'Mirpur Centre'
}) => {
  const [requests, setRequests] = useState<AmbulanceRequestItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Tabs for NC: All Requests, Pending, Assigned, In Transit, Completed, Cancelled
  const [activeTab, setActiveTab] = useState<string>('All Requests');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Drawers / Menu State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AmbulanceRequestItem | null>(null);
  const [editingRequest, setEditingRequest] = useState<AmbulanceRequestItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AmbulanceRequestItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchAmbulanceRequestsApi();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load NC ambulance requests', err);
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

  const handleUpdateRequest = async (updated: AmbulanceRequestItem) => {
    setSelectedRequest(updated);
    await loadRequests();
  };

  // Filter requests by tab & search query
  const filteredRequests = requests.filter(item => {
    if (activeTab === 'Pending' && item.status !== 'PENDING' && item.status !== 'VERIFYING') return false;
    if (activeTab === 'Assigned' && item.status !== 'ASSIGNED') return false;
    if (activeTab === 'In Transit' && item.status !== 'IN_TRANSIT' && item.status !== 'DISPATCHED') return false;
    if (activeTab === 'Completed' && item.status !== 'COMPLETED') return false;
    if (activeTab === 'Cancelled' && item.status !== 'CANCELLED' && item.status !== 'REJECTED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchMember = item.memberName.toLowerCase().includes(q) || item.memberCode.toLowerCase().includes(q);
      if (!matchId && !matchMember) return false;
    }
    return true;
  });

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

  const tabs = ['All Requests', 'Pending', 'Assigned', 'In Transit', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Main Action Button */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Requests ({userCentreName})
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage and request emergency ambulance services for centre members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingRequest(null);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Request Ambulance</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Header matching Network Centre View screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search members, my requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Pickup Date & Time</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Loading requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No requests found in tab "{activeTab}". Click "+ Request Ambulance" to create one.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => {
                  const canEditDelete = item.status === 'PENDING';

                  return (
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

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderPriorityBadge(item.priority)}
                      </td>

                      {/* Pickup Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                        <div>{item.pickupDate}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{item.pickupTime}</div>
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

                                  {canEditDelete ? (
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
                                  ) : (
                                    <button
                                      disabled
                                      className="w-full px-3.5 py-2 text-slate-400 bg-slate-50/50 flex items-center gap-2 font-medium cursor-not-allowed"
                                      title="Only pending requests can be edited by NC"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-slate-300" />
                                      <span>Edit Request</span>
                                      <span className="text-[9px] text-slate-400 ml-auto font-normal">(Locked)</span>
                                    </button>
                                  )}

                                  {canEditDelete ? (
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
                                  ) : (
                                    <button
                                      disabled
                                      className="w-full px-3.5 py-2 text-slate-400 bg-slate-50/50 flex items-center gap-2 font-medium border-t border-slate-100 mt-1 pt-1.5 cursor-not-allowed"
                                      title="Only pending requests can be deleted by NC"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-slate-300" />
                                      <span>Delete Request</span>
                                      <span className="text-[9px] text-slate-400 ml-auto font-normal">(Locked)</span>
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
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

      {/* Create / Edit Ambulance Request Form Modal */}
      <CreateAmbulanceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRequest(null);
        }}
        onCreateSuccess={handleCreateOrUpdateSuccess}
        userCentreName={userCentreName}
        editRequest={editingRequest}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Ambulance Request</h3>
                <p className="text-xs text-slate-500">Request #{deleteConfirmItem.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete request for <strong className="text-slate-900">{deleteConfirmItem.memberName}</strong>? This action cannot be undone.
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
        isHqView={false}
        onUpdateRequest={handleUpdateRequest}
      />
    </div>
  );
};
