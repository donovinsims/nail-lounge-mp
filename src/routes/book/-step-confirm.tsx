import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface ServiceInfo {
  name: string;
  price: number;
  deposit_amount: number;
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
  formatTime: (d: Date) => string;
  formatDate: (d: Date) => string;
  formatMoney: (n: number) => string;
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
  formatTime,
  formatDate,
  formatMoney,
}: StepConfirmProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showNameError = touched.name && !name.trim();
  const showPhoneError = touched.phone && !phone.trim();
  const canSubmit =
    !isPending &&
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    slot != null &&
    service != null &&
    staff != null;

  const depositAmount = service ? Number(service.deposit_amount) : 0;

  return (
    <div className="space-y-4">
      {/* Order Summary Card */}
      <div className="rounded-2xl bg-surface p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{service?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">With</span>
          <span className="font-medium">{staff?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">When</span>
          <span className="font-medium">
            {slot ? `${formatDate(slot)}, ${formatTime(slot)}` : ""}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-semibold">
            {formatMoney(Number(service?.price ?? 0))}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deposit today</span>
          <span className="font-mono font-semibold">{formatMoney(depositAmount)}</span>
        </div>
      </div>

      {/* Client Info Fields */}
      <div className="space-y-2">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Full name</span>
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => markTouched("name")}
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Jane Doe"
            enterKeyHint="next"
            disabled={isPending}
            className="mt-1 w-full tap-target rounded-xl bg-surface px-4 text-base outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          {showNameError && <p className="mt-1 text-xs text-red-500">Please enter your name</p>}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Phone</span>
          <input
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            onBlur={() => markTouched("phone")}
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="(815) 555-0123"
            enterKeyHint="next"
            disabled={isPending}
            className="mt-1 w-full tap-target rounded-xl bg-surface px-4 text-base outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          {showPhoneError && <p className="mt-1 text-xs text-red-500">Required</p>}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            Email <span className="text-muted-foreground/60">(optional)</span>
          </span>
          <input
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            enterKeyHint="done"
            disabled={isPending}
            className="mt-1 w-full tap-target rounded-xl bg-surface px-4 text-base outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </label>
      </div>

      {/* Mock Payment Section */}
      <div className="rounded-2xl bg-surface p-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Check className="h-3 w-3" /> Mock payment — demo only
        </div>
        <p className="mt-2 text-sm">
          Tap card on file <span className="font-mono">•••• 4242</span>
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={onSubmit}
        className="flex tap-target w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>Pay {formatMoney(depositAmount)} deposit</>
        )}
      </button>
    </div>
  );
}
