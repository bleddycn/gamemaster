"use client";

import Navigation from "./Navigation";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Layout({ children, title, subtitle, actions }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="lg:pl-72 pl-16">
        {/* Header */}
        <Header title={title} subtitle={subtitle} actions={actions} />
        
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}