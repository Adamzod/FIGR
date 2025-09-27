import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FolderOpen, Target, DollarSign , CreditCard} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

export function BottomNav() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { count } = await supabase
        .from('pending_actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user.id)
        .eq('resolved', false);
      
      setPendingCount(count || 0);
    };

    fetchPendingCount();
    
    // Subscribe to changes
    const subscription = supabase
      .channel('pending_actions_count')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pending_actions' 
      }, fetchPendingCount)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const navItems: NavItem[] = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Home',
      path: '/',
    },
    {
      icon: <FolderOpen className="w-5 h-5" />,
      label: 'Categories',
      path: '/categories',
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: 'Subs',
      path: '/subscriptions',
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Goals',
      path: '/goals',
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Incomes',
      path: '/incomes',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden">
      <div className="grid grid-cols-5  h-20">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-all duration-200',
                isActive && 'text-primary scale-105'
              )
            }
          >
            <div className="relative">
              {item.icon}
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5  w-5 p-0 flex items-center justify-center text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}