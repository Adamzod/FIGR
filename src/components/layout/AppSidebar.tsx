import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Receipt,
  FolderOpen,
  Target,
  DollarSign,
  CreditCard,
  Bell,
  Settings,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const primaryItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Transactions', url: '/transactions', icon: Receipt },
];

const financeItems = [
  { title: 'Categories', url: '/categories', icon: FolderOpen },
  { title: 'Goals', url: '/goals', icon: Target },
  { title: 'Incomes', url: '/incomes', icon: DollarSign },
];

const billsItems = [
  { title: 'Subscriptions', url: '/subscriptions', icon: CreditCard },
  { title: 'Pending Actions', url: '/pending', icon: Bell },
];

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const renderMenuItems = (items: typeof primaryItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive(item.url) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <DollarSign className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold">Finance Tracker</h2>
              <p className="text-xs text-muted-foreground">Manage your money</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(primaryItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Finance Management</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(financeItems)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Bills & Payments</SidebarGroupLabel>
          <SidebarGroupContent>{renderMenuItems(billsItems)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start"
            asChild
          >
            <NavLink to="/settings">
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Settings</span>}
            </NavLink>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="flex-1 justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}