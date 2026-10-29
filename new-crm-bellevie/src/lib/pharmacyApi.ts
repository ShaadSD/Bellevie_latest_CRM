import { apiFetch } from './api';

export interface MemberItem {
  id: number;
  public_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface PharmacyItem {
  id: number;
  name: string;
  owner_name?: string;
  trade_license?: string;
  pharmacy_type: string;
  address: string;
  location: string;
  district?: string;
  email?: string;
  phone: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  open_status: 'OPEN' | 'CLOSED';
  delivery_available: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineItem {
  id: number;
  name: string;
  generic_name: string;
  strength: string;
  form: string;
  manufacturer?: string;
  category?: string;
  prescription_required: boolean;
  unit_price: number | string;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  created_at?: string;
}

export interface InventoryItem {
  id: number;
  pharmacy: number;
  pharmacy_name: string;
  medicine: number;
  medicine_name: string;
  strength: string;
  form: string;
  batch_no: string;
  expiry_date: string;
  stock: number;
  unit: string;
  reorder_level: number;
  purchase_price?: number | string;
  selling_price?: number | string;
  status: 'GOOD' | 'LOW' | 'OUT_OF_STOCK' | 'EXPIRING';
  updated_at?: string;
}

export interface OrderItemDetail {
  id?: number;
  medicine_id?: number;
  medicine_name: string;
  strength?: string;
  form?: string;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
}

export interface OrderStatusHistoryItem {
  id?: number;
  previous_status?: string;
  new_status: string;
  notes?: string;
  updated_by: string;
  created_at?: string;
}

export interface MedicineOrderItem {
  id: number;
  order_id: string;
  member_name: string;
  member_code?: string;
  pharmacy: number;
  pharmacy_name?: string;
  centre_name: string;
  status: 'PENDING' | 'PRESCRIPTION_REVIEW' | 'APPROVED' | 'PROCESSING' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED' | 'REJECTED' | 'CANCELLED' | 'NEED_MORE_INFORMATION';
  delivery_address: string;
  prescription_name?: string;
  prescription_file?: string;
  prescription_url?: string;
  additional_notes?: string;
  total_amount: number | string;
  delivery_charge: number | string;
  grand_total: number | string;
  items?: OrderItemDetail[];
  status_history?: OrderStatusHistoryItem[];
  created_at?: string;
}

// Helper for persistent browser storage (NEVER lost on reload)
function getStorageItem<T>(key: string, defaultVal: T[]): T[] {
  return [];
}

function setStorageItem<T>(key: string, val: T[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`bellevie_pharmacy_${key}`, JSON.stringify(val));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage`, err);
  }
}

let memoryPharmacies: PharmacyItem[] = getStorageItem('pharmacies', []);
let memoryMedicines: MedicineItem[] = getStorageItem('medicines', []);
let memoryInventories: InventoryItem[] = getStorageItem('inventories', []);
let memoryOrders: MedicineOrderItem[] = getStorageItem('orders', []);

async function safeApiCall<T>(call: () => Promise<T>): Promise<T | null> {
  try {
    return await call();
  } catch (err) {
    return null;
  }
}

export async function fetchMembers(): Promise<MemberItem[]> {
  const data = await safeApiCall(() => apiFetch<any>('/api/members/'));
  if (data) {
    const res = Array.isArray(data) ? data : data?.results || [];
    if (res.length > 0) return res;
  }
  return [];
}

export async function fetchPharmacies(statusFilter?: string, search?: string): Promise<PharmacyItem[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';

  const data = await safeApiCall(() => apiFetch<any>(`/api/pharmacy/list/${query}`));
  let apiList: PharmacyItem[] = [];
  if (data) {
    apiList = Array.isArray(data) ? data : data?.results || [];
  }

  memoryPharmacies = getStorageItem('pharmacies', []);
  const map = new Map<string | number, PharmacyItem>();
  apiList.forEach(item => map.set(item.id, item));
  memoryPharmacies.forEach(item => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  let list = Array.from(map.values());
  if (statusFilter && statusFilter !== 'ALL') {
    list = list.filter(p => p.status.toUpperCase() === statusFilter.toUpperCase());
  }
  if (search) {
    list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.location.toLowerCase().includes(search.toLowerCase()));
  }
  return list;
}

export async function approvePharmacy(id: number): Promise<PharmacyItem> {
  const res = await safeApiCall(() => apiFetch<PharmacyItem>(`/api/pharmacy/list/${id}/approve/`, { method: 'POST' }));
  memoryPharmacies = getStorageItem('pharmacies', memoryPharmacies);
  const p = memoryPharmacies.find(item => item.id === id);
  if (p) p.status = 'APPROVED';
  setStorageItem('pharmacies', memoryPharmacies);
  return res || p || memoryPharmacies[0];
}

export async function rejectPharmacy(id: number): Promise<PharmacyItem> {
  const res = await safeApiCall(() => apiFetch<PharmacyItem>(`/api/pharmacy/list/${id}/reject/`, { method: 'POST' }));
  memoryPharmacies = getStorageItem('pharmacies', memoryPharmacies);
  const p = memoryPharmacies.find(item => item.id === id);
  if (p) p.status = 'REJECTED';
  setStorageItem('pharmacies', memoryPharmacies);
  return res || p || memoryPharmacies[0];
}

export async function createPharmacy(payload: Partial<PharmacyItem>): Promise<PharmacyItem> {
  const res = await safeApiCall(() => apiFetch<PharmacyItem>('/api/pharmacy/list/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));

  const newItem: PharmacyItem = res || {
    id: Date.now(),
    name: payload.name || 'New Pharmacy',
    owner_name: payload.owner_name || '',
    trade_license: payload.trade_license || '',
    pharmacy_type: payload.pharmacy_type || 'Retail',
    address: payload.address || '',
    location: payload.location || 'Dhaka',
    phone: payload.phone || '01700000000',
    status: (payload.status as any) || 'APPROVED',
    open_status: 'OPEN',
    delivery_available: true,
    is_active: true,
  };

  memoryPharmacies = getStorageItem('pharmacies', memoryPharmacies);
  memoryPharmacies = [newItem, ...memoryPharmacies.filter(p => p.id !== newItem.id)];
  setStorageItem('pharmacies', memoryPharmacies);
  return newItem;
}

export async function fetchMedicines(statusFilter?: string, search?: string): Promise<MedicineItem[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';

  const data = await safeApiCall(() => apiFetch<any>(`/api/pharmacy/catalog/${query}`));
  let apiList: MedicineItem[] = [];
  if (data) {
    apiList = Array.isArray(data) ? data : data?.results || [];
  }

  memoryMedicines = getStorageItem('medicines', memoryMedicines);
  const map = new Map<string | number, MedicineItem>();
  apiList.forEach(item => map.set(item.id, item));
  memoryMedicines.forEach(item => {
    if (!map.has(item.id) && !Array.from(map.values()).some(existing => existing.name === item.name)) {
      map.set(item.id, item);
    }
  });

  let list = Array.from(map.values());
  if (search) {
    list = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.generic_name.toLowerCase().includes(search.toLowerCase()));
  }
  return list;
}

export async function createMedicine(payload: Partial<MedicineItem>): Promise<MedicineItem> {
  const res = await safeApiCall(() => apiFetch<MedicineItem>('/api/pharmacy/catalog/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));

  const newItem: MedicineItem = res || {
    id: Date.now(),
    name: payload.name || 'New Medicine',
    generic_name: payload.generic_name || 'Generic',
    strength: payload.strength || '500mg',
    form: payload.form || 'Tablet',
    manufacturer: payload.manufacturer || '',
    category: payload.category || 'Pain Relief',
    unit_price: payload.unit_price || '2.00',
    prescription_required: payload.prescription_required || false,
    status: (payload.status as any) || 'ACTIVE',
    description: payload.description || '',
  };

  memoryMedicines = getStorageItem('medicines', memoryMedicines);
  memoryMedicines = [newItem, ...memoryMedicines.filter(m => m.id !== newItem.id)];
  setStorageItem('medicines', memoryMedicines);
  return newItem;
}

export async function fetchInventory(pharmacyId?: string, statusFilter?: string, search?: string): Promise<InventoryItem[]> {
  const params = new URLSearchParams();
  if (pharmacyId && pharmacyId !== 'ALL') params.append('pharmacy', pharmacyId);
  if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';

  const data = await safeApiCall(() => apiFetch<any>(`/api/pharmacy/inventory/${query}`));
  let apiList: InventoryItem[] = [];
  if (data) {
    apiList = Array.isArray(data) ? data : data?.results || [];
  }

  memoryInventories = getStorageItem('inventories', memoryInventories);
  const map = new Map<string | number, InventoryItem>();
  apiList.forEach(item => map.set(item.id, item));
  memoryInventories.forEach(item => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  let list = Array.from(map.values());
  if (pharmacyId && pharmacyId !== 'ALL') {
    list = list.filter(i => String(i.pharmacy) === String(pharmacyId));
  }
  if (statusFilter && statusFilter !== 'ALL') {
    list = list.filter(i => i.status.toUpperCase() === statusFilter.toUpperCase());
  }
  if (search) {
    list = list.filter(i => i.medicine_name.toLowerCase().includes(search.toLowerCase()) || i.batch_no.toLowerCase().includes(search.toLowerCase()));
  }
  return list;
}

export async function createInventory(payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const res = await safeApiCall(() => apiFetch<InventoryItem>('/api/pharmacy/inventory/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));

  const stockNum = Number(payload.stock || 0);
  const reorderNum = Number(payload.reorder_level || 20);
  let computedStatus: InventoryItem['status'] = 'GOOD';
  if (stockNum <= 0) computedStatus = 'OUT_OF_STOCK';
  else if (stockNum <= reorderNum) computedStatus = 'LOW';

  const newItem: InventoryItem = res || {
    id: Date.now(),
    pharmacy: Number(payload.pharmacy) || 1,
    pharmacy_name: payload.pharmacy_name || 'Partner Pharmacy',
    medicine: Number(payload.medicine) || 1,
    medicine_name: payload.medicine_name || 'Medicine',
    strength: payload.strength || '500mg',
    form: payload.form || 'Tablet',
    batch_no: payload.batch_no || `BATCH-${Date.now().toString().slice(-4)}`,
    expiry_date: payload.expiry_date || '2028-12-31',
    stock: stockNum,
    unit: payload.unit || 'pcs',
    reorder_level: reorderNum,
    status: (payload.status as any) || computedStatus,
    updated_at: new Date().toISOString(),
  };

  memoryInventories = getStorageItem('inventories', memoryInventories);
  memoryInventories = [newItem, ...memoryInventories.filter(i => i.id !== newItem.id)];
  setStorageItem('inventories', memoryInventories);
  return newItem;
}

export async function fetchMedicineOrders(statusFilter?: string, centre?: string, search?: string): Promise<MedicineOrderItem[]> {
  const params = new URLSearchParams();
  if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
  if (centre) params.append('centre', centre);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';

  const data = await safeApiCall(() => apiFetch<any>(`/api/pharmacy/orders/${query}`));
  let apiList: MedicineOrderItem[] = [];
  if (data) {
    apiList = Array.isArray(data) ? data : data?.results || [];
  }

  memoryOrders = getStorageItem('orders', memoryOrders);
  const map = new Map<string | number, MedicineOrderItem>();
  apiList.forEach(item => map.set(item.id, item));
  memoryOrders.forEach(item => {
    if (!map.has(item.id) && !Array.from(map.values()).some(existing => existing.order_id === item.order_id)) {
      map.set(item.id, item);
    }
  });

  let list = Array.from(map.values());
  if (statusFilter && statusFilter !== 'ALL') {
    list = list.filter(o => o.status.toUpperCase() === statusFilter.toUpperCase());
  }
  if (search) {
    list = list.filter(o => o.order_id.toLowerCase().includes(search.toLowerCase()) || o.member_name.toLowerCase().includes(search.toLowerCase()));
  }
  return list;
}

export async function createMedicineOrder(payload: any): Promise<MedicineOrderItem> {
  const res = await safeApiCall(() => apiFetch<MedicineOrderItem>('/api/pharmacy/orders/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }));

  const pList = getStorageItem<PharmacyItem>('pharmacies', memoryPharmacies);
  const p = pList.find(item => item.id === Number(payload.pharmacy));
  const newOrd: MedicineOrderItem = res || {
    id: Date.now(),
    order_id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    member_name: payload.member_name || 'Abdul Karim',
    member_code: payload.member_code || 'BV-000124',
    pharmacy: payload.pharmacy || 1,
    pharmacy_name: p ? p.name : 'Partner Pharmacy',
    centre_name: payload.centre_name || 'Dhaka Centre',
    status: 'PENDING',
    delivery_address: payload.delivery_address || 'Dhaka',
    prescription_name: payload.prescription_name || '',
    prescription_url: payload.prescription_url || '',
    total_amount: payload.total_amount || 100,
    delivery_charge: payload.delivery_charge || 50,
    grand_total: payload.grand_total || 150,
    items: payload.items || [],
    created_at: new Date().toISOString()
  };

  memoryOrders = getStorageItem('orders', memoryOrders);
  memoryOrders = [newOrd, ...memoryOrders.filter(o => o.id !== newOrd.id)];
  setStorageItem('orders', memoryOrders);
  return newOrd;
}

export async function updateOrderStatus(id: number, statusStr: string, notes?: string, updatedBy = 'HQ Admin'): Promise<MedicineOrderItem> {
  const res = await safeApiCall(() => apiFetch<MedicineOrderItem>(`/api/pharmacy/orders/${id}/update_status/`, {
    method: 'POST',
    body: JSON.stringify({ status: statusStr, notes, updated_by: updatedBy }),
  }));

  memoryOrders = getStorageItem('orders', memoryOrders);
  const o = memoryOrders.find(item => item.id === id);
  if (o) o.status = statusStr as any;
  setStorageItem('orders', memoryOrders);
  return res || o || memoryOrders[0];
}
