import { apiFetch } from './api';

export interface HealthProfileData {
  blood_group?: string | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  current_medications?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  primary_physician?: string | null;
}

export interface DigitalTwinMemberProfile {
  id: number;
  public_id: string;
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string | null;
  age: number | null;
  address: string;
  is_active: boolean;
  assigned_centre_name?: string | null;
  registered_centre_name?: string | null;
  partner_name?: string | null;
  health_profile?: HealthProfileData | null;
}

export interface ActivePlanSummary {
  public_id: string;
  plan_name: string;
  billing_cycle: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface PlanHistoryItem extends ActivePlanSummary {
  id: number;
  price: number | string;
  created_at?: string | null;
}

export interface FinancialSummary {
  total_paid: number | string;
  total_due: number | string;
  total_claimed: number | string;
  total_approved: number | string;
  total_rejected: number | string;
}

export interface BenefitSummaryItem {
  benefit_id: number;
  name: string;
  amount?: string | null;
  limit?: number | null;
  claims_count: number;
  claim_amount: number | string;
  approved_amount: number | string;
}

export interface ActivitySummary {
  date?: string | null;
  status?: string | null;
  service_name?: string | null;
  hospital_name?: string | null;
}

export interface DigitalTwinOverviewResponse {
  member: DigitalTwinMemberProfile;
  health_summary: {
    active_plan: ActivePlanSummary | null;
    plan_history: PlanHistoryItem[];
    financial_summary: FinancialSummary;
    benefit_summary: BenefitSummaryItem[];
    payment_history: Array<Record<string, any>>;
    claim_history: Array<Record<string, any>>;
    health_profile: HealthProfileData;
    recent_activities: {
      consultation?: ActivitySummary | null;
      diagnostic?: ActivitySummary | null;
      homecare?: ActivitySummary | null;
      hospital?: ActivitySummary | null;
      ambulance?: ActivitySummary | null;
    };
  };
}

export interface EMRRecord {
  id: number;
  public_id: string;
  category: string;
  category_display: string;
  title: string;
  description?: string | null;
  doctor_name?: string | null;
  institution_name?: string | null;
  record_date?: string | null;
  metadata?: Record<string, any> | null;
  created_by_name?: string | null;
  created_at: string;
}


export interface EMRListResponse {
  member_public_id: string;
  total_records: number;
  results: EMRRecord[];
}

export interface TimelineEvent {
  id: string;
  source_module: string;
  source_id: string;
  event_type: string;
  title: string;
  subtitle: string;
  provider_name?: string | null;
  event_date: string;
  status: string;
  status_display: string;
  details?: Record<string, any>;
}

export interface TimelineHistoryResponse {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: TimelineEvent[];
}

export interface MedicalDocItem {
  id: number;
  public_id: string;
  title: string;
  document_type: string;
  document_type_display: string;
  file: string;
  file_size: number;
  file_type?: string | null;
  document_date?: string | null;
  created_at: string;
}

export interface MedicalDocListResponse {
  member_public_id: string;
  total_documents: number;
  results: MedicalDocItem[];
}

// -------------------------------------------------------------
// API Functions
// -------------------------------------------------------------

export async function fetchDigitalTwinOverview(memberId: string | number): Promise<DigitalTwinOverviewResponse> {
  return apiFetch<DigitalTwinOverviewResponse>(`api/digital-health-twin/members/${memberId}/`);
}

export async function addDigitalTwinFinancialRecord(memberId: string | number, data: Record<string, unknown>) {
  return apiFetch<{ id: number; message: string }>(`api/digital-health-twin/members/${memberId}/financial-records/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchDigitalTwinEMR(memberId: string | number, category?: string): Promise<EMRListResponse> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch<EMRListResponse>(`api/digital-health-twin/members/${memberId}/emr/${query}`);
}

export async function createDigitalTwinEMRRecord(
  memberId: string | number,
  data: Partial<EMRRecord>
): Promise<EMRRecord> {
  return apiFetch<EMRRecord>(`api/digital-health-twin/members/${memberId}/emr/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchDigitalTwinHistory(
  memberId: string | number,
  page: number = 1
): Promise<TimelineHistoryResponse> {
  return apiFetch<TimelineHistoryResponse>(`api/digital-health-twin/members/${memberId}/history/?page=${page}`);
}

export async function fetchDigitalTwinDocuments(memberId: string | number): Promise<MedicalDocListResponse> {
  return apiFetch<MedicalDocListResponse>(`api/digital-health-twin/members/${memberId}/documents/`);
}

export async function uploadDigitalTwinDocument(
  memberId: string | number,
  formData: FormData
): Promise<MedicalDocItem> {
  return apiFetch<MedicalDocItem>(`api/digital-health-twin/members/${memberId}/documents/`, {
    method: 'POST',
    body: formData,
  });
}

export async function updateDigitalTwinHealthProfile(
  memberId: string | number,
  data: HealthProfileData
): Promise<HealthProfileData> {
  return apiFetch<HealthProfileData>(`api/digital-health-twin/members/${memberId}/profile/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

