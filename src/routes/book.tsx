import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useRef } from "react";
import { z } from "zod";
import { fetchSalon, fetchServices, fetchStaff, computeSlotsForAllStaff } from "@/lib/salon";
import { fmtTime, fmtDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { createPublicBooking } from "@/lib/booking.functions";
import { getSalonName } from "@/lib/env";
import { PHONE_RE } from "@/lib/validation";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StepService from "./book/-step-service";
import StepStaff from "./book/-step-staff";
import StepDateTime from "./book/-step-datetime";
import StepConfirm from "./book/-step-confirm";
import BookingSummary from "./book/-booking-summary";
import BookingStepProgress from "./book/-booking-step-progress";

const searchSchema = z.object({
  staff: z.string().uuid().optional(),
  service: z.string().uuid().optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: `Book — ${getSalonName()}` },
      { name: "description", content: "Pick a service, technician, and time." },
    ],
  }),
  component: Book,
});

type Step = 1 | 2 | 3 | 4;

const BOOKING_STATE_KEY = "booking-state";

function Book() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: salon } = useQuery({ queryKey: ["salon"], queryFn: fetchSalon });
  const { data: services = [], isFetching: servicesLoading } = useQuery({
    queryKey: ["services", salon?.id],
    queryFn: () => fetchServices(salon!.id),
    enabled: !!salon,
  });
  const { data: staff = [], isFetching: staffLoading } = useQuery({
    queryKey: ["staff", salon?.id],
    queryFn: () => fetchStaff(salon!.id),
    enabled: !!salon,
  });

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(() => new Date());
  const [slot, setSlot] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const stepRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const [announcement, setAnnouncement] = useState("");
  const [disabledHint, setDisabledHint] = useState<string | null>(null);
  const dateDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Prefill from search params
  useEffect(() => {
    if (search.service && services.some((s: { id: string }) => s.id === search.service))
      setServiceId(search.service);
  }, [search.service, services]);
  useEffect(() => {
    if (search.staff && staff.some((s: { id: string }) => s.id === search.staff)) {
      setStaffId(search.staff);
      if (serviceId) setStep(3);
    }
  }, [search.staff, staff, serviceId]);

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(4, s + 1) as Step);
  };
  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1) as Step);
  };

  const handleDisabledClick = (clickedStep: number) => {
    const hints: Record<number, string> = {
      1: "Please select a service to continue",
      2: "Please choose an artist to continue",
      3: "Please pick a date and time to continue",
    };
    const hint = hints[clickedStep];
    if (hint) {
      setDisabledHint(hint);
      setTimeout(() => setDisabledHint(null), 3000);
    }
  };

  const handleDateChange = (d: Date) => {
    if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
    dateDebounceRef.current = setTimeout(() => {
      setDate(d);
      setSlot(null);
    }, 0);
  };

  // Unsaved progress warning — only fires when user has actual data entered
  const hasSelection = !!serviceId || !!staffId || !!slot || !!name || !!phone || !!email;

  useEffect(() => {
    if (!hasSelection) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasSelection]);

  // Restore booking state from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(BOOKING_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.serviceId) setServiceId(parsed.serviceId);
        if (parsed.staffId) setStaffId(parsed.staffId);
        if (parsed.name) setName(parsed.name);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.step) setStep(parsed.step as Step);
      }
    } catch {
      // Ignore — sessionStorage may be unavailable or corrupt.
    }
  }, []);

  // Save booking state on change
  useEffect(() => {
    if (serviceId || staffId || slot || name || phone || email) {
      sessionStorage.setItem(
        BOOKING_STATE_KEY,
        JSON.stringify({
          serviceId,
          staffId,
          slot: slot?.toISOString(),
          name,
          phone,
          email,
          step,
        }),
      );
    }
  }, [serviceId, staffId, slot, name, phone, email, step]);

  // Focus first interactive element + scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Only focus on desktop — mobile keyboard would block the view
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) {
      const el = stepRef.current?.querySelector<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      el?.focus();
    }
  }, [step]);

  // Announce step transitions
  useEffect(() => {
    const names = [
      "",
      "Select a service",
      "Choose an artist",
      "Pick a date and time",
      "Confirm your details",
    ];
    setAnnouncement(`Step ${step} of 4: ${names[step]}`);
  }, [step]);

  const service = services.find((s: { id: string }) => s.id === serviceId);
  const isNoPreference = staffId === "no-preference";
  const tech = isNoPreference ? null : staff.find((s: { id: string }) => s.id === staffId);

  // Cache of staffId → available slots for resolving "no-preference" at submit time
  const staffSlotMapRef = useRef<Map<string, Date[]>>(new Map());

  const { data: slots = [], isFetching: loadingSlots } = useQuery({
    queryKey: [
      "slots",
      isNoPreference ? { all: true } : { staffId },
      serviceId,
      date.toDateString(),
    ],
    enabled:
      !!salon && !!service && staffId !== null && (isNoPreference ? staff.length > 0 : !!tech),
    staleTime: 60_000,
    queryFn: async () => {
      if (!service) return [];
      if (isNoPreference) {
        const { staffMap, mergedSlots } = await computeSlotsForAllStaff(
          supabase,
          staff.map((s: { id: string }) => s.id),
          date,
          service.duration_minutes,
          salon!.id,
        );
        staffSlotMapRef.current = staffMap;
        return mergedSlots;
      }
      const { computeAvailableSlots } = await import("@/lib/salon");
      const singleSlots = await computeAvailableSlots(
        supabase,
        tech!.id,
        date,
        service.duration_minutes,
        salon!.id,
      );
      staffSlotMapRef.current = new Map([[tech!.id, singleSlots]]);
      return singleSlots;
    },
  });

  const create = useServerFn(createPublicBooking);
  const mutation = useMutation({
    mutationFn: create,
    onSuccess: (result) => {
      sessionStorage.removeItem(BOOKING_STATE_KEY);
      toast.success("Booking confirmed!");
      navigate({ to: "/booking-confirmed", search: { bookingId: result.bookingId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Announce submission
  useEffect(() => {
    if (mutation.isPending) setAnnouncement("Submitting your booking\u2026");
  }, [mutation.isPending]);

  // PHONE_RE imported from @/lib/validation
  const canSubmit =
    !mutation.isPending &&
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    PHONE_RE.test(phone.trim()) &&
    slot != null &&
    service != null &&
    (isNoPreference || tech != null);

  const handleSubmit = () => {
    if (submittingRef.current || mutation.isPending) return;
    if (!salon || !service || !slot) return;

    // Resolve "no-preference" to an actual staff ID using cached slot data
    let finalStaffId = staffId;
    if (isNoPreference) {
      const slotTime = slot.getTime();
      for (const [sId, sSlots] of staffSlotMapRef.current.entries()) {
        if (sSlots.some((t) => t.getTime() === slotTime)) {
          finalStaffId = sId;
          break;
        }
      }
      // Fallback to first staff member if resolution fails
      if (!finalStaffId || finalStaffId === "no-preference") {
        const firstStaff = staff[0] as { id: string } | undefined;
        finalStaffId = firstStaff ? firstStaff.id : null;
      }
    }

    if (!finalStaffId) return;
    const resolvedTech = staff.find((s: { id: string }) => s.id === finalStaffId);
    if (!resolvedTech) return;

    submittingRef.current = true;
    mutation.mutate(
      {
        data: {
          salonId: salon.id,
          serviceId: service.id,
          staffId: resolvedTech.id,
          startTime: slot.toISOString(),
          clientName: name,
          clientPhone: phone,
          clientEmail: email,
        },
      },
      {
        onSettled: () => {
          submittingRef.current = false;
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Header section */}
      <section className={`border-b border-border/60 ${step > 1 ? "sm:block" : ""}`}>
        <div
          className={`mx-auto max-w-3xl px-6 text-center ${
            step > 1 ? "py-4 sm:py-16" : "py-16 sm:py-20"
          }`}
        >
          {step === 1 ? (
            <>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Booking</p>
              <h1 className="mt-4 font-display text-4xl leading-[0.95] sm:text-5xl">
                Reserve <span className="italic">your seat.</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
                Four short steps — service, artist, time, details.
              </p>
            </>
          ) : (
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Step {step} of 4
            </p>
          )}
        </div>
      </section>

      {/* Step progress + cancel */}
      <div className="mx-auto max-w-5xl px-6 pt-8 pb-6">
        <div className="relative">
          <BookingStepProgress
            step={step}
            onStepClick={(s: number) => {
              setStep(s as Step);
              if (s < step) {
                // Keep existing field values when going back
                // Only slot is cleared since it depends on date/staff
                if (s <= 3) setSlot(null);
              }
            }}
          />
          <Link
            to="/"
            className="absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface transition"
            aria-label="Cancel booking and return home"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Link>
        </div>
      </div>

      {/* Mobile booking summary chips — visible below md */}
      <div className="md:hidden -mt-4 mb-4 mx-auto max-w-5xl px-6">
        {(service || tech || slot) && (
          <div className="flex flex-wrap gap-2">
            {service && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium">
                <span className="text-muted-foreground">Service:</span> {service.name}
              </span>
            )}
            {tech && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium">
                <span className="text-muted-foreground">Artist:</span> {tech.name}
              </span>
            )}
            {slot && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium">
                <span className="text-muted-foreground">When:</span> {fmtDate(slot)},{" "}
                {fmtTime(slot)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-24 overflow-x-hidden">
        <div className="grid gap-8 md:grid-cols-12">
          {/* Step content column */}
          <div className="md:col-span-8 min-w-0" ref={stepRef}>
            <div aria-live="polite" className="sr-only" aria-atomic="true">
              {announcement}
            </div>

            <div
              key={step}
              className={`animate-in fade-in ${
                direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4"
              } duration-[400ms]`}
            >
              {step === 1 && (
                <StepService
                  services={services}
                  selectedId={serviceId}
                  onSelect={(id) => {
                    setServiceId(id);
                    setSlot(null);
                  }}
                  isLoading={servicesLoading}
                />
              )}

              {step === 2 && (
                <StepStaff
                  staff={staff}
                  selectedId={staffId}
                  onSelect={(id) => {
                    setStaffId(id);
                    setSlot(null);
                  }}
                  isLoading={staffLoading}
                />
              )}

              {step === 3 && (
                <StepDateTime
                  date={date}
                  onDateChange={handleDateChange}
                  slot={slot}
                  onSlotChange={setSlot}
                  slots={slots}
                  loadingSlots={loadingSlots}
                />
              )}

              {step === 4 && (
                <StepConfirm
                  service={service ?? undefined}
                  staff={tech ?? undefined}
                  slot={slot}
                  name={name}
                  phone={phone}
                  email={email}
                  onNameChange={setName}
                  onPhoneChange={setPhone}
                  onEmailChange={setEmail}
                  isPending={mutation.isPending}
                  isNoPreference={isNoPreference}
                  onSubmit={handleSubmit}
                />
              )}
            </div>

            {/* Disabled button hint */}
            {disabledHint && (
              <p className="text-xs text-warning-ink text-center mt-2 animate-in fade-in slide-in-from-bottom-1 duration-[240ms]">
                {disabledHint}
              </p>
            )}

            {/* Desktop navigation buttons */}
            <div className="hidden sm:flex items-center gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={back}
                  className="tap-target inline-flex items-center gap-2 rounded-lg border border-border h-11 px-5 text-sm font-medium tracking-[0.01em] shadow-1 transition duration-150 hover:shadow-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {step < 4 && (
                <Button
                  disabled={
                    (step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && !slot)
                  }
                  onClick={() => {
                    if (
                      (step === 1 && !serviceId) ||
                      (step === 2 && !staffId) ||
                      (step === 3 && !slot)
                    ) {
                      handleDisabledClick(step);
                    } else {
                      next();
                    }
                  }}
                  className="tap-target"
                >
                  Continue
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar summary — visible from md up */}
          <div className="hidden md:block md:col-span-4">
            <div className="sticky top-24">
              <BookingSummary
                service={service ?? null}
                staff={tech ?? null}
                slot={slot}
                isNoPreference={isNoPreference}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl px-4 py-3 safe-pb sm:hidden">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={back}
              aria-label="Go back"
              className="tap-target flex items-center justify-center rounded-full border border-border px-4 py-3"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {step < 4 ? (
            <Button
              disabled={
                (step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && !slot)
              }
              onClick={next}
              className="tap-target flex-1"
            >
              Continue
            </Button>
          ) : (
            <Button disabled={!canSubmit} onClick={handleSubmit} className="tap-target flex-1">
              {mutation.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking…
                </span>
              ) : (
                "Confirm booking"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Spacer for mobile CTA */}
      <div className="h-24 sm:hidden" />

      <SiteFooter />
    </div>
  );
}
