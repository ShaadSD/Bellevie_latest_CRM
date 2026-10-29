import { apiFetch } from './api';

export interface ApiNotification {
  id: number;
  notification_id: string;
  title: string;
  message: string;
  category: 'Operations' | 'Finance' | 'Policy' | 'Clinical' | 'Emergency';
  priority: 'General' | 'Action Required' | 'Urgent' | 'Policy Update';
  target_scope: 'ALL' | 'SPECIFIC';
  target_centres: string[];
  sender: string;
  action_url?: string;
  action_label?: string;
  is_active: boolean;
  created_at: string;
  read_receipts?: Array<{ network_centre: string; read_at: string }>;
  read_count?: number;
  total_recipients?: number;
  is_read?: boolean;
}

export async function fetchNotificationsApi(params?: {
  network_centre?: string;
  priority?: string;
  category?: string;
  search?: string;
}): Promise<ApiNotification[]> {
  try {
    const query = new URLSearchParams();
    if (params?.network_centre) query.append('network_centre', params.network_centre);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `api/notifications/broadcasts/?${queryString}` : 'api/notifications/broadcasts/';
    
    const response = await apiFetch<any>(endpoint);
    return Array.isArray(response) ? response : (response?.results || []);
  } catch (err) {
    console.warn('[notificationsApi] Error fetching notifications:', err);
    return [];
  }
}

export async function createBroadcastNotificationApi(data: {
  title: string;
  message: string;
  category: string;
  priority: string;
  target_scope: 'ALL' | 'SPECIFIC';
  target_centres: string[];
  sender?: string;
  action_url?: string;
  action_label?: string;
}): Promise<ApiNotification | null> {
  try {
    return await apiFetch<ApiNotification>('api/notifications/broadcasts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[notificationsApi] Error creating broadcast:', err);
    return null;
  }
}

export async function markNotificationReadApi(
  id: number,
  networkCentre: string = 'Dhaka Central Hub'
): Promise<boolean> {
  try {
    await apiFetch(`api/notifications/broadcasts/${id}/mark_read/`, {
      method: 'POST',
      body: JSON.stringify({ network_centre: networkCentre }),
    });
    return true;
  } catch (err) {
    console.error('[notificationsApi] Error marking notification read:', err);
    return false;
  }
}

export async function fetchNotificationMetricsApi(): Promise<any> {
  try {
    return await apiFetch<any>('api/notifications/metrics/');
  } catch (err) {
    console.warn('[notificationsApi] Error fetching metrics:', err);
    return null;
  }
}
