'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { PendingPaymentVerification } from '@/data/financeData';
import { ReceiptSetting } from '@/lib/financeApi';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PendingPaymentVerification | null;
  settings: ReceiptSetting;
  onVerify?: () => void;
  onReject?: () => void;
  onCreateAgreement?: () => void;
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  settings,
  onVerify,
  onReject,
  onCreateAgreement,
}: PaymentReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [logoError, setLogoError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !payment || !mounted) return null;

  const handlePrint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Synchronous execution ensures browser never blocks the print dialog
    window.print();
  };

  const isVerified = payment.status === 'VERIFIED';
  const isPending = payment.status === 'PENDING';
  const isRejected = payment.status === 'REJECTED';

  // Format date and time
  const paymentDateStr = payment.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const invoiceDateStr = payment.invoiceDate || payment.date || paymentDateStr;
  const memberId = payment.memberIdCode || 'MEM-00000';
  const memberPhone = payment.memberPhone || '01932682444';
  const invoiceStatus = payment.invoiceStatus || (isVerified ? 'PAID' : 'ISSUED');

  // Dynamic Center Name (Never hardcoded!)
  const centreName =
    (payment.centre && payment.centre !== 'Dhaka Centre' ? payment.centre : null) ||
    (typeof window !== 'undefined' ? localStorage.getItem('active_nc_name') : null) ||
    payment.centre ||
    'Network Centre';

  return createPortal(
    <div
      id="payment-receipt-portal-root"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:py-6 z-[999999] animate-fade-in overflow-y-auto print:static print:block print:w-full print:max-w-none print:p-0 print:m-0 print:bg-white print:overflow-visible"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="payment-receipt-dialog"
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-auto overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] relative z-10 print:static print:block print:w-full print:max-w-none print:p-0 print:m-0 print:border-none print:shadow-none print:rounded-none print:bg-white print:overflow-visible"
      >
        {/* Top Control Bar (Hidden in Print, sticky at top of dialog) */}
        <div className="no-print sticky top-0 z-50 px-4 sm:px-6 py-3.5 bg-[#0b2948] text-white flex items-center justify-between border-b border-slate-800 shrink-0 shadow-md">
          {/* Left: Back to NC button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="cursor-pointer flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs transition-all active:scale-95 border border-white/20 shadow-xs"
              title="Back to Network Centre (Esc)"
            >
              <ArrowLeft className="w-4 h-4 pointer-events-none" />
              <span>Back to NC</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Payment Receipt
              </span>
            </div>
          </div>

          {/* Right: Download PDF & Cross Close button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="cursor-pointer relative z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 border border-emerald-400/30"
              title="Download as PDF or Print"
            >
              <Download className="w-4 h-4 pointer-events-none" />
              <span>Download PDF / Print</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="cursor-pointer relative z-50 flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-600 active:bg-rose-700 text-white transition-all active:scale-95 ml-1 border border-white/20 hover:border-rose-500"
              aria-label="Close Receipt"
              title="Close Receipt (Esc)"
            >
              <X className="w-5 h-5 stroke-[2.5] pointer-events-none" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div id="payment-receipt-scroll-container" className="flex-1 overflow-y-auto bg-slate-100/70 p-3 sm:p-6 print:p-0 print:overflow-visible print:bg-white">
          {/* The Actual Printable Receipt Sheet */}
          <div
            id="official-payment-receipt"
            ref={receiptRef}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-7 print:p-0 space-y-3.5 print:space-y-2.5 relative overflow-hidden flex flex-col justify-between print:border-none print:shadow-none print:rounded-none"
          >
              {/* 1. HEADER SECTION (Exact match with official BelleVie brand banner) */}
              <div className="flex items-center justify-between gap-4 pb-0.5">
                {/* Brand Logo & Name Block */}
                <div className="flex items-center gap-3.5">
                  <div className="w-[74px] h-[74px] relative flex items-center justify-center shrink-0">
                    {!logoError ? (
                      <img
                        src="/logo.png"
                        alt="BelleVie Logo"
                        className="w-full h-full object-contain"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" fill="none">
                        <circle cx="50" cy="50" r="46" stroke="#0e3a60" strokeWidth="3" fill="#f8fafc" />
                        <ellipse cx="50" cy="50" rx="38" ry="24" stroke="#94a3b8" strokeWidth="1.5" />
                        <line x1="12" y1="50" x2="88" y2="50" stroke="#94a3b8" strokeWidth="1.5" />
                        <path d="M50 4 Q50 50 50 96" stroke="#94a3b8" strokeWidth="1.5" />
                        <path
                          d="M32 68 C30 45 45 32 60 26 C64 36 60 52 48 64 Z"
                          fill="#0da160"
                          opacity="0.95"
                        />
                        <path
                          d="M48 64 C56 50 68 40 76 34 C76 46 70 60 58 72 Z"
                          fill="#0b2948"
                          opacity="0.95"
                        />
                        <circle cx="50" cy="30" r="5" fill="#0b2948" />
                      </svg>
                    )}
                  </div>

                  {/* Brand Typography */}
                  <div className="flex flex-col justify-center">
                    <h2 className="text-3xl sm:text-[34px] font-black tracking-tight leading-none">
                      <span style={{ color: '#0b2948' }}>Belle</span>
                      <span style={{ color: '#0da160' }}>Vie</span>
                    </h2>
                    <div
                      style={{ color: '#0b2948' }}
                      className="text-xs sm:text-[13px] font-bold tracking-[0.2em] uppercase mt-1 leading-none"
                    >
                      {settings.sub_title || 'GLOBAL HEALTH'}
                    </div>
                    <div
                      style={{ color: '#556982' }}
                      className="text-[9.5px] sm:text-[10px] font-semibold tracking-[0.28em] uppercase mt-1.5 leading-none"
                    >
                      {settings.tagline || 'CARE BEYOND BORDERS'}
                    </div>
                  </div>
                </div>

                {/* Right Side: Thin Vertical Divider + Left-aligned Contact Details */}
                <div className="flex items-center">
                  {/* Vertical Divider Line */}
                  <div className="w-[1.5px] h-14 bg-slate-300 mx-4 sm:mx-5 shrink-0 block" />

                  {/* Contact & Branch List (Left-aligned next to divider) */}
                  <div className="flex flex-col justify-center space-y-1 text-[11px] sm:text-[11.5px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: '#0b2948' }} />
                      <span style={{ color: '#0b2948' }} className="font-bold tracking-tight">{centreName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: '#0b2948' }} />
                      <span className="text-slate-700 font-medium">{settings.phone || '+880 1234 567890'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: '#0b2948' }} />
                      <span className="text-slate-700 font-medium">{settings.email || 'info@bellevieglobalhealth.com'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: '#0b2948' }} />
                      <span className="text-slate-700 font-medium">{settings.website || 'www.bellevieglobalhealth.com'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual-tone Accent Horizontal Bar (Navy 48% / Green 52%) */}
              <div className="h-[3.5px] w-full flex overflow-hidden rounded-full mt-2 mb-0.5">
                <div className="w-[48%] h-full" style={{ backgroundColor: '#0b2948' }} />
                <div className="w-[52%] h-full" style={{ backgroundColor: '#0da160' }} />
              </div>

              {/* 2. TITLE & STATUS BADGE ROW */}
              <div className="flex items-center justify-between gap-4 pt-0.5">
                <div>
                  <h1 style={{ color: '#0b2948' }} className="text-2xl font-black tracking-tight leading-tight">
                    PAYMENT RECEIPT
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thank you for your payment. This is an official receipt from BelleVie Global Health.
                  </p>
                </div>

                <div>
                  {isVerified && (
                    <span
                      style={{ backgroundColor: '#eaf8ef', color: '#0d784a', borderColor: '#c6e9d7' }}
                      className="font-bold text-xs px-4 py-1.5 rounded-lg border uppercase tracking-wider inline-flex items-center shadow-2xs"
                    >
                      VERIFIED
                    </span>
                  )}
                  {isPending && (
                    <span
                      style={{ backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}
                      className="font-bold text-xs px-4 py-1.5 rounded-lg border uppercase tracking-wider inline-flex items-center shadow-2xs"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      PENDING
                    </span>
                  )}
                  {isRejected && (
                    <span
                      style={{ backgroundColor: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' }}
                      className="font-bold text-xs px-4 py-1.5 rounded-lg border uppercase tracking-wider inline-flex items-center shadow-2xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      REJECTED
                    </span>
                  )}
                </div>
              </div>

              {/* 3. TOP 3 HIGHLIGHT METRIC CARDS */}
              <div className="grid grid-cols-3 gap-2.5 print:gap-2">
                <div style={{ backgroundColor: '#f4f7fb', borderColor: '#e5ecf5' }} className="border rounded-xl p-3 print:p-2">
                  <div className="text-[10.5px] font-medium text-slate-500">Payment ID</div>
                  <div style={{ color: '#0b2948' }} className="text-sm sm:text-base font-black mt-0.5 font-mono tracking-tight">
                    {payment.paymentId}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f4f7fb', borderColor: '#e5ecf5' }} className="border rounded-xl p-3 print:p-2">
                  <div className="text-[10.5px] font-medium text-slate-500">Payment Date</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                    {paymentDateStr}
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-medium">10:01 AM</div>
                </div>

                <div style={{ backgroundColor: '#f4f7fb', borderColor: '#e5ecf5' }} className="border rounded-xl p-3 print:p-2">
                  <div className="text-[10.5px] font-medium text-slate-500">Transaction Reference</div>
                  <div style={{ color: '#0b2948' }} className="text-sm sm:text-base font-black mt-0.5 font-mono tracking-tight truncate">
                    {payment.transactionRef}
                  </div>
                </div>
              </div>

              {/* 4. TWO-COLUMN SECTION: MEMBER & INVOICE */}
              <div className="grid grid-cols-2 gap-3 print:gap-2.5">
                {/* Member Information Box */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div style={{ backgroundColor: '#0b2948', color: '#ffffff' }} className="px-3.5 py-1.5 flex items-center gap-2 font-bold text-xs text-white">
                    <User className="w-3.5 h-3.5 text-blue-300" />
                    <span>Member Information</span>
                  </div>
                  <div className="p-3 print:p-2 space-y-1.5 print:space-y-1 text-xs bg-white">
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Member Name</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-bold text-slate-900 pl-1">{payment.member}</span>
                    </div>
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Member ID</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-bold text-slate-900 font-mono pl-1">{memberId}</span>
                    </div>
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Phone</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-bold text-slate-900 pl-1">{memberPhone}</span>
                    </div>
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Network Centre</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-bold text-slate-900 pl-1 truncate">
                        {centreName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invoice Information Box */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div style={{ backgroundColor: '#0d6e5d', color: '#ffffff' }} className="px-3.5 py-1.5 flex items-center gap-2 font-bold text-xs text-white">
                    <FileText className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Invoice Information</span>
                  </div>
                  <div className="p-3 print:p-2 space-y-1.5 print:space-y-1 text-xs bg-white">
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Invoice Number</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-bold text-slate-900 font-mono pl-1">{payment.invoiceId}</span>
                    </div>
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Service</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-bold text-slate-900 capitalize pl-1">
                        {payment.service || 'Doctor Consultation'}
                      </span>
                    </div>
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Invoice Date</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <span className="font-bold text-slate-900 pl-1">{invoiceDateStr}</span>
                    </div>
                    <div className="grid grid-cols-[92px_10px_1fr] items-center">
                      <span className="text-slate-500 font-medium">Invoice Status</span>
                      <span className="text-slate-400 font-bold">:</span>
                      <div className="pl-1">
                        <span style={{ backgroundColor: '#e8f0fe', color: '#1967d2', borderColor: '#bfdbfe' }} className="font-bold px-2 py-0.5 rounded text-[10px] uppercase border">
                          {invoiceStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. PAYMENT DETAILS TABLE / CARD WITH WATERMARK */}
              <div className="border border-[#c6e9d7] rounded-xl overflow-hidden shadow-xs relative">
                {/* Header */}
                <div style={{ backgroundColor: '#daf1e5', color: '#065f46', borderColor: '#c2e7d3' }} className="px-3.5 py-1.5 flex items-center gap-2 font-bold text-xs border-b">
                  <CreditCard className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Payment Details</span>
                </div>

                {/* Content with Watermark Emblem */}
                <div className="p-3 print:p-2.5 relative bg-white">
                  {/* Subtle Background Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                    <img
                      src="/logo.png"
                      alt=""
                      className="w-44 h-44 object-contain"
                    />
                  </div>

                  <div className="space-y-1.5 print:space-y-1 text-xs relative z-10">
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Amount Paid</span>
                      <span className="text-lg sm:text-xl font-black text-slate-900">
                        ৳ {payment.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Payment Method</span>
                      <span className="font-bold text-slate-800">{payment.method}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Transaction Reference</span>
                      <span className="font-mono font-bold text-slate-900">{payment.transactionRef}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Payment Status</span>
                      <span style={{ backgroundColor: '#daf1e5', color: '#065f46', borderColor: '#bbf7d0' }} className="font-black px-2 py-0.5 rounded text-[10px] uppercase border">
                        {payment.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-start gap-2 py-0.5">
                      <span className="text-slate-600 font-medium">Note</span>
                      <span className="font-medium text-slate-700 text-right max-w-[280px] break-words">
                        {payment.notes && payment.notes.trim() !== '' ? payment.notes : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. VERIFICATION CONFIRMATION & SIGNATORY */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                {/* Green Verification Confirmation Box */}
                <div style={{ backgroundColor: '#ebf8f0', borderColor: '#c4ebd3' }} className="border rounded-2xl p-2.5 print:p-2 flex items-center gap-2.5 max-w-xs flex-1">
                  <div style={{ backgroundColor: '#059669' }} className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-[#065f46]">
                      This payment has been verified.
                    </div>
                    <div className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">
                      We appreciate your trust in {settings.company_name || 'BelleVie'} {settings.sub_title || 'Global Health'}.
                    </div>
                  </div>
                </div>

                {/* Authorized Signatory */}
                <div className="text-right shrink-0 px-2 sm:px-4">
                  {/* Handwritten Signature SVG */}
                  <div className="h-8 flex items-center justify-end">
                    <svg viewBox="0 0 140 40" className="w-24 h-7 text-[#0b2948]" fill="none">
                      <path
                        d="M10 28 C30 5 40 38 60 12 C75 -2 80 32 95 20 C105 12 120 22 135 15"
                        stroke="#0b2948"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="w-32 h-[1.5px] bg-slate-300 ml-auto mb-0.5" />
                  <div style={{ color: '#0b2948' }} className="text-[11px] font-bold">
                    {settings.signatory_title || 'Authorized Signatory'}
                  </div>
                  <div className="text-[9.5px] text-slate-500">
                    {settings.signatory_org || 'BelleVie Global Health'}
                  </div>
                </div>
              </div>


              {/* 7. BOTTOM DECORATIVE CURVED WAVE FOOTER WITH LEAF ACCENTS */}
              <div className="relative mt-auto -mx-5 sm:-mx-7 print:mx-0 overflow-hidden pt-2">
                <div className="w-full relative">
                  <svg
                    viewBox="0 0 800 120"
                    preserveAspectRatio="none"
                    className="w-full h-20 print:h-16 drop-shadow-xs"
                  >
                    <defs>
                      <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#082138" />
                        <stop offset="40%" stopColor="#0b2948" />
                        <stop offset="75%" stopColor="#047857" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>

                    {/* Fluid curved wave */}
                    <path
                      d="M0,50 C220,95 380,5 540,40 C660,70 730,20 800,35 L800,120 L0,120 Z"
                      fill="url(#waveGrad)"
                    />

                    {/* Decorative leaf shapes on right side matching Image 2 */}
                    <path
                      d="M620,110 C625,75 660,60 690,75 C680,105 645,115 620,110 Z"
                      fill="url(#leafGrad)"
                    />
                    <path
                      d="M670,115 C690,70 740,65 765,85 C750,115 700,120 670,115 Z"
                      fill="#10b981"
                      opacity="0.8"
                    />
                  </svg>

                  {/* Text Overlay on Wave */}
                  <div className="absolute inset-0 flex items-end justify-between px-6 sm:px-8 pb-3.5 print:pb-2.5 text-white">
                    <div>
                      <div className="text-[11px] font-black text-white leading-tight">
                        {settings.footer_slogan_title || 'Healthy People'}
                      </div>
                      <div className="text-[11px] font-black text-emerald-300 leading-tight">
                        {settings.footer_slogan_subtitle || 'Brighter Tomorrow'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[9.5px] text-slate-200">
                        {settings.footer_thank_you || 'Thank you for choosing'}
                      </div>
                      <div className="text-[11px] font-bold text-white">
                        {settings.footer_thank_you_bold || 'BelleVie Global Health'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MODAL FOOTER ACTION BAR (Hidden in print) */}
          <div className="no-print p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handlePrint(e);
                }}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600 pointer-events-none" />
                <span>Print / Download PDF</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                <X className="w-3.5 h-3.5 pointer-events-none" />
                <span>Close (Back to NC)</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {isPending && onVerify && (
                <>
                  {onReject && (
                    <button
                      type="button"
                      onClick={onReject}
                      className="cursor-pointer bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs"
                    >
                      Reject Payment
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onVerify}
                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    Verify Payment
                  </button>
                </>
              )}

              {isVerified && !payment.hasAgreement && onCreateAgreement && (
                <button
                  type="button"
                  onClick={onCreateAgreement}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Create As Per Agreement
                </button>
              )}

              {isVerified && payment.hasAgreement && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                  Agreement Configured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }


