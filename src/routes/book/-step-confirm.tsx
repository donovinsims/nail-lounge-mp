import { useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { fmtTime, fmtDate, fmtMoney } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const confirmFormSchema = z.object({
  clientName: z.string().trim().min(1, "Name is required").max(100),
  clientPhone: z.string().regex(/^[\d\s\-()]{7,20}$/, "Enter a valid US phone number"),
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

  return (
    <div className="space-y-4">
      {/* Order Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Your Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">With</span>
            <span className="font-medium">{staff?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">When</span>
            <span className="font-medium">{slot ? `${fmtDate(slot)}, ${fmtTime(slot)}` : "—"}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="font-mono">{fmtMoney(Number(service?.price ?? 0))}</span>
          </div>
        </CardContent>
      </Card>

      {/* Client Info Fields */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="name">
            Full name <span className="text-destructive-ink">*</span>
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
          <p className="text-xs text-muted-foreground">US number: (555) 123-4567</p>
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
          />
        </div>
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
      <button
        type="button"
        disabled={isPending || !slot || !service || !staff}
        onClick={onFormSubmit}
        className="flex tap-target w-full items-center justify-center gap-2 rounded-lg bg-primary h-12 px-7 text-sm font-medium tracking-[0.01em] text-primary-foreground shadow-1 transition duration-150 hover:shadow-2 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>Confirm booking</>
        )}
      </button>
    </div>
  );
}
