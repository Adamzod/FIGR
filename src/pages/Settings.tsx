import React, { useState, useEffect, useCallback } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getMonthDateRange } from '@/lib/finance-utils';
import { 
  User, 
  Download, 
  LogOut, 
  Bell, 
  Moon, 
  Shield, 
  ChevronRight,
  FileText,
  HelpCircle,
  DollarSign
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  // Daily budget settings
  const [dailyBudgetMode, setDailyBudgetMode] = useState<'total' | 'category'>(() => {
    const saved = localStorage.getItem('dailyBudgetMode');
    return (saved as 'total' | 'category') || 'total';
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    return localStorage.getItem('selectedCategoryId') || '';
  });
  const [budgetPeriod, setBudgetPeriod] = useState<'daily' | 'weekly'>(() => {
    const saved = localStorage.getItem('budgetPeriod');
    return (saved as 'daily' | 'weekly') || 'daily';
  });
  const [categories, setCategories] = useState<Array<{id: string; name: string; budget?: number}>>([]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  // Load categories for daily budget settings
  const loadCategories = useCallback(async () => {
    if (!user) return;
    
    try {
      // Load income
      const { data: incomes } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id);
      
      const monthlyIncome = incomes?.reduce((sum, income) => {
        return sum + (income.amount * (income.frequency === 'weekly' ? 4.33 : income.frequency === 'bi-weekly' ? 2.17 : 1));
      }, 0) || 0;

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      const categoriesWithBudget = categoriesData?.map(cat => ({
        id: cat.id,
        name: cat.name,
        budget: cat.allocated_percentage * monthlyIncome
      })).filter(cat => cat.budget && cat.budget > 0) || [];
      
      setCategories(categoriesWithBudget);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [user]);

  // Save daily budget settings to localStorage
  useEffect(() => {
    localStorage.setItem('dailyBudgetMode', dailyBudgetMode);
  }, [dailyBudgetMode]);

  useEffect(() => {
    localStorage.setItem('selectedCategoryId', selectedCategoryId);
  }, [selectedCategoryId]);

  useEffect(() => {
    localStorage.setItem('budgetPeriod', budgetPeriod);
  }, [budgetPeriod]);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user, loadCategories]);

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Fetch all user data
      const [transactions, categories, incomes, goals, subscriptions] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user?.id),
        supabase.from('categories').select('*').eq('user_id', user?.id),
        supabase.from('incomes').select('*').eq('user_id', user?.id),
        supabase.from('goals').select('*').eq('user_id', user?.id),
        supabase.from('subscriptions').select('*').eq('user_id', user?.id),
      ]);

      const data = {
        exported_at: new Date().toISOString(),
        transactions: transactions.data,
        categories: categories.data,
        incomes: incomes.data,
        goals: goals.data,
        subscriptions: subscriptions.data,
      };

      // Create and download CSV/JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: "Your financial data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">Member since {new Date().getFullYear()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Budget Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Settings
              </CardTitle>
              <CardDescription>Configure how your budget is calculated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="budget-mode" className="text-sm font-medium">Budget Mode</Label>
                <Select value={dailyBudgetMode} onValueChange={(value: 'total' | 'category') => setDailyBudgetMode(value)}>
                  <SelectTrigger id="budget-mode" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Total Available Funds</SelectItem>
                    <SelectItem value="category">Specific Category</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose how your budget is calculated
                </p>
              </div>

              <div>
                <Label htmlFor="budget-period" className="text-sm font-medium">Budget Period</Label>
                <Select value={budgetPeriod} onValueChange={(value: 'daily' | 'weekly') => setBudgetPeriod(value)}>
                  <SelectTrigger id="budget-period" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose your budgeting period
                </p>
              </div>

              {dailyBudgetMode === 'category' && (
                <div>
                  <Label htmlFor="category-select" className="text-sm font-medium">Select Category</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger id="category-select" className="mt-1">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({formatCurrency(category.budget || 0)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {budgetPeriod === 'daily' ? 'Daily' : 'Weekly'} budget will be calculated from this category's remaining budget
                  </p>
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {dailyBudgetMode === 'total' 
                    ? `Your ${budgetPeriod} budget will be calculated by dividing your total available funds by the number of ${budgetPeriod === 'daily' ? 'days' : 'weeks'} left in the month.`
                    : selectedCategoryId 
                      ? `Your ${budgetPeriod} budget will be calculated by dividing the selected category's remaining budget by the number of ${budgetPeriod === 'daily' ? 'days' : 'weeks'} left in the month.`
                      : `Please select a category to use for ${budgetPeriod} budget calculation.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                </div>
                <Switch 
                  id="dark-mode" 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders</p>
                  </div>
                </div>
                <Switch 
                  id="notifications" 
                  checked={notifications} 
                  onCheckedChange={setNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={exportData}
                disabled={isExporting}
              >
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => toast({ title: "Coming soon", description: "Privacy settings will be available soon" })}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy Settings
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => toast({ title: "Coming soon", description: "Help documentation will be available soon" })}
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => toast({ title: "Coming soon", description: "Terms of service will be available soon" })}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Terms & Policies
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Version Info */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}