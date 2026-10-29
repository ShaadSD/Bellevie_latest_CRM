'use client';

import React from 'react';
import {
  X,
  User,
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { PlanSubscription } from '@/lib/healthPlansApi';

interface SubscriptionDetailModalProps {
  subscription: PlanSubscription | null;
  onClose: () => void;
  onActivate?: (id: number) => void;
  onReject?: (id: number) => void;
  isHqView?: boolean;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  subscription,
  onClose,
  onActivate,
  onReject,
  isHqView = false,
}) => {
  if (!subscription) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Active / Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Approval
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Subscription Request Details</h3>
              <p className="text-xs text-slate-500 font-medium">Ref: {subscription.public_id || `SUB-${subscription.id}`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-600">Status:</span>
            {getStatusBadge(subscription.status)}
          </div>

          {/* Member & Plan Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Member Name
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">{subscription.member_name}</p>
              <p className="text-[11px] font-mono text-slate-500">{subscription.member_id}</p>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Health Plan
              </div>
              <p className="text-sm font-bold text-emerald-800">{subscription.plan_name}</p>
              <p className="text-[11px] text-slate-500 capitalize">{subscription.billing_cycle} Cycle</p>
            </div>
          </div>

          {/* Additional Metadata Details */}
          <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <CreditCard className="w-4 h-4 text-slate-400" />
                Subscription Fee:
              </span>
              <span className="font-bold text-slate-900 text-sm">৳ {subscription.price.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <Building2 className="w-4 h-4 text-slate-400" />
                Requesting Centre:
              </span>
              <span className="font-semibold text-slate-800">{subscription.centre_name || 'Network Centre'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <User className="w-4 h-4 text-slate-400" />
                Requested By:
              </span>
              <span className="font-semibold text-slate-800">{subscription.requested_by || 'Centre Officer'}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                Request Date:
              </span>
              <span className="font-semibold text-slate-800">{subscription.date}</span>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Member / Centre Notes:
            </label>
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-medium min-h-[50px]">
              {subscription.notes || 'No request notes provided.'}
            </div>
          </div>

          {subscription.hq_notes && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-700">HQ Admin Decision Notes:</label>
              <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs text-blue-900 font-medium">
                {subscription.hq_notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          {isHqView && subscription.status === 'PENDING' && (
            <div className="flex items-center gap-2">
              {onReject && (
                <button
                  onClick={() => {
                    onReject(subscription.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Reject Request
                </button>
              )}
              {onActivate && (
                <button
                  onClick={() => {
                    onActivate(subscription.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Approve & Activate
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
