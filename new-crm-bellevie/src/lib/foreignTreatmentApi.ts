import { BASE_URL, apiFetch, formatApiError } from './api';
import { fetchMembersList, ApiMember } from './membersApi';

// -------------------------------------------------------------
// FOREIGN TREATMENT TYPES MATCHING DJANGO BACKEND SPEC
// -------------------------------------------------------------

export type ForeignCaseStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'DOCUMENTS_PENDING'
  | 'HOSPITAL_CONTACTED'
  | 'QUOTATION_RECEIVED'
  | 'PATIENT_DECISION'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

export type QuotationStatus =
  | 'DRAFT'
  | 'RECEIVED'
  | 'SHARED'
  | 'ACCEPTED'
  | 'DECLINED';

export type DocumentStatus =
  | 'REQUIRED'
  | 'RECEIVED'
  | 'VERIFIED'
  | 'REJECTED';

export type DocumentType =
  | 'PASSPORT'
  | 'MEDICAL_REPORT'
  | 'PRESCRIPTION'
  | 'VISA'
  | 'OTHER';

export interface ForeignHospital {
  id: number;
  name: string;
  country: string;
  city: string;
  address: string;
  contact_email: string;
  phone: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TreatmentDocument {
  id: number;
  case: number;
  document_type: DocumentType;
  description: string;
  file: string | null;
  file_url: string | null;
  status: DocumentStatus;
  notes?: string;
  uploaded_by?: number | null;
  uploaded_by_name?: string | null;
  uploaded_at?: string | null;
  created_at?: string;
  updated_at?: string;
  case_status?: ForeignCaseStatus;
}

export interface TreatmentQuotation {
  id: number;
  case: number;
  hospital: number;
  hospital_name: string;
  currency: string;
  estimated_cost: string | number;
  estimated_stay_days: number;
  details: string;
  attachment?: string | null;
  attachment_url?: string | null;
  valid_until?: string | null;
  status: QuotationStatus;
  is_expired?: boolean;
  case_status?: ForeignCaseStatus;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CaseActivity {
  id: number;
  case: number;
  previous_status: string;
  new_status: string;
  notes: string;
  performed_by: number;
  performed_by_name: string;
  created_at: string;
}

export interface ForeignCountry {
  id: number;
  name: string;
  code: string;
  flag_emoji?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ForeignTreatmentCase {
  id: number;
  public_id: string;
  member: number;
  member_name: string;
  member_public_id?: string | null;
  centre: number | null;
  centre_name: string | null;
  requested_by: number;
  country?: number | null;
  country_name?: string | null;
  country_code?: string | null;
  country_flag?: string | null;
  treatment_required: string;
  preferred_country: string;
  description: string;
  // New patient intake fields
  patient_age?: number | null;
  patient_gender?: string;
  patient_phone?: string;
  patient_email?: string;
  patient_nationality?: string;
  attendants?: { name: string; passport_number: string }[];
  chief_complaints?: string;
  required_date?: string | null;
  // ─────────────────────────
  hospital: number | null;
  hospital_name: string | null;
  status: ForeignCaseStatus;
  hq_notes: string;
  created_at: string;
  updated_at: string;
  // UI extended relations
  documents?: TreatmentDocument[];
  quotations?: TreatmentQuotation[];
  activities?: CaseActivity[];
}

export interface ForeignTreatmentMetrics {
  totalCases: number;
  newCases: number;
  inProcess: number;
  completed: number;
  documentsPending: number;
  quotationsPending: number;
  verifiedHospitals: number;
  statusCounts: Record<ForeignCaseStatus, number>;
}

export interface DRFResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Allowed transitions for frontend UI checks
export const ALLOWED_FOREIGN_STATUS_TRANSITIONS: Record<ForeignCaseStatus, ForeignCaseStatus[]> = {
  NEW: ['REVIEWING', 'DOCUMENTS_PENDING', 'CANCELLED'],
  REVIEWING: ['DOCUMENTS_PENDING', 'HOSPITAL_CONTACTED', 'CANCELLED'],
  DOCUMENTS_PENDING: ['HOSPITAL_CONTACTED', 'REVIEWING', 'CANCELLED'],
  HOSPITAL_CONTACTED: ['QUOTATION_RECEIVED', 'DOCUMENTS_PENDING', 'CANCELLED'],
  QUOTATION_RECEIVED: ['PATIENT_DECISION', 'DOCUMENTS_PENDING', 'CANCELLED'],
  PATIENT_DECISION: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

// -------------------------------------------------------------
// LOCAL MOCK PERSISTENCE FALLBACK (for dev environment)
// -------------------------------------------------------------

const CASES_STORAGE_KEY = 'bellevie_foreign_cases_api_v4';
const HOSPITALS_STORAGE_KEY = 'bellevie_foreign_hospitals_api_v4';
const QUOTATIONS_STORAGE_KEY = 'bellevie_foreign_quotations_api_v4';
const DOCUMENTS_STORAGE_KEY = 'bellevie_foreign_documents_api_v4';
const ACTIVITIES_STORAGE_KEY = 'bellevie_foreign_activities_api_v4';

const INITIAL_HOSPITALS: ForeignHospital[] = [];

const INITIAL_CASES: ForeignTreatmentCase[] = [];

const INITIAL_QUOTATIONS: TreatmentQuotation[] = [];

const INITIAL_DOCUMENTS: TreatmentDocument[] = [];

const INITIAL_ACTIVITIES: CaseActivity[] = [];

// Helper getters/setters for fallback local storage
function getFallbackStore<T>(key: string, initial: T[]): T[] {
  if (typeof window === 'undefined') return initial;
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch {
    return initial;
  }
}

function setFallbackStore<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // silent
  }
}

// -------------------------------------------------------------
// 1. FOREIGN HOSPITALS API SERVICE
// -------------------------------------------------------------

export async function fetchForeignHospitalsApi(params: {
  search?: string;
  country?: string;
  city?: string;
  is_verified?: boolean;
  is_active?: boolean;
} = {}): Promise<ForeignHospital[]> {
  const queryParts: string[] = [];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.country) queryParts.push(`country=${encodeURIComponent(params.country)}`);
  if (params.city) queryParts.push(`city=${encodeURIComponent(params.city)}`);
  if (params.is_verified !== undefined) queryParts.push(`is_verified=${params.is_verified}`);
  if (params.is_active !== undefined) queryParts.push(`is_active=${params.is_active}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  try {
    const data = await apiFetch<DRFResponse<ForeignHospital> | ForeignHospital[]>(`/api/foreign-treatment/hospitals/${queryString}`);
    const results = Array.isArray(data) ? data : (data?.results || []);
    setFallbackStore(HOSPITALS_STORAGE_KEY, results);
    return results;
  } catch (err) {
    console.warn('[fetchForeignHospitalsApi] API call failed, using local storage fallback:', err);
  }

  // Fallback
  let items = getFallbackStore<ForeignHospital>(HOSPITALS_STORAGE_KEY, INITIAL_HOSPITALS);
  if (params.search) {
    const s = params.search.toLowerCase();
    items = items.filter(h => h.name.toLowerCase().includes(s) || h.country.toLowerCase().includes(s) || h.city.toLowerCase().includes(s));
  }
  if (params.country && params.country !== 'ALL') {
    items = items.filter(h => h.country.toLowerCase() === params.country?.toLowerCase());
  }
  return items;
}

export async function createForeignHospitalApi(data: {
  name: string;
  country: string;
  city: string;
  address?: string;
  contact_email?: string;
  phone?: string;
  is_verified?: boolean;
  is_active?: boolean;
}): Promise<ForeignHospital> {
  const payload = {
    name: data.name,
    country: data.country,
    city: data.city,
    address: data.address || '',
    contact_email: data.contact_email || '',
    phone: data.phone || '',
    is_verified: data.is_verified ?? true,
    is_active: data.is_active ?? true
  };

  try {
    const created = await apiFetch<ForeignHospital>('/api/foreign-treatment/hospitals/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (created && created.id) return created;
  } catch (err) {
    console.warn('[createForeignHospitalApi] API call failed, using local storage fallback:', err);
  }

  // Fallback
  const items = getFallbackStore<ForeignHospital>(HOSPITALS_STORAGE_KEY, INITIAL_HOSPITALS);
  const newHospital: ForeignHospital = {
    id: Date.now(),
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  items.unshift(newHospital);
  setFallbackStore(HOSPITALS_STORAGE_KEY, items);
  return newHospital;
}

export async function updateForeignHospitalApi(
  id: number,
  data: Partial<ForeignHospital>
): Promise<ForeignHospital> {
  try {
    const updated = await apiFetch<ForeignHospital>(`/api/foreign-treatment/hospitals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    if (updated && updated.id) return updated;
  } catch (err) {
    console.warn('[updateForeignHospitalApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<ForeignHospital>(HOSPITALS_STORAGE_KEY, INITIAL_HOSPITALS);
  const idx = items.findIndex(h => h.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...data, updated_at: new Date().toISOString() };
    setFallbackStore(HOSPITALS_STORAGE_KEY, items);
    return items[idx];
  }
  throw new Error('Hospital not found');
}

// -------------------------------------------------------------
// 2. FOREIGN TREATMENT CASES API SERVICE
// -------------------------------------------------------------

export async function fetchForeignCasesApi(params: {
  search?: string;
  status?: string;
  member?: number;
  hospital?: number;
  country?: string;
  centre?: string | number;
} = {}): Promise<ForeignTreatmentCase[]> {
  const queryParts: string[] = [];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.status && params.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params.member) queryParts.push(`member=${params.member}`);
  if (params.hospital) queryParts.push(`hospital=${params.hospital}`);
  if (params.country && params.country !== 'ALL') queryParts.push(`country=${encodeURIComponent(params.country)}`);
  if (params.centre && params.centre !== 'ALL') queryParts.push(`centre=${encodeURIComponent(params.centre)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  try {
    const data = await apiFetch<DRFResponse<ForeignTreatmentCase> | ForeignTreatmentCase[]>(`/api/foreign-treatment/cases/${queryString}`);
    const results = Array.isArray(data) ? data : (data?.results || []);
    setFallbackStore(CASES_STORAGE_KEY, results);
    return results;
  } catch (err) {
    console.warn('[fetchForeignCasesApi] API call failed, using local storage fallback:', err);
  }

  // Fallback
  let items = getFallbackStore<ForeignTreatmentCase>(CASES_STORAGE_KEY, INITIAL_CASES);
  if (params.search) {
    const s = params.search.toLowerCase();
    items = items.filter(c =>
      String(c.id).includes(s) ||
      c.member_name.toLowerCase().includes(s) ||
      c.treatment_required.toLowerCase().includes(s) ||
      c.preferred_country.toLowerCase().includes(s)
    );
  }
  if (params.status && params.status !== 'ALL') {
    items = items.filter(c => c.status === params.status);
  }
  if (params.country && params.country !== 'ALL') {
    items = items.filter(c => c.preferred_country.toLowerCase() === params.country?.toLowerCase());
  }
  if (params.centre && params.centre !== 'ALL') {
    items = items.filter(c => String(c.centre_name).toLowerCase().includes(String(params.centre).toLowerCase()));
  }
  return items;
}

export async function fetchForeignCaseByIdApi(id: number | string): Promise<ForeignTreatmentCase | null> {
  try {
    const data = await apiFetch<ForeignTreatmentCase>(`/api/foreign-treatment/cases/${id}/`);
    if (data && data.id) {
      // Fetch sub-resources in parallel
      const [fetchedDocs, fetchedQuos, fetchedActs] = await Promise.all([
        fetchForeignDocumentsApi(data.id),
        fetchForeignQuotationsApi(data.id),
        fetchForeignCaseActivitiesApi(data.id)
      ]);

      // Combine fetched documents with any nested data.documents on the case object
      const mergedDocsMap = new Map<number | string, TreatmentDocument>();
      if (Array.isArray(data.documents)) {
        data.documents.forEach(d => mergedDocsMap.set(d.id, d));
      }
      if (Array.isArray(fetchedDocs)) {
        fetchedDocs.forEach(d => mergedDocsMap.set(d.id, d));
      }
      const mergedDocs = Array.from(mergedDocsMap.values());

      const mergedQuosMap = new Map<number | string, TreatmentQuotation>();
      if (Array.isArray(data.quotations)) {
        data.quotations.forEach(q => mergedQuosMap.set(q.id, q));
      }
      if (Array.isArray(fetchedQuos)) {
        fetchedQuos.forEach(q => mergedQuosMap.set(q.id, q));
      }
      const mergedQuos = Array.from(mergedQuosMap.values());

      return {
        ...data,
        documents: mergedDocs,
        quotations: mergedQuos,
        activities: (fetchedActs && fetchedActs.length > 0) ? fetchedActs : (data.activities || [])
      };
    }
  } catch (err: any) {
    if (err?.status === 404 || String(err?.message || '').includes('404') || String(err || '').includes('404')) {
      return null;
    }
    console.warn(`[fetchForeignCaseByIdApi] Failed for ID ${id}, using local fallback:`, err);
  }

  const items = getFallbackStore<ForeignTreatmentCase>(CASES_STORAGE_KEY, INITIAL_CASES);
  const found = items.find(c => String(c.id) === String(id) || c.public_id === String(id));
  if (!found) return null;

  const docs = await fetchForeignDocumentsApi(found.id);
  const quos = await fetchForeignQuotationsApi(found.id);
  const acts = await fetchForeignCaseActivitiesApi(found.id);
  return { ...found, documents: docs, quotations: quos, activities: acts };
}

export async function fetchForeignCountriesApi(): Promise<ForeignCountry[]> {
  try {
    const res = await apiFetch<any>('/api/foreign-treatment/countries/');
    const list = Array.isArray(res) ? res : (res?.results || []);
    if (list && list.length > 0) {
      return list;
    }
  } catch (err) {
    console.warn('[fetchForeignCountriesApi] Backend error, using default countries:', err);
  }
  return [
    { id: 1, name: 'India', code: 'IN', flag_emoji: '🇮🇳', is_active: true },
    { id: 2, name: 'Thailand', code: 'TH', flag_emoji: '🇹🇭', is_active: true },
    { id: 3, name: 'Singapore', code: 'SG', flag_emoji: '🇸🇬', is_active: true },
    { id: 4, name: 'Turkey', code: 'TR', flag_emoji: '🇹🇷', is_active: true },
    { id: 5, name: 'Germany', code: 'DE', flag_emoji: '🇩🇪', is_active: true },
    { id: 6, name: 'Malaysia', code: 'MY', flag_emoji: '🇲🇾', is_active: true },
    { id: 7, name: 'UAE', code: 'AE', flag_emoji: '🇦🇪', is_active: true },
    { id: 8, name: 'China', code: 'CN', flag_emoji: '🇨🇳', is_active: true },
  ];
}

export async function createForeignCaseApi(data: {
  member: number | string;
  member_name?: string;
  country?: number | null;
  treatment_required: string;
  preferred_country: string;
  description: string;
  centre_name?: string;
  requested_by_name?: string;
  // New patient intake fields
  patient_age?: number | null;
  patient_gender?: string;
  patient_phone?: string;
  patient_email?: string;
  patient_nationality?: string;
  attendants?: { name: string; passport_number: string }[];
  chief_complaints?: string;
  required_date?: string | null;
}): Promise<ForeignTreatmentCase> {
  // Spec Rule 8.5: Do NOT send centre or requested_by in POST body. Backend infers them from logged-in user.
  const numericMemberId = typeof data.member === 'number' ? data.member : parseInt(String(data.member).replace(/\D/g, '')) || 12;

  const payload: Record<string, any> = {
    member: numericMemberId,
    treatment_required: data.treatment_required,
    preferred_country: data.preferred_country,
    description: data.description,
    // New patient intake fields
    patient_age: data.patient_age ?? null,
    patient_gender: data.patient_gender || '',
    patient_phone: data.patient_phone || '',
    patient_email: data.patient_email || '',
    patient_nationality: data.patient_nationality || '',
    attendants: data.attendants || [],
    chief_complaints: data.chief_complaints || '',
    required_date: data.required_date || null,
  };

  if (data.country) {
    payload.country = data.country;
  }

  try {
    const created = await apiFetch<ForeignTreatmentCase>('/api/foreign-treatment/cases/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (created && created.id) return created;
  } catch (err) {
    console.warn('[createForeignCaseApi] API call failed, using local fallback:', err);
  }

  // Fallback
  const items = getFallbackStore<ForeignTreatmentCase>(CASES_STORAGE_KEY, INITIAL_CASES);
  const newId = items.length + 1;
  const newCase: ForeignTreatmentCase = {
    id: newId,
    public_id: `ft-uuid-${Date.now()}`,
    member: numericMemberId,
    member_name: data.member_name || `Member #${numericMemberId}`,
    centre: 3,
    centre_name: data.centre_name || 'Dhanmondi Centre',
    requested_by: 5,
    treatment_required: data.treatment_required,
    preferred_country: data.preferred_country,
    description: data.description,
    patient_age: data.patient_age ?? null,
    patient_gender: data.patient_gender || '',
    patient_phone: data.patient_phone || '',
    patient_email: data.patient_email || '',
    patient_nationality: data.patient_nationality || '',
    attendants: data.attendants || [],
    chief_complaints: data.chief_complaints || '',
    required_date: data.required_date || null,
    hospital: null,
    hospital_name: null,
    status: 'NEW',
    hq_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    documents: [],
    quotations: [],
    activities: [
      {
        id: Date.now(),
        case: newId,
        previous_status: 'NONE',
        new_status: 'NEW',
        notes: 'Case created.',
        performed_by: 5,
        performed_by_name: data.requested_by_name || 'Network Centre',
        created_at: new Date().toISOString()
      }
    ]
  };

  items.unshift(newCase);
  setFallbackStore(CASES_STORAGE_KEY, items);
  return newCase;
}

export async function assignForeignHospitalApi(
  caseId: number,
  hospitalId: number,
  hospitalName?: string
): Promise<ForeignTreatmentCase> {
  // Spec Rule 11: POST /api/foreign-treatment/cases/{id}/assign-hospital/ body: { "hospital": hospitalId }
  try {
    const updated = await apiFetch<ForeignTreatmentCase>(`/api/foreign-treatment/cases/${caseId}/assign-hospital/`, {
      method: 'POST',
      body: JSON.stringify({ hospital: hospitalId })
    });
    if (updated && updated.id) return updated;
  } catch (err) {
    console.warn('[assignForeignHospitalApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<ForeignTreatmentCase>(CASES_STORAGE_KEY, INITIAL_CASES);
  const idx = items.findIndex(c => c.id === caseId);
  if (idx !== -1) {
    items[idx].hospital = hospitalId;
    items[idx].hospital_name = hospitalName || `Hospital #${hospitalId}`;
    if (items[idx].status === 'NEW' || items[idx].status === 'REVIEWING') {
      items[idx].status = 'HOSPITAL_CONTACTED';
    }
    items[idx].updated_at = new Date().toISOString();
    setFallbackStore(CASES_STORAGE_KEY, items);

    // log activity
    addActivityFallback(caseId, items[idx].status, items[idx].status, `Assigned hospital: ${items[idx].hospital_name}`, 'HQ Admin');
    return items[idx];
  }
  throw new Error('Case not found');
}

export async function updateForeignCaseStatusApi(
  caseId: number,
  status: ForeignCaseStatus,
  notes: string = ''
): Promise<ForeignTreatmentCase> {
  // Spec Rule 13: POST /api/foreign-treatment/cases/{id}/update-status/ body: { "status": status, "notes": notes }
  try {
    const updated = await apiFetch<ForeignTreatmentCase>(`/api/foreign-treatment/cases/${caseId}/update-status/`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
    if (updated && updated.id) return updated;
  } catch (err) {
    console.warn('[updateForeignCaseStatusApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<ForeignTreatmentCase>(CASES_STORAGE_KEY, INITIAL_CASES);
  const idx = items.findIndex(c => c.id === caseId);
  if (idx !== -1) {
    const prevStatus = items[idx].status;
    items[idx].status = status;
    if (notes) items[idx].hq_notes = notes;
    items[idx].updated_at = new Date().toISOString();
    setFallbackStore(CASES_STORAGE_KEY, items);

    addActivityFallback(caseId, prevStatus, status, notes || `Status changed from ${prevStatus} to ${status}`, 'HQ Admin');
    return items[idx];
  }
  throw new Error('Case not found');
}

export async function fetchForeignCaseActivitiesApi(caseId: number): Promise<CaseActivity[]> {
  try {
    const data = await apiFetch<DRFResponse<CaseActivity> | CaseActivity[]>(`/api/foreign-treatment/cases/${caseId}/activities/`);
    const results = Array.isArray(data) ? data : (data?.results || []);
    return results;
  } catch (err) {
    console.warn(`[fetchForeignCaseActivitiesApi] API call failed for case ${caseId}, using fallback:`, err);
  }

  const acts = getFallbackStore<CaseActivity>(ACTIVITIES_STORAGE_KEY, INITIAL_ACTIVITIES);
  return acts.filter(a => a.case === caseId);
}

function addActivityFallback(caseId: number, prev: string, next: string, notes: string, actor: string) {
  const acts = getFallbackStore<CaseActivity>(ACTIVITIES_STORAGE_KEY, INITIAL_ACTIVITIES);
  acts.unshift({
    id: Date.now(),
    case: caseId,
    previous_status: prev,
    new_status: next,
    notes,
    performed_by: 2,
    performed_by_name: actor,
    created_at: new Date().toISOString()
  });
  setFallbackStore(ACTIVITIES_STORAGE_KEY, acts);
}

// -------------------------------------------------------------
// 3. TREATMENT QUOTATION API SERVICE
// -------------------------------------------------------------

export async function fetchForeignQuotationsApi(caseId?: number): Promise<TreatmentQuotation[]> {
  const query = caseId ? `?case=${caseId}` : '';
  try {
    const data = await apiFetch<DRFResponse<TreatmentQuotation> | TreatmentQuotation[]>(`/api/foreign-treatment/quotations/${query}`);
    const rawResults = Array.isArray(data) ? data : (data?.results !== undefined ? data.results : null);
    if (rawResults !== null) {
      setFallbackStore(QUOTATIONS_STORAGE_KEY, rawResults);
      if (caseId) {
        return rawResults.filter(q => String(q.case) === String(caseId));
      }
      return rawResults;
    }
  } catch (err) {
    console.warn('[fetchForeignQuotationsApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<TreatmentQuotation>(QUOTATIONS_STORAGE_KEY, INITIAL_QUOTATIONS);
  if (caseId) {
    return items.filter(q => String(q.case) === String(caseId));
  }
  return items;
}

export async function createForeignQuotationApi(data: {
  case: number;
  hospital: number;
  currency: string;
  estimated_cost: string | number;
  estimated_stay_days: number;
  details: string;
  attachment?: File | null;
  valid_until?: string | null;
  status?: QuotationStatus;
  hospital_name?: string;
}): Promise<TreatmentQuotation> {
  try {
    let body: any;
    if (data.attachment instanceof File) {
      const formData = new FormData();
      formData.append('case', String(data.case));
      formData.append('hospital', String(data.hospital));
      formData.append('currency', data.currency || 'USD');
      formData.append('estimated_cost', String(data.estimated_cost));
      formData.append('estimated_stay_days', String(Number(data.estimated_stay_days) || 1));
      formData.append('details', data.details || '');
      formData.append('status', data.status || 'SHARED');
      if (data.valid_until && data.valid_until.trim() !== '') {
        formData.append('valid_until', data.valid_until);
      }
      formData.append('attachment', data.attachment);
      body = formData;
    } else {
      const payload: Record<string, any> = {
        case: Number(data.case),
        hospital: Number(data.hospital),
        currency: data.currency || 'USD',
        estimated_cost: String(data.estimated_cost),
        estimated_stay_days: Number(data.estimated_stay_days) || 1,
        details: data.details || '',
        status: data.status || 'SHARED'
      };
      if (data.valid_until && data.valid_until.trim() !== '') {
        payload.valid_until = data.valid_until;
      }
      body = JSON.stringify(payload);
    }

    const created = await apiFetch<TreatmentQuotation>('/api/foreign-treatment/quotations/', {
      method: 'POST',
      body
    });
    if (created && created.id) return created;
  } catch (err) {
    console.warn('[createForeignQuotationApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<TreatmentQuotation>(QUOTATIONS_STORAGE_KEY, INITIAL_QUOTATIONS);
  const newQuo: TreatmentQuotation = {
    id: Date.now(),
    case: data.case,
    hospital: data.hospital,
    hospital_name: data.hospital_name || `Hospital #${data.hospital}`,
    currency: data.currency,
    estimated_cost: data.estimated_cost,
    estimated_stay_days: data.estimated_stay_days,
    details: data.details,
    attachment: data.attachment ? data.attachment.name : null,
    valid_until: data.valid_until,
    status: 'SHARED',
    is_expired: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  items.unshift(newQuo);
  setFallbackStore(QUOTATIONS_STORAGE_KEY, items);
  return newQuo;
}

export async function updateQuotationStatusApi(
  quotationId: number,
  status: QuotationStatus
): Promise<TreatmentQuotation> {
  // Spec Rule 25: POST /api/foreign-treatment/quotations/{id}/update-status/ body: { "status": status }
  try {
    const updated = await apiFetch<TreatmentQuotation>(`/api/foreign-treatment/quotations/${quotationId}/update-status/`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    if (updated && updated.id) return updated;
  } catch (err) {
    console.warn('[updateQuotationStatusApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<TreatmentQuotation>(QUOTATIONS_STORAGE_KEY, INITIAL_QUOTATIONS);
  const idx = items.findIndex(q => q.id === quotationId);
  if (idx !== -1) {
    if (status === 'ACCEPTED') {
      // ensure no other quotation for same case is ACCEPTED
      const cId = items[idx].case;
      items.forEach(q => {
        if (q.case === cId) q.status = 'SHARED';
      });
    }
    items[idx].status = status;
    items[idx].updated_at = new Date().toISOString();
    setFallbackStore(QUOTATIONS_STORAGE_KEY, items);
    return items[idx];
  }
  throw new Error('Quotation not found');
}

// -------------------------------------------------------------
// 4. TREATMENT DOCUMENT API SERVICE (WITH MULTIPART FORMDATA)
// -------------------------------------------------------------

export async function fetchForeignDocumentsApi(caseId?: number): Promise<TreatmentDocument[]> {
  const query = caseId ? `?case=${caseId}` : '';
  try {
    const data = await apiFetch<DRFResponse<TreatmentDocument> | TreatmentDocument[]>(`/api/foreign-treatment/documents/${query}`);
    const rawResults = Array.isArray(data) ? data : (data?.results !== undefined ? data.results : null);
    if (rawResults !== null) {
      const normalized = rawResults.map(doc => ({
        ...doc,
        file_url: doc.file_url || doc.file || null,
        file: doc.file || doc.file_url || null
      }));
      setFallbackStore(DOCUMENTS_STORAGE_KEY, normalized);
      if (caseId) {
        return normalized.filter(d => String(d.case) === String(caseId));
      }
      return normalized;
    }
  } catch (err) {
    console.warn('[fetchForeignDocumentsApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<TreatmentDocument>(DOCUMENTS_STORAGE_KEY, INITIAL_DOCUMENTS);
  if (caseId) {
    return items.filter(d => String(d.case) === String(caseId));
  }
  return items;
}

export async function uploadForeignDocumentApi(formData: FormData): Promise<TreatmentDocument> {
  // Spec Rule 32 & 33: POST /api/foreign-treatment/documents/ with multipart/form-data
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = `${BASE_URL}/api/foreign-treatment/documents/`;

  try {
    const response = await fetch(cleanEndpoint, {
      method: 'POST',
      headers, // Do NOT set Content-Type header manually, let fetch generate multipart boundary
      body: formData
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = formatApiError(errorData) || `Document upload failed with status ${response.status}`;
      console.warn('[uploadForeignDocumentApi] API error:', errorMessage);
    }
  } catch (err) {
    console.warn('[uploadForeignDocumentApi] Request failed, using fallback:', err);
  }

  // Fallback if backend server not running
  const caseId = Number(formData.get('case')) || 1;
  const docType = (formData.get('document_type') as DocumentType) || 'MEDICAL_REPORT';
  const desc = (formData.get('description') as string) || '';
  const file = formData.get('file') as File;
  const fileName = file ? file.name : `${docType.toLowerCase()}_copy.pdf`;

  const items = getFallbackStore<TreatmentDocument>(DOCUMENTS_STORAGE_KEY, INITIAL_DOCUMENTS);
  const newDoc: TreatmentDocument = {
    id: Date.now(),
    case: caseId,
    document_type: docType,
    description: desc,
    file: `/media/documents/${fileName}`,
    file_url: `/media/documents/${fileName}`,
    status: 'RECEIVED',
    notes: '',
    uploaded_by: 5,
    uploaded_by_name: 'Network Centre',
    uploaded_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  items.unshift(newDoc);
  setFallbackStore(DOCUMENTS_STORAGE_KEY, items);
  return newDoc;
}

export async function updateForeignDocumentStatusApi(
  documentId: number,
  status: DocumentStatus,
  notes: string = ''
): Promise<TreatmentDocument> {
  // Spec Rule 35: POST /api/foreign-treatment/documents/{id}/update-status/ body: { "status": status, "notes": notes }
  try {
    const updated = await apiFetch<TreatmentDocument>(`/api/foreign-treatment/documents/${documentId}/update-status/`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
    if (updated && updated.id) return updated;
  } catch (err) {
    console.warn('[updateForeignDocumentStatusApi] API call failed, using fallback:', err);
  }

  const items = getFallbackStore<TreatmentDocument>(DOCUMENTS_STORAGE_KEY, INITIAL_DOCUMENTS);
  const idx = items.findIndex(d => d.id === documentId);
  if (idx !== -1) {
    items[idx].status = status;
    if (notes) items[idx].notes = notes;
    items[idx].updated_at = new Date().toISOString();
    setFallbackStore(DOCUMENTS_STORAGE_KEY, items);
    return items[idx];
  }
  throw new Error('Document not found');
}

// -------------------------------------------------------------
// 5. METRICS COMPUTATION API
// -------------------------------------------------------------

export async function fetchForeignMetricsApi(centreFilter?: string): Promise<ForeignTreatmentMetrics> {
  const cases = await fetchForeignCasesApi({ centre: centreFilter });
  const hospitals = await fetchForeignHospitalsApi();

  const statusCounts: Record<ForeignCaseStatus, number> = {
    NEW: 0,
    REVIEWING: 0,
    DOCUMENTS_PENDING: 0,
    HOSPITAL_CONTACTED: 0,
    QUOTATION_RECEIVED: 0,
    PATIENT_DECISION: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    CANCELLED: 0
  };

  let docsPendingCount = 0;
  let quoPendingCount = 0;

  cases.forEach(c => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
    if (c.status === 'DOCUMENTS_PENDING') {
      docsPendingCount++;
    }
    if (c.status === 'HOSPITAL_CONTACTED') {
      quoPendingCount++;
    }
  });

  const inProcess = statusCounts.REVIEWING + statusCounts.DOCUMENTS_PENDING + statusCounts.HOSPITAL_CONTACTED + statusCounts.QUOTATION_RECEIVED + statusCounts.PATIENT_DECISION + statusCounts.PROCESSING;

  return {
    totalCases: cases.length,
    newCases: statusCounts.NEW,
    inProcess,
    completed: statusCounts.COMPLETED,
    documentsPending: docsPendingCount,
    quotationsPending: quoPendingCount,
    verifiedHospitals: hospitals.filter(h => h.is_verified && h.is_active).length,
    statusCounts
  };
}
