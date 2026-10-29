'use client';

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  RefreshCw,
  Wallet,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  X,
  Building,
  User,
  CreditCard,
  Tag,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  FileCheck,
  CheckCircle,
  CheckSquare,
  Square,
  ArrowRight,
  Sliders
} from 'lucide-react';
import {
  HqFinanceMetrics,
  PendingPaymentVerification,
  AsPerAgreementItem,
  RecentInvoice,
  RecentPayment,
  MemberOption,
  ServiceOption,
  initialHqMetrics,
  initialPendingPayments,
  initialAsPerAgreementItems,
  initialAsPerAgreementPayables,
  initialHqRecentInvoices,
  initialRecentPayments,
  mockMembers,
  mockServices
} from '@/data/financeData';
import {
  fetchInvoices,
  fetchPayments,
  fetchAsPerAgreement,
  verifyPaymentApi,
  rejectPaymentApi,
  reviewAsPerAgreementApi,
  makePaymentAsPerAgreementApi,
  createAsPerAgreementApi,
  approveAsPerAgreementApi,
  rejectAsPerAgreementApi,
  payAsPerAgreementApi,
  fetchFinanceOverviewMetrics,
  createInvoice,
  fetchMemberOptions,
  fetchReceiptSettings,
  ReceiptSetting,
  DEFAULT_RECEIPT_SETTINGS
} from '@/lib/financeApi';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { ReceiptSettingsModal } from './ReceiptSettingsModal';
import { getNetworkCentres } from '@/lib/networkApi';

interface HqFinanceViewProps {
  initialTab?: string;
}

const emptyHqMetrics: HqFinanceMetrics = {
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

export const HqFinanceView: React.FC<HqFinanceViewProps> = ({ initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [dateRange] = useState('01 Oct 2024 - 31 Oct 2024');

  // Metrics & Data
  const [metrics, setMetrics] = useState<HqFinanceMetrics>(emptyHqMetrics);
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentVerification[]>([]);
  const [agreementPendingItems, setAgreementPendingItems] = useState<AsPerAgreementItem[]>([]);
  const [agreementPayableItems, setAgreementPayableItems] = useState<AsPerAgreementItem[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCentres, setAvailableCentres] = useState<string[]>([]);
  const [selectedCentre, setSelectedCentre] = useState('All Centres');
  const [selectedMethod, setSelectedMethod] = useState('All Methods');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedService, setSelectedService] = useState('All Services');

  // Modal States
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<PendingPaymentVerification | null>(null);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSetting>(DEFAULT_RECEIPT_SETTINGS);
  const [showReceiptSettingsModal, setShowReceiptSettingsModal] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [verifyNote, setVerifyNote] = useState('');
  const [rejectReason, setRejectReason] = useState('Transaction reference invalid');
  const [rejectNote, setRejectNote] = useState('');

  // Agreement Modal States
  const [selectedAgreementReview, setSelectedAgreementReview] = useState<AsPerAgreementItem | null>(null);
  const [agreementHqNote, setAgreementHqNote] = useState('');
  const [selectedMakePayment, setSelectedMakePayment] = useState<AsPerAgreementItem | null>(null);
  const [paymentRemark, setPaymentRemark] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentTransactionRef, setPaymentTransactionRef] = useState('TRX-982821');
  const [paymentDate, setPaymentDate] = useState('02 Oct 2024');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [completedPayment, setCompletedPayment] = useState<{
    agreementId: string;
    amount: number;
    method: string;
    ref: string;
    date: string;
  } | null>(null);

  // Create As Per Agreement Modal State
  const [showCreateAgreementModal, setShowCreateAgreementModal] = useState(false);
  const [selectedPaymentForAgreement, setSelectedPaymentForAgreement] = useState<PendingPaymentVerification | null>(null);
  const [agreementRateInput, setAgreementRateInput] = useState('5');
  const [agreementRefInput, setAgreementRefInput] = useState('');
  const [createAgreementHqNote, setCreateAgreementHqNote] = useState('');
  const [agreementError, setAgreementError] = useState('');

  // Create Invoice State for HQ
  const [invoiceCentre, setInvoiceCentre] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);

  const handleSelectMember = (m: MemberOption) => {
    setSelectedMember(m);
    if (m.centre) {
      setInvoiceCentre(m.centre);
    }
  };
  const [serviceSearch, setServiceSearch] = useState('');
  const [servicesList, setServicesList] = useState<ServiceOption[]>([]);
  const [showReviewStep, setShowReviewStep] = useState(false);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');
  const [showAddCustomService, setShowAddCustomService] = useState(false);
  const [invoiceNote, setInvoiceNote] = useState('');

  const handleToggleService = (srvId: string) => {
    setServicesList((prev) =>
      prev.map((s) => (s.id === srvId ? { ...s, checked: !s.checked } : s))
    );
  };

  const handlePriceChange = (srvId: string, newPrice: number) => {
    setServicesList((prev) =>
      prev.map((s) => (s.id === srvId ? { ...s, price: newPrice } : s))
    );
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customServiceName.trim()) return;
    const priceNum = parseFloat(customServicePrice) || 0;
    const newService: ServiceOption = {
      id: `custom-${Date.now()}`,
      name: customServiceName.trim(),
      category: 'Custom Input',
      price: priceNum,
      checked: true,
    };
    setServicesList((prev) => [...prev, newService]);
    setCustomServiceName('');
    setCustomServicePrice('');
    setShowAddCustomService(false);
  };

  const selectedServices = servicesList.filter((s) => s.checked);
  const invoiceTotal = selectedServices.reduce((acc, curr) => acc + curr.price, 0);

  const loadBackendData = React.useCallback(async () => {
    try {
      const [m, apiInvoices, apiPayments, apiPendingAgreements, apiPayableAgreements, realMembers, centresData, rSettings] = await Promise.all([
        fetchFinanceOverviewMetrics(),
        fetchInvoices(),
        fetchPayments(),
        fetchAsPerAgreement(undefined, 'PENDING'),
        fetchAsPerAgreement(undefined, 'PAYABLE'),
        fetchMemberOptions(),
        getNetworkCentres({ is_active: true }),
        fetchReceiptSettings(),
      ]);

      if (rSettings) {
        setReceiptSettings(rSettings);
      }

      const realCentres = (centresData && Array.isArray(centresData))
        ? Array.from(new Set(centresData.map((c: any) => c.name).filter((n: string) => n && n !== 'Dhaka Centre')))
        : [];
      if (realCentres.length > 0) {
        setAvailableCentres(realCentres);
      }

      const getRealCentre = (rawCentre?: string, memberName?: string, memberCode?: string) => {
        if (rawCentre && rawCentre !== 'Dhaka Centre' && rawCentre !== 'dhaka') {
          return rawCentre;
        }
        if (realMembers && realMembers.length > 0) {
          const mem = realMembers.find(
            (m) =>
              (memberName && m.name.toLowerCase() === memberName.toLowerCase()) ||
              (memberCode && m.memberId === memberCode)
          );
          if (mem && mem.centre && mem.centre !== 'Dhaka Centre') {
            return mem.centre;
          }
        }
        if (realCentres.length > 0) {
          return realCentres[0];
        }
        return 'Barisal Centre';
      };

      if (realMembers) {
        setMembersList(realMembers);
        if (realMembers.length > 0) {
          setSelectedMember(realMembers[0]);
          const firstMemCentre = realMembers[0].centre && realMembers[0].centre !== 'Dhaka Centre' ? realMembers[0].centre : (realCentres[0] || 'Barisal Centre');
          setInvoiceCentre(firstMemCentre);
        } else if (realCentres.length > 0) {
          setInvoiceCentre(realCentres[0]);
        }
      }

      if (m) {
        setMetrics({
          totalInvoices: m.totalInvoices || 0,
          totalInvoicesChange: m.totalInvoicesChange || '0%',
          pendingPayments: m.pendingPayments || 0,
          pendingPaymentsChange: m.pendingPaymentsChange || '0%',
          pendingRefunds: m.pendingRefunds || 0,
          pendingRefundsChange: m.pendingRefundsChange || '0%',
          asPerAgreementPendingCount: m.asPerAgreementPendingCount || 0,
          asPerAgreementPayableAmount: m.asPerAgreementPayableAmount || 0,
          asPerAgreementPaidCount: m.asPerAgreementPaidCount || 0,
        });
      }

      setRecentInvoices(
        (apiInvoices || []).map((i: any) => ({
          id: String(i.id),
          invoiceNumber: i.invoice_number,
          member: i.member_name,
          centre: getRealCentre(i.network_centre, i.member_name, i.member_id_code),
          total: Number(i.service_amount),
          paid: Number(i.paid_amount),
          due: Number(i.due_amount),
          status: i.status as any,
          date: new Date(i.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        }))
      );

      setPendingPayments(
        (apiPayments || []).map((p: any) => {
          const resolvedCentre = getRealCentre(p.network_centre, p.member_name);
          const matchedMember = (realMembers || []).find((m: any) => m.name.toLowerCase() === (p.member_name || '').toLowerCase());
          return {
            id: String(p.id),
            paymentId: p.payment_number,
            invoiceId: p.invoice_number || `INV-${p.invoice}`,
            member: p.member_name,
            centre: resolvedCentre,
            service: p.service_name || p.service || p.invoice_service || 'Doctor Consultation',
            amount: Number(p.amount),
            method: p.method as any,
            date: new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: p.status as any,
            transactionRef: p.transaction_ref,
            collectedBy: resolvedCentre,
            notes: p.notes || p.invoice_note || p.note || '',
            hasAgreement: Boolean(p.has_agreement),
            agreementId: p.agreement_id ? String(p.agreement_id) : undefined,
            memberIdCode: p.member_id_code || matchedMember?.memberId || 'BV-1234456',
            memberPhone: p.member_phone || matchedMember?.phone || '01932682444',
            invoiceDate: p.invoice_date || new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            invoiceStatus: p.invoice_status || 'ISSUED',
          };
        })
      );

      setRecentPayments(
        (apiPayments || []).map((p: any) => ({
          id: String(p.id),
          paymentNumber: p.payment_number,
          invoiceNumber: p.invoice_number || `INV-${p.invoice}`,
          member: p.member_name,
          amount: Number(p.amount),
          method: p.method,
          status: p.status as any,
          date: new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        }))
      );

      setAgreementPendingItems(
        (apiPendingAgreements || []).map((a: any) => ({
          id: String(a.id),
          agreementId: a.agreement_id,
          paymentId: a.payment,
          invoiceId: a.invoice_number || `INV-${a.invoice}`,
          member: a.member_name,
          centre: getRealCentre(a.network_centre, a.member_name),
          service: a.service_name,
          serviceAmount: Number(a.service_amount),
          verifiedPayment: Number(a.verified_payment),
          agreementRate: a.agreement_rate ? Number(a.agreement_rate) : undefined,
          asPerAgreementAmount: Number(a.as_per_agreement_amount),
          status: a.status as any,
          reference: a.agreement_reference || a.reference_code,
          agreementReference: a.agreement_reference || a.reference_code,
          hqNote: a.hq_note,
          rejectionReason: a.rejection_reason,
          date: new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        }))
      );

      setAgreementPayableItems(
        (apiPayableAgreements || []).map((a: any) => ({
          id: String(a.id),
          agreementId: a.agreement_id,
          paymentId: a.payment,
          invoiceId: a.invoice_number || `INV-${a.invoice}`,
          member: a.member_name,
          centre: getRealCentre(a.network_centre, a.member_name),
          service: a.service_name,
          serviceAmount: Number(a.service_amount),
          verifiedPayment: Number(a.verified_payment),
          agreementRate: a.agreement_rate ? Number(a.agreement_rate) : undefined,
          asPerAgreementAmount: Number(a.as_per_agreement_amount),
          status: a.status as any,
          reference: a.agreement_reference || a.reference_code,
          agreementReference: a.agreement_reference || a.reference_code,
          hqNote: a.hq_note,
          date: new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        }))
      );
    } catch (err) {
      console.warn('Backend API fetch error:', err);
    }
  }, []);

  // Fetch live backend data on mount
  React.useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  const handleIssueInvoice = async () => {
    const memberName = selectedMember?.name || 'Walk-in Member';
    const memberId = selectedMember?.memberId || 'MEM-00000';
    const resolvedCentre = (invoiceCentre && invoiceCentre !== 'Dhaka Centre' ? invoiceCentre : '') || selectedMember?.centre || availableCentres[0] || 'Barisal Centre';

    const apiRes = await createInvoice({
      member_name: memberName,
      member_id_code: memberId,
      network_centre: resolvedCentre,
      service_name: selectedServices.map((s) => s.name).join(', ') || 'General Healthcare Service',
      service_amount: invoiceTotal,
      note: invoiceNote,
    });

    if (apiRes) {
      loadBackendData();
    } else {
      const newInvNumber = `INV-${recentInvoices.length + 1024}`;
      const newInv: RecentInvoice = {
        id: `${recentInvoices.length + 10}`,
        invoiceNumber: newInvNumber,
        member: memberName,
        centre: resolvedCentre,
        total: invoiceTotal,
        paid: 0,
        due: invoiceTotal,
        status: 'ISSUED',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      setRecentInvoices([newInv, ...recentInvoices]);
    }

    setActiveTab('overview');
    setShowReviewStep(false);
    setInvoiceNote('');
  };

  // Action handlers with API calls
  const handleVerifySubmit = async () => {
    if (!selectedPaymentDetail) return;

    // Call Backend API
    const numId = parseInt(selectedPaymentDetail.id);
    if (!isNaN(numId)) {
      await verifyPaymentApi(numId, verifyNote);
      await loadBackendData();
    }

    setShowVerifyModal(false);
    setSelectedPaymentDetail(null);
    setVerifyNote('');
  };

  const handleRejectSubmit = async () => {
    if (!selectedPaymentDetail) return;

    const numId = parseInt(selectedPaymentDetail.id);
    if (!isNaN(numId)) {
      await rejectPaymentApi(numId, rejectReason, rejectNote);
      await loadBackendData();
    }

    setShowRejectModal(false);
    setSelectedPaymentDetail(null);
    setRejectNote('');
  };

  const handleOpenCreateAgreementModal = (p: PendingPaymentVerification) => {
    setSelectedPaymentForAgreement(p);
    setAgreementRateInput('5');
    setAgreementRefInput(`AGR-2026-${Math.floor(100 + Math.random() * 900)}`);
    setCreateAgreementHqNote('');
    setAgreementError('');
    setShowCreateAgreementModal(true);
  };

  const handleCreateAgreementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForAgreement) return;
    const rateNum = parseFloat(agreementRateInput);
    if (isNaN(rateNum) || rateNum <= 0 || rateNum > 100) {
      setAgreementError('Agreement rate must be greater than 0% and at most 100%.');
      return;
    }

    const paymentDbId = parseInt(selectedPaymentForAgreement.id);
    if (isNaN(paymentDbId)) {
      setAgreementError('Invalid payment ID.');
      return;
    }

    const res = await createAsPerAgreementApi({
      payment: paymentDbId,
      agreement_rate: rateNum,
      agreement_reference: agreementRefInput,
      hq_note: createAgreementHqNote,
    });

    if (res) {
      setShowCreateAgreementModal(false);
      setSelectedPaymentForAgreement(null);
      await loadBackendData();
      setActiveTab('agreement-pending');
    } else {
      setAgreementError('Failed to create As Per Agreement record. Ensure payment is verified.');
    }
  };

  const handleApproveAgreement = async () => {
    if (!selectedAgreementReview) return;

    const numId = parseInt(selectedAgreementReview.id);
    if (!isNaN(numId)) {
      await approveAsPerAgreementApi(numId, agreementHqNote);
      await loadBackendData();
    }

    setSelectedAgreementReview(null);
    setAgreementHqNote('');
  };

  const handleRejectAgreement = async () => {
    if (!selectedAgreementReview) return;

    const numId = parseInt(selectedAgreementReview.id);
    if (!isNaN(numId)) {
      await rejectAsPerAgreementApi(numId, agreementHqNote || 'Rejected by HQ Admin');
      await loadBackendData();
    }

    setSelectedAgreementReview(null);
    setAgreementHqNote('');
  };

  const handleConfirmMakePayment = async () => {
    if (!selectedMakePayment) return;

    const numId = parseInt(selectedMakePayment.id);
    const trxRef = paymentTransactionRef || `TRX-${Date.now().toString().slice(-6)}`;
    if (!isNaN(numId)) {
      await payAsPerAgreementApi(numId, {
        payment_method: paymentMethod,
        transaction_reference: trxRef,
        payment_note: paymentNote,
      });
      await loadBackendData();
    }

    setCompletedPayment({
      agreementId: selectedMakePayment.agreementId,
      amount: selectedMakePayment.asPerAgreementAmount,
      method: paymentMethod,
      ref: trxRef,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    });
    setSelectedMakePayment(null);
  };

  // Filtered Payments
  const filteredPayments = pendingPayments.filter((p) => {
    const matchesSearch =
      p.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCentre = selectedCentre === 'All Centres' || p.centre === selectedCentre;
    const matchesMethod = selectedMethod === 'All Methods' || p.method === selectedMethod;
    const matchesStatus = selectedStatus === 'All Status' || p.status === selectedStatus;
    return matchesSearch && matchesCentre && matchesMethod && matchesStatus;
  });

  // Filtered Agreement Pending
  const filteredAgreementPending = agreementPendingItems.filter((i) => {
    const matchesSearch =
      i.agreementId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCentre = selectedCentre === 'All Centres' || i.centre === selectedCentre;
    const matchesService = selectedService === 'All Services' || i.service === selectedService;
    return matchesSearch && matchesCentre && matchesService;
  });

  return (
    <div className="space-y-6 font-sans antialiased">
      {/* Sub-Navigation Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('create-invoice');
              setShowReviewStep(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'create-invoice' || activeTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Create Invoice
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Verifying Payment
          </button>
          <button
            onClick={() => setActiveTab('agreement-pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'agreement-pending'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            As Per Agreement (Pending)
          </button>
          <button
            onClick={() => setActiveTab('agreement-payable')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'agreement-payable'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            As Per Agreement (Payable)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReceiptSettingsModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 shadow-xs hover:border-slate-300 whitespace-nowrap"
            title="Configure Receipt Header, Contact, Footer & Signatory"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Receipt Settings</span>
          </button>
        </div>
      </div>

      {/* 1. FINANCE OVERVIEW TAB (Matches Top Left Panel in Design) */}
      {(activeTab === 'overview' || activeTab === 'default') && (
        <div className="space-y-6">
          {/* Stat Cards Grid (6 Cards in 2 rows as shown in design top-left) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Total Invoices */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Invoices</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{metrics.totalInvoices.toLocaleString()}</div>
              </div>
            </div>

            {/* Card 2: Pending Payments */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Payments</span>
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{metrics.pendingPayments}</div>
              </div>
            </div>

            {/* Card 3: Pending Refunds */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Refunds</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{metrics.pendingRefunds}</div>
              </div>
            </div>

            {/* Card 4: As Per Agreement (Pending) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">As Per Agreement (Pending)</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{metrics.asPerAgreementPendingCount}</div>
              </div>
            </div>

            {/* Card 5: As Per Agreement (Payable) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">As Per Agreement (Payable)</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">৳ {metrics.asPerAgreementPayableAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Card 6: As Per Agreement (Paid) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">As Per Agreement (Paid)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{metrics.asPerAgreementPaidCount}</div>
              </div>
            </div>
          </div>

          {/* Two-Column Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recent Invoices */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Recent Invoices</h3>
                <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Centre</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.member}</td>
                        <td className="py-3.5 px-4 text-slate-600">{inv.centre}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">৳ {inv.total.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">৳ {inv.paid.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-semibold text-red-600">৳ {inv.due.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700'
                                : inv.status === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Recent Payments (Pending) */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Recent Payments (Pending)</h3>
                <button onClick={() => setActiveTab('payments')} className="text-xs font-bold text-blue-600 hover:underline">
                  View All
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.paymentNumber}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{p.invoiceNumber}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{p.member}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">৳ {p.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{p.method}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE TAB FOR HQ */}
      {(activeTab === 'create-invoice' || activeTab === 'invoices') && !showReviewStep && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Invoice (HQ)</h2>
              <p className="text-xs text-slate-500">Generate a billing invoice for network centre services</p>
            </div>

            {/* Stepper Header Bar */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-blue-100">
                  1
                </div>
                <span className="text-xs font-bold text-slate-900">Select Member</span>
              </div>

              <div className="w-8 h-0.5 bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <span className="text-xs font-bold text-slate-400">Select Services</span>
              </div>

              <div className="w-8 h-0.5 bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <span className="text-xs font-bold text-slate-400">Review & Issue</span>
              </div>
            </div>
          </div>

          {/* Centre Selector */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Target Network Centre:</span>
            <select
              value={invoiceCentre}
              onChange={(e) => setInvoiceCentre(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCentres.length > 0 ? (
                <>
                  {availableCentres.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {invoiceCentre && !availableCentres.includes(invoiceCentre) && (
                    <option value={invoiceCentre}>{invoiceCentre}</option>
                  )}
                </>
              ) : (
                <>
                  <option value="Barisal Centre">Barisal Centre</option>
                  <option value="Chittagong">Chittagong</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Rajshahi">Rajshahi</option>
                </>
              )}
            </select>
          </div>

          {/* 2-COLUMN SIDE-BY-SIDE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Column: Select Member */}
            <div className="lg:col-span-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">Select Member</h4>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search member by name, phone or ID..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Member items list */}
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {membersList
                    .filter(
                      (m) =>
                        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        m.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        m.phone.toLowerCase().includes(memberSearch.toLowerCase())
                    )
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMember(m)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedMember?.id === m.id
                            ? 'border-blue-500 bg-white shadow-xs ring-2 ring-blue-100'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-tight">{m.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: {m.memberId} • Phone: {m.phone}</div>
                            <div className="text-[11px] text-slate-600 font-medium">Plan: {m.plan}</div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectMember(m);
                          }}
                          className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${
                            selectedMember?.id === m.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          Select
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowReviewStep(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-8 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Step 2: Select Services */}
            <div className="lg:col-span-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Select Services</h4>
                <button
                  type="button"
                  onClick={() => setShowAddCustomService(!showAddCustomService)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              {/* Add Custom Service Form */}
              {showAddCustomService && (
                <form onSubmit={handleAddCustomService} className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3 animate-fade-in">
                  <div className="text-xs font-bold text-blue-900">Add New Service & Price</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Service Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Special ICU Consultation"
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Price (৳)</label>
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="text-slate-400 font-bold text-xs">৳</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={customServicePrice}
                          onChange={(e) => setCustomServicePrice(e.target.value)}
                          className="w-full text-right font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomService(false)}
                      className="px-3 py-1 text-xs text-slate-600 font-semibold hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 text-xs text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                    >
                      Add & Select
                    </button>
                  </div>
                </form>
              )}

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search service..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Services List with Checkboxes & Editable Prices */}
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs max-h-80 overflow-y-auto">
                {servicesList
                  .filter((s) => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                  .map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => handleToggleService(srv.id)}
                      className={`p-3.5 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        srv.checked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {srv.checked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 block">{srv.name}</span>
                          <span className="text-[10px] text-slate-400">{srv.category}</span>
                        </div>
                      </div>

                      {/* Editable Price Field */}
                      <div
                        className="flex items-center gap-1 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-slate-400 font-bold text-xs">৳</span>
                        <input
                          type="number"
                          min="0"
                          value={srv.price}
                          onChange={(e) => handlePriceChange(srv.id, parseFloat(e.target.value) || 0)}
                          className="w-24 text-right font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
              </div>

              {/* Total Summary Bar */}
              <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                <span>Selected ({selectedServices.length} items):</span>
                <span className="text-blue-600 text-sm font-black">৳ {invoiceTotal.toLocaleString()}</span>
              </div>

              {/* Invoice Note Field */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Invoice Note / Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Add any specific notes or instructions for this invoice..."
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 REVIEW SCREEN FOR HQ */}
      {showReviewStep && activeTab === 'create-invoice' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Review & Issue Invoice</h2>
              <p className="text-xs text-slate-500">Confirm invoice details for {invoiceCentre} before issuing</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Member Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedMember?.name || 'Walk-in Member'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Member ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedMember?.memberId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Centre:</span>
                <span className="font-bold text-blue-600">{invoiceCentre}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Service</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedServices.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">৳ {item.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-bold text-slate-900">Grand Total:</span>
              <span className="text-xl font-black text-blue-600">৳ {invoiceTotal.toLocaleString()}</span>
            </div>

            {invoiceNote && (
              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-400 block font-semibold mb-0.5">Invoice Note:</span>
                <span className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 block">{invoiceNote}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setShowReviewStep(false)}
              className="border border-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-100"
            >
              Back
            </button>
            <button
              onClick={handleIssueInvoice}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20"
            >
              Issue Invoice
            </button>
          </div>
        </div>
      )}

      {/* 2. VERIFYING PAYMENT TAB (Matches Top Right Panel in Design) */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Verifying Payment</h2>
              <p className="text-xs text-slate-500">Review and verify payment receipts submitted across centres</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search payment, member, invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option>All Centres</option>
              {availableCentres.length > 0 ? (
                availableCentres.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))
              ) : (
                <>
                  <option>Barisal Centre</option>
                  <option>Chittagong</option>
                  <option>Sylhet</option>
                  <option>Khulna</option>
                  <option>Rajshahi</option>
                </>
              )}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option>All Methods</option>
              <option>bKash</option>
              <option>Bank</option>
              <option>Nagad</option>
              <option>Cash</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option>All Status</option>
              <option>PENDING</option>
              <option>VERIFIED</option>
              <option>REJECTED</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Centre</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                      No payments submitted yet. Use NC View to record a payment for an invoice.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.paymentId}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{p.invoiceId}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{p.member}</td>
                      <td className="py-3.5 px-4 text-slate-600">{p.centre}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">৳ {p.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{p.method}</td>
                      <td className="py-3.5 px-4 text-slate-500">{p.date}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                            p.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : p.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedPaymentDetail(p)}
                          className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold px-3 py-1 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        {p.status === 'VERIFIED' && !p.hasAgreement && (
                          <button
                            onClick={() => handleOpenCreateAgreementModal(p)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors shadow-xs"
                          >
                            + Agreement
                          </button>
                        )}
                        {p.status === 'VERIFIED' && p.hasAgreement && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            Agreement Created
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Showing {filteredPayments.length === 0 ? 0 : 1} - {filteredPayments.length} of {filteredPayments.length}</span>
          </div>
        </div>
      )}

      {/* 3. AS PER AGREEMENT (PENDING) TAB (Matches Middle Left Panel in Design) */}
      {activeTab === 'agreement-pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">As Per Agreement (Pending)</h2>
              <p className="text-xs text-slate-500">Review commission agreements calculated from verified member payments</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member, invoice, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCentre}
              onChange={(e) => setSelectedCentre(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option>All Centres</option>
              {availableCentres.length > 0 ? (
                availableCentres.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))
              ) : (
                <>
                  <option>Barisal Centre</option>
                  <option>Chittagong</option>
                  <option>Sylhet</option>
                  <option>Khulna</option>
                  <option>Rajshahi</option>
                </>
              )}
            </select>

            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option>All Services</option>
              <option>Hospital Service</option>
              <option>Doctor Consultation</option>
              <option>Diagnostic Test</option>
              <option>Health Plan</option>
              <option>Homecare Service</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Centre</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Service Amount</th>
                  <th className="py-3 px-4">Verified Payment</th>
                  <th className="py-3 px-4">As Per Agreement</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAgreementPending.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.agreementId}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{item.invoiceId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.member}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.centre}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{item.service}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">৳ {item.serviceAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">৳ {item.verifiedPayment.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-black text-blue-600">৳ {item.asPerAgreementAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedAgreementReview(item)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors shadow-xs"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Showing 1-5 of 38</span>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 rounded-lg border border-blue-600 bg-blue-600 text-white font-bold">1</button>
              <button className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">2</button>
              <button className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">3</button>
              <button className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">4</button>
              <button className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">5</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AS PER AGREEMENT (PAYABLE) TAB (Matches Middle Right Panel in Design) */}
      {activeTab === 'agreement-payable' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">As Per Agreement (Payable)</h2>
              <p className="text-xs text-slate-500">Approved commission agreements ready for payment payout</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member, invoice, service..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none">
              <option>All Centres</option>
              {availableCentres.length > 0 ? (
                availableCentres.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))
              ) : (
                <>
                  <option>Barisal Centre</option>
                  <option>Chittagong</option>
                  <option>Sylhet</option>
                </>
              )}
            </select>

            <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none">
              <option>All Services</option>
              <option>Hospital Service</option>
              <option>Doctor Consultation</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Centre</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Service Amount</th>
                  <th className="py-3 px-4">As Per Agreement</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {agreementPayableItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.agreementId}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{item.invoiceId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.member}</td>
                    <td className="py-3.5 px-4 text-slate-600">{item.centre}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{item.service}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">৳ {item.serviceAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-600">৳ {item.asPerAgreementAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedMakePayment(item)}
                        className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold px-4 py-1 rounded-lg transition-colors"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Official Payment Receipt Modal (Matches Image 2) */}
      <PaymentReceiptModal
        isOpen={Boolean(selectedPaymentDetail && !showVerifyModal && !showRejectModal)}
        onClose={() => setSelectedPaymentDetail(null)}
        payment={selectedPaymentDetail}
        settings={receiptSettings}
        onReject={() => setShowRejectModal(true)}
        onVerify={() => setShowVerifyModal(true)}
        onCreateAgreement={() => {
          if (selectedPaymentDetail) {
            const target = selectedPaymentDetail;
            setSelectedPaymentDetail(null);
            handleOpenCreateAgreementModal(target);
          }
        }}
      />

      {/* HQ Receipt Settings Modal */}
      <ReceiptSettingsModal
        isOpen={showReceiptSettingsModal}
        onClose={() => setShowReceiptSettingsModal(false)}
        settings={receiptSettings}
        onSettingsUpdated={(updated) => setReceiptSettings(updated)}
      />

      {/* MODAL 2: Verify Payment Modal */}
      {showVerifyModal && selectedPaymentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Verify Payment</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600 font-medium">Are you sure you want to verify this payment?</p>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-200">
                <div className="flex justify-between"><span className="text-slate-500">Payment ID:</span><span className="font-bold">{selectedPaymentDetail.paymentId}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="font-bold">৳ {selectedPaymentDetail.amount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Method:</span><span className="font-semibold">{selectedPaymentDetail.method}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Transaction Ref:</span><span className="font-mono">{selectedPaymentDetail.transactionRef}</span></div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Verification Note (optional)</label>
                <input
                  type="text"
                  placeholder="Enter note..."
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Verify Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Reject Payment Modal */}
      {showRejectModal && selectedPaymentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Reject Payment</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for rejection</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none"
                >
                  <option>Select reason</option>
                  <option>Invalid Transaction Reference</option>
                  <option>Amount Mismatch</option>
                  <option>Duplicate Payment Request</option>
                </select>
              </div>

              <div>
                <textarea
                  rows={3}
                  placeholder="Enter note..."
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: As Per Agreement – Review Modal */}
      {selectedAgreementReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">As Per Agreement – Review</h3>
              <button onClick={() => setSelectedAgreementReview(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Agreement ID:</span><span className="font-mono font-bold">{selectedAgreementReview.agreementId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Invoice:</span><span className="font-mono font-bold text-blue-600">{selectedAgreementReview.invoiceId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Member:</span><span className="font-bold">{selectedAgreementReview.member}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Network Centre:</span><span className="font-semibold">{selectedAgreementReview.centre}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Service:</span><span className="font-semibold">{selectedAgreementReview.service}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Service Amount:</span><span className="font-bold">৳ {selectedAgreementReview.serviceAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Verified Payment:</span><span className="font-bold">৳ {selectedAgreementReview.verifiedPayment.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">As Per Agreement:</span><span className="font-black text-blue-600 text-sm">৳ {selectedAgreementReview.asPerAgreementAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px]">{selectedAgreementReview.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Agreement / Reference:</span><span className="font-mono text-slate-800">{selectedAgreementReview.reference}</span></div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">HQ Note</label>
                <input
                  type="text"
                  placeholder="Enter note (optional)..."
                  value={agreementHqNote}
                  onChange={(e) => setAgreementHqNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={handleRejectAgreement}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-colors"
              >
                Reject
              </button>
              <button
                onClick={handleApproveAgreement}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Make Payment (As Per Agreement) Modal */}
      {selectedMakePayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Make Payment (As Per Agreement)</h3>
              <button onClick={() => setSelectedMakePayment(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleConfirmMakePayment(); }} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                <div><span className="text-slate-400 block">Agreement ID:</span><span className="font-bold">{selectedMakePayment.agreementId}</span></div>
                <div><span className="text-slate-400 block">Beneficiary:</span><span className="font-bold">{selectedMakePayment.centre}</span></div>
                <div><span className="text-slate-400 block">Amount:</span><span className="font-black text-emerald-600 text-sm">৳ {selectedMakePayment.asPerAgreementAmount.toLocaleString()}</span></div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Remark (optional)</label>
                <input
                  type="text"
                  value={paymentRemark}
                  onChange={(e) => setPaymentRemark(e.target.value)}
                  placeholder="02 Oct 2024"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Enter note..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Transaction Reference</label>
                <input
                  type="text"
                  placeholder="Enter reference..."
                  value={paymentTransactionRef}
                  onChange={(e) => setPaymentTransactionRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Date</label>
                  <input
                    type="text"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                  >
                    <option>Bank Transfer</option>
                    <option>bKash</option>
                    <option>Cash</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedMakePayment(null)}
                  className="border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Payment Completed Confirmation Modal */}
      {completedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Payment Completed</h3>
            <p className="text-xs text-slate-500 font-semibold">Payment has been recorded successfully!</p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5 border border-slate-200 text-left">
              <div className="flex justify-between"><span className="text-slate-500">Agreement ID:</span><span className="font-bold">{completedPayment.agreementId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount:</span><span className="font-bold text-emerald-600">৳ {completedPayment.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Method:</span><span className="font-semibold">{completedPayment.method}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Transaction Ref:</span><span className="font-mono">{completedPayment.ref}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date:</span><span>{completedPayment.date}</span></div>
            </div>

            <button
              onClick={() => setCompletedPayment(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 7: Create As Per Agreement Modal */}
      {showCreateAgreementModal && selectedPaymentForAgreement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create As Per Agreement</h3>
                <p className="text-xs text-slate-500">Configure agreement rate based on verified payment</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateAgreementModal(false);
                  setSelectedPaymentForAgreement(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgreementSubmit} className="p-5 space-y-4 text-xs">
              {agreementError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                  {agreementError}
                </div>
              )}

              {/* Read-Only Payment & Invoice Details */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedPaymentForAgreement.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Member Name:</span>
                  <span className="font-bold text-slate-900">{selectedPaymentForAgreement.member}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Network Centre:</span>
                  <span className="font-semibold text-slate-700">{selectedPaymentForAgreement.centre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified Payment Amount:</span>
                  <span className="font-black text-slate-900 text-sm">৳ {selectedPaymentForAgreement.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Editable Agreement Rate (%) Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Agreement Rate (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    placeholder="e.g. 5"
                    value={agreementRateInput}
                    onChange={(e) => setAgreementRateInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-8 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-sm">%</span>
                </div>
              </div>

              {/* Live Preview Calculation Display */}
              {(() => {
                const rateVal = parseFloat(agreementRateInput) || 0;
                const calcAmount = (selectedPaymentForAgreement.amount * rateVal) / 100;
                return (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-emerald-900">
                      <span className="font-bold">Calculated Payable Amount:</span>
                      <span className="font-black text-base text-emerald-700">৳ {calcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Formula: Verified Payment (৳ {selectedPaymentForAgreement.amount.toLocaleString()}) × {rateVal}%
                    </p>
                  </div>
                );
              })()}

              {/* Agreement Reference & Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Agreement Reference Code</label>
                <input
                  type="text"
                  placeholder="AGR-2026-001"
                  value={agreementRefInput}
                  onChange={(e) => setAgreementRefInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">HQ Note (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional agreement notes..."
                  value={createAgreementHqNote}
                  onChange={(e) => setCreateAgreementHqNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAgreementModal(false);
                    setSelectedPaymentForAgreement(null);
                  }}
                  className="border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  Create Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
