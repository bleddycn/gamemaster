"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  roles?: ('SITE_ADMIN' | 'CLUB_ADMIN' | 'PLAYER')[];
  clubId?: string; // For club-specific items
}

export default function Navigation() {
  const { user, isSiteAdmin, isClubAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get user's club memberships for navigation
  const clubMemberships = user?.memberships?.filter(m => m.role === 'CLUB_ADMIN') || [];

  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      {
        icon: "🏠",
        label: "Home",
        href: "/"
      }
    ];

    if (user) {
      // All signed-in users can see clubs
      items.push({
        icon: "🏛️",
        label: "Clubs",
        href: "/clubs"
      });

      // Site admins get admin templates
      if (isSiteAdmin()) {
        items.push({
          icon: "⚙️",
          label: "Templates",
          href: "/admin/templates"
        });
      }

      // Club admins get their club management
      if (clubMemberships.length > 0) {
        clubMemberships.forEach(membership => {
          items.push({
            icon: "⚽",
            label: membership.clubName,
            href: `/clubs/${membership.clubSlug}`,
            roles: ['CLUB_ADMIN'],
            clubId: membership.clubId
          });
        });
      }

      // Debug page for development
      if (process.env.NODE_ENV === 'development') {
        items.push({
          icon: "🔍",
          label: "Debug",
          href: "/debug/competitions"
        });
      }
    }

    return items;
  };

  const navItems = getNavItems();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Navigation Sidebar */}
      <nav className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200 z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-72'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                <Logo size="sm" />
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className={`font-medium transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>
                  {item.label}
                </span>
                {isActive(item.href) && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-sm" />
                )}
              </Link>
            ))}
          </div>

          {/* User Section */}
          {user && (
            <div className="p-4 border-t border-gray-200">
              <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  <div className="text-xs font-medium text-indigo-600">{user.role}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {!isCollapsed && (
                  <Link 
                    href="/auth/sign-in"
                    className="flex-1 text-center px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Switch Account
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className={`px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors ${
                    isCollapsed ? 'w-full' : ''
                  }`}
                  title={isCollapsed ? 'Sign Out' : ''}
                >
                  {isCollapsed ? '🚪' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}

          {/* Sign In Button for non-authenticated users */}
          {!user && (
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/auth/sign-in"
                className={`flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 ${
                  isCollapsed ? 'px-0' : 'px-4'
                }`}
              >
                <span>🔐</span>
                <span className={`transition-opacity duration-300 ${
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>
                  Sign In
                </span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}