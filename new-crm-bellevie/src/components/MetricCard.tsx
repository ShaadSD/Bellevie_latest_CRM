'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  FileText, 
  Calendar, 
  Ambulance, 
  Home, 
  ShieldCheck, 
  Plane, 
  Briefcase, 
  CheckSquare,
  Clock,
  DollarSign,
} from 'lucide-react';
import { MetricCardData } from '@/data/dashboardData';

interface MetricCardProps {
  data: MetricCardData;
}

export const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const router = useRouter();

  const getMetricRoute = (id: string): string | null => {
    const routes: Record<string, string> = {
      'total-members': '/members',
      'hospital-bookings': '/hospital-desk',
      'ambulance-requests': '/ambulance',
      'homecare-requests': '/homecare',
      'health-plans': '/health-plans',
      'foreign-treatment': '/foreign-treatment',
      appointments: '/appointments',
      'billing-payments': '/billing',
    };

    return routes[id] ?? null;
  };

  const route = getMetricRoute(data.id);
  const getIconAndStyle = (type: MetricCardData['iconType']) => {
    switch (type) {
      case 'users':
        return {
          Icon: Users,
          bgClass: 'bg-[#1D72E8]', // Solid Blue
          shadowClass: 'shadow-blue-500/25',
          subtextClass: 'text-blue-100',
        };
      case 'document':
        return {
          Icon: FileText,
          bgClass: 'bg-[#10B981]', // Solid Green / Emerald
          shadowClass: 'shadow-emerald-500/25',
          subtextClass: 'text-emerald-100',
        };
      case 'calendar':
        return {
          Icon: Calendar,
          bgClass: 'bg-[#8B5CF6]', // Solid Purple
          shadowClass: 'shadow-purple-500/25',
          subtextClass: 'text-purple-100',
        };
      case 'ambulance':
        return {
          Icon: Ambulance,
          bgClass: 'bg-[#EF4444]', // Solid Red / Rose
          shadowClass: 'shadow-rose-500/25',
          subtextClass: 'text-rose-100',
        };
      case 'home':
        return {
          Icon: Home,
          bgClass: 'bg-[#F59E0B]', // Solid Amber / Orange
          shadowClass: 'shadow-amber-500/25',
          subtextClass: 'text-amber-100',
        };
      case 'shield':
        return {
          Icon: ShieldCheck,
          bgClass: 'bg-[#06B6D4]', // Solid Cyan / Teal
          shadowClass: 'shadow-cyan-500/25',
          subtextClass: 'text-cyan-100',
        };
      case 'plane':
        return {
          Icon: Plane,
          bgClass: 'bg-[#6366F1]', // Solid Indigo
          shadowClass: 'shadow-indigo-500/25',
          subtextClass: 'text-indigo-100',
        };
      case 'briefcase':
        return {
          Icon: Briefcase,
          bgClass: 'bg-[#EC4899]', // Solid Pink
          shadowClass: 'shadow-pink-500/25',
          subtextClass: 'text-pink-100',
        };
      case 'tasks':
        return {
          Icon: CheckSquare,
          bgClass: 'bg-[#3B82F6]', // Solid Sky Blue
          shadowClass: 'shadow-sky-500/25',
          subtextClass: 'text-sky-100',
        };
      case 'clock':
        return {
          Icon: Clock,
          bgClass: 'bg-[#059669]', // Solid Emerald Green
          shadowClass: 'shadow-emerald-600/25',
          subtextClass: 'text-emerald-100',
        };
      case 'money':
        return {
          Icon: DollarSign,
          bgClass: 'bg-[#DB2777]', // Solid Rose/Pink
          shadowClass: 'shadow-rose-600/25',
          subtextClass: 'text-rose-100',
        };
      default:
        return {
          Icon: Users,
          bgClass: 'bg-[#1D72E8]',
          shadowClass: 'shadow-blue-500/25',
          subtextClass: 'text-blue-100',
        };
    }
  };

  const style = getIconAndStyle(data.iconType);
  const Icon = style.Icon;

  return (
    <button
      type="button"
      onClick={() => route && router.push(route)}
      disabled={!route}
      aria-label={`Open ${data.title}`}
      className={`relative overflow-hidden rounded-2xl ${style.bgClass} p-3.5 sm:p-4 xl:p-4.5 text-white shadow-md ${style.shadowClass} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between min-h-[110px] sm:min-h-[118px] xl:min-h-[122px] text-left w-full ${route ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-[#F3F5F9]' : 'cursor-default'}`}
    >
      {/* Top Header: Title on Left, Semi-transparent Icon Box on Right */}
      <div className="flex items-start justify-between gap-2.5 mb-1.5">
        <span className="text-xs sm:text-sm font-bold text-white/95 leading-snug tracking-wide line-clamp-2">
          {data.title}
        </span>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>
      </div>

      {/* Main Value */}
      <div className="my-0.5">
        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {data.value}
        </span>
      </div>

      {/* Bottom Subtitle */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-white/90 pt-1">
        <span className="truncate">{data.subtitle}</span>
      </div>
    </button>
  );
};



