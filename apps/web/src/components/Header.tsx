"use client";

import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-gradient-to-r from-white via-indigo-50/30 to-purple-50/30 border-b border-gray-200/50 shadow-sm">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo - visible on mobile when nav is collapsed */}
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
            
            {/* Page Title */}
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {actions}
            
            {/* User Avatar */}
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.role}
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}