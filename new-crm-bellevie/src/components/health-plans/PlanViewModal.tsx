'use client';

import React from 'react';
import { X, ShieldCheck, CheckCircle, Clock, FileText, Check, Layers } from 'lucide-react';
import { HealthPlan, PlanBenefit } from '@/lib/healthPlansApi';

interface PlanViewModalProps {
  plan: HealthPlan | null;
  onClose: () => void;
  onEdit?: (plan: HealthPlan) => void;
}

export const PlanViewModal: React.FC<PlanViewModalProps> = ({
  plan,
  onClose,
  onEdit
}) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col transform transition-all max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{plan.name} Plan Details</h3>
              <p className="text-xs text-slate-500 font-mono">Code: {plan.code || plan.name.toLowerCase()}</p>
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Banners */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Status:</span>
              {plan.is_active ? (
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-200 text-slate-700">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Published:</span>
              {plan.is_published ? (
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800">
                  Published to NC
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-200 text-slate-700">
                  Draft / Unpublished
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {plan.description && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700">Description:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
                {plan.description}
              </p>
            </div>
          )}

          {/* Fees Breakdown */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="block text-slate-400 font-medium">Monthly Fee</span>
              <span className="text-base font-bold text-slate-900">৳ {plan.price.toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Annual Fee</span>
              <span className="text-base font-bold text-slate-900">৳ {(plan.annual_fee || plan.price * 12).toLocaleString()}</span>
            </div>
            <div>
              <span className="block text-slate-400 font-medium">Validity Period</span>
              <span className="text-base font-bold text-slate-900">{plan.duration_days || 365} Days</span>
            </div>
          </div>

          {/* Plan Benefits Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Plan Coverage & Benefits ({plan.benefits?.length || 0})</span>
            </h4>
            <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Benefit Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Amount / Limit</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {plan.benefits && plan.benefits.length > 0 ? (
                    plan.benefits.map((b, idx) => (
                      <tr key={b.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-400 font-medium text-center">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{b.name}</td>
                        <td className="py-2 px-3 text-slate-500">{b.type}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{b.amount || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          {b.is_active ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                              Off
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No benefits registered for this plan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Conditions */}
          {plan.terms && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700">Terms & Conditions:</span>
              <pre className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-mono whitespace-pre-wrap">
                {plan.terms}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(plan);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Edit Plan Details & Benefits
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
