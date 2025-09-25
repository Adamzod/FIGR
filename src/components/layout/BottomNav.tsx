import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart3, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

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
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Analytics',
    path: '/goals',
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: 'Settings',
    path: '/settings',
  },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-nav-background border-t border-border shadow-lg md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-nav-foreground transition-colors',
                isActive && 'text-nav-active'
              )
            }
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}