'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Building2,
  FileText,
  Navigation,
  Ban,
  Check,
  Loader2,
  History as HistoryIcon
} from 'lucide-react';
import {
  AmbulanceRequestItem,
  ApiAmbulanceStatus,
  ApiAmbulanceProvider,
  ApiAmbulanceVehicle,
  ApiAmbulanceHistory,
  verifyAmbulanceRequestApi,
  assignAmbulanceRequestApi,
  updateTripStatusApi,
  rejectAmbulanceRequestApi,
  cancelAmbulanceRequestApi,
  fetchAmbulanceHistoryApi,
  fetchAmbulanceProvidersApi,
  fetchAmbulanceVehiclesApi
} from '@/lib/ambulanceApi';

interface AmbulanceDetailsDrawerProps {
  request: AmbulanceRequestItem | null;
  isOpen: boolean;
  onClose: () => void;
  isHqView?: boolean;
  onUpdateRequest?: (updated: AmbulanceRequestItem) => void;
}

export const AmbulanceDetailsDrawer: React.FC<AmbulanceDetailsDrawerProps> = ({
  request,
  isOpen,
  onClose,
  isHqView = true,
  onUpdateRequest
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'assignment' | 'payment' | 'history'>('details');

  // Providers & Vehicles dropdown state for Assignment
  const [providersList, setProvidersList] = useState<ApiAmbulanceProvider[]>([]);
  const [vehiclesList, setVehiclesList] = useState<ApiAmbulanceVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number>(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(5);
  const selectedVehicle = vehiclesList.find(v => v.id === selectedVehicleId);
  const [estimatedFareInput, setEstimatedFareInput] = useState<number>(3000);
  const [hqNotesInput, setHqNotesInput] = useState<string>('ICU ambulance assigned.');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // History timeline state
  const [historyList, setHistoryList] = useState<ApiAmbulanceHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sync state when request opens
  useEffect(() => {
    if (request && isOpen) {
      setEstimatedFareInput(request.estimatedFare || 3000);
      setHqNotesInput(request.hqNotes || `${request.vehicleType || 'Ambulance'} unit assigned.`);
      setActionError(null);
      loadProvidersAndVehicles();
      loadHistory();
    }
  }, [request, isOpen]);

  const loadVehiclesForProvider = async (providerId: number, targetType?: string) => {
    if (!providerId) return;
    setLoadingVehicles(true);
    try {
      const vehs = await fetchAmbulanceVehiclesApi({
        provider: providerId,
        fleet_status: 'READY',
        is_available: true
      });
      const matchingVehs = vehs.filter(v => Number(v.provider) === Number(providerId));
      setVehiclesList(matchingVehs);
      
      const reqType = (targetType || request?.vehicleType || '').toUpperCase();
      const matchedVeh = matchingVehs.find(v => v.vehicle_type?.toUpperCase() === reqType);
      if (matchedVeh) {
        setSelectedVehicleId(matchedVeh.id);
      } else if (matchingVehs.length > 0) {
        setSelectedVehicleId(matchingVehs[0].id);
      } else {
        setSelectedVehicleId(0);
      }
    } catch (err) {
      setVehiclesList([]);
      setSelectedVehicleId(0);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadProvidersAndVehicles = async () => {
    try {
      const provs = await fetchAmbulanceProvidersApi({ is_approved: true, is_active: true });
      setProvidersList(provs);
      
      const initialProvId = request?.providerId || (provs.length > 0 ? provs[0].id : 1);
      setSelectedProviderId(initialProvId);
      await loadVehiclesForProvider(initialProvId, request?.vehicleType);
    } catch (e) { }
  };

  const handleProviderSelectChange = async (provId: number) => {
    setSelectedProviderId(provId);
    await loadVehiclesForProvider(provId, request?.vehicleType);
  };

  const loadHistory = async () => {
    if (!request) return;
    setLoadingHistory(true);
    try {
      const logs = await fetchAmbulanceHistoryApi(request.rawId, request.publicId);
      setHistoryList(logs);
    } catch (e) {
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !request) return null;

  // Action Handlers
  const handleVerify = async () => {
    setActionError(null);
    setIsSubmittingAction(true);
    try {
      const updated = await verifyAmbulanceRequestApi(request.rawId, request.publicId);
      onUpdateRequest?.(updated);
    } catch (err: any) {
      console.error('Verify API failed:', err);
      setActionError(err.message || 'Failed to verify request on backend API');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!selectedProviderId) {
      setActionError('Please select a service provider');
      return;
    }
    if (!selectedVehicleId) {
      setActionError('Please select a valid fleet vehicle');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const updated = await assignAmbulanceRequestApi(
        request.rawId,
        {
          provider: selectedProviderId,
          vehicle: selectedVehicleId,
          estimated_fare: String(estimatedFareInput || 0),
          hq_notes: hqNotesInput
        },
        request.publicId
      );
      onUpdateRequest?.(updated);
      setActiveTab('details');
    } catch (err: any) {
      console.error('Assign API failed:', err);
      setActionError(err.message || 'Failed to assign ambulance on backend API. Please check vehicle availability.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAdvanceStatus = async () => {
    setActionError(null);
    setIsSubmittingAction(true);
    try {
      const updated = await updateTripStatusApi(request.rawId, request.publicId);
      onUpdateRequest?.(updated);
    } catch (err: any) {
      console.error('Update status API failed:', err);
      setActionError(err.message || 'Failed to update trip status on backend API');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    setIsSubmittingAction(true);
    try {
      const updated = await cancelAmbulanceRequestApi(request.rawId, request.publicId);
      onUpdateRequest?.(updated);
    } catch (err: any) {
      console.error('Cancel API failed:', err);
      setActionError(err.message || 'Failed to cancel request on backend API');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    setActionError(null);
    setIsSubmittingAction(true);
    try {
      const updated = await rejectAmbulanceRequestApi(request.rawId, hqNotesInput, request.publicId);
      onUpdateRequest?.(updated);
    } catch (err: any) {
      console.error('Reject API failed:', err);
      setActionError(err.message || 'Failed to reject request on backend API');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const renderPriorityBadge = (p: string) => {
    switch (p) {
      case 'Emergency':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">Emergency</span>;
      case 'High':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">High</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">Low</span>;
    }
  };

  const renderStatusBadge = (s: ApiAmbulanceStatus) => {
    switch (s) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">PENDING</span>;
      case 'VERIFYING':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-sky-100 text-sky-800">VERIFYING</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800">ASSIGNED</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">DISPATCHED</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-cyan-100 text-cyan-800">IN_TRANSIT</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800">{s}</span>;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Request Details ({isHqView ? 'HQ Admin' : 'Network Centre'})
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/30 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === 'details'
              ? 'border-blue-600 text-blue-600 font-bold bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('assignment')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === 'assignment'
              ? 'border-blue-600 text-blue-600 font-bold bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Assignment
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === 'payment'
              ? 'border-blue-600 text-blue-600 font-bold bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Payment
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${activeTab === 'history'
              ? 'border-blue-600 text-blue-600 font-bold bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Status History
        </button>
      </div>

      {/* Action Quick Bar */}
      <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <span>Current Status:</span>
          {renderStatusBadge(request.status)}
        </div>

        <div className="flex items-center gap-2">
          {/* HQ Verify Action */}
          {isHqView && request.status === 'PENDING' && (
            <button
              onClick={handleVerify}
              disabled={isSubmittingAction}
              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Verify Request
            </button>
          )}

          {/* HQ Advance Status Action */}
          {isHqView && (request.status === 'ASSIGNED' || request.status === 'DISPATCHED' || request.status === 'IN_TRANSIT') && (
            <button
              onClick={handleAdvanceStatus}
              disabled={isSubmittingAction}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>
                {request.status === 'ASSIGNED' && 'Dispatch Ambulance'}
                {request.status === 'DISPATCHED' && 'Mark In Transit'}
                {request.status === 'IN_TRANSIT' && 'Complete Trip'}
              </span>
            </button>
          )}

          {/* Cancel Action */}
          {(request.status === 'PENDING' || (isHqView && (request.status === 'VERIFYING' || request.status === 'ASSIGNED'))) && (
            <button
              onClick={handleCancel}
              disabled={isSubmittingAction}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1"
            >
              <Ban className="w-3.5 h-3.5 text-slate-500" />
              Cancel
            </button>
          )}

          {/* HQ Reject Action */}
          {isHqView && (request.status === 'PENDING' || request.status === 'VERIFYING') && (
            <button
              onClick={handleReject}
              disabled={isSubmittingAction}
              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[11px] flex items-center gap-1"
            >
              Reject
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <div className="space-y-6">

            {/* 1. Request Information Card */}
            <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                Request Information
              </h3>

              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                <div className="text-slate-500">Request ID</div>
                <div className="font-bold text-blue-600">{request.id}</div>

                <div className="text-slate-500">Member</div>
                <div className="font-semibold text-slate-900">{request.memberName}</div>

                <div className="text-slate-500">Centre</div>
                <div className="font-medium text-slate-800">
                  {request.centre.toLowerCase().includes('centre') || request.centre.toLowerCase().includes('center')
                    ? request.centre
                    : `${request.centre} Centre`}
                </div>

                <div className="text-slate-500">Pickup Address</div>
                <div className="font-medium text-slate-800 leading-snug">{request.pickupAddress}</div>

                <div className="text-slate-500">Destination</div>
                <div className="font-medium text-slate-800 leading-snug">{request.destinationAddress}</div>

                <div className="text-slate-500">Pickup Date & Time</div>
                <div className="font-medium text-slate-800">{request.pickupDate}, {request.pickupTime}</div>

                <div className="text-slate-500">Vehicle Type</div>
                <div className="font-semibold text-slate-800">{request.vehicleType} Ambulance</div>

                <div className="text-slate-500">Priority</div>
                <div>{renderPriorityBadge(request.priority)}</div>

                <div className="text-slate-500">Status</div>
                <div>{renderStatusBadge(request.status)}</div>

                <div className="text-slate-500">Requested By</div>
                <div className="font-medium text-slate-800">{request.requestedBy}</div>

                <div className="text-slate-500">Notes</div>
                <div className="italic text-slate-700">{request.notes || '-'}</div>

                {request.hqNotes && (
                  <>
                    <div className="text-slate-500">HQ Notes</div>
                    <div className="italic text-purple-700 font-medium">{request.hqNotes}</div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Payment Information Card */}
            <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payment Information
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                <div className="text-slate-500">Payment Status</div>
                <div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${request.paymentStatus === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : request.paymentStatus === 'Partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {request.paymentStatus}
                  </span>
                </div>

                <div className="text-slate-500">Paid Amount</div>
                <div className="font-bold text-slate-900">৳ {request.paidAmount.toLocaleString()}</div>

                <div className="text-slate-500">Estimated Fare</div>
                <div className="font-bold text-slate-900">
                  {request.estimatedFare ? `৳ ${request.estimatedFare.toLocaleString()}` : 'Pending HQ Assignment'}
                </div>

                <div className="text-slate-500">Due Amount</div>
                <div className="font-bold text-amber-700">
                  {request.dueAmount ? `৳ ${request.dueAmount.toLocaleString()}` : '--'}
                </div>

                <div className="text-slate-500">Payment Method</div>
                <div className="font-medium text-slate-800">{request.paymentMethod}</div>

                <div className="text-slate-500">Payment Notes</div>
                <div className="italic text-slate-700">{request.paymentNotes || '-'}</div>

                <div className="text-slate-500">Payment Recorded By</div>
                <div className="font-medium text-slate-800">{request.paymentRecordedBy}</div>

                <div className="text-slate-500">Payment Recorded At</div>
                <div className="text-slate-600">{request.paymentRecordedAt}</div>
              </div>
            </div>

            {/* 3. Assignment Information Card */}
            <div className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" />
                  Assignment Information
                </h3>
                {isHqView && (
                  <button
                    onClick={() => setActiveTab('assignment')}
                    className="px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Edit className="w-3 h-3 text-slate-500" />
                    Assign
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                <div className="text-slate-500">Service Provider</div>
                <div className="font-semibold text-slate-900">{request.provider || '--'}</div>

                {request.providerPhone && (
                  <>
                    <div className="text-slate-500">Provider Phone</div>
                    <div className="font-medium text-slate-800">{request.providerPhone}</div>
                  </>
                )}

                {request.providerEmergencyPhone && (
                  <>
                    <div className="text-slate-500">Emergency Phone</div>
                    <div className="font-medium text-slate-800">{request.providerEmergencyPhone}</div>
                  </>
                )}

                <div className="text-slate-500">Vehicle Registration</div>
                <div className="font-semibold text-slate-900">{request.vehicleNumber || '--'}</div>

                {request.driverName && (
                  <>
                    <div className="text-slate-500">Driver Name</div>
                    <div className="font-medium text-slate-800">{request.driverName}</div>
                  </>
                )}

                {request.driverPhone && (
                  <>
                    <div className="text-slate-500">Driver Phone</div>
                    <div className="font-medium text-slate-800">{request.driverPhone}</div>
                  </>
                )}

                <div className="text-slate-500">Estimated Fare</div>
                <div className="font-bold text-slate-900">
                  {request.estimatedFare ? `৳ ${request.estimatedFare.toLocaleString()}` : '--'}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ASSIGNMENT TAB */}
        {activeTab === 'assignment' && (
          isHqView ? (
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-xs flex justify-between items-center gap-2">
                <span>Assign an approved ambulance provider &amp; ready vehicle from fleet (HQ Only).</span>
                <span className="font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300 text-[11px] shrink-0">
                  Requested: {request.vehicleType}
                </span>
              </div>

              {/* Provider Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Service Provider</label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => handleProviderSelectChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
                >
                  {providersList.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.district || 'Dhaka'})</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Fleet Dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Fleet Vehicle &amp; Driver</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                  disabled={loadingVehicles || vehiclesList.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {loadingVehicles ? (
                    <option value={0}>Loading provider vehicles...</option>
                  ) : vehiclesList.length === 0 ? (
                    <option value={0}>No ready vehicles for selected provider</option>
                  ) : (
                    vehiclesList.map(v => {
                      const isMatch = v.vehicle_type?.toUpperCase() === request.vehicleType?.toUpperCase();
                      return (
                        <option key={v.id} value={v.id}>
                          {v.registration_number} - {v.vehicle_type} {isMatch ? '★ (Matches Request)' : ''} ({v.driver_name || 'Driver'}{v.driver_phone ? ` - ${v.driver_phone}` : ''})
                        </option>
                      );
                    })
                  )}
                </select>
                {selectedVehicle && selectedVehicle.vehicle_type?.toUpperCase() !== request.vehicleType?.toUpperCase() && (
                  <p className="mt-1.5 text-[11px] text-amber-700 font-medium flex items-center gap-1.5 bg-amber-50 p-2 rounded border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Selected vehicle is <strong>{selectedVehicle.vehicle_type}</strong> (requested: <strong>{request.vehicleType}</strong>). Request vehicle type will be updated upon assignment.
                    </span>
                  </p>
                )}
              </div>

              {/* Estimated Fare */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Set Estimated Fare (BDT)</label>
                <input
                  type="number"
                  value={estimatedFareInput}
                  onChange={(e) => setEstimatedFareInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
              </div>

              {/* HQ Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">HQ Assignment Notes</label>
                <textarea
                  rows={2}
                  value={hqNotesInput}
                  onChange={(e) => setHqNotesInput(e.target.value)}
                  placeholder="e.g. ICU unit assigned with oxygen cylinder..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20"
                >
                  {isSubmittingAction ? 'Assigning...' : 'Assign Ambulance'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-medium text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Network Centre can view assignment details, but only HQ Admin can assign providers and vehicles.
                </span>
              </div>

              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-600" />
                  Assigned Vehicle & Driver Details
                </h3>

                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                  <div className="text-slate-500">Service Provider</div>
                  <div className="font-bold text-slate-900">{request.provider || 'Pending HQ Assignment'}</div>

                  {request.providerPhone && (
                    <>
                      <div className="text-slate-500">Provider Phone</div>
                      <div className="font-medium text-slate-800">{request.providerPhone}</div>
                    </>
                  )}

                  {request.providerEmergencyPhone && (
                    <>
                      <div className="text-slate-500">Emergency Phone</div>
                      <div className="font-medium text-slate-800">{request.providerEmergencyPhone}</div>
                    </>
                  )}

                  <div className="text-slate-500">Vehicle Registration</div>
                  <div className="font-bold text-slate-900">{request.vehicleNumber || '--'}</div>

                  {request.driverName && (
                    <>
                      <div className="text-slate-500">Driver Name</div>
                      <div className="font-medium text-slate-800">{request.driverName}</div>
                    </>
                  )}

                  {request.driverPhone && (
                    <>
                      <div className="text-slate-500">Driver Phone</div>
                      <div className="font-medium text-slate-800">{request.driverPhone}</div>
                    </>
                  )}

                  <div className="text-slate-500">Estimated Fare</div>
                  <div className="font-bold text-slate-900">
                    {request.estimatedFare ? `৳ ${request.estimatedFare.toLocaleString()}` : 'Pending HQ Estimation'}
                  </div>

                  <div className="text-slate-500">Due Amount</div>
                  <div className="font-bold text-amber-700">
                    {request.dueAmount ? `৳ ${request.dueAmount.toLocaleString()}` : '--'}
                  </div>

                  <div className="text-slate-500">HQ Notes</div>
                  <div className="italic text-slate-700">{request.hqNotes || 'No notes added yet.'}</div>
                </div>
              </div>
            </div>
          )
        )}

        {/* PAYMENT TAB */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 font-medium text-xs">
              Payment details recorded during request creation.
            </div>

            <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Payment Status:</div>
                <div className="font-bold text-emerald-800">{request.paymentStatus}</div>

                <div className="text-slate-500">Paid Amount:</div>
                <div className="font-bold text-slate-900">৳ {request.paidAmount.toLocaleString()}</div>

                <div className="text-slate-500">Estimated Fare:</div>
                <div className="font-bold text-slate-900">৳ {request.estimatedFare.toLocaleString()}</div>

                <div className="text-slate-500">Due Amount:</div>
                <div className="font-bold text-amber-700">৳ {request.dueAmount.toLocaleString()}</div>

                <div className="text-slate-500">Payment Method:</div>
                <div className="font-medium">{request.paymentMethod}</div>

                <div className="text-slate-500">Notes:</div>
                <div className="italic">{request.paymentNotes || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {/* STATUS HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-blue-600" />
              Status History Timeline
            </h4>

            {loadingHistory ? (
              <div className="py-8 text-center text-slate-400 font-medium flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Loading history from backend...
              </div>
            ) : historyList.length === 0 ? (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative">
                  <span className="absolute -left-[23px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                  <div className="font-bold text-slate-900">Request Created ({request.status})</div>
                  <div className="text-[11px] text-slate-500">{request.createdAt} • by {request.requestedBy}</div>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {historyList.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[23px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    <div className="font-bold text-slate-900">
                      Status changed to <span className="text-blue-600">{log.new_status}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'} • by {log.changed_by_name || 'system'}
                    </div>
                    {log.notes && (
                      <p className="text-slate-600 mt-0.5 italic">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
