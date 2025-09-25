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
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { ArrowLeft, Plus, Edit, Trash2, CreditCard, Calendar, DollarSign, AlertCircle } from 'lucide-react';

export default function Subscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [paymentType, setPaymentType] = useState('recurring');
  const [amount, setAmount] = useState('');
  const [totalLoanAmount, setTotalLoanAmount] = useState('');
  const [payoffPeriodMonths, setPayoffPeriodMonths] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    // Load subscriptions
    const { data: subsData } = await supabase
      .from('subscriptions')
      .select('*, categories(name)')
      .eq('user_id', user?.id)
      .order('next_due_date');
    
    setSubscriptions(subsData || []);

    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_system', false)
      .order('name');
    
    setCategories(categoriesData || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!name || !nextDueDate || !paymentType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (paymentType !== 'variable_recurring' && !amount) {
      toast({
        title: "Missing Amount",
        description: "Amount is required for non-variable subscriptions",
        variant: "destructive",
      });
      return;
    }

    const subscriptionData: any = {
      user_id: user?.id,
      name,
      payment_type: paymentType,
      amount: paymentType === 'variable_recurring' ? null : parseFloat(amount),
      next_due_date: nextDueDate,
      billing_cycle: billingCycle,
      category_id: categoryId || null,
    };

    if (paymentType === 'fixed_term') {
      subscriptionData.total_loan_amount = totalLoanAmount ? parseFloat(totalLoanAmount) : null;
      subscriptionData.payoff_period_months = payoffPeriodMonths ? parseInt(payoffPeriodMonths) : null;
    }

    if (editingId) {
      const { error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', editingId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Subscription updated successfully" });
        resetForm();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Subscription added successfully" });
        resetForm();
        loadData();
      }
    }
  };

  const handleEdit = (subscription: any) => {
    setName(subscription.name);
    setPaymentType(subscription.payment_type);
    setAmount(subscription.amount || '');
    setTotalLoanAmount(subscription.total_loan_amount || '');
    setPayoffPeriodMonths(subscription.payoff_period_months || '');
    setNextDueDate(subscription.next_due_date);
    setBillingCycle(subscription.billing_cycle);
    setCategoryId(subscription.category_id || '');
    setEditingId(subscription.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Subscription deleted successfully" });
      loadData();
    }
  };

  const resetForm = () => {
    setName('');
    setPaymentType('recurring');
    setAmount('');
    setTotalLoanAmount('');
    setPayoffPeriodMonths('');
    setNextDueDate('');
    setBillingCycle('monthly');
    setCategoryId('');
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const getMonthlyAmount = (sub: any) => {
    if (sub.payment_type === 'fixed_term' && sub.total_loan_amount && sub.payoff_period_months) {
      return parseFloat(sub.total_loan_amount) / sub.payoff_period_months;
    }
    return sub.amount ? parseFloat(sub.amount) : 0;
  };

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    if (sub.payment_type !== 'variable_recurring') {
      return sum + getMonthlyAmount(sub);
    }
    return sum;
  }, 0);

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
              <h1 className="text-2xl font-bold">Subscriptions</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Subscription' : 'Add New Subscription'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Subscription Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Netflix, Spotify, Car Loan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-type">Payment Type</Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger id="payment-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recurring">Recurring (Fixed Amount)</SelectItem>
                        <SelectItem value="fixed_term">Fixed Term (Loan/Installment)</SelectItem>
                        <SelectItem value="variable_recurring">Variable Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {paymentType !== 'variable_recurring' && (
                    <div>
                      <Label htmlFor="amount">
                        {paymentType === 'fixed_term' ? 'Monthly Payment' : 'Amount'}
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {paymentType === 'fixed_term' && (
                    <>
                      <div>
                        <Label htmlFor="total-loan">Total Loan Amount (Optional)</Label>
                        <Input
                          id="total-loan"
                          type="number"
                          step="0.01"
                          value={totalLoanAmount}
                          onChange={(e) => setTotalLoanAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="payoff-period">Payoff Period (Months)</Label>
                        <Input
                          id="payoff-period"
                          type="number"
                          value={payoffPeriodMonths}
                          onChange={(e) => setPayoffPeriodMonths(e.target.value)}
                          placeholder="e.g., 36"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="next-due">Next Due Date</Label>
                    <Input
                      id="next-due"
                      type="date"
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing-cycle">Billing Cycle</Label>
                    <Select value={billingCycle} onValueChange={setBillingCycle}>
                      <SelectTrigger id="billing-cycle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No category</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingId ? 'Update Subscription' : 'Add Subscription'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Subscription Cost</CardTitle>
            <CardDescription>
              Total recurring payments for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalMonthly)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {subscriptions.length} active subscription{subscriptions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Subscriptions List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading subscriptions...</div>
              </CardContent>
            </Card>
          ) : subscriptions.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No subscriptions yet. Add your recurring payments!</p>
              </CardContent>
            </Card>
          ) : (
            subscriptions.map(subscription => (
              <Card key={subscription.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{subscription.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {subscription.payment_type.replace('_', ' ')}
                        </span>
                        {subscription.categories && (
                          <span className="text-xs text-muted-foreground">
                            {subscription.categories.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(subscription)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subscription.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subscription.payment_type === 'variable_recurring' ? (
                      <div className="flex items-center gap-2 text-warning">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Variable amount</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold">
                        {formatCurrency(getMonthlyAmount(subscription))}
                        <span className="text-sm text-muted-foreground ml-1">
                          /{subscription.billing_cycle.replace('-', ' ')}
                        </span>
                      </div>
                    )}
                    
                    {subscription.payment_type === 'fixed_term' && subscription.total_loan_amount && (
                      <p className="text-sm text-muted-foreground">
                        Total: {formatCurrency(parseFloat(subscription.total_loan_amount))}
                        {subscription.payoff_period_months && (
                          <span> ({subscription.payoff_period_months} months)</span>
                        )}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Next due: {formatDate(subscription.next_due_date)}
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