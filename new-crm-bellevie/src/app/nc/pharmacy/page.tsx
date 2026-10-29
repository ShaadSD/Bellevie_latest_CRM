'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ncDashboardData } from '@/data/dashboardData';
import { NcPharmacyView } from '@/components/pharmacy/NcPharmacyView';
import { ChevronRight as BreadcrumbArrow } from 'lucide-react';

export default function NcPharmacyPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans antialiased text-slate-900 overflow-hidden">
      <Sidebar
        currentView="NC"
        collapsed={sidebarCollapsed}
        activeItem="Pharmacy"
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          config={ncDashboardData}
          currentView="NC"
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 p-6 space-y-5 overflow-y-auto min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer">Network Centre</span>
            <BreadcrumbArrow className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">Pharmacy Module</span>
          </div>
          <NcPharmacyView userCentreName="Dhaka Centre" />
        </main>
      </div>
    </div>
  );
}
