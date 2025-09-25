import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  DollarSign, 
  CreditCard, 
  Target, 
  Bell,
  FileText,
  TrendingUp
} from 'lucide-react';

export function QuickActionsMenu() {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/incomes')}>
          <DollarSign className="mr-2 h-4 w-4" />
          Manage Income
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/subscriptions')}>
          <CreditCard className="mr-2 h-4 w-4" />
          Subscriptions
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/goals')}>
          <Target className="mr-2 h-4 w-4" />
          Savings Goals
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/pending')}>
          <Bell className="mr-2 h-4 w-4" />
          Pending Actions
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/transactions')}>
          <FileText className="mr-2 h-4 w-4" />
          All Transactions
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/categories')}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Budget Categories
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}