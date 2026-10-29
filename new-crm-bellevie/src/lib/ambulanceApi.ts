import { apiFetch } from './api';

// -------------------------------------------------------------
// AMBULANCE API TYPES (DJANGO REST FRAMEWORK BACKEND MATCHING)
// -------------------------------------------------------------

export type ApiAmbulanceStatus = 
  | 'PENDING'
  | 'VERIFYING'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type ApiAmbulancePriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type ApiAmbulanceVehicleType = 'BASIC' | 'AC' | 'ICU' | 'FREEZER';
export type ApiAmbulancePaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type ApiAmbulancePaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'CARD';

export type AmbulancePriority = 'Emergency' | 'High' | 'Medium' | 'Low';
export type AmbulanceVehicleType = 'ICU' | 'AC' | 'Basic' | 'Freezer';
export type AmbulancePaymentStatus = 'Paid' | 'Partial' | 'Unpaid';
export type AmbulanceStatus = ApiAmbulanceStatus;

export interface ApiAmbulanceProvider {
  id: number;
  name: string;
  phone: string;
  emergency_phone?: string;
  address?: string;
  district?: string;
  is_approved: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAmbulanceVehicle {
  id: number;
  provider: number;
  provider_name?: string;
  registration_number: string;
  vehicle_type: ApiAmbulanceVehicleType;
  driver_name: string;
  driver_phone: string;
  is_available: boolean;
  fleet_status: 'READY' | 'BUSY' | 'MAINTENANCE' | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAmbulanceRequest {
  id: number;
  public_id: string;
  
  member: number;
  member_name?: string;
  member_public_id?: string;
  
  centre?: number | null;
  centre_name?: string;
  
  requested_by?: number | null;
  
  pickup_location: string;
  destination: string;
  pickup_datetime: string;
  
  vehicle_type: ApiAmbulanceVehicleType;
  priority: ApiAmbulancePriority;
  
  provider?: number | null;
  provider_name?: string | null;
  provider_phone?: string | null;
  provider_emergency_phone?: string | null;
  
  vehicle?: number | null;
  vehicle_registration?: string | null;
  vehicle_driver_name?: string | null;
  vehicle_driver_phone?: string | null;
  
  estimated_fare?: string | number | null;
  
  payment_status: ApiAmbulancePaymentStatus;
  paid_amount?: string | number | null;
  payment_method?: ApiAmbulancePaymentMethod | string | null;
  payment_notes?: string | null;
  
  payment_updated_by?: number | null;
  payment_updated_by_name?: string;
  payment_updated_at?: string | null;
  
  due_amount?: string | number | null;
  
  status: ApiAmbulanceStatus;
  
  notes?: string | null;
  hq_notes?: string | null;
  
  dispatched_at?: string | null;
  completed_at?: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface ApiAmbulanceHistory {
  id: number;
  previous_status?: string | null;
  new_status: string;
  notes?: string;
  changed_by?: number;
  changed_by_name?: string;
  created_at: string;
}

export interface CreateAmbulancePayload {
  member: number;
  pickup_location: string;
  destination: string;
  pickup_datetime: string;
  vehicle_type: ApiAmbulanceVehicleType;
  priority: ApiAmbulancePriority;
  payment_status: ApiAmbulancePaymentStatus;
  paid_amount: string | number;
  payment_method?: ApiAmbulancePaymentMethod | string | null;
  payment_notes?: string;
  notes?: string;
}

export interface AssignAmbulancePayload {
  provider: number;
  vehicle: number;
  estimated_fare: string | number;
  hq_notes?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// -------------------------------------------------------------
// FRONTEND COMPATIBILITY MODEL
// -------------------------------------------------------------

export interface AmbulanceRequestItem {
  id: string; // e.g. "REQ-2024-00125" or public_id
  rawId: number;
  publicId: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  memberPhone?: string;
  centreId?: number | null;
  centre: string;
  priority: 'Emergency' | 'High' | 'Medium' | 'Low';
  apiPriority: ApiAmbulancePriority;
  pickupAddress: string;
  destinationAddress: string;
  pickupDate: string;
  pickupTime: string;
  rawPickupDatetime: string;
  vehicleType: 'ICU' | 'AC' | 'Basic' | 'Freezer';
  apiVehicleType: ApiAmbulanceVehicleType;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  apiPaymentStatus: ApiAmbulancePaymentStatus;
  paidAmount: number;
  estimatedFare: number;
  dueAmount: number;
  paymentMethod: string;
  paymentNotes: string;
  paymentRecordedBy: string;
  paymentRecordedAt: string;
  status: ApiAmbulanceStatus;
  requestedBy: string;
  notes: string;
  hqNotes: string;
  provider: string;
  providerId?: number | null;
  providerPhone?: string;
  providerEmergencyPhone?: string;
  vehicleNumber: string;
  vehicleId?: number | null;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
}

// Map Django Backend API object to Frontend UI model
export function mapApiToUiAmbulanceRequest(req: ApiAmbulanceRequest): AmbulanceRequestItem {
  const isIdString = typeof req.id === 'string';
  const reqCode = req.public_id ? `REQ-${req.public_id.slice(0, 8).toUpperCase()}` : `REQ-2024-${String(req.id).padStart(5, '0')}`;
  
  // Format dates
  let dateStr = '27 Aug 2024';
  let timeStr = '16:00';
  if (req.pickup_datetime) {
    try {
      const d = new Date(req.pickup_datetime);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
  }

  // Priority mapping
  let priorityUi: 'Emergency' | 'High' | 'Medium' | 'Low' = 'High';
  if (req.priority === 'EMERGENCY') priorityUi = 'Emergency';
  else if (req.priority === 'URGENT') priorityUi = 'High';
  else if (req.priority === 'NORMAL') priorityUi = 'Medium';

  // Vehicle type mapping
  let vehicleTypeUi: 'ICU' | 'AC' | 'Basic' | 'Freezer' = 'Basic';
  const vType = String(req.vehicle_type || '').toUpperCase();
  if (vType === 'ICU') vehicleTypeUi = 'ICU';
  else if (vType === 'FREEZER') vehicleTypeUi = 'Freezer';
  else if (vType === 'AC') vehicleTypeUi = 'AC';
  else if (vType === 'BASIC') vehicleTypeUi = 'Basic';
  else vehicleTypeUi = 'Basic';

  // Payment status mapping
  let paymentStatusUi: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
  if (req.payment_status === 'PAID') paymentStatusUi = 'Paid';
  else if (req.payment_status === 'PARTIAL') paymentStatusUi = 'Partial';

  const paidAmt = Number(req.paid_amount || 0);
  const estFare = Number(req.estimated_fare || 0);
  const dueAmt = req.due_amount !== undefined && req.due_amount !== null
    ? Number(req.due_amount)
    : Math.max(0, estFare - paidAmt);

  return {
    id: reqCode,
    rawId: req.id,
    publicId: req.public_id || String(req.id),
    memberId: String(req.member || ''),
    memberName: req.member_name || 'Member',
    memberCode: req.member_public_id || String(req.member || ''),
    centreId: req.centre ?? null,
    centre: req.centre_name || (req.centre ? `Centre #${req.centre}` : 'Head Office (Direct)'),
    priority: priorityUi,
    apiPriority: req.priority || 'URGENT',
    pickupAddress: req.pickup_location || '',
    destinationAddress: req.destination || '',
    pickupDate: dateStr,
    pickupTime: timeStr,
    rawPickupDatetime: req.pickup_datetime,
    vehicleType: vehicleTypeUi,
    apiVehicleType: req.vehicle_type || 'ICU',
    paymentStatus: paymentStatusUi,
    apiPaymentStatus: req.payment_status || 'PARTIAL',
    paidAmount: paidAmt,
    estimatedFare: estFare,
    dueAmount: dueAmt,
    paymentMethod: req.payment_method || 'bKash',
    paymentNotes: req.payment_notes || '',
    paymentRecordedBy: req.payment_updated_by_name || (req.payment_updated_by ? `User #${req.payment_updated_by}` : (req.centre_name || 'Centre User')),
    paymentRecordedAt: req.payment_updated_at ? new Date(req.payment_updated_at).toLocaleString() : `${dateStr}, ${timeStr}`,
    status: req.status || 'PENDING',
    requestedBy: req.centre_name || 'Network Centre',
    notes: req.notes || '',
    hqNotes: req.hq_notes || '',
    provider: req.provider_name || '-',
    providerId: req.provider,
    providerPhone: req.provider_phone || '',
    providerEmergencyPhone: req.provider_emergency_phone || '',
    vehicleNumber: req.vehicle_registration || '-',
    vehicleId: req.vehicle,
    driverName: req.vehicle_driver_name || '',
    driverPhone: req.vehicle_driver_phone || '',
    createdAt: req.created_at || new Date().toISOString()
  };
}

// -------------------------------------------------------------
// INITIAL MOCK DATA (EMPTY DEFAULT)
// -------------------------------------------------------------

export const INITIAL_AMBULANCE_REQUESTS: AmbulanceRequestItem[] = [];

// -------------------------------------------------------------
// REAL BACKEND API FUNCTIONS
// -------------------------------------------------------------

// 1. GET /api/ambulance/requests/
export async function fetchAmbulanceRequestsApi(params?: {
  status?: string;
  priority?: string;
  vehicle_type?: string;
  payment_status?: string;
  centre?: string;
  search?: string;
  ordering?: string;
}): Promise<AmbulanceRequestItem[]> {
  try {
    const queryParts: string[] = [];
    if (params?.status && params.status !== 'All') queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.priority && params.priority !== 'All') queryParts.push(`priority=${encodeURIComponent(params.priority)}`);
    if (params?.vehicle_type && params.vehicle_type !== 'All') queryParts.push(`vehicle_type=${encodeURIComponent(params.vehicle_type)}`);
    if (params?.payment_status && params.payment_status !== 'All') queryParts.push(`payment_status=${encodeURIComponent(params.payment_status)}`);
    if (params?.centre && params.centre !== 'All') {
      if (/^\d+$/.test(params.centre.trim())) {
        queryParts.push(`centre=${encodeURIComponent(params.centre.trim())}`);
      } else if (!params?.search) {
        queryParts.push(`search=${encodeURIComponent(params.centre.trim())}`);
      }
    }
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params?.ordering) queryParts.push(`ordering=${encodeURIComponent(params.ordering)}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await apiFetch<PaginatedResponse<ApiAmbulanceRequest> | ApiAmbulanceRequest[]>(
      `/api/ambulance/requests/${queryString}`
    );

    let rawList: ApiAmbulanceRequest[] = [];
    if (Array.isArray(res)) {
      rawList = res;
    } else if (res && 'results' in res && Array.isArray(res.results)) {
      rawList = res.results;
    }

    return rawList.map(mapApiToUiAmbulanceRequest);
  } catch (err) {
    console.warn('Backend Ambulance GET /api/ambulance/requests/ failed:', err);
    return [];
  }
}

// 2. POST /api/ambulance/requests/ (Create Request by NC)
export async function createAmbulanceRequestApi(
  payload: CreateAmbulancePayload
): Promise<AmbulanceRequestItem> {
  const res = await apiFetch<ApiAmbulanceRequest>('/api/ambulance/requests/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return mapApiToUiAmbulanceRequest(res);
}

// 2b. PATCH /api/ambulance/requests/{id}/ (Update Request)
export async function updateAmbulanceRequestApi(
  id: number | string,
  payload: Partial<CreateAmbulancePayload>,
  publicId?: string
): Promise<AmbulanceRequestItem> {
  const candidates: (string | number)[] = [];
  if (publicId) candidates.push(publicId);
  if (id) candidates.push(id);

  const uniqueCandidates = Array.from(new Set(candidates));
  let lastErr: any = null;

  for (const target of uniqueCandidates) {
    try {
      const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${target}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      return mapApiToUiAmbulanceRequest(res);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Failed to update request');
}

// 2c. DELETE /api/ambulance/requests/{id}/ (Delete Request)
export async function deleteAmbulanceRequestApi(
  id: number | string,
  publicId?: string
): Promise<void> {
  const candidates: (string | number)[] = [];
  if (publicId) candidates.push(publicId);
  if (id) candidates.push(id);

  const uniqueCandidates = Array.from(new Set(candidates));
  let lastErr: any = null;

  for (const target of uniqueCandidates) {
    try {
      await apiFetch(`/api/ambulance/requests/${target}/`, {
        method: 'DELETE'
      });
      return;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Failed to delete request');
}

// 3. GET /api/ambulance/requests/{id}/
export async function fetchAmbulanceRequestDetailApi(id: number | string, publicId?: string): Promise<AmbulanceRequestItem> {
  try {
    const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${id}/`);
    return mapApiToUiAmbulanceRequest(res);
  } catch (err: any) {
    if (err?.status === 404 && publicId && String(id) !== String(publicId)) {
      const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${publicId}/`);
      return mapApiToUiAmbulanceRequest(res);
    }
    throw err;
  }
}

// 4. POST /api/ambulance/requests/{id}/verify/ (HQ only: PENDING -> VERIFYING)
export async function verifyAmbulanceRequestApi(id: number | string, publicId?: string): Promise<AmbulanceRequestItem> {
  try {
    const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${id}/verify/`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    return mapApiToUiAmbulanceRequest(res);
  } catch (err: any) {
    if (err?.status === 404 && publicId && String(id) !== String(publicId)) {
      const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${publicId}/verify/`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      return mapApiToUiAmbulanceRequest(res);
    }
    throw err;
  }
}

// 5. POST /api/ambulance/requests/{id}/assign/ (HQ only: Assign Provider & Vehicle)
export async function assignAmbulanceRequestApi(
  id: number | string,
  payload: AssignAmbulancePayload,
  publicId?: string
): Promise<AmbulanceRequestItem> {
  try {
    const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${id}/assign/`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return mapApiToUiAmbulanceRequest(res);
  } catch (err: any) {
    if (err?.status === 404 && publicId && String(id) !== String(publicId)) {
      const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${publicId}/assign/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return mapApiToUiAmbulanceRequest(res);
    }
    throw err;
  }
}

// 6. POST /api/ambulance/requests/{id}/update-status/ (Advance status: ASSIGNED -> DISPATCHED -> IN_TRANSIT -> COMPLETED)
export async function updateTripStatusApi(id: number | string, publicId?: string): Promise<AmbulanceRequestItem> {
  try {
    const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${id}/update-status/`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    return mapApiToUiAmbulanceRequest(res);
  } catch (err: any) {
    if (err?.status === 404 && publicId && String(id) !== String(publicId)) {
      const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${publicId}/update-status/`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      return mapApiToUiAmbulanceRequest(res);
    }
    throw err;
  }
}

// 7. POST /api/ambulance/requests/{id}/reject/ (HQ only)
export async function rejectAmbulanceRequestApi(
  id: number | string,
  hq_notes?: string,
  publicId?: string
): Promise<AmbulanceRequestItem> {
  try {
    const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ hq_notes })
    });
    return mapApiToUiAmbulanceRequest(res);
  } catch (err: any) {
    if (err?.status === 404 && publicId && String(id) !== String(publicId)) {
      const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${publicId}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ hq_notes })
      });
      return mapApiToUiAmbulanceRequest(res);
    }
    throw err;
  }
}

// 8. POST /api/ambulance/requests/{id}/cancel/ (NC or HQ cancel)
export async function cancelAmbulanceRequestApi(id: number | string, publicId?: string): Promise<AmbulanceRequestItem> {
  try {
    const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    return mapApiToUiAmbulanceRequest(res);
  } catch (err: any) {
    if (err?.status === 404 && publicId && String(id) !== String(publicId)) {
      const res = await apiFetch<ApiAmbulanceRequest>(`/api/ambulance/requests/${publicId}/cancel/`, {
        method: 'POST',
        body: JSON.stringify({})
      });
      return mapApiToUiAmbulanceRequest(res);
    }
    throw err;
  }
}

// 9. GET /api/ambulance/requests/{id}/history/
export async function fetchAmbulanceHistoryApi(id: number | string, publicId?: string): Promise<ApiAmbulanceHistory[]> {
  try {
    const res = await apiFetch<ApiAmbulanceHistory[] | PaginatedResponse<ApiAmbulanceHistory>>(
      `/api/ambulance/requests/${id}/history/`
    );
    if (Array.isArray(res)) return res;
    if (res && 'results' in res && Array.isArray(res.results)) return res.results;
    return [];
  } catch (err) {
    if (publicId && String(id) !== String(publicId)) {
      try {
        const res = await apiFetch<ApiAmbulanceHistory[] | PaginatedResponse<ApiAmbulanceHistory>>(
          `/api/ambulance/requests/${publicId}/history/`
        );
        if (Array.isArray(res)) return res;
        if (res && 'results' in res && Array.isArray(res.results)) return res.results;
      } catch (e) {}
    }
    return [];
  }
}

// 10. GET /api/ambulance/providers/
export async function fetchAmbulanceProvidersApi(params?: {
  is_approved?: boolean;
  is_active?: boolean;
  search?: string;
}): Promise<ApiAmbulanceProvider[]> {
  try {
    const queryParts: string[] = [];
    if (params?.is_approved !== undefined) queryParts.push(`is_approved=${params.is_approved}`);
    if (params?.is_active !== undefined) queryParts.push(`is_active=${params.is_active}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    const q = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const res = await apiFetch<ApiAmbulanceProvider[] | PaginatedResponse<ApiAmbulanceProvider>>(
      `/api/ambulance/providers/${q}`
    );
    if (Array.isArray(res)) return res;
    if (res && 'results' in res && Array.isArray(res.results)) return res.results;
  } catch (err) {
    console.warn('Failed to fetch providers API:', err);
  }

  return [];
}

// 11. GET /api/ambulance/vehicles/
export async function fetchAmbulanceVehiclesApi(params?: {
  vehicle_type?: ApiAmbulanceVehicleType;
  fleet_status?: string;
  is_available?: boolean;
  provider?: number;
  search?: string;
}): Promise<ApiAmbulanceVehicle[]> {
  try {
    const queryParts: string[] = [];
    if (params?.vehicle_type) queryParts.push(`vehicle_type=${encodeURIComponent(params.vehicle_type)}`);
    if (params?.fleet_status) queryParts.push(`fleet_status=${encodeURIComponent(params.fleet_status)}`);
    if (params?.is_available !== undefined) queryParts.push(`is_available=${params.is_available}`);
    if (params?.provider) queryParts.push(`provider=${params.provider}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    const q = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const res = await apiFetch<ApiAmbulanceVehicle[] | PaginatedResponse<ApiAmbulanceVehicle>>(
      `/api/ambulance/vehicles/${q}`
    );
    if (Array.isArray(res)) return res;
    if (res && 'results' in res && Array.isArray(res.results)) return res.results;
  } catch (err) {
    console.warn('Failed to fetch vehicles API:', err);
  }

  return [];
}
