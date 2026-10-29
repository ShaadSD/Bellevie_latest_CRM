'use client';

import React, { useState, useEffect } from 'react';
import { Member } from '@/data/membersData';
import { 
  X, 
  Edit, 
  Ban, 
  ArrowLeftRight, 
  Users, 
  History as HistoryIcon,
  Plus,
  Trash2,
  Check,
  Loader2,
  Info,
  Edit2
} from 'lucide-react';
import { 
  fetchFamilyMembersApi, 
  addFamilyMemberApi, 
  deleteFamilyMemberApi, 
  transferMemberApi, 
  fetchTransferHistoryApi, 
  toggleMemberStatusApi,
  updateMemberApi,
  FamilyMemberApi,
  TransferHistoryRecord,
  fetchCentresList,
  NetworkCentre
} from '@/lib/membersApi';
import { useAuth } from '@/context/AuthContext';

interface MemberDrawerProps {
  member: Member | null;
  onClose: () => void;
  onRefreshList?: () => void;
}

export const MemberDrawer: React.FC<MemberDrawerProps> = ({
  member,
  onClose,
  onRefreshList,
}) => {
  const { user } = useAuth();
  const isHqUser = user?.role === 'HQ';

  const [activeTab, setActiveTab] = useState<'info' | 'family' | 'history'>('info');

  // Family Members state
  const [familyList, setFamilyList] = useState<FamilyMemberApi[]>([]);
  const [isLoadingFamily, setIsLoadingFamily] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('Spouse');
  const [famGender, setFamGender] = useState<'Male' | 'Female'>('Male');
  const [famPhone, setFamPhone] = useState('');
  const [famDob, setFamDob] = useState('');
  const [isAddingFamily, setIsAddingFamily] = useState(false);

  // Transfer state
  const [transferHistory, setTransferHistory] = useState<TransferHistoryRecord[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [centresList, setCentresList] = useState<NetworkCentre[]>([]);
  const [targetCentreId, setTargetCentreId] = useState<number | 'hq' | ''>('');
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(member?.name || '');
  const [editPhone, setEditPhone] = useState(member?.phone || '');
  const [editEmail, setEditEmail] = useState(member?.email || '');
  const [editAddress, setEditAddress] = useState(member?.address || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  useEffect(() => {
    if (!member) return;
    setEditName(member.name);
    setEditPhone(member.phone);
    setEditEmail(member.email);
    setEditAddress(member.address || '');

    // Fetch API Family Members
    const loadFamily = async () => {
      setIsLoadingFamily(true);
      try {
        const res = await fetchFamilyMembersApi(member.id);
        const list = Array.isArray(res) ? res : res?.results || [];
        setFamilyList(list);
      } catch (err) {
        console.warn('Could not load family members API', err);
      } finally {
        setIsLoadingFamily(false);
      }
    };

    // Fetch API Transfer History
    const loadHistory = async () => {
      try {
        const res = await fetchTransferHistoryApi(member.id);
        setTransferHistory(Array.isArray(res) ? res : []);
      } catch (err) {
        console.warn('Could not load transfer history API', err);
      }
    };

    loadFamily();
    loadHistory();
  }, [member]);

  if (!member) return null;

  // Add Family Member Handler (POST /api/families/)
  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingFamily(true);
    try {
      const created = await addFamilyMemberApi({
        member: member.id,
        full_name: famName,
        relationship: famRelation,
        phone: famPhone,
        date_of_birth: famDob || undefined,
      });
      setFamilyList([created, ...familyList]);
      setFamName('');
      setFamPhone('');
      setFamDob('');
      setShowAddFamilyModal(false);
    } catch (err) {
      console.error('Failed to add family member:', err);
    } finally {
      setIsAddingFamily(false);
    }
  };

  // Delete Family Member Handler (DELETE /api/families/{id}/)
  const handleDeleteFamilyMember = async (familyId: number) => {
    try {
      await deleteFamilyMemberApi(familyId);
      setFamilyList(familyList.filter((f) => f.id !== familyId));
    } catch (err) {
      console.error('Failed to delete family member:', err);
    }
  };

  // Transfer Member Handler (POST /api/members/{id}/transfer/)
  const handleOpenTransferModal = async () => {
    setShowTransferModal(true);
    setTransferError(null);
    try {
      const res = await fetchCentresList();
      const list = Array.isArray(res) ? res : res?.results || [];
      setCentresList(list);
      if (list.length > 0) setTargetCentreId(list[0].id);
    } catch (err) {
      console.warn('Could not fetch centres for transfer:', err);
    }
  };

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransferring(true);
    setTransferError(null);
    try {
      await transferMemberApi(
        member.id,
        typeof targetCentreId === 'number' ? targetCentreId : null,
        transferReason || 'Transferred by HQ Admin'
      );
      setShowTransferModal(false);
      onRefreshList?.();
    } catch (err: any) {
      console.error('Failed to transfer member:', err);
      setTransferError(err?.message || 'Failed to transfer member');
    } finally {
      setIsTransferring(false);
    }
  };

  // Edit Member Handler (PATCH /api/members/{id}/)
  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      await updateMemberApi(member.id, {
        full_name: editName,
        phone: editPhone,
        email: editEmail,
        address: editAddress,
      });
      setIsEditing(false);
      onRefreshList?.();
    } catch (err) {
      console.error('Failed to edit member:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Activate / Deactivate Handler (PATCH /api/members/{id}/)
  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      await toggleMemberStatusApi(member.id, member.status !== 'Active');
      onRefreshList?.();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="w-full md:w-[380px] bg-white border-l border-slate-200 h-full flex flex-col shadow-xl animate-fade-in shrink-0 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Member Details
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Member Profile Header Card */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
            {member.name ? member.name[0].toUpperCase() : 'M'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {member.name}
            </h4>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              ID: {member.memberId}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              {member.phone}
            </div>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full ${
            member.status === 'Active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          {member.status}
        </span>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center border-b border-slate-200 px-5 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('info')}
          className={`py-3 px-3 border-b-2 transition-all ${
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Basic Info
        </button>
        <button
          onClick={() => setActiveTab('family')}
          className={`py-3 px-3 border-b-2 transition-all ${
            activeTab === 'family'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Family Members ({familyList.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-3 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
        {activeTab === 'info' && (
          isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-1"
                >
                  {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-3 border border-slate-300 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Full Name</span>
                <span className="font-bold text-slate-900">{member.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Phone</span>
                <span className="font-semibold text-slate-900 font-mono">{member.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-semibold text-slate-900">{member.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="font-semibold text-slate-900">{member.gender}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Date of Birth</span>
                <span className="font-semibold text-slate-900">{member.dateOfBirth || '1990-05-12'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500 font-medium shrink-0">Address</span>
                <span className="font-semibold text-slate-900 text-right">{member.address || '123, Dhanmondi, Dhaka'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Centre</span>
                <span className="font-bold text-blue-700">{member.centre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Plan Holder</span>
                <span className="font-semibold text-slate-900">{member.partner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Registered By</span>
                <span className="font-semibold text-slate-900">{member.registeredBy || 'Admin User'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Registered On</span>
                <span className="font-medium text-slate-600">{member.registeredOn || '2024-01-15 10:30'}</span>
              </div>
            </div>
          )
        )}

        {/* Family Members Tab matching Mockup design */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Family Members</h4>
              <button
                onClick={() => setShowAddFamilyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Family Member</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-[11px]">
                    <th className="py-2 px-2 w-8">#</th>
                    <th className="py-2 px-2">Name</th>
                    <th className="py-2 px-2">Relationship</th>
                    <th className="py-2 px-2">Gender</th>
                    <th className="py-2 px-2">Date of Birth</th>
                    <th className="py-2 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {familyList.length > 0 ? (
                    familyList.map((fam, idx) => (
                      <tr key={fam.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-2 font-bold text-slate-900 whitespace-nowrap">{fam.full_name}</td>
                        <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{fam.relationship}</td>
                        <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">Male</td>
                        <td className="py-2.5 px-2 text-slate-500 font-mono whitespace-nowrap">{fam.date_of_birth || '2015-03-10'}</td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1 text-slate-500 hover:text-blue-600">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteFamilyMember(fam.id)}
                              className="p-1 text-slate-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No family members added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="font-bold text-slate-900 mb-2">Transfer & Activity History</div>
            {transferHistory.length > 0 ? (
              transferHistory.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700">Centre Transfer</span>
                    <span className="text-[10px] text-slate-400">{item.transferred_at?.substring(0, 10)}</span>
                  </div>
                  <div className="text-slate-700 text-[11px]">Reason: {item.reason}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <HistoryIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No transfer history recorded.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Family Sub-Modal */}
      {showAddFamilyModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
          <form onSubmit={handleAddFamilyMember} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Add Family Member</span>
              <button type="button" onClick={() => setShowAddFamilyModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={famName}
                onChange={(e) => setFamName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Relationship *</label>
                <select
                  value={famRelation}
                  onChange={(e) => setFamRelation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={famGender}
                  onChange={(e) => setFamGender(e.target.value as 'Male' | 'Female')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={famPhone}
                  onChange={(e) => setFamPhone(e.target.value)}
                  placeholder="Phone"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={famDob}
                  onChange={(e) => setFamDob(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddFamilyModal(false)}
                className="px-4 py-2 text-xs text-slate-600 border border-slate-200 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingFamily}
                className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
              >
                {isAddingFamily ? 'Saving...' : 'Add Family'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Sub-Modal (Matching exact mockup 100%) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <form onSubmit={handleConfirmTransfer} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Transfer Member</h3>
              <button type="button" onClick={() => setShowTransferModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            {/* Error Banner if any */}
            {transferError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {transferError}
              </div>
            )}

            {/* Info Banner */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                Transfer this member to another centre.
              </div>
            </div>

            {/* Current Centre & New Centre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Centre</label>
                <input
                  type="text"
                  disabled
                  value={member.centre}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Centre <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetCentreId}
                  onChange={(e) => setTargetCentreId(e.target.value === 'hq' ? 'hq' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="hq">HQ (Direct)</option>
                  {centresList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Enter reason for transfer..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-5 py-2.5 text-xs text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isTransferring}
                className="px-6 py-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                {isTransferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-3 gap-2">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel' : 'Edit'}</span>
        </button>

        <button
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border font-bold rounded-xl transition-colors text-xs cursor-pointer ${
            member.status === 'Active'
              ? 'border-rose-300 bg-white text-rose-600 hover:bg-rose-50'
              : 'border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>{member.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
        </button>

        {isHqUser ? (
          <button
            onClick={handleOpenTransferModal}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors text-xs cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
        ) : (
          <div className="flex items-center justify-center text-[10px] text-slate-400 font-semibold border border-slate-200 rounded-xl bg-slate-50">
            HQ Only
          </div>
        )}
      </div>
    </div>
  );
};
