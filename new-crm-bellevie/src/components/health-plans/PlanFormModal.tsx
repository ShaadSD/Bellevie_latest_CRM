'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Check
} from 'lucide-react';
import { HealthPlan, PlanBenefit, DEFAULT_PLAN_BENEFITS } from '@/lib/healthPlansApi';

interface PlanFormModalProps {
  isOpen: boolean;
  editingPlan: HealthPlan | null;
  onClose: () => void;
  onSave: (planData: Partial<HealthPlan>, benefits: PlanBenefit[]) => Promise<void>;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  editingPlan,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    code: '',
    description: '',
    price: 0,
    annual_fee: 0,
    duration_days: 365,
    terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
    is_published: true,
    is_active: true,
    display_order: 1,
  });

  const [benefits, setBenefits] = useState<PlanBenefit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Benefit Sub-modal state
  const [showAddBenefitModal, setShowAddBenefitModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<PlanBenefit | null>(null);
  const [benefitForm, setBenefitForm] = useState({
    name: '',
    type: 'Monetary' as PlanBenefit['type'],
    amount: '',
    is_active: true,
  });

  useEffect(() => {
    if (editingPlan) {
      setFormData({
        id: editingPlan.id,
        name: editingPlan.name,
        code: editingPlan.code || editingPlan.name.toLowerCase().replace(/\s+/g, ''),
        description: editingPlan.description || '',
        price: editingPlan.price,
        annual_fee: editingPlan.annual_fee || editingPlan.price * 12,
        duration_days: editingPlan.duration_days || 365,
        terms: editingPlan.terms || '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
        is_published: editingPlan.is_published,
        is_active: editingPlan.is_active,
        display_order: editingPlan.display_order || 1,
      });
      const bList = editingPlan.benefits || DEFAULT_PLAN_BENEFITS[editingPlan.code] || DEFAULT_PLAN_BENEFITS[editingPlan.name.toLowerCase()] || [];
      setBenefits([...bList]);
    } else {
      setFormData({
        id: 0,
        name: '',
        code: '',
        description: '',
        price: 0,
        annual_fee: 0,
        duration_days: 365,
        terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
        is_published: true,
        is_active: true,
        display_order: 1,
      });
      setBenefits([...DEFAULT_PLAN_BENEFITS.sohay]);
    }
  }, [editingPlan, isOpen]);

  if (!isOpen) return null;

  const handleMonthlyFeeChange = (val: number) => {
    setFormData(prev => ({
      ...prev,
      price: val,
      annual_fee: val * 12,
    }));
  };

  const handleToggleBenefit = (benefitId: number) => {
    setBenefits(prev =>
      prev.map(b => (b.id === benefitId ? { ...b, is_active: !b.is_active } : b))
    );
  };

  const handleOpenAddBenefit = () => {
    setEditingBenefit(null);
    setBenefitForm({
      name: '',
      type: 'Monetary',
      amount: '',
      is_active: true,
    });
    setShowAddBenefitModal(true);
  };

  const handleOpenEditBenefit = (b: PlanBenefit) => {
    setEditingBenefit(b);
    setBenefitForm({
      name: b.name,
      type: b.type,
      amount: b.amount,
      is_active: b.is_active,
    });
    setShowAddBenefitModal(true);
  };

  const handleSaveBenefit = () => {
    if (!benefitForm.name.trim()) return;
    if (editingBenefit) {
      setBenefits(prev =>
        prev.map(b =>
          b.id === editingBenefit.id
            ? { ...b, name: benefitForm.name, type: benefitForm.type, amount: benefitForm.amount, is_active: benefitForm.is_active }
            : b
        )
      );
    } else {
      const newB: PlanBenefit = {
        id: Date.now(),
        name: benefitForm.name,
        type: benefitForm.type,
        amount: benefitForm.amount || '-',
        is_active: benefitForm.is_active,
      };
      setBenefits(prev => [...prev, newB]);
    }
    setShowAddBenefitModal(false);
  };

  const handleDeleteBenefit = (id: number) => {
    setBenefits(prev => prev.filter(b => b.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: formData.id || undefined,
        name: formData.name,
        code: formData.code || formData.name.toLowerCase().replace(/\s+/g, ''),
        description: formData.description,
        price: formData.price,
        annual_fee: formData.annual_fee,
        duration_days: formData.duration_days,
        terms: formData.terms,
        is_published: formData.is_published,
        is_active: formData.is_active,
        display_order: formData.display_order,
      }, benefits);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col transform transition-all max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {formData.id ? `Edit Plan: ${formData.name}` : 'Create New Health Protection Plan'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Configure plan fees, rules and benefit limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Form Inputs + Right Plan Benefits Grid */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Inputs (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Basic Plan Information
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Swosti"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plan Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="swosti"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="BelleVie Health Protection Plan details..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Fee (৳) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => handleMonthlyFeeChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Annual Fee (৳) *</label>
                  <input
                    type="number"
                    value={formData.annual_fee}
                    onChange={e => setFormData({ ...formData, annual_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={formData.duration_days}
                    onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                  />
                  <span>Publish to Network Centres</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                  <span>Plan Active</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={e => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono resize-none"
                />
              </div>
            </div>

            {/* Right Side: Benefits Management Table (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Coverage & Benefits ({benefits.length})
                </h4>
                <button
                  type="button"
                  onClick={handleOpenAddBenefit}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Benefit</span>
                </button>
              </div>

              <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Benefit Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3 text-center">Active</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {benefits.map((b, idx) => (
                      <tr key={b.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-400 font-medium text-center">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{b.name}</td>
                        <td className="py-2 px-3 text-slate-500">{b.type}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{b.amount}</td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={b.is_active}
                            onChange={() => handleToggleBenefit(b.id)}
                            className="w-3.5 h-3.5 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBenefit(b)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBenefit(b.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Plan...' : 'Save Plan'}
            </button>
          </div>
        </form>

        {/* Sub-modal: Add / Edit Benefit */}
        {showAddBenefitModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  {editingBenefit ? 'Edit Benefit' : 'Add New Benefit'}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddBenefitModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Benefit Name *</label>
                  <input
                    type="text"
                    value={benefitForm.name}
                    onChange={e => setBenefitForm({ ...benefitForm, name: e.target.value })}
                    placeholder="e.g. Life Support Benefit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type *</label>
                  <select
                    value={benefitForm.type}
                    onChange={e => setBenefitForm({ ...benefitForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  >
                    <option value="Monetary">Monetary (BDT)</option>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Service">Service</option>
                    <option value="Limit">Limit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount / Coverage *</label>
                  <input
                    type="text"
                    value={benefitForm.amount}
                    onChange={e => setBenefitForm({ ...benefitForm, amount: e.target.value })}
                    placeholder="e.g. 100,000 or 50% or Available"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBenefitModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBenefit}
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
                >
                  Save Benefit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
