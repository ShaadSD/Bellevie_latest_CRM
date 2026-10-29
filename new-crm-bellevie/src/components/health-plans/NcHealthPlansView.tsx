'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Search,
  Check,
  ChevronDown,
  Info,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  HealthPlan,
  PlanSubscription,
  fetchHealthPlans,
  fetchSubscriptions,
  createSubscription,
  INITIAL_HEALTH_PLANS,
  INITIAL_SUBSCRIPTIONS
} from '@/lib/healthPlansApi';
import { fetchMembersList, ApiMember } from '@/lib/membersApi';
import { SubscriptionDetailModal } from './SubscriptionDetailModal';
import { PlanViewModal } from './PlanViewModal';

interface NcHealthPlansViewProps {
  userCentreName?: string;
}

export const NcHealthPlansView: React.FC<NcHealthPlansViewProps> = ({
  userCentreName = 'Dhanmondi Network Centre'
}) => {
  const [plans, setPlans] = useState<HealthPlan[]>(INITIAL_HEALTH_PLANS);
  const [subscriptions, setSubscriptions] = useState<PlanSubscription[]>([]);
  const [dbMembers, setDbMembers] = useState<ApiMember[]>([]);
  const [activeTab, setActiveTab] = useState<'view_plans' | 'subscriptions'>('view_plans');
  const [selectedDetailSub, setSelectedDetailSub] = useState<PlanSubscription | null>(null);
  const [viewingPlanModal, setViewingPlanModal] = useState<HealthPlan | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Billing Cycle Toggle in Comparison Table ('Monthly' | 'Annual')
  const [billingCycleToggle, setBillingCycleToggle] = useState<'Monthly' | 'Annual'>('Monthly');

  // Subscription Request Form State
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedPlanCode, setSelectedPlanCode] = useState('swosti');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'Monthly' | 'Annual'>('Annual');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My Subscriptions Tab filter
  const [mySubFilter, setMySubFilter] = useState<'PENDING' | 'ACTIVE' | 'REJECTED' | 'CANCELLED'>('PENDING');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const loadedPlans = await fetchHealthPlans();
      const loadedSubs = await fetchSubscriptions();
      const membersRes: any = await fetchMembersList();
      const membersList = Array.isArray(membersRes)
        ? membersRes
        : (membersRes && Array.isArray(membersRes.results) ? membersRes.results : []);

      setDbMembers(membersList);
      if (membersList.length > 0) {
        const first = membersList[0];
        setSelectedMember(`${first.full_name} (${first.public_id || 'BV-' + first.id})`);
      }

      if (loadedPlans && loadedPlans.length > 0) {
        setPlans(loadedPlans);
      }
      if (loadedSubs !== null && loadedSubs !== undefined) {
        setSubscriptions(loadedSubs);
      }
    } catch (err) {
      console.error('Error loading NC health plans:', err);
    }
  };

  const selectedPlan = plans.find(p => p.code === selectedPlanCode || p.name.toLowerCase() === selectedPlanCode.toLowerCase()) || plans[2] || plans[0];

  const handleSubmitSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedPlan) return;

    setIsSubmitting(true);
    try {
      const price = selectedBillingCycle === 'Annual' ? (selectedPlan.annual_fee || selectedPlan.price * 12) : selectedPlan.price;
      const parts = selectedMember.split(' (');
      const memberName = parts[0];
      const memberId = parts[1] ? parts[1].replace(')', '') : '';
      const matchedMember = dbMembers.find(m => `${m.full_name} (${m.public_id || 'BV-' + m.id})` === selectedMember || m.full_name === memberName);

      await createSubscription({
        member_name: memberName,
        member_id: memberId,
        member_db_id: matchedMember?.id,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        billing_cycle: selectedBillingCycle,
        price: price,
        notes: requestNotes,
      });

      const updated = await fetchSubscriptions();
      if (updated !== null && updated !== undefined) {
        setSubscriptions(updated);
      }
      setToastMsg({ type: 'success', text: 'Subscription request submitted successfully!' });
    } catch (err: any) {
      setToastMsg({ type: 'error', text: 'Failed to submit subscription: ' + (err?.message || err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter subscriptions for Centre User
  const mySubscriptions = subscriptions.filter(s => {
    if (mySubFilter === 'PENDING') return s.status === 'PENDING';
    if (mySubFilter === 'ACTIVE') return s.status === 'ACTIVE';
    if (mySubFilter === 'REJECTED') return s.status === 'REJECTED';
    if (mySubFilter === 'CANCELLED') return s.status === 'CANCELLED';
    return true;
  });

  // Extract all unique benefit names across loaded plans from API
  const allBenefitNames = Array.from(
    new Set(
      plans.flatMap(p => (p.benefits || []).map(b => b.name))
    )
  );

  // Default benefit rows fallback if benefits array is empty
  const benefitRowsToRender = allBenefitNames.length > 0 ? allBenefitNames : [
    'Life Support Benefit',
    'Accidental Benefit',
    'Permanent/Partial Disability',
    'Critical Illness Benefit',
    'Hospital Stay Benefit',
    'Hospital Admission Benefit',
    'Diagnostic Discount',
    '24/7 Online Doctor',
    'Other Medical Discount'
  ];

  const headerColors = ['bg-[#1E3A8A]', 'bg-[#1E293B]', 'bg-[#065F46]', 'bg-[#047857]', 'bg-[#064E3B]'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Sub Navigation */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Health Protection Plans</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Dashboard &gt; Health Plans &gt; <span className="text-slate-800 font-semibold">View Plans</span>
          </p>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('view_plans')}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'view_plans'
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            View Plans
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'text-emerald-700 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Member Subscriptions
          </button>
        </div>
      </div>

      {activeTab === 'view_plans' && (
        <>
          {/* Health Protection Plan Comparison Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Health Protection Plan Comparison</h2>
              
              {/* Monthly / Annual Toggle Button */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setBillingCycleToggle('Monthly')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    billingCycleToggle === 'Monthly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycleToggle('Annual')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    billingCycleToggle === 'Annual'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>

            {/* Matrix Table Driven Dynamically from Backend Plans */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="text-white text-sm font-bold">
                    <th className="py-4 px-5 bg-[#0F172A] w-64 border-r border-slate-700">Benefits</th>
                    {plans.map((p, i) => (
                      <th key={p.id} className={`py-3 px-3 ${headerColors[i % headerColors.length]} text-center w-36 border-r border-white/10`}>
                        <div className="font-bold text-base">{p.name}</div>
                        <button
                          type="button"
                          onClick={() => setViewingPlanModal(p)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-white/90 hover:text-white bg-white/15 hover:bg-white/30 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {benefitRowsToRender.map(benefitName => (
                    <tr key={benefitName} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5 font-semibold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{benefitName}</span>
                      </td>
                      {plans.map(p => {
                        const b = (p.benefits || []).find(x => x.name.toLowerCase() === benefitName.toLowerCase());
                        const amountText = b ? b.amount : '-';
                        return (
                          <td key={p.id} className="py-3 px-4 text-center font-medium text-slate-700">
                            {amountText}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Monthly Fee Row */}
                  <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                    <td className="py-3 px-5 text-slate-900">
                      <span>Monthly Fee (৳)</span>
                    </td>
                    {plans.map(p => (
                      <td key={p.id} className="py-3 px-4 text-center text-blue-700">
                        ৳ {p.price.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* Annual Fee Row */}
                  <tr className="bg-slate-100 font-bold">
                    <td className="py-3 px-5 text-slate-900">
                      <span>Annual Fee (৳)</span>
                    </td>
                    {plans.map(p => (
                      <td key={p.id} className="py-3 px-4 text-center text-slate-900">
                        ৳ {(p.annual_fee || p.price * 12).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2 Column Section: Create Subscription Request (Left) & Selected Plan Summary (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card: Create Subscription Request */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100 mb-5">
                  Create Subscription Request
                </h2>

                <form onSubmit={handleSubmitSubscription} className="space-y-4">
                  {/* Select Member */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Member <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedMember}
                        onChange={e => setSelectedMember(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium appearance-none"
                      >
                        {dbMembers.length > 0 ? (
                          dbMembers.map(m => {
                            const val = `${m.full_name} (${m.public_id || 'BV-' + m.id})`;
                            return (
                              <option key={m.id} value={val}>
                                {val} {m.phone ? `- ${m.phone}` : ''}
                              </option>
                            );
                          })
                        ) : (
                          <option value="">No members found in database</option>
                        )}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Select Plan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Plan <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPlanCode}
                        onChange={e => setSelectedPlanCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium appearance-none"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.code}>
                            {p.name} (৳ {p.price} / ৳ {(p.annual_fee || p.price * 12).toLocaleString()})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Billing Cycle Radio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Billing Cycle <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="billing_cycle"
                          checked={selectedBillingCycle === 'Monthly'}
                          onChange={() => setSelectedBillingCycle('Monthly')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Monthly (৳ {(selectedPlan?.price || 0).toLocaleString()})</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="billing_cycle"
                          checked={selectedBillingCycle === 'Annual'}
                          onChange={() => setSelectedBillingCycle('Annual')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Annual (৳ {(selectedPlan?.annual_fee || (selectedPlan?.price || 0) * 12).toLocaleString()})</span>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={requestNotes}
                      onChange={e => setRequestNotes(e.target.value)}
                      placeholder="Member requested annual health protection plan."
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setRequestNotes('')}
                      className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Card: Selected Plan Summary */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100 mb-5">
                  Selected Plan Summary
                </h2>

                {selectedPlan ? (
                  <div className="space-y-4">
                    {/* Plan Name & Tag */}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-slate-900">{selectedPlan.name}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Published
                      </span>
                    </div>

                    {/* Plan Fees Breakdown */}
                    <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="block text-slate-400 font-medium">Monthly Fee:</span>
                        <span className="text-sm font-bold text-slate-900">৳ {(selectedPlan.price || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Annual Fee:</span>
                        <span className="text-sm font-bold text-slate-900">৳ {(selectedPlan.annual_fee || (selectedPlan.price || 0) * 12).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-medium">Duration:</span>
                        <span className="text-sm font-bold text-slate-900">{selectedPlan.duration_days || 365} Days</span>
                      </div>
                    </div>

                    {/* Key Benefits List (Driven dynamically from selectedPlan.benefits) */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 mb-3">Key Benefits:</h3>
                      <div className="space-y-2">
                        {(selectedPlan.benefits && selectedPlan.benefits.length > 0 ? selectedPlan.benefits : [
                          { name: 'Life Support Benefit', amount: '175,000' },
                          { name: 'Accidental Benefit', amount: '350,000' },
                          { name: 'Permanent/Partial Disability', amount: '175,000' },
                          { name: 'Critical Illness Benefit', amount: '50,000' },
                          { name: 'Hospital Stay Benefit', amount: '20,000' },
                          { name: 'Diagnostic Discount', amount: 'Up to 50%' },
                          { name: '24/7 Online Doctor', amount: 'Available' },
                          { name: 'Other Medical Discount', amount: '10% - 50%' }
                        ]).map((b, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                            <span className="flex items-center gap-2 text-slate-700 font-medium">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              {b.name}:
                            </span>
                            <span className="font-bold text-slate-900">{b.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-medium text-center py-8">
                    No health plans currently available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* My Subscription Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 space-y-3">
          <h2 className="text-base font-bold text-slate-900">My Subscription Requests</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMySubFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                mySubFilter === 'PENDING'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Pending</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${mySubFilter === 'PENDING' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {subscriptions.filter(s => s.status === 'PENDING').length}
              </span>
            </button>

            <button
              onClick={() => setMySubFilter('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                mySubFilter === 'ACTIVE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Approved</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${mySubFilter === 'ACTIVE' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {subscriptions.filter(s => s.status === 'ACTIVE').length}
              </span>
            </button>

            <button
              onClick={() => setMySubFilter('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                mySubFilter === 'REJECTED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Rejected</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${mySubFilter === 'REJECTED' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {subscriptions.filter(s => s.status === 'REJECTED').length}
              </span>
            </button>

            <button
              onClick={() => setMySubFilter('CANCELLED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                mySubFilter === 'CANCELLED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Cancelled</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${mySubFilter === 'CANCELLED' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {subscriptions.filter(s => s.status === 'CANCELLED').length}
              </span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6 w-10 text-center">#</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mySubscriptions.map((sub, idx) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-400 text-center">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{sub.member_name}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{sub.plan_name}</td>
                  <td className="py-3 px-4 text-slate-700">{sub.billing_cycle}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">৳ {sub.price.toLocaleString()}</td>
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
                      {sub.status === 'PENDING' ? 'Pending' : sub.status === 'ACTIVE' ? 'Approved' : sub.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => setSelectedDetailSub(sub)}
                      className="px-3 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail Modal */}
      <SubscriptionDetailModal
        subscription={selectedDetailSub}
        onClose={() => setSelectedDetailSub(null)}
        isHqView={false}
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
