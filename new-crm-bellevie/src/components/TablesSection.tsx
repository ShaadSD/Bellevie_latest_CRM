'use client';

import React from 'react';
import { 
  HospitalBooking, 
  AmbulanceRequest, 
  HomecareRequest, 
  CrmFollowUp, 
  CrmTask 
} from '@/data/dashboardData';

interface TablesSectionProps {
  hospitalBookings: HospitalBooking[];
  ambulanceRequests: AmbulanceRequest[];
  homecareRequests: HomecareRequest[];
  crmFollowUps?: CrmFollowUp[];
  assignedCrmTasks?: CrmTask[];
}

export const TablesSection: React.FC<TablesSectionProps> = ({
  hospitalBookings,
  ambulanceRequests,
  homecareRequests,
  crmFollowUps,
  assignedCrmTasks
}) => {

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'APPROVED':
      case 'VERIFIED':
      case 'OPEN':
        return (
          <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-700 tracking-wider">
            {status}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-md bg-amber-100 text-amber-700 tracking-wider">
            {status}
          </span>
        );
      case 'VERIFYING':
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return (
          <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-md bg-sky-100 text-sky-700 tracking-wider">
            {status}
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-md bg-red-100 text-red-700 tracking-wider">
            {status}
          </span>
        );
      case 'WAITING':
        return (
          <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-md bg-orange-100 text-orange-700 tracking-wider">
            WAITING
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-md bg-slate-100 text-slate-700 tracking-wider">
            {status}
          </span>
        );
    }
  };

  const renderPriorityBadge = (priority: 'HIGH' | 'NORMAL') => {
    if (priority === 'HIGH') {
      return (
        <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded bg-red-100 text-red-700 tracking-wider">
          HIGH
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded bg-amber-100 text-amber-700 tracking-wider">
        NORMAL
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Hospital Bookings, Ambulance Requests, Homecare Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 xl:gap-6">
        
        {/* Table 1: Hospital Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recent Hospital Bookings
              </h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase">
                    <th className="py-2 px-1">#</th>
                    <th className="py-2 px-2">Member</th>
                    <th className="py-2 px-2">Hospital</th>
                    <th className="py-2 px-2">Bed Type</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-1 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {hospitalBookings.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-1 font-semibold text-slate-500 whitespace-nowrap">{row.id}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900 whitespace-nowrap">{row.member}</td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{row.hospital}</td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{row.bedType}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">{renderStatusBadge(row.status)}</td>
                      <td className="py-2.5 px-1 text-right text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Table 2: Ambulance Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recent Ambulance Requests
              </h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase">
                    <th className="py-2 px-1">#</th>
                    <th className="py-2 px-2">Member</th>
                    <th className="py-2 px-2">Vehicle</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-1 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {ambulanceRequests.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-1 font-semibold text-slate-500 whitespace-nowrap">{row.id}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900 whitespace-nowrap">{row.member}</td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{row.vehicle}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">{renderStatusBadge(row.status)}</td>
                      <td className="py-2.5 px-1 text-right text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Table 3: Homecare Requests */}
        <div className="md:col-span-2 xl:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recent Homecare Requests
              </h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase">
                    <th className="py-2 px-1">#</th>
                    <th className="py-2 px-2">Member</th>
                    <th className="py-2 px-2">Service</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-1 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {homecareRequests.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-1 font-semibold text-slate-500 whitespace-nowrap">{row.id}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900 whitespace-nowrap">{row.member}</td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{row.service}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">{renderStatusBadge(row.status)}</td>
                      <td className="py-2.5 px-1 text-right text-slate-500 font-medium whitespace-nowrap">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2 (NC View Extra Tables): Upcoming Follow-ups (CRM) & My Assigned CRM Tasks */}
      {crmFollowUps && assignedCrmTasks && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Upcoming Follow-ups (CRM) */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Upcoming Follow-ups (CRM)
              </h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase">
                    <th className="py-2 px-1">#</th>
                    <th className="py-2 px-2">Title</th>
                    <th className="py-2 px-2">Member</th>
                    <th className="py-2 px-2">Next Follow-up</th>
                    <th className="py-2 px-2">Priority</th>
                    <th className="py-2 px-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {crmFollowUps.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-1 font-semibold text-slate-500 whitespace-nowrap">{row.id}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900 whitespace-nowrap">{row.title}</td>
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{row.member}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-medium whitespace-nowrap">{row.nextFollowUp}</td>
                      <td className="py-2.5 px-2 whitespace-nowrap">{renderPriorityBadge(row.priority)}</td>
                      <td className="py-2.5 px-1 text-right whitespace-nowrap">{renderStatusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* My Assigned CRM Tasks */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                My Assigned CRM Tasks
              </h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase">
                    <th className="py-2 px-1">#</th>
                    <th className="py-2 px-2">Title</th>
                    <th className="py-2 px-2">Related Record</th>
                    <th className="py-2 px-2">Due Date</th>
                    <th className="py-2 px-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {assignedCrmTasks.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-1 font-semibold text-slate-500 whitespace-nowrap">{row.id}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900 whitespace-nowrap">{row.title}</td>
                      <td className="py-2.5 px-2 text-blue-600 font-semibold whitespace-nowrap">{row.relatedRecord}</td>
                      <td className="py-2.5 px-2 text-slate-500 font-medium whitespace-nowrap">{row.dueDate}</td>
                      <td className="py-2.5 px-1 text-right whitespace-nowrap">{renderStatusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
