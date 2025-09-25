import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { ArrowLeft, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';

export default function PendingActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (user) {
      loadPendingActions();
    }
  }, [user]);

  const loadPendingActions = async () => {
    setLoading(true);
    
    const { data } = await supabase
      .from('pending_actions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('resolved', false)
      .order('due_date');
    
    setPendingActions(data || []);
    setLoading(false);
  };

  const handleResolveAction = async () => {
    if (!amount || !selectedAction) {
      toast({
        title: "Missing Information",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    const payload = selectedAction.payload as any;

    // Create transaction for the variable bill
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user?.id,
        name: payload.subscription_name || 'Variable Bill',
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0],
        category_id: payload.category_id || null,
        type: 'subscription',
        note: 'Variable subscription payment',
      });

    if (transactionError) {
      toast({
        title: "Error",
        description: transactionError.message,
        variant: "destructive",
      });
      return;
    }

    // Mark action as resolved
    const { error: updateError } = await supabase
      .from('pending_actions')
      .update({ resolved: true })
      .eq('id', selectedAction.id);

    if (updateError) {
      toast({
        title: "Error",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      toast({ 
        title: "Action completed",
        description: "Transaction has been recorded",
      });
      setAmount('');
      setSelectedAction(null);
      setIsDialogOpen(false);
      loadPendingActions();
    }
  };

  const getActionDescription = (action: any) => {
    const payload = action.payload as any;
    if (action.kind === 'variable_bill') {
      return `Enter amount for ${payload.subscription_name || 'Variable Bill'}`;
    }
    return action.kind;
  };

  const overduActions = pendingActions.filter(a => 
    new Date(a.due_date) < new Date(new Date().toISOString().split('T')[0])
  );

  const todayActions = pendingActions.filter(a => 
    a.due_date === new Date().toISOString().split('T')[0]
  );

  const upcomingActions = pendingActions.filter(a => 
    new Date(a.due_date) > new Date(new Date().toISOString().split('T')[0])
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Pending Actions</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Summary */}
        {pendingActions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {overduActions.length > 0 && (
              <Card className="border-danger">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-danger" />
                    Overdue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-danger">
                    {overduActions.length} action{overduActions.length !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {todayActions.length > 0 && (
              <Card className="border-warning">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    Due Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {todayActions.length} action{todayActions.length !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {upcomingActions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Upcoming
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {upcomingActions.length} action{upcomingActions.length !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Actions List */}
        <div className="space-y-2">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading pending actions...</div>
              </CardContent>
            </Card>
          ) : pendingActions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">No pending actions. You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            pendingActions.map(action => {
              const isOverdue = new Date(action.due_date) < new Date(new Date().toISOString().split('T')[0]);
              const isToday = action.due_date === new Date().toISOString().split('T')[0];
              
              return (
                <Card 
                  key={action.id} 
                  className={`hover:shadow-md transition-shadow ${
                    isOverdue ? 'border-danger' : isToday ? 'border-warning' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isOverdue ? (
                            <AlertCircle className="h-5 w-5 text-danger" />
                          ) : isToday ? (
                            <Clock className="h-5 w-5 text-warning" />
                          ) : (
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h3 className="font-semibold">{getActionDescription(action)}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {formatDate(action.due_date)}
                          {isOverdue && <span className="text-danger ml-2">(Overdue)</span>}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedAction(action);
                          setIsDialogOpen(true);
                        }}
                      >
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Complete Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Action</DialogTitle>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getActionDescription(selectedAction)}
                </p>
                <Label htmlFor="action-amount">Amount</Label>
                <Input
                  id="action-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <Button onClick={handleResolveAction} className="w-full">
                Record Transaction
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}