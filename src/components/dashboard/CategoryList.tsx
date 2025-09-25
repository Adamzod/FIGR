import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/finance-utils';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  allocated_percentage: number;
  spent: number;
  budget: number;
  color?: string;
}

interface CategoryListProps {
  categories: Category[];
  totalIncome: number;
  className?: string;
}

const getCategoryColor = (index: number): string => {
  const colors = [
    'hsl(var(--category-red))',
    'hsl(var(--category-yellow))',
    'hsl(var(--category-green))',
    'hsl(var(--category-blue))',
    'hsl(var(--category-purple))',
  ];
  return colors[index % colors.length];
};

export function CategoryList({ categories, totalIncome, className }: CategoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      <Card className="p-4 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Spending Categories</h2>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="space-y-3">
          {filteredCategories.map((category, index) => {
            const budget = (category.allocated_percentage / 100) * totalIncome;
            const spentPercentage = budget > 0 ? (category.spent / budget) * 100 : 0;
            const remaining = budget - category.spent;
            const isExpanded = expandedCategories.has(category.id);
            const categoryColor = getCategoryColor(index);
            
            return (
              <div key={category.id} className="space-y-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full text-left space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColor }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(category.spent)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={Math.min(spentPercentage, 100)} 
                      className="flex-1 h-2"
                      style={{
                        '--progress-color': categoryColor
                      } as React.CSSProperties}
                    />
                    <span className={cn(
                      'text-xs font-medium tabular-nums min-w-[3rem] text-right',
                      spentPercentage > 100 ? 'text-danger' : 'text-muted-foreground'
                    )}>
                      {Math.round(spentPercentage)}%
                    </span>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="pl-7 pr-3 pb-2 text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Budget:</span>
                      <span className="tabular-nums">{formatCurrency(budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className={cn(
                        'tabular-nums font-medium',
                        remaining < 0 ? 'text-danger' : 'text-success'
                      )}>
                        {formatCurrency(Math.abs(remaining))}
                        {remaining < 0 && ' over'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No categories found
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}