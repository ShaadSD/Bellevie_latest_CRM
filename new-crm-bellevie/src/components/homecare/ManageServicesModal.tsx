'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Stethoscope, AlertCircle } from 'lucide-react';
import { ApiHomecareService, ApiHomecareCategory, homecareServiceApi } from '@/lib/homecareApi';

export const ManageServicesSection: React.FC = () => {
  const [services, setServices] = useState<ApiHomecareService[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New service form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ApiHomecareCategory>('NURSING');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [basePrice, setBasePrice] = useState('1500.00');

  const refreshServices = () => {
    homecareServiceApi.getAllServices().then(setServices).catch(console.error);
  };

  useEffect(() => {
    refreshServices();
  }, []);

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    await homecareServiceApi.updateService(id, { is_active: !currentStatus });
    refreshServices();
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await homecareServiceApi.createService({
      name,
      category,
      duration_minutes: durationMinutes,
      base_price: basePrice,
      is_published: true,
      is_active: true,
    });
    refreshServices();
    setName('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Homecare Services Management (HQ ONLY)</h2>
          <p className="text-xs text-slate-500">Configure catalog prices, duration, and publication status</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {/* Add New Service Form */}
      {showAddForm && (
        <form onSubmit={handleCreateService} className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Service Name</label>
            <input
              type="text"
              placeholder="e.g. Home Nursing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ApiHomecareCategory)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="DOCTOR">DOCTOR</option>
              <option value="NURSING">NURSING</option>
              <option value="PHYSIOTHERAPY">PHYSIOTHERAPY</option>
              <option value="SAMPLE">SAMPLE</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Duration (Min)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Base Price (৳)</label>
            <input
              type="text"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
            >
              Save Service
            </button>
          </div>
        </form>
      )}

      {/* Services Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-6">Service</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Duration</th>
              <th className="py-3.5 px-4">Base Price</th>
              <th className="py-3.5 px-4 text-center">Published</th>
              <th className="py-3.5 px-4 text-center">Active</th>
              <th className="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {services.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  {item.name}
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    {item.category_name || item.category_display || item.category}
                  </span>
                </td>
                <td className="py-4 px-4 text-slate-600">{item.duration_minutes} min</td>
                <td className="py-4 px-4 font-bold text-slate-900">৳{item.base_price}</td>
                <td className="py-4 px-4 text-center">
                  {item.is_published ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-[11px]">
                      Yes
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold text-[11px]">
                      No
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  {item.is_active ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-[11px]">
                      Yes
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 font-semibold text-[11px]">
                      No
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => handleToggleActive(item.id, item.is_active)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {item.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
