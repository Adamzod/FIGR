import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile layout with bottom navigation
    return (
      <div className={cn('min-h-screen bg-background', className)}>
        <main className="pb-16">
          {children || <Outlet />}
        </main>
        <BottomNav />
        {/* FAB removed - each mobile page handles its own context-aware FAB */}
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <header className="sticky top-0 z-40 flex h-14  items-center gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1" />
          </header>
          <main className="flex-1 p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}