export interface HqFinanceMetrics {
  totalInvoices: number;
  totalInvoicesChange: string;
  pendingPayments: number;
  pendingPaymentsChange: string;
  pendingRefunds: number;
  pendingRefundsChange: string;
  asPerAgreementPendingCount: number;
  asPerAgreementPayableAmount: number;
  asPerAgreementPaidCount: number;
}

export interface NcFinanceMetrics {
  myInvoices: number;
  myInvoicesChange: string;
  outstandingAmount: number;
  outstandingAmountChange: string;
  myPaymentsPending: number;
  asPerAgreementPaidAmount: number;
}

export interface PendingPaymentVerification {
  id: string;
  paymentId: string;
  invoiceId: string;
  member: string;
  centre: string;
  service?: string;
  amount: number;
  method: 'bKash' | 'Bank' | 'Nagad' | 'Cash';
  date: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  transactionRef: string;
  collectedBy?: string;
  notes?: string;
  proofUrl?: string;
  rejectionReason?: string;
  hasAgreement?: boolean;
  agreementId?: string;
  memberIdCode?: string;
  memberPhone?: string;
  invoiceDate?: string;
  invoiceStatus?: string;
}

export interface AsPerAgreementItem {
  id: string;
  agreementId: string;
  paymentId?: number | string;
  invoiceId: string;
  member: string;
  centre: string;
  service: string;
  serviceAmount: number;
  verifiedPayment: number;
  agreementRate?: number;
  asPerAgreementAmount: number;
  status: 'PENDING' | 'PAYABLE' | 'PAID' | 'REJECTED';
  reference?: string;
  agreementReference?: string;
  hqNote?: string;
  rejectionReason?: string;
  paymentMethod?: string;
  paymentTransactionRef?: string;
  paymentNote?: string;
  date: string;
  payoutDate?: string;
  actionNote?: string;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  member: string;
  centre?: string;
  service?: string;
  total: number;
  paid: number;
  due: number;
  status: 'PARTIAL' | 'PAID' | 'ISSUED' | 'CANCELLED';
  date: string;
}

export interface RecentPayment {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  member: string;
  centre?: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  date?: string;
}

export interface MemberOption {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  plan: string;
  avatar?: string;
  centre?: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  category: string;
  price: number;
  checked?: boolean;
}

export const initialHqMetrics: HqFinanceMetrics = {
  totalInvoices: 0,
  totalInvoicesChange: '0%',
  pendingPayments: 0,
  pendingPaymentsChange: '0%',
  pendingRefunds: 0,
  pendingRefundsChange: '0%',
  asPerAgreementPendingCount: 0,
  asPerAgreementPayableAmount: 0,
  asPerAgreementPaidCount: 0,
};

export const initialNcMetrics: NcFinanceMetrics = {
  myInvoices: 0,
  myInvoicesChange: '0%',
  outstandingAmount: 0,
  outstandingAmountChange: '0%',
  myPaymentsPending: 0,
  asPerAgreementPaidAmount: 0,
};

export const initialPendingPayments: PendingPaymentVerification[] = [];

export const initialAsPerAgreementItems: AsPerAgreementItem[] = [];

export const initialAsPerAgreementPayables: AsPerAgreementItem[] = [];

export const initialHqRecentInvoices: RecentInvoice[] = [];

export const initialNcRecentInvoices: RecentInvoice[] = [];

export const initialRecentPayments: RecentPayment[] = [];

export const mockMembers: MemberOption[] = [];

export const mockServices: ServiceOption[] = [];
