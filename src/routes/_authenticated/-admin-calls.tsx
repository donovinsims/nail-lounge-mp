import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fmtDate } from "@/lib/salon";
import { StatusBadge } from "./-admin-components/status-badge";
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
        <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
          <Phone className="h-12 w-12 text-muted-foreground/30" />
          <span>No AI calls yet.</span>
          <span className="text-xs">
            Use the Seed demo button on the dashboard to generate sample data.
          </span>
        </div>
      )}

      <div className="grid gap-3">
        {rows.map((c: Database["public"]["Tables"]["ai_calls"]["Row"]) => (
          <div
            key={c.id}
            className="rounded-2xl bg-surface p-5 transition-colors hover:bg-surface-2/30"
          >
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
                <button
                  onClick={() => navigate({ to: "/book" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
                >
                  <Check className="h-4 w-4" /> Convert to booking
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
