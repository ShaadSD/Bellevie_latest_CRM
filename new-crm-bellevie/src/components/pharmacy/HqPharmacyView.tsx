'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building2,
  FileText,
  AlertTriangle,
  Pill,
  Check,
  X,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  User,
  ShoppingBag,
  AlertCircle,
  Edit3
} from 'lucide-react';
import {
  PharmacyItem,
  MedicineItem,
  InventoryItem,
  MedicineOrderItem,
  fetchPharmacies,
  approvePharmacy,
  rejectPharmacy,
  createPharmacy,
  fetchMedicines,
  createMedicine,
  fetchInventory,
  createInventory,
  fetchMedicineOrders,
  updateOrderStatus
} from '@/lib/pharmacyApi';

export const HqPharmacyView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pharmacies' | 'catalog' | 'inventory' | 'orders'>('pharmacies');

  // Notification Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // API Data States
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<MedicineOrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [pharmacyStatusFilter, setPharmacyStatusFilter] = useState('ALL');
  const [pharmacySearch, setPharmacySearch] = useState('');

  const [medicineSearch, setMedicineSearch] = useState('');
  
  const [inventoryPharmacyFilter, setInventoryPharmacyFilter] = useState('ALL');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('ALL');
  const [inventorySearch, setInventorySearch] = useState('');

  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Modals
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyItem | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalTab, setApprovalTab] = useState<'basic' | 'documents' | 'location' | 'settings'>('basic');

  const [showAddPharmacyModal, setShowAddPharmacyModal] = useState(false);
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    owner_name: '',
    trade_license: '',
    pharmacy_type: 'Retail',
    address: '',
    location: '',
    email: '',
    phone: '',
    description: ''
  });

  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineItem | null>(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    generic_name: '',
    strength: '',
    form: 'Tablet',
    manufacturer: '',
    category: 'Pain Relief',
    unit_price: '2.00',
    prescription_required: false,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    description: ''
  });

  // Inventory Modals
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newInventory, setNewInventory] = useState({
    pharmacy: '',
    medicine: '',
    batch_no: '',
    expiry_date: '',
    stock: 100,
    unit: 'pcs',
    reorder_level: 20
  });

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<MedicineOrderItem | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalTab, setOrderModalTab] = useState<'overview' | 'items' | 'prescription' | 'history' | 'payment' | 'delivery'>('overview');
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [phList, medList, invList, ordList] = await Promise.all([
        fetchPharmacies(pharmacyStatusFilter, pharmacySearch),
        fetchMedicines('ALL', medicineSearch),
        fetchInventory(inventoryPharmacyFilter, inventoryStatusFilter, inventorySearch),
        fetchMedicineOrders(orderStatusFilter, '', orderSearch)
      ]);
      setPharmacies(phList);
      setMedicines(medList);
      setInventories(invList);
      setOrders(ordList);
    } catch (err) {
      console.error('Failed to fetch pharmacy data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pharmacyStatusFilter, pharmacySearch, medicineSearch, inventoryPharmacyFilter, inventoryStatusFilter, inventorySearch, orderStatusFilter, orderSearch]);

  // Handlers
  const handleApprovePharmacy = async (id: number) => {
    try {
      await approvePharmacy(id);
      setShowApprovalModal(false);
      setSelectedPharmacy(null);
      showToast('Pharmacy approved & active!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to approve pharmacy', 'error');
    }
  };

  const handleRejectPharmacy = async (id: number) => {
    try {
      await rejectPharmacy(id);
      setShowApprovalModal(false);
      setSelectedPharmacy(null);
      showToast('Pharmacy request deactivated / rejected', 'info');
      loadData();
    } catch (err) {
      showToast('Failed to reject pharmacy', 'error');
    }
  };

  const handleCreatePharmacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPharmacy({
        ...newPharmacy,
        status: 'APPROVED'
      } as any);
      setShowAddPharmacyModal(false);
      setNewPharmacy({
        name: '', owner_name: '', trade_license: '', pharmacy_type: 'Retail',
        address: '', location: '', email: '', phone: '', description: ''
      });
      showToast('New pharmacy partner registered & active!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to add pharmacy', 'error');
    }
  };

  const handleCreateMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMedicine(newMedicine as any);
      setShowAddMedicineModal(false);
      setSelectedMedicine(null);
      setNewMedicine({
        name: '', generic_name: '', strength: '', form: 'Tablet',
        manufacturer: '', category: 'Pain Relief', unit_price: '2.00', prescription_required: false,
        status: 'ACTIVE', description: ''
      });
      showToast('Medicine catalog entry saved successfully!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to save medicine', 'error');
    }
  };

  const handleCreateInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInventory.pharmacy || !newInventory.medicine) {
      showToast('Please select both a pharmacy and a medicine catalog item', 'error');
      return;
    }
    try {
      const phObj = pharmacies.find(p => p.id === Number(newInventory.pharmacy));
      const medObj = medicines.find(m => m.id === Number(newInventory.medicine));

      await createInventory({
        pharmacy: Number(newInventory.pharmacy),
        pharmacy_name: phObj?.name || '',
        medicine: Number(newInventory.medicine),
        medicine_name: medObj?.name || '',
        strength: medObj?.strength || '',
        form: medObj?.form || '',
        batch_no: newInventory.batch_no || `BATCH-${Date.now().toString().slice(-4)}`,
        expiry_date: newInventory.expiry_date || '2028-12-31',
        stock: Number(newInventory.stock),
        unit: newInventory.unit,
        reorder_level: Number(newInventory.reorder_level)
      });

      setShowAddInventoryModal(false);
      setNewInventory({
        pharmacy: '', medicine: '', batch_no: '', expiry_date: '', stock: 100, unit: 'pcs', reorder_level: 20
      });
      showToast('Inventory stock batch recorded successfully!', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to save inventory batch', 'error');
    }
  };

  const handleUpdateOrderStatusAction = async (id: number, statusStr: string, notes?: string) => {
    try {
      await updateOrderStatus(id, statusStr, notes, 'HQ Admin');
      setShowOrderModal(false);
      setSelectedOrder(null);
      showToast(`Order status updated to ${statusStr}!`, 'success');
      loadData();
    } catch (err) {
      showToast('Failed to update order status', 'error');
    }
  };

  const openMedicineModalForEdit = (m: MedicineItem) => {
    setSelectedMedicine(m);
    setNewMedicine({
      name: m.name,
      generic_name: m.generic_name,
      strength: m.strength,
      form: m.form || 'Tablet',
      manufacturer: m.manufacturer || '',
      category: m.category || 'Pain Relief',
      unit_price: String(m.unit_price || '2.00'),
      prescription_required: m.prescription_required || false,
      status: m.status || 'ACTIVE',
      description: m.description || ''
    });
    setShowAddMedicineModal(true);
  };

  // Status badges helper
  const renderStatusBadge = (status: string) => {
    const formatted = (status || '').toUpperCase().replace(/_/g, ' ');
    switch ((status || '').toUpperCase()) {
      case 'APPROVED':
      case 'ACTIVE':
      case 'GOOD':
        return <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">APPROVED</span>;
      case 'DELIVERED':
        return <span className="bg-teal-100 text-teal-800 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">DELIVERED</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">PENDING</span>;
      case 'PRESCRIPTION_REVIEW':
        return <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">PRESCRIPTION REVIEW</span>;
      case 'PROCESSING':
        return <span className="bg-blue-100 text-blue-700 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">PROCESSING</span>;
      case 'READY_FOR_DISPATCH':
        return <span className="bg-sky-100 text-sky-700 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">READY FOR DISPATCH</span>;
      case 'DISPATCHED':
        return <span className="bg-purple-100 text-purple-700 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">DISPATCHED</span>;
      case 'NEED_MORE_INFORMATION':
        return <span className="bg-orange-100 text-orange-800 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">NEED MORE INFO</span>;
      case 'REJECTED':
      case 'CANCELLED':
      case 'OUT_OF_STOCK':
        return <span className="bg-rose-100 text-rose-700 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">{formatted}</span>;
      case 'LOW':
      case 'EXPIRING':
        return <span className="bg-orange-100 text-orange-700 font-bold text-xs px-2.5 py-1 rounded-md inline-flex items-center gap-1">{formatted}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-md">{formatted}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white transition-all animate-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-blue-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Pill className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-2 backdrop-blur-md border border-blue-400/30">
              <Building2 className="w-3.5 h-3.5" /> HQ Admin Module
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pharmacy Management</h1>
            <p className="text-slate-300 text-sm mt-1">Review partner pharmacies, medicine catalog, real-time inventory, and order approvals across network centres.</p>
          </div>
          <button
            onClick={() => {
              loadData();
              showToast('Data refreshed successfully', 'info');
            }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-md transition-all border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        {/* Primary Sub-Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-700/50">
          <button
            onClick={() => setActiveTab('pharmacies')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'pharmacies'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <Building2 className="w-4 h-4" /> 1. Pharmacy List
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <Pill className="w-4 h-4" /> 2. Medicine Catalog
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <Package className="w-4 h-4" /> 3. Inventory Management
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> 4. Medicine Orders ({orders.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PHARMACY LIST */}
      {activeTab === 'pharmacies' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { label: 'All', value: 'ALL', count: pharmacies.length },
                { label: 'Approved', value: 'APPROVED', count: pharmacies.filter(p => p.status === 'APPROVED').length },
                { label: 'Rejected', value: 'REJECTED', count: pharmacies.filter(p => p.status === 'REJECTED').length },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setPharmacyStatusFilter(t.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pharmacyStatusFilter === t.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search pharmacy name, location..."
                  value={pharmacySearch}
                  onChange={(e) => setPharmacySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setNewPharmacy({
                    name: '', owner_name: '', trade_license: '', pharmacy_type: 'Retail',
                    address: '', location: '', email: '', phone: '', description: ''
                  });
                  setShowAddPharmacyModal(true);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Pharmacy
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Pharmacy Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">License No</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {pharmacies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                      No pharmacies found. Click &quot;+ Add Pharmacy&quot; to add partner pharmacies.
                    </td>
                  </tr>
                ) : (
                  pharmacies.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4">{item.location}</td>
                      <td className="py-3 px-4 text-slate-600">{item.phone}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{item.trade_license || 'N/A'}</td>
                      <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedPharmacy(item);
                            setShowApprovalModal(true);
                          }}
                          className="bg-slate-100 hover:bg-blue-50 text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1 mx-auto"
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

      {/* TAB 2: MEDICINE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicine name, generic name..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedMedicine(null);
                  setNewMedicine({
                    name: '', generic_name: '', strength: '', form: 'Tablet',
                    manufacturer: '', category: 'Pain Relief', unit_price: '2.00',
                    prescription_required: false, status: 'ACTIVE', description: ''
                  });
                  setShowAddMedicineModal(true);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Add Medicine
              </button>
              <button
                onClick={() => showToast('Import template ready. Select CSV file to upload.', 'info')}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all"
              >
                <Upload className="w-4 h-4" /> Import
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Generic Name</th>
                  <th className="py-3 px-4">Strength</th>
                  <th className="py-3 px-4">Form</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {medicines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                      No medicines in catalog. Click &quot;+ Add Medicine&quot; to populate catalog.
                    </td>
                  </tr>
                ) : (
                  medicines.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                      <td className="py-3 px-4 text-slate-600">{m.generic_name}</td>
                      <td className="py-3 px-4">{m.strength}</td>
                      <td className="py-3 px-4">{m.form}</td>
                      <td className="py-3 px-4">{renderStatusBadge(m.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openMedicineModalForEdit(m)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> View / Edit
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

      {/* TAB 3: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search medicine, batch no..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={inventoryPharmacyFilter}
                  onChange={(e) => setInventoryPharmacyFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Pharmacies</option>
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={inventoryStatusFilter}
                  onChange={(e) => setInventoryStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Stock Statuses</option>
                  <option value="GOOD">Good</option>
                  <option value="LOW">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="EXPIRING">Expiring Soon</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (pharmacies.length > 0 && !newInventory.pharmacy) {
                  setNewInventory(prev => ({ ...prev, pharmacy: String(pharmacies[0].id) }));
                }
                if (medicines.length > 0 && !newInventory.medicine) {
                  setNewInventory(prev => ({ ...prev, medicine: String(medicines[0].id) }));
                }
                setShowAddInventoryModal(true);
              }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> + Add Stock Batch
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Pharmacy</th>
                  <th className="py-3 px-4">Batch No</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {inventories.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400 font-semibold">
                      No inventory items recorded.
                    </td>
                  </tr>
                ) : (
                  inventories.map((inv, idx) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.medicine_name} {inv.strength}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600">{inv.pharmacy_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{inv.batch_no}</td>
                      <td className="py-3 px-4 text-slate-600">{inv.expiry_date}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">{inv.stock}</td>
                      <td className="py-3 px-4 text-slate-500">{inv.unit}</td>
                      <td className="py-3 px-4">{renderStatusBadge(inv.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedInventory(inv);
                            setShowInventoryModal(true);
                          }}
                          className="bg-slate-100 hover:bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold transition-all border border-slate-200 flex items-center gap-1 mx-auto"
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

      {/* TAB 4: MEDICINE ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { label: 'All', value: 'ALL', count: orders.length },
                { label: 'Pending', value: 'PENDING', count: orders.filter(o => o.status === 'PENDING').length },
                { label: 'Processing', value: 'PROCESSING', count: orders.filter(o => o.status === 'PROCESSING').length },
                { label: 'Dispatched', value: 'DISPATCHED', count: orders.filter(o => o.status === 'DISPATCHED').length },
                { label: 'Delivered', value: 'DELIVERED', count: orders.filter(o => o.status === 'DELIVERED').length },
                { label: 'Cancelled', value: 'CANCELLED', count: orders.filter(o => o.status === 'CANCELLED').length },
              ].map(st => (
                <button
                  key={st.value}
                  onClick={() => setOrderStatusFilter(st.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderStatusFilter === st.value
                      ? 'bg-blue-600 text-white shadow-md'
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
                placeholder="Search order ID, member..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Member</th>
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
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord, idx) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{ord.order_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{ord.member_name}</td>
                      <td className="py-3 px-4 text-slate-600">{ord.pharmacy_name || 'HealthCare Pharmacy'}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">৳{ord.grand_total}</td>
                      <td className="py-3 px-4">{renderStatusBadge(ord.status)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setOrderModalTab('overview');
                            setShowOrderModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
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

      {/* MODAL 1: PHARMACY APPROVAL / DETAILS MODAL */}
      {showApprovalModal && selectedPharmacy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-slate-900 text-lg">Review Pharmacy Information</h3>
                {renderStatusBadge(selectedPharmacy.status)}
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-[11px] block">Pharmacy Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedPharmacy.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Owner Name</span>
                  <span className="font-bold text-slate-800">{selectedPharmacy.owner_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Trade License</span>
                  <span className="font-mono text-slate-800">{selectedPharmacy.trade_license || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Pharmacy Type</span>
                  <span className="font-semibold text-slate-800">{selectedPharmacy.pharmacy_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedPharmacy.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Email</span>
                  <span className="font-semibold text-slate-800">{selectedPharmacy.email || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[11px] block">Address / Location</span>
                  <span className="font-medium text-slate-800">{selectedPharmacy.address || selectedPharmacy.location || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[11px] block">Description</span>
                  <p className="text-slate-600">{selectedPharmacy.description || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => handleRejectPharmacy(selectedPharmacy.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                {selectedPharmacy.status === 'APPROVED' ? 'Deactivate / Reject' : 'Reject'}
              </button>
              <button
                onClick={() => handleApprovePharmacy(selectedPharmacy.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                {selectedPharmacy.status === 'APPROVED' ? 'Approved & Active' : 'Approve Pharmacy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PHARMACY MODAL */}
      {showAddPharmacyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-lg">Add New Partner Pharmacy</h3>
              <button onClick={() => setShowAddPharmacyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePharmacySubmit} className="p-6 space-y-4 text-xs font-medium overflow-y-auto">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Pharmacy Name *</label>
                <input
                  type="text"
                  required
                  value={newPharmacy.name}
                  onChange={(e) => setNewPharmacy({ ...newPharmacy, name: e.target.value })}
                  placeholder="e.g. HealthCare Pharmacy"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={newPharmacy.owner_name}
                    onChange={(e) => setNewPharmacy({ ...newPharmacy, owner_name: e.target.value })}
                    placeholder="e.g. Abdul Hasan (Optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Trade License</label>
                  <input
                    type="text"
                    value={newPharmacy.trade_license}
                    onChange={(e) => setNewPharmacy({ ...newPharmacy, trade_license: e.target.value })}
                    placeholder="e.g. TL-100234 (Optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Pharmacy Type</label>
                  <select
                    value={newPharmacy.pharmacy_type}
                    onChange={(e) => setNewPharmacy({ ...newPharmacy, pharmacy_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Reseller">Reseller</option>
                    <option value="Chain">Chain</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Partner">Partner</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={newPharmacy.phone}
                    onChange={(e) => setNewPharmacy({ ...newPharmacy, phone: e.target.value })}
                    placeholder="0171XXXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={newPharmacy.email}
                    onChange={(e) => setNewPharmacy({ ...newPharmacy, email: e.target.value })}
                    placeholder="badd@gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Location / City *</label>
                <input
                  type="text"
                  required
                  value={newPharmacy.location}
                  onChange={(e) => setNewPharmacy({ ...newPharmacy, location: e.target.value })}
                  placeholder="Middle, Badda, Dhaka"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Address</label>
                <textarea
                  rows={2}
                  value={newPharmacy.address}
                  onChange={(e) => setNewPharmacy({ ...newPharmacy, address: e.target.value })}
                  placeholder="House 12, Road 5, Dhanmondi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newPharmacy.description}
                  onChange={(e) => setNewPharmacy({ ...newPharmacy, description: e.target.value })}
                  placeholder="Full service partner pharmacy offering certified medicines."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPharmacyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Save Pharmacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT MEDICINE MODAL */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-base">
                {selectedMedicine ? 'Edit Medicine Details' : '4. Add / Edit Medicine (Modal)'}
              </h3>
              <button onClick={() => setShowAddMedicineModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicineSubmit} className="p-6 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Medicine Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedicine.name}
                    onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                    placeholder="Napa"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Generic Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedicine.generic_name}
                    onChange={(e) => setNewMedicine({ ...newMedicine, generic_name: e.target.value })}
                    placeholder="Paracetamol"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Strength <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedicine.strength}
                    onChange={(e) => setNewMedicine({ ...newMedicine, strength: e.target.value })}
                    placeholder="500mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Form <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newMedicine.form}
                    onChange={(e) => setNewMedicine({ ...newMedicine, form: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={newMedicine.manufacturer}
                    onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
                    placeholder="Beximco"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={newMedicine.category || 'Pain Relief'}
                    onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                  >
                    <option value="Pain Relief">Pain Relief</option>
                    <option value="Blood Pressure">Blood Pressure</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Acid Reflux">Acid Reflux</option>
                    <option value="Cholesterol">Cholesterol</option>
                    <option value="Antibiotics">Antibiotics</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prescription Required</label>
                  <select
                    value={newMedicine.prescription_required ? 'Yes' : 'No'}
                    onChange={(e) => setNewMedicine({ ...newMedicine, prescription_required: e.target.value === 'Yes' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={newMedicine.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    onChange={(e) => setNewMedicine({ ...newMedicine, status: e.target.value === 'Active' ? 'ACTIVE' : 'INACTIVE' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description (optional)</label>
                <textarea
                  rows={3}
                  value={newMedicine.description || ''}
                  onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })}
                  placeholder="Common pain reliever and fever reducer."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INVENTORY DETAILS MODAL */}
      {showInventoryModal && selectedInventory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Inventory Batch Details</h3>
                {renderStatusBadge(selectedInventory.status)}
              </div>
              <button onClick={() => setShowInventoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Medicine</span>
                  <span className="font-extrabold text-slate-900 text-sm block">{selectedInventory.medicine_name} {selectedInventory.strength}</span>
                  <span className="text-slate-500">{selectedInventory.form}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pharmacy Partner</span>
                  <span className="font-extrabold text-blue-600 text-sm block">{selectedInventory.pharmacy_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Batch Number</span>
                  <span className="font-mono font-bold text-slate-900">{selectedInventory.batch_no}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Expiry Date</span>
                  <span className="font-bold text-slate-900">{selectedInventory.expiry_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Stock</span>
                  <span className="font-extrabold text-emerald-600 text-base">{selectedInventory.stock} {selectedInventory.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Reorder Threshold</span>
                  <span className="font-bold text-slate-800">{selectedInventory.reorder_level} {selectedInventory.unit}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowInventoryModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2 rounded-xl text-xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ORDER DETAILS (HQ) MODAL */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-slate-900 text-lg">Order #{selectedOrder.order_id}</h3>
                {renderStatusBadge(selectedOrder.status)}
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs matching Screen 7 */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
              {(['overview', 'items', 'prescription', 'history', 'payment', 'delivery'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setOrderModalTab(tab)}
                  className={`py-2.5 px-4 text-xs font-bold capitalize transition-all border-b-2 ${
                    orderModalTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'items' ? `Items (${selectedOrder.items?.length || 2})` : tab === 'history' ? 'Status History' : tab}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
              {orderModalTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Member Information</span>
                      <span className="font-extrabold text-slate-900 text-sm block">{selectedOrder.member_name}</span>
                      <span className="text-slate-500">{selectedOrder.member_code || 'BV-000124'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Pharmacy Information</span>
                      <span className="font-extrabold text-blue-600 text-sm block">{selectedOrder.pharmacy_name || 'HealthCare Pharmacy'}</span>
                      <span className="text-slate-500">Dhaka, Dhaka</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Order Information</span>
                      <span className="font-bold text-slate-800">Date: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : '05 Oct 2026'}</span>
                      <span className="block text-slate-800">Total: ৳{selectedOrder.grand_total}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Delivery Address</span>
                      <span className="font-bold text-slate-800">{selectedOrder.delivery_address}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="font-bold text-blue-900">Total Amount Payable</span>
                    <span className="text-lg font-extrabold text-blue-600">৳{selectedOrder.grand_total}</span>
                  </div>
                </div>
              )}

              {orderModalTab === 'items' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Unit Price</th>
                        <th className="py-2.5 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-bold text-slate-800">{item.medicine_name}</td>
                            <td className="py-2 px-3">{item.quantity}</td>
                            <td className="py-2 px-3">৳{item.unit_price}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">৳{item.total_price}</td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr>
                            <td className="py-2 px-3 font-bold text-slate-800">Napa 500mg Tablet</td>
                            <td className="py-2 px-3">10</td>
                            <td className="py-2 px-3">৳2.00</td>
                            <td className="py-2 px-3 font-bold text-slate-900">৳20.00</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-bold text-slate-800">Amlocard 5mg Tablet</td>
                            <td className="py-2 px-3">30</td>
                            <td className="py-2 px-3">৳3.50</td>
                            <td className="py-2 px-3 font-bold text-slate-900">৳105.00</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {orderModalTab === 'prescription' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-slate-800">{selectedOrder.prescription_name || 'Prescription.pdf'}</span>
                  </div>
                  <button
                    onClick={() => setShowPrescriptionModal(true)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    View Prescription Document
                  </button>
                </div>
              )}

              {orderModalTab === 'history' && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Order Requested</span>
                      <span className="text-slate-500">Initiated by Network Centre</span>
                    </div>
                    <span className="text-slate-400">10:00 AM</span>
                  </div>
                </div>
              )}

              {orderModalTab === 'payment' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block">Payment Method</span>
                  <span className="font-bold text-slate-900 block">Cash on Delivery / Network Account</span>
                  <span className="text-emerald-600 font-bold">Status: Pending Verification</span>
                </div>
              )}

              {orderModalTab === 'delivery' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block">Delivery Rider / Partner</span>
                  <span className="font-bold text-slate-900 block">HealthCare Courier Service</span>
                  <span className="text-slate-600 font-medium">Address: {selectedOrder.delivery_address}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUpdateOrderStatusAction(selectedOrder.id, 'REJECTED', 'Medicine unavailable or rejected by HQ');
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md"
                >
                  Reject Order
                </button>
                <button
                  onClick={() => {
                    handleUpdateOrderStatusAction(selectedOrder.id, 'NEED_MORE_INFORMATION', 'Please upload latest prescription or confirm details.');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md"
                >
                  Request Info
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleUpdateOrderStatusAction(selectedOrder.id, 'PRESCRIPTION_REVIEW', 'Prescription under review')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
                >
                  Review Rx
                </button>
                <button
                  onClick={() => handleUpdateOrderStatusAction(selectedOrder.id, 'APPROVED', 'Order approved by HQ')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleUpdateOrderStatusAction(selectedOrder.id, 'PROCESSING', 'Stock allocated & packing')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
                >
                  Processing
                </button>
                <button
                  onClick={() => handleUpdateOrderStatusAction(selectedOrder.id, 'READY_FOR_DISPATCH', 'Order packed & ready')}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
                >
                  Ready
                </button>
                <button
                  onClick={() => handleUpdateOrderStatusAction(selectedOrder.id, 'DISPATCHED', 'Dispatched with courier')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
                >
                  Dispatched
                </button>
                <button
                  onClick={() => handleUpdateOrderStatusAction(selectedOrder.id, 'DELIVERED', 'Delivered to member')}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-sm"
                >
                  Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: ADD INVENTORY STOCK BATCH */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-6 bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" /> Add Inventory Stock Batch
                </h3>
                <p className="text-slate-300 text-xs mt-0.5">Upload new medicine stock for a partner pharmacy</p>
              </div>
              <button onClick={() => setShowAddInventoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInventorySubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Pharmacy *</label>
                <select
                  required
                  value={newInventory.pharmacy}
                  onChange={(e) => setNewInventory({ ...newInventory, pharmacy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Pharmacy --</option>
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Medicine from Catalog *</label>
                <select
                  required
                  value={newInventory.medicine}
                  onChange={(e) => setNewInventory({ ...newInventory, medicine: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.generic_name} - {m.strength})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B2026-905"
                    value={newInventory.batch_no}
                    onChange={(e) => setNewInventory({ ...newInventory, batch_no: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newInventory.expiry_date}
                    onChange={(e) => setNewInventory({ ...newInventory, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newInventory.stock}
                    onChange={(e) => setNewInventory({ ...newInventory, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit</label>
                  <select
                    value={newInventory.unit}
                    onChange={(e) => setNewInventory({ ...newInventory, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pcs">pcs</option>
                    <option value="boxes">boxes</option>
                    <option value="strips">strips</option>
                    <option value="bottles">bottles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Alert Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newInventory.reorder_level}
                    onChange={(e) => setNewInventory({ ...newInventory, reorder_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save Stock Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PRESCRIPTION PREVIEW MODAL */}
      {showPrescriptionModal && selectedOrder && (() => {
        const rawTarget = selectedOrder.prescription_url || selectedOrder.prescription_file || '';
        const fileSrc = rawTarget.startsWith('/media/') ? `http://127.0.0.1:8000${rawTarget}` : rawTarget;
        const fileName = selectedOrder.prescription_name || (rawTarget ? rawTarget.split('/').pop() : '') || 'Prescription_Document.pdf';
        const isPdf = /\.pdf$/i.test(fileName) || fileSrc.includes('application/pdf') || fileSrc.endsWith('.pdf');
        const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(fileName) || fileSrc.startsWith('data:image/') || fileSrc.includes('.png') || fileSrc.includes('.jpg') || fileSrc.includes('.jpeg');

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">Prescription Document Preview</h3>
                </div>
                <button onClick={() => setShowPrescriptionModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
                  <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Doctor Prescription Attached
                  </span>
                  <span className="text-emerald-700 font-bold text-[11px]">{fileName}</span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-3 shadow-inner text-center">
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
                        className="w-full max-h-[480px] object-contain rounded-xl bg-white shadow-sm border border-slate-200"
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
                    <div className="p-10 bg-white rounded-xl border border-slate-200 space-y-3">
                      <FileText className="w-14 h-14 text-emerald-600 mx-auto" />
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

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="font-bold text-slate-900">#{selectedOrder.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Centre Name:</span>
                    <span className="font-semibold text-slate-800">{selectedOrder.centre_name || 'Dhaka Centre'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pharmacy Partner:</span>
                    <span className="font-semibold text-blue-600">{selectedOrder.pharmacy_name || 'HealthCare Pharmacy'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-2 rounded-xl text-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
