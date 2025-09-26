import React, { useState } from 'react';
import { MobileModal } from '@/components/ui/mobile-modal';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/finance-utils';
import { TrendingUp, PiggyBank, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  goal_name: string;
  current_amount: number;
  target_amount: number;
  is_completed: boolean;
}

interface MobileReconciliationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surplus: number;
  goals: Goal[];
  onDecision: (decision: 'rollover' | 'goal_contribution', goalId?: string) => void;
  isProcessing?: boolean;
}

export function MobileReconciliationModal({
  open,
  onOpenChange,
  surplus,
  goals,
  onDecision,
  isProcessing = false
}: MobileReconciliationModalProps) {
  const [decision, setDecision] = useState<'rollover' | 'goal_contribution' | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!decision) return;
    
    if (decision === 'goal_contribution' && !selectedGoalId) {
      return;
    }
    
    onDecision(decision, selectedGoalId || undefined);
  };

  const incompleteGoals = goals.filter(g => !g.is_completed);

  return (
    <MobileModal
      open={open}
      onOpenChange={onOpenChange}
      showHandle={false}
      className="max-h-[90vh]"
    >
      {/* Animated Success Header */}
      <div className="bg-gradient-to-b from-success/10 to-transparent p-6 -mx-4 -mt-4 mb-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-3 animate-pulse-glow">
            <Sparkles className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Great Month!</h2>
          <p className="text-muted-foreground">
            You have a surplus from last month
          </p>
          <div className="text-4xl font-bold text-success mt-3 animate-slide-up">
            {formatCurrency(surplus)}
          </div>
        </div>
      </div>

      {/* Decision Cards */}
      <div className="space-y-3 px-4">
        <p className="text-center text-muted-foreground mb-4">
          What would you like to do with your surplus?
        </p>

        {/* Rollover Option */}
        <button
          type="button"
          onClick={() => {
            setDecision('rollover');
            setSelectedGoalId(null);
          }}
          className={cn(
            "w-full p-4 rounded-lg border-2 transition-all text-left",
            "hover:border-primary/50 active:scale-[0.98]",
            decision === 'rollover'
              ? "border-primary bg-primary/10"
              : "border-border"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Roll Over to This Month</h3>
              <p className="text-sm text-muted-foreground">
                Add to your available funds for the current month
              </p>
            </div>
          </div>
        </button>

        {/* Goal Contribution Option */}
        <button
          type="button"
          onClick={() => {
            setDecision('goal_contribution');
            if (incompleteGoals.length === 1) {
              setSelectedGoalId(incompleteGoals[0].id);
            }
          }}
          className={cn(
            "w-full p-4 rounded-lg border-2 transition-all text-left",
            "hover:border-primary/50 active:scale-[0.98]",
            decision === 'goal_contribution'
              ? "border-primary bg-primary/10"
              : "border-border",
            incompleteGoals.length === 0 && "opacity-50 cursor-not-allowed"
          )}
          disabled={incompleteGoals.length === 0}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Contribute to a Goal</h3>
              <p className="text-sm text-muted-foreground">
                {incompleteGoals.length === 0
                  ? "No active goals available"
                  : "Boost your savings goals with the surplus"}
              </p>
            </div>
          </div>
        </button>

        {/* Goal Selection */}
        {decision === 'goal_contribution' && incompleteGoals.length > 0 && (
          <div className="space-y-3 animate-slide-up">
            <Label className="text-base font-semibold">Select a goal:</Label>
            <RadioGroup value={selectedGoalId || ''} onValueChange={setSelectedGoalId}>
              {incompleteGoals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                const newProgress = ((goal.current_amount + surplus) / goal.target_amount) * 100;
                
                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border transition-all",
                      "hover:border-primary/50",
                      selectedGoalId === goal.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <RadioGroupItem value={goal.id} id={goal.id} />
                    <Label
                      htmlFor={goal.id}
                      className="flex-1 cursor-pointer space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{goal.goal_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      
                      {/* Visual Progress Indicator */}
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute h-full bg-primary/30 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                        <div
                          className="absolute h-full bg-success animate-pulse transition-all"
                          style={{ width: `${Math.min(newProgress, 100)}%` }}
                        />
                      </div>
                      
                      {newProgress >= 100 && (
                        <p className="text-xs text-success font-medium">
                          🎉 This will complete your goal!
                        </p>
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6 px-4 pb-4">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isProcessing}
          className="touch-target"
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!decision || (decision === 'goal_contribution' && !selectedGoalId) || isProcessing}
          className="flex-1 touch-target"
        >
          {isProcessing ? 'Processing...' : 'Confirm Decision'}
        </Button>
      </div>
    </MobileModal>
  );
}