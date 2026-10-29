export interface DiagnosticBooking {
  id: string; // DBK-00123
  numericId: number;
  memberName: string;
  memberId: string;
  memberPhone?: string;
  memberAvatar?: string;
  gender?: 'Male' | 'Female';
  tests: string[]; // e.g. ['CBC', 'Blood Sugar']
  diagnosticCentre: string;
  centreLocation?: string;
  requestedDate: string; // e.g. "15 Oct 2026"
  requestedTime: string; // e.g. "10:30 AM"
  status: 'Pending' | 'Confirmed' | 'Verified' | 'Processing' | 'Cancelled';
  totalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  sampleCollection?: 'At Centre' | 'Home Sample Collection';
  prescriptionUrl?: string;
  doctorName?: string;
  networkCentre?: string;
  notes?: string;
}

export interface DiagnosticCentre {
  id: number;
  name: string;
  location: string;
  fullAddress?: string;
  contact: string;
  email?: string;
  status: 'Approved' | 'Pending' | 'Suspended';
  discountOffer?: string; // e.g. "15% Network Discount"
  openHours?: string;
  rating?: number;
  totalBookings?: number;
}

export interface DiagnosticTest {
  id: number;
  code: string;
  name: string;
  category: 'Hematology' | 'Biochemistry' | 'Radiology' | 'Endocrinology' | 'Cardiology' | 'Pathology' | 'Microbiology' | string;
  basePrice: number;
  memberPrice?: number;
  status: 'Active' | 'Inactive';
  sampleType?: string; // 'Blood', 'Urine', 'Imaging', etc.
  turnaroundTime?: string; // '6 Hours', '24 Hours'
  preparationRequired?: string; // '10-12 hours fasting required'
  diagnosticCentreId?: number;
  diagnosticCentreName?: string;
  description?: string;
}

export const INITIAL_BOOKINGS: DiagnosticBooking[] = [
  {
    id: 'DBK-00123',
    numericId: 1,
    memberName: 'Abu Jafor',
    memberId: 'BV-1234456',
    memberPhone: '01712-345678',
    gender: 'Male',
    tests: ['CBC', 'Blood Sugar'],
    diagnosticCentre: 'Mymensingh Diagnostic Center',
    centreLocation: 'Mymensingh',
    requestedDate: '15 Oct 2026',
    requestedTime: '10:30 AM',
    status: 'Pending',
    totalAmount: 700,
    discountAmount: 70,
    finalAmount: 630,
    sampleCollection: 'At Centre',
    doctorName: 'Dr. M. Rahman (FCPS)',
    notes: 'Patient requested morning slot for fasting blood sugar test.'
  },
  {
    id: 'DBK-00122',
    numericId: 2,
    memberName: 'Sadia Akter',
    memberId: 'BV-1234457',
    memberPhone: '01811-987654',
    gender: 'Female',
    tests: ['LFT', 'KFT'],
    diagnosticCentre: 'Popular Diagnostic Centre, Dhaka',
    centreLocation: 'Dhanmondi, Dhaka',
    requestedDate: '14 Oct 2026',
    requestedTime: '02:00 PM',
    status: 'Confirmed',
    totalAmount: 2200,
    discountAmount: 330,
    finalAmount: 1870,
    sampleCollection: 'At Centre',
    doctorName: 'Dr. Farhana Ahmed',
    notes: 'Routine liver & kidney profile check.'
  },
  {
    id: 'DBK-00121',
    numericId: 3,
    memberName: 'Kamal Hossain',
    memberId: 'BV-1234458',
    memberPhone: '01923-456789',
    gender: 'Male',
    tests: ['X-Ray (Chest)'],
    diagnosticCentre: 'LabAid Diagnostic',
    centreLocation: 'Gulshan, Dhaka',
    requestedDate: '13 Oct 2026',
    requestedTime: '11:00 AM',
    status: 'Verified',
    totalAmount: 800,
    discountAmount: 120,
    finalAmount: 680,
    sampleCollection: 'At Centre',
    doctorName: 'Prof. Dr. A. Karim',
    notes: 'PA View chest X-ray for persistent cough.'
  },
  {
    id: 'DBK-00120',
    numericId: 4,
    memberName: 'Jannatul Mawa',
    memberId: 'BV-1234459',
    memberPhone: '01655-234567',
    gender: 'Female',
    tests: ['Thyroid Profile'],
    diagnosticCentre: 'Delta Diagnostic Centre',
    centreLocation: 'Chattogram',
    requestedDate: '12 Oct 2026',
    requestedTime: '09:30 AM',
    status: 'Processing',
    totalAmount: 1500,
    discountAmount: 225,
    finalAmount: 1275,
    sampleCollection: 'Home Sample Collection',
    doctorName: 'Dr. Nusrat Jahan',
    notes: 'Home sample collection scheduled in Chattogram area.'
  },
  {
    id: 'DBK-00119',
    numericId: 5,
    memberName: 'Rafiq Ahmed',
    memberId: 'BV-1234460',
    memberPhone: '01799-876543',
    gender: 'Male',
    tests: ['Ultrasonography'],
    diagnosticCentre: 'United Diagnostic Centre',
    centreLocation: 'Dhaka',
    requestedDate: '11 Oct 2026',
    requestedTime: '03:00 PM',
    status: 'Cancelled',
    totalAmount: 2200,
    discountAmount: 0,
    finalAmount: 2200,
    sampleCollection: 'At Centre',
    doctorName: 'Dr. S. K. Roy',
    notes: 'Cancelled by patient due to scheduling conflict.'
  },
  {
    id: 'DBK-00118',
    numericId: 6,
    memberName: 'Tahmina Begum',
    memberId: 'BV-1234461',
    memberPhone: '01511-223344',
    gender: 'Female',
    tests: ['HbA1c', 'Lipid Profile'],
    diagnosticCentre: 'Popular Diagnostic Centre, Dhaka',
    centreLocation: 'Dhaka',
    requestedDate: '10 Oct 2026',
    requestedTime: '08:30 AM',
    status: 'Confirmed',
    totalAmount: 2300,
    discountAmount: 345,
    finalAmount: 1955,
    sampleCollection: 'At Centre',
    doctorName: 'Dr. Shah Alam',
    notes: 'Quarterly diabetic follow-up.'
  },
  {
    id: 'DBK-00117',
    numericId: 7,
    memberName: 'Mohammad Faruk',
    memberId: 'BV-1234462',
    memberPhone: '01888-776655',
    gender: 'Male',
    tests: ['ECG (12-Lead)', 'CBC'],
    diagnosticCentre: 'LabAid Diagnostic',
    centreLocation: 'Dhaka',
    requestedDate: '09 Oct 2026',
    requestedTime: '04:15 PM',
    status: 'Verified',
    totalAmount: 1100,
    discountAmount: 165,
    finalAmount: 935,
    sampleCollection: 'At Centre',
    doctorName: 'Dr. Tanvir Hossain',
    notes: 'Pre-operative clearance.'
  }
];

export const INITIAL_CENTRES: DiagnosticCentre[] = [
  {
    id: 1,
    name: 'Popular Diagnostic Centre',
    location: 'Dhaka',
    fullAddress: 'House 16, Road 2, Dhanmondi R/A, Dhaka-1205',
    contact: '017XXXXXXXX',
    email: 'info@populardiagnostic.com',
    status: 'Approved',
    discountOffer: '15% Member Discount',
    openHours: '7:00 AM - 11:00 PM',
    rating: 4.8,
    totalBookings: 84
  },
  {
    id: 2,
    name: 'LabAid Diagnostic',
    location: 'Dhaka',
    fullAddress: 'House 1, Road 4, Dhanmondi, Dhaka-1205',
    contact: '018XXXXXXXX',
    email: 'contact@labaidgroup.com',
    status: 'Approved',
    discountOffer: '12% Network Discount',
    openHours: '24 Hours',
    rating: 4.7,
    totalBookings: 62
  },
  {
    id: 3,
    name: 'Delta Diagnostic Centre',
    location: 'Chattogram',
    fullAddress: '24/A O.R. Nizam Road, Panchlaish, Chattogram',
    contact: '019XXXXXXXX',
    email: 'ctg@deltadiagnostics.com',
    status: 'Pending',
    discountOffer: '10% Introductory Discount',
    openHours: '8:00 AM - 10:00 PM',
    rating: 4.4,
    totalBookings: 19
  },
  {
    id: 4,
    name: 'Mymensingh Diagnostic Center',
    location: 'Mymensingh',
    fullAddress: 'Charpara Medical Road, Mymensingh-2200',
    contact: '016XXXXXXXX',
    email: 'info@mymensinghdiagnostic.com',
    status: 'Approved',
    discountOffer: '15% BelleVie Cardholders',
    openHours: '7:30 AM - 10:30 PM',
    rating: 4.6,
    totalBookings: 31
  },
  {
    id: 5,
    name: 'United Diagnostic Centre',
    location: 'Dhaka',
    fullAddress: 'Plot 15, Road 71, Gulshan-2, Dhaka-1212',
    contact: '01711XXXXXX',
    email: 'diagnostics@unitedhospital.com.bd',
    status: 'Approved',
    discountOffer: '10% Privilege Discount',
    openHours: '24 Hours',
    rating: 4.9,
    totalBookings: 47
  },
  {
    id: 6,
    name: 'Ibn Sina Diagnostic Centre',
    location: 'Sylhet',
    fullAddress: 'Subhani Ghat, Sylhet',
    contact: '01822XXXXXX',
    email: 'sylhet@ibnsina.com',
    status: 'Approved',
    discountOffer: '15% Health Partner Discount',
    openHours: '7:00 AM - 11:00 PM',
    rating: 4.5,
    totalBookings: 26
  }
];

export const INITIAL_TESTS: DiagnosticTest[] = [
  {
    id: 1,
    code: 'TST-001',
    name: 'CBC (Complete Blood Count)',
    category: 'Hematology',
    basePrice: 500,
    memberPrice: 425,
    status: 'Active',
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '4 - 6 Hours',
    preparationRequired: 'No special fasting required'
  },
  {
    id: 2,
    code: 'TST-002',
    name: 'Blood Sugar (FBS)',
    category: 'Biochemistry',
    basePrice: 200,
    memberPrice: 170,
    status: 'Active',
    sampleType: 'Fluoride Plasma',
    turnaroundTime: '2 - 3 Hours',
    preparationRequired: 'Overnight 10-12 hours fasting required'
  },
  {
    id: 3,
    code: 'TST-003',
    name: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    basePrice: 1200,
    memberPrice: 1020,
    status: 'Active',
    sampleType: 'Serum',
    turnaroundTime: '6 - 8 Hours',
    preparationRequired: '8 hours fasting recommended'
  },
  {
    id: 4,
    code: 'TST-004',
    name: 'Kidney Function Test (KFT)',
    category: 'Biochemistry',
    basePrice: 1000,
    memberPrice: 850,
    status: 'Active',
    sampleType: 'Serum & Urine',
    turnaroundTime: '6 - 8 Hours',
    preparationRequired: 'Standard hydration'
  },
  {
    id: 5,
    code: 'TST-005',
    name: 'Thyroid Profile (T3, T4, TSH)',
    category: 'Endocrinology',
    basePrice: 1500,
    memberPrice: 1275,
    status: 'Active',
    sampleType: 'Serum',
    turnaroundTime: '12 - 24 Hours',
    preparationRequired: 'Early morning fasting sample preferred'
  },
  {
    id: 6,
    code: 'TST-006',
    name: 'Chest X-Ray (PA View)',
    category: 'Radiology',
    basePrice: 800,
    memberPrice: 680,
    status: 'Active',
    sampleType: 'Digital Imaging',
    turnaroundTime: '2 Hours',
    preparationRequired: 'Remove all metallic objects & jewelry'
  },
  {
    id: 7,
    code: 'TST-007',
    name: 'Ultrasonography (Whole Abdomen)',
    category: 'Radiology',
    basePrice: 2200,
    memberPrice: 1870,
    status: 'Active',
    sampleType: 'Ultrasound Imaging',
    turnaroundTime: 'Same Day',
    preparationRequired: 'Full bladder & 6 hours fasting required'
  },
  {
    id: 8,
    code: 'TST-008',
    name: 'Lipid Profile',
    category: 'Biochemistry',
    basePrice: 1400,
    memberPrice: 1190,
    status: 'Active',
    sampleType: 'Serum',
    turnaroundTime: '6 Hours',
    preparationRequired: '12 hours strict fasting required'
  },
  {
    id: 9,
    code: 'TST-009',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Biochemistry',
    basePrice: 900,
    memberPrice: 765,
    status: 'Active',
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '4 Hours',
    preparationRequired: 'No fasting necessary'
  },
  {
    id: 10,
    code: 'TST-010',
    name: 'ECG (12-Lead)',
    category: 'Cardiology',
    basePrice: 600,
    memberPrice: 510,
    status: 'Active',
    sampleType: 'Electrophysiological Tracing',
    turnaroundTime: '30 Minutes',
    preparationRequired: 'Relaxed state, avoid strenuous exercise'
  },
  {
    id: 11,
    code: 'TST-011',
    name: 'Urine R/M/E',
    category: 'Pathology',
    basePrice: 350,
    memberPrice: 300,
    status: 'Active',
    sampleType: 'Mid-stream Urine',
    turnaroundTime: '2 Hours',
    preparationRequired: 'Clean catch mid-stream sample'
  }
];
