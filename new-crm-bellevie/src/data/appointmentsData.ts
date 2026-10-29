export type AppointmentStatus = 
  | 'Pending' 
  | 'Verifying' 
  | 'Confirmed' 
  | 'Reschedule Requested' 
  | 'Completed' 
  | 'Cancelled' 
  | 'Rejected';

export type AppointmentType = 'Doctor' | 'Diagnostic';

export interface AppointmentHistoryLog {
  id: string;
  previousStatus: string;
  newStatus: string;
  notes: string;
  updatedBy: string;
  dateTime: string;
}

export interface RescheduleHistoryLog {
  id: number | string;
  previousDateTime: string;
  requestedDateTime: string;
  reason: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  requestedBy: string;
  dateTime: string;
}

export interface AppointmentItem {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberEmail: string;
  type: AppointmentType;
  providerOrTest: string; // Doctor name or Test name
  categoryOrSpeciality: string; // Speciality (Cardiologist) or Test Category (Pathology)
  centre: string; // Network Centre name
  hospitalOrFacility: string; // Apollo Hospital or Life Diagnostic
  dateTime: string; // e.g. "05 Oct 2026, 10:00 AM"
  status: AppointmentStatus;
  requestedBy: string;
  notes?: string;
  verificationNotes?: string;
  hqNotes?: string;
  rescheduleReason?: string;
  requestedRescheduleDateTime?: string;
  completionNotes?: string;
  cancellationReason?: string;
  rejectionNotes?: string;
  history: AppointmentHistoryLog[];
  rescheduleHistory: RescheduleHistoryLog[];
}

export interface Doctor {
  id: string;
  name: string;
  designation: string; // e.g. Cardiologist
  hospital: string;
  registration: string;
  fee: string;
  phone: string;
  rating: number;
  avatar: string;
}

export interface DiagnosticCentre {
  id: string;
  name: string;
  location: string;
  testsCount: number;
}

export interface DiagnosticTest {
  id: string;
  centreId: string;
  centreName: string;
  testName: string;
  category: string;
  sampleType: string;
  reportTime: string;
  preparation: string;
  price: string;
}

export const initialDoctors: Doctor[] = [
  {
    id: 'DOC-1',
    name: 'Dr. Ahmed Rahman',
    designation: 'Cardiologist',
    hospital: 'Apollo Hospital',
    registration: 'BMDC 12345',
    fee: '৳1000',
    phone: '0171XXXXXXX',
    rating: 4.8,
    avatar: 'AR'
  },
  {
    id: 'DOC-2',
    name: 'Dr. Nusrat Jahan',
    designation: 'Cardiologist',
    hospital: 'City Medical Centre',
    registration: 'BMDC 23456',
    fee: '৳1200',
    phone: '0182XXXXXXX',
    rating: 4.6,
    avatar: 'NJ'
  },
  {
    id: 'DOC-3',
    name: 'Dr. Hasan Al-Mamun',
    designation: 'Neurologist',
    hospital: 'Square Hospital',
    registration: 'BMDC 34567',
    fee: '৳1500',
    phone: '0193XXXXXXX',
    rating: 4.9,
    avatar: 'HA'
  },
  {
    id: 'DOC-4',
    name: 'Dr. Farhana Yasmin',
    designation: 'Dermatologist',
    hospital: 'Labaid Hospital',
    registration: 'BMDC 45678',
    fee: '৳1000',
    phone: '0164XXXXXXX',
    rating: 4.7,
    avatar: 'FY'
  },
  {
    id: 'DOC-5',
    name: 'Dr. Mahmudul Karim',
    designation: 'Orthopedic',
    hospital: 'Popular Hospital',
    registration: 'BMDC 56789',
    fee: '৳1200',
    phone: '0155XXXXXXX',
    rating: 4.5,
    avatar: 'MK'
  }
];

export const initialDiagnosticCentres: DiagnosticCentre[] = [
  { id: 'DC-1', name: 'Life Diagnostic Centre', location: 'Dhaka', testsCount: 35 },
  { id: 'DC-2', name: 'Popular Diagnostic', location: 'Gulshan', testsCount: 29 },
  { id: 'DC-3', name: 'United Diagnostic', location: 'Uttara', testsCount: 42 },
];

export const initialDiagnosticTests: DiagnosticTest[] = [
  {
    id: 'TEST-1',
    centreId: 'DC-1',
    centreName: 'Life Diagnostic Centre',
    testName: 'Complete Blood Count (CBC)',
    category: 'Pathology',
    sampleType: 'Blood',
    reportTime: '6 Hours',
    preparation: 'Fasting not required',
    price: '৳ 500'
  },
  {
    id: 'TEST-2',
    centreId: 'DC-1',
    centreName: 'Life Diagnostic Centre',
    testName: 'Lipid Profile',
    category: 'Biochemistry',
    sampleType: 'Blood',
    reportTime: '8 Hours',
    preparation: '12 Hours Fasting required',
    price: '৳ 1,200'
  },
  {
    id: 'TEST-3',
    centreId: 'DC-2',
    centreName: 'Popular Diagnostic',
    testName: 'Blood Sugar (Fasting)',
    category: 'Biochemistry',
    sampleType: 'Blood',
    reportTime: '4 Hours',
    preparation: '8 Hours Fasting required',
    price: '৳ 400'
  },
  {
    id: 'TEST-4',
    centreId: 'DC-3',
    centreName: 'United Diagnostic',
    testName: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    sampleType: 'Blood',
    reportTime: '12 Hours',
    preparation: 'Fasting recommended',
    price: '৳ 1,500'
  }
];

export const initialAppointmentsData: AppointmentItem[] = [
  {
    id: 'APT-00125',
    memberId: 'BV-001245',
    memberName: 'John Doe',
    memberPhone: '01710000000',
    memberEmail: 'john.doe@example.com',
    type: 'Doctor',
    providerOrTest: 'Dr. Ahmed Rahman',
    categoryOrSpeciality: 'Cardiologist',
    centre: 'Uttara Centre',
    hospitalOrFacility: 'Apollo Hospital',
    dateTime: '05 Oct 2026, 10:00 AM',
    status: 'Pending',
    requestedBy: 'John Doe (Uttara Centre)',
    notes: 'Regular consultation for chest checkup',
    history: [
      {
        id: 'H-1',
        previousStatus: '-',
        newStatus: 'Pending',
        notes: 'Appointment Created by Uttara Centre',
        updatedBy: 'John Doe (Uttara Centre)',
        dateTime: '03 Oct 2026, 02:15 PM'
      }
    ],
    rescheduleHistory: []
  },
  {
    id: 'APT-00126',
    memberId: 'BV-001246',
    memberName: 'Sara Khan',
    memberPhone: '01820000000',
    memberEmail: 'sara.khan@example.com',
    type: 'Diagnostic',
    providerOrTest: 'CBC Test',
    categoryOrSpeciality: 'Pathology',
    centre: 'Gulshan Centre',
    hospitalOrFacility: 'Life Diagnostic Centre',
    dateTime: '06 Oct 2026, 11:00 AM',
    status: 'Verifying',
    requestedBy: 'Gulshan Centre',
    notes: 'Routine blood checkup',
    verificationNotes: 'Verified by HQ Admin on phone verification',
    history: [
      {
        id: 'H-1',
        previousStatus: '-',
        newStatus: 'Pending',
        notes: 'Created',
        updatedBy: 'Gulshan Centre',
        dateTime: '03 Oct 2026, 02:15 PM'
      },
      {
        id: 'H-2',
        previousStatus: 'Pending',
        newStatus: 'Verifying',
        notes: 'Verified by HQ Admin',
        updatedBy: 'HQ Admin',
        dateTime: '03 Oct 2026, 03:20 PM'
      }
    ],
    rescheduleHistory: []
  },
  {
    id: 'APT-00127',
    memberId: 'BV-001247',
    memberName: 'Karim Uddin',
    memberPhone: '01930000000',
    memberEmail: 'karim.uddin@example.com',
    type: 'Doctor',
    providerOrTest: 'Dr. Nusrat Jahan',
    categoryOrSpeciality: 'Cardiologist',
    centre: 'Mirpur Centre',
    hospitalOrFacility: 'City Medical Centre',
    dateTime: '07 Oct 2026, 02:00 PM',
    status: 'Confirmed',
    requestedBy: 'Mirpur Centre',
    notes: 'Follow-up appointment for ECG review',
    hqNotes: 'Confirmed with City Medical Centre desk',
    history: [
      {
        id: 'H-1',
        previousStatus: '-',
        newStatus: 'Pending',
        notes: 'Created',
        updatedBy: 'Mirpur Centre',
        dateTime: '03 Oct 2026, 02:15 PM'
      },
      {
        id: 'H-2',
        previousStatus: 'Pending',
        newStatus: 'Verifying',
        notes: 'Verified by HQ Admin',
        updatedBy: 'HQ Admin',
        dateTime: '03 Oct 2026, 03:20 PM'
      },
      {
        id: 'H-3',
        previousStatus: 'Verifying',
        newStatus: 'Confirmed',
        notes: 'Confirmed by HQ Admin',
        updatedBy: 'HQ Admin',
        dateTime: '04 Oct 2026, 10:00 AM'
      }
    ],
    rescheduleHistory: []
  },
  {
    id: 'APT-00128',
    memberId: 'BV-001248',
    memberName: 'Ayesha Begum',
    memberPhone: '01640000000',
    memberEmail: 'ayesha.b@example.com',
    type: 'Diagnostic',
    providerOrTest: 'Lipid Profile',
    categoryOrSpeciality: 'Biochemistry',
    centre: 'Dhanmondi Centre',
    hospitalOrFacility: 'Popular Diagnostic',
    dateTime: '08 Oct 2026, 10:30 AM',
    status: 'Reschedule Requested',
    requestedBy: 'John Doe (Uttara Centre)',
    requestedRescheduleDateTime: '08 Oct 2026, 02:00 PM',
    rescheduleReason: 'Patient is unavailable on the confirmed date.',
    notes: 'Fasting required for 12 hours',
    history: [
      {
        id: 'H-1',
        previousStatus: 'Confirmed',
        newStatus: 'Reschedule Requested',
        notes: 'Reschedule requested by centre',
        updatedBy: 'Uttara Centre',
        dateTime: '04 Oct 2026, 04:00 PM'
      }
    ],
    rescheduleHistory: [
      {
        id: 1,
        previousDateTime: '05 Oct 2026, 10:00 AM',
        requestedDateTime: '08 Oct 2026, 02:00 PM',
        reason: 'Patient is unavailable.',
        status: 'Pending',
        requestedBy: 'John Doe (Uttara Centre)',
        dateTime: '04 Oct 2026'
      },
      {
        id: 2,
        previousDateTime: '01 Oct 2026',
        requestedDateTime: '05 Oct 2026',
        reason: 'Doctor unavailable',
        status: 'Rejected',
        requestedBy: 'HQ Admin',
        dateTime: '28 Sep 2026'
      }
    ]
  },
  {
    id: 'APT-00129',
    memberId: 'BV-001249',
    memberName: 'Rafiqul Islam',
    memberPhone: '01550000000',
    memberEmail: 'rafiqul.i@example.com',
    type: 'Doctor',
    providerOrTest: 'Dr. Hasan Al-Mamun',
    categoryOrSpeciality: 'Neurologist',
    centre: 'Uttara Centre',
    hospitalOrFacility: 'Square Hospital',
    dateTime: '09 Oct 2026, 11:00 AM',
    status: 'Completed',
    requestedBy: 'Uttara Centre',
    completionNotes: 'Consultation completed successfully.',
    history: [
      {
        id: 'H-1',
        previousStatus: 'Confirmed',
        newStatus: 'Completed',
        notes: 'Consultation completed.',
        updatedBy: 'HQ Admin',
        dateTime: '09 Oct 2026, 12:30 PM'
      }
    ],
    rescheduleHistory: []
  },
  {
    id: 'APT-00130',
    memberId: 'BV-001250',
    memberName: 'Mobarak Hossain',
    memberPhone: '01760000000',
    memberEmail: 'mobarak.h@example.com',
    type: 'Diagnostic',
    providerOrTest: 'Blood Sugar (Fasting)',
    categoryOrSpeciality: 'Biochemistry',
    centre: 'Dhanmondi Centre',
    hospitalOrFacility: 'United Diagnostic',
    dateTime: '10 Oct 2026, 09:00 AM',
    status: 'Cancelled',
    requestedBy: 'Dhanmondi Centre',
    cancellationReason: 'Patient requested cancellation due to personal emergency.',
    history: [
      {
        id: 'H-1',
        previousStatus: 'Pending',
        newStatus: 'Cancelled',
        notes: 'Patient requested cancellation.',
        updatedBy: 'HQ Admin',
        dateTime: '05 Oct 2026, 09:00 AM'
      }
    ],
    rescheduleHistory: []
  },
  {
    id: 'APT-00131',
    memberId: 'BV-001251',
    memberName: 'Farhana Akter',
    memberPhone: '01870000000',
    memberEmail: 'farhana.a@example.com',
    type: 'Doctor',
    providerOrTest: 'Dr. Farhana Yasmin',
    categoryOrSpeciality: 'Dermatologist',
    centre: 'Gulshan Centre',
    hospitalOrFacility: 'Labaid Hospital',
    dateTime: '11 Oct 2026, 03:00 PM',
    status: 'Rejected',
    requestedBy: 'Gulshan Centre',
    rejectionNotes: 'Requested slot not available at doctor schedule.',
    history: [
      {
        id: 'H-1',
        previousStatus: 'Pending',
        newStatus: 'Rejected',
        notes: 'Slot unavailable.',
        updatedBy: 'HQ Admin',
        dateTime: '04 Oct 2026, 11:00 AM'
      }
    ],
    rescheduleHistory: []
  }
];
