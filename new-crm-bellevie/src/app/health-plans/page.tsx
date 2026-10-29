'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { hqDashboardData, ncDashboardData, ViewType } from '@/data/dashboardData';
import { HqHealthPlansView } from '@/components/health-plans/HqHealthPlansView';
import { NcHealthPlansView } from '@/components/health-plans/NcHealthPlansView';
import { ChevronRight as BreadcrumbArrow, ShieldCheck } from 'lucide-react';

export default function HealthPlansPage() {
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
        activeItem="Health Plans"
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
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Health Plans
            </span>
            <BreadcrumbArrow className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">
              {isNcView ? 'Health Protection Plans Comparison (Network Centre)' : 'Health Protection Plans Management (HQ Admin)'}
            </span>
          </div>

          {/* Role-Based Health Plans View */}
          {isNcView ? (
            <NcHealthPlansView userCentreName={user?.subtext || 'Dhanmondi Network Centre'} />
          ) : (
            <HqHealthPlansView />
          )}
        </main>
      </div>
    </div>
  );
}
