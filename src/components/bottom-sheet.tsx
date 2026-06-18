import { Drawer as VaulDrawer } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
      <VaulDrawer.Root open={open} onOpenChange={onOpenChange} fixed closeThreshold={0.5}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <VaulDrawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] max-h-[85dvh] flex-col rounded-t-3xl bg-card text-card-foreground outline-none md:max-h-[90vh] md:max-h-[90dvh]",
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" />
          {title && (
            <VaulDrawer.Title className="px-6 pt-4 text-xl font-bold tracking-tight">
              {title}
            </VaulDrawer.Title>
          )}
          <VaulDrawer.Description className="sr-only">{description ?? "Booking flow"}</VaulDrawer.Description>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">{children}</div>
          {footer && (
            <div className="border-t border-border bg-card px-6 py-4 safe-pb">{footer}</div>
          )}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
