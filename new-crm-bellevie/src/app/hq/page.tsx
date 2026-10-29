'use client';

import React, { useState, useEffect } from 'react';
import { hqDashboardData, DashboardViewConfig } from '@/data/dashboardData';
import { fetchDashboardData } from '@/lib/dashboardApi';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { ServiceTrendChart } from '@/components/ServiceTrendChart';
import { DonutChart } from '@/components/DonutChart';
import { TablesSection } from '@/components/TablesSection';

export default function HqDashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('Dashboard');
  const [data, setData] = useState<DashboardViewConfig>(hqDashboardData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchDashboardData('HQ')
      .then((res) => {
        if (isMounted && res) {
          setData(res);
        }
      })
      .catch((err) => {
        console.error('Error fetching HQ dashboard:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F3F5F9] font-sans antialiased text-slate-900">
      <Sidebar
        currentView="HQ"
        collapsed={sidebarCollapsed}
        activeItem={activeMenuItem}
        onSelectMenuItem={setActiveMenuItem}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          config={data}
          currentView="HQ"
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 p-4 md:p-5 xl:p-6 space-y-4 md:space-y-5 xl:space-y-6 overflow-y-auto">
          {/* Top Metrics (8 Cards arranged 4 per row) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[...data.metricsRow1, ...data.metricsRow2].map((metric) => (
              <MetricCard key={metric.id} data={metric} />
            ))}
          </section>

          {/* Middle Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 xl:gap-6">
            <div className="lg:col-span-12 xl:col-span-6 2xl:col-span-6">
              <ServiceTrendChart
                data={data.trendData}
                maxScale={data.trendMaxScale}
                scaleSteps={data.trendScaleSteps}
              />
            </div>
            <div className="lg:col-span-6 xl:col-span-3 2xl:col-span-3">
              <DonutChart
                title="Ambulance Requests by Status"
                total={data.ambulanceStatus.total}
                segments={data.ambulanceStatus.segments}
              />
            </div>
            <div className="lg:col-span-6 xl:col-span-3 2xl:col-span-3">
              <DonutChart
                title="Homecare Requests by Status"
                total={data.homecareStatus.total}
                segments={data.homecareStatus.segments}
              />
            </div>
          </section>

          {/* Bottom Tables */}
          <section className="pt-2">
            <TablesSection
              hospitalBookings={data.hospitalBookings}
              ambulanceRequests={data.ambulanceRequests}
              homecareRequests={data.homecareRequests}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

