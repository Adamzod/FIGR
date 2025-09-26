import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileBottomSheet = DialogPrimitive.Root;

const MobileBottomSheetTrigger = DialogPrimitive.Trigger;

const MobileBottomSheetClose = DialogPrimitive.Close;

const MobileBottomSheetPortal = DialogPrimitive.Portal;

const MobileBottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
MobileBottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const mobileBottomSheetVariants = cva(
  "fixed z-50 bg-background border-t shadow-lg transition-all duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      height: {
        auto: "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-xl",
        half: "bottom-0 left-0 right-0 h-[50vh] rounded-t-xl",
        full: "bottom-0 left-0 right-0 h-[90vh] rounded-t-xl",
        custom: "bottom-0 left-0 right-0 rounded-t-xl",
      },
    },
    defaultVariants: {
      height: "auto",
    },
  },
);

interface MobileBottomSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof mobileBottomSheetVariants> {
  showHandle?: boolean;
  keyboardAware?: boolean;
}

const MobileBottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  MobileBottomSheetContentProps
>(({ className, children, height = "auto", showHandle = true, keyboardAware = true, ...props }, ref) => {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    if (!keyboardAware) return;

    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
      setKeyboardHeight(keyboardHeight);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [keyboardAware]);

  const contentStyle = keyboardAware && keyboardHeight > 0 
    ? { marginBottom: `${keyboardHeight}px` }
    : {};

  return (
    <MobileBottomSheetPortal>
      <MobileBottomSheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(mobileBottomSheetVariants({ height }), className)}
        style={contentStyle}
        {...props}
      >
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-background/80 backdrop-blur-sm">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </MobileBottomSheetPortal>
  );
});
MobileBottomSheetContent.displayName = DialogPrimitive.Content.displayName;

const MobileBottomSheetHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 px-6 pt-4 pb-2", className)}
    {...props}
  />
));
MobileBottomSheetHeader.displayName = "MobileBottomSheetHeader";

const MobileBottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
MobileBottomSheetTitle.displayName = DialogPrimitive.Title.displayName;

const MobileBottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
MobileBottomSheetDescription.displayName = DialogPrimitive.Description.displayName;

const MobileBottomSheetBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto px-6 pb-6", className)}
    {...props}
  />
));
MobileBottomSheetBody.displayName = "MobileBottomSheetBody";

const MobileBottomSheetFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 px-6 pb-6 pt-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}
    {...props}
  />
));
MobileBottomSheetFooter.displayName = "MobileBottomSheetFooter";

export {
  MobileBottomSheet,
  MobileBottomSheetTrigger,
  MobileBottomSheetClose,
  MobileBottomSheetContent,
  MobileBottomSheetHeader,
  MobileBottomSheetTitle,
  MobileBottomSheetDescription,
  MobileBottomSheetBody,
  MobileBottomSheetFooter,
};
