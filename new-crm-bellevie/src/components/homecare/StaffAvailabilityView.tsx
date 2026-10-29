'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ApiHomecareAvailability, homecareAvailabilityApi } from '@/lib/homecareApi';

export const StaffAvailabilityView: React.FC = () => {
  const [availabilityList, setAvailabilityList] = useState<ApiHomecareAvailability[]>([]);
  const [showModal, setShowModal] = useState(false);

  // New slot inputs
  const [staffId, setStaffId] = useState(1);
  const [staffName, setStaffName] = useState('Rakib Hasan');
  const [startDatetime, setStartDatetime] = useState('2026-10-10T10:00:00+06:00');
  const [endDatetime, setEndDatetime] = useState('2026-10-10T14:00:00+06:00');
  const [notes, setNotes] = useState('Morning shift');

  const refreshAvailability = () => {
    homecareAvailabilityApi.getAvailability().then(setAvailabilityList).catch(console.error);
  };

  useEffect(() => {
    refreshAvailability();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    await homecareAvailabilityApi.createAvailability({
      staff: staffId,
      staff_name: staffName,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      is_available: true,
      notes,
    });
    refreshAvailability();
    setShowModal(false);
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Staff Availability (HQ ONLY)</h2>
          <p className="text-xs text-slate-500">View and manage staff duty shifts and schedules</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50">
            <button className="p-1 hover:bg-white rounded text-slate-600 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">October 2026</span>
            <button className="p-1 hover:bg-white rounded text-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Availability
          </button>
        </div>
      </div>

      {/* Add Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create Staff Availability</h3>
            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Staff Member</label>
                <select
                  value={staffId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setStaffId(id);
                    setStaffName(id === 1 ? 'Rakib Hasan' : id === 2 ? 'Nusrat Jahan' : 'Dr. Karim Uddin');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={1}>Rakib Hasan (Nursing)</option>
                  <option value={2}>Nusrat Jahan (Nursing)</option>
                  <option value={3}>Dr. Karim Uddin (Doctor)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Start Datetime (ISO)</label>
                <input
                  type="text"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">End Datetime (ISO)</label>
                <input
                  type="text"
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-sm hover:bg-blue-700"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Grid View */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {daysOfWeek.map((day) => (
            <div key={day} className="bg-slate-50 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">
              {day}
            </div>
          ))}

          {days.map((d) => {
            const daySlots = availabilityList.filter(s => {
              if (!s.start_datetime) return false;
              const dateObj = new Date(s.start_datetime);
              return dateObj.getDate() === d;
            });

            return (
              <div
                key={d}
                className="bg-white min-h-[95px] p-2 hover:bg-slate-50/60 transition-colors flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-slate-400 block mb-1">{d}</span>

                <div className="space-y-1 overflow-y-auto max-h-[70px]">
                  {daySlots.map(slot => (
                    <div
                      key={slot.id}
                      className="p-1.5 rounded-lg text-[10px] font-bold shadow-xs bg-blue-600 text-white flex flex-col"
                    >
                      <span className="truncate">{slot.staff_name || `Staff #${slot.staff}`}</span>
                      <span className="text-[9px] opacity-90">{slot.notes || 'Available'}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
