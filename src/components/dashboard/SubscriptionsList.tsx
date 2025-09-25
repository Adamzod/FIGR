import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, CreditCard, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { cn } from '@/lib/utils';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  next_due_date: string;
  billing_cycle: string;
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  className?: string;
}

export function SubscriptionsList({ subscriptions, className }: SubscriptionsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
  const displaySubscriptions = isExpanded ? subscriptions : subscriptions.slice(0, 3);
  
  return (
    <Card className={cn('p-4 shadow-card', className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Subscriptions</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(totalMonthly)}/mo
            </span>
            {subscriptions.length > 3 && (
              isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </div>
        </div>
      </button>
      
      <div className="space-y-2">
        {displaySubscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{subscription.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Next: {formatDate(subscription.next_due_date)}</span>
                </div>
              </div>
            </div>
            <span className="font-medium tabular-nums text-sm">
              {formatCurrency(subscription.amount)}
            </span>
          </div>
        ))}
        
        {subscriptions.length === 0 && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            No active subscriptions
          </p>
        )}
        
        {!isExpanded && subscriptions.length > 3 && (
          <p className="text-center text-muted-foreground text-xs pt-2">
            +{subscriptions.length - 3} more subscriptions
          </p>
        )}
      </div>
    </Card>
  );
}