'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { hqDashboardData, ncDashboardData, ViewType } from '@/data/dashboardData';
import { HqFinanceView } from '@/components/finance/HqFinanceView';
import { NcFinanceView } from '@/components/finance/NcFinanceView';
import { ChevronRight as BreadcrumbArrow, CreditCard, AlertCircle } from 'lucide-react';

function BillingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') || 'overview';

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
        activeItem="Billing & Payments"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          config={activeConfig}
          currentView={currentView}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 p-6 space-y-4 overflow-y-auto min-w-0">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hover:text-slate-800 cursor-pointer flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Billing & Payments
            </span>
            <BreadcrumbArrow className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold">
              {isNcView ? 'Network Centre Finance Dashboard' : 'HQ Admin Finance Management'}
            </span>
          </div>

          {/* Important Payment Notice (English & Bangla) */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-xs flex items-start gap-3.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-amber-200 text-amber-900">
                  Notice / বিজ্ঞপ্তি
                </span>
                <span className="font-bold text-amber-950 text-xs">
                  Payment Verification & Non-Refundable Policy
                </span>
              </div>
              <p className="text-amber-900 leading-relaxed font-medium">
                <strong className="font-bold text-amber-950">English:</strong> Once a payment is verified, it is strictly non-refundable.
              </p>
              <p className="text-amber-900 leading-relaxed font-medium">
                <strong className="font-bold text-amber-950">বাংলা:</strong> পেমেন্ট একবার ভেরিফাই (যাচাই) সম্পন্ন হয়ে গেলে তা আর কোনো অবস্থাতেই ফেরতযোগ্য নয়।
              </p>
            </div>
          </div>

          {/* View rendering */}
          {isNcView ? (
            <NcFinanceView
              initialTab={tabParam}
              userCentreName={typeof window !== 'undefined' ? (localStorage.getItem('active_nc_name') || undefined) : undefined}
            />
          ) : (
            <HqFinanceView initialTab={tabParam} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading Billing...</div>}>
      <BillingContent />
    </Suspense>
  );
}

