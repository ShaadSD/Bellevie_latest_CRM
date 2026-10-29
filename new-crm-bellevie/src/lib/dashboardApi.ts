import { apiFetch } from './api';
import { DashboardViewConfig, MetricCardData, StatusSegment, ChartDataPoint, hqDashboardData, ncDashboardData, ViewType } from '@/data/dashboardData';

export interface BackendDashboardResponse {
  scope: 'HQ' | 'CENTRE';
  centre_id: number | null;
  centre_name: string;
  metrics: {
    members: { total: number; active: number; change: string };
    cases: { total: number; open: number; change: string };
    hospital_bookings: { total: number; pending: number; change: string };
    ambulance: { total: number; completed: number; change: string };
    homecare: { total: number; completed: number; change: string };
    health_plans: { total: number; active: number; change: string };
    foreign_treatment: { total: number; in_progress: number; change: string };
    crm_records: { total: number; open: number; change: string };
    crm_tasks: { total: number; pending: number; change: string };
    appointments: { total: number; pending: number; confirmed: number; change: string };
    billing_payments: { total_invoices: number; paid_invoices: number; total_payments: number; pending_payments: number; change: string };
  };
  trend_data: Array<{
    key: string;
    month: string;
    ambulance: number;
    homecare: number;
    hospital: number;
  }>;
  ambulance_status: {
    total: number;
    segments: Array<{
      code: string;
      label: string;
      count: number;
      percentage: string;
      color: string;
    }>;
  };
  homecare_status: {
    total: number;
    segments: Array<{
      code: string;
      label: string;
      count: number;
      percentage: string;
      color: string;
    }>;
  };
  recent_tables: {
    hospital_bookings: Array<{
      public_id: string;
      member__full_name?: string;
      hospital__name?: string;
      bed_type?: string;
      status: string;
      created_at: string;
    }>;
    ambulance_requests: Array<{
      public_id: string;
      member__full_name?: string;
      requested_vehicle_type?: string;
      status: string;
      created_at: string;
    }>;
    homecare_requests: Array<{
      public_id: string;
      member__full_name?: string;
      service__name?: string;
      status: string;
      created_at: string;
    }>;
    crm_tasks: Array<{
      public_id: string;
      title: string;
      due_date?: string;
      status: string;
      priority: string;
    }>;
  };
}

export async function fetchDashboardData(viewType: ViewType): Promise<DashboardViewConfig> {
  const fallback = viewType === 'HQ' ? hqDashboardData : ncDashboardData;

  try {
    let raw: BackendDashboardResponse | null = null;
    try {
      raw = await apiFetch<BackendDashboardResponse>('/api/dashboard/');
    } catch (err) {
      console.warn('[Dashboard API /api/dashboard/ failed, trying /api/reports/dashboard/]', err);
      raw = await apiFetch<BackendDashboardResponse>('/api/reports/dashboard/');
    }
    console.log('[Dashboard API Response]:', raw);

    if (!raw || !raw.metrics) {
      return fallback;
    }

    const m = raw.metrics;

    // Helper to format number string
    const fmt = (val: number | undefined | null) => (val ?? 0).toLocaleString();

    const metricsRow1: MetricCardData[] = [
      {
        id: 'total-members',
        title: 'Total Members',
        value: fmt(m.members?.total),
        change: m.members?.change ?? '+0%',
        subtitle: `Active Members: ${fmt(m.members?.active)}`,
        iconType: 'users',
      },
      {
        id: 'hospital-bookings',
        title: 'Hospital Bookings',
        value: fmt(m.hospital_bookings?.total),
        change: m.hospital_bookings?.change ?? '+0%',
        subtitle: `Pending: ${fmt(m.hospital_bookings?.pending)}`,
        iconType: 'calendar',
      },
      {
        id: 'ambulance-requests',
        title: 'Ambulance Requests',
        value: fmt(m.ambulance?.total),
        change: m.ambulance?.change ?? '+0%',
        subtitle: `Completed: ${fmt(m.ambulance?.completed)}`,
        iconType: 'ambulance',
      },
      {
        id: 'homecare-requests',
        title: 'Homecare Requests',
        value: fmt(m.homecare?.total),
        change: m.homecare?.change ?? '+0%',
        subtitle: `Completed: ${fmt(m.homecare?.completed)}`,
        iconType: 'home',
      },
    ];

    const metricsRow2: MetricCardData[] = [
      {
        id: 'health-plans',
        title: 'Health Plan Subscriptions',
        value: fmt(m.health_plans?.total),
        change: m.health_plans?.change ?? '+0%',
        subtitle: `Active: ${fmt(m.health_plans?.active)}`,
        iconType: 'shield',
      },
      {
        id: 'foreign-treatment',
        title: 'Foreign Treatment Cases',
        value: fmt(m.foreign_treatment?.total),
        change: m.foreign_treatment?.change ?? '+0%',
        subtitle: `In Progress: ${fmt(m.foreign_treatment?.in_progress)}`,
        iconType: 'plane',
      },
      {
        id: 'appointments',
        title: 'Appointments',
        value: fmt(m.appointments?.total),
        change: m.appointments?.change ?? '+0%',
        subtitle: `Pending: ${fmt(m.appointments?.pending)}`,
        iconType: 'clock',
      },
      {
        id: 'billing-payments',
        title: 'Billing & Payments',
        value: fmt(m.billing_payments?.total_invoices),
        change: m.billing_payments?.change ?? '+0%',
        subtitle: `Pending Payments: ${fmt(m.billing_payments?.pending_payments)}`,
        iconType: 'money',
      },
    ];

    const trendData: ChartDataPoint[] = (raw.trend_data && raw.trend_data.length > 0)
      ? raw.trend_data.map(td => ({
          month: td.month,
          ambulance: td.ambulance ?? 0,
          homecare: td.homecare ?? 0,
          hospital: td.hospital ?? 0,
        }))
      : fallback.trendData;

    const transformSegments = (
      statusObj: BackendDashboardResponse['ambulance_status'],
      fallbackObj: typeof fallback.ambulanceStatus
    ) => {
      if (!statusObj || !statusObj.segments) {
        return fallbackObj;
      }
      return {
        total: statusObj.total ?? 0,
        segments: statusObj.segments.map(s => ({
          label: s.label,
          count: s.count ?? 0,
          percentage: s.percentage ?? '0%',
          color: s.color,
        })),
      };
    };

    const ambulanceStatus = transformSegments(raw.ambulance_status, fallback.ambulanceStatus);
    const homecareStatus = transformSegments(raw.homecare_status, fallback.homecareStatus);

    const hospitalBookings = (raw.recent_tables?.hospital_bookings && raw.recent_tables.hospital_bookings.length > 0)
      ? raw.recent_tables.hospital_bookings.map(b => ({
          id: b.public_id ? `HB-${b.public_id.slice(0, 5).toUpperCase()}` : 'HB-1001',
          member: b.member__full_name || 'Member Patient',
          hospital: b.hospital__name || 'Hospital',
          bedType: b.bed_type || 'General',
          status: b.status || 'PENDING',
          date: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : 'Today',
        }))
      : [];

    const ambulanceRequests = (raw.recent_tables?.ambulance_requests && raw.recent_tables.ambulance_requests.length > 0)
      ? raw.recent_tables.ambulance_requests.map(a => ({
          id: a.public_id ? `AMB-${a.public_id.slice(0, 5).toUpperCase()}` : 'AMB-2001',
          member: a.member__full_name || 'Emergency Patient',
          vehicle: a.requested_vehicle_type || 'Ambulance',
          status: a.status || 'PENDING',
          date: a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : 'Today',
        }))
      : [];

    const homecareRequests = (raw.recent_tables?.homecare_requests && raw.recent_tables.homecare_requests.length > 0)
      ? raw.recent_tables.homecare_requests.map(h => ({
          id: h.public_id ? `HC-${h.public_id.slice(0, 5).toUpperCase()}` : 'HC-3001',
          member: h.member__full_name || 'Care Patient',
          service: h.service__name || 'Home Service',
          status: h.status || 'PENDING',
          date: h.created_at ? new Date(h.created_at).toISOString().split('T')[0] : 'Today',
        }))
      : [];

    return {
      viewType,
      headerTitle: viewType === 'HQ' ? 'HQ Dashboard' : 'NC Dashboard',
      headerSubtitle: viewType === 'HQ' ? 'Overview of BelleVie Healthcare Network' : `Network Centre Overview (${raw.centre_name || 'Local Centre'})`,
      notificationsCount: fallback.notificationsCount,
      userAvatar: fallback.userAvatar,
      userName: fallback.userName,
      userRole: raw.centre_name || fallback.userRole,
      metricsRow1,
      metricsRow2,
      trendMaxScale: fallback.trendMaxScale,
      trendScaleSteps: fallback.trendScaleSteps,
      trendData,
      ambulanceStatus,
      homecareStatus,
      hospitalBookings,
      ambulanceRequests,
      homecareRequests,
      crmFollowUps: fallback.crmFollowUps,
      assignedCrmTasks: fallback.assignedCrmTasks,
    };

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return fallback;
  }
}
