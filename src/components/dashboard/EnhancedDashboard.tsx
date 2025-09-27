import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate, getMonthDateRange } from '@/lib/finance-utils';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category_id: string | null;
  type: string | null;
}

interface DashboardProps {
  user: {
    id: string;
    email?: string;
  };
  availableFunds: number;
  totalIncome: number;
  totalSpent: number;
  categories: {
    id: string;
    name: string;
    color?: string;
    budget?: number;
    spent?: number;
  }[];
  currentMonthRollover: number;
}

export function EnhancedDashboard({ 
  user, 
  availableFunds, 
  totalIncome, 
  totalSpent, 
  categories,
  currentMonthRollover 
}: DashboardProps) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dailyAllowance, setDailyAllowance] = useState(0);
  const [daysLeftInMonth, setDaysLeftInMonth] = useState(0);
  const [goalContributions, setGoalContributions] = useState(0);


  const loadRecentTransactions = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(5);
    
    setRecentTransactions(data || []);
  }, [user]);

  const loadGoalContributions = useCallback(async () => {
    if (!user) return;
    
    const { start, end } = getMonthDateRange();
    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('type', 'goal_contribution')
      .gte('date', start)
      .lte('date', end);
    
    const total = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    setGoalContributions(total);
  }, [user]);

  const calculateDailyStats = useCallback(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = Math.max(1, lastDay.getDate() - now.getDate() + 1);
    setDaysLeftInMonth(daysLeft);
    setDailyAllowance(availableFunds > 0 ? availableFunds / daysLeft : 0);
  }, [availableFunds]);

  useEffect(() => {
    loadRecentTransactions();
    calculateDailyStats();
    loadGoalContributions();
  }, [user, availableFunds, loadRecentTransactions, calculateDailyStats, loadGoalContributions]);

  const spentPercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;
  const isOverBudget = totalSpent > totalIncome;

  // Calculate actual available with rollover
  const actualAvailable = availableFunds + currentMonthRollover;

  return (
    <div className="space-y-4">
      {/* Main Budget Card */}
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-4">
              <p className="text-md font-bold mb-2">Available This Month</p>
              <p className={cn(
                'text-4xl font-bold tabular-nums',
                isOverBudget ? 'text-danger' : 'text-foreground'
              )}>
                {formatCurrency(availableFunds + totalSpent)}
                {currentMonthRollover > 0 && (
                <p className="text-sm font-semibold text-green-600 mt-1">
                  +{formatCurrency(currentMonthRollover)} rollover
                  No rollover
                </p>
              )}
              </p>
          
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Spent Amount:
                </p>
                <span className="text-sm font-medium text-muted-foreground">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              
              <Progress 
                value={Math.min(spentPercentage, 100)} 
                className={cn(
                  'h-3',
                  'z-1',
                  isOverBudget && '[&>div]:bg-danger'
                )}
              />
              <div className="flex justify-between text-sm">
                <p className="text-sm font-medium text-muted-foreground">
                  Remaining {formatCurrency(actualAvailable)}
                </p>
                <span className="font-medium text-muted-foreground">
                  {Math.round(spentPercentage)}%
                </span>
              </div>

              
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Monthly Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Income</p>
              <p className="font-bold text-success">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Expenses</p>
              <p className="font-bold text-danger">{formatCurrency(totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Saved</p>
              <p className="font-bold text-primary">{formatCurrency(goalContributions)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Days Left</p>
                <p className="text-xl font-bold">{daysLeftInMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Budget</p>
                <p className="text-xl font-bold">{formatCurrency(dailyAllowance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending by Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.slice(0, 5).map(category => {
            const percentage = category.budget > 0 
              ? (category.spent / category.budget) * 100 
              : 0;
            const isOverBudget = category.spent > category.budget;
            
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span className={cn(
                    "text-xs",
                    isOverBudget ? "text-danger" : "text-muted-foreground"
                  )}>
                    {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className={cn(
                    "h-2",
                    isOverBudget && "[&>div]:bg-danger"
                  )}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Recent Transactions
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{transaction.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                  <span className={cn(
                    "font-semibold text-sm",
                    transaction.type === 'goal_contribution' ? "text-success" : "text-foreground"
                  )}>
                    -{formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No transactions yet this month
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>


    </div>
  );
}