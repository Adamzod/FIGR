import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  Calendar, 
  Target, 
  CreditCard, 
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";

const mobileFormFieldVariants = cva(
  "w-full",
  {
    variants: {
      size: {
        default: "min-h-[56px]",
        large: "min-h-[64px]",
        small: "min-h-[48px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

interface MobileFormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof mobileFormFieldVariants> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

const MobileFormField = React.forwardRef<HTMLDivElement, MobileFormFieldProps>(
  ({ className, children, label, description, error, required, icon, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(mobileFormFieldVariants({ size }), "space-y-2", className)}
      {...props}
    >
      {label && (
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
);
MobileFormField.displayName = "MobileFormField";

const MobileInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentPropsWithoutRef<typeof Input> & {
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
  }
>(({ className, icon, rightElement, ...props }, ref) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </div>
    )}
    <Input
      ref={ref}
      className={cn(
        "h-12 text-base pl-10 pr-10",
        icon && "pl-10",
        rightElement && "pr-10",
        className
      )}
      {...props}
    />
    {rightElement && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {rightElement}
      </div>
    )}
  </div>
));
MobileInput.displayName = "MobileInput";

const MobileSelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  React.ComponentPropsWithoutRef<typeof SelectTrigger> & {
    icon?: React.ReactNode;
  }
>(({ className, icon, children, ...props }, ref) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
        {icon}
      </div>
    )}
    <SelectTrigger
      ref={ref}
      className={cn(
        "h-12 text-base",
        icon && "pl-10",
        className
      )}
      {...props}
    >
      {children}
    </SelectTrigger>
  </div>
));
MobileSelect.displayName = "MobileSelect";

const MobileTextarea = React.forwardRef<
  React.ElementRef<typeof Textarea>,
  React.ComponentPropsWithoutRef<typeof Textarea>
>(({ className, ...props }, ref) => (
  <Textarea
    ref={ref}
    className={cn(
      "min-h-[80px] text-base resize-none",
      className
    )}
    {...props}
  />
));
MobileTextarea.displayName = "MobileTextarea";

const MobileSlider = React.forwardRef<
  React.ElementRef<typeof Slider>,
  React.ComponentPropsWithoutRef<typeof Slider> & {
    label?: string;
    value?: number[];
    onValueChange?: (value: number[]) => void;
    formatValue?: (value: number) => string;
  }
>(({ className, label, value = [0], onValueChange, formatValue, ...props }, ref) => (
  <div className="space-y-3">
    {label && (
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="secondary" className="text-sm">
          {formatValue ? formatValue(value[0]) : value[0]}
        </Badge>
      </div>
    )}
    <div className="px-2">
      <Slider
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        className={cn("h-2", className)}
        {...props}
      />
    </div>
  </div>
));
MobileSlider.displayName = "MobileSlider";

const MobileActionButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button> & {
    icon?: React.ReactNode;
    loading?: boolean;
    success?: boolean;
  }
>(({ className, icon, loading, success, children, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      "h-12 text-base font-medium",
      className
    )}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    ) : success ? (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        {children}
      </div>
    ) : (
      <div className="flex items-center gap-2">
        {icon}
        {children}
      </div>
    )}
  </Button>
));
MobileActionButton.displayName = "MobileActionButton";

const QuickAmountButtons = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    amounts: number[];
    selectedAmount?: number;
    onAmountSelect: (amount: number) => void;
    currency?: string;
  }
>(({ className, amounts, selectedAmount, onAmountSelect, currency = "$", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("grid grid-cols-4 gap-3", className)}
    {...props}
  >
    {amounts.map((amount) => (
      <Button
        key={amount}
        variant={selectedAmount === amount ? "default" : "outline"}
        className="h-12 text-base font-medium"
        onClick={() => onAmountSelect(amount)}
      >
        {currency}{amount}
      </Button>
    ))}
  </div>
));
QuickAmountButtons.displayName = "QuickAmountButtons";

const MobileFormSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string;
    description?: string;
  }
>(({ className, title, description, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  >
    {(title || description) && (
      <div className="space-y-1">
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    )}
    <div className="space-y-4">
      {children}
    </div>
  </div>
));
MobileFormSection.displayName = "MobileFormSection";

export {
  MobileFormField,
  MobileInput,
  MobileSelect,
  MobileTextarea,
  MobileSlider,
  MobileActionButton,
  QuickAmountButtons,
  MobileFormSection,
};
