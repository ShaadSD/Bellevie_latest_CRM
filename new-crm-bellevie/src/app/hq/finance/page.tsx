'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { hqDashboardData } from '@/data/dashboardData';
import { HqFinanceView } from '@/components/finance/HqFinanceView';
import { ChevronRight as BreadcrumbArrow, CreditCard } from 'lucide-react';

function HqFinanceContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'overview';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#F3F5F9] font-sans antialiased text-slate-900 overflow-hidden">
      <Sidebar
        currentView="HQ"
        collapsed={sidebarCollapsed}
        activeItem="Finance"
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          config={hqDashboardData}
          currentView="HQ"
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 p-6 space-y-5 overflow-y-auto min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" /> HQ Admin
            </span>
            <BreadcrumbArrow className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">Finance Management</span>
          </div>
          <HqFinanceView initialTab={tabParam} />
        </main>
      </div>
    </div>
  );
}

export default function HqFinancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading Finance...</div>}>
      <HqFinanceContent />
    </Suspense>
  );
}

