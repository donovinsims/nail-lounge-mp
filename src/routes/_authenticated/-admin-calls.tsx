import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AiCallRow } from "@/integrations/supabase/rows";
import { fmtDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/bottom-sheet";
import { StatusBadge } from "./-admin-components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Phone, Check, PhoneCall, MessageSquare } from "lucide-react";

const INTENT_LABELS: Record<string, string> = {
  book_appointment: "Book",
  inquiry: "Inquiry",
  cancel: "Cancel",
  reschedule: "Reschedule",
  pricing: "Pricing",
  other: "Other",
};

function intentVariant(intent: string) {
  const i = intent.toLowerCase();
  if (i === "book_appointment") return "info" as const;
  if (i === "cancel") return "destructive" as const;
  if (i === "reschedule") return "warning" as const;
  return "default" as const;
}

export default function Calls({ salonId }: { salonId: string }) {
  const navigate = useNavigate();
  const [sheetId, setSheetId] = useState<string | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: ["calls", salonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_calls")
        .select("*")
        .eq("salon_id", salonId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      {rows.length === 0 && (
        <EmptyState
          icon={<Phone className="h-12 w-12" />}
          title="No AI calls yet"
          body="AI-powered call handling will appear here once calls start coming in. Use the Seed demo button on the dashboard to generate sample data."
        />
      )}

      <div className="grid gap-3">
        {rows.map((c: AiCallRow) => (
          <div
            key={c.id}
            className="rounded-2xl bg-surface p-5 transition-colors hover:bg-surface-2/30"
          >
            {/* Desktop: full card with CTA */}
            <div className="hidden md:block">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Caller info row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{c.caller_name}</p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <a
                      href={`tel:${c.caller_phone}`}
                      className="text-xs text-muted-foreground hover:text-foreground font-mono"
                    >
                      {c.caller_phone}
                    </a>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {fmtDate(c.created_at)}
                    </span>
                  </div>

                  {/* Intent badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge
                      status={c.intent ? INTENT_LABELS[c.intent] || c.intent : ""}
                      variant={intentVariant(c.intent ?? "")}
                    />
                  </div>

                  {/* Transcript */}
                  <div className="mt-3 flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{c.transcript}"
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA for book appointments */}
              {c.intent === "book_appointment" && !c.converted_booking_id && (
                <div className="mt-4 pt-3 border-t border-border">
                  <Button onClick={() => navigate({ to: "/book" })}>
                    <Check className="h-4 w-4" /> Convert to booking
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile: trigger button */}
            <button onClick={() => setSheetId(c.id)} className="md:hidden w-full text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Caller info row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{c.caller_name}</p>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {c.caller_phone}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {fmtDate(c.created_at)}
                    </span>
                  </div>

                  {/* Intent badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge
                      status={c.intent ? INTENT_LABELS[c.intent] || c.intent : ""}
                      variant={intentVariant(c.intent ?? "")}
                    />
                  </div>

                  {/* Transcript preview — truncated line for mobile card */}
                  <div className="mt-3 flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground italic leading-relaxed line-clamp-2">
                      "{c.transcript}"
                    </p>
                  </div>
                </div>
              </div>
            </button>

            <BottomSheet
              open={sheetId === c.id}
              onOpenChange={(o) => !o && setSheetId(null)}
              title={`${c.caller_name} · ${c.caller_phone}`}
              footer={
                c.intent === "book_appointment" && !c.converted_booking_id ? (
                  <Button
                    onClick={() => {
                      navigate({ to: "/book" });
                    }}
                    className="w-full"
                  >
                    <Check className="h-4 w-4" /> Convert to booking
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <a href={`tel:${c.caller_phone}`}>
                      <PhoneCall className="h-4 w-4" /> Call back
                    </a>
                  </Button>
                )
              }
            >
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a
                    href={`tel:${c.caller_phone}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {c.caller_phone}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={c.intent ? INTENT_LABELS[c.intent] || c.intent : ""}
                    variant={intentVariant(c.intent ?? "")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-mono text-xs">{fmtDate(c.created_at)}</span>
                </div>

                <div className="rounded-lg bg-surface-2 p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      "{c.transcript}"
                    </p>
                  </div>
                </div>
              </div>
            </BottomSheet>
          </div>
        ))}
      </div>
    </div>
  );
}
