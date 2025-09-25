import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, normalizeToMonthly } from '@/lib/finance-utils';
import { ArrowLeft, Plus, Edit, Trash2, DollarSign, TrendingUp } from 'lucide-react';

export default function Incomes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [sourceName, setSourceName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadIncomes();
    }
  }, [user]);

  const loadIncomes = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setIncomes(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!sourceName || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const incomeData = {
      user_id: user?.id,
      source_name: sourceName,
      amount: parseFloat(amount),
      frequency,
    };

    if (editingId) {
      const { error } = await supabase
        .from('incomes')
        .update(incomeData)
        .eq('id', editingId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Income updated successfully" });
        resetForm();
        loadIncomes();
      }
    } else {
      const { error } = await supabase
        .from('incomes')
        .insert(incomeData);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Income added successfully" });
        resetForm();
        loadIncomes();
      }
    }
  };

  const handleEdit = (income: any) => {
    setSourceName(income.source_name);
    setAmount(income.amount);
    setFrequency(income.frequency);
    setEditingId(income.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income source?')) return;

    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Income deleted successfully" });
      loadIncomes();
    }
  };

  const resetForm = () => {
    setSourceName('');
    setAmount('');
    setFrequency('monthly');
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const totalMonthlyIncome = incomes.reduce((sum, income) => 
    sum + normalizeToMonthly(income.amount, income.frequency), 0
  );

  const totalYearlyIncome = totalMonthlyIncome * 12;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Income Sources</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Income' : 'Add New Income'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="source">Income Source</Label>
                    <Input
                      id="source"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder="e.g., Main Job, Freelancing, Investment"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
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
                  <Button onClick={handleSubmit} className="w-full">
                    {editingId ? 'Update Income' : 'Add Income'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Monthly Income</CardTitle>
              <CardDescription>Normalized to monthly amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalMonthlyIncome)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Total Yearly Income</CardTitle>
              <CardDescription>Projected annual income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalYearlyIncome)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Income List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading income sources...</div>
              </CardContent>
            </Card>
          ) : incomes.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No income sources yet. Add your first income!</p>
              </CardContent>
            </Card>
          ) : (
            incomes.map(income => (
              <Card key={income.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{income.source_name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(income)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(income.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {formatCurrency(parseFloat(income.amount))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="capitalize">{income.frequency.replace('-', ' ')}</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatCurrency(normalizeToMonthly(income.amount, income.frequency))}/mo
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}