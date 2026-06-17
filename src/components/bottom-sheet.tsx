import { Drawer as VaulDrawer } from "vaul";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <VaulDrawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92vh] flex-col rounded-t-3xl bg-card text-card-foreground outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" />
          {title && (
            <VaulDrawer.Title className="px-6 pt-4 text-xl font-bold tracking-tight">{title}</VaulDrawer.Title>
          )}
          <VaulDrawer.Description className="sr-only">Bottom sheet</VaulDrawer.Description>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="border-t border-border bg-card px-6 py-4 safe-pb">{footer}</div>}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
