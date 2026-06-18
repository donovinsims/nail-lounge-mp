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
import { createPublicBooking } from "@/lib/booking.functions";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ChevronLeft } from "lucide-react";
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

  const next = () => {
    setStep((s) => Math.min(4, s + 1) as Step);
  };
  const back = () => {
    setStep((s) => Math.max(1, s - 1) as Step);
  };

  // Focus first interactive element on step change
  useEffect(() => {
    const el = stepRef.current?.querySelector<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])',
    );
    el?.focus();
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
        workingHours: (tech!.working_hours as any) || {}, // eslint-disable-line @typescript-eslint/no-explicit-any
        salonHours: (salon!.business_hours as any) || {}, // eslint-disable-line @typescript-eslint/no-explicit-any
      }),
  });

  const create = useServerFn(createPublicBooking);
  const mutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success("Booking confirmed!");
      navigate({ to: "/appointments", search: { phone } as any }); // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Announce submission
  useEffect(() => {
    if (mutation.isPending) setAnnouncement("Submitting your booking\u2026");
  }, [mutation.isPending]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Header section */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent">Booking</p>
          <h1 className="mt-4 font-display text-4xl leading-[0.95] sm:text-5xl">
            Reserve your <span className="italic">seat.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Four short steps — service, artist, time, details.
          </p>
        </div>
      </section>

      {/* Step progress */}
      <div className="mx-auto max-w-5xl px-6 pt-8 pb-6">
        <BookingStepProgress step={step} onStepClick={(s: number) => setStep(s as Step)} />
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-12">
          {/* Step content column */}
          <div className="md:col-span-8" ref={stepRef}>
            <div aria-live="polite" className="sr-only" aria-atomic="true">
              {announcement}
            </div>

            {step === 1 && (
              <StepService
                services={services}
                selectedId={serviceId}
                onSelect={(id) => {
                  setServiceId(id);
                  next();
                }}
              />
            )}

            {step === 2 && (
              <StepStaff
                staff={staff}
                selectedId={staffId}
                onSelect={(id) => {
                  setStaffId(id);
                  next();
                }}
              />
            )}

            {step === 3 && (
              <StepDateTime
                date={date}
                onDateChange={(d) => {
                  setDate(d);
                  setSlot(null);
                }}
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
                onSubmit={() =>
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
                formatTime={fmtTime}
                formatDate={fmtDate}
                formatMoney={fmtMoney}
              />
            )}

            {/* Desktop navigation buttons */}
            <div className="hidden sm:flex items-center gap-3 mt-8">
              {step > 1 && (
                <button
                  onClick={back}
                  className="tap-target inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-surface transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {step < 4 && (
                <button
                  disabled={
                    (step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && !slot)
                  }
                  onClick={next}
                  className="tap-target inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40 hover:opacity-90 transition"
                >
                  Continue
                </button>
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
                fmtMoney={fmtMoney}
                fmtTime={fmtTime}
                fmtDate={fmtDate}
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
          {step < 4 && (
            <button
              disabled={
                (step === 1 && !serviceId) || (step === 2 && !staffId) || (step === 3 && !slot)
              }
              onClick={next}
              className="flex-1 tap-target rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 transition"
            >
              Continue
            </button>
          )}
        </div>
      </div>

      {/* Spacer for mobile CTA */}
      <div className="h-24 sm:hidden" />

      <SiteFooter />
    </div>
  );
}
