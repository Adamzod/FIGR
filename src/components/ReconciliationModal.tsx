import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/finance-utils';
import { TrendingUp, PiggyBank, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileReconciliationModal } from '@/components/mobile/MobileReconciliationModal';

export default function ReconciliationModal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [decision, setDecision] = useState<'rollover' | 'goal_contribution'>('rollover');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      checkForReconciliation();
    }
  }, [user]);

  const checkForReconciliation = async () => {
    // Check for unprocessed reconciliation decisions
    const { data: reconciliationData } = await supabase
      .from('reconciliation_decisions')
      .select('*')
      .eq('user_id', user?.id)
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reconciliationData) {
      setReconciliation(reconciliationData);
      
      // Load goals for contribution option
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_completed', false);
      
      setGoals(goalsData || []);
      setIsOpen(true);
    }
  };

  const handleDecision = async () => {
    if (decision === 'goal_contribution' && !selectedGoalId) {
      toast({
        title: "Please select a goal",
        description: "You must choose a goal to contribute to",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const { data, error } = await supabase.functions.invoke('apply-reconciliation-decision', {
      body: {
        decision,
        target_goal_id: decision === 'goal_contribution' ? selectedGoalId : null,
        reconciliation_id: reconciliation.id,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: decision === 'rollover' 
          ? "Surplus has been rolled over to this month" 
          : "Surplus has been contributed to your goal",
      });
      setIsOpen(false);
    }
    
    setIsProcessing(false);
  };

  if (!reconciliation) return null;

  // Mobile version
  if (isMobile) {
    return (
      <MobileReconciliationModal
        open={isOpen}
        onOpenChange={setIsOpen}
        surplus={parseFloat(reconciliation.surplus_amount)}
        goals={goals}
        onDecision={async (dec, goalId) => {
          setDecision(dec);
          setSelectedGoalId(goalId || '');
          await handleDecision();
        }}
        isProcessing={isProcessing}
      />
    );
  }

  // Desktop version
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Monthly Reconciliation
          </DialogTitle>
          <DialogDescription>
            You have a surplus from last month. How would you like to handle it?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Last Month's Surplus</p>
                <p className="text-3xl font-bold text-success">
                  {formatCurrency(parseFloat(reconciliation.surplus_amount))}
                </p>
              </div>
            </CardContent>
          </Card>

          <RadioGroup value={decision} onValueChange={(value: any) => setDecision(value)}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="rollover" id="rollover" />
                <Label htmlFor="rollover" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">Rollover to Current Month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add the surplus to this month's available funds
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <RadioGroupItem value="goal_contribution" id="goal_contribution" />
                <Label htmlFor="goal_contribution" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <PiggyBank className="h-4 w-4" />
                    <span className="font-semibold">Contribute to a Goal</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Put the surplus towards one of your savings goals
                  </p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {decision === 'goal_contribution' && (
            <div>
              <Label htmlFor="goal-select">Select Goal</Label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger id="goal-select">
                  <SelectValue placeholder="Choose a goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.goal_name} ({formatCurrency(parseFloat(goal.current_amount))} / {formatCurrency(parseFloat(goal.target_amount))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            onClick={handleDecision} 
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Decision'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}