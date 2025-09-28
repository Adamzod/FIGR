import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FAB } from '@/components/layout/FAB';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, normalizeToMonthly, getIncomeForMonth } from '@/lib/finance-utils';
import { 
  DollarSign, 
  Edit, 
  Trash2, 
  TrendingUp,
  Briefcase,
  Calendar,
  AlertCircle,
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Income {
  id: string;
  source_name: string;
  amount: number;
  frequency: string;
  created_at: string;
  is_recurring?: boolean;
  payment_date?: string | null;
}

export default function IncomesMobile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [isOneTime, setIsOneTime] = useState(false);
  const [newIncome, setNewIncome] = useState({
    source_name: '',
    amount: '',
    frequency: 'monthly',
    payment_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      loadIncomes();
    }
  }, [user]);

  const loadIncomes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setIncomes(data || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load income sources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIncome = async () => {
    if (!user) return;
    
    try {
      const incomeData: any = {
        user_id: user.id,
        source_name: newIncome.source_name,
        amount: parseFloat(newIncome.amount),
        frequency: isOneTime ? 'one-time' : newIncome.frequency,
        is_recurring: !isOneTime,
      };

      // Add payment date for one-time payments
      if (isOneTime) {
        incomeData.payment_date = newIncome.payment_date;
      }

      if (editingIncome) {
        const { error } = await supabase
          .from('incomes')
          .update(incomeData)
          .eq('id', editingIncome.id);
        
        if (error) throw error;
        
        toast({
          title: isOneTime ? "One-time payment updated" : "Income updated",
          description: isOneTime 
            ? "Your one-time payment has been updated" 
            : "Your income source has been updated",
        });
      } else {
        const { error } = await supabase
          .from('incomes')
          .insert(incomeData);
        
        if (error) throw error;
        
        toast({
          title: isOneTime ? "One-time payment added" : "Income added",
          description: isOneTime 
            ? "Your one-time payment has been recorded" 
            : "Your new income source has been added",
        });
      }

      setIsAddModalOpen(false);
      setEditingIncome(null);
      setIsOneTime(false);
      setNewIncome({
        source_name: '',
        amount: '',
        frequency: 'monthly',
        payment_date: new Date().toISOString().split('T')[0],
      });
      loadIncomes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save income",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (incomes.length === 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one income source",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Income deleted",
        description: "Your income source has been deleted",
      });
      
      loadIncomes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete income",
        variant: "destructive",
      });
    }
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsOneTime(income.frequency === 'one-time');
    setNewIncome({
      source_name: income.source_name,
      amount: income.amount.toString(),
      frequency: income.frequency === 'one-time' ? 'monthly' : income.frequency,
      payment_date: income.payment_date || new Date().toISOString().split('T')[0],
    });
    setIsAddModalOpen(true);
  };

  // Calculate totals
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Separate recurring and one-time incomes
  const recurringIncomes = incomes.filter(income => income.is_recurring !== false);
  const oneTimeIncomes = incomes.filter(income => income.is_recurring === false);
  
  // Calculate recurring monthly income
  const totalRecurringMonthly = recurringIncomes.reduce((sum, income) => {
    return sum + normalizeToMonthly(income.amount, income.frequency);
  }, 0);
  
  // Calculate one-time payments for current month
  const oneTimeThisMonth = oneTimeIncomes
    .filter(income => {
      if (!income.payment_date) return false;
      const paymentDate = new Date(income.payment_date);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    })
    .reduce((sum, income) => sum + Number(income.amount), 0);
  
  const totalMonthlyIncome = totalRecurringMonthly + oneTimeThisMonth;
  const totalYearlyIncome = totalRecurringMonthly * 12;

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'one-time': return 'One-time';
      default: return frequency;
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return '7d';
      case 'bi-weekly': return '14d';
      case 'monthly': return '30d';
      case 'one-time': return 'Once';
      default: return '';
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 md:border-b-1 md:border-gray-200 md:top-16 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-3">Income Sources</h1>
            
            {/* Income Summary */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(totalMonthlyIncome)}
                    </p>
                    {oneTimeThisMonth > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        incl. {formatCurrency(oneTimeThisMonth)} one-time
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <p className="text-xs text-muted-foreground">Yearly (Recurring)</p>
                    </div>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(totalYearlyIncome)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(totalRecurringMonthly)}/mo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {incomes.length === 0 && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to add at least one income source to use the app
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Income List */}
        <div className="flex-1 p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading income sources...</p>
            </div>
          ) : incomes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No income sources yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first income source to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Recurring Incomes Section */}
              {recurringIncomes.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Recurring Income</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {formatCurrency(totalRecurringMonthly)}/mo
                    </Badge>
                  </div>
                  {recurringIncomes.map(income => {
                    const monthlyAmount = normalizeToMonthly(income.amount, income.frequency);
                    
                    return (
                      <Card key={income.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                {income.source_name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">
                                  {getFrequencyDisplay(income.frequency)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {getFrequencyIcon(income.frequency)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEditIncome(income)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-danger hover:text-danger"
                                onClick={() => handleDeleteIncome(income.id)}
                                disabled={incomes.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Amount</p>
                              <p className="font-bold text-lg">{formatCurrency(income.amount)}</p>
                              <p className="text-xs text-muted-foreground">per {income.frequency.replace('-', ' ')}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                              <p className="font-bold text-lg text-primary">{formatCurrency(monthlyAmount)}</p>
                              <p className="text-xs text-muted-foreground">normalized</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}

              {/* One-Time Payments Section */}
              {oneTimeIncomes.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <Zap className="h-4 w-4 text-warning" />
                    <h3 className="font-semibold text-sm">One-Time Payments</h3>
                    {oneTimeThisMonth > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {formatCurrency(oneTimeThisMonth)} this month
                      </Badge>
                    )}
                  </div>
                  {oneTimeIncomes.map(income => {
                    const paymentDate = income.payment_date ? new Date(income.payment_date) : null;
                    const isCurrentMonth = paymentDate && 
                      paymentDate.getMonth() === currentMonth && 
                      paymentDate.getFullYear() === currentYear;
                    
                    return (
                      <Card key={income.id} className={cn(
                        "overflow-hidden",
                        !isCurrentMonth && "opacity-60"
                      )}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="h-4 w-4 text-warning" />
                                {income.source_name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="bg-warning/10">
                                  One-time
                                </Badge>
                                {paymentDate && (
                                  <Badge variant="secondary" className="text-xs">
                                    {paymentDate.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: paymentDate.getFullYear() !== currentYear ? 'numeric' : undefined
                                    })}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEditIncome(income)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-danger hover:text-danger"
                                onClick={() => handleDeleteIncome(income.id)}
                                disabled={incomes.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Amount</p>
                              <p className="font-bold text-lg">{formatCurrency(income.amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Status</p>
                              <p className="font-semibold text-sm">
                                {isCurrentMonth ? (
                                  <span className="text-success">Applied this month</span>
                                ) : (
                                  <span className="text-muted-foreground">Past payment</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* FAB */}
        <FAB onClick={() => {
          setEditingIncome(null);
          setIsOneTime(false);
          setNewIncome({
            source_name: '',
            amount: '',
            frequency: 'monthly',
            payment_date: new Date().toISOString().split('T')[0],
          });
          setIsAddModalOpen(true);
        }} />

        {/* Add/Edit Income Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIncome 
                  ? (editingIncome.frequency === 'one-time' ? 'Edit One-Time Payment' : 'Edit Income Source')
                  : (isOneTime ? 'Add One-Time Payment' : 'Add Income Source')
                }
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Income Type Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label htmlFor="income-type" className="flex items-center gap-2 cursor-pointer">
                  {isOneTime ? (
                    <>
                      <Zap className="h-4 w-4 text-primary" />
                      <span>One-Time Payment</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>Recurring Income</span>
                    </>
                  )}
                </Label>
                <Button
                  id="income-type"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOneTime(!isOneTime)}
                  className="h-8"
                >
                  {isOneTime ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </Button>
              </div>

              <div>
                <Label htmlFor="source">
                  {isOneTime ? 'Payment Description' : 'Source Name'}
                </Label>
                <Input
                  id="source"
                  value={newIncome.source_name}
                  onChange={(e) => setNewIncome({ ...newIncome, source_name: e.target.value })}
                  placeholder={isOneTime ? "e.g., Tax Refund" : "e.g., Main Job"}
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              {isOneTime ? (
                <div>
                  <Label htmlFor="payment-date">Date Received</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={newIncome.payment_date}
                    onChange={(e) => setNewIncome({ ...newIncome, payment_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This payment will only affect the month it was received
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    value={newIncome.frequency} 
                    onValueChange={(value) => setNewIncome({ ...newIncome, frequency: value })}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {newIncome.amount && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    {isOneTime ? (
                      <>This one-time payment of {formatCurrency(parseFloat(newIncome.amount))} will be added to your {new Date(newIncome.payment_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} income</>
                    ) : (
                      <>This will contribute {formatCurrency(normalizeToMonthly(parseFloat(newIncome.amount), newIncome.frequency))} to your monthly income</>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleSaveIncome} 
                className="w-full"
                disabled={!newIncome.source_name || !newIncome.amount}
              >
                {editingIncome 
                  ? (isOneTime ? 'Update Payment' : 'Update Income')
                  : (isOneTime ? 'Add Payment' : 'Add Income')
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}