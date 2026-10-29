'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { hqDashboardData, ncDashboardData, ViewType } from '@/data/dashboardData';
import { HqPharmacyView } from '@/components/pharmacy/HqPharmacyView';
import { NcPharmacyView } from '@/components/pharmacy/NcPharmacyView';
import { ChevronRight as BreadcrumbArrow } from 'lucide-react';

export default function PharmacyPage() {
  const { user } = useAuth();
  
  // Strictly enforce role-based view from authenticated user context (HQ vs NC)
  const currentView: ViewType = user?.role === 'NC' ? 'NC' : 'HQ';
  const isNcView = currentView === 'NC';

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeConfig = isNcView ? ncDashboardData : hqDashboardData;

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        collapsed={sidebarCollapsed}
        activeItem="Pharmacy"
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          config={activeConfig}
          currentView={currentView}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-5 overflow-y-auto min-w-0">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer">BelleVie Network</span>
            <BreadcrumbArrow className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">
              {isNcView ? 'Pharmacy Order Desk (Network Centre)' : 'Pharmacy Management (HQ Admin)'}
            </span>
          </div>

          {/* Role-Based Pharmacy View */}
          {isNcView ? (
            <NcPharmacyView userCentreName="Dhaka Centre" />
          ) : (
            <HqPharmacyView />
          )}

        </main>
      </div>
    </div>
  );
}
