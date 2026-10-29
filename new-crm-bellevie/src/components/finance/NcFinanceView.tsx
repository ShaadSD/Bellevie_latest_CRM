'use client';

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Wallet,
  Search,
  Calendar,
  Plus,
  X,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Check,
  CreditCard,
  FileCheck,
  CheckSquare,
  Square,
  Printer
} from 'lucide-react';
import {
  NcFinanceMetrics,
  RecentInvoice,
  RecentPayment,
  AsPerAgreementItem,
  MemberOption,
  ServiceOption,
  PendingPaymentVerification,
  initialNcMetrics,
  initialNcRecentInvoices,
  initialRecentPayments,
  initialAsPerAgreementItems,
  mockMembers,
  mockServices
} from '@/data/financeData';
import {
  fetchInvoices,
  fetchPayments,
  fetchAsPerAgreement,
  recordPayment,
  createInvoice,
  fetchFinanceOverviewMetrics,
  fetchMemberOptions,
  fetchReceiptSettings,
  ReceiptSetting,
  DEFAULT_RECEIPT_SETTINGS
} from '@/lib/financeApi';
import { useAuth } from '@/context/AuthContext';
import { PaymentReceiptModal } from './PaymentReceiptModal';

interface NcFinanceViewProps {
  initialTab?: string;
  userCentreName?: string;
}

const emptyNcMetrics: NcFinanceMetrics = {
  myInvoices: 0,
  myInvoicesChange: '0%',
  outstandingAmount: 0,
  outstandingAmountChange: '0%',
  myPaymentsPending: 0,
  asPerAgreementPaidAmount: 0,
};

export const NcFinanceView: React.FC<NcFinanceViewProps> = ({ initialTab = 'overview', userCentreName }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [dateRange] = useState('01 Oct 2024 - 31 Oct 2024');

  // Dynamically resolve Network Centre from props, user session, or storage (Never hardcoded)
  const effectiveCentre =
    userCentreName ||
    user?.networkCentre ||
    (typeof window !== 'undefined' ? localStorage.getItem('active_nc_name') : null) ||
    '';

  // Metrics & Data
  const [metrics, setMetrics] = useState<NcFinanceMetrics>(emptyNcMetrics);
  const [invoices, setInvoices] = useState<RecentInvoice[]>([]);
  const [payments, setPayments] = useState<RecentPayment[]>([]);
  const [agreementItems, setAgreementItems] = useState<AsPerAgreementItem[]>([]);
  const [invoiceCreateError, setInvoiceCreateError] = useState<string | null>(null);

  // Receipt Modal State for NC
  const [selectedReceiptData, setSelectedReceiptData] = useState<PendingPaymentVerification | null>(null);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSetting>(DEFAULT_RECEIPT_SETTINGS);

  const loadNcData = React.useCallback(async () => {
    try {
      const targetCentre = effectiveCentre || undefined;
      const [m, apiInvoices, apiPayments, apiAgreements, realMembers, rSettings] = await Promise.all([
        fetchFinanceOverviewMetrics(targetCentre),
        fetchInvoices(targetCentre),
        fetchPayments(targetCentre),
        fetchAsPerAgreement(targetCentre),
        fetchMemberOptions(),
        fetchReceiptSettings(),
      ]);

      if (rSettings) {
        setReceiptSettings(rSettings);
      }

      if (realMembers) {
        setMembersList(realMembers);
        if (realMembers.length > 0) {
          setSelectedMember(realMembers[0]);
        }
      }

      if (m) {
        setMetrics({
          myInvoices: m.myInvoices || 0,
          myInvoicesChange: m.myInvoicesChange || '0%',
          outstandingAmount: m.outstandingAmount || 0,
          outstandingAmountChange: m.outstandingAmountChange || '0%',
          myPaymentsPending: m.myPaymentsPending || 0,
          asPerAgreementPaidAmount: m.asPerAgreementPaidAmount || 0,
        });
      }

      setInvoices(
        (apiInvoices || []).map((i: any) => ({
          id: String(i.id),
          invoiceNumber: i.invoice_number,
          member: i.member_name,
          centre: i.network_centre || i.centre || undefined,
          service: i.service_name || 'General Healthcare Service',
          total: Number(i.service_amount),
          paid: Number(i.paid_amount),
          due: Number(i.due_amount),
          status: i.status === 'PARTIALLY_PAID' ? 'PARTIAL' : i.status,
          date: new Date(i.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        }))
      );

      setPayments(
        (apiPayments || []).map((p: any) => ({
          id: String(p.id),
          paymentNumber: p.payment_number,
          invoiceNumber: p.invoice_number || `INV-${p.invoice}`,
          member: p.member_name,
          centre: p.network_centre || p.centre || undefined,
          amount: Number(p.amount),
          status: p.status,
          method: p.method,
          date: new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        }))
      );

      setAgreementItems(
        (apiAgreements || []).map((a: any) => ({
          id: String(a.id),
          agreementId: a.agreement_id,
          invoiceId: a.invoice_number || `INV-${a.invoice}`,
          member: a.member_name,
          centre: a.network_centre,
          service: a.service_name || 'General Healthcare Service',
          serviceAmount: Number(a.service_amount),
          verifiedPayment: Number(a.verified_payment),
          agreementRate: a.agreement_rate ? Number(a.agreement_rate) : undefined,
          asPerAgreementAmount: Number(a.as_per_agreement_amount),
          status: a.status,
          referenceCode: a.agreement_reference || a.reference_code || `AGR-${a.id}`,
          reference: a.agreement_reference || a.reference_code || `AGR-${a.id}`,
          payoutDate: a.payout_date || 'Pending Payout',
          actionNote: a.hq_note,
          hqNote: a.hq_note,
          date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        }))
      );
    } catch (err) {
      console.warn('[NC View] Backend API fetch error:', err);
    }
  }, []);

  // Fetch live backend data on mount
  React.useEffect(() => {
    loadNcData();
  }, [loadNcData]);

  // Open official receipt from Invoice record
  const handleOpenReceiptFromInvoice = (inv: RecentInvoice) => {
    const matchedMember = membersList.find(
      (m) => m.name.toLowerCase() === inv.member.toLowerCase()
    );
    const resolvedCentre =
      (inv.centre && inv.centre !== 'Dhaka Centre' ? inv.centre : null) ||
      matchedMember?.centre ||
      effectiveCentre ||
      inv.centre ||
      'Network Centre';

    const isPaid = inv.status === 'PAID';
    setSelectedReceiptData({
      id: inv.id,
      paymentId: `PAY-${inv.invoiceNumber?.replace('INV-', '') || inv.id}`,
      invoiceId: inv.invoiceNumber,
      member: inv.member,
      centre: resolvedCentre,
      service: inv.service || 'Doctor Consultation',
      amount: inv.paid > 0 ? inv.paid : inv.total,
      method: 'bKash',
      date: inv.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: isPaid ? 'VERIFIED' : 'PENDING',
      transactionRef: 'BK-938292',
      notes: inv.status === 'PAID' ? 'Fully Paid Invoice' : 'Official Invoice Record',
      memberIdCode: matchedMember?.memberId || 'MEM-00000',
      memberPhone: matchedMember?.phone || '01932682444',
      invoiceDate: inv.date,
      invoiceStatus: inv.status,
    });
  };

  // Open official receipt from Payment record
  const handleOpenReceiptFromPayment = (p: RecentPayment) => {
    const matchedMember = membersList.find(
      (m) => m.name.toLowerCase() === p.member.toLowerCase()
    );
    const resolvedCentre =
      (p.centre && p.centre !== 'Dhaka Centre' ? p.centre : null) ||
      matchedMember?.centre ||
      effectiveCentre ||
      p.centre ||
      'Network Centre';

    setSelectedReceiptData({
      id: p.id,
      paymentId: p.paymentNumber,
      invoiceId: p.invoiceNumber,
      member: p.member,
      centre: resolvedCentre,
      service: 'Doctor Consultation',
      amount: p.amount,
      method: (p.method as any) || 'bKash',
      date: p.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: p.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      transactionRef: 'BK-938292',
      notes: 'Payment recorded by Network Centre',
      memberIdCode: matchedMember?.memberId || 'MEM-00000',
      memberPhone: matchedMember?.phone || '01932682444',
      invoiceDate: p.date,
      invoiceStatus: p.status === 'VERIFIED' ? 'PAID' : 'ISSUED',
    });
  };

  // Modal: Record Payment
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<RecentInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [paymentRef, setPaymentRef] = useState('BK-938292');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Create Invoice State
  const [memberSearch, setMemberSearch] = useState('');
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [servicesList, setServicesList] = useState<ServiceOption[]>([]);
  const [showReviewStep, setShowReviewStep] = useState(false);

  // Custom service and price editing state
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState('');
  const [showAddCustomService, setShowAddCustomService] = useState(false);

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

  // Record Payment Handler
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const amt = parseFloat(paymentAmount) || 0;
    const targetId = Number(selectedInvoiceForPayment.id);

    if (!isNaN(targetId) && targetId > 0) {
      await recordPayment({
        invoice: targetId,
        amount: amt,
        method: paymentMethod,
        transaction_ref: paymentRef,
      });
      loadNcData();
    } else {
      const newPayment: RecentPayment = {
        id: `PAY-${payments.length + 101}`,
        paymentNumber: `PAY-${payments.length + 101}`,
        invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
        member: selectedInvoiceForPayment.member,
        amount: amt,
        status: 'PENDING',
        method: paymentMethod,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      setPayments([newPayment, ...payments]);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoiceForPayment.id
            ? {
                ...inv,
                paid: inv.paid + amt,
                due: Math.max(0, inv.due - amt),
                status: Math.max(0, inv.due - amt) === 0 ? 'PAID' : 'PARTIAL'
              }
            : inv
        )
      );
    }

    const matchedMember = membersList.find(
      (m) => m.name.toLowerCase() === selectedInvoiceForPayment.member.toLowerCase()
    );
    const resolvedPaymentCentre =
      (selectedInvoiceForPayment.centre && selectedInvoiceForPayment.centre !== 'Dhaka Centre' ? selectedInvoiceForPayment.centre : null) ||
      matchedMember?.centre ||
      effectiveCentre ||
      selectedInvoiceForPayment.centre ||
      'Network Centre';

    // Immediately open Official Receipt for the payment!
    setSelectedReceiptData({
      id: String(targetId || Date.now()),
      paymentId: `PAY-${selectedInvoiceForPayment.invoiceNumber?.replace('INV-', '') || Date.now().toString().slice(-5)}`,
      invoiceId: selectedInvoiceForPayment.invoiceNumber,
      member: selectedInvoiceForPayment.member,
      centre: resolvedPaymentCentre,
      service: selectedInvoiceForPayment.service || 'Doctor Consultation',
      amount: amt,
      method: (paymentMethod as any) || 'bKash',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'VERIFIED',
      transactionRef: paymentRef,
      notes: paymentNotes || 'Payment collected at Network Centre',
      memberIdCode: matchedMember?.memberId || 'BV-1234456',
      memberPhone: matchedMember?.phone || '01932682444',
      invoiceDate: selectedInvoiceForPayment.date,
      invoiceStatus: 'PAID',
    });

    setShowRecordPaymentModal(false);
    setSelectedInvoiceForPayment(null);
  };

  // Service toggle handler
  const handleToggleService = (srvId: string) => {
    setServicesList((prev) =>
      prev.map((s) => (s.id === srvId ? { ...s, checked: !s.checked } : s))
    );
  };

  const selectedServices = servicesList.filter((s) => s.checked);
  const invoiceTotal = selectedServices.reduce((acc, curr) => acc + curr.price, 0);

  const handleIssueInvoice = async () => {
    const memberName = selectedMember?.name || 'Walk-in Member';
    const memberId = selectedMember?.memberId || 'MEM-00000';
    const invService = selectedServices.map((s) => s.name).join(', ') || 'General Healthcare Service';
    const centre =
      selectedMember?.centre ||
      effectiveCentre ||
      'Network Centre';

    const apiRes = await createInvoice({
      member_name: memberName,
      member_id_code: memberId,
      network_centre: centre,
      service_name: invService,
      service_amount: invoiceTotal,
    });

    if (!apiRes) {
      setInvoiceCreateError("Invoice could not be saved. Please try again.");
      return;
    }
    setInvoiceCreateError(null);
    const newInvNumber = apiRes.invoice_number;
    await loadNcData();

    // Automatically open the Official Receipt for download/print right after creation!
    setSelectedReceiptData({
      id: String(apiRes?.id || Date.now()),
      paymentId: `PAY-${newInvNumber.replace('INV-', '')}`,
      invoiceId: newInvNumber,
      member: memberName,
      centre: centre,
      service: invService,
      amount: invoiceTotal,
      method: 'bKash',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PENDING',
      transactionRef: 'BK-938292',
      notes: 'New Invoice Issued by Network Centre',
      memberIdCode: memberId,
      memberPhone: selectedMember?.phone || '01932682444',
      invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      invoiceStatus: 'ISSUED',
    });

    setActiveTab('overview');
    setShowReviewStep(false);
  };

  return (
    <div className="space-y-6 font-sans antialiased">
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Finance Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('create-invoice');
              setShowReviewStep(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'create-invoice' || activeTab === 'invoices'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Create Invoice
          </button>
          <button
            onClick={() => setActiveTab('my-as-per-agreement')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'my-as-per-agreement' || activeTab === 'commissions'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My As Per Agreement
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">

          <button
            onClick={() => {
              if (invoices.length > 0) {
                setSelectedInvoiceForPayment(invoices[0]);
                setShowRecordPaymentModal(true);
              }
            }}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 1. FINANCE OVERVIEW TAB (Matches Bottom Left Panel in Design) */}
      {(activeTab === 'overview' || activeTab === 'default') && (
        <div className="space-y-6">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: My Invoices */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">My Invoices</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{metrics.myInvoices}</div>
              </div>
            </div>

            {/* Card 2: Outstanding Amount */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Outstanding Amount</span>
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">৳ {metrics.outstandingAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Card 3: My Payments (Pending) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">My Payments (Pending)</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">{metrics.myPaymentsPending}</div>
              </div>
            </div>

            {/* Card 4: As Per Agreement (Paid) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">As Per Agreement (Paid)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-slate-900">৳ {metrics.asPerAgreementPaidAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Main Two-Column Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recent Invoices */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Recent Invoices</h3>
                <button
                  onClick={() => {
                    setActiveTab('create-invoice');
                    setShowReviewStep(false);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Due</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td
                          onClick={() => handleOpenReceiptFromInvoice(inv)}
                          className="py-3.5 px-4 font-mono font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.member}</td>
                        <td className="py-3.5 px-4 text-slate-600">{inv.service || 'Hospital Service'}</td>
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
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenReceiptFromInvoice(inv)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-lg transition-colors border border-blue-200 shadow-2xs"
                            title="View & Download Official Receipt"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Recent Payments */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Recent Payments</h3>
                <button className="text-xs font-bold text-blue-600 hover:underline">View All</button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td
                          onClick={() => handleOpenReceiptFromPayment(p)}
                          className="py-3.5 px-4 font-mono font-bold text-slate-800 hover:text-blue-600 hover:underline cursor-pointer"
                        >
                          {p.paymentNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{p.invoiceNumber}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">৳ {p.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">{p.method}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                              p.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenReceiptFromPayment(p)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-200 shadow-2xs"
                            title="View & Download Official Receipt"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
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

      {/* 2. CREATE INVOICE TAB (Matches Bottom Middle Panel in Design) */}
      {(activeTab === 'create-invoice' || activeTab === 'invoices') && !showReviewStep && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Invoice</h2>
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

          {/* EXACT 2-COLUMN SIDE-BY-SIDE GRID (Matching Panel 6 in Design) */}
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

                {/* Member items list with Select buttons */}
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
                        onClick={() => setSelectedMember(m)}
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
                            setSelectedMember(m);
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
                        placeholder="e.g. ICU Bed Charge"
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
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 REVIEW SCREEN */}
      {showReviewStep && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Review & Issue Invoice</h2>
              <p className="text-xs text-slate-500">Confirm invoice details before issuing</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Member Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedMember?.name || 'Walk-in Member'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Member ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedMember?.memberId || 'N/A'}</span>
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
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setShowReviewStep(false)}
              className="border border-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                const memberName = selectedMember?.name || 'Walk-in Member';
                const memberId = selectedMember?.memberId || 'MEM-00000';
                const invService = selectedServices.map((s) => s.name).join(', ') || 'General Healthcare Service';
                setSelectedReceiptData({
                  id: 'preview',
                  paymentId: `PAY-${invoices.length + 1024}`,
                  invoiceId: `INV-${invoices.length + 1024}`,
                  member: memberName,
                  centre: selectedMember?.centre || effectiveCentre || 'Network Centre',
                  service: invService,
                  amount: invoiceTotal,
                  method: 'bKash',
                  date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                  status: 'PENDING',
                  transactionRef: 'BK-938292',
                  notes: 'Official Invoice Preview',
                  memberIdCode: memberId,
                  memberPhone: selectedMember?.phone || '01932682444',
                  invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                  invoiceStatus: 'ISSUED',
                });
              }}
              className="border border-blue-600 text-blue-600 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-50 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Preview Receipt</span>
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

      {/* 3. MY AS PER AGREEMENT TAB (Matches Bottom Right Panel in Design) */}
      {(activeTab === 'my-as-per-agreement' || activeTab === 'commissions') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My As Per Agreement</h2>
              <p className="text-xs text-slate-500">Commission agreement payouts calculated for processed service invoices</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none">
              <option>All Status</option>
              <option>PENDING</option>
              <option>PAYABLE</option>
              <option>PAID</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Service Amount</th>
                  <th className="py-3 px-4">Verified Payment</th>
                  <th className="py-3 px-4">Rate (%)</th>
                  <th className="py-3 px-4">As Per Agreement</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {agreementItems.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.agreementId}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{c.invoiceId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.service}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">৳ {c.serviceAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">৳ {(c.verifiedPayment || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">{c.agreementRate ? `${c.agreementRate}%` : 'N/A'}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-600">৳ {c.asPerAgreementAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                          c.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'PAYABLE'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-500 pt-2">
            <span>Showing 1-3 of 3</span>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Record Payment</h3>
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Invoice</label>
                <select
                  value={selectedInvoiceForPayment?.id || ''}
                  onChange={(e) => {
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) setSelectedInvoiceForPayment(inv);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - ৳ {inv.total.toLocaleString()} (Due: ৳ {inv.due.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Member</label>
                <input
                  type="text"
                  disabled
                  value={selectedInvoiceForPayment?.member || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Already Paid</label>
                  <input
                    type="text"
                    disabled
                    value={`৳ ${(selectedInvoiceForPayment ? selectedInvoiceForPayment.paid : 0).toLocaleString()}`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Remaining</label>
                  <input
                    type="text"
                    disabled
                    value={`৳ ${(selectedInvoiceForPayment?.due || 0).toLocaleString()}`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>bKash</option>
                  <option>Nagad</option>
                  <option>Bank</option>
                  <option>Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Enter notes (optional)..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal for NC */}
      <PaymentReceiptModal
        isOpen={Boolean(selectedReceiptData)}
        onClose={() => setSelectedReceiptData(null)}
        payment={selectedReceiptData}
        settings={receiptSettings}
      />
    </div>
  );
};
