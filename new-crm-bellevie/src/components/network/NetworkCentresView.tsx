'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Power,
  Shield,
  Clock
} from 'lucide-react';

import {
  NetworkCentre,
  Region,
  getNetworkCentres,
  getRegions,
  updateNetworkCentre,
} from '@/lib/networkApi';
import { RegisterCentreModal } from './RegisterCentreModal';

export const NetworkCentresView: React.FC = () => {
  const [centres, setCentres] = useState<NetworkCentre[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Selected centre details
  const [selectedCentre, setSelectedCentre] = useState<NetworkCentre | null>(null);

  // Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async () => {
    setLoading(true);
    try {
      const [centresData, regionsData] = await Promise.all([
        getNetworkCentres(),
        getRegions(),
      ]);

      setCentres(centresData);
      setRegions(regionsData);

      if (centresData.length > 0 && !selectedCentre) {
        setSelectedCentre(centresData[0]);
      } else if (selectedCentre) {
        const updatedSelected = centresData.find((c) => c.id === selectedCentre.id);
        if (updatedSelected) setSelectedCentre(updatedSelected);
      }
    } catch (err) {
      console.error('Failed to load network centres API data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered centres using API data
  const filteredCentres = useMemo(() => {
    return centres.filter((c) => {
      const regionName = (c as any).region_name || regions.find((r) => r.id === c.region)?.name || '';
      const matchesSearch =
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.username && c.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        regionName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = selectedRegionId === 'ALL' || c.region === Number(selectedRegionId);
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && c.is_active) ||
        (selectedStatus === 'INACTIVE' && !c.is_active);

      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [centres, regions, searchTerm, selectedRegionId, selectedStatus]);

  // Dynamic Statistics computed from live API
  const totalCentresCount = centres.length;
  const activeCentresCount = centres.filter((c) => c.is_active).length;
  const inactiveCentresCount = totalCentresCount - activeCentresCount;

  // Pagination calculation
  const totalPages = Math.ceil(filteredCentres.length / itemsPerPage) || 1;
  const paginatedCentres = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCentres.slice(start, start + itemsPerPage);
  }, [filteredCentres, currentPage]);

  const handleToggleCentreStatus = async (centre: NetworkCentre) => {
    try {
      await updateNetworkCentre(centre.id, { is_active: !centre.is_active });
      await loadData();
    } catch (err) {
      console.error('Failed to update centre status:', err);
    }
  };

  const getRegionName = (centre: NetworkCentre) => {
    return (centre as any).region_name || regions.find((r) => r.id === centre.region)?.name || `Region #${centre.region}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Network Centres</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Manage all network centres across BelleVie Healthcare Network via real API.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-5 py-2.5 bg-[#1D61E8] hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Register Centre</span>
        </button>
      </div>

      {/* KPI Stats Cards (Computed from API data) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Centres */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Centres</span>
            <div className="text-2xl font-black text-slate-900">{totalCentresCount}</div>
            <div className="text-xs font-semibold text-blue-600">Active API Dataset</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Active Centres */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Centres</span>
            <div className="text-2xl font-black text-slate-900">{activeCentresCount}</div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{Math.round((activeCentresCount / (totalCentresCount || 1)) * 100)}% active</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Inactive Centres */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inactive Centres</span>
            <div className="text-2xl font-black text-slate-900">{inactiveCentresCount}</div>
            <div className="text-xs font-bold text-rose-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              <span>{Math.round((inactiveCentresCount / (totalCentresCount || 1)) * 100)}% inactive</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, region, phone, email or username..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Region filter from API */}
          <select
            value={selectedRegionId}
            onChange={(e) => {
              setSelectedRegionId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Regions</option>
            {regions.map((reg) => (
              <option key={reg.id} value={reg.id}>
                {reg.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Clear button */}
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedRegionId('ALL');
              setSelectedStatus('ALL');
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Main Centres Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Centre Name</th>
                <th className="py-3.5 px-4">Region</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Fetching centres from API...
                  </td>
                </tr>
              ) : paginatedCentres.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    No network centres found.
                  </td>
                </tr>
              ) : (
                paginatedCentres.map((centre, index) => {
                  const isSelected = selectedCentre?.id === centre.id;
                  const regionName = getRegionName(centre);

                  return (
                    <tr
                      key={centre.id}
                      onClick={() => setSelectedCentre(centre)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-slate-400 font-semibold">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{centre.name}</td>
                      <td className="py-3.5 px-4">{regionName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{centre.username || '—'}</td>
                      <td className="py-3.5 px-4 font-mono">{centre.phone}</td>
                      <td className="py-3.5 px-4 text-slate-600">{centre.email || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        {centre.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCentre(centre)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => handleToggleCentreStatus(centre)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              centre.is_active
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={centre.is_active ? 'Deactivate Centre' : 'Activate Centre'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <div>
            Showing {filteredCentres.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredCentres.length)} of {filteredCentres.length} centres
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold">
              {currentPage}
            </span>
            <span className="text-slate-400">/ {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Centre Real API Details Card */}
      {selectedCentre && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{selectedCentre.name}</h2>
                  {selectedCentre.is_active ? (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-xs font-bold">
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-xs font-bold">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Public ID: <span className="font-mono text-slate-700">{selectedCentre.public_id}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleCentreStatus(selectedCentre)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  selectedCentre.is_active
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{selectedCentre.is_active ? 'Deactivate Centre' : 'Activate Centre'}</span>
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Centre Information */}
            <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Centre Details</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Name</span>
                  <span className="text-slate-900 font-bold">{selectedCentre.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Region</span>
                  <span className="text-slate-900 font-bold">{getRegionName(selectedCentre)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Phone</span>
                  <span className="text-slate-900 font-bold font-mono">{selectedCentre.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Email</span>
                  <span className="text-slate-900 font-bold">{selectedCentre.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Address</span>
                  <span className="text-slate-900 font-semibold leading-relaxed block bg-white p-2.5 rounded-xl border border-slate-200/60">
                    {selectedCentre.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Account & System Information */}
            <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Account & Access Information</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">User Account ID</span>
                  <span className="text-slate-900 font-bold font-mono">{selectedCentre.user || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Username</span>
                  <span className="text-slate-900 font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedCentre.username || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Role</span>
                  <span className="text-slate-900 font-bold">{selectedCentre.user_role || 'NETWORK_CENTRE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Account Status</span>
                  <span className={selectedCentre.is_active ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                    {selectedCentre.is_active ? 'Active Account' : 'Inactive Account'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-slate-400 font-semibold">Registered Date</span>
                  <span className="text-slate-900 font-medium">
                    {selectedCentre.created_at
                      ? new Date(selectedCentre.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Registering New Network Centre */}
      <RegisterCentreModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
