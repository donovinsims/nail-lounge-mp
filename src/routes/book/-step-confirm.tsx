import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { cn, fmtTime, fmtDate, fmtMoney } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PHONE_RE } from "@/lib/validation";

const confirmFormSchema = z.object({
  clientName: z.string().trim().min(1, "Name is required").max(100),
  clientPhone: z.string().regex(PHONE_RE, "Enter a valid US phone number"),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

interface ServiceInfo {
  name: string;
  price: number;
}

interface StaffInfo {
  name: string;
}

interface StepConfirmProps {
  service?: ServiceInfo;
  staff?: StaffInfo;
  slot?: Date | null;
  name: string;
  phone: string;
  email: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  isPending: boolean;
  onSubmit: () => void;
  isNoPreference?: boolean;
}

export default function StepConfirm({
  service,
  staff,
  slot,
  name,
  phone,
  email,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  isPending,
  onSubmit,
  isNoPreference,
}: StepConfirmProps) {
  useEffect(() => {
    const handleResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        document.documentElement.style.setProperty("--visual-viewport-height", `${vv.height}px`);
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  const form = useForm<z.infer<typeof confirmFormSchema>>({
    resolver: zodResolver(confirmFormSchema),
    defaultValues: {
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
    },
    mode: "onTouched",
  });

  const watchedValues = form.watch();

  useEffect(() => {
    onNameChange(watchedValues.clientName ?? "");
  }, [watchedValues.clientName, onNameChange]);

  useEffect(() => {
    onPhoneChange(watchedValues.clientPhone ?? "");
  }, [watchedValues.clientPhone, onPhoneChange]);

  useEffect(() => {
    onEmailChange(watchedValues.clientEmail ?? "");
  }, [watchedValues.clientEmail, onEmailChange]);

  const onFormSubmit = form.handleSubmit(() => {
    onSubmit();
  });

  const nameVal = (watchedValues.clientName ?? "").trim();
  const phoneVal = (watchedValues.clientPhone ?? "").trim();
  const isNameValid = nameVal.length > 0;
  const isPhoneValid = phoneVal.length > 0 && PHONE_RE.test(phoneVal);

  const isDisabled =
    isPending || !slot || !service || (!isNoPreference && !staff) || !isNameValid || !isPhoneValid;

  const [disabledHint, setDisabledHint] = useState<string | null>(null);

  const handleDisabledClick = () => {
    const missing: string[] = [];
    if (!service) missing.push("a service");
    if (!slot) missing.push("an appointment time");
    if (!isNoPreference && !staff) missing.push("a staff member");
    if (!isNameValid) missing.push("your name");
    if (!isPhoneValid) missing.push("a valid phone number");

    let hint: string;
    if (missing.length === 0) {
      hint = "Please complete all fields to continue";
    } else if (missing.length === 1) {
      hint = `Please enter ${missing[0]} to continue`;
    } else {
      const last = missing.pop();
      hint = `Please enter ${missing.join(", ")} and ${last} to continue`;
    }
    setDisabledHint(hint);
    setTimeout(() => setDisabledHint(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Order Summary Card */}
      <div className="rounded-2xl bg-surface p-5">
        <p className="mb-3 text-sm font-medium">Your Booking</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">With</span>
            <span className="font-medium">
              {isNoPreference ? "Auto-assigned" : (staff?.name ?? "—")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">When</span>
            <span className="font-medium">{slot ? `${fmtDate(slot)}, ${fmtTime(slot)}` : "—"}</span>
          </div>
          <hr className="border-border/60" />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="font-mono">{fmtMoney(Number(service?.price ?? 0))}</span>
          </div>
        </div>
      </div>

      {/* Client Info Fields */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="name">
            Name <span className="text-destructive-ink">*</span>
          </Label>
          <Input
            id="name"
            className="rounded-xl"
            {...form.register("clientName")}
            placeholder="Jane Doe"
            autoComplete="name"
            disabled={isPending}
            aria-invalid={!!form.formState.errors.clientName}
          />
          {form.formState.errors.clientName && (
            <p className="text-xs text-destructive-ink" role="alert">
              {form.formState.errors.clientName.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="phone">
            Phone <span className="text-destructive-ink">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            className="rounded-xl"
            {...form.register("clientPhone")}
            placeholder="(815) 555-0123"
            autoComplete="tel"
            disabled={isPending}
            aria-invalid={!!form.formState.errors.clientPhone}
          />
          {form.formState.errors.clientPhone && (
            <p className="text-xs text-destructive-ink" role="alert">
              {form.formState.errors.clientPhone.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">
            Email <span className="text-muted-foreground/60">(optional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            className="rounded-xl"
            {...form.register("clientEmail")}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isPending}
            aria-invalid={!!form.formState.errors.clientEmail}
          />
        </div>

        <p className="text-xs text-muted-foreground">* Required</p>
      </div>

      {/* Payment Section */}
      <div className="rounded-2xl bg-surface p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Check className="h-3 w-3 text-success" />
          No payment required to book
        </div>
        <p className="mt-2 text-sm">
          Pay at the salon after your service. We'll send a reminder before your appointment.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (isDisabled && !isPending) {
            handleDisabledClick();
          } else if (!isPending) {
            onFormSubmit();
          }
        }}
        aria-disabled={isDisabled || undefined}
        className={cn("tap-target w-full", (isDisabled || isPending) && "opacity-50")}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>Confirm booking</>
        )}
      </Button>

      {disabledHint && (
        <p className="text-xs text-warning-ink text-center mt-2 animate-in fade-in slide-in-from-bottom-1 duration-[240ms]">
          {disabledHint}
        </p>
      )}
    </div>
  );
}
