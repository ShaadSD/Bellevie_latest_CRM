'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Users,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  ChevronDown,
  Check,
  X,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import {
  HealthPlan,
  PlanBenefit,
  PlanSubscription,
  SubscriptionStatus,
  fetchHealthPlans,
  saveHealthPlan,
  fetchSubscriptions,
  updateSubscriptionStatus,
  INITIAL_HEALTH_PLANS,
  INITIAL_SUBSCRIPTIONS,
  DEFAULT_PLAN_BENEFITS
} from '@/lib/healthPlansApi';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';
import { PlanViewModal } from './PlanViewModal';
import { PlanFormModal } from './PlanFormModal';

export const HqHealthPlansView: React.FC = () => {
  // Data state
  const [plans, setPlans] = useState<HealthPlan[]>(INITIAL_HEALTH_PLANS);
  const [subscriptions, setSubscriptions] = useState<PlanSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetailSub, setSelectedDetailSub] = useState<PlanSubscription | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States for Plan Create/Edit & View
  const [showPlanFormModal, setShowPlanFormModal] = useState(false);
  const [editingPlanModal, setEditingPlanModal] = useState<HealthPlan | null>(null);
  const [viewingPlanModal, setViewingPlanModal] = useState<HealthPlan | null>(null);

  // Active Plan for Editing / Viewing Benefits
  const [selectedPlanId, setSelectedPlanId] = useState<number>(1);
  const [activePlanBenefits, setActivePlanBenefits] = useState<PlanBenefit[]>(DEFAULT_PLAN_BENEFITS.sohay);

  // Create / Edit Form State
  const [formData, setFormData] = useState({
    id: 1,
    name: 'Sohay',
    code: 'sohay',
    description: 'BelleVie Health Protection Plan',
    price: 150,
    annual_fee: 1800,
    duration_days: 365,
    terms: '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
    is_published: true,
    is_active: true,
    display_order: 1,
  });

  // Benefit Modal / Form state
  const [showAddBenefitModal, setShowAddBenefitModal] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<PlanBenefit | null>(null);
  const [benefitForm, setBenefitForm] = useState({
    name: '',
    type: 'Monetary' as PlanBenefit['type'],
    amount: '',
    is_active: true,
  });

  // Subscription Requests Filter Tab
  const [subTab, setSubTab] = useState<'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED' | 'ALL'>('PENDING');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedPlans = await fetchHealthPlans();
      const loadedSubs = await fetchSubscriptions();
      setPlans(loadedPlans);
      setSubscriptions(loadedSubs);

      // Set first plan active
      if (loadedPlans.length > 0) {
        const first = loadedPlans[0];
        setSelectedPlanId(first.id);
        setActivePlanBenefits(first.benefits || DEFAULT_PLAN_BENEFITS[first.code] || DEFAULT_PLAN_BENEFITS.sohay);
        populateForm(first);
      }
    } catch (err) {
      console.error('Failed loading health plans data:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (plan: HealthPlan) => {
    setFormData({
      id: plan.id,
      name: plan.name,
      code: plan.code || plan.name.toLowerCase().replace(/\s+/g, ''),
      description: plan.description || 'BelleVie Health Protection Plan',
      price: plan.price,
      annual_fee: plan.annual_fee || plan.price * 12,
      duration_days: plan.duration_days || 365,
      terms: plan.terms || '1. Benefits apply as per plan details.\n2. Valid for registered members only.\n3. BelleVie reserves the right to modify the plan.',
      is_published: plan.is_published,
      is_active: plan.is_active,
      display_order: plan.display_order || 1,
    });
  };

  const handleSelectPlan = (plan: HealthPlan) => {
    setSelectedPlanId(plan.id);
    populateForm(plan);
    const benefits = plan.benefits || DEFAULT_PLAN_BENEFITS[plan.code] || DEFAULT_PLAN_BENEFITS[plan.name.toLowerCase()] || DEFAULT_PLAN_BENEFITS.sohay;
    setActivePlanBenefits([...benefits]);
  };

  const handleCreateNewPlanClick = () => {
    setEditingPlanModal(null);
    setShowPlanFormModal(true);
  };

  const handleSavePlanFromModal = async (planData: Partial<HealthPlan>, benefitsList: PlanBenefit[]) => {
    try {
      await saveHealthPlan({
        ...planData,
        benefits: benefitsList,
      });

      const updatedPlans = await fetchHealthPlans();
      setPlans(updatedPlans);
      setToastMsg({ type: 'success', text: 'Plan saved successfully!' });
    } catch (err: any) {
      setToastMsg({ type: 'error', text: 'Failed to save plan: ' + (err?.message || err) });
      throw err;
    }
  };

  // Benefit Actions
  const handleToggleBenefit = (benefitId: number) => {
    setActivePlanBenefits(prev =>
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
      setActivePlanBenefits(prev =>
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
      setActivePlanBenefits(prev => [...prev, newB]);
    }
    setShowAddBenefitModal(false);
  };

  const handleDeleteBenefit = (id: number) => {
    if (confirm('Are you sure you want to remove this benefit?')) {
      setActivePlanBenefits(prev => prev.filter(b => b.id !== id));
    }
  };

  // Subscription decisions
  const handleActivateSubscription = async (id: number) => {
    try {
      await updateSubscriptionStatus(id, 'ACTIVE', 'Approved by HQ Admin');
      const updated = await fetchSubscriptions();
      setSubscriptions(updated);
      setToastMsg({ type: 'success', text: 'Subscription request approved & activated successfully!' });
    } catch (err: any) {
      setToastMsg({ type: 'error', text: 'Failed to activate subscription: ' + (err?.message || err) });
    }
  };

  const handleRejectSubscription = async (id: number) => {
    try {
      await updateSubscriptionStatus(id, 'REJECTED', 'Rejected by HQ Admin');
      const updated = await fetchSubscriptions();
      setSubscriptions(updated);
      setToastMsg({ type: 'success', text: 'Subscription request rejected.' });
    } catch (err: any) {
      setToastMsg({ type: 'error', text: 'Failed to reject subscription: ' + (err?.message || err) });
    }
  };

  // Filtered subscriptions
  const filteredSubscriptions = subscriptions.filter(s => {
    if (subTab === 'ALL') return true;
    return s.status === subTab;
  });

  const pendingCount = subscriptions.filter(s => s.status === 'PENDING').length;
  const totalActiveMembers = plans.reduce((acc, p) => acc + (p.members_count || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Health Protection Plans</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Dashboard &gt; Health Plans &gt; <span className="text-slate-800 font-semibold">Plans</span>
          </p>
        </div>
        <button
          onClick={handleCreateNewPlanClick}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Plans */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{plans.length}</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Plans</p>
          </div>
        </div>

        {/* Published Plans */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {plans.filter(p => p.is_published).length}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Published Plans</p>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {totalActiveMembers.toLocaleString()}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Active Members</p>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {pendingCount}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Pending Requests</p>
          </div>
        </div>
      </div>

      {/* Health Plans Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Health Plans</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6 w-12 text-center">#</th>
                <th className="py-3.5 px-4">Plan Name</th>
                <th className="py-3.5 px-4">Monthly Fee</th>
                <th className="py-3.5 px-4">Annual Fee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Published</th>
                <th className="py-3.5 px-4">Members</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {plans.map((p, idx) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-6 font-medium text-slate-400 text-center">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">৳ {p.price.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">৳ {(p.annual_fee || p.price * 12).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      {p.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.is_published ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.members_count || 0}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewingPlanModal(p)}
                          className="px-3 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlanModal(p);
                            setShowPlanFormModal(true);
                          }}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Subscription Requests */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Title and Filter Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 space-y-3">
          <h2 className="text-base font-bold text-slate-900">Subscription Requests</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSubTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                subTab === 'PENDING'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Pending Requests</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${subTab === 'PENDING' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setSubTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'ACTIVE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active Subscriptions
            </button>

            <button
              onClick={() => setSubTab('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'REJECTED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rejected
            </button>

            <button
              onClick={() => setSubTab('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'CANCELLED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancelled
            </button>

            <button
              onClick={() => setSubTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6 w-10 text-center">#</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Centre</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSubscriptions.map((sub, idx) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-400 text-center">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{sub.member_name}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-600">{sub.member_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{sub.plan_name}</td>
                  <td className="py-3 px-4 text-slate-700">{sub.billing_cycle}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">৳ {sub.price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-600">{sub.centre_name}</td>
                  <td className="py-3 px-4 text-slate-600">{sub.requested_by}</td>
                  <td className="py-3 px-4 text-slate-500 font-medium">{sub.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        sub.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : sub.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {sub.status === 'PENDING' ? 'Pending' : sub.status === 'ACTIVE' ? 'Active' : sub.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedDetailSub(sub)}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      {sub.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleActivateSubscription(sub.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleRejectSubscription(sub.id)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding / Editing Benefit */}
      {showAddBenefitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingBenefit ? 'Edit Benefit' : 'Add New Benefit'}
              </h3>
              <button
                onClick={() => setShowAddBenefitModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Benefit Name *</label>
                <input
                  type="text"
                  value={benefitForm.name}
                  onChange={e => setBenefitForm({ ...benefitForm, name: e.target.value })}
                  placeholder="e.g. Critical Illness Benefit"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Benefit Type</label>
                <select
                  value={benefitForm.type}
                  onChange={e => setBenefitForm({ ...benefitForm, type: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="Monetary">Monetary</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Service">Service</option>
                  <option value="Limit">Limit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount / Value</label>
                <input
                  type="text"
                  value={benefitForm.amount}
                  onChange={e => setBenefitForm({ ...benefitForm, amount: e.target.value })}
                  placeholder="e.g. 100,000 or 50% or Available"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-700">Available / Active</span>
                <button
                  type="button"
                  onClick={() => setBenefitForm({ ...benefitForm, is_active: !benefitForm.is_active })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    benefitForm.is_active ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddBenefitModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBenefit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md"
              >
                Save Benefit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan View Modal */}
      <PlanViewModal
        plan={viewingPlanModal}
        onClose={() => setViewingPlanModal(null)}
        onEdit={(plan) => {
          setViewingPlanModal(null);
          setEditingPlanModal(plan);
          setShowPlanFormModal(true);
        }}
      />

      {/* Plan Form Modal (Create / Edit) */}
      <PlanFormModal
        isOpen={showPlanFormModal}
        editingPlan={editingPlanModal}
        onClose={() => {
          setShowPlanFormModal(false);
          setEditingPlanModal(null);
        }}
        onSave={handleSavePlanFromModal}
      />

      {/* Subscription Detail Modal */}
      <SubscriptionDetailModal
        subscription={selectedDetailSub}
        onClose={() => setSelectedDetailSub(null)}
        onActivate={handleActivateSubscription}
        onReject={handleRejectSubscription}
        isHqView={true}
      />

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold text-white ${
            toastMsg.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'
          }`}>
            <span>{toastMsg.text}</span>
            <button
              onClick={() => setToastMsg(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
