'use client';

import React, { useState, useEffect } from 'react';
import { Menu, ChevronDown, LogOut } from 'lucide-react';
import { ViewType, DashboardViewConfig } from '@/data/dashboardData';
import { useAuth } from '@/context/AuthContext';
import { BASE_URL } from '@/lib/api';

interface HeaderProps {
  config: DashboardViewConfig;
  currentView: ViewType;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentView,
  onToggleSidebar
}) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [imgErrorCount, setImgErrorCount] = useState(0);
  const [currentImgSrc, setCurrentImgSrc] = useState<string | null>(null);

  // Derive user info from API AuthContext or config fallback
  const userName = user?.name || config.userName;
  const userSubtext = user?.subtext || config.userRole;
  const userAvatarInitials = user?.avatar || config.userAvatar;
  const userProfileImage = user?.profileImage;

  // Initialize and reset image source when profile image changes
  useEffect(() => {
    if (userProfileImage) {
      setCurrentImgSrc(userProfileImage);
      setImgErrorCount(0);
    } else {
      setCurrentImgSrc(null);
    }
  }, [userProfileImage]);

  // Handle image load error: Try alternative URL with /media prefix if first attempt fails
  const handleImageError = () => {
    if (imgErrorCount === 0 && currentImgSrc && !currentImgSrc.includes('/media/')) {
      // Try inserting /media prefix
      const urlObj = new URL(currentImgSrc);
      const newPath = `/media${urlObj.pathname}`;
      const altUrl = `${BASE_URL}${newPath}`;
      console.log('[Header] Primary image failed, trying alternate URL:', altUrl);
      setCurrentImgSrc(altUrl);
      setImgErrorCount(1);
    } else {
      console.warn('[Header] Failed to load profile image, using fallback initials');
      setImgErrorCount(2);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between gap-4">
      {/* Left Title & Menu Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {config.headerTitle}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {config.headerSubtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* User Profile Dropdown (Utilizing /api/auth/me/ profile_image) */}
        <div className="relative border-l border-slate-200 pl-3">
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
            }}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            {/* User Profile Avatar / Image */}
            {currentImgSrc && imgErrorCount < 2 ? (
              <img
                src={currentImgSrc}
                alt={userName}
                onError={handleImageError}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/20">
                {userAvatarInitials}
              </div>
            )}

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {userName}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {userSubtext}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{userName}</div>
                <div className="text-[11px] text-slate-500">{user?.email || userSubtext}</div>
                {user?.phone && (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.phone}</div>
                )}
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
