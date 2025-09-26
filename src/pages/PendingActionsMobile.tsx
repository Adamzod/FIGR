import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PendingActionModal } from '@/components/ui/mobile-modals';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PendingActionsSkeleton } from '@/components/ui/skeletons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { 
  Bell, 
  CheckCircle,
  DollarSign,
  Calendar,
  AlertCircle,
  Zap,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingAction {
  id: string;
  kind: string;
  payload: any;
  due_date: string;
  resolved: boolean;
  created_at: string;
}

export default function PendingActionsMobile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);
  const [completionAmount, setCompletionAmount] = useState('');

  useEffect(() => {
    if (user) {
      loadPendingActions();
    }
  }, [user]);

  const loadPendingActions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('pending_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('resolved', false)
        .order('due_date');
      
      setPendingActions(data || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load pending actions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAction = async (amount: number) => {
    if (!user || !selectedAction) return;
    
    try {
      // Create transaction for the variable bill
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: selectedAction.payload.subscription_name || 'Variable Bill Payment',
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          category_id: selectedAction.payload.category_id || null,
          note: 'Variable subscription payment',
        });
      
      if (transactionError) throw transactionError;

      // Mark action as resolved
      const { error: actionError } = await supabase
        .from('pending_actions')
        .update({ resolved: true })
        .eq('id', selectedAction.id);
      
      if (actionError) throw actionError;

      // Update subscription next due date if applicable
      if (selectedAction.payload.subscription_id) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('billing_cycle, next_due_date')
          .eq('id', selectedAction.payload.subscription_id)
          .single();
        
        if (subscription) {
          const nextDate = calculateNextDueDate(
            subscription.next_due_date, 
            subscription.billing_cycle
          );
          
          await supabase
            .from('subscriptions')
            .update({ next_due_date: nextDate })
            .eq('id', selectedAction.payload.subscription_id);
        }
      }
      
      toast({
        title: "Action completed",
        description: "Payment has been recorded successfully",
      });
      
      setIsCompleteModalOpen(false);
      setSelectedAction(null);
      loadPendingActions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete action",
        variant: "destructive",
      });
    }
  };

  const calculateNextDueDate = (currentDate: string, billingCycle: string): string => {
    const date = new Date(currentDate);
    
    switch (billingCycle) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'bi-weekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString().split('T')[0];
  };

  const getActionIcon = (kind: string) => {
    switch (kind) {
      case 'variable_bill':
        return <Zap className="h-4 w-4" />;
      case 'payment_reminder':
        return <Bell className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActionTitle = (action: PendingAction) => {
    if (action.kind === 'variable_bill') {
      return action.payload.subscription_name || 'Variable Bill';
    }
    return action.payload.title || 'Pending Action';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Group actions by urgency
  const overdueActions = pendingActions.filter(a => getDaysUntilDue(a.due_date) < 0);
  const todayActions = pendingActions.filter(a => getDaysUntilDue(a.due_date) === 0);
  const upcomingActions = pendingActions.filter(a => getDaysUntilDue(a.due_date) > 0);

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur md:border-b-1 md:border-gray-200 md:top-16 supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-3">Pending Actions</h1>
            
            {/* Summary */}
            {pendingActions.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <Card className={cn(
                  "border",
                  overdueActions.length > 0 && "border-danger/50 bg-danger/5"
                )}>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-danger">{overdueActions.length}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </CardContent>
                </Card>
                
                <Card className={cn(
                  "border",
                  todayActions.length > 0 && "border-warning/50 bg-warning/5"
                )}>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-warning">{todayActions.length}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold">{upcomingActions.length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Actions List */}
        <div className="flex-1 p-4 space-y-4">
          {loading ? (
            <PendingActionsSkeleton />
          ) : pendingActions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success/50" />
                <p className="text-muted-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No pending actions at the moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overdue Actions */}
              {overdueActions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-danger px-1">
                    Overdue ({overdueActions.length})
                  </h3>
                  {overdueActions.map(action => (
                    <ActionCard 
                      key={action.id} 
                      action={action} 
                      onComplete={() => {
                        setSelectedAction(action);
                        setIsCompleteModalOpen(true);
                      }}
                      isOverdue
                    />
                  ))}
                </div>
              )}

              {/* Today's Actions */}
              {todayActions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-warning px-1">
                    Due Today ({todayActions.length})
                  </h3>
                  {todayActions.map(action => (
                    <ActionCard 
                      key={action.id} 
                      action={action} 
                      onComplete={() => {
                        setSelectedAction(action);
                        setIsCompleteModalOpen(true);
                      }}
                      isDueToday
                    />
                  ))}
                </div>
              )}

              {/* Upcoming Actions */}
              {upcomingActions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground px-1">
                    Upcoming ({upcomingActions.length})
                  </h3>
                  {upcomingActions.map(action => (
                    <ActionCard 
                      key={action.id} 
                      action={action} 
                      onComplete={() => {
                        setSelectedAction(action);
                        setIsCompleteModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Complete Action Modal */}
        <PendingActionModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          onSubmit={handleCompleteAction}
          actionTitle={selectedAction ? getActionTitle(selectedAction) : ''}
          dueDate={selectedAction?.due_date || ''}
          loading={false}
        />
      </div>
    </MobileLayout>
  );
}

// Action Card Component
function ActionCard({ 
  action, 
  onComplete, 
  isOverdue = false, 
  isDueToday = false 
}: { 
  action: PendingAction; 
  onComplete: () => void;
  isOverdue?: boolean;
  isDueToday?: boolean;
}) {
  const daysUntil = Math.ceil(
    (new Date(action.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={cn(
      "overflow-hidden",
      isOverdue && "border-danger",
      isDueToday && "border-warning"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {action.kind === 'variable_bill' ? (
                <Zap className="h-4 w-4 text-warning" />
              ) : (
                <Bell className="h-4 w-4 text-primary" />
              )}
              {action.payload.subscription_name || action.payload.title || 'Pending Action'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isOverdue ? "destructive" : isDueToday ? "default" : "secondary"}>
                {action.kind === 'variable_bill' ? 'Variable Bill' : 'Action Required'}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {isOverdue ? (
                  <span className="text-danger">{Math.abs(daysUntil)} days overdue</span>
                ) : isDueToday ? (
                  <span className="text-warning">Due today</span>
                ) : (
                  <span>Due in {daysUntil} days</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Due Date</span>
            </div>
            <span className={cn(
              "text-sm font-medium",
              isOverdue && "text-danger",
              isDueToday && "text-warning"
            )}>
              {formatDate(action.due_date)}
            </span>
          </div>
          
          {action.payload.description && (
            <p className="text-sm text-muted-foreground">
              {action.payload.description}
            </p>
          )}
          
          <Button 
            onClick={onComplete}
            className="w-full"
            variant={isOverdue ? "destructive" : isDueToday ? "default" : "outline"}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Enter Amount & Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}