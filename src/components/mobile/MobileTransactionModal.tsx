import React, { useState } from 'react';
import { MobileModal } from '@/components/ui/mobile-modal';
import { MobileNumberInput } from '@/components/mobile/MobileNumberInput';
import { MobileCategorySelector } from '@/components/mobile/MobileCategorySelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id?: string;
  name: string;
  amount: string;
  category_id: string;
  date: string;
  note: string;
}

interface Category {
  id: string;
  name: string;
}

interface MobileTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  categories: Category[];
  onSave: (transaction: Transaction) => void;
  isEditing?: boolean;
}

export function MobileTransactionModal({
  open,
  onOpenChange,
  transaction,
  categories,
  onSave,
  isEditing = false
}: MobileTransactionModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Transaction>(transaction);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = () => {
    onSave(formData);
    setStep(1);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.amount && parseFloat(formData.amount) > 0;
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-lg font-semibold mb-2 block">
                What did you spend on?
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Grocery shopping"
                className="text-lg p-6 touch-target"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-lg font-semibold mb-3 block">
                Select a category
              </Label>
              <MobileCategorySelector
                categories={categories}
                value={formData.category_id}
                onChange={(value) => setFormData({ ...formData, category_id: value })}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold mb-3 block">
              How much?
            </Label>
            <MobileNumberInput
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="date" className="text-lg font-semibold mb-2 block">
                When?
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="pl-12 text-lg p-6 touch-target"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="note" className="text-lg font-semibold mb-2 block">
                Add a note (optional)
              </Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Any additional details..."
                className="min-h-[100px] text-base"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const footer = (
    <div className="flex gap-2">
      {step > 1 && (
        <Button
          variant="outline"
          onClick={handlePrev}
          className="touch-target"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      )}
      
      {step < totalSteps ? (
        <Button
          onClick={handleNext}
          disabled={!isStepValid()}
          className="flex-1 touch-target"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      ) : (
        <Button
          onClick={handleSave}
          disabled={!formData.name || !formData.amount}
          className="flex-1 touch-target"
        >
          {isEditing ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      )}
    </div>
  );

  return (
    <MobileModal
      open={open}
      onOpenChange={(open) => {
        if (!open) setStep(1);
        onOpenChange(open);
      }}
      title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
      description={`Step ${step} of ${totalSteps}`}
      footer={footer}
    >
      {/* Progress Indicator */}
      <div className="flex gap-1 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {renderStep()}
    </MobileModal>
  );
}