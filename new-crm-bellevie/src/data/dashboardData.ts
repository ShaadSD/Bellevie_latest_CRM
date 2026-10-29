export type ViewType = 'HQ' | 'NC';

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  subtitle: string;
  iconType: 'users' | 'document' | 'calendar' | 'ambulance' | 'home' | 'shield' | 'plane' | 'briefcase' | 'tasks' | 'money' | 'clock';
}

export interface StatusSegment {
  label: string;
  count: number;
  percentage: string;
  color: string;
}

export interface ChartDataPoint {
  month: string;
  ambulance: number;
  homecare: number;
  hospital: number;
}

export interface HospitalBooking {
  id: string;
  member: string;
  hospital: string;
  bedType: string;
  status: string;
  date: string;
}

export interface AmbulanceRequest {
  id: string;
  member: string;
  vehicle: string;
  status: string;
  date: string;
}

export interface HomecareRequest {
  id: string;
  member: string;
  service: string;
  status: string;
  date: string;
}

export interface CrmFollowUp {
  id: string;
  title: string;
  member: string;
  nextFollowUp: string;
  priority: 'HIGH' | 'NORMAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING';
}

export interface CrmTask {
  id: string;
  title: string;
  relatedRecord: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS';
}

export interface DashboardViewConfig {
  viewType: ViewType;
  headerTitle: string;
  headerSubtitle: string;
  notificationsCount: number;
  userAvatar: string;
  userName: string;
  userRole: string;
  metricsRow1: MetricCardData[];
  metricsRow2: MetricCardData[];
  trendMaxScale: number;
  trendScaleSteps: number[];
  trendData: ChartDataPoint[];
  ambulanceStatus: {
    total: number;
    segments: StatusSegment[];
  };
  homecareStatus: {
    total: number;
    segments: StatusSegment[];
  };
  hospitalBookings: HospitalBooking[];
  ambulanceRequests: AmbulanceRequest[];
  homecareRequests: HomecareRequest[];
  crmFollowUps?: CrmFollowUp[];
  assignedCrmTasks?: CrmTask[];
}

export const hqDashboardData: DashboardViewConfig = {
  viewType: 'HQ',
  headerTitle: 'HQ Dashboard',
  headerSubtitle: 'Overview of BelleVie Healthcare Network',
  notificationsCount: 0,
  userAvatar: 'HA',
  userName: 'HQ Admin',
  userRole: 'Head Office',
  metricsRow1: [
    {
      id: 'total-members',
      title: 'Total Members',
      value: '0',
      change: '+0%',
      subtitle: 'Active Members: 0',
      iconType: 'users'
    },
    {
      id: 'hospital-bookings',
      title: 'Hospital Bookings',
      value: '0',
      change: '+0%',
      subtitle: 'Pending: 0',
      iconType: 'calendar'
    },
    {
      id: 'ambulance-requests',
      title: 'Ambulance Requests',
      value: '0',
      change: '+0%',
      subtitle: 'Completed: 0',
      iconType: 'ambulance'
    },
    {
      id: 'homecare-requests',
      title: 'Homecare Requests',
      value: '0',
      change: '+0%',
      subtitle: 'Completed: 0',
      iconType: 'home'
    }
  ],
  metricsRow2: [
    {
      id: 'health-plans',
      title: 'Health Plan Subscriptions',
      value: '0',
      change: '+0%',
      subtitle: 'Active: 0',
      iconType: 'shield'
    },
    {
      id: 'foreign-treatment',
      title: 'Foreign Treatment Cases',
      value: '0',
      change: '+0%',
      subtitle: 'In Progress: 0',
      iconType: 'plane'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      value: '0',
      change: '+0%',
      subtitle: 'Pending: 0',
      iconType: 'clock'
    },
    {
      id: 'billing-payments',
      title: 'Billing & Payments',
      value: '0',
      change: '+0%',
      subtitle: 'Pending Payments: 0',
      iconType: 'money'
    }
  ],
  trendMaxScale: 100,
  trendScaleSteps: [0, 25, 50, 75, 100],
  trendData: [],
  ambulanceStatus: {
    total: 0,
    segments: []
  },
  homecareStatus: {
    total: 0,
    segments: []
  },
  hospitalBookings: [],
  ambulanceRequests: [],
  homecareRequests: []
};

export const ncDashboardData: DashboardViewConfig = {
  viewType: 'NC',
  headerTitle: 'Network Centre Dashboard',
  headerSubtitle: 'Overview of Centre Operations',
  notificationsCount: 0,
  userAvatar: 'NC',
  userName: 'Network Centre User',
  userRole: 'Network Centre',
  metricsRow1: [
    {
      id: 'total-members',
      title: 'Total Members',
      value: '0',
      change: '+0%',
      subtitle: 'Active Members: 0',
      iconType: 'users'
    },
    {
      id: 'hospital-bookings',
      title: 'Hospital Bookings',
      value: '0',
      change: '+0%',
      subtitle: 'Pending: 0',
      iconType: 'calendar'
    },
    {
      id: 'ambulance-requests',
      title: 'Ambulance Requests',
      value: '0',
      change: '+0%',
      subtitle: 'Completed: 0',
      iconType: 'ambulance'
    },
    {
      id: 'homecare-requests',
      title: 'Homecare Requests',
      value: '0',
      change: '+0%',
      subtitle: 'Completed: 0',
      iconType: 'home'
    }
  ],
  metricsRow2: [
    {
      id: 'health-plans',
      title: 'Health Plan Subscriptions',
      value: '0',
      change: '+0%',
      subtitle: 'Active: 0',
      iconType: 'shield'
    },
    {
      id: 'foreign-treatment',
      title: 'Foreign Treatment Cases',
      value: '0',
      change: '+0%',
      subtitle: 'In Progress: 0',
      iconType: 'plane'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      value: '0',
      change: '+0%',
      subtitle: 'Pending: 0',
      iconType: 'clock'
    },
    {
      id: 'billing-payments',
      title: 'Billing & Payments',
      value: '0',
      change: '+0%',
      subtitle: 'Pending Payments: 0',
      iconType: 'money'
    }
  ],
  trendMaxScale: 100,
  trendScaleSteps: [0, 25, 50, 75, 100],
  trendData: [],
  ambulanceStatus: {
    total: 0,
    segments: []
  },
  homecareStatus: {
    total: 0,
    segments: []
  },
  hospitalBookings: [],
  ambulanceRequests: [],
  homecareRequests: [],
  crmFollowUps: [],
  assignedCrmTasks: []
};
