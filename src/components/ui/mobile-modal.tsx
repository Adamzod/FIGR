import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter 
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface MobileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
  footer?: React.ReactNode;
}

export function MobileModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showHandle = true,
  footer
}: MobileModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn(
          "max-h-[85vh] flex flex-col",
          "pb-safe",
          className
        )}>
          {showHandle && (
            <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
          )}
          {(title || description) && (
            <DrawerHeader className="text-left">
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {children}
          </div>
          {footer && (
            <DrawerFooter className="border-t pt-4">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[85vh] overflow-y-auto", className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer}
      </DialogContent>
    </Dialog>
  );
}