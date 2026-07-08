import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="items-center gap-3 border-dashed bg-transparent px-6 py-14 text-center">
      {icon && <div className="text-muted-foreground/60">{icon}</div>}
      <h3 className="font-display text-xl">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card className="gap-4 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-10" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-16" />
    </Card>
  );
}
