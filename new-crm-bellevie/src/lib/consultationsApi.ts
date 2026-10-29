import { apiFetch } from './api';

// -------------------------------------------------------------
// CONSULTATIONS API TYPES
// -------------------------------------------------------------

export type TelemedicineStatus = 'ONGOING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface TelemedicineChatMessage {
  id: number;
  call: number;
  sender_name: string;
  sender_role: string;
  message: string;
  timestamp: string;
}

export interface TelemedicineCall {
  id: number;
  public_id: string;
  room_id: string;
  member?: number | null;
  member_name: string;
  member_code: string;
  doctor_name?: string;
  doctor_specialization?: string;
  centre?: number | null;
  centre_name: string;
  status: TelemedicineStatus;
  started_at?: string | null;
  duration_seconds: number;
  participants_summary?: string;
  notes?: string;
  created_at?: string;
  chat_messages?: TelemedicineChatMessage[];
}

export type ForeignConsultationStatus =
  | 'PENDING_REVIEW'
  | 'REVIEWING'
  | 'PROPOSAL_READY'
  | 'PRICING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface ForeignDoctorConsultation {
  id: number;
  public_id: string;
  request_id: string;
  member?: number | null;
  member_name: string;
  member_code: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string;
  specialist_type: string;
  requested_date?: string | null;
  preferred_country: string;
  symptoms?: string;
  additional_notes?: string;
  status: ForeignConsultationStatus;
  created_by_centre_name: string;
  proposed_doctor_name?: string;
  proposed_specialization?: string;
  proposed_hospital?: string;
  proposed_country?: string;
  consultation_fee?: number;
  consultation_method?: string;
  meeting_link?: string;
  hq_notes?: string;
  created_at?: string;
}

// -------------------------------------------------------------
// INITIAL MOCK DATA (MATCHING SCREENSHOT EXACTLY)
// -------------------------------------------------------------

export const INITIAL_TELEMEDICINE_CALLS: TelemedicineCall[] = [
  {
    id: 1,
    public_id: 'call-001',
    room_id: 'TM-1001',
    member_name: 'Abdul Karim',
    member_code: 'BV-000124',
    centre_name: 'Dhaka Centre',
    status: 'ONGOING',
    started_at: 'Oct 6, 2026 2:00 PM',
    duration_seconds: 754,
    participants_summary: 'Doctor + Patient',
    notes: 'Regular video follow-up for cardiology check.',
    chat_messages: [
      { id: 1, call: 1, sender_name: 'Doctor', sender_role: 'DOCTOR', message: 'Hello, can you hear me?', timestamp: '2:03 PM' },
      { id: 2, call: 1, sender_name: 'Patient (Abdul Karim)', sender_role: 'PATIENT', message: 'Yes, doctor.', timestamp: '2:03 PM' },
      { id: 3, call: 1, sender_name: 'HQ Admin (You)', sender_role: 'HQ_ADMIN', message: 'Please start the consultation.', timestamp: '2:04 PM' },
    ],
  },
  {
    id: 2,
    public_id: 'call-002',
    room_id: 'TM-1002',
    member_name: 'Salma Begum',
    member_code: 'BV-000234',
    centre_name: 'Chittagong Centre',
    status: 'SCHEDULED',
    started_at: 'Oct 6, 2026 11:30 AM',
    duration_seconds: 0,
    participants_summary: 'Doctor + Patient',
    notes: 'Scheduled oncology initial review.',
  },
  {
    id: 3,
    public_id: 'call-003',
    room_id: 'TM-1003',
    member_name: 'Rahim Uddin',
    member_code: 'BV-000345',
    centre_name: 'Sylhet Centre',
    status: 'COMPLETED',
    started_at: 'Oct 5, 2026 3:00 PM',
    duration_seconds: 1200,
    participants_summary: 'Doctor + Patient',
    notes: 'Neurology follow-up completed.',
  },
  {
    id: 4,
    public_id: 'call-004',
    room_id: 'TM-1004',
    member_name: 'Rokeya Akter',
    member_code: 'BV-000456',
    centre_name: 'Khulna Centre',
    status: 'COMPLETED',
    started_at: 'Oct 5, 2026 10:00 AM',
    duration_seconds: 900,
    participants_summary: 'Doctor + Patient',
    notes: 'Pediatric consultation completed.',
  },
  {
    id: 5,
    public_id: 'call-005',
    room_id: 'TM-1005',
    member_name: 'Md. Hasan',
    member_code: 'BV-000567',
    centre_name: 'Dhaka Centre',
    status: 'CANCELLED',
    started_at: 'Oct 4, 2026 4:30 PM',
    duration_seconds: 0,
    participants_summary: '-',
    notes: 'Cancelled by member.',
  },
];

export const INITIAL_FOREIGN_CONSULTATIONS: ForeignDoctorConsultation[] = [
  {
    id: 1,
    public_id: 'fdc-001',
    request_id: 'FDC-001',
    member_name: 'Abdul Karim',
    member_code: 'BV-000124',
    patient_age: 45,
    patient_gender: 'Male',
    patient_phone: '01710000000',
    specialist_type: 'Cardiology',
    requested_date: '2026-10-10',
    preferred_country: 'India',
    status: 'REVIEWING',
    created_by_centre_name: 'Dhaka Centre',
  },
  {
    id: 2,
    public_id: 'fdc-002',
    request_id: 'FDC-002',
    member_name: 'Salma Begum',
    member_code: 'BV-000234',
    patient_age: 38,
    patient_gender: 'Female',
    patient_phone: '01710000000',
    specialist_type: 'Oncology',
    requested_date: '2026-10-15',
    preferred_country: 'Any',
    symptoms: 'Patient has been experiencing persistent pain and fatigue.',
    additional_notes: 'Need urgent consultation.',
    status: 'PROPOSAL_READY',
    created_by_centre_name: 'Chittagong Centre',
    proposed_doctor_name: 'Dr. (To be added)',
    proposed_specialization: 'Senior Oncologist',
    proposed_hospital: 'Hospital / Institution',
    proposed_country: 'India',
    consultation_fee: 150,
    consultation_method: 'Video Call Consultation',
  },
  {
    id: 3,
    public_id: 'fdc-003',
    request_id: 'FDC-003',
    member_name: 'Rahim Uddin',
    member_code: 'BV-000345',
    patient_age: 52,
    patient_gender: 'Male',
    patient_phone: '01810000000',
    specialist_type: 'Neurology',
    requested_date: '2026-10-12',
    preferred_country: 'Thailand',
    status: 'PRICING',
    created_by_centre_name: 'Sylhet Centre',
  },
  {
    id: 4,
    public_id: 'fdc-004',
    request_id: 'FDC-004',
    member_name: 'Rokeya Akter',
    member_code: 'BV-000456',
    patient_age: 8,
    patient_gender: 'Female',
    patient_phone: '01910000000',
    specialist_type: 'Pediatric',
    requested_date: '2026-10-18',
    preferred_country: 'Singapore',
    status: 'CONFIRMED',
    created_by_centre_name: 'Dhaka Centre',
  },
  {
    id: 5,
    public_id: 'fdc-005',
    request_id: 'FDC-005',
    member_name: 'Md. Hasan',
    member_code: 'BV-000567',
    patient_age: 60,
    patient_gender: 'Male',
    patient_phone: '01610000000',
    specialist_type: 'Orthopedic',
    requested_date: '2026-10-20',
    preferred_country: 'India',
    status: 'COMPLETED',
    created_by_centre_name: 'Khulna Centre',
  },
  {
    id: 6,
    public_id: 'fdc-006',
    request_id: 'FDC-006',
    member_name: 'Nargis Sultana',
    member_code: 'BV-000678',
    patient_age: 42,
    patient_gender: 'Female',
    patient_phone: '01510000000',
    specialist_type: 'Oncology',
    requested_date: '2026-10-22',
    preferred_country: 'Malaysia',
    status: 'COMPLETED',
    created_by_centre_name: 'Dhaka Centre',
  },
];

// -------------------------------------------------------------
// API / PERSISTENCE FUNCTIONS
// -------------------------------------------------------------

export async function fetchTelemedicineCalls(): Promise<TelemedicineCall[]> {
  try {
    const rawRes: any = await apiFetch('/api/consultations/telemedicine/');
    const calls = Array.isArray(rawRes) ? rawRes : (rawRes && Array.isArray(rawRes.results) ? rawRes.results : null);
    if (calls !== null) {
      return calls.map((c: any) => ({
        id: c.id,
        public_id: c.public_id || `call-${c.id}`,
        room_id: c.room_id,
        member_name: c.member_name || 'Abdul Karim',
        member_code: c.member_code || 'BV-000124',
        centre_name: c.centre_name || 'Dhaka Centre',
        status: c.status as TelemedicineStatus,
        started_at: c.started_at ? new Date(c.started_at).toLocaleString() : 'Oct 6, 2026 2:00 PM',
        duration_seconds: c.duration_seconds || 0,
        participants_summary: c.participants_summary || 'Doctor + Patient',
        notes: c.notes || '',
        chat_messages: c.chat_messages || [],
      }));
    }
  } catch (err) {
    // API fallback
  }
  return [];
}

export async function createTelemedicineCall(data: {
  member_name: string;
  member_code?: string;
  centre_name?: string;
  notes?: string;
}): Promise<TelemedicineCall> {
  try {
    const res = await apiFetch<any>('/api/consultations/telemedicine/', {
      method: 'POST',
      body: JSON.stringify({
        member_name: data.member_name,
        member_code: data.member_code || 'BV-000124',
        centre_name: data.centre_name || 'Dhaka Centre',
        notes: data.notes || '',
        status: 'SCHEDULED',
      }),
    });
    if (res && res.id) {
      return res;
    }
  } catch (err) {
    // API fallback
  }

  const count = INITIAL_TELEMEDICINE_CALLS.length + 1001;
  const newCall: TelemedicineCall = {
    id: Date.now(),
    public_id: `call-${Date.now()}`,
    room_id: `TM-${count}`,
    member_name: data.member_name,
    member_code: data.member_code || 'BV-000124',
    centre_name: data.centre_name || 'Dhaka Centre',
    status: 'SCHEDULED',
    started_at: new Date().toLocaleString(),
    duration_seconds: 0,
    participants_summary: 'Doctor + Patient',
    notes: data.notes || '',
  };
  INITIAL_TELEMEDICINE_CALLS.unshift(newCall);
  return newCall;
}

export async function sendChatMessage(callId: number, message: string, senderName = 'HQ Admin (You)'): Promise<TelemedicineChatMessage> {
  try {
    const res = await apiFetch<any>(`/api/consultations/telemedicine/${callId}/send_chat/`, {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        sender_name: senderName,
        sender_role: 'HQ_ADMIN',
      }),
    });
    if (res && res.id) return res;
  } catch (err) {
    // API fallback
  }

  const newMsg: TelemedicineChatMessage = {
    id: Date.now(),
    call: callId,
    sender_name: senderName,
    sender_role: 'HQ_ADMIN',
    message: message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  const call = INITIAL_TELEMEDICINE_CALLS.find(c => c.id === callId);
  if (call) {
    call.chat_messages = call.chat_messages || [];
    call.chat_messages.push(newMsg);
  }
  return newMsg;
}

export async function fetchForeignConsultations(): Promise<ForeignDoctorConsultation[]> {
  try {
    const rawRes: any = await apiFetch('/api/consultations/foreign-doctor/');
    const fdcs = Array.isArray(rawRes) ? rawRes : (rawRes && Array.isArray(rawRes.results) ? rawRes.results : null);
    if (fdcs !== null) {
      return fdcs.map((f: any) => ({
        id: f.id,
        public_id: f.public_id || `fdc-${f.id}`,
        request_id: f.request_id,
        member_name: f.member_name,
        member_code: f.member_code || 'BV-000123',
        patient_age: f.patient_age || 30,
        patient_gender: f.patient_gender || 'Male',
        patient_phone: f.patient_phone || '01710000000',
        specialist_type: f.specialist_type,
        requested_date: f.requested_date,
        preferred_country: f.preferred_country || 'Any',
        symptoms: f.symptoms,
        additional_notes: f.additional_notes,
        status: f.status as ForeignConsultationStatus,
        created_by_centre_name: f.created_by_centre_name || 'Dhaka Centre',
        proposed_doctor_name: f.proposed_doctor_name,
        proposed_specialization: f.proposed_specialization,
        proposed_hospital: f.proposed_hospital,
        proposed_country: f.proposed_country,
        consultation_fee: parseFloat(f.consultation_fee) || 0,
        consultation_method: f.consultation_method || 'Video Call Consultation',
        hq_notes: f.hq_notes,
      }));
    }
  } catch (err) {
    // API fallback
  }
  return [];
}

export async function createForeignConsultation(data: {
  member_name: string;
  member_code?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_phone?: string;
  specialist_type: string;
  requested_date?: string;
  preferred_country?: string;
  symptoms?: string;
  additional_notes?: string;
}): Promise<ForeignDoctorConsultation> {
  try {
    const res = await apiFetch<any>('/api/consultations/foreign-doctor/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res && res.id) return res;
  } catch (err) {
    // API fallback
  }

  const count = INITIAL_FOREIGN_CONSULTATIONS.length + 1;
  const newFdc: ForeignDoctorConsultation = {
    id: Date.now(),
    public_id: `fdc-${Date.now()}`,
    request_id: `FDC-${count.toString().padStart(3, '0')}`,
    member_name: data.member_name,
    member_code: data.member_code || 'BV-000123',
    patient_age: data.patient_age || 30,
    patient_gender: data.patient_gender || 'Male',
    patient_phone: data.patient_phone || '01710000000',
    specialist_type: data.specialist_type,
    requested_date: data.requested_date || new Date().toISOString().split('T')[0],
    preferred_country: data.preferred_country || 'Any',
    symptoms: data.symptoms || '',
    additional_notes: data.additional_notes || '',
    status: 'REVIEWING',
    created_by_centre_name: 'Dhaka Centre',
  };
  INITIAL_FOREIGN_CONSULTATIONS.unshift(newFdc);
  return newFdc;
}

export async function updateForeignConsultationStatus(
  id: number,
  status: ForeignConsultationStatus,
  hq_notes?: string
): Promise<ForeignDoctorConsultation> {
  try {
    let actionName = 'request_info';
    if (status === 'CONFIRMED') actionName = 'confirm';
    if (status === 'REJECTED') actionName = 'reject';

    const res = await apiFetch<any>(`/api/consultations/foreign-doctor/${id}/${actionName}/`, {
      method: 'POST',
      body: JSON.stringify({ hq_notes: hq_notes || '' }),
    });
    if (res && res.id) return res;
  } catch (err) {
    // API fallback
  }

  const item = INITIAL_FOREIGN_CONSULTATIONS.find(f => f.id === id);
  if (item) {
    item.status = status;
    if (hq_notes) item.hq_notes = hq_notes;
    return item;
  }
  throw new Error('Consultation request not found');
}
