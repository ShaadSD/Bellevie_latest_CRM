'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  MapPin,
  Truck,
  AlertCircle,
  CreditCard,
  FileText,
  Send,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import {
  AmbulanceRequestItem,
  AmbulancePriority,
  AmbulanceVehicleType,
  AmbulancePaymentStatus,
  createAmbulanceRequestApi,
  updateAmbulanceRequestApi
} from '@/lib/ambulanceApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';

interface CreateAmbulanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess: (newRequest: AmbulanceRequestItem) => void;
  userCentreName?: string;
  editRequest?: AmbulanceRequestItem | null;
}

export const CreateAmbulanceModal: React.FC<CreateAmbulanceModalProps> = ({
  isOpen,
  onClose,
  onCreateSuccess,
  userCentreName = 'Mirpur Centre',
  editRequest = null
}) => {
  // Members search list state
  const [memberSearch, setMemberSearch] = useState('');
  const [membersList, setMembersList] = useState<ApiMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ApiMember | null>(null);

  // Form Fields - Patient & Trip Info
  const getFutureDateStr = (minutesAhead = 30) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesAhead);
    return d.toISOString().split('T')[0];
  };

  const getFutureTimeStr = (minutesAhead = 30) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesAhead);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [pickupDate, setPickupDate] = useState<string>(getFutureDateStr(30));
  const [pickupTime, setPickupTime] = useState<string>(getFutureTimeStr(30));
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<AmbulanceVehicleType>('AC');
  const [priority, setPriority] = useState<AmbulancePriority>('High');
  const [notes, setNotes] = useState<string>('');

  // Form Fields - Payment Info
  const [paymentStatus, setPaymentStatus] = useState<AmbulancePaymentStatus>('Unpaid');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [estimatedFare, setEstimatedFare] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bKash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load real members and populate edit fields on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (editRequest) {
        setPickupAddress(editRequest.pickupAddress || '');
        setDestinationAddress(editRequest.destinationAddress || '');
        setVehicleType(editRequest.vehicleType || 'AC');
        setPriority(editRequest.priority || 'High');
        setNotes(editRequest.notes || '');
        setPaymentStatus(editRequest.paymentStatus || 'Partial');
        setPaidAmount(editRequest.paidAmount || 0);
        setEstimatedFare(editRequest.estimatedFare || 0);
        setPaymentMethod(editRequest.paymentMethod || 'bKash');
        setPaymentNotes(editRequest.paymentNotes || '');
        if (editRequest.pickupDate && editRequest.pickupTime) {
          try {
            const parsed = new Date(editRequest.rawPickupDatetime || `${editRequest.pickupDate} ${editRequest.pickupTime}`);
            if (!isNaN(parsed.getTime())) {
              setPickupDate(parsed.toISOString().split('T')[0]);
              setPickupTime(`${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`);
            }
          } catch (e) { }
        }
      } else {
        setPickupDate(getFutureDateStr(30));
        setPickupTime(getFutureTimeStr(30));
      }
      loadMembers();
    }
  }, [isOpen, editRequest]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetchMembersList({});
      let fetchedList: ApiMember[] = [];
      if (Array.isArray(res)) {
        fetchedList = res;
      } else if (res && 'results' in res && Array.isArray(res.results)) {
        fetchedList = res.results;
      }

      if (fetchedList.length > 0) {
        setMembersList(fetchedList);
        if (editRequest) {
          const match = fetchedList.find(m => String(m.id) === String(editRequest.memberId));
          setSelectedMember(match || fetchedList[0]);
        } else {
          setSelectedMember(fetchedList[0]);
        }
      } else {
        const mockMember: ApiMember = {
          id: 1,
          public_id: 'M-10001',
          full_name: editRequest ? editRequest.memberName : 'Member',
          phone: '+880 1711-000000',
          email: 'member@example.com',
          gender: 'MALE',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setMembersList([mockMember]);
        setSelectedMember(mockMember);
      }
    } catch (err) {
      const mockMember: ApiMember = {
        id: 1,
        public_id: 'M-10001',
        full_name: editRequest ? editRequest.memberName : 'Member',
        phone: '+880 1711-000000',
        email: 'member@example.com',
        gender: 'MALE',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setMembersList([mockMember]);
      setSelectedMember(mockMember);
    } finally {
      setLoadingMembers(false);
    }
  };

  const filteredMembers = membersList.filter(m =>
    m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.public_id && m.public_id.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedMember) {
      setErrorMessage('Please select a valid member');
      return;
    }
    if (!pickupAddress.trim()) {
      setErrorMessage('Pickup address is required');
      return;
    }
    if (!destinationAddress.trim()) {
      setErrorMessage('Destination address is required');
      return;
    }

    // Validate pickup datetime is in the future
    const selectedDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
    if (isNaN(selectedDateTime.getTime()) || selectedDateTime.getTime() <= Date.now()) {
      setErrorMessage('Pickup time must be in the future. Please select a future date and time.');
      return;
    }

    setIsSubmitting(true);

    // Map UI priorities/types to API backend enums
    let apiPriority: 'NORMAL' | 'URGENT' | 'EMERGENCY' = 'URGENT';
    if (priority === 'Emergency') apiPriority = 'EMERGENCY';
    else if (priority === 'High') apiPriority = 'URGENT';
    else apiPriority = 'NORMAL';

    let apiVehicleType: 'BASIC' | 'AC' | 'ICU' | 'FREEZER' = 'BASIC';
    if (vehicleType === 'Basic') apiVehicleType = 'BASIC';
    else if (vehicleType === 'AC') apiVehicleType = 'AC';
    else if (vehicleType === 'ICU') apiVehicleType = 'ICU';
    else if (vehicleType === 'Freezer') apiVehicleType = 'FREEZER';

    let apiPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'PARTIAL';
    if (paymentStatus === 'Paid') apiPaymentStatus = 'PAID';
    else if (paymentStatus === 'Unpaid') apiPaymentStatus = 'UNPAID';

    let apiPaymentMethod: 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'CARD' | null = null;
    if (apiPaymentStatus !== 'UNPAID') {
      if (paymentMethod === 'Cash') apiPaymentMethod = 'CASH';
      else if (paymentMethod === 'Nagad') apiPaymentMethod = 'NAGAD';
      else if (paymentMethod.includes('Card')) apiPaymentMethod = 'CARD';
      else if (paymentMethod.includes('Bank')) apiPaymentMethod = 'BANK';
      else apiPaymentMethod = 'BKASH';
    }

    const isoPickupDatetime = selectedDateTime.toISOString();

    const payload = {
      member: selectedMember.id,
      pickup_location: pickupAddress,
      destination: destinationAddress,
      pickup_datetime: isoPickupDatetime,
      vehicle_type: apiVehicleType,
      priority: apiPriority,
      payment_status: apiPaymentStatus,
      paid_amount: apiPaymentStatus === 'UNPAID' ? '0' : String(paidAmount || 0),
      payment_method: apiPaymentMethod,
      payment_notes: apiPaymentStatus === 'UNPAID' ? '' : (paymentNotes || ''),
      notes: notes || ''
    };

    try {
      let resultItem: AmbulanceRequestItem;
      if (editRequest) {
        resultItem = await updateAmbulanceRequestApi(editRequest.rawId, payload, editRequest.publicId);
      } else {
        resultItem = await createAmbulanceRequestApi(payload);
      }
      onCreateSuccess(resultItem);
      onClose();
    } catch (err: any) {
      console.error('Failed to save ambulance request via API:', err);
      setErrorMessage(err.message || 'Failed to save request on backend API. Please verify server connection and inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {editRequest ? `Edit Ambulance Request #${editRequest.id}` : 'Create Ambulance Request'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editRequest ? 'Modify and update details for this ambulance request' : 'Fill in the details to request an ambulance for network member'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Step 1: Patient & Trip Information */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Patient & Trip Information
                </h3>
              </div>

              {/* Member Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Member <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search member name or ID..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                {/* Select Member Dropdown Pill */}
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-100">
                  {filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMember(m)}
                      className={`text-xs px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${selectedMember?.id === m.id
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{m.full_name}</span>
                      <span className="opacity-80 text-[10px]">({m.public_id || `M-${m.id}`})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pickup Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Enter full pickup address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Destination Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destination Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="Enter destination hospital / address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Pickup Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pickup Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pickup Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Vehicle Type & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as AmbulanceVehicleType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="AC">AC Ambulance</option>
                    <option value="ICU">ICU Ambulance</option>
                    <option value="Basic">Basic Ambulance</option>
                    <option value="Freezer">Freezer Ambulance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AmbulancePriority)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="Emergency">Emergency</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Medical conditions, oxygen requirement, special instructions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Step 2: Payment Information */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Payment Information
                  </h3>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as AmbulancePaymentStatus)}
                    className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/50 rounded-lg text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>

                {/* Paid Amount & Estimated Fare */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Paid Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                        BDT
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estimated Fare
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={estimatedFare}
                        onChange={(e) => setEstimatedFare(Number(e.target.value))}
                        className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                        BDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card / POS</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Payment Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Notes
                  </label>
                  <textarea
                    rows={3}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Advance payment received from member..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Summary Pill inside Payment Box */}
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Due Amount:</span>
                  <span className="font-bold text-amber-700">
                    ৳{(Math.max(0, estimatedFare - paidAmount)).toLocaleString()} BDT
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Requested By:</span>
                  <span className="font-medium text-slate-800">{userCentreName}</span>
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>{editRequest ? 'Updating...' : 'Creating...'}</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{editRequest ? 'Update Request' : 'Create Request'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
