'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { hqDashboardData, ncDashboardData, ViewType } from '@/data/dashboardData';
import { ForeignConsultationHqView } from '@/components/consultations/ForeignConsultationHqView';
import { ForeignConsultationNcView } from '@/components/consultations/ForeignConsultationNcView';
import { ChevronRight as BreadcrumbArrow, Globe } from 'lucide-react';

export default function ForeignConsultationPage() {
  const { user } = useAuth();

  // Role-based view: HQ vs NC
  const currentView: ViewType = user?.role === 'NC' ? 'NC' : 'HQ';
  const isNcView = currentView === 'NC';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeConfig = isNcView ? ncDashboardData : hqDashboardData;

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        collapsed={sidebarCollapsed}
        activeItem="Foreign Consultation"
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          config={activeConfig}
          currentView={currentView}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-5 overflow-y-auto min-w-0">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" /> Consultations
            </span>
            <BreadcrumbArrow className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">
              {isNcView ? 'Foreign Doctor Consultation (Network Centre)' : 'Foreign Doctor Consultation (HQ Admin)'}
            </span>
          </div>

          {/* Role-Based View */}
          {isNcView ? (
            <ForeignConsultationNcView userCentreName={user?.subtext || 'Dhaka Centre'} />
          ) : (
            <ForeignConsultationHqView />
          )}
        </main>
      </div>
    </div>
  );
}
