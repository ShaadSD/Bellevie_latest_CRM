import { apiFetch } from './api';
import { fetchMembersList, ApiMember } from './membersApi';
import { MemberOption, mockMembers } from '@/data/financeData';

export interface ApiInvoice {
  id: number;
  invoice_number: string;
  member_name: string;
  member_id_code: string;
  network_centre: string;
  service_name: string;
  service_amount: string | number;
  paid_amount: string | number;
  due_amount: string | number;
  status: string;
  note?: string;
  created_at: string;
}

export interface ApiPayment {
  id: number;
  payment_number: string;
  invoice: number;
  invoice_number?: string;
  service_name?: string;
  invoice_note?: string;
  member_name: string;
  network_centre: string;
  amount: string | number;
  method: string;
  transaction_ref: string;
  status: string;
  notes?: string;
  has_agreement?: boolean;
  agreement_id?: number | string;
  rejection_reason?: string;
  rejection_note?: string;
  verification_note?: string;
  member_id_code?: string;
  member_phone?: string;
  invoice_date?: string;
  invoice_status?: string;
  created_at: string;
}

export interface ApiAsPerAgreement {
  id: number;
  agreement_id: string;
  invoice: number;
  invoice_number?: string;
  member_name: string;
  network_centre: string;
  service_name: string;
  service_amount: string | number;
  verified_payment: string | number;
  agreement_rate?: string | number;
  as_per_agreement_amount: string | number;
  status: string;
  reference_code?: string;
  agreement_reference?: string;
  hq_note?: string;
  rejection_reason?: string;
  payout_method?: string;
  payout_transaction_ref?: string;
  payment_method?: string;
  payment_transaction_reference?: string;
  payment_note?: string;
  payout_date?: string;
  paid_at?: string;
  created_at: string;
}

export interface ApiRefundRequest {
  id: number;
  refund_id: string;
  invoice: number;
  invoice_number?: string;
  member_name: string;
  network_centre: string;
  claimed_amount: string | number;
  reason?: string;
  status: string;
  created_at: string;
}

export async function fetchInvoices(networkCentre?: string): Promise<ApiInvoice[]> {
  try {
    const endpoint = networkCentre
      ? `api/finance/invoices/?network_centre=${encodeURIComponent(networkCentre)}`
      : 'api/finance/invoices/';
    const res = await apiFetch<any>(endpoint);
    return Array.isArray(res) ? res : (res?.results || []);
  } catch (err) {
    console.warn('[financeApi] Using fallback for fetchInvoices:', err);
    return [];
  }
}

export async function createInvoice(data: {
  member_name: string;
  member_id_code?: string;
  network_centre: string;
  service_name: string;
  service_amount: number;
  note?: string;
}): Promise<ApiInvoice | null> {
  try {
    return await apiFetch<ApiInvoice>('api/finance/invoices/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[financeApi] Error creating invoice:', err);
    return null;
  }
}

export async function fetchPayments(networkCentre?: string, statusFilter?: string): Promise<ApiPayment[]> {
  try {
    const params = new URLSearchParams();
    if (networkCentre) params.append('network_centre', networkCentre);
    if (statusFilter) params.append('status', statusFilter);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch<any>(`api/finance/payments/${queryString}`);
    return Array.isArray(res) ? res : (res?.results || []);
  } catch (err) {
    console.warn('[financeApi] Using fallback for fetchPayments:', err);
    return [];
  }
}

export async function recordPayment(data: {
  invoice: number;
  amount: number;
  method: string;
  transaction_ref: string;
}): Promise<ApiPayment | null> {
  try {
    return await apiFetch<ApiPayment>('api/finance/payments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[financeApi] Error recording payment:', err);
    return null;
  }
}

export async function verifyPaymentApi(paymentId: number, verification_note?: string): Promise<any> {
  try {
    return await apiFetch(`api/finance/payments/${paymentId}/verify/`, {
      method: 'POST',
      body: JSON.stringify({ verification_note }),
    });
  } catch (err) {
    console.error('[financeApi] Error verifying payment:', err);
    return null;
  }
}

export async function rejectPaymentApi(paymentId: number, reason: string, note?: string): Promise<any> {
  try {
    return await apiFetch(`api/finance/payments/${paymentId}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason, note }),
    });
  } catch (err) {
    console.error('[financeApi] Error rejecting payment:', err);
    return null;
  }
}

export async function fetchAsPerAgreement(networkCentre?: string, statusFilter?: string): Promise<ApiAsPerAgreement[]> {
  try {
    const params = new URLSearchParams();
    if (networkCentre) params.append('network_centre', networkCentre);
    if (statusFilter) params.append('status', statusFilter);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch<any>(`api/finance/as-per-agreement/${queryString}`);
    return Array.isArray(res) ? res : (res?.results || []);
  } catch (err) {
    console.warn('[financeApi] Using fallback for fetchAsPerAgreement:', err);
    return [];
  }
}

export async function createAsPerAgreementApi(data: {
  payment: number;
  agreement_rate: number;
  agreement_reference?: string;
  hq_note?: string;
}): Promise<ApiAsPerAgreement | null> {
  try {
    return await apiFetch<ApiAsPerAgreement>('api/finance/as-per-agreement/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[financeApi] Error creating agreement:', err);
    return null;
  }
}

export async function approveAsPerAgreementApi(agreementId: number, hq_note?: string): Promise<any> {
  try {
    return await apiFetch(`api/finance/as-per-agreement/${agreementId}/approve/`, {
      method: 'POST',
      body: JSON.stringify({ hq_note }),
    });
  } catch (err) {
    console.error('[financeApi] Error approving agreement:', err);
    return null;
  }
}

export async function rejectAsPerAgreementApi(agreementId: number, rejection_reason?: string): Promise<any> {
  try {
    return await apiFetch(`api/finance/as-per-agreement/${agreementId}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason }),
    });
  } catch (err) {
    console.error('[financeApi] Error rejecting agreement:', err);
    return null;
  }
}

export async function payAsPerAgreementApi(
  agreementId: number,
  data: {
    payment_method: string;
    transaction_reference: string;
    payment_note?: string;
  }
): Promise<any> {
  try {
    return await apiFetch(`api/finance/as-per-agreement/${agreementId}/pay/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[financeApi] Error paying agreement:', err);
    return null;
  }
}

export async function reviewAsPerAgreementApi(agreementId: number, actionType: 'approve' | 'reject', hq_note?: string): Promise<any> {
  try {
    return await apiFetch(`api/finance/as-per-agreement/${agreementId}/review/`, {
      method: 'POST',
      body: JSON.stringify({ action: actionType, hq_note }),
    });
  } catch (err) {
    console.error('[financeApi] Error reviewing agreement:', err);
    return null;
  }
}

export async function makePaymentAsPerAgreementApi(
  agreementId: number,
  data: {
    payout_method: string;
    payout_transaction_ref: string;
    payout_date?: string;
    note?: string;
  }
): Promise<any> {
  try {
    return await apiFetch(`api/finance/as-per-agreement/${agreementId}/make_payment/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[financeApi] Error making payout:', err);
    return null;
  }
}

export async function fetchFinanceOverviewMetrics(networkCentre?: string): Promise<any> {
  try {
    const endpoint = networkCentre
      ? `api/finance/overview-metrics/?network_centre=${encodeURIComponent(networkCentre)}`
      : 'api/finance/overview-metrics/';
    return await apiFetch<any>(endpoint);
  } catch (err) {
    console.warn('[financeApi] Using fallback metrics:', err);
    return null;
  }
}

export async function fetchMemberOptions(): Promise<MemberOption[]> {
  try {
    const res = await fetchMembersList();
    const list: ApiMember[] = Array.isArray(res) ? res : (res?.results || []);
    if (list && list.length > 0) {
      return list.map((m) => {
        const mId = m.public_id
          ? (m.public_id.length > 15 ? `MEM-${m.id.toString().padStart(5, '0')}` : m.public_id)
          : `MEM-${m.id.toString().padStart(5, '0')}`;
        const memberCentre = m.assigned_centre_name || m.registered_centre_name || '';
        return {
          id: String(m.id),
          memberId: mId,
          name: m.full_name,
          phone: m.phone || 'N/A',
          plan: memberCentre ? `${memberCentre} Member` : 'Basic Health Plan',
          centre: memberCentre,
        };
      });
    }
  } catch (err) {
    console.warn('[financeApi] Error fetching members from API:', err);
  }
  return [];
}

export interface ReceiptSetting {
  id?: number;
  company_name: string;
  sub_title: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  signatory_title: string;
  signatory_org: string;
  footer_slogan_title: string;
  footer_slogan_subtitle: string;
  footer_thank_you: string;
  footer_thank_you_bold: string;
  updated_at?: string;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSetting = {
  company_name: 'BelleVie',
  sub_title: 'GLOBAL HEALTH',
  tagline: 'CARE BEYOND BORDERS',
  phone: '+880 1234 567890',
  email: 'info@bellevieglobalhealth.com',
  website: 'www.bellevieglobalhealth.com',
  signatory_title: 'Authorized Signatory',
  signatory_org: 'BelleVie Global Health',
  footer_slogan_title: 'Healthy People',
  footer_slogan_subtitle: 'Brighter Tomorrow',
  footer_thank_you: 'Thank you for choosing',
  footer_thank_you_bold: 'BelleVie Global Health',
};

export async function fetchReceiptSettings(): Promise<ReceiptSetting> {
  try {
    const res = await apiFetch<ReceiptSetting>('api/finance/receipt-settings/');
    if (res && res.company_name) return res;
  } catch (err) {
    console.warn('[financeApi] Fallback for receipt settings:', err);
  }
  return DEFAULT_RECEIPT_SETTINGS;
}

export async function updateReceiptSettings(data: Partial<ReceiptSetting>): Promise<ReceiptSetting | null> {
  try {
    return await apiFetch<ReceiptSetting>('api/finance/receipt-settings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[financeApi] Error updating receipt settings:', err);
    return null;
  }
}

