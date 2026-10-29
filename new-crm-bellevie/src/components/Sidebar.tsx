'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Ambulance,
  Home,
  ShieldCheck,
  Plane,
  CreditCard,
  Heart,
  Video,
  ChevronDown,
  ChevronRight,
  Globe,
  Pill,
  Bell,
  FileText,
  FlaskConical
} from 'lucide-react';
import { ViewType } from '@/data/dashboardData';
import { fetchNotificationsApi } from '@/lib/notificationsApi';

interface SidebarProps {
  currentView: ViewType;
  collapsed?: boolean;
  activeItem?: string;
  onSelectMenuItem?: (item: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  collapsed = false,
  activeItem = 'Dashboard',
  onSelectMenuItem
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Network: Boolean(pathname?.includes('/network') || activeItem?.includes('Network') || activeItem?.includes('Centres')),
    'Billing & Payments': Boolean(pathname?.includes('/finance') || pathname?.includes('/billing') || activeItem?.includes('Billing') || activeItem?.includes('Payment') || activeItem?.includes('Finance'))
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const readIds: string[] = JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
        const activeNc = currentView === 'NC' ? (localStorage.getItem('active_nc_name') || undefined) : undefined;
        const notifications = await fetchNotificationsApi(activeNc ? { network_centre: activeNc } : undefined);
        if (notifications && Array.isArray(notifications)) {
          const count = notifications.filter((n: any) => {
            const notifId = n.notification_id || `NOTIF-${n.id}`;
            if (readIds.includes(String(notifId)) || readIds.includes(String(n.id))) {
              return false;
            }
            if (n.is_read) return false;
            if (currentView === 'NC' && n.target_scope === 'SPECIFIC') {
              const centres: string[] = n.target_centres || [];
              const isTargeted = centres.some((c: string) =>
                c.toLowerCase().includes((activeNc || '').toLowerCase()) ||
                (activeNc || '').toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase() === 'all network centres'
              );
              if (!isTargeted) return false;
            }
            return true;
          }).length;
          setUnreadCount(count);
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        console.warn('[Sidebar] Error fetching unread notifications count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // refresh every 10s
    window.addEventListener('notifications_updated', fetchUnreadCount);
    window.addEventListener('storage', fetchUnreadCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', fetchUnreadCount);
      window.removeEventListener('storage', fetchUnreadCount);
    };
  }, []);

  interface SubMenuItem {
    name: string;
    path: string;
  }

  interface MenuItem {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string;
    badge?: number;
    subItems?: SubMenuItem[];
  }

  const hqMenuItems: MenuItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/hq' },
    { name: 'Network Centres', icon: Globe, path: '/network' },
    { name: 'Members', icon: Users, path: '/members' },
    { name: 'Appointments', icon: Calendar, path: '/appointments' },
    { name: 'Hospital Desk', icon: Building2, path: '/hospital-desk' },
    { name: 'Diagnostics', icon: FlaskConical, path: '/diagnostics' },
    { name: 'Ambulance', icon: Ambulance, path: '/ambulance' },
    { name: 'Homecare', icon: Home, path: '/homecare' },
    { name: 'Pharmacy', icon: Pill, path: '/pharmacy' },
    { name: 'Health Plans', icon: ShieldCheck, path: '/health-plans' },
    { name: 'Foreign Treatment', icon: Plane, path: '/foreign-treatment' },
    { name: 'Notifications', icon: Bell, path: '/hq/notifications', badge: unreadCount > 0 ? unreadCount : undefined },
    { name: 'Billing & Payments', icon: CreditCard, path: '/hq/finance' },
    { name: 'Terms and Conditions', icon: FileText, path: '/terms-and-conditions' }
  ];

  const ncMenuItems: MenuItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/nc' },
    { name: 'Notifications', icon: Bell, path: '/nc/notifications', badge: unreadCount > 0 ? unreadCount : undefined },
    { name: 'Members', icon: Users, path: '/members' },
    { name: 'Appointments', icon: Calendar, path: '/appointments' },
    { name: 'Hospital Desk', icon: Building2, path: '/hospital-desk' },
    { name: 'Diagnostics', icon: FlaskConical, path: '/diagnostics' },
    { name: 'Ambulance', icon: Ambulance, path: '/ambulance' },
    { name: 'Homecare', icon: Home, path: '/homecare' },
    { name: 'Pharmacy', icon: Pill, path: '/pharmacy' },
    { name: 'Health Plans', icon: ShieldCheck, path: '/health-plans' },
    { name: 'Foreign Treatment', icon: Plane, path: '/foreign-treatment' },
    { name: 'Billing & Payments', icon: CreditCard, path: '/nc/finance' },
    { name: 'Terms and Conditions', icon: FileText, path: '/terms-and-conditions' }
  ];

  const menuItems = currentView === 'HQ' ? hqMenuItems : ncMenuItems;

  const handleNavigation = (item: MenuItem) => {
    onSelectMenuItem?.(item.name);

    if (item.subItems) {
      setOpenMenus((prev) => ({ ...prev, [item.name]: !prev[item.name] }));
      if (item.path && item.path !== '#') {
        router.push(item.path);
      }
      return;
    }

    if (item.path && item.path !== '#') {
      router.push(item.path);
    }
  };

  const handleSubItemNavigation = (name: string, path: string) => {
    onSelectMenuItem?.(name);
    router.push(path);
  };

  return (
    <aside
      className={`bg-[#111A2E] text-slate-300 flex flex-col h-screen sticky top-0 transition-all duration-300 z-30 select-none ${collapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Brand Header */}
      <Link 
        href={currentView === 'HQ' ? '/hq' : '/nc'} 
        className="flex items-center gap-4 px-5 py-5 border-b border-slate-800/80 hover:opacity-90 transition-opacity"
      >
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shrink-0 shadow-md border border-white/20">
          <img
            src="/logo.png"
            alt="BelleVie Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-white text-lg tracking-tight leading-none">
              BelleVie
            </span>
            <span className="text-xs text-slate-400 font-medium tracking-normal mt-1.5 whitespace-nowrap">
              Healthcare Network
            </span>
          </div>
        )}
      </Link>

      {/* Menu List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isOpen = openMenus[item.name] || false;
          const isSubActive = item.subItems?.some(s => pathname === s.path || activeItem === s.name);
          const isActive = activeItem === item.name || isSubActive || (item.path !== '#' && pathname === item.path);

          return (
            <div key={item.name} className="space-y-1">
              <button
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                  ? 'bg-[#1D61E8] text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate flex-1 text-left">{item.name}</span>}

                {!collapsed && item.subItems && (
                  isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )
                )}

                {!collapsed && item.badge !== undefined && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Sub items dropdown */}
              {!collapsed && item.subItems && isOpen && (
                <div className="pl-9 pr-2 space-y-1 py-1 border-l-2 border-blue-600/40 ml-4">
                  {item.subItems.map((sub) => {
                    const isSubItemSelected = pathname === sub.path || activeItem === sub.name;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => handleSubItemNavigation(sub.name, sub.path)}
                        className={`w-full text-left px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${isSubItemSelected
                          ? 'bg-blue-600/20 text-blue-400 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Context indicator */}
      {!collapsed && (
        <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <div className="text-xs text-slate-400">Current View Context</div>
          <div className="text-xs font-bold text-white mt-0.5 flex items-center justify-between">
            <span>{currentView === 'HQ' ? '🏢 HQ Head Office' : '🏥 Network Centre (NC)'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      )}
    </aside>
  );
};
