import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Delete } from 'lucide-react';

interface MobileNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showCurrency?: boolean;
}

export function MobileNumberInput({
  value,
  onChange,
  placeholder = '0.00',
  className,
  showCurrency = true
}: MobileNumberInputProps) {
  const [displayValue, setDisplayValue] = useState(value || '');

  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  const handleNumberClick = (num: string) => {
    const newValue = displayValue === '0' ? num : displayValue + num;
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleDecimalClick = () => {
    if (!displayValue.includes('.')) {
      const newValue = displayValue || '0';
      setDisplayValue(newValue + '.');
      onChange(newValue + '.');
    }
  };

  const handleDelete = () => {
    const newValue = displayValue.slice(0, -1) || '0';
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setDisplayValue('');
    onChange('');
  };

  const formatDisplay = () => {
    if (!displayValue) return placeholder;
    const num = parseFloat(displayValue);
    if (isNaN(num)) return displayValue;
    return showCurrency ? `$${displayValue}` : displayValue;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Display */}
      <div className="bg-muted rounded-lg p-4 text-center">
        <div className="text-3xl font-bold min-h-[48px] flex items-center justify-center">
          {formatDisplay()}
        </div>
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            type="button"
            variant="outline"
            size="lg"
            className="h-14 text-lg font-semibold touch-target"
            onClick={() => handleNumberClick(num.toString())}
          >
            {num}
          </Button>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 text-lg font-semibold touch-target"
          onClick={handleDecimalClick}
        >
          .
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 text-lg font-semibold touch-target"
          onClick={() => handleNumberClick('0')}
        >
          0
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 touch-target"
          onClick={handleDelete}
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2">
        {['10', '25', '50', '100'].map((amount) => (
          <Button
            key={amount}
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => {
              setDisplayValue(amount);
              onChange(amount);
            }}
          >
            ${amount}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={handleClear}
      >
        Clear
      </Button>
    </div>
  );
}