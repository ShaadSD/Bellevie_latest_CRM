'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Loader2, Info } from 'lucide-react';
import { 
  fetchCentresList, 
  fetchPartnersList, 
  registerMemberApi, 
  NetworkCentre, 
  NetworkPartner 
} from '@/lib/membersApi';
import { useAuth } from '@/context/AuthContext';

interface RegisterMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: () => void;
}

export const RegisterMemberModal: React.FC<RegisterMemberModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess
}) => {
  const { user } = useAuth();
  const isHqUser = user?.role === 'HQ';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');

  
  const [centres, setCentres] = useState<NetworkCentre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<number | string | 'hq'>('');
  
  const [partners, setPartners] = useState<NetworkPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');

  const [isLoadingCentres, setIsLoadingCentres] = useState(false);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Centres List on open
  useEffect(() => {
    if (!isOpen) return;

    const loadCentres = async () => {
      setIsLoadingCentres(true);
      try {
        const res = await fetchCentresList();
        const list = Array.isArray(res) ? res : res?.results || [];
        setCentres(list);
        if (list.length > 0) {
          setSelectedCentreId(list[0].id);
        }
      } catch (err) {
        console.warn('Could not fetch centres from API:', err);
      } finally {
        setIsLoadingCentres(false);
      }
    };

    loadCentres();
  }, [isOpen]);

  // Load Partners List when selected centre changes
  useEffect(() => {
    if (!isOpen) return;

    const loadPartners = async () => {
      setIsLoadingPartners(true);
      try {
        const res = await fetchPartnersList(selectedCentreId);
        const list = Array.isArray(res) ? res : res?.results || [];
        setPartners(list);
        if (list.length > 0) {
          setSelectedPartnerId(list[0].id);
        } else {
          setSelectedPartnerId('');
        }
      } catch (err) {
        console.warn('Could not fetch partners from API:', err);
        setPartners([]);
      } finally {
        setIsLoadingPartners(false);
      }
    };

    if (selectedCentreId) {
      loadPartners();
    }
  }, [selectedCentreId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const finalCentreId = typeof selectedCentreId === 'number' 
        ? selectedCentreId 
        : (centres.length > 0 ? centres[0].id : null);

      await registerMemberApi({
        full_name: fullName,
        phone,
        email,
        gender: gender.toUpperCase(),
        date_of_birth: dateOfBirth || undefined,
        blood_group: bloodGroup || undefined,
        address: address || undefined,
        assigned_centre: finalCentreId,
        partner: typeof selectedPartnerId === 'number' ? selectedPartnerId : null,
        is_active: true,
      });

      setFullName('');
      setPhone('');
      setEmail('');
      setDateOfBirth('');
      setBloodGroup('');
      setAddress('');

      onRegisterSuccess();
      onClose();
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMsg(err.message || 'Failed to register member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Register New Member
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Fill in the details to register a new member
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form matching exact mockup layout */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Row 1: Full Name, Phone, Email */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Member's full name"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Gender Radio Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Gender
            </label>
            <div className="flex items-center gap-6 text-xs text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'Male'}
                  onChange={() => setGender('Male')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'Female'}
                  onChange={() => setGender('Female')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold">Female</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'Other'}
                  onChange={() => setGender('Other')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold">Other</span>
              </label>
            </div>
          </div>

          {/* Row 3: Date of Birth & Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>


          {/* Row 4: Address Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Address
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Row 5: Assigned Centre & Partner Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Assigned Centre */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Assigned Centre <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value === 'hq' ? 'hq' : Number(e.target.value))}
                disabled={!isHqUser || isLoadingCentres}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                {isHqUser && <option value="hq">HQ Managed (Direct)</option>}
              </select>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                {!isHqUser ? '(Auto-assigned to your centre)' : '(Select target centre or HQ)'}
              </p>
            </div>

            {/* Plan Holder */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Plan Holder
              </label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value ? Number(e.target.value) : '')}
                disabled={isLoadingPartners}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Select a plan holder</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Select a plan holder from the same centre
              </p>
            </div>

          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Member</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
