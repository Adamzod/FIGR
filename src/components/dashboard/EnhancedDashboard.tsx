import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate, getMonthDateRange } from '@/lib/finance-utils';
import { TrendingUp, TrendingDown, DollarSign, Calendar, CalendarDays, Target, Receipt } from 'lucide-react';
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

type DailyBudgetMode = 'total' | 'category';

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
  
  // Enhanced daily budget state
  const [dailyBudgetMode, setDailyBudgetMode] = useState<DailyBudgetMode>(() => {
    const saved = localStorage.getItem('dailyBudgetMode');
    return (saved as DailyBudgetMode) || 'total';
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    return localStorage.getItem('selectedCategoryId') || '';
  });
  const [budgetPeriod, setBudgetPeriod] = useState<'daily' | 'weekly'>(() => {
    const saved = localStorage.getItem('budgetPeriod');
    return (saved as 'daily' | 'weekly') || 'daily';
  });
  const [categorySpentThisMonth, setCategorySpentThisMonth] = useState(0);

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

  const loadCategorySpentThisMonth = useCallback(async (categoryId: string) => {
    if (!user || !categoryId) return;
    
    const { start, end } = getMonthDateRange();
    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .gte('date', start)
      .lte('date', end);
    
    const total = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    setCategorySpentThisMonth(total);
  }, [user]);

  const calculateDailyStats = useCallback(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = Math.max(1, lastDay.getDate() - now.getDate() + 1);
    setDaysLeftInMonth(daysLeft);

    // Calculate periods left based on budget period
    const periodsLeft = budgetPeriod === 'weekly' ? Math.ceil(daysLeft / 7) : daysLeft;

    if (dailyBudgetMode === 'category' && selectedCategoryId) {
      const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      if (selectedCategory) {
        const remainingBudget = Math.max(0, (selectedCategory.budget || 0) - categorySpentThisMonth);
        setDailyAllowance(remainingBudget > 0 ? remainingBudget / periodsLeft : 0);
      }
    } else {
      setDailyAllowance(availableFunds > 0 ? availableFunds / periodsLeft : 0);
    }
  }, [availableFunds, dailyBudgetMode, selectedCategoryId, categories, categorySpentThisMonth, budgetPeriod]);

  useEffect(() => {
    loadRecentTransactions();
    calculateDailyStats();
    loadGoalContributions();
  }, [user, availableFunds, loadRecentTransactions, calculateDailyStats, loadGoalContributions]);

  useEffect(() => {
    if (dailyBudgetMode === 'category' && selectedCategoryId) {
      loadCategorySpentThisMonth(selectedCategoryId);
    }
  }, [selectedCategoryId, dailyBudgetMode, loadCategorySpentThisMonth]);

  useEffect(() => {
    calculateDailyStats();
  }, [categorySpentThisMonth, calculateDailyStats]);

  useEffect(() => {
    calculateDailyStats();
  }, [budgetPeriod, calculateDailyStats]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dailyBudgetMode', dailyBudgetMode);
  }, [dailyBudgetMode]);

  useEffect(() => {
    localStorage.setItem('selectedCategoryId', selectedCategoryId);
  }, [selectedCategoryId]);

  const spentPercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;
  const isOverBudget = totalSpent > totalIncome;

  // Calculate actual available with rollover
  const actualAvailable = availableFunds + currentMonthRollover;

  // Get selected category details
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
  const categoryBudgetPercentage = selectedCategory && selectedCategory.budget > 0 
    ? (categorySpentThisMonth / selectedCategory.budget) * 100 
    : 0;
  const isCategoryOverBudget = selectedCategory && categorySpentThisMonth > (selectedCategory.budget || 0);

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
                {formatCurrency(availableFunds)}
                {currentMonthRollover > 0 && (
                <p className="text-sm font-semibold text-green-600 mt-1">
                  +{formatCurrency(currentMonthRollover)} rollover
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
                  Total {formatCurrency(actualAvailable + totalSpent)}
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
          <CardContent className="flex h-full content-center p-4">
            <div className="flex content-center  h-full items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{budgetPeriod === 'daily' ? 'Days Left' : 'Weeks Left'}</p>
                <p className="text-xl font-bold">{budgetPeriod === 'daily' ? daysLeftInMonth : Math.ceil(daysLeftInMonth / 7)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                dailyBudgetMode === 'category' ? "bg-blue/10" : "bg-success/10"
              )}>
                {budgetPeriod === 'weekly' ? (
                  <DollarSign className={cn(
                    "h-4 w-4",
                    dailyBudgetMode === 'category' ? "text-blue-600" : "text-success"
                  )} />
                ) : (
                  <DollarSign className={cn(
                    "h-4 w-4",
                    dailyBudgetMode === 'category' ? "text-blue-600" : "text-success"
                  )} />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {dailyBudgetMode === 'category' ? `Category ${budgetPeriod === 'daily' ? 'Daily' : 'Weekly'}` : `${budgetPeriod === 'daily' ? 'Daily' : 'Weekly'} Budget`}
                </p>
                <p className="text-xl font-bold">{formatCurrency(dailyAllowance)}</p>
                {dailyBudgetMode === 'category' && selectedCategory && (
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedCategory.name}
                  </p>
                )}
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
              ? ((category.spent || 0) / category.budget) * 100 
              : 0;
            const isOverBudget = (category.spent || 0) > (category.budget || 0);
            
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category.name}</span>
                  <span className={cn(
                    "text-xs",
                    isOverBudget ? "text-danger" : "text-muted-foreground"
                  )}>
                    {formatCurrency(category.spent || 0)} / {formatCurrency(category.budget || 0)}
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