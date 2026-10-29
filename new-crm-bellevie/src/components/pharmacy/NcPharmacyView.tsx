'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  Package,
  Building2,
  FileText,
  Pill,
  Check,
  X,
  RefreshCw,
  MapPin,
  Calendar,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  File,
  AlertCircle
} from 'lucide-react';
import {
  PharmacyItem,
  MedicineItem,
  MedicineOrderItem,
  MemberItem,
  fetchPharmacies,
  fetchMedicines,
  fetchMedicineOrders,
  createMedicineOrder,
  updateOrderStatus,
  fetchMembers
} from '@/lib/pharmacyApi';

interface NcPharmacyViewProps {
  userCentreName?: string;
}

export const NcPharmacyView: React.FC<NcPharmacyViewProps> = ({
  userCentreName = 'Dhaka Centre'
}) => {
  const [activeTab, setActiveTab] = useState<'find' | 'catalog' | 'create' | 'orders'>('find');

  // Notification Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Data
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [orders, setOrders] = useState<MedicineOrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Create Order Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedMember, setSelectedMember] = useState({ name: '', code: '' });
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | string>('');
  const [selectedPharmacyName, setSelectedPharmacyName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [prescriptionFileName, setPrescriptionFileName] = useState<string>('');
  const [prescriptionUrl, setPrescriptionUrl] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPrescriptionUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
      showToast(`Prescription attached: ${file.name}`, 'success');
    }
  };

  // Selected Cart Items for Order Creation
  const [cartItems, setCartItems] = useState<Array<{
    medicine: MedicineItem;
    quantity: number;
  }>>([]);

  // Modals
  const [selectedPharmacyDetail, setSelectedPharmacyDetail] = useState<PharmacyItem | null>(null);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<MedicineOrderItem | null>(null);
  const [showOrderTrackingModal, setShowOrderTrackingModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [mList, phList, medList, ordList] = await Promise.all([
        fetchMembers(),
        fetchPharmacies('ALL', pharmacySearch),
        fetchMedicines('ACTIVE', medicineSearch),
        fetchMedicineOrders(orderStatusFilter, userCentreName, orderSearch)
      ]);
      setMembers(mList);
      setPharmacies(phList);
      setMedicines(medList);
      setOrders(ordList);

      if (mList.length > 0 && !selectedMember.name) {
        setSelectedMember({
          name: mList[0].full_name,
          code: mList[0].public_id || `BV-${mList[0].id}`
        });
        if (mList[0].address) setDeliveryAddress(mList[0].address);
      }

      if (phList.length > 0) {
        if (!selectedPharmacyId || !phList.some(p => String(p.id) === String(selectedPharmacyId))) {
          setSelectedPharmacyId(phList[0].id);
          setSelectedPharmacyName(phList[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load NC pharmacy data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pharmacySearch, medicineSearch, orderStatusFilter, orderSearch]);

  // Cart operations
  const handleAddToCart = (medicine: MedicineItem) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.medicine.id === medicine.id);
      if (existing) {
        return prev.map(item =>
          item.medicine.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { medicine, quantity: 1 }];
      }
    });
    setActiveTab('create');
    setWizardStep(2);
    showToast(`Added ${medicine.name} to order cart`, 'info');
  };

  const handleUpdateQuantity = (medicineId: number, qty: number) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(item => item.medicine.id !== medicineId));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.medicine.id === medicineId ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  // Price calculations
  const itemsTotal = cartItems.reduce((acc, item) => acc + (Number(item.medicine.unit_price) * item.quantity), 0);
  const deliveryCharge = 50.00;
  const grandTotal = itemsTotal + deliveryCharge;

  // Submit Order Request
  const handleSubmitOrder = async () => {
    if (!selectedPharmacyId) {
      showToast('Please select a pharmacy', 'error');
      return;
    }

    const payload = {
      member_name: selectedMember.name,
      member_code: selectedMember.code,
      pharmacy: selectedPharmacyId,
      centre_name: userCentreName,
      delivery_address: deliveryAddress,
      prescription_name: prescriptionFileName,
      prescription_url: prescriptionUrl,
      additional_notes: additionalNotes,
      total_amount: itemsTotal.toFixed(2),
      delivery_charge: deliveryCharge.toFixed(2),
      grand_total: grandTotal.toFixed(2),
      status: 'PENDING',
      items: cartItems.map(item => ({
        medicine_id: item.medicine.id,
        medicine_name: `${item.medicine.name} ${item.medicine.strength}`,
        strength: item.medicine.strength,
        form: item.medicine.form,
        quantity: item.quantity,
        unit_price: item.medicine.unit_price
      }))
    };

    try {
      await createMedicineOrder(payload);
      showToast('Medicine order submitted successfully!', 'success');
      setCartItems([]);
      setWizardStep(1);
      setActiveTab('orders');
      loadData();
    } catch (err) {
      showToast('Failed to submit order request', 'error');
    }
  };

  const renderStatusBadge = (status: string) => {
    const formatted = (status || '').toUpperCase().replace(/_/g, ' ');
    switch ((status || '').toUpperCase()) {
      case 'APPROVED':
        return <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-md">APPROVED</span>;
      case 'DELIVERED':
        return <span className="bg-teal-100 text-teal-800 font-bold text-xs px-2.5 py-1 rounded-md">DELIVERED</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-md">PENDING</span>;
      case 'PRESCRIPTION_REVIEW':
        return <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-md">PRESCRIPTION REVIEW</span>;
      case 'PROCESSING':
        return <span className="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-md">PROCESSING</span>;
      case 'READY_FOR_DISPATCH':
        return <span className="bg-sky-100 text-sky-700 font-bold text-xs px-2.5 py-1 rounded-md">READY FOR DISPATCH</span>;
      case 'DISPATCHED':
        return <span className="bg-purple-100 text-purple-700 font-bold text-xs px-2.5 py-1 rounded-md">DISPATCHED</span>;
      case 'NEED_MORE_INFORMATION':
        return <span className="bg-orange-100 text-orange-800 font-bold text-xs px-2.5 py-1 rounded-md">NEED MORE INFO</span>;
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-700 font-bold text-xs px-2.5 py-1 rounded-md">{formatted}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-md">{formatted}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white transition-all animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
          }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner for Network Centre */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Pill className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-2 backdrop-blur-md border border-emerald-400/30">
              <Building2 className="w-3.5 h-3.5" /> Network Centre Module ({userCentreName})
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pharmacy Order Desk</h1>
            <p className="text-slate-300 text-sm mt-1">Search partner pharmacies, request medicine prescriptions, and track member deliveries in real-time.</p>
          </div>
          <button
            onClick={() => {
              loadData();
              showToast('Data refreshed successfully', 'info');
            }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-md transition-all border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-700/50">
          <button
            onClick={() => setActiveTab('find')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'find'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
          >
            <Building2 className="w-4 h-4" /> 1. Find Pharmacy
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'catalog'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
          >
            <Pill className="w-4 h-4" /> 2. Medicine Catalog
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
          >
            <Plus className="w-4 h-4" /> 3. Create Medicine Order
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
          >
            <ShoppingBag className="w-4 h-4" /> 4. My Medicine Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: FIND PHARMACY */}
      {activeTab === 'find' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-extrabold text-slate-900 text-lg">Partner Pharmacies</h3>
            <div className="relative md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search pharmacy name or location..."
                value={pharmacySearch}
                onChange={(e) => setPharmacySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Pharmacy Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {pharmacies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold">
                      No approved pharmacies found.
                    </td>
                  </tr>
                ) : (
                  pharmacies.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.location}</td>
                      <td className="py-3 px-4">
                        {item.delivery_available ? (
                          <span className="text-emerald-600 font-bold">Yes</span>
                        ) : (
                          <span className="text-slate-400 font-bold">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                          Open
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPharmacyDetail(item);
                              setShowPharmacyModal(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPharmacyId(item.id);
                              setSelectedPharmacyName(item.name);
                              setActiveTab('create');
                              setWizardStep(1);
                              showToast(`Selected ${item.name} for order`, 'info');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            Select Pharmacy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MEDICINE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-extrabold text-slate-900 text-lg">Medicine Catalog</h3>
            <div className="relative md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicine name..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Strength</th>
                  <th className="py-3 px-4">Form</th>
                  <th className="py-3 px-4">Price (৳)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {medicines.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 text-slate-600">{m.strength}</td>
                    <td className="py-3 px-4">{m.form}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">৳{m.unit_price}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-0.5 rounded-md">
                        In Stock
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleAddToCart(m)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CREATE MEDICINE ORDER WIZARD */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          {/* Stepper Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            {[
              { step: 1, label: 'Member & Pharmacy' },
              { step: 2, label: 'Add Medicines' },
              { step: 3, label: 'Prescription' },
              { step: 4, label: 'Review & Submit' },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs transition-all ${wizardStep === s.step
                      ? 'bg-emerald-600 text-white shadow-md'
                      : wizardStep > s.step
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {wizardStep > s.step ? <Check className="w-4 h-4" /> : s.step}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${wizardStep === s.step ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Member & Pharmacy */}
          {wizardStep === 1 && (
            <div className="space-y-4 max-w-xl text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Member</label>
                <select
                  value={selectedMember.name}
                  onChange={(e) => {
                    const mName = e.target.value;
                    const mObj = members.find(m => m.full_name === mName);
                    if (mObj) {
                      setSelectedMember({ name: mObj.full_name, code: mObj.public_id || `BV-${mObj.id}` });
                      if (mObj.address) setDeliveryAddress(mObj.address);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  {members.length === 0 ? (
                    <option value="">No registered members found</option>
                  ) : (
                    members.map(m => (
                      <option key={m.id} value={m.full_name}>
                        {m.full_name} ({m.public_id || `BV-${m.id}`})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Pharmacy Partner</label>
                <select
                  value={selectedPharmacyId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedPharmacyId(id);
                    const p = pharmacies.find(ph => ph.id === id);
                    if (p) setSelectedPharmacyName(p.name);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-emerald-700"
                >
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs transition-all"
                >
                  Next: Add Medicines <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Add Medicines */}
          {wizardStep === 2 && (
            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Selected Medicines List</h4>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add More Medicines
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                  No medicines added to cart yet. Click &quot;Add More Medicines&quot; to browse catalog.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Medicine</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Price (৳)</th>
                        <th className="py-2.5 px-3">Total (৳)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item) => (
                        <tr key={item.medicine.id}>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.medicine.name} ({item.medicine.strength})</td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.medicine.id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center font-bold"
                            />
                          </td>
                          <td className="py-2.5 px-3">৳{item.medicine.unit_price}</td>
                          <td className="py-2.5 px-3 font-extrabold text-slate-900">
                            ৳{(Number(item.medicine.unit_price) * item.quantity).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleUpdateQuantity(item.medicine.id, 0)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200 max-w-sm ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Items Total:</span>
                  <span className="font-bold">৳{itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge:</span>
                  <span className="font-bold">৳{deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 text-sm font-extrabold border-t border-slate-200 pt-1.5">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600">৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setWizardStep(1)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  disabled={cartItems.length === 0}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs transition-all"
                >
                  Next: Upload Prescription <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Prescription */}
          {wizardStep === 3 && (
            <div className="space-y-4 max-w-lg text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Doctor Prescription Document</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handlePrescriptionChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-all group"
                >
                  {prescriptionFileName ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="font-extrabold text-slate-900 text-sm">{prescriptionFileName}</p>
                      <p className="text-emerald-700 text-xs font-semibold">✓ Doctor Prescription Attached</p>
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-sm"
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrescriptionFileName('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform mx-auto" />
                      <p className="font-bold text-slate-800">Upload Doctor Prescription</p>
                      <p className="text-slate-400 text-[11px]">PDF, JPG, PNG, DOC (Max 10MB)</p>
                      <div className="inline-block mt-2">
                        <span className="bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md inline-flex items-center gap-1.5 transition-all">
                          <Upload className="w-3.5 h-3.5" /> Browse File
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Delivery Notes</label>
                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g. Call before delivery or deliver in morning..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md text-xs transition-all"
                >
                  Next: Review & Submit <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {wizardStep === 4 && (
            <div className="space-y-4 text-xs font-medium">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-sm">Order Summary Review</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block">Member Name</span>
                    <span className="font-bold text-slate-900">{selectedMember.name} ({selectedMember.code})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pharmacy Partner</span>
                    <span className="font-bold text-emerald-600">{selectedPharmacyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Items Count</span>
                    <span className="font-bold text-slate-900">{cartItems.length} medicines</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Prescription</span>
                    <span className="font-bold text-slate-900">{prescriptionFileName}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Delivery Address</span>
                    <span className="font-semibold text-slate-800">{deliveryAddress}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Total Payable Amount</span>
                  <span className="font-extrabold text-emerald-600 text-base">৳{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmitOrder}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-2.5 rounded-xl shadow-lg text-xs transition-all"
                >
                  Submit Order Request
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: MY MEDICINE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { label: 'All', value: 'ALL', count: orders.length },
                { label: 'Pending', value: 'PENDING', count: orders.filter(o => o.status === 'PENDING').length },
                { label: 'Processing', value: 'PROCESSING', count: orders.filter(o => o.status === 'PROCESSING').length },
                { label: 'Delivered', value: 'DELIVERED', count: orders.filter(o => o.status === 'DELIVERED').length },
                { label: 'Cancelled', value: 'CANCELLED', count: orders.filter(o => o.status === 'CANCELLED').length },
              ].map(st => (
                <button
                  key={st.value}
                  onClick={() => setOrderStatusFilter(st.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${orderStatusFilter === st.value
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {st.label} ({st.count})
                </button>
              ))}
            </div>

            <div className="relative md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search order ID..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Pharmacy</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                      No orders recorded for this centre.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord, idx) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">{ord.order_id}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : '05 Oct 2026'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">{ord.pharmacy_name || 'HealthCare Pharmacy'}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">৳{ord.grand_total}</td>
                      <td className="py-3 px-4">{renderStatusBadge(ord.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setShowOrderTrackingModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PHARMACY DETAILS MODAL (CENTRE) */}
      {showPharmacyModal && selectedPharmacyDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-base">{selectedPharmacyDetail.name}</h3>
              <button onClick={() => setShowPharmacyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs font-medium text-slate-700">
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-bold text-slate-900">{selectedPharmacyDetail.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-semibold text-slate-800">{selectedPharmacyDetail.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Delivery Service</span>
                <span className="font-bold text-emerald-600">
                  {selectedPharmacyDetail.delivery_available ? 'Available' : 'Pickup Only'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Address</span>
                <span className="text-slate-700">{selectedPharmacyDetail.address || selectedPharmacyDetail.location}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowPharmacyModal(false)}
                className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedPharmacyId(selectedPharmacyDetail.id);
                  setSelectedPharmacyName(selectedPharmacyDetail.name);
                  setShowPharmacyModal(false);
                  setActiveTab('create');
                  setWizardStep(1);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md"
              >
                Select for Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAILS & TRACKING MODAL */}
      {showOrderTrackingModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-slate-900 text-lg">Order #{selectedOrder.order_id}</h3>
                {renderStatusBadge(selectedOrder.status)}
              </div>
              <button onClick={() => setShowOrderTrackingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs font-medium">
              {/* 7-Stage Status Tracking Timeline */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4 text-center text-xs">Order Status Timeline</h4>
                <div className="flex items-center justify-between relative px-1 overflow-x-auto gap-2">
                  {[
                    { label: 'Created', key: 'PENDING', done: true },
                    { label: 'Rx Review', key: 'PRESCRIPTION_REVIEW', done: ['PRESCRIPTION_REVIEW', 'APPROVED', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: 'Approved', key: 'APPROVED', done: ['APPROVED', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: 'Processing', key: 'PROCESSING', done: ['PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: 'Ready', key: 'READY_FOR_DISPATCH', done: ['READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: 'Dispatched', key: 'DISPATCHED', done: ['DISPATCHED', 'DELIVERED'].includes(selectedOrder.status) },
                    { label: 'Delivered', key: 'DELIVERED', done: selectedOrder.status === 'DELIVERED' },
                  ].map((st, i) => (
                    <div key={i} className="flex flex-col items-center z-10 relative min-w-[50px]">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${st.done ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'
                          }`}
                      >
                        {st.done ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      <span className={`text-[9px] font-bold mt-1 text-center whitespace-nowrap ${st.done ? 'text-slate-900' : 'text-slate-400'}`}>
                        {st.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Card for NEED_MORE_INFORMATION */}
              {selectedOrder.status === 'NEED_MORE_INFORMATION' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Additional Information Required by HQ Admin
                  </div>
                  <p className="text-amber-900 text-xs">HQ Note: &quot;Please upload the latest prescription or provide additional member clarification.&quot;</p>
                  <div className="pt-2 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) showToast(`Prescription selected: ${f.name}`, 'info');
                      }}
                      className="text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                    />
                    <button
                      onClick={async () => {
                        await updateOrderStatus(selectedOrder.id, 'PRESCRIPTION_REVIEW', 'Additional prescription uploaded by Network Centre');
                        setShowOrderTrackingModal(false);
                        showToast('Additional prescription information submitted to HQ Admin!', 'success');
                        loadData();
                      }}
                      className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md whitespace-nowrap"
                    >
                      Submit Updated Prescription
                    </button>
                  </div>
                </div>
              )}

              {/* Special Card for REJECTED */}
              {selectedOrder.status === 'REJECTED' && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                    <X className="w-4 h-4 text-rose-600" /> Order Rejected by HQ Admin
                  </div>
                  <p className="text-rose-900 text-xs">Reason: Napa 500mg or selected prescription medicine is currently unavailable at this pharmacy.</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setShowOrderTrackingModal(false);
                        setActiveTab('create');
                        setWizardStep(1);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md"
                    >
                      Create New Order
                    </button>
                  </div>
                </div>
              )}

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Member Name</span>
                  <span className="font-extrabold text-slate-900 text-sm block">{selectedOrder.member_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pharmacy</span>
                  <span className="font-bold text-emerald-600 text-sm block">{selectedOrder.pharmacy_name || 'HealthCare Pharmacy'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Delivery Address</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.delivery_address}</span>
                </div>
              </div>

              {/* Prescription link */}
              <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800">Prescription.pdf (Uploaded)</span>
                </div>
                <button
                  onClick={() => setShowPrescriptionModal(true)}
                  className="text-blue-600 font-bold hover:underline"
                >
                  View Prescription
                </button>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowOrderTrackingModal(false)}
                className="bg-slate-800 text-white font-bold px-6 py-2 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PRESCRIPTION MODAL */}
      {showPrescriptionModal && selectedOrder && (() => {
        const rawTarget = selectedOrder.prescription_url || selectedOrder.prescription_file || '';
        const fileSrc = rawTarget.startsWith('/media/') ? `http://127.0.0.1:8000${rawTarget}` : rawTarget;
        const fileName = selectedOrder.prescription_name || (rawTarget ? rawTarget.split('/').pop() : '') || 'Prescription_Document.pdf';
        const isPdf = /\.pdf$/i.test(fileName) || fileSrc.includes('application/pdf') || fileSrc.endsWith('.pdf');
        const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(fileName) || fileSrc.startsWith('data:image/') || fileSrc.includes('.png') || fileSrc.includes('.jpg') || fileSrc.includes('.jpeg');

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Doctor Prescription Document</h3>
                </div>
                <button onClick={() => setShowPrescriptionModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Uploaded Prescription Document
                  </span>
                  <span className="text-emerald-700 font-bold text-[11px]">{fileName}</span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-2 shadow-inner text-center">
                  {isPdf && fileSrc ? (
                    <div className="space-y-3">
                      <iframe
                        src={fileSrc}
                        className="w-full h-[450px] rounded-xl border border-slate-200 bg-white"
                        title="PDF Prescription Viewer"
                      />
                      <div className="flex justify-end pt-1">
                        <a
                          href={fileSrc}
                          target="_blank"
                          rel="noreferrer"
                          download={fileName}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 rotate-180" /> Download PDF Document
                        </a>
                      </div>
                    </div>
                  ) : isImage && fileSrc ? (
                    <div className="space-y-3">
                      <img
                        src={fileSrc}
                        alt="Uploaded Doctor Prescription"
                        className="w-full max-h-[450px] object-contain rounded-xl bg-white shadow-sm border border-slate-200"
                      />
                      <div className="flex justify-end pt-1">
                        <a
                          href={fileSrc}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Open Full Image in New Tab
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-white rounded-xl border border-slate-200 space-y-3">
                      <FileText className="w-12 h-12 text-emerald-600 mx-auto" />
                      <p className="font-extrabold text-slate-900 text-sm">{fileName}</p>
                      <p className="text-xs text-slate-500">Doctor prescription document attached by Network Centre.</p>
                      {fileSrc && (
                        <a
                          href={fileSrc}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md inline-flex items-center gap-1.5 mt-2"
                        >
                          <Upload className="w-3.5 h-3.5 rotate-180" /> Download / View File
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                Close Preview
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
