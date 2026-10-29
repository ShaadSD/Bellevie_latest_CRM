import { apiFetch } from './api';

// -------------------------------------------------------------
// HOMECARE API TYPES (DJANGO REST FRAMEWORK BACKEND MATCHING)
// -------------------------------------------------------------

export type ApiHomecareCategory = 'DOCTOR' | 'NURSING' | 'PHYSIOTHERAPY' | 'SAMPLE';

export type ApiHomecareStatus =
  | 'PENDING'
  | 'VERIFYING'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ApiHomecareService {
  id: number;
  name: string;
  category: ApiHomecareCategory | string;
  category_name?: string;
  category_display?: string;
  description?: string;
  base_price: string;
  duration_minutes: number;
  is_published: boolean;
  is_active: boolean;
}

export interface ApiHomecareStaff {
  id: number;
  name: string;
  phone: string;
  category: ApiHomecareCategory | number | string;
  category_name?: string;
  category_code?: string;
  category_display?: string;
  qualification?: string;
  registration_number?: string;
  district?: string;
  is_verified: boolean;
  is_active: boolean;
}

export interface ApiHomecareAvailability {
  id: number;
  staff: number;
  staff_name?: string;
  start_datetime: string; // ISO 8601
  end_datetime: string;   // ISO 8601
  is_available: boolean;
  notes?: string;
}

export interface ApiHomecareRequest {
  id: number;
  public_id: string;

  member: number;
  member_public_id?: string;
  member_name?: string;

  service: number;
  service_name?: string;
  service_category?: ApiHomecareCategory | string;

  centre?: number | null;
  centre_name?: string;

  requested_by?: number | null;

  service_address: string;
  preferred_datetime: string;

  assigned_staff?: number | null;
  staff_name?: string | null;

  confirmed_datetime?: string | null;
  service_end_datetime?: string | null;
  service_base_price?: string | null;
  base_price?: string | null;
  agreed_price?: string | null;

  status: ApiHomecareStatus;
  status_display?: string;

  notes?: string | null;
  hq_notes?: string | null;

  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiHomecareHistoryItem {
  id: number;
  request: number;
  previous_status: ApiHomecareStatus | null;
  new_status: ApiHomecareStatus;
  changed_by?: number;
  changed_by_name?: string;
  notes?: string;
  created_at: string;
}

// -------------------------------------------------------------
// LOCAL STORAGE PERSISTENCE MOCK FALLBACK (FOR DEMO/OFFLINE)
// -------------------------------------------------------------

const STORAGE_KEYS = {
  SERVICES: 'bellevie_api_homecare_services',
  STAFF: 'bellevie_api_homecare_staff',
  AVAILABILITY: 'bellevie_api_homecare_availability',
  REQUESTS: 'bellevie_api_homecare_requests',
  HISTORY: 'bellevie_api_homecare_history',
};

const INITIAL_SERVICES: ApiHomecareService[] = [];

const INITIAL_STAFF: ApiHomecareStaff[] = [];

const INITIAL_AVAILABILITY: ApiHomecareAvailability[] = [];

const INITIAL_REQUESTS: ApiHomecareRequest[] = [];

const INITIAL_HISTORY: Record<number, ApiHomecareHistoryItem[]> = {};

const getStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch (err) {
    return fallback;
  }
};

const setStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage`, err);
  }
};

// -------------------------------------------------------------
// API SERVICE METHODS
// -------------------------------------------------------------

export const homecareServiceApi = {
  // 3.1 Get All Services
  getAllServices: async (filters?: { category?: string; is_published?: boolean; is_active?: boolean; search?: string; ordering?: string }): Promise<ApiHomecareService[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.is_published !== undefined) queryParams.set('is_published', String(filters.is_published));
      if (filters?.is_active !== undefined) queryParams.set('is_active', String(filters.is_active));
      if (filters?.search) queryParams.set('search', filters.search);
      if (filters?.ordering) queryParams.set('ordering', filters.ordering);

      const queryString = queryParams.toString();
      const endpoint = `/api/homecare/services/${queryString ? `?${queryString}` : ''}`;
      const res = await apiFetch<any>(endpoint);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    } catch (err) {
      console.warn('API fetch services failed, using local storage fallback', err);
      let list = getStorage<ApiHomecareService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      if (filters?.category) list = list.filter(s => s.category === filters.category);
      if (filters?.is_active !== undefined) list = list.filter(s => s.is_active === filters.is_active);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
      }
      return list;
    }
  },

  // 3.2 Get Single Service
  getServiceById: async (id: number): Promise<ApiHomecareService> => {
    try {
      return await apiFetch<ApiHomecareService>(`/api/homecare/services/${id}/`);
    } catch (err) {
      const list = getStorage<ApiHomecareService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      const found = list.find(s => s.id === id);
      if (!found) throw new Error('Service not found');
      return found;
    }
  },

  // 3.3 Create Service (HQ ONLY)
  createService: async (data: Omit<ApiHomecareService, 'id'>): Promise<ApiHomecareService> => {
    try {
      return await apiFetch<ApiHomecareService>('/api/homecare/services/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      const nextId = list.length > 0 ? Math.max(...list.map(s => s.id)) + 1 : 1;
      const created = { ...data, id: nextId };
      setStorage(STORAGE_KEYS.SERVICES, [...list, created]);
      return created;
    }
  },

  // 3.4 Update Service
  updateService: async (id: number, data: Partial<ApiHomecareService>): Promise<ApiHomecareService> => {
    try {
      return await apiFetch<ApiHomecareService>(`/api/homecare/services/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      const idx = list.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Service not found');
      list[idx] = { ...list[idx], ...data };
      setStorage(STORAGE_KEYS.SERVICES, list);
      return list[idx];
    }
  },

  // 3.5 Delete Service
  deleteService: async (id: number): Promise<void> => {
    try {
      await apiFetch(`/api/homecare/services/${id}/`, { method: 'DELETE' });
    } catch (err) {
      const list = getStorage<ApiHomecareService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      setStorage(STORAGE_KEYS.SERVICES, list.filter(s => s.id !== id));
    }
  }
};

export const homecareStaffApi = {
  // 4.1 Get Staff
  getAllStaff: async (filters?: { category?: string; district?: string; is_verified?: boolean; is_active?: boolean; search?: string }): Promise<ApiHomecareStaff[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.category) queryParams.set('category', filters.category);
      if (filters?.district) queryParams.set('district', filters.district);
      if (filters?.is_verified !== undefined) queryParams.set('is_verified', String(filters.is_verified));
      if (filters?.is_active !== undefined) queryParams.set('is_active', String(filters.is_active));
      if (filters?.search) queryParams.set('search', filters.search);

      const queryString = queryParams.toString();
      const res = await apiFetch<any>(`/api/homecare/staff/${queryString ? `?${queryString}` : ''}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    } catch (err) {
      let list = getStorage<ApiHomecareStaff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      if (filters?.category) list = list.filter(s => s.category === filters.category);
      if (filters?.district) list = list.filter(s => s.district === filters.district);
      if (filters?.is_verified !== undefined) list = list.filter(s => s.is_verified === filters.is_verified);
      if (filters?.is_active !== undefined) list = list.filter(s => s.is_active === filters.is_active);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q));
      }
      return list;
    }
  },

  // 4.2 Get Single Staff
  getStaffById: async (id: number): Promise<ApiHomecareStaff> => {
    try {
      return await apiFetch<ApiHomecareStaff>(`/api/homecare/staff/${id}/`);
    } catch (err) {
      const list = getStorage<ApiHomecareStaff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const found = list.find(s => s.id === id);
      if (!found) throw new Error('Staff not found');
      return found;
    }
  },

  // 4.3 Create Staff
  createStaff: async (data: Omit<ApiHomecareStaff, 'id'>): Promise<ApiHomecareStaff> => {
    try {
      return await apiFetch<ApiHomecareStaff>('/api/homecare/staff/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareStaff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const nextId = list.length > 0 ? Math.max(...list.map(s => s.id)) + 1 : 1;
      const created = { ...data, id: nextId };
      setStorage(STORAGE_KEYS.STAFF, [...list, created]);
      return created;
    }
  },

  // 4.4 Update Staff
  updateStaff: async (id: number, data: Partial<ApiHomecareStaff>): Promise<ApiHomecareStaff> => {
    try {
      return await apiFetch<ApiHomecareStaff>(`/api/homecare/staff/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareStaff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const idx = list.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Staff not found');
      list[idx] = { ...list[idx], ...data };
      setStorage(STORAGE_KEYS.STAFF, list);
      return list[idx];
    }
  },

  // 4.5 Delete Staff
  deleteStaff: async (id: number): Promise<void> => {
    try {
      await apiFetch(`/api/homecare/staff/${id}/`, { method: 'DELETE' });
    } catch (err) {
      const list = getStorage<ApiHomecareStaff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      setStorage(STORAGE_KEYS.STAFF, list.filter(s => s.id !== id));
    }
  }
};

export const homecareAvailabilityApi = {
  // 5.1 Get Availability
  getAvailability: async (filters?: { staff?: number; is_available?: boolean; search?: string; ordering?: string }): Promise<ApiHomecareAvailability[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.staff) queryParams.set('staff', String(filters.staff));
      if (filters?.is_available !== undefined) queryParams.set('is_available', String(filters.is_available));
      if (filters?.search) queryParams.set('search', filters.search);
      if (filters?.ordering) queryParams.set('ordering', filters.ordering);

      const queryString = queryParams.toString();
      const res = await apiFetch<any>(`/api/homecare/availability/${queryString ? `?${queryString}` : ''}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    } catch (err) {
      let list = getStorage<ApiHomecareAvailability[]>(STORAGE_KEYS.AVAILABILITY, INITIAL_AVAILABILITY);
      if (filters?.staff) list = list.filter(a => a.staff === filters.staff);
      if (filters?.is_available !== undefined) list = list.filter(a => a.is_available === filters.is_available);
      return list;
    }
  },

  // 5.2 Create Availability
  createAvailability: async (data: Omit<ApiHomecareAvailability, 'id'>): Promise<ApiHomecareAvailability> => {
    try {
      return await apiFetch<ApiHomecareAvailability>('/api/homecare/availability/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareAvailability[]>(STORAGE_KEYS.AVAILABILITY, INITIAL_AVAILABILITY);
      const nextId = list.length > 0 ? Math.max(...list.map(a => a.id)) + 1 : 1;
      const created = { ...data, id: nextId };
      setStorage(STORAGE_KEYS.AVAILABILITY, [...list, created]);
      return created;
    }
  },

  // 5.3 Update Availability
  updateAvailability: async (id: number, data: Partial<ApiHomecareAvailability>): Promise<ApiHomecareAvailability> => {
    try {
      return await apiFetch<ApiHomecareAvailability>(`/api/homecare/availability/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareAvailability[]>(STORAGE_KEYS.AVAILABILITY, INITIAL_AVAILABILITY);
      const idx = list.findIndex(a => a.id === id);
      if (idx === -1) throw new Error('Availability not found');
      list[idx] = { ...list[idx], ...data };
      setStorage(STORAGE_KEYS.AVAILABILITY, list);
      return list[idx];
    }
  },

  // 5.4 Delete Availability
  deleteAvailability: async (id: number): Promise<void> => {
    try {
      await apiFetch(`/api/homecare/availability/${id}/`, { method: 'DELETE' });
    } catch (err) {
      const list = getStorage<ApiHomecareAvailability[]>(STORAGE_KEYS.AVAILABILITY, INITIAL_AVAILABILITY);
      setStorage(STORAGE_KEYS.AVAILABILITY, list.filter(a => a.id !== id));
    }
  }
};

export const homecareRequestsApi = {
  // 6.1 Get Homecare Requests
  getRequests: async (filters?: {
    status?: string;
    centre?: number;
    service?: number;
    assigned_staff?: number;
    member?: number;
    search?: string;
    ordering?: string;
  }): Promise<ApiHomecareRequest[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.set('status', filters.status);
      if (filters?.centre) queryParams.set('centre', String(filters.centre));
      if (filters?.service) queryParams.set('service', String(filters.service));
      if (filters?.assigned_staff) queryParams.set('assigned_staff', String(filters.assigned_staff));
      if (filters?.member) queryParams.set('member', String(filters.member));
      if (filters?.search) queryParams.set('search', filters.search);
      if (filters?.ordering) queryParams.set('ordering', filters.ordering);

      const queryString = queryParams.toString();
      const res = await apiFetch<any>(`/api/homecare/requests/${queryString ? `?${queryString}` : ''}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    } catch (err) {
      let list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      if (filters?.status && filters.status !== 'ALL') list = list.filter(r => r.status === filters.status);
      if (filters?.centre) list = list.filter(r => r.centre === filters.centre);
      if (filters?.service) list = list.filter(r => r.service === filters.service);
      if (filters?.assigned_staff) list = list.filter(r => r.assigned_staff === filters.assigned_staff);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(r =>
          (r.member_name && r.member_name.toLowerCase().includes(q)) ||
          (r.staff_name && r.staff_name.toLowerCase().includes(q)) ||
          (r.service_name && r.service_name.toLowerCase().includes(q)) ||
          r.public_id.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },

  // 6.2 Get Single Request
  getRequestById: async (id: number): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>(`/api/homecare/requests/${id}/`);
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const found = list.find(r => r.id === id);
      if (!found) throw new Error('Request not found');
      return found;
    }
  },

  // 7. Create Homecare Request (HQ + Network Centre)
  createRequest: async (data: {
    member: number;
    service: number;
    service_address: string;
    preferred_datetime: string;
    notes?: string;
    member_name?: string;
    centre?: number;
    centre_name?: string;
  }): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>('/api/homecare/requests/', {
        method: 'POST',
        body: JSON.stringify({
          member: data.member,
          service: data.service,
          service_address: data.service_address,
          preferred_datetime: data.preferred_datetime,
          notes: data.notes,
        }),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const nextId = list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1;
      const servicesList = getStorage<ApiHomecareService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
      const svcObj = servicesList.find(s => s.id === data.service);
      const created: ApiHomecareRequest = {
        id: nextId,
        public_id: `HC-${String(nextId).padStart(3, '0')}-${Math.random().toString(36).substring(2, 8)}`,
        member: data.member,
        member_name: data.member_name || (data.member === 12 ? 'Abdul Karim' : data.member === 14 ? 'Rahim Ahmed' : `Member #${data.member}`),
        service: data.service,
        service_name: svcObj ? svcObj.name : (data.service === 1 ? 'Home Nursing' : data.service === 2 ? 'Doctor Home Visit' : 'Home Physiotherapy'),
        service_category: (svcObj ? svcObj.category : (data.service === 1 ? 'NURSING' : data.service === 2 ? 'DOCTOR' : 'PHYSIOTHERAPY')) as ApiHomecareCategory,
        service_base_price: svcObj ? svcObj.base_price : null,
        base_price: svcObj ? svcObj.base_price : null,
        agreed_price: svcObj ? svcObj.base_price : null,
        centre: data.centre || null,
        centre_name: data.centre_name || '',
        service_address: data.service_address,
        preferred_datetime: data.preferred_datetime,
        status: 'PENDING',
        status_display: 'Pending',
        notes: data.notes || '',
        created_at: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.REQUESTS, [created, ...list]);
      return created;
    }
  },

  // 8. Verify Request (HQ ONLY)
  verifyRequest: async (id: number): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>(`/api/homecare/requests/${id}/verify/`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].status = 'VERIFYING';
        list[idx].status_display = 'Verifying';
        setStorage(STORAGE_KEYS.REQUESTS, list);
        return list[idx];
      }
      throw err;
    }
  },

  // 9. Assign Staff (HQ ONLY)
  assignStaff: async (id: number, data: { assigned_staff: number; agreed_price?: string; hq_notes?: string }): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>(`/api/homecare/requests/${id}/assign/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const staffList = getStorage<ApiHomecareStaff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
      const staffObj = staffList.find(s => s.id === data.assigned_staff);

      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].assigned_staff = data.assigned_staff;
        list[idx].staff_name = staffObj ? staffObj.name : 'Rakib Hasan';
        list[idx].agreed_price = data.agreed_price || list[idx].service_base_price || list[idx].base_price || null;
        if (data.hq_notes) list[idx].hq_notes = data.hq_notes;
        list[idx].status = 'ASSIGNED';
        list[idx].status_display = 'Assigned';
        setStorage(STORAGE_KEYS.REQUESTS, list);
        return list[idx];
      }
      throw err;
    }
  },

  // 10. Confirm Homecare Service (HQ ONLY)
  confirmService: async (id: number, data: { confirmed_datetime: string }): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>(`/api/homecare/requests/${id}/confirm/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].confirmed_datetime = data.confirmed_datetime;
        list[idx].status = 'CONFIRMED';
        list[idx].status_display = 'Confirmed';
        setStorage(STORAGE_KEYS.REQUESTS, list);
        return list[idx];
      }
      throw err;
    }
  },

  // 11. Complete Request (Update Status to COMPLETED)
  updateStatus: async (id: number, data: { status: 'COMPLETED'; notes?: string }): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>(`/api/homecare/requests/${id}/update-status/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].status = 'COMPLETED';
        list[idx].status_display = 'Completed';
        if (data.notes) list[idx].notes = data.notes;
        list[idx].completed_at = new Date().toISOString();
        setStorage(STORAGE_KEYS.REQUESTS, list);
        return list[idx];
      }
      throw err;
    }
  },

  // 13. Reject Request (HQ ONLY)
  rejectRequest: async (id: number, data: { notes?: string }): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>(`/api/homecare/requests/${id}/reject/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].status = 'REJECTED';
        list[idx].status_display = 'Rejected';
        if (data.notes) list[idx].hq_notes = data.notes;
        setStorage(STORAGE_KEYS.REQUESTS, list);
        return list[idx];
      }
      throw err;
    }
  },

  // 14. Cancel Request (Network Centre: PENDING only; HQ: PENDING, VERIFYING, ASSIGNED, CONFIRMED)
  cancelRequest: async (id: number, data: { notes?: string }): Promise<ApiHomecareRequest> => {
    try {
      return await apiFetch<ApiHomecareRequest>(`/api/homecare/requests/${id}/cancel/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      const list = getStorage<ApiHomecareRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].status = 'CANCELLED';
        list[idx].status_display = 'Cancelled';
        if (data.notes) list[idx].notes = data.notes;
        setStorage(STORAGE_KEYS.REQUESTS, list);
        return list[idx];
      }
      throw err;
    }
  },

  // 15. Request History
  getRequestHistory: async (id: number): Promise<ApiHomecareHistoryItem[]> => {
    try {
      const res = await apiFetch<any>(`/api/homecare/requests/${id}/history/`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.results)) return res.results;
      return [];
    } catch (err) {
      const historyMap = getStorage<Record<number, ApiHomecareHistoryItem[]>>(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
      return historyMap[id] || [
        {
          id: 1,
          request: id,
          previous_status: null,
          new_status: 'PENDING',
          changed_by_name: 'Requester',
          notes: 'Homecare request created',
          created_at: new Date().toISOString(),
        }
      ];
    }
  }
};
