import { apiFetch } from './api';

export interface Region {
  id: number;
  name: string;
  description?: string;
}

export interface NetworkCentre {
  id: number;
  public_id: string;
  name: string;
  region: number;
  user?: number;
  username?: string;
  user_role?: string;
  address: string;
  phone: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

export interface NetworkCentreCreateData {
  name: string;
  region: number;
  address: string;
  phone: string;
  email?: string;
  username: string;
  password?: string;
  is_active?: boolean;
}

export interface Partner {
  id: number;
  public_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  centre?: number | null;
  centre_name?: string;
  created_by?: number;
  created_by_username?: string;
  is_active: boolean;
  created_at: string;
}

export interface PartnerCreateData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  centre?: number | null;
  is_active?: boolean;
}

export interface HealthRepresentative {
  id: number;
  public_id: string;
  name: string;
  phone: string;
  email?: string;
  centre?: number | null;
  centre_name?: string;
  created_by?: number;
  created_by_username?: string;
  is_active: boolean;
  created_at: string;
}

export interface HealthRepresentativeCreateData {
  name: string;
  phone: string;
  email?: string;
  centre?: number | null;
  is_active?: boolean;
}

// ==========================================
// REGIONS API
// ==========================================
export async function getRegions(): Promise<Region[]> {
  try {
    const data = await apiFetch<Region[] | { results: Region[] }>('/api/network/regions/');
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.error('Failed to fetch regions from API:', err);
    return [];
  }
}

// ==========================================
// NETWORK CENTRES API
// ==========================================
export async function getNetworkCentres(params?: {
  search?: string;
  region?: number;
  is_active?: boolean;
}): Promise<NetworkCentre[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.region) queryParams.append('region', params.region.toString());
  if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/network/centres/${queryString ? `?${queryString}` : ''}`;

  try {
    const data = await apiFetch<NetworkCentre[] | { results: NetworkCentre[] }>(endpoint);
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.warn('Failed to fetch network centres API, using fallback data:', err);
    return [];
  }
}

export async function createNetworkCentre(centreData: NetworkCentreCreateData): Promise<NetworkCentre> {
  return await apiFetch<NetworkCentre>('/api/network/centres/', {
    method: 'POST',
    body: JSON.stringify(centreData),
  });
}

export async function updateNetworkCentre(id: number, centreData: Partial<NetworkCentreCreateData>): Promise<NetworkCentre> {
  return await apiFetch<NetworkCentre>(`/api/network/centres/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(centreData),
  });
}

// ==========================================
// PARTNERS API
// ==========================================
export async function getPartners(params?: {
  search?: string;
  centre?: number | string;
  is_active?: boolean;
}): Promise<Partner[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.centre) queryParams.append('centre', params.centre.toString());
  if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/network/partners/${queryString ? `?${queryString}` : ''}`;

  try {
    const data = await apiFetch<Partner[] | { results: Partner[] }>(endpoint);
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.warn('Failed to fetch partners API:', err);
    return [];
  }
}

export async function createPartner(partnerData: PartnerCreateData): Promise<Partner> {
  return await apiFetch<Partner>('/api/network/partners/', {
    method: 'POST',
    body: JSON.stringify(partnerData),
  });
}

export async function updatePartner(id: number, partnerData: Partial<PartnerCreateData>): Promise<Partner> {
  return await apiFetch<Partner>(`/api/network/partners/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(partnerData),
  });
}

// ==========================================
// HEALTH REPRESENTATIVES API
// ==========================================
export async function getRepresentatives(params?: {
  search?: string;
  centre?: number | string;
  is_active?: boolean;
}): Promise<HealthRepresentative[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.centre) queryParams.append('centre', params.centre.toString());
  if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/network/representatives/${queryString ? `?${queryString}` : ''}`;

  try {
    const data = await apiFetch<HealthRepresentative[] | { results: HealthRepresentative[] }>(endpoint);
    return Array.isArray(data) ? data : data.results || [];
  } catch (err) {
    console.warn('Failed to fetch representatives API:', err);
    return [];
  }
}

export async function createRepresentative(repData: HealthRepresentativeCreateData): Promise<HealthRepresentative> {
  return await apiFetch<HealthRepresentative>('/api/network/representatives/', {
    method: 'POST',
    body: JSON.stringify(repData),
  });
}

export async function updateRepresentative(id: number, repData: Partial<HealthRepresentativeCreateData>): Promise<HealthRepresentative> {
  return await apiFetch<HealthRepresentative>(`/api/network/representatives/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(repData),
  });
}
