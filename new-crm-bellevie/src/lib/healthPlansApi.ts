import { apiFetch } from './api';

// -------------------------------------------------------------
// HEALTH PLANS API TYPES
// -------------------------------------------------------------

export interface PlanBenefit {
  id: number;
  plan?: number;
  name: string;
  type: 'Monetary' | 'Percentage' | 'Service' | 'Limit';
  amount: string;
  usage_limit?: number | null;
  is_active: boolean;
  description?: string;
}

export interface HealthPlan {
  id: number;
  name: string;
  code: string;
  description: string;
  price: number; // Monthly fee in BDT
  annual_fee: number; // Annual fee in BDT
  duration_days: number;
  terms: string;
  is_published: boolean;
  is_active: boolean;
  display_order: number;
  members_count: number;
  created_at?: string;
  benefits?: PlanBenefit[];
}

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';

export interface PlanSubscription {
  id: number;
  public_id: string;
  member_id: string;
  member_name: string;
  plan_id: number;
  plan_name: string;
  billing_cycle: 'Monthly' | 'Annual';
  price: number;
  centre_name: string;
  requested_by: string;
  date: string;
  status: SubscriptionStatus;
  notes?: string;
  hq_notes?: string;
  start_date?: string;
  end_date?: string;
}

export interface HealthPlanStats {
  totalPlans: number;
  publishedPlans: number;
  activeMembers: number;
  pendingRequests: number;
}

// -------------------------------------------------------------
// DEFAULT MOCK DATA (MATCHING EXACT DESIGN SCREENSHOT)
// -------------------------------------------------------------

export const DEFAULT_PLAN_BENEFITS: Record<string, PlanBenefit[]> = {
  sohay: [
    { id: 101, name: 'Life Support Benefit', type: 'Monetary', amount: '100,000', usage_limit: null, is_active: true },
    { id: 102, name: 'Accidental Benefit', type: 'Monetary', amount: '200,000', usage_limit: null, is_active: true },
    { id: 103, name: 'Permanent/Partial Disability', type: 'Monetary', amount: '100,000', usage_limit: null, is_active: true },
    { id: 104, name: 'Critical Illness Benefit', type: 'Monetary', amount: '-', usage_limit: null, is_active: false },
    { id: 105, name: 'Hospital Stay Benefit', type: 'Monetary', amount: '5,000', usage_limit: null, is_active: true },
    { id: 106, name: 'Hospital Admission Benefit', type: 'Monetary', amount: '-', usage_limit: null, is_active: false },
    { id: 107, name: 'Diagnostic Discount', type: 'Percentage', amount: '50%', usage_limit: null, is_active: true },
    { id: 108, name: '24/7 Online Doctor', type: 'Service', amount: 'Available', usage_limit: null, is_active: true },
    { id: 109, name: 'Other Medical Discount', type: 'Percentage', amount: '10-50%', usage_limit: null, is_active: true },
  ],
  nirvor: [
    { id: 201, name: 'Life Support Benefit', type: 'Monetary', amount: '150,000', usage_limit: null, is_active: true },
    { id: 202, name: 'Accidental Benefit', type: 'Monetary', amount: '300,000', usage_limit: null, is_active: true },
    { id: 203, name: 'Permanent/Partial Disability', type: 'Monetary', amount: '150,000', usage_limit: null, is_active: true },
    { id: 204, name: 'Critical Illness Benefit', type: 'Monetary', amount: '-', usage_limit: null, is_active: false },
    { id: 205, name: 'Hospital Stay Benefit', type: 'Monetary', amount: '10,000', usage_limit: null, is_active: true },
    { id: 206, name: 'Hospital Admission Benefit', type: 'Monetary', amount: '-', usage_limit: null, is_active: false },
    { id: 207, name: 'Diagnostic Discount', type: 'Percentage', amount: '50%', usage_limit: null, is_active: true },
    { id: 208, name: '24/7 Online Doctor', type: 'Service', amount: 'Available', usage_limit: null, is_active: true },
    { id: 209, name: 'Other Medical Discount', type: 'Percentage', amount: '10-50%', usage_limit: null, is_active: true },
  ],
  swosti: [
    { id: 301, name: 'Life Support Benefit', type: 'Monetary', amount: '175,000', usage_limit: null, is_active: true },
    { id: 302, name: 'Accidental Benefit', type: 'Monetary', amount: '350,000', usage_limit: null, is_active: true },
    { id: 303, name: 'Permanent/Partial Disability', type: 'Monetary', amount: '175,000', usage_limit: null, is_active: true },
    { id: 304, name: 'Critical Illness Benefit', type: 'Monetary', amount: '50,000', usage_limit: null, is_active: true },
    { id: 305, name: 'Hospital Stay Benefit', type: 'Monetary', amount: '20,000', usage_limit: null, is_active: true },
    { id: 306, name: 'Hospital Admission Benefit', type: 'Monetary', amount: '-', usage_limit: null, is_active: false },
    { id: 307, name: 'Diagnostic Discount', type: 'Percentage', amount: '50%', usage_limit: null, is_active: true },
    { id: 308, name: '24/7 Online Doctor', type: 'Service', amount: 'Available', usage_limit: null, is_active: true },
    { id: 309, name: 'Other Medical Discount', type: 'Percentage', amount: '10-50%', usage_limit: null, is_active: true },
  ],
  asha: [
    { id: 401, name: 'Life Support Benefit', type: 'Monetary', amount: '250,000', usage_limit: null, is_active: true },
    { id: 402, name: 'Accidental Benefit', type: 'Monetary', amount: '600,000', usage_limit: null, is_active: true },
    { id: 403, name: 'Permanent/Partial Disability', type: 'Monetary', amount: '200,000', usage_limit: null, is_active: true },
    { id: 404, name: 'Critical Illness Benefit', type: 'Monetary', amount: '250,000', usage_limit: null, is_active: true },
    { id: 405, name: 'Hospital Stay Benefit', type: 'Monetary', amount: '30,000', usage_limit: null, is_active: true },
    { id: 406, name: 'Hospital Admission Benefit', type: 'Monetary', amount: '2,000', usage_limit: null, is_active: true },
    { id: 407, name: 'Diagnostic Discount', type: 'Percentage', amount: '50%', usage_limit: null, is_active: true },
    { id: 408, name: '24/7 Online Doctor', type: 'Service', amount: 'Available', usage_limit: null, is_active: true },
    { id: 409, name: 'Other Medical Discount', type: 'Percentage', amount: '10-50%', usage_limit: null, is_active: true },
  ],
  protyoy: [
    { id: 501, name: 'Life Support Benefit', type: 'Monetary', amount: '350,000', usage_limit: null, is_active: true },
    { id: 502, name: 'Accidental Benefit', type: 'Monetary', amount: '700,000', usage_limit: null, is_active: true },
    { id: 503, name: 'Permanent/Partial Disability', type: 'Monetary', amount: '250,000', usage_limit: null, is_active: true },
    { id: 504, name: 'Critical Illness Benefit', type: 'Monetary', amount: '300,000', usage_limit: null, is_active: true },
    { id: 505, name: 'Hospital Stay Benefit', type: 'Monetary', amount: '50,000', usage_limit: null, is_active: true },
    { id: 506, name: 'Hospital Admission Benefit', type: 'Monetary', amount: '5,000', usage_limit: null, is_active: true },
    { id: 507, name: 'Diagnostic Discount', type: 'Percentage', amount: '50%', usage_limit: null, is_active: true },
    { id: 508, name: '24/7 Online Doctor', type: 'Service', amount: 'Available', usage_limit: null, is_active: true },
    { id: 509, name: 'Other Medical Discount', type: 'Percentage', amount: '10-50%', usage_limit: null, is_active: true },
  ],
};

export const INITIAL_HEALTH_PLANS: HealthPlan[] = [
  {
    id: 1,
    name: 'Sohay',
    code: 'sohay',
    description: 'BelleVie Health Protection Plan',
    price: 150,
    annual_fee: 1800,
    duration_days: 365,
    terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
    is_published: true,
    is_active: true,
    display_order: 1,
    members_count: 320,
    benefits: DEFAULT_PLAN_BENEFITS.sohay
  },
  {
    id: 2,
    name: 'Nirvor',
    code: 'nirvor',
    description: 'BelleVie Health Protection Plan',
    price: 175,
    annual_fee: 2100,
    duration_days: 365,
    terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
    is_published: true,
    is_active: true,
    display_order: 2,
    members_count: 280,
    benefits: DEFAULT_PLAN_BENEFITS.nirvor
  },
  {
    id: 3,
    name: 'Swosti',
    code: 'swosti',
    description: 'BelleVie Health Protection Plan',
    price: 230,
    annual_fee: 2760,
    duration_days: 365,
    terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
    is_published: true,
    is_active: true,
    display_order: 3,
    members_count: 250,
    benefits: DEFAULT_PLAN_BENEFITS.swosti
  },
  {
    id: 4,
    name: 'Asha',
    code: 'asha',
    description: 'BelleVie Health Protection Plan',
    price: 380,
    annual_fee: 4560,
    duration_days: 365,
    terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
    is_published: true,
    is_active: true,
    display_order: 4,
    members_count: 210,
    benefits: DEFAULT_PLAN_BENEFITS.asha
  },
  {
    id: 5,
    name: 'Protyoy',
    code: 'protyoy',
    description: 'BelleVie Health Protection Plan',
    price: 520,
    annual_fee: 6240,
    duration_days: 365,
    terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
    is_published: true,
    is_active: true,
    display_order: 5,
    members_count: 190,
    benefits: DEFAULT_PLAN_BENEFITS.protyoy
  }
];

export const INITIAL_SUBSCRIPTIONS: PlanSubscription[] = [];

// Helper for local storage state
const STORAGE_KEY_PLANS = 'bellevie_health_plans';
const STORAGE_KEY_SUBSCRIPTIONS = 'bellevie_health_subscriptions';

function getStoredPlans(): HealthPlan[] {
  if (typeof window === 'undefined') return INITIAL_HEALTH_PLANS;
  try {
    const data = localStorage.getItem(STORAGE_KEY_PLANS);
    if (!data) return INITIAL_HEALTH_PLANS;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_HEALTH_PLANS;
  } catch {
    return INITIAL_HEALTH_PLANS;
  }
}

function saveStoredPlans(plans: HealthPlan[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
  } catch (err) {
    console.error('Failed to save plans:', err);
  }
}

function getStoredSubscriptions(): PlanSubscription[] {
  if (typeof window === 'undefined') return INITIAL_SUBSCRIPTIONS;
  try {
    const data = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    if (!data) return INITIAL_SUBSCRIPTIONS;
    return JSON.parse(data);
  } catch {
    return INITIAL_SUBSCRIPTIONS;
  }
}

function saveStoredSubscriptions(subs: PlanSubscription[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
  } catch (err) {
    console.error('Failed to save subscriptions:', err);
  }
}

// -------------------------------------------------------------
// API / MOCK FUNCTIONS
// -------------------------------------------------------------

export async function fetchHealthPlans(): Promise<HealthPlan[]> {
  try {
    const rawRes: any = await apiFetch('/api/health-plans/plans/');
    const plans = Array.isArray(rawRes) ? rawRes : (rawRes && Array.isArray(rawRes.results) ? rawRes.results : null);
    if (plans !== null && plans.length > 0) {
      const mapped = plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code || p.name.toLowerCase().replace(/\s+/g, ''),
        description: p.description || '',
        price: parseFloat(p.monthly_price || p.price) || 0,
        annual_fee: parseFloat(p.annual_price) || (parseFloat(p.monthly_price || p.price) || 0) * 12,
        duration_days: p.duration_days || 365,
        terms: p.terms || '',
        is_published: p.is_published,
        is_active: p.is_active,
        display_order: p.display_order || p.id,
        members_count: p.members_count || 0,
        benefits: (p.benefits && p.benefits.length > 0)
          ? p.benefits.map((b: any) => {
              const bType = String(b.benefit_type || b.type || '').toUpperCase();
              let formattedType: 'Monetary' | 'Percentage' | 'Service' | 'Limit' = 'Monetary';
              if (bType === 'PERCENTAGE') formattedType = 'Percentage';
              else if (bType === 'SERVICE') formattedType = 'Service';
              else if (bType === 'LIMIT' || bType === 'TEXT') formattedType = 'Limit';
              return {
                id: b.id,
                plan: b.plan || p.id,
                name: b.name,
                type: formattedType,
                amount: b.amount || '-',
                usage_limit: b.usage_limit ?? null,
                is_active: b.is_active ?? b.is_available ?? true,
                description: b.description || '',
              };
            })
          : (DEFAULT_PLAN_BENEFITS[(p.code || p.name).toLowerCase()] || []),
      }));
      saveStoredPlans(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Backend API fetch error for health plans:', err);
  }
  return getStoredPlans();
}

export async function saveHealthPlan(plan: Partial<HealthPlan>): Promise<HealthPlan> {
  const plans = getStoredPlans();

  const formattedBenefits = plan.benefits ? plan.benefits.map(b => ({
    ...(b.id && typeof b.id === 'number' && b.id < 1000000 ? { id: b.id } : {}),
    name: b.name,
    description: b.description || '',
    benefit_type: b.type === 'Percentage' ? 'PERCENTAGE' : b.type === 'Service' ? 'SERVICE' : b.type === 'Limit' ? 'TEXT' : 'MONETARY',
    amount: b.amount || '-',
    usage_limit: b.usage_limit ?? null,
    is_available: b.is_active ?? true,
    is_active: b.is_active ?? true,
  })) : undefined;

  try {
    if (plan.id && typeof plan.id === 'number' && plan.id < 1000000) {
      const updated = await apiFetch<any>(`/api/health-plans/plans/${plan.id}/`, {
        method: 'PUT',
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          price: plan.price,
          monthly_price: plan.price,
          annual_price: plan.annual_fee || (plan.price || 0) * 12,
          duration_days: plan.duration_days || 365,
          terms: plan.terms,
          is_published: plan.is_published,
          is_active: plan.is_active,
          ...(formattedBenefits ? { benefits: formattedBenefits } : {}),
        }),
      });
      if (updated && updated.id) {
        const formatted: HealthPlan = {
          id: updated.id,
          name: updated.name || plan.name || 'Plan',
          code: updated.code || (plan.name || '').toLowerCase().replace(/\s+/g, ''),
          description: updated.description || plan.description || '',
          price: parseFloat(updated.monthly_price || updated.price) || plan.price || 0,
          annual_fee: parseFloat(updated.annual_price) || (parseFloat(updated.monthly_price || updated.price) || 0) * 12,
          duration_days: updated.duration_days || plan.duration_days || 365,
          terms: updated.terms || plan.terms || '',
          is_published: updated.is_published ?? true,
          is_active: updated.is_active ?? true,
          display_order: updated.display_order || 1,
          members_count: updated.members_count || 0,
          benefits: updated.benefits ? updated.benefits.map((b: any) => ({
            id: b.id,
            plan: updated.id,
            name: b.name,
            type: b.benefit_type === 'PERCENTAGE' ? 'Percentage' : b.benefit_type === 'SERVICE' ? 'Service' : 'Monetary',
            amount: b.amount || '-',
            usage_limit: b.usage_limit,
            is_active: b.is_active,
            description: b.description,
          })) : (plan.benefits || DEFAULT_PLAN_BENEFITS[(plan.name || '').toLowerCase()] || [])
        };
        const idx = plans.findIndex(p => p.id === plan.id);
        if (idx !== -1) plans[idx] = formatted;
        else plans.push(formatted);
        saveStoredPlans(plans);
        return formatted;
      }
    } else {
      const created = await apiFetch<any>('/api/health-plans/plans/', {
        method: 'POST',
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          price: plan.price,
          monthly_price: plan.price,
          annual_price: plan.annual_fee || (plan.price || 0) * 12,
          duration_days: plan.duration_days || 365,
          terms: plan.terms,
          is_published: plan.is_published ?? true,
          is_active: plan.is_active ?? true,
          ...(formattedBenefits ? { benefits: formattedBenefits } : {}),
        }),
      });
      if (created && created.id) {
        const formatted: HealthPlan = {
          id: created.id,
          name: created.name || plan.name || 'Plan',
          code: created.code || (plan.name || '').toLowerCase().replace(/\s+/g, ''),
          description: created.description || plan.description || '',
          price: parseFloat(created.monthly_price || created.price) || plan.price || 0,
          annual_fee: parseFloat(created.annual_price) || (parseFloat(created.monthly_price || created.price) || 0) * 12,
          duration_days: created.duration_days || plan.duration_days || 365,
          terms: created.terms || plan.terms || '',
          is_published: created.is_published ?? true,
          is_active: created.is_active ?? true,
          display_order: created.display_order || plans.length + 1,
          members_count: created.members_count || 0,
          benefits: created.benefits ? created.benefits.map((b: any) => ({
            id: b.id,
            plan: created.id,
            name: b.name,
            type: b.benefit_type === 'PERCENTAGE' ? 'Percentage' : b.benefit_type === 'SERVICE' ? 'Service' : 'Monetary',
            amount: b.amount || '-',
            usage_limit: b.usage_limit,
            is_active: b.is_active,
            description: b.description,
          })) : (plan.benefits || DEFAULT_PLAN_BENEFITS[(plan.name || '').toLowerCase()] || [])
        };
        plans.push(formatted);
        saveStoredPlans(plans);
        return formatted;
      }
    }
  } catch (err) {
    console.warn('Backend save failed, using local storage fallback for saveHealthPlan:', err);
  }

  if (plan.id) {
    const idx = plans.findIndex(p => p.id === plan.id);
    if (idx !== -1) {
      plans[idx] = { ...plans[idx], ...plan } as HealthPlan;
      saveStoredPlans(plans);
      return plans[idx];
    }
  }

  const newPlan: HealthPlan = {
    id: Date.now(),
    name: plan.name || 'New Plan',
    code: (plan.name || 'new').toLowerCase().replace(/\s+/g, ''),
    description: plan.description || '',
    price: plan.price || 0,
    annual_fee: plan.annual_fee || (plan.price || 0) * 12,
    duration_days: plan.duration_days || 365,
    terms: plan.terms || '',
    is_published: plan.is_published ?? true,
    is_active: plan.is_active ?? true,
    display_order: plans.length + 1,
    members_count: 0,
    benefits: plan.benefits || DEFAULT_PLAN_BENEFITS.sohay,
  };
  plans.push(newPlan);
  saveStoredPlans(plans);
  return newPlan;
}

export async function fetchSubscriptions(): Promise<PlanSubscription[]> {
  try {
    const rawRes: any = await apiFetch('/api/health-plans/subscriptions/');
    const subs = Array.isArray(rawRes) ? rawRes : (rawRes && Array.isArray(rawRes.results) ? rawRes.results : null);
    if (subs !== null) {
      return subs.map((s: any) => ({
        id: s.id,
        public_id: s.public_id || `sub-${s.id}`,
        member_id: s.member_code || `BV-000${s.member}`,
        member_name: s.member_name || `Member #${s.member}`,
        plan_id: s.plan,
        plan_name: s.plan_name || 'Health Plan',
        billing_cycle: s.billing_cycle || 'Annual',
        price: parseFloat(s.price) || 2760,
        centre_name: s.centre_name || 'Dhanmondi Centre',
        requested_by: s.requested_by_name || 'Centre User',
        date: s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '04 Oct 2026',
        status: s.status as SubscriptionStatus,
        notes: s.notes,
        hq_notes: s.hq_notes,
      }));
    }
  } catch (err) {
    // API fallback to mock data
  }
  return [];
}

export async function createSubscription(req: {
  member_name: string;
  member_id: string;
  member_db_id?: number;
  plan_id: number;
  plan_name: string;
  billing_cycle: 'Monthly' | 'Annual';
  price: number;
  notes?: string;
}): Promise<PlanSubscription> {
  try {
    const memberIdInt = req.member_db_id || parseInt(req.member_id) || 1;
    const created = await apiFetch<any>('/api/health-plans/subscriptions/', {
      method: 'POST',
      body: JSON.stringify({
        member: memberIdInt,
        plan: req.plan_id,
        billing_cycle: req.billing_cycle === 'Monthly' ? 'MONTHLY' : 'ANNUAL',
        notes: req.notes || '',
      }),
    });
    if (created && created.id) {
      return {
        id: created.id,
        public_id: created.public_id || `sub-${created.id}`,
        member_id: created.member_code || req.member_id,
        member_name: created.member_name || req.member_name,
        plan_id: created.plan,
        plan_name: created.plan_name || req.plan_name,
        billing_cycle: created.billing_cycle === 'MONTHLY' ? 'Monthly' : 'Annual',
        price: parseFloat(created.price) || req.price,
        centre_name: created.centre_name || 'Network Centre',
        requested_by: created.requested_by_name || 'Centre User',
        date: created.created_at ? new Date(created.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
        status: created.status || 'PENDING',
        notes: created.notes,
        hq_notes: created.hq_notes,
      };
    }
  } catch (err) {
    console.error('API createSubscription error:', err);
    throw err;
  }
  throw new Error('Failed to create subscription on server');
}

export async function updateSubscriptionStatus(
  id: number,
  status: SubscriptionStatus,
  hq_notes?: string
): Promise<PlanSubscription> {
  try {
    let actionName = 'activate';
    if (status === 'REJECTED') actionName = 'reject';
    if (status === 'CANCELLED') actionName = 'cancel';

    const res = await apiFetch<any>(`/api/health-plans/subscriptions/${id}/${actionName}/`, {
      method: 'POST',
      body: JSON.stringify({ hq_notes: hq_notes || '' }),
    });
    if (res && res.id) {
      return res;
    }
  } catch (err) {
    // API fallback
  }

  const subs = getStoredSubscriptions();
  const idx = subs.findIndex(s => s.id === id);
  if (idx !== -1) {
    subs[idx].status = status;
    if (hq_notes) subs[idx].hq_notes = hq_notes;
    saveStoredSubscriptions(subs);
    return subs[idx];
  }
  throw new Error('Subscription not found');
}
