export interface Member {
  id: number;
  memberId: string;
  name: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female';
  centre: string;
  partner: string;
  status: 'Active' | 'Inactive';
  dateOfBirth?: string;
  address?: string;
  registeredBy?: string;
  registeredOn?: string;
  avatarColor?: string;
  familyMembers?: { name: string; relation: string; phone: string }[];
  history?: { date: string; action: string; details: string }[];
}

export const initialMembersData: Member[] = [
  {
    id: 1,
    memberId: 'MEM-0001',
    name: 'Rahim Uddin',
    phone: '01712345678',
    email: 'rahim@gmail.com',
    gender: 'Male',
    centre: 'Dhaka Centre',
    partner: 'ABC Health',
    status: 'Active',
    dateOfBirth: '1990-05-12',
    address: '123, Dhanmondi, Dhaka',
    registeredBy: 'Admin User',
    registeredOn: '2024-01-15 10:30',
    avatarColor: 'bg-blue-100 text-blue-600',
    familyMembers: [
      { name: 'Nasima Uddin', relation: 'Wife', phone: '01712345679' },
      { name: 'Rifat Uddin', relation: 'Son', phone: '01712345680' }
    ],
    history: [
      { date: '2024-01-15', action: 'Registered', details: 'Member registered at Dhaka Centre' },
      { date: '2024-03-10', action: 'Hospital Desk', details: 'Booked bed at Square Hospital' }
    ]
  },
  {
    id: 2,
    memberId: 'MEM-0002',
    name: 'Mst. Nusrat Jahan',
    phone: '01823456789',
    email: 'nusrat@gmail.com',
    gender: 'Female',
    centre: 'Chittagong Centre',
    partner: 'XYZ Health',
    status: 'Active',
    dateOfBirth: '1993-08-24',
    address: '45, Agrabad, Chittagong',
    registeredBy: 'Centre User',
    registeredOn: '2024-02-01 11:15',
    avatarColor: 'bg-purple-100 text-purple-600',
    familyMembers: [
      { name: 'Kamal Hossain', relation: 'Husband', phone: '01823456790' }
    ],
    history: [
      { date: '2024-02-01', action: 'Registered', details: 'Registered at Chittagong Centre' }
    ]
  },
  {
    id: 3,
    memberId: 'MEM-0003',
    name: 'Karim Ahmed',
    phone: '01987654321',
    email: 'karim@gmail.com',
    gender: 'Male',
    centre: 'Sylhet Centre',
    partner: 'Family Care',
    status: 'Active',
    dateOfBirth: '1988-11-03',
    address: '78, Zindabazar, Sylhet',
    registeredBy: 'Admin User',
    registeredOn: '2024-02-18 14:20',
    avatarColor: 'bg-emerald-100 text-emerald-600',
    familyMembers: [],
    history: [
      { date: '2024-02-18', action: 'Registered', details: 'Registered at Sylhet Centre' }
    ]
  },
  {
    id: 4,
    memberId: 'MEM-0004',
    name: 'Fatema Akter',
    phone: '01755667788',
    email: 'fatema@gmail.com',
    gender: 'Female',
    centre: 'Khulna Centre',
    partner: 'Health Plus',
    status: 'Inactive',
    dateOfBirth: '1995-04-19',
    address: '12, KDA Avenue, Khulna',
    registeredBy: 'Centre User',
    registeredOn: '2024-03-05 09:45',
    avatarColor: 'bg-rose-100 text-rose-600',
    familyMembers: [],
    history: [
      { date: '2024-03-05', action: 'Registered', details: 'Registered at Khulna Centre' },
      { date: '2024-08-01', action: 'Deactivated', details: 'Status changed to Inactive' }
    ]
  },
  {
    id: 5,
    memberId: 'MEM-0005',
    name: 'Abdul Mannan',
    phone: '01899887766',
    email: 'mannan@gmail.com',
    gender: 'Male',
    centre: 'HQ (Direct)',
    partner: '-',
    status: 'Active',
    dateOfBirth: '1982-01-30',
    address: '88, Gulshan, Dhaka',
    registeredBy: 'HQ Admin',
    registeredOn: '2024-03-20 16:00',
    avatarColor: 'bg-sky-100 text-sky-600',
    familyMembers: [
      { name: 'Salma Mannan', relation: 'Wife', phone: '01899887767' }
    ],
    history: [
      { date: '2024-03-20', action: 'Registered', details: 'Directly registered via HQ' }
    ]
  }
];
