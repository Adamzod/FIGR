import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/finance-utils';
import { cn } from '@/lib/utils';

interface BudgetCardProps {
  availableFunds: number;
  totalIncome: number;
  totalSpent: number;
  className?: string;
}

export function BudgetCard({ 
  availableFunds, 
  totalIncome, 
  totalSpent,
  className 
}: BudgetCardProps) {
  const spentPercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0;
  const isOverBudget = totalSpent > totalIncome;
  
  return (
    <Card className={cn(
      'p-6 shadow-card',
      className
    )}>
      <div className="text-center space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Available Budget</p>
          <p className={cn(
            'text-5xl font-bold tabular-nums',
            isOverBudget ? 'text-danger' : 'text-foreground'
          )}>
            {formatCurrency(availableFunds)}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Spent: {formatCurrency(totalSpent)}
            </span>
            <span className="font-medium">
              {Math.round(spentPercentage)}%
            </span>
          </div>
          
          <Progress 
            value={Math.min(spentPercentage, 100)} 
            className={cn(
              'h-2',
              isOverBudget && '[&>div]:bg-danger'
            )}
          />
          
          <p className="text-xs text-muted-foreground text-center">
            of {formatCurrency(totalIncome)} monthly income
          </p>
        </div>
      </div>
    </Card>
  );
}