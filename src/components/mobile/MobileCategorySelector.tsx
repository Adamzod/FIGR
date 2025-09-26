import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface MobileCategorySelectorProps {
  categories: Category[];
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
}

export function MobileCategorySelector({
  categories,
  value,
  onChange,
  className
}: MobileCategorySelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <button
        type="button"
        onClick={() => onChange('none')}
        className={cn(
          "relative p-3 rounded-lg border-2 transition-all touch-target",
          "hover:border-primary/50",
          value === 'none' || !value
            ? "border-primary bg-primary/10"
            : "border-border"
        )}
      >
        <span className="font-medium">No Category</span>
        {(value === 'none' || !value) && (
          <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
        )}
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={cn(
            "relative p-3 rounded-lg border-2 transition-all touch-target text-left",
            "hover:border-primary/50",
            value === category.id
              ? "border-primary bg-primary/10"
              : "border-border"
          )}
        >
          <span className="font-medium line-clamp-2">{category.name}</span>
          {value === category.id && (
            <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
          )}
        </button>
      ))}
    </div>
  );
}