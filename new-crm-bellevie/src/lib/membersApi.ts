import { apiFetch } from './api';

export interface ApiMember {
  id: number;
  public_id: string;
  full_name: string;
  phone: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | string;
  date_of_birth?: string | null;
  blood_group?: string | null;
  address?: string | null;
  registered_by?: number | null;
  registered_by_name?: string | null;
  registered_centre?: number | null;
  registered_centre_name?: string | null;
  assigned_centre?: number | null;
  assigned_centre_name?: string | null;
  partner?: number | null;
  partner_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface NetworkCentre {
  id: number;
  public_id: string;
  name: string;
  region?: number;
  user?: number;
  username?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at?: string;
}

export interface NetworkPartner {
  id: number;
  public_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  centre?: number | null;
  created_by?: number;
  is_active: boolean;
  created_at?: string;
}

export interface FamilyMemberApi {
  id: number;
  member: number;
  full_name: string;
  relationship: string;
  phone: string;
  date_of_birth?: string | null;
  created_at?: string;
}

export interface TransferHistoryRecord {
  id: number;
  member: number;
  previous_centre: number | null;
  new_centre: number | null;
  transferred_by: number;
  reason: string;
  transferred_at: string;
}

// 1. Members Dashboard Metrics APIs
export async function getMembersMetrics() {
  try {
    const [totalRes, activeRes, inactiveRes, totalCentresRes] = await Promise.all([
      apiFetch<PaginatedResponse<ApiMember>>('/api/members/'),
      apiFetch<PaginatedResponse<ApiMember>>('/api/members/?is_active=true'),
      apiFetch<PaginatedResponse<ApiMember>>('/api/members/?is_active=false'),
      apiFetch<PaginatedResponse<NetworkCentre> | NetworkCentre[]>('/api/network/centres/'),
    ]);

    const totalMembers = totalRes?.count ?? (Array.isArray(totalRes?.results) ? totalRes.results.length : 0);
    const activeMembers = activeRes?.count ?? (Array.isArray(activeRes?.results) ? activeRes.results.length : 0);
    const inactiveMembers = inactiveRes?.count ?? (Array.isArray(inactiveRes?.results) ? inactiveRes.results.length : 0);

    let totalCentres = 0;
    if (Array.isArray(totalCentresRes)) {
      totalCentres = totalCentresRes.length;
    } else if (totalCentresRes && 'count' in totalCentresRes) {
      totalCentres = totalCentresRes.count;
    }

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      totalCentres,
    };
  } catch (err) {
    console.warn('Failed to fetch real member metrics, returning fallbacks', err);
    return null;
  }
}

// 2. Fetch Members List with Search, Filter & Pagination
export async function fetchMembersList(params?: {
  search?: string;
  is_active?: boolean;
  assigned_centre?: string | number;
  gender?: string;
  ordering?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
  if (params?.assigned_centre) query.append('assigned_centre', String(params.assigned_centre));
  if (params?.gender) query.append('gender', params.gender.toUpperCase());
  if (params?.ordering) query.append('ordering', params.ordering);
  if (params?.page) query.append('page', String(params.page));

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<PaginatedResponse<ApiMember> | ApiMember[]>(`/api/members/${queryString}`);
}

// 3. Dropdowns
export async function fetchCentresList() {
  return apiFetch<PaginatedResponse<NetworkCentre> | NetworkCentre[]>('/api/network/centres/?is_active=true');
}

export async function fetchPartnersList(centreId?: number | string) {
  const param = centreId ? `?centre=${centreId}&is_active=true` : '?is_active=true';
  return apiFetch<PaginatedResponse<NetworkPartner> | NetworkPartner[]>(`/api/network/partners/${param}`);
}

// 3.3 Register Member
export async function registerMemberApi(data: {
  full_name: string;
  phone: string;
  email?: string;
  gender: string;
  date_of_birth?: string;
  blood_group?: string;
  address?: string;
  assigned_centre?: number | null;
  partner?: number | null;
  is_active?: boolean;
}) {

  return apiFetch<ApiMember>('/api/members/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 4. Details, Edit, Status
export async function getMemberDetailsApi(id: number) {
  return apiFetch<ApiMember>(`/api/members/${id}/`);
}

export async function updateMemberApi(id: number, data: Partial<ApiMember>) {
  return apiFetch<ApiMember>(`/api/members/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function toggleMemberStatusApi(id: number, isActive: boolean) {
  return apiFetch<ApiMember>(`/api/members/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive }),
  });
}

// 5. Family Members
export async function fetchFamilyMembersApi(memberId: number) {
  return apiFetch<PaginatedResponse<FamilyMemberApi> | FamilyMemberApi[]>(`/api/families/?member=${memberId}`);
}

export async function addFamilyMemberApi(data: {
  member: number;
  full_name: string;
  relationship: string;
  phone: string;
  date_of_birth?: string;
}) {
  return apiFetch<FamilyMemberApi>('/api/families/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteFamilyMemberApi(id: number) {
  return apiFetch<void>(`/api/families/${id}/`, {
    method: 'DELETE',
  });
}

// 6. Member Transfer (HQ Admin Only)
export async function transferMemberApi(id: number, newCentreId: number | null, reason: string) {
  const payload: Record<string, any> = {
    reason: reason || 'Transferred by HQ Admin',
  };
  if (newCentreId !== null) {
    payload.new_centre = newCentreId;
    payload.assigned_centre = newCentreId;
    payload.new_centre_id = newCentreId;
  } else {
    payload.new_centre = null;
    payload.assigned_centre = null;
  }

  return apiFetch<{ message: string; member_id: number; previous_centre: number; new_centre: number }>(
    `/api/members/${id}/transfer/`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function fetchTransferHistoryApi(memberId: number) {
  return apiFetch<TransferHistoryRecord[]>(`/api/members/${memberId}/transfer-history/`);
}
