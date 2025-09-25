import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Main content area with padding for bottom nav */}
      <main className="pb-16 md:pb-0">
        {children || <Outlet />}
      </main>
      
      {/* Bottom navigation - only visible on mobile */}
      <BottomNav />
    </div>
  );
}