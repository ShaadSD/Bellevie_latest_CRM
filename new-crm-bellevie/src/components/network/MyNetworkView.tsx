'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MoreVertical,
  UserCheck
} from 'lucide-react';
import { Partner, HealthRepresentative, getPartners, getRepresentatives } from '@/lib/networkApi';
import { AddPartnerModal } from './AddPartnerModal';
import { AddRepresentativeModal } from './AddRepresentativeModal';

interface MyNetworkViewProps {
  userCentreName?: string;
  activeTab?: 'partners' | 'representatives';
}

export const MyNetworkView: React.FC<MyNetworkViewProps> = ({
  userCentreName = 'Dhaka Network Centre',
  activeTab: initialTab = 'partners',
}) => {
  const [currentTab, setCurrentTab] = useState<'partners' | 'representatives'>(initialTab);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [representatives, setRepresentatives] = useState<HealthRepresentative[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [isAddRepOpen, setIsAddRepOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [partnersData, repsData] = await Promise.all([
        getPartners(),
        getRepresentatives(),
      ]);

      setPartners(partnersData);
      setRepresentatives(repsData);
    } catch (err) {
      console.error('Failed to load NC network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && p.is_active) ||
        (selectedStatus === 'INACTIVE' && !p.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [partners, searchTerm, selectedStatus]);

  // Filtered representatives
  const filteredRepresentatives = useMemo(() => {
    return representatives.filter((r) => {
      const matchesSearch =
        !searchTerm ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm) ||
        (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && r.is_active) ||
        (selectedStatus === 'INACTIVE' && !r.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [representatives, searchTerm, selectedStatus]);

  const totalItems = currentTab === 'partners' ? filteredPartners.length : filteredRepresentatives.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPartners.slice(start, start + itemsPerPage);
  }, [filteredPartners, currentPage]);

  const paginatedRepresentatives = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRepresentatives.slice(start, start + itemsPerPage);
  }, [filteredRepresentatives, currentPage]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
            <span>Network</span>
            <span>&gt;</span>
            <span className="font-bold">{currentTab === 'partners' ? 'My Partners' : 'My Representatives'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {currentTab === 'partners' ? 'My Partners' : 'My Representatives'}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {currentTab === 'partners'
              ? `Manage partners for your network centre (${userCentreName}).`
              : `Manage health representatives for your network centre (${userCentreName}).`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {currentTab === 'partners' ? (
            <button
              onClick={() => setIsAddPartnerOpen(true)}
              className="px-5 py-2.5 bg-[#00A86B] hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Partner</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddRepOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Representative</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={() => {
            setCurrentTab('partners');
            setCurrentPage(1);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            currentTab === 'partners'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Partners ({partners.length})</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('representatives');
            setCurrentPage(1);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            currentTab === 'representatives'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>My Representatives ({representatives.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={
              currentTab === 'partners'
                ? 'Search partner name, phone, email...'
                : 'Search representative name, phone, email...'
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Loading {currentTab}...
                  </td>
                </tr>
              ) : currentTab === 'partners' ? (
                paginatedPartners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      No partners found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedPartners.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-semibold">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-4 font-mono">{item.phone}</td>
                      <td className="py-3.5 px-4 text-slate-600">{item.email || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        {item.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                            View
                          </button>
                          <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                paginatedRepresentatives.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      No health representatives found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRepresentatives.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-semibold">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-4 font-mono">{item.phone}</td>
                      <td className="py-3.5 px-4 text-slate-600">{item.email || 'N/A'}</td>
                      <td className="py-3.5 px-4">
                        {item.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors">
                            View
                          </button>
                          <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <div>
            Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {currentTab}
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

      {/* Modals */}
      <AddPartnerModal
        isOpen={isAddPartnerOpen}
        onClose={() => setIsAddPartnerOpen(false)}
        onSuccess={loadData}
        centreName={userCentreName}
      />

      <AddRepresentativeModal
        isOpen={isAddRepOpen}
        onClose={() => setIsAddRepOpen(false)}
        onSuccess={loadData}
        centreName={userCentreName}
      />
    </div>
  );
};
