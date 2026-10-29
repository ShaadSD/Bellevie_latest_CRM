import { apiFetch } from './api';

// -------------------------------------------------------------
// APPOINTMENT API INTERFACES
// -------------------------------------------------------------

export type ApiAppointmentStatus = 
  | 'PENDING' 
  | 'VERIFYING' 
  | 'CONFIRMED' 
  | 'RESCHEDULE_REQUESTED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REJECTED';

export type ApiAppointmentType = 'DOCTOR' | 'DIAGNOSTIC';

export interface ApiStatusHistory {
  id?: number | string;
  previous_status?: string;
  new_status?: string;
  notes?: string;
  updated_by_name?: string;
  created_at?: string;
}

export interface ApiRescheduleHistory {
  id?: number | string;
  previous_datetime?: string;
  requested_datetime?: string;
  approved_datetime?: string;
  reason?: string;
  notes?: string;
  status?: string;
  requested_by_name?: string;
  created_at?: string;
}

export interface ApiAppointment {
  id: number;
  public_id: string;
  appointment_type: ApiAppointmentType;
  status: ApiAppointmentStatus;
  
  // Member
  member: number;
  member_public_id?: string;
  member_name?: string;
  member_phone?: string;
  member_email?: string;
  
  // Provider / Doctor info
  doctor?: number | null;
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_fees?: string;
  doctor_hospital_name?: string;
  hospital_name?: string;
  diagnostic_test_price?: string | number;
  appointment_type_display?: string;
  status_display?: string;
  
  // Consultation Mode & Payment Details
  consultation_mode?: 'IN_PERSON' | 'VIDEO_CONSULTANCY';
  payment_status?: 'PAID' | 'UNPAID';
  payment_method?: 'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'BANK_TRANSFER';
  nc_payment_confirmed?: boolean;
  nc_payment_confirmed_at?: string;
  nc_payment_confirmed_by?: string;

  // HQ Video Room Info
  video_room_id?: string;
  video_room_status?: 'NOT_CREATED' | 'ROOM_CREATED' | 'LIVE' | 'COMPLETED';
  video_room_url?: string;
  video_room_created_at?: string;
  video_room_created_by?: string;
  
  // Diagnostic info
  diagnostic_centre?: number | null;
  diagnostic_centre_name?: string;
  diagnostic_test?: number | null;
  diagnostic_test_name?: string;
  service_name?: string;
  
  // Case & Centre
  case?: number | null;
  centre?: number | null;
  centre_name?: string;
  
  // Dates & Times
  preferred_datetime?: string;
  confirmed_datetime?: string;
  requested_datetime?: string;
  approved_datetime?: string;
  
  // Notes & Reasons
  notes?: string;
  hq_notes?: string;
  reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;

  // Embedded History
  status_history?: ApiStatusHistory[];
  reschedule_history?: ApiRescheduleHistory[];
}

export interface AppointmentHistoryResponse {
  appointment: ApiAppointment;
  status_history: ApiStatusHistory[];
  reschedule_history: ApiRescheduleHistory[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// -------------------------------------------------------------
// PROVIDER API INTERFACES
// -------------------------------------------------------------

export interface ApiHospital {
  id: number;
  public_id: string;
  name: string;
  image?: string | null;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export interface ApiDoctor {
  id: number;
  public_id: string;
  name: string;
  image?: string;
  specialization?: string;
  designation?: string;
  years_of_experience?: number;
  doctor_fees?: string;
  registration_number?: string;
  phone?: string;
  hospital?: number | null;
  hospital_name?: string;
  hospital_address?: string;
  hospital_district?: string;
  subcategories?: number[];
  doctor_details?: string;
  doctor_sedule?: string;
  contact_details?: string;
  consultation_fee?: string | number;
  is_approved?: boolean;
  is_active?: boolean;
  degrees?: string;
  experience_years?: string | number;
  chamber_address?: string;
  visiting_hours?: string;
  followup_fee?: string | number;
  bio?: string;
}

export interface ApiDoctorDesignation {
  name: string;
  doctor_count: number;
}

export interface ApiDiagnosticCentre {
  id: number;
  public_id: string;
  name: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  tests_count?: number;
  is_approved?: boolean;
  is_active: boolean;
}

export interface ApiDiagnosticTest {
  id: number;
  public_id: string;
  diagnostic_centre: number;
  diagnostic_centre_name?: string;
  diagnostic_centre_district?: string;
  name: string;
  code?: string;
  description?: string;
  price: string;
  sample_type?: string;
  preparation_instructions?: string;
  report_time?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiPharmacy {
  id: number;
  public_id: string;
  name: string;
  address?: string;
  district?: string;
  phone?: string;
  is_active: boolean;
}

// =============================================================
// APPOINTMENT API FUNCTIONS
// =============================================================

// 2 & 12-23. Fetch Appointments List with filters
export async function fetchAppointmentsListApi(params?: {
  status?: ApiAppointmentStatus | string;
  appointment_type?: ApiAppointmentType | string;
  member?: number | string;
  doctor?: number | string;
  diagnostic_centre?: number | string;
  diagnostic_test?: number | string;
  case?: number | string;
  centre?: number | string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.appointment_type && params.appointment_type !== 'All') query.append('appointment_type', params.appointment_type);
  if (params?.member) query.append('member', String(params.member));
  if (params?.doctor) query.append('doctor', String(params.doctor));
  if (params?.diagnostic_centre) query.append('diagnostic_centre', String(params.diagnostic_centre));
  if (params?.diagnostic_test) query.append('diagnostic_test', String(params.diagnostic_test));
  if (params?.case) query.append('case', String(params.case));
  if (params?.centre) query.append('centre', String(params.centre));
  if (params?.date_from) query.append('date_from', params.date_from);
  if (params?.date_to) query.append('date_to', params.date_to);
  if (params?.search) query.append('search', params.search);
  if (params?.ordering) query.append('ordering', params.ordering);
  if (params?.page) query.append('page', String(params.page));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<PaginatedResponse<ApiAppointment> | ApiAppointment[]>(`/api/appointments/appointments/${queryString}`);
}

// Create appointment (POST /api/appointments/appointments/)
export async function createAppointmentApi(data: {
  appointment_type: ApiAppointmentType;
  member: number;
  doctor?: number | null;
  diagnostic_centre?: number | null;
  diagnostic_test?: number | null;
  preferred_datetime?: string;
  service_name?: string;
  notes?: string;
  centre?: number | null;
}) {
  return apiFetch<ApiAppointment>('/api/appointments/appointments/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get single appointment
export async function getAppointmentDetailsApi(id: number | string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/`);
}

// -------------------------------------------------------------
// WORKFLOW ACTION APIs
// -------------------------------------------------------------

// 3. Verify (POST /api/appointments/appointments/{id}/verify/)
export async function verifyAppointmentApi(id: number | string, notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/verify/`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || 'Appointment verified with provider.' }),
  });
}

// 4. Confirm (POST /api/appointments/appointments/{id}/confirm/)
export async function confirmAppointmentApi(id: number | string, confirmedDatetime: string, hqNotes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/confirm/`, {
    method: 'POST',
    body: JSON.stringify({
      confirmed_datetime: confirmedDatetime,
      hq_notes: hqNotes || 'Appointment confirmed with doctor.',
    }),
  });
}

// 5. Reject (POST /api/appointments/appointments/{id}/reject/)
export async function rejectAppointmentApi(id: number | string, notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || 'Appointment rejected.' }),
  });
}

// 6. Cancel (POST /api/appointments/appointments/{id}/cancel/)
export async function cancelAppointmentApi(id: number | string, notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/cancel/`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || 'Patient requested cancellation.' }),
  });
}

// 7. Complete (POST /api/appointments/appointments/{id}/complete/)
export async function completeAppointmentApi(id: number | string, notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/complete/`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || 'Consultation completed successfully.' }),
  });
}

// 8. Request Reschedule (POST /api/appointments/appointments/{id}/request-reschedule/)
export async function requestRescheduleApi(id: number | string, requestedDatetime: string, reason: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/request-reschedule/`, {
    method: 'POST',
    body: JSON.stringify({
      requested_datetime: requestedDatetime,
      reason: reason || 'Patient requested reschedule.',
    }),
  });
}

// 9. Approve Reschedule (POST /api/appointments/appointments/{id}/approve-reschedule/)
export async function approveRescheduleApi(id: number | string, approvedDatetime: string, notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/approve-reschedule/`, {
    method: 'POST',
    body: JSON.stringify({
      approved_datetime: approvedDatetime,
      notes: notes || 'New appointment time approved.',
    }),
  });
}

// 10. Reject Reschedule (POST /api/appointments/appointments/{id}/reject-reschedule/)
export async function rejectRescheduleApi(id: number | string, notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/reject-reschedule/`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || 'Requested slot is not available.' }),
  });
}

// 11. Appointment History (GET /api/appointments/appointments/{id}/history/)
export async function fetchAppointmentHistoryApi(id: number | string) {
  return apiFetch<AppointmentHistoryResponse>(`/api/appointments/appointments/${id}/history/`);
}

// =============================================================
// PROVIDER API FUNCTIONS
// =============================================================

// 24. Hospitals
export async function fetchHospitalsListApi() {
  return apiFetch<PaginatedResponse<ApiHospital> | ApiHospital[]>('/api/providers/hospitals/');
}

export async function getHospitalDetailsApi(id: number | string) {
  return apiFetch<ApiHospital>(`/api/providers/hospitals/${id}/`);
}

export async function createHospitalApi(formData: FormData) {
  return apiFetch<ApiHospital>('/api/providers/hospitals/', {
    method: 'POST',
    body: formData,
  });
}

export async function updateHospitalApi(id: number | string, formData: FormData) {
  return apiFetch<ApiHospital>(`/api/providers/hospitals/${id}/`, {
    method: 'PATCH',
    body: formData,
  });
}

// 25. Doctors
export async function fetchDoctorsListApi(params?: {
  search?: string;
  specialization?: string;
  hospital?: number | string;
  district?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.specialization) query.append('specialization', params.specialization);
  if (params?.hospital) query.append('hospital', String(params.hospital));
  if (params?.district) query.append('district', params.district);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<PaginatedResponse<ApiDoctor> | ApiDoctor[]>(`/api/providers/doctors/${queryString}`);
}

export async function getDoctorDetailsApi(id: number | string) {
  return apiFetch<ApiDoctor>(`/api/providers/doctors/${id}/`);
}

// 26. Doctor Designations (GET /api/providers/doctors/designations/)
export async function fetchDoctorDesignationsApi() {
  return apiFetch<ApiDoctorDesignation[]>('/api/providers/doctors/designations/');
}

// 27. Doctors by Designation (GET /api/providers/doctors/by-designation/?specialization=...)
export async function fetchDoctorsByDesignationApi(specialization: string) {
  return apiFetch<ApiDoctor[]>(`/api/providers/doctors/by-designation/?specialization=${encodeURIComponent(specialization)}`);
}

// 28. Diagnostic Centres
export async function fetchDiagnosticCentresListApi() {
  return apiFetch<PaginatedResponse<ApiDiagnosticCentre> | ApiDiagnosticCentre[]>('/api/providers/diagnostics/');
}

export async function getDiagnosticCentreDetailsApi(id: number | string) {
  return apiFetch<ApiDiagnosticCentre>(`/api/providers/diagnostics/${id}/`);
}

export async function createDiagnosticCentreApi(data: Partial<ApiDiagnosticCentre>) {
  return apiFetch<ApiDiagnosticCentre>('/api/providers/diagnostics/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDiagnosticCentreApi(id: number | string, data: Partial<ApiDiagnosticCentre>) {
  return apiFetch<ApiDiagnosticCentre>(`/api/providers/diagnostics/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDiagnosticCentreApi(id: number | string) {
  return apiFetch<{ success: boolean }>(`/api/providers/diagnostics/${id}/`, {
    method: 'DELETE',
  });
}

// 29. Diagnostic Centre -> Tests (GET /api/providers/diagnostics/{id}/tests/?search=...)
export async function fetchDiagnosticCentreTestsApi(centreId: number | string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch<ApiDiagnosticTest[]>(`/api/providers/diagnostics/${centreId}/tests/${query}`);
}

// 30 & 31. Diagnostic Tests
export async function fetchAllDiagnosticTestsApi(params?: { diagnostic_centre?: number | string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.diagnostic_centre) query.append('diagnostic_centre', String(params.diagnostic_centre));
  if (params?.search) query.append('search', params.search);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<PaginatedResponse<ApiDiagnosticTest> | ApiDiagnosticTest[]>(`/api/providers/diagnostic-tests/${queryString}`);
}

export async function getDiagnosticTestDetailsApi(id: number | string) {
  return apiFetch<ApiDiagnosticTest>(`/api/providers/diagnostic-tests/${id}/`);
}

export async function createDiagnosticTestApi(data: Partial<ApiDiagnosticTest>) {
  return apiFetch<ApiDiagnosticTest>('/api/providers/diagnostic-tests/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDiagnosticTestApi(id: number | string, data: Partial<ApiDiagnosticTest>) {
  return apiFetch<ApiDiagnosticTest>(`/api/providers/diagnostic-tests/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDiagnosticTestApi(id: number | string) {
  return apiFetch<{ success: boolean }>(`/api/providers/diagnostic-tests/${id}/`, {
    method: 'DELETE',
  });
}

export async function createDiagnosticBookingApi(data: {
  member: number;
  diagnostic_centre: number;
  diagnostic_test: number;
  preferred_datetime: string;
  notes?: string;
}) {
  return apiFetch<ApiAppointment>('/api/appointments/appointments/', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      appointment_type: 'DIAGNOSTIC',
    }),
  });
}

// 32. Pharmacies
export async function fetchPharmaciesListApi() {
  return apiFetch<PaginatedResponse<ApiPharmacy> | ApiPharmacy[]>('/api/providers/pharmacies/');
}

export async function getPharmacyDetailsApi(id: number | string) {
  return apiFetch<ApiPharmacy>(`/api/providers/pharmacies/${id}/`);
}

// 33. NC Payment Confirmation (POST /api/appointments/appointments/{id}/confirm-payment/)
export async function confirmNcPaymentApi(id: number | string, payment_status: 'PAID' | 'UNPAID', payment_method?: string, notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/confirm-payment/`, {
    method: 'POST',
    body: JSON.stringify({ payment_status, payment_method, notes }),
  });
}

// 34. HQ Video Room Creation & Control (POST /api/appointments/appointments/{id}/create-video-room/)
export async function createHqVideoRoomApi(id: number | string, room_notes?: string) {
  return apiFetch<ApiAppointment>(`/api/appointments/appointments/${id}/create-video-room/`, {
    method: 'POST',
    body: JSON.stringify({ room_notes }),
  });
}
