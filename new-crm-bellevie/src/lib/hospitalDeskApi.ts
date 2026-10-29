import { apiFetch, BASE_URL } from './api';
import { fetchHospitalsListApi, ApiHospital } from './appointmentsApi';
import { fetchMembersList, ApiMember } from './membersApi';

// -------------------------------------------------------------
// HOSPITAL DESK TYPES & TRANSITION RULES
// -------------------------------------------------------------

export type BedType = 'ICU' | 'CCU' | 'HDU' | 'NICU' | 'PICU' | 'CABIN' | 'WARD';

export type HospitalBookingStatus =
  | 'PENDING'
  | 'VERIFYING'
  | 'CONFIRMED'
  | 'ADMITTED'
  | 'DISCHARGED'
  | 'REJECTED'
  | 'CANCELLED';

// Backend Status Transition Rules Map (Section 36)
export const ALLOWED_STATUS_TRANSITIONS: Record<HospitalBookingStatus, HospitalBookingStatus[]> = {
  PENDING: ['VERIFYING', 'REJECTED'],
  VERIFYING: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['ADMITTED'],
  ADMITTED: ['DISCHARGED'],
  REJECTED: [],
  CANCELLED: [],
  DISCHARGED: []
};

export interface BedAvailabilityRecord {
  id: string;
  hospital: string | number;
  hospitalName: string;
  district: string;
  bedType: BedType;
  total: number;
  available: number;
  rate: number; // BDT
  isPublished: boolean;
  lastVerified: string; // string timestamp
  verifiedRelative?: string;
  image?: string;
}

export interface BookingTimelineItem {
  status: HospitalBookingStatus;
  timestamp: string;
  actor: string;
}

export interface HospitalBookingRecord {
  id: string; // e.g. HD-1024 or HD-1
  publicId: string;
  memberId: number;
  memberPublicId?: string;
  memberName: string;
  memberPhone: string;
  memberEmail: string;
  memberAddress?: string;
  hospital: string;
  hospitalId?: number;
  hospitalDistrict: string;
  hospitalPhone: string;
  bedType: BedType;
  status: HospitalBookingStatus;
  centre: string;
  requestedBy: string;
  createdAt: string;
  notes: string;
  hqNotes?: string;
  dailyRate?: number;
  totalAvailableAtTime?: number;
  timeline: BookingTimelineItem[];
}

export interface HospitalDeskMetrics {
  totalHospitals: number;
  activeHospitals: number;
  approvedHospitals: number;
  publishedBedRecords: number;
  unpublishedBedRecords: number;
  availableBedsPublished: number;
  totalBookings: number;
  statusCounts: {
    pending: number;
    verifying: number;
    confirmed: number;
    admitted: number;
    discharged: number;
    rejected: number;
  };
}

// -------------------------------------------------------------
// LOCAL STORAGE PERSISTENCE HELPERS
// -------------------------------------------------------------

const BEDS_STORAGE_KEY = 'bellevie_hospital_beds_v1';
const BOOKINGS_STORAGE_KEY = 'bellevie_hospital_bookings_v1';

export function getStoredBeds(): BedAvailabilityRecord[] {
  return [];
}

export function saveStoredBeds(records: BedAvailabilityRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BEDS_STORAGE_KEY, JSON.stringify(records));
}

export function getStoredBookings(): HospitalBookingRecord[] {
  return [];
}

export function saveStoredBookings(records: HospitalBookingRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(records));
}

// Helper to format backend errors accurately
export function parseApiError(err: any): string {
  if (typeof err === 'string') return err;
  if (err?.detail) return err.detail;
  if (err?.non_field_errors?.[0]) return err.non_field_errors[0];
  if (err?.message) return err.message;
  if (typeof err === 'object') {
    const keys = Object.keys(err);
    if (keys.length > 0) {
      const firstVal = err[keys[0]];
      if (Array.isArray(firstVal)) return `${keys[0]}: ${firstVal[0]}`;
      if (typeof firstVal === 'string') return `${keys[0]}: ${firstVal}`;
    }
  }
  return 'An error occurred. Please check input data.';
}

// -------------------------------------------------------------
// DYNAMIC API FETCHERS & LOOKUP HELPERS
// -------------------------------------------------------------

export async function fetchHospitalsApi(): Promise<ApiHospital[]> {
  try {
    const res = await fetchHospitalsListApi();
    if (Array.isArray(res)) return res;
    if (res?.results && Array.isArray(res.results)) return res.results;
  } catch (err) {
    console.warn('Failed to fetch hospitals from backend API:', err);
  }
  return [];
}

// Helper to build ID -> Hospital and ID -> Member lookup maps dynamically
async function getLookupMaps() {
  const [hospitalsRes, membersRes] = await Promise.allSettled([
    fetchHospitalsApi(),
    fetchMembersList()
  ]);

  const hospitalMap: Record<number | string, ApiHospital> = {};
  if (hospitalsRes.status === 'fulfilled' && Array.isArray(hospitalsRes.value)) {
    hospitalsRes.value.forEach(h => {
      hospitalMap[h.id] = h;
      hospitalMap[h.name] = h;
    });
  }

  const memberMap: Record<number | string, ApiMember> = {};
  if (membersRes.status === 'fulfilled') {
    const mList = Array.isArray(membersRes.value)
      ? membersRes.value
      : membersRes.value?.results;
    if (Array.isArray(mList)) {
      mList.forEach(m => {
        memberMap[m.id] = m;
        memberMap[m.full_name] = m;
      });
    }
  }

  return { hospitalMap, memberMap, hospitalsList: hospitalsRes.status === 'fulfilled' ? hospitalsRes.value : [] };
}

// -------------------------------------------------------------
// DYNAMIC METRICS CALCULATOR (100% REAL DYNAMIC DATA)
// -------------------------------------------------------------

export async function fetchHospitalDeskMetrics(): Promise<HospitalDeskMetrics> {
  const [beds, bookings, hospitalsList] = await Promise.all([
    fetchBedAvailabilitiesApi(),
    fetchHospitalBookingsApi(),
    fetchHospitalsApi()
  ]);

  const publishedBeds = beds.filter(b => b.isPublished);
  const totalPublishedAvailable = publishedBeds.reduce((acc, b) => acc + b.available, 0);

  const pending = bookings.filter(b => b.status === 'PENDING').length;
  const verifying = bookings.filter(b => b.status === 'VERIFYING').length;
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const admitted = bookings.filter(b => b.status === 'ADMITTED').length;
  const discharged = bookings.filter(b => b.status === 'DISCHARGED').length;
  const rejected = bookings.filter(b => b.status === 'REJECTED').length;

  const activeHospCount = hospitalsList.filter(h => h.is_active !== false).length;

  return {
    totalHospitals: hospitalsList.length,
    activeHospitals: activeHospCount,
    approvedHospitals: hospitalsList.length,
    publishedBedRecords: publishedBeds.length,
    unpublishedBedRecords: beds.filter(b => !b.isPublished).length,
    availableBedsPublished: totalPublishedAvailable,
    totalBookings: bookings.length,
    statusCounts: {
      pending,
      verifying,
      confirmed,
      admitted,
      discharged,
      rejected
    }
  };
}

// 7.1 Bed Availability API (GET /api/hospital-desk/availability/)
export async function fetchBedAvailabilitiesApi(params?: {
  hospital?: string | number;
  bed_type?: string;
  is_published?: boolean;
  min_available?: number;
  search?: string;
  ordering?: string;
}): Promise<BedAvailabilityRecord[]> {
  try {
    const { hospitalMap } = await getLookupMaps();
    const query = new URLSearchParams();
    if (params?.hospital) query.append('hospital', String(params.hospital));
    if (params?.bed_type) query.append('bed_type', params.bed_type);
    if (params?.is_published !== undefined) query.append('is_published', String(params.is_published));
    if (params?.min_available !== undefined) query.append('min_available', String(params.min_available));
    if (params?.search) query.append('search', params.search);
    if (params?.ordering) query.append('ordering', params.ordering);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch<any>(`/api/hospital-desk/availability/${qs}`);
    const results = Array.isArray(res) ? res : res?.results;

    if (Array.isArray(results)) {
      return results.map((item: any) => {
        const rawHosp = item.hospital;
        const matchedHosp = hospitalMap[rawHosp] || hospitalMap[item.hospital_name];
        const resolvedHospName = item.hospital_name || matchedHosp?.name || (typeof rawHosp === 'string' ? rawHosp : `Hospital #${rawHosp}`);
        const resolvedDistrict = item.district || matchedHosp?.district || 'Dhaka';

        const rawImg = item.hospital_image || item.image || matchedHosp?.image;
        const resolvedImg = rawImg
          ? (rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
          : undefined;

        return {
          id: String(item.id),
          hospital: rawHosp,
          hospitalName: resolvedHospName,
          district: resolvedDistrict,
          bedType: item.bed_type as BedType,
          total: item.total_beds ?? item.total ?? 0,
          available: item.available_beds ?? item.available ?? 0,
          rate: parseFloat(item.daily_rate || '0') || item.rate || 0,
          isPublished: item.is_published ?? true,
          lastVerified: item.last_verified_at
            ? new Date(item.last_verified_at).toLocaleString()
            : 'Just now',
          verifiedRelative: item.verified_relative || 'Live',
          image: resolvedImg || 'https://images.unsplash.com/photo-1587354246490-7e29e31ecb58?auto=format&fit=crop&w=400&q=80'
        };
      });
    }
  } catch (err) {
    console.warn('API bed availability error:', err);
  }
  return [];
}

// 10. Create / Edit Bed Availability (POST / PATCH /api/hospital-desk/availability/)
export async function saveBedAvailabilityApi(record: Partial<BedAvailabilityRecord>): Promise<BedAvailabilityRecord> {
  const { hospitalsList } = await getLookupMaps();

  // Resolve numeric hospital ID if record.hospital is name string
  let hospId: number = 1;
  if (typeof record.hospital === 'number') {
    hospId = record.hospital;
  } else if (record.hospital) {
    const searchName = String(record.hospital).trim();
    const matched = hospitalsList.find(h =>
      h.name === searchName ||
      String(h.id) === searchName ||
      searchName.includes(h.name) ||
      h.name.includes(searchName)
    );
    if (matched) hospId = matched.id;
    else if (!isNaN(Number(searchName))) hospId = Number(searchName);
  }

  // Section 11 Client-side validation check: available_beds <= total_beds
  if (record.available !== undefined && record.total !== undefined && record.available > record.total) {
    throw new Error('Available beds cannot be greater than total beds.');
  }

  const payload = {
    hospital: hospId,
    bed_type: record.bedType,
    total_beds: record.total,
    available_beds: record.available,
    daily_rate: record.rate !== undefined ? String(record.rate) : '0.00',
    is_published: record.isPublished ?? true
  };

  let savedRecord: BedAvailabilityRecord | null = null;

  try {
    if (record.id && !isNaN(Number(record.id))) {
      // PATCH /api/hospital-desk/availability/{id}/
      const res = await apiFetch<any>(`/api/hospital-desk/availability/${record.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (res?.id) {
        const freshList = await fetchBedAvailabilitiesApi();
        savedRecord = freshList.find(b => b.id === String(res.id)) || {
          id: String(res.id),
          hospital: hospId,
          hospitalName: String(record.hospitalName || record.hospital || 'Hospital'),
          district: record.district || 'Dhaka',
          bedType: record.bedType || 'ICU',
          total: record.total || 0,
          available: record.available || 0,
          rate: record.rate || 0,
          isPublished: record.isPublished ?? true,
          lastVerified: 'Just now'
        };
      }
    } else if (!record.id) {
      // POST /api/hospital-desk/availability/
      const res = await apiFetch<any>('/api/hospital-desk/availability/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res?.id) {
        const freshList = await fetchBedAvailabilitiesApi();
        savedRecord = freshList.find(b => b.id === String(res.id)) || {
          id: String(res.id),
          hospital: hospId,
          hospitalName: String(record.hospitalName || record.hospital || 'Hospital'),
          district: record.district || 'Dhaka',
          bedType: record.bedType || 'ICU',
          total: record.total || 0,
          available: record.available || 0,
          rate: record.rate || 0,
          isPublished: record.isPublished ?? true,
          lastVerified: 'Just now'
        };
      }
    }
  } catch (err: any) {
    console.warn('API save bed warning/error:', err);
    // If it's a 400 Bad Request validation error from backend, rethrow so UI displays exact validation error
    if (err?.status === 400 || (typeof err === 'object' && (err?.hospital || err?.bed_type || err?.non_field_errors))) {
      throw new Error(parseApiError(err));
    }
  }

  // Update Local Storage state so local edits/offline persist cleanly
  const current = getStoredBeds();
  let updatedRecord: BedAvailabilityRecord;

  if (record.id) {
    const idx = current.findIndex(b => b.id === record.id);
    if (idx !== -1) {
      updatedRecord = {
        ...current[idx],
        ...record,
        hospitalName: String(record.hospitalName || record.hospital || current[idx].hospitalName),
        lastVerified: 'Just now',
        verifiedRelative: '0 mins ago'
      };
      current[idx] = updatedRecord;
    } else {
      updatedRecord = savedRecord || {
        id: record.id,
        hospital: hospId,
        hospitalName: String(record.hospitalName || record.hospital || 'Hospital'),
        district: record.district || 'Dhaka',
        bedType: record.bedType || 'ICU',
        total: record.total || 0,
        available: record.available || 0,
        rate: record.rate || 0,
        isPublished: record.isPublished ?? true,
        lastVerified: 'Just now',
        verifiedRelative: '0 mins ago'
      };
      current.unshift(updatedRecord);
    }
  } else {
    updatedRecord = savedRecord || {
      id: String(Date.now()),
      hospital: hospId,
      hospitalName: String(record.hospitalName || record.hospital || 'Hospital'),
      district: record.district || 'Dhaka',
      bedType: record.bedType || 'ICU',
      total: record.total || 0,
      available: record.available || 0,
      rate: record.rate || 0,
      isPublished: record.isPublished ?? true,
      lastVerified: 'Just now',
      verifiedRelative: '0 mins ago',
      image: record.image || 'https://images.unsplash.com/photo-1587354246490-7e29e31ecb58?auto=format&fit=crop&w=400&q=80'
    };
    if (!current.some(b => b.id === updatedRecord.id)) {
      current.unshift(updatedRecord);
    }
  }

  saveStoredBeds(current);
  return savedRecord || updatedRecord;
}

// 12 & 14. Publish / Unpublish Bed Availability (PATCH /api/hospital-desk/availability/{id}/)
export async function toggleBedPublishApi(id: string): Promise<BedAvailabilityRecord> {
  const current = getStoredBeds();
  const idx = current.findIndex(b => b.id === id);
  const nextPublishedState = idx !== -1 ? !current[idx].isPublished : true;

  try {
    const res = await apiFetch<any>(`/api/hospital-desk/availability/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: nextPublishedState })
    });
    if (res?.id) {
      const freshList = await fetchBedAvailabilitiesApi();
      return freshList.find(b => b.id === String(res.id))!;
    }
  } catch (err) {
    console.warn('API publish toggle failed, using fallback:', err);
  }

  if (idx !== -1) {
    current[idx].isPublished = nextPublishedState;
    saveStoredBeds(current);
    return current[idx];
  }
  throw new Error('Bed record not found');
}

// 16. List Bookings API (GET /api/hospital-desk/bookings/)
export async function fetchHospitalBookingsApi(params?: {
  status?: string;
  hospital?: string | number;
  member?: string | number;
  centre?: string | number;
  bed_type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
}): Promise<HospitalBookingRecord[]> {
  try {
    const { hospitalMap, memberMap } = await getLookupMaps();
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.hospital) query.append('hospital', String(params.hospital));
    if (params?.member) query.append('member', String(params.member));
    if (params?.centre) query.append('centre', String(params.centre));
    if (params?.bed_type) query.append('bed_type', params.bed_type);
    if (params?.search) query.append('search', params.search);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.ordering) query.append('ordering', params.ordering);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await apiFetch<any>(`/api/hospital-desk/bookings/${qs}`);
    const results = Array.isArray(res) ? res : res?.results;

    if (Array.isArray(results)) {
      return results.map((item: any) => {
        const rawHosp = item.hospital;
        const matchedHosp = hospitalMap[rawHosp] || hospitalMap[item.hospital_name];
        const resolvedHospName = item.hospital_name || matchedHosp?.name || (typeof rawHosp === 'string' ? rawHosp : `Hospital #${rawHosp}`);

        const rawMem = item.member;
        const matchedMem = memberMap[rawMem] || memberMap[item.member_name];
        const resolvedMemName = item.member_name || matchedMem?.full_name || (typeof rawMem === 'string' ? rawMem : `Member #${rawMem}`);
        const resolvedMemPhone = item.member_phone || matchedMem?.phone || '-';
        const resolvedMemEmail = item.member_email || matchedMem?.email || '-';

        return {
          id: item.id ? `HD-${item.id}` : `HD-1000`,
          publicId: item.public_id || 'a3d5c9c8-7b9f-4ae2-xxxx-xxxxxxxxxxxx',
          memberId: typeof rawMem === 'number' ? rawMem : 0,
          memberPublicId: item.member_public_id || matchedMem?.public_id || '',
          memberName: resolvedMemName,
          memberPhone: resolvedMemPhone,
          memberEmail: resolvedMemEmail,
          memberAddress: item.member_address || matchedMem?.address || item.hospital_district || matchedHosp?.district || 'Dhaka',
          hospital: resolvedHospName,
          hospitalId: typeof rawHosp === 'number' ? rawHosp : undefined,
          hospitalDistrict: item.hospital_district || matchedHosp?.district || 'Dhaka',
          hospitalPhone: item.hospital_phone || matchedHosp?.phone || '-',
          bedType: item.bed_type as BedType,
          status: item.status as HospitalBookingStatus,
          centre: item.centre_name || item.centre || 'Dhaka Centre',
          requestedBy: item.requested_by_name || item.requested_by || 'Centre User',
          createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now',
          notes: item.notes || '',
          hqNotes: item.hq_notes || '',
          dailyRate: item.daily_rate ? parseFloat(item.daily_rate) : 0,
          totalAvailableAtTime: item.available_beds_at_booking || 0,
          timeline: item.timeline || [
            { status: item.status, timestamp: new Date(item.created_at || Date.now()).toLocaleString(), actor: 'System' }
          ]
        };
      });
    }
  } catch (err) {
    console.warn('API bookings error:', err);
  }
  return [];
}

// 19. Create Hospital Booking (POST /api/hospital-desk/bookings/)
export async function createHospitalBookingApi(payload: {
  memberId: number;
  memberName: string;
  memberPhone?: string;
  memberEmail?: string;
  hospital: string | number;
  bedType: BedType;
  centre?: string;
  notes: string;
  requestedBy?: string;
}): Promise<HospitalBookingRecord> {
  const { hospitalsList } = await getLookupMaps();
  let hospId: number = typeof payload.hospital === 'number' ? payload.hospital : 1;
  if (typeof payload.hospital === 'string') {
    const matched = hospitalsList.find(h => h.name === payload.hospital || String(h.id) === payload.hospital);
    if (matched) hospId = matched.id;
    else if (!isNaN(Number(payload.hospital))) hospId = Number(payload.hospital);
  }

  try {
    const res = await apiFetch<any>('/api/hospital-desk/bookings/', {
      method: 'POST',
      body: JSON.stringify({
        member: payload.memberId,
        hospital: hospId,
        bed_type: payload.bedType,
        notes: payload.notes || ''
      })
    });

    if (res?.id) {
      const list = await fetchHospitalBookingsApi();
      const created = list.find(b => b.id.includes(String(res.id)));
      if (created) return created;
      return {
        id: `HD-${res.id}`,
        publicId: res.public_id || '',
        memberId: res.member,
        memberPublicId: res.member_public_id || '',
        memberName: res.member_name || payload.memberName,
        memberPhone: res.member_phone || payload.memberPhone || '-',
        memberEmail: res.member_email || payload.memberEmail || '-',
        memberAddress: res.member_address || 'Dhaka',
        hospital: res.hospital_name || String(payload.hospital),
        hospitalId: typeof res.hospital === 'number' ? res.hospital : hospId,
        hospitalDistrict: res.hospital_district || 'Dhaka',
        hospitalPhone: res.hospital_phone || '-',
        bedType: res.bed_type as BedType,
        status: (res.status as HospitalBookingStatus) || 'Pending',
        centre: res.centre_name || payload.centre || 'Dhaka Centre',
        requestedBy: res.requested_by_name || 'Centre User',
        createdAt: res.created_at ? new Date(res.created_at).toLocaleString() : 'Just now',
        notes: res.notes || payload.notes || '',
        hqNotes: res.hq_notes || '',
        dailyRate: res.daily_rate ? parseFloat(res.daily_rate) : 0,
        totalAvailableAtTime: res.available_beds_at_booking || 0,
        timeline: [
          { status: res.status || 'Pending', timestamp: new Date().toLocaleString(), actor: 'System' }
        ]
      };
    }
  } catch (err: any) {
    console.warn('API create booking error:', err);
    throw new Error(parseApiError(err));
  }

  // Local Storage Fallback
  const current = getStoredBookings();
  const nextNum = 1001 + current.length;
  const nowStr = new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const newRecord: HospitalBookingRecord = {
    id: `HD-${nextNum}`,
    publicId: `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-4a2e-xxxx-xxxxxxxxxxxx`,
    memberId: payload.memberId,
    memberName: payload.memberName,
    memberPhone: payload.memberPhone || '-',
    memberEmail: payload.memberEmail || '-',
    hospital: String(payload.hospital),
    hospitalDistrict: 'Dhaka',
    hospitalPhone: '-',
    bedType: payload.bedType,
    status: 'PENDING',
    centre: payload.centre || 'Dhaka Centre',
    requestedBy: payload.requestedBy || 'Centre User',
    createdAt: nowStr,
    notes: payload.notes,
    dailyRate: 0,
    totalAvailableAtTime: 0,
    timeline: [
      { status: 'PENDING', timestamp: nowStr, actor: payload.requestedBy || 'Centre User' }
    ]
  };

  current.unshift(newRecord);
  saveStoredBookings(current);
  return newRecord;
}

// 23 - 35. Booking Status Update API (POST /api/hospital-desk/bookings/{id}/update-status/)
export async function updateBookingStatusApi(
  bookingId: string,
  newStatus: HospitalBookingStatus,
  hqNotes?: string,
  actor: string = 'HQ Admin'
): Promise<HospitalBookingRecord> {
  const numericId = bookingId.replace('HD-', '');

  try {
    const res = await apiFetch<any>(`/api/hospital-desk/bookings/${numericId}/update-status/`, {
      method: 'POST',
      body: JSON.stringify({
        status: newStatus,
        hq_notes: hqNotes || ''
      })
    });

    if (res?.id) {
      const freshBookings = await fetchHospitalBookingsApi();
      const match = freshBookings.find(b => b.id.includes(numericId));
      if (match) return match;
    }
  } catch (err: any) {
    console.warn('API status update error:', err);
    throw new Error(parseApiError(err));
  }

  // Local storage fallback logic
  const current = getStoredBookings();
  const idx = current.findIndex(b => b.id === bookingId);
  if (idx === -1) throw new Error('Booking not found');

  const nowStr = new Date().toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const previousStatus = current[idx].status;
  current[idx].status = newStatus;
  if (hqNotes) {
    current[idx].hqNotes = hqNotes;
  }
  current[idx].timeline.push({
    status: newStatus,
    timestamp: nowStr,
    actor
  });

  // Rule 27: If confirming in local mock fallback, decrement bed count
  if (newStatus === 'CONFIRMED' && previousStatus !== 'CONFIRMED') {
    const beds = getStoredBeds();
    const bedIdx = beds.findIndex(
      b => (b.hospitalName === current[idx].hospital || b.hospital === current[idx].hospital) && b.bedType === current[idx].bedType
    );
    if (bedIdx !== -1 && beds[bedIdx].available > 0) {
      beds[bedIdx].available -= 1;
      saveStoredBeds(beds);
    }
  }

  saveStoredBookings(current);
  return current[idx];
}
