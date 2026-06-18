import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import {
  fetchSalon,
  fetchServices,
  fetchStaff,
  computeAvailableSlots,
  fmtMoney,
  fmtTime,
  fmtDate,
} from "@/lib/salon";
import { BottomSheet } from "@/components/bottom-sheet";
import { createPublicBooking } from "@/lib/booking.functions";
import { SiteHeader } from "@/components/site-chrome";
import { ChevronLeft, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import heroImg from "@/assets/studio.jpg";

const searchSchema = z.object({
  staff: z.string().uuid().optional(),
  service: z.string().uuid().optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Book — Nail Lounge" },
      { name: "description", content: "Pick a service, technician, and time." },
    ],
  }),
  component: Book,
});

type Step = 1 | 2 | 3 | 4;

function Book() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: salon } = useQuery({ queryKey: ["salon"], queryFn: fetchSalon });
  const { data: services = [] } = useQuery({
    queryKey: ["services", salon?.id],
    queryFn: () => fetchServices(salon!.id),
    enabled: !!salon,
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["staff", salon?.id],
    queryFn: () => fetchStaff(salon!.id),
    enabled: !!salon,
  });

  const [step, setStep] = useState<Step>(1);
  const [open, setOpen] = useState(true);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(() => new Date());
  const [slot, setSlot] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const stepRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");

  // Prefill from search params
  useEffect(() => {
    if (search.service && services.some((s) => s.id === search.service))
      setServiceId(search.service);
  }, [search.service, services]);
  useEffect(() => {
    if (search.staff && staff.some((s) => s.id === search.staff)) {
      setStaffId(search.staff);
      if (serviceId) setStep(3);
    }
  }, [search.staff, staff, serviceId]);

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => setStep((s) => Math.max(1, s - 1) as Step);

  // Focus first interactive element on step change
  useEffect(() => {
    const el = stepRef.current?.querySelector<HTMLElement>(
      "button, input, [tabindex]:not([tabindex=\"-1\"])",
    );
    el?.focus();
  }, [step]);

  // Announce step transitions
  useEffect(() => {
    const names = ["", "Select a service", "Choose an artist", "Pick a date and time", "Confirm your details"];
    setAnnouncement(`Step ${step} of 4: ${names[step]}`);
  }, [step]);

  const service = services.find((s) => s.id === serviceId);
  const tech = staff.find((s) => s.id === staffId);

  const { data: slots = [], isFetching: loadingSlots } = useQuery({
    queryKey: ["slots", staffId, serviceId, date.toDateString()],
    enabled: !!salon && !!service && !!tech,
    queryFn: () =>
      computeAvailableSlots({
        salonId: salon!.id,
        staffId: tech!.id,
        serviceDurationMin: service!.duration_minutes,
        bufferAfterMin: service!.buffer_after_minutes,
        date,
        workingHours: (tech!.working_hours as any) || {},
        salonHours: (salon!.business_hours as any) || {},
      }),
  });

  const create = useServerFn(createPublicBooking);
  const mutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success("Booking confirmed!");
      navigate({ to: "/appointments", search: { phone } as any });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Announce submission
  useEffect(() => {
    if (mutation.isPending) setAnnouncement("Submitting your booking\u2026");
  }, [mutation.isPending]);

  const close = () => {
    setOpen(false);
    setTimeout(() => navigate({ to: "/" }), 220);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {/* Backdrop content so the bottom sheet doesn't open over an empty gray screen */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent">Booking</p>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] sm:text-7xl">
            Reserve your <span className="italic">seat.</span>
          </h1>
          <p className="mt-6 text-base text-muted-foreground">
            Four short steps — service, artist, time, details. We'll hold your spot with a small
            deposit.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Loved by 1,200+ locals
          </div>
        </div>
      </section>

      <BottomSheet
        open={open}
        onOpenChange={(o) => {
          if (!o) close();
        }}
        description={`Step ${step} of 4: ${["", "Select a service", "Choose an artist", "Pick a date and time", "Confirm your details"][step]}`}
        title={
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={back} aria-label="Go back" className="-ml-2 p-2">
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <span>{["Service", "Artist", "Date & time", "Confirm"][step - 1]}</span>
            <span className="ml-auto text-xs font-mono text-muted-foreground">Step {step}/4</span>
          </div>
        }
        footer={
          step !== 4 && (
            <button
              disabled={
                (step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && !slot)
              }
              onClick={next}
              className="flex tap-target w-full items-center justify-center rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-40"
            >
              Continue
            </button>
          )
        }
      >
        <div ref={stepRef}>
          <div aria-live="polite" className="sr-only" aria-atomic="true">{announcement}</div>
          {step === 1 &&
          (services.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading services…</div>
          ) : (
            <ul className="space-y-2">
              {services.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      setServiceId(s.id);
                      setTimeout(next, 150);
                    }}
                    className={`flex w-full tap-target items-center justify-between gap-3 rounded-2xl bg-surface p-4 text-left active:scale-[0.99] transition ${serviceId === s.id ? "ring-2 ring-ring" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.category} · {s.duration_minutes} min
                      </p>
                    </div>
                    <p className="font-mono text-sm font-semibold shrink-0">
                      {fmtMoney(Number(s.price))}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ))}

        {step === 2 && (
          <ul className="space-y-2">
            {staff.map((t: any) => (
              <li key={t.id}>
                <button
                  onClick={() => {
                    setStaffId(t.id);
                    setTimeout(next, 150);
                  }}
                  className={`flex w-full tap-target items-center gap-4 rounded-2xl bg-surface p-4 text-left ${staffId === t.id ? "ring-2 ring-ring" : ""}`}
                >
                  <div
                    className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-white font-semibold"
                    style={{ background: t.avatar_color || "#000" }}
                  >
                    {t.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t.title || t.role}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === 3 && (
          <div>
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-3">
              {Array.from({ length: 14 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                d.setHours(0, 0, 0, 0);
                const selected = d.toDateString() === date.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setDate(d);
                      setSlot(null);
                    }}
                    className={`shrink-0 flex flex-col items-center justify-center rounded-2xl px-4 py-3 ${selected ? "bg-primary text-primary-foreground" : "bg-surface"}`}
                  >
                    <span className="text-[10px] uppercase tracking-wider">
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-lg font-bold mt-0.5">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              {loadingSlots ? (
                <div className="grid place-items-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : slots.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No availability this day. Try another.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((t) => {
                    const selected = slot && slot.getTime() === t.getTime();
                    return (
                      <button
                        key={t.toISOString()}
                        onClick={() => setSlot(t)}
                        className={`tap-target rounded-xl py-3 text-sm font-medium ${selected ? "bg-primary text-primary-foreground" : "bg-surface"}`}
                      >
                        {fmtTime(t)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">With</span>
                <span className="font-medium">{tech?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">When</span>
                <span className="font-medium">{slot && `${fmtDate(slot)}, ${fmtTime(slot)}`}</span>
              </div>
              <div className="mt-2 flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-mono font-semibold">
                  {fmtMoney(Number(service?.price ?? 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit today</span>
                <span className="font-mono font-semibold">
                  {fmtMoney(Number(service?.deposit_amount ?? 0))}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Field label="Full name" value={name} onChange={setName} placeholder="Jane Doe" autoComplete="name" enterKeyHint="next" />
              <Field
                label="Phone"
                value={phone}
                onChange={setPhone}
                type="tel"
                placeholder="(815) 555-0123"
                autoComplete="tel"
                enterKeyHint="next"
              />
              <Field
                label="Email (optional)"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                enterKeyHint="done"
              />
            </div>
            <div className="rounded-2xl bg-surface p-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                <Check className="h-3 w-3" /> Mock payment — demo only
              </div>
              <p className="mt-2 text-sm">
                Tap card on file <span className="font-mono">•••• 4242</span>
              </p>
            </div>
            <button
              disabled={mutation.isPending || !name || !phone || !slot || !service || !tech}
              onClick={() =>
                mutation.mutate({
                  data: {
                    salonId: salon!.id,
                    serviceId: service!.id,
                    staffId: tech!.id,
                    startTime: slot!.toISOString(),
                    clientName: name,
                    clientPhone: phone,
                    clientEmail: email,
                    depositPaid: Number(service!.deposit_amount),
                  },
                })
              }
              className="flex tap-target w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Pay {fmtMoney(Number(service?.deposit_amount ?? 0))} deposit
            </button>
          </div>
        )}
        </div>
      </BottomSheet>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  enterKeyHint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  enterKeyHint?: React.HTMLAttributes<HTMLInputElement>["enterKeyHint"];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        className="mt-1 w-full tap-target rounded-xl bg-surface px-4 text-base outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
