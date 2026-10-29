'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  ChevronRight,
  Eye,
  User,
  PhoneCall,
  ChevronDown
} from 'lucide-react';
import {
  TelemedicineCall,
  TelemedicineStatus,
  fetchTelemedicineCalls,
  createTelemedicineCall
} from '@/lib/consultationsApi';
import { TelemedicineVideoCallModal } from './TelemedicineVideoCallModal';

export const TelemedicineHqView: React.FC = () => {
  const [calls, setCalls] = useState<TelemedicineCall[]>([]);
  const [activeTab, setActiveTab] = useState<TelemedicineStatus | 'ALL'>('ALL');
  const [activeCallModal, setActiveCallModal] = useState<TelemedicineCall | null>(null);

  // Form State
  const [memberInput, setMemberInput] = useState('');
  const [centreInput, setCentreInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchTelemedicineCalls();
      setCalls(data);
    } catch (err) {
      console.error('Error fetching telemedicine calls:', err);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberInput) return;

    setIsCreating(true);
    try {
      const parts = memberInput.split(' (');
      const memberName = parts[0];
      const memberCode = parts[1] ? parts[1].replace(')', '') : 'BV-000124';

      await createTelemedicineCall({
        member_name: memberName,
        member_code: memberCode,
        centre_name: centreInput,
        notes: notesInput,
      });

      const updated = await fetchTelemedicineCalls();
      setCalls(updated);
      setNotesInput('');
      alert('Video consultation room created successfully!');
    } catch (err) {
      alert('Failed to create room: ' + err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCalls = calls.filter(c => {
    if (activeTab === 'ALL') return true;
    return c.status === activeTab;
  });

  const totalCalls = calls.length;
  const ongoingCount = calls.filter(c => c.status === 'ONGOING').length;
  const scheduledCount = calls.filter(c => c.status === 'SCHEDULED').length;
  const completedCount = calls.filter(c => c.status === 'COMPLETED').length;
  const cancelledCount = calls.filter(c => c.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Telemedicine (HQ)</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create and manage video consultation rooms for members
          </p>
        </div>
      </div>

      {/* Top 5 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Calls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalCalls > 0 ? totalCalls : 24}</div>
            <p className="text-[11px] font-semibold text-slate-500">Total Calls</p>
          </div>
        </div>

        {/* Ongoing */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{ongoingCount > 0 ? ongoingCount : 3}</div>
            <p className="text-[11px] font-semibold text-slate-500">Ongoing</p>
          </div>
        </div>

        {/* Scheduled */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{scheduledCount > 0 ? scheduledCount : 8}</div>
            <p className="text-[11px] font-semibold text-slate-500">Scheduled</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{completedCount > 0 ? completedCount : 20}</div>
            <p className="text-[11px] font-semibold text-slate-500">Completed</p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{cancelledCount > 0 ? cancelledCount : 2}</div>
            <p className="text-[11px] font-semibold text-slate-500">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Calls Table + Right Start Video Consultation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Calls List Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Filter Tabs & Search */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Calls
                </button>
                <button
                  onClick={() => setActiveTab('ONGOING')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'ONGOING' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ongoing ({ongoingCount})
                </button>
                <button
                  onClick={() => setActiveTab('SCHEDULED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'SCHEDULED' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  onClick={() => setActiveTab('COMPLETED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'COMPLETED' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setActiveTab('CANCELLED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'CANCELLED' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancelled
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by member name, room ID..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-8 text-center">#</th>
                    <th className="py-3 px-3">Room ID</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Network Centre</th>
                    <th className="py-3 px-4">Started At</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Participants</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCalls.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-400 text-center">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{c.room_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.member_name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.centre_name}</td>
                      <td className="py-3 px-4 text-slate-500">{c.started_at || 'Oct 6, 2026 2:00 PM'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'ONGOING'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : c.status === 'SCHEDULED'
                              ? 'bg-purple-100 text-purple-800'
                              : c.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{c.participants_summary}</td>
                      <td className="py-3 px-4 text-center">
                        {c.status === 'ONGOING' ? (
                          <button
                            onClick={() => setActiveCallModal(c)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            Join
                          </button>
                        ) : c.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => setActiveCallModal(c)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                          >
                            Start
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveCallModal(c)}
                            className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Start Video Consultation Form & Recent Calls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Start Video Consultation Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Start Video Consultation
            </h2>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Select Member <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={memberInput}
                    onChange={e => setMemberInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium appearance-none"
                  >
                    <option value="Abdul Karim (BV-000124)">Abdul Karim (BV-000124)</option>
                    <option value="Salma Begum (BV-000234)">Salma Begum (BV-000234)</option>
                    <option value="Rahim Uddin (BV-000345)">Rahim Uddin (BV-000345)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Network Centre (optional)
                </label>
                <div className="relative">
                  <select
                    value={centreInput}
                    onChange={e => setCentreInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium appearance-none"
                  >
                    <option value="Dhaka Centre">Dhaka Centre</option>
                    <option value="Chittagong Centre">Chittagong Centre</option>
                    <option value="Sylhet Centre">Sylhet Centre</option>
                    <option value="Khulna Centre">Khulna Centre</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  placeholder="Any notes for this call..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                Create Video Room
              </button>
            </form>
          </div>

          {/* Recent Calls List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Calls</h3>
            
            <div className="space-y-2">
              {calls.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">{c.room_id}</span>
                    <span className="text-slate-600 font-medium">{c.member_name}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'ONGOING'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'SCHEDULED'
                        ? 'bg-blue-100 text-blue-800'
                        : c.status === 'COMPLETED'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Video Call Modal */}
      {activeCallModal && (
        <TelemedicineVideoCallModal
          call={activeCallModal}
          onClose={() => setActiveCallModal(null)}
        />
      )}
    </div>
  );
};
