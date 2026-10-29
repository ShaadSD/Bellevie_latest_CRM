'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Search,
  Filter,
  Plus,
  X,
  Eye,
  CheckCheck,
  Megaphone,
  ShieldAlert,
  FileText,
  Sparkles,
  Building2,
  Layers,
  ArrowRight,
  User,
  ExternalLink
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { hqDashboardData, ncDashboardData } from '@/data/dashboardData';
import {
  fetchNotificationsApi,
  createBroadcastNotificationApi,
  markNotificationReadApi,
  ApiNotification
} from '@/lib/notificationsApi';
import { getNetworkCentres } from '@/lib/networkApi';

export interface NetworkCentreOption {
  id: string;
  name: string;
  code: string;
  location: string;
}

export const NETWORK_CENTRES_LIST: NetworkCentreOption[] = [];

export interface NotificationItem {
  id: string;
  dbId?: number;
  title: string;
  message: string;
  category: 'Operations' | 'Finance' | 'Policy' | 'Clinical' | 'Emergency';
  priority: 'General' | 'Action Required' | 'Urgent' | 'Policy Update';
  targetScope: 'ALL' | 'SPECIFIC';
  targetCentres: string[];
  sender: string;
  timestamp: string;
  readCount: number;
  totalRecipients: number;
  isRead?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

interface NotificationsViewProps {
  currentView?: 'HQ' | 'NC';
}

export default function NotificationsView({ currentView = 'HQ' }: NotificationsViewProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'finance' | 'policy'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Send Broadcast Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [targetScope, setTargetScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedCentres, setSelectedCentres] = useState<string[]>([]);
  const [ncSearchFilter, setNcSearchFilter] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState<NotificationItem['category']>('Operations');
  const [notifPriority, setNotifPriority] = useState<NotificationItem['priority']>('General');
  const [notifActionUrl, setNotifActionUrl] = useState('');
  const [notifActionLabel, setNotifActionLabel] = useState('');

  // Details Modal State
  const [selectedNotifDetails, setSelectedNotifDetails] = useState<NotificationItem | null>(null);

  // Success Alert Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const [networkCentresList, setNetworkCentresList] = useState<NetworkCentreOption[]>([]);

  const [activeNC, setActiveNC] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('active_nc_name') || '';
    }
    return '';
  });

  const handleActiveNcChange = (ncName: string) => {
    setActiveNC(ncName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_nc_name', ncName);
      window.dispatchEvent(new Event('notifications_updated'));
    }
  };

  const loadNetworkCentres = async () => {
    try {
      const centres = await getNetworkCentres();
      if (centres && Array.isArray(centres)) {
        const mapped = centres.map((c) => ({
          id: String(c.id),
          name: c.name,
          code: c.public_id || `NC-${String(c.id).padStart(2, '0')}`,
          location: c.address || c.name || 'Network Centre',
        }));
        setNetworkCentresList(mapped);
        if (mapped.length > 0) {
          const storedNC = typeof window !== 'undefined' ? localStorage.getItem('active_nc_name') : null;
          const exists = mapped.some((m) => m.name === storedNC);
          if (!storedNC || !exists) {
            setActiveNC(mapped[0].name);
            if (typeof window !== 'undefined') {
              localStorage.setItem('active_nc_name', mapped[0].name);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[NotificationsView] Failed to load network centres from API:', err);
    }
  };

  const loadBackendNotifications = async (ncName?: string) => {
    const filterNc = currentView === 'NC' ? (ncName || activeNC) : undefined;
    const apiData = await fetchNotificationsApi(filterNc ? { network_centre: filterNc } : undefined);
    const readIds: string[] = JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
    if (apiData && Array.isArray(apiData)) {
      const mapped: NotificationItem[] = apiData.map((item) => {
        const notifId = item.notification_id || `NOTIF-${item.id}`;
        const isReadLocally = readIds.includes(String(notifId)) || readIds.includes(String(item.id));
        return {
          id: notifId,
          dbId: item.id,
          title: item.title,
          message: item.message,
          category: item.category,
          priority: item.priority,
          targetScope: item.target_scope,
          targetCentres: item.target_centres && item.target_centres.length > 0 ? item.target_centres : ['All Network Centres'],
          sender: item.sender || 'HQ Central Management',
          timestamp: new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          readCount: item.read_count || (item.read_receipts ? item.read_receipts.length : 0),
          totalRecipients: item.total_recipients || (item.target_scope === 'ALL' ? networkCentresList.length || 8 : item.target_centres?.length || 1),
          isRead: isReadLocally || Boolean(item.is_read),
          actionUrl: item.action_url || undefined,
          actionLabel: item.action_label || undefined
        };
      });
      setNotifications(mapped);
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadBackendNotifications(activeNC);
    loadNetworkCentres();
  }, [activeNC, currentView]);

  // Toggle NC Selection for Specific Broadcast
  const handleToggleNC = (centreName: string) => {
    setTargetScope('SPECIFIC');
    if (selectedCentres.includes(centreName)) {
      const updated = selectedCentres.filter((c) => c !== centreName);
      setSelectedCentres(updated);
      if (updated.length === 0) {
        setTargetScope('ALL');
      }
    } else {
      setSelectedCentres([...selectedCentres, centreName]);
    }
  };

  const activeNCList = networkCentresList;


  const handleSelectAllNCs = () => {
    if (selectedCentres.length === activeNCList.length) {
      setSelectedCentres([]);
      setTargetScope('ALL');
    } else {
      setSelectedCentres(activeNCList.map((c) => c.name));
      setTargetScope('SPECIFIC');
    }
  };

  // Handle Send Broadcast Submission
  const handleSendNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert('Please enter both Title and Message Content.');
      return;
    }

    let finalScope = targetScope;
    if (selectedCentres.length > 0) {
      finalScope = 'SPECIFIC';
    }

    if (finalScope === 'SPECIFIC' && selectedCentres.length === 0) {
      alert('Please select at least one Network Centre for specific broadcast.');
      return;
    }

    const recipients = finalScope === 'ALL' ? ['All Network Centres'] : [...selectedCentres];
    const totalCount = finalScope === 'ALL' ? activeNCList.length : selectedCentres.length;

    const created = await createBroadcastNotificationApi({
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      category: notifCategory,
      priority: notifPriority,
      target_scope: finalScope,
      target_centres: recipients,
      sender: currentView === 'HQ' ? 'HQ Central Management' : 'Network Centre Hub',
      action_url: notifActionUrl.trim() || undefined,
      action_label: notifActionLabel.trim() || undefined
    });

    if (created) {
      loadBackendNotifications(activeNC);
    } else {
      const newNotification: NotificationItem = {
        id: `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        category: notifCategory,
        priority: notifPriority,
        targetScope: finalScope,
        targetCentres: recipients,
        sender: currentView === 'HQ' ? 'HQ Central Management' : 'Network Centre Hub',
        timestamp: 'Just now',
        readCount: 0,
        totalRecipients: totalCount,
        isRead: false,
        actionUrl: notifActionUrl.trim() || undefined,
        actionLabel: notifActionLabel.trim() || undefined
      };
      setNotifications([newNotification, ...notifications]);
    }

    setShowSendModal(false);

    // Reset Form
    setNotifTitle('');
    setNotifMessage('');
    setTargetScope('ALL');
    setSelectedCentres([]);
    setNotifActionUrl('');
    setNotifActionLabel('');

    triggerToast(`Notification broadcast sent successfully to ${finalScope === 'ALL' ? 'all Network Centres' : `${totalCount} selected NCs`}!`);
  };

  // Mark single as read
  const handleMarkAsRead = (id: string, dbId?: number) => {
    try {
      const readIds: string[] = JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
      if (!readIds.includes(id)) {
        readIds.push(id);
        if (dbId && !readIds.includes(String(dbId))) {
          readIds.push(String(dbId));
        }
        localStorage.setItem('read_notification_ids', JSON.stringify(readIds));
        window.dispatchEvent(new Event('notifications_updated'));
      }
      if (dbId) {
        markNotificationReadApi(dbId, activeNC);
      }
    } catch (e) {
      console.warn('Error saving read notification ID:', e);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    try {
      const readIds: string[] = JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
      notifications.forEach((n) => {
        if (!readIds.includes(n.id)) readIds.push(n.id);
        if (n.dbId && !readIds.includes(String(n.dbId))) {
          readIds.push(String(n.dbId));
          markNotificationReadApi(n.dbId, activeNC);
        }
      });
      localStorage.setItem('read_notification_ids', JSON.stringify(readIds));
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (e) {
      console.warn('Error saving read all notification IDs:', e);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    triggerToast('All notifications marked as read!');
  };

  // Filtered Notifications List
  const filteredNotifications = notifications.filter((n) => {
    // If in NC view, enforce target isolation for SPECIFIC scope
    if (currentView === 'NC' && n.targetScope === 'SPECIFIC') {
      const currentNcLower = activeNC.toLowerCase();
      const cityKeywords = ['dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'barishal', 'rangpur', 'mymensingh'];
      const activeCity = cityKeywords.find((k) => currentNcLower.includes(k)) || currentNcLower;

      const isTargeted = n.targetCentres.some((c) => {
        const centreLower = c.toLowerCase();
        if (centreLower === 'all network centres') return true;
        if (centreLower.includes(currentNcLower) || currentNcLower.includes(centreLower)) return true;
        const targetCity = cityKeywords.find((k) => centreLower.includes(k));
        if (
          targetCity &&
          (targetCity === activeCity ||
            (targetCity === 'barishal' && activeCity === 'barisal') ||
            (targetCity === 'barisal' && activeCity === 'barishal'))
        ) {
          return true;
        }
        return false;
      });
      if (!isTargeted) return false;
    }

    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.sender.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'urgent') return n.priority === 'Urgent';
    if (activeTab === 'finance') return n.category === 'Finance';
    if (activeTab === 'policy') return n.category === 'Policy' || n.priority === 'Policy Update';
    return true;
  });


  const filteredNCList = activeNCList.filter(
    (c) =>
      c.name.toLowerCase().includes(ncSearchFilter.toLowerCase()) ||
      c.location.toLowerCase().includes(ncSearchFilter.toLowerCase()) ||
      c.code.toLowerCase().includes(ncSearchFilter.toLowerCase())
  );

  const priorityStyles = (priority: NotificationItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/30';
      case 'Action Required':
        return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/30';
      case 'Policy Update':
        return 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/30';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/30';
    }
  };

  const priorityIcon = (priority: NotificationItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'Action Required':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'Policy Update':
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900">
      <Sidebar
        currentView={currentView}
        collapsed={sidebarCollapsed}
        activeItem="Notifications"
        onSelectMenuItem={() => { }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          config={currentView === 'HQ' ? hqDashboardData : ncDashboardData}
          currentView={currentView}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          )}

          {/* Page Top Header Banner */}
          <div className="bg-gradient-to-r from-[#111A2E] via-[#1E293B] to-[#1D61E8] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
              <Megaphone className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentView === 'HQ' ? 'HQ Broadcast Center' : 'NC Communications Hub'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {currentView === 'HQ' ? 'Broadcast Notifications & Announcements' : 'Network Notifications Inbox'}
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl">
                {currentView === 'HQ'
                  ? 'Send instant alerts, policy directives, or financial notices to all Network Centres or select specific regional hubs.'
                  : 'Receive real-time announcements, policy standards, and critical directives from HQ management.'}
              </p>
            </div>

            {currentView === 'HQ' ? (
              <button
                onClick={() => setShowSendModal(true)}
                className="relative z-10 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2.5 transition-all transform active:scale-95 border border-blue-400/30"
              >
                <Send className="w-4 h-4" />
                <span>Send New Broadcast</span>
              </button>
            ) : (
              <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-blue-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Viewing Inbox As:
                </label>
                <select
                  value={activeNC}
                  onChange={(e) => handleActiveNcChange(e.target.value)}
                  className="bg-slate-900/80 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-white/20 outline-none cursor-pointer hover:bg-slate-900 transition-colors"
                >
                  {activeNCList.map((nc) => (
                    <option key={nc.id} value={nc.name} className="bg-slate-900 text-white">
                      {nc.name} ({nc.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Broadcasts</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{notifications.length}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Urgent Alerts</p>
                <p className="text-2xl font-black text-red-600 mt-1">
                  {notifications.filter((n) => n.priority === 'Urgent').length}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'all'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                All Announcements ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('urgent')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'urgent'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Urgent ({notifications.filter((n) => n.priority === 'Urgent').length})
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'finance'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Finance & Payouts
              </button>
              <button
                onClick={() => setActiveTab('policy')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'policy'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Policy Updates
              </button>
            </div>

            {/* Search & Mark All Read */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleMarkAllAsRead}
                className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 transition-all shrink-0 border border-slate-200"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Read</span>
              </button>
            </div>
          </div>

          {/* Notifications Feed / Table List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No notifications match your current filter query. Try selecting another tab or clear search filters.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`bg-white rounded-2xl border transition-all hover:shadow-md ${notif.priority === 'Urgent'
                      ? 'border-red-200/80 bg-red-50/10'
                      : 'border-slate-200/80'
                    } p-5 md:p-6 space-y-4`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Priority Tag */}
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${priorityStyles(
                          notif.priority
                        )}`}
                      >
                        {priorityIcon(notif.priority)}
                        {notif.priority}
                      </span>

                      {/* Category Tag */}
                      <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {notif.category}
                      </span>

                      {/* Target Scope Badge */}
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        {notif.targetScope === 'ALL' ? (
                          <>
                            <Globe className="w-3.5 h-3.5 text-indigo-500" />
                            All Network Centres ({activeNCList.length})
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            {notif.targetCentres.length} Selected NC Hubs
                          </>
                        )}
                      </span>
                    </div>

                    {/* Timestamp & Sender */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {notif.timestamp}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{notif.sender}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      {notif.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
                      {notif.message}
                    </p>

                    {/* Target Centres pill preview if specific */}
                    {notif.targetScope === 'SPECIFIC' && (
                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500">Recipients:</span>
                        {notif.targetCentres.map((c) => (
                          <span
                            key={c}
                            className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions & Status */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Read Status Indicator */}
                    <div className="flex items-center gap-2">
                      {notif.isRead ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Read
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkAsRead(notif.id, notif.dbId)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-all cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark as Read
                        </button>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                      {notif.actionUrl && (
                        <a
                          href={notif.actionUrl}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/60 transition-all"
                        >
                          <span>{notif.actionLabel || 'View Associated Link'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setSelectedNotifDetails(notif);
                          handleMarkAsRead(notif.id, notif.dbId);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* SEND NOTIFICATION MODAL (HQ BROADCASTING FORM) */}
      {/* ========================================================= */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#111A2E] to-[#1D61E8] px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Create & Send Broadcast</h3>
                  <p className="text-xs text-slate-300">Announce to all or targeted Network Centres</p>
                </div>
              </div>

              <button
                onClick={() => setShowSendModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSendNotificationSubmit} className="p-6 space-y-5">
              {/* Target Audience Scope Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Audience Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetScope('ALL');
                      setSelectedCentres([]);
                    }}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${targetScope === 'ALL'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${targetScope === 'ALL' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}
                    >
                      {targetScope === 'ALL' && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">All Network Centres</p>
                      <p className="text-[11px] text-slate-500 font-normal">Broadcast to all {activeNCList.length} network centres</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope('SPECIFIC')}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${targetScope === 'SPECIFIC'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${targetScope === 'SPECIFIC' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}
                    >
                      {targetScope === 'SPECIFIC' && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Selected NCs Only</p>
                      <p className="text-[11px] text-slate-500 font-normal">Choose specific regional centres</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Specific NC Multi-Select Grid (renders when SPECIFIC scope chosen) */}
              {targetScope === 'SPECIFIC' && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Select Target Centres ({selectedCentres.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllNCs}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {selectedCentres.length === activeNCList.length ? 'Clear All' : 'Select All'}
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search centre name or city..."
                      value={ncSearchFilter}
                      onChange={(e) => setNcSearchFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {filteredNCList.map((nc) => {
                      const isSelected = selectedCentres.includes(nc.name);
                      return (
                        <button
                          key={nc.id}
                          type="button"
                          onClick={() => handleToggleNC(nc.name)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all text-left w-full ${isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-medium'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-white text-blue-600 border-white' : 'border-slate-300'
                              }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate">{nc.name}</p>
                            <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              {nc.code} • {nc.location}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Priority & Category selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={notifPriority}
                    onChange={(e) => setNotifPriority(e.target.value as NotificationItem['priority'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="General">🔵 General Information</option>
                    <option value="Action Required">🟡 Action Required</option>
                    <option value="Urgent">🔴 Urgent Alert</option>
                    <option value="Policy Update">🟣 Policy Update</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category Tag
                  </label>
                  <select
                    value={notifCategory}
                    onChange={(e) => setNotifCategory(e.target.value as NotificationItem['category'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance & Billing</option>
                    <option value="Policy">Policy & Directives</option>
                    <option value="Emergency">Emergency Audit</option>
                    <option value="Clinical">Clinical Quality</option>
                  </select>
                </div>
              </div>

              {/* Subject / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Updated As Per Agreement Commission Settlement Schedule"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide complete details, instructions, or deadlines for the network centres..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Action URL / Link (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Action Link URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /hq/finance"
                    value={notifActionUrl}
                    onChange={(e) => setNotifActionUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Action Link Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Review Finance Payouts"
                    value={notifActionLabel}
                    onChange={(e) => setNotifActionLabel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Broadcast Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DETAILS VIEW MODAL */}
      {/* ========================================================= */}
      {selectedNotifDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
                  Notification Details ({selectedNotifDetails.id})
                </span>
              </div>
              <button
                onClick={() => setSelectedNotifDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${priorityStyles(
                    selectedNotifDetails.priority
                  )}`}
                >
                  {priorityIcon(selectedNotifDetails.priority)}
                  {selectedNotifDetails.priority}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-lg border">
                  {selectedNotifDetails.category}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">{selectedNotifDetails.title}</h2>
              <p className="text-xs text-slate-500 font-medium">
                Sent by {selectedNotifDetails.sender} • {selectedNotifDetails.timestamp}
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal">
                {selectedNotifDetails.message}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-xs font-bold text-slate-700">Targeted Audience:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNotifDetails.targetCentres.map((c) => (
                    <span key={c} className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  onClick={() => setSelectedNotifDetails(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
