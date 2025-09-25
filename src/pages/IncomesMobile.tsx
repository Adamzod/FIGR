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
import { formatCurrency, normalizeToMonthly } from '@/lib/finance-utils';
import { 
  DollarSign, 
  Edit, 
  Trash2, 
  TrendingUp,
  Briefcase,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Income {
  id: string;
  source_name: string;
  amount: number;
  frequency: string;
  created_at: string;
}

export default function IncomesMobile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [newIncome, setNewIncome] = useState({
    source_name: '',
    amount: '',
    frequency: 'monthly',
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
      const incomeData = {
        user_id: user.id,
        source_name: newIncome.source_name,
        amount: parseFloat(newIncome.amount),
        frequency: newIncome.frequency,
      };

      if (editingIncome) {
        const { error } = await supabase
          .from('incomes')
          .update(incomeData)
          .eq('id', editingIncome.id);
        
        if (error) throw error;
        
        toast({
          title: "Income updated",
          description: "Your income source has been updated",
        });
      } else {
        const { error } = await supabase
          .from('incomes')
          .insert(incomeData);
        
        if (error) throw error;
        
        toast({
          title: "Income added",
          description: "Your new income source has been added",
        });
      }

      setIsAddModalOpen(false);
      setEditingIncome(null);
      setNewIncome({
        source_name: '',
        amount: '',
        frequency: 'monthly',
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
    setNewIncome({
      source_name: income.source_name,
      amount: income.amount.toString(),
      frequency: income.frequency,
    });
    setIsAddModalOpen(true);
  };

  // Calculate totals
  const totalMonthlyIncome = incomes.reduce((sum, income) => {
    return sum + normalizeToMonthly(income.amount, income.frequency);
  }, 0);
  
  const totalYearlyIncome = totalMonthlyIncome * 12;

  const getFrequencyDisplay = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return '7d';
      case 'bi-weekly': return '14d';
      case 'monthly': return '30d';
      default: return '';
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-3">Income Sources</h1>
            
            {/* Income Summary */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Monthly Income</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(totalMonthlyIncome)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <p className="text-xs text-muted-foreground">Yearly Income</p>
                    </div>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(totalYearlyIncome)}
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
            incomes.map(income => {
              const monthlyAmount = normalizeToMonthly(income.amount, income.frequency);
              
              return (
                <Card key={income.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
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
            })
          )}
        </div>

        {/* FAB */}
        <FAB onClick={() => {
          setEditingIncome(null);
          setNewIncome({
            source_name: '',
            amount: '',
            frequency: 'monthly',
          });
          setIsAddModalOpen(true);
        }} />

        {/* Add/Edit Income Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingIncome ? 'Edit Income Source' : 'Add Income Source'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="source">Source Name</Label>
                <Input
                  id="source"
                  value={newIncome.source_name}
                  onChange={(e) => setNewIncome({ ...newIncome, source_name: e.target.value })}
                  placeholder="e.g., Main Job"
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
              
              {newIncome.amount && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    This will contribute {formatCurrency(normalizeToMonthly(parseFloat(newIncome.amount), newIncome.frequency))} to your monthly income
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleSaveIncome} 
                className="w-full"
                disabled={!newIncome.source_name || !newIncome.amount}
              >
                {editingIncome ? 'Update Income' : 'Add Income'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}