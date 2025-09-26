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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionSkeleton } from '@/components/ui/skeletons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { 
  CreditCard, 
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  Calculator,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Subscription {
  id: string;
  name: string;
  payment_type: string;
  amount: number | null;
  total_loan_amount: number | null;
  payoff_period_months: number | null;
  next_due_date: string;
  billing_cycle: string;
  category_id: string | null;
  created_at: string;
}

export default function SubscriptionsMobile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recurring' | 'fixed' | 'variable'>('all');
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    payment_type: 'recurring',
    amount: '',
    total_loan_amount: '',
    payoff_period_months: '',
    next_due_date: new Date().toISOString().split('T')[0],
    billing_cycle: 'monthly',
  });

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date');
      
      setSubscriptions(data || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSubscription = async () => {
    if (!user) return;
    
    try {
      const subscriptionData: any = {
        user_id: user.id,
        name: newSubscription.name,
        payment_type: newSubscription.payment_type,
        next_due_date: newSubscription.next_due_date,
        billing_cycle: newSubscription.billing_cycle,
      };

      if (newSubscription.payment_type === 'fixed_term') {
        subscriptionData.total_loan_amount = parseFloat(newSubscription.total_loan_amount);
        subscriptionData.payoff_period_months = parseInt(newSubscription.payoff_period_months);
        subscriptionData.amount = subscriptionData.total_loan_amount / subscriptionData.payoff_period_months;
      } else if (newSubscription.payment_type !== 'variable_recurring') {
        subscriptionData.amount = parseFloat(newSubscription.amount);
      }

      if (editingSubscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', editingSubscription.id);
        
        if (error) throw error;
        
        toast({
          title: "Subscription updated",
          description: "Your subscription has been updated",
        });
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert(subscriptionData);
        
        if (error) throw error;
        
        toast({
          title: "Subscription added",
          description: "Your new subscription has been added",
        });
      }

      setIsAddModalOpen(false);
      setEditingSubscription(null);
      setNewSubscription({
        name: '',
        payment_type: 'recurring',
        amount: '',
        total_loan_amount: '',
        payoff_period_months: '',
        next_due_date: new Date().toISOString().split('T')[0],
        billing_cycle: 'monthly',
      });
      loadSubscriptions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save subscription",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Subscription deleted",
        description: "Your subscription has been deleted",
      });
      
      loadSubscriptions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete subscription",
        variant: "destructive",
      });
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setNewSubscription({
      name: subscription.name,
      payment_type: subscription.payment_type,
      amount: subscription.amount?.toString() || '',
      total_loan_amount: subscription.total_loan_amount?.toString() || '',
      payoff_period_months: subscription.payoff_period_months?.toString() || '',
      next_due_date: subscription.next_due_date,
      billing_cycle: subscription.billing_cycle,
    });
    setIsAddModalOpen(true);
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(s => {
    if (activeTab === 'all') return true;
    if (activeTab === 'recurring') return s.payment_type === 'recurring';
    if (activeTab === 'fixed') return s.payment_type === 'fixed_term';
    if (activeTab === 'variable') return s.payment_type === 'variable_recurring';
    return true;
  });

  // Calculate totals
  const totalMonthly = subscriptions.reduce((sum, sub) => {
    if (sub.payment_type === 'variable_recurring') return sum;
    return sum + (sub.amount || 0);
  }, 0);

  const upcomingCount = subscriptions.filter(s => {
    const dueDate = new Date(s.next_due_date);
    const today = new Date();
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  }).length;

  const getPaymentTypeDisplay = (type: string) => {
    switch (type) {
      case 'recurring': return 'Recurring';
      case 'fixed_term': return 'Fixed Term';
      case 'variable_recurring': return 'Variable';
      default: return type;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'recurring': return 'default';
      case 'fixed_term': return 'secondary';
      case 'variable_recurring': return 'outline';
      default: return 'default';
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 md:border-b-1 md:border-gray-200 md:top-16 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-3">Subscriptions</h1>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Cost</p>
                      <p className="text-lg font-bold">{formatCurrency(totalMonthly)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Soon</p>
                      <p className="text-lg font-bold">{upcomingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="recurring">Regular</TabsTrigger>
                <TabsTrigger value="fixed">Fixed</TabsTrigger>
                <TabsTrigger value="variable">Variable</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="flex-1 p-4 space-y-3">
          {loading ? (
            <SubscriptionSkeleton />
          ) : filteredSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {activeTab === 'all' 
                    ? "No subscriptions yet" 
                    : `No ${getPaymentTypeDisplay(activeTab).toLowerCase()} subscriptions`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your recurring payments to track them
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSubscriptions.map(subscription => {
              const dueDate = new Date(subscription.next_due_date);
              const today = new Date();
              const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isDueSoon = daysUntil <= 7 && daysUntil >= 0;
              const isOverdue = daysUntil < 0;
              
              return (
                <Card key={subscription.id} className={cn(
                  "overflow-hidden",
                  isDueSoon && "border-warning/50",
                  isOverdue && "border-danger"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {subscription.name}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getPaymentTypeColor(subscription.payment_type) as any}>
                            {getPaymentTypeDisplay(subscription.payment_type)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {subscription.billing_cycle}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditSubscription(subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-danger hover:text-danger"
                          onClick={() => handleDeleteSubscription(subscription.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {subscription.payment_type !== 'variable_recurring' && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span className="font-bold text-lg">
                            {formatCurrency(subscription.amount || 0)}
                          </span>
                        </div>
                      )}
                      
                      {subscription.payment_type === 'fixed_term' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Loan</span>
                            <span className="font-medium">
                              {formatCurrency(subscription.total_loan_amount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Remaining</span>
                            <span className="font-medium">
                              {subscription.payoff_period_months} months
                            </span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Next Due</span>
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          isDueSoon && "text-warning",
                          isOverdue && "text-danger"
                        )}>
                          {formatDate(subscription.next_due_date)}
                        </span>
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
          setEditingSubscription(null);
          setNewSubscription({
            name: '',
            payment_type: 'recurring',
            amount: '',
            total_loan_amount: '',
            payoff_period_months: '',
            next_due_date: new Date().toISOString().split('T')[0],
            billing_cycle: 'monthly',
          });
          setIsAddModalOpen(true);
        }} />

        {/* Add/Edit Subscription Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newSubscription.name}
                  onChange={(e) => setNewSubscription({ ...newSubscription, name: e.target.value })}
                  placeholder="e.g., Netflix"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Payment Type</Label>
                <Select 
                  value={newSubscription.payment_type} 
                  onValueChange={(value) => setNewSubscription({ ...newSubscription, payment_type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">Recurring (Fixed Amount)</SelectItem>
                    <SelectItem value="fixed_term">Fixed Term (Loan/Payment Plan)</SelectItem>
                    <SelectItem value="variable_recurring">Variable (Amount Changes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newSubscription.payment_type === 'recurring' && (
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newSubscription.amount}
                    onChange={(e) => setNewSubscription({ ...newSubscription, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              )}
              
              {newSubscription.payment_type === 'fixed_term' && (
                <>
                  <div>
                    <Label htmlFor="total">Total Loan Amount</Label>
                    <Input
                      id="total"
                      type="number"
                      step="0.01"
                      value={newSubscription.total_loan_amount}
                      onChange={(e) => setNewSubscription({ ...newSubscription, total_loan_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="months">Payoff Period (months)</Label>
                    <Input
                      id="months"
                      type="number"
                      value={newSubscription.payoff_period_months}
                      onChange={(e) => setNewSubscription({ ...newSubscription, payoff_period_months: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                  {newSubscription.total_loan_amount && newSubscription.payoff_period_months && (
                    <Alert>
                      <Calculator className="h-4 w-4" />
                      <AlertDescription>
                        Monthly payment: {formatCurrency(
                          parseFloat(newSubscription.total_loan_amount) / parseInt(newSubscription.payoff_period_months)
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              
              <div>
                <Label htmlFor="due">Next Due Date</Label>
                <Input
                  id="due"
                  type="date"
                  value={newSubscription.next_due_date}
                  onChange={(e) => setNewSubscription({ ...newSubscription, next_due_date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="cycle">Billing Cycle</Label>
                <Select 
                  value={newSubscription.billing_cycle} 
                  onValueChange={(value) => setNewSubscription({ ...newSubscription, billing_cycle: value })}
                >
                  <SelectTrigger id="cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSaveSubscription} 
                className="w-full"
                disabled={!newSubscription.name || !newSubscription.next_due_date}
              >
                {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}