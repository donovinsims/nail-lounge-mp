import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SalonRow } from "@/integrations/supabase/rows";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-handler";
import { EmptyState } from "@/components/empty-state";
import { Save, Plus, Trash2, X, Check, Users, Scissors } from "lucide-react";
import {
  getAllStaffForSalon,
  createStaff,
  updateStaff,
  deleteStaff,
  getAllServicesForSalon,
  createService,
  updateService,
  deleteService,
  updateSalonHours,
} from "@/lib/admin-crud.functions";

const INPUT_CLS =
  "mt-1.5 w-full tap-target rounded-lg bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/60 transition-all";
const BTN_CLS =
  "tap-target inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium tracking-[0.01em] text-primary-foreground shadow-1 hover:shadow-2 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 transition duration-150";
const BTN_SM_CLS =
  "tap-target inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all";

export default function SettingsView({ salon }: { salon: SalonRow }) {
  const qc = useQueryClient();
  const [name, setName] = useState(salon.name);
  const [phone, setPhone] = useState(salon.phone || "");
  const [saving, setSaving] = useState(false);

  const saveBusiness = async () => {
    setSaving(true);
    const { error } = await supabase.from("salons").update({ name, phone }).eq("id", salon.id);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
    setSaving(false);
  };

  // ── Staff ───────────────────────────────────────────────────────────
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => getAllStaffForSalon(),
  });
  const [staffForm, setStaffForm] = useState<{ name: string; role: "owner" | "staff" } | null>(
    null,
  );

  const handleCreateStaff = async () => {
    if (!staffForm) return;
    try {
      await createStaff({ data: { name: staffForm.name, role: staffForm.role } });
      toast.success("Staff added");
      setStaffForm(null);
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to create staff"));
    }
  };

  const handleToggleStaffActive = async (id: string, isActive: boolean) => {
    try {
      await updateStaff({ data: { id, isActive: !isActive } });
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to toggle staff"));
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Permanently deactivate this staff member?")) return;
    try {
      await deleteStaff({ data: { id } });
      toast.success("Staff deactivated");
      qc.invalidateQueries({ queryKey: ["staff-list"] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to delete staff"));
    }
  };

  // ── Services ─────────────────────────────────────────────────────────
  const { data: servicesList = [] } = useQuery({
    queryKey: ["services-list"],
    queryFn: () => getAllServicesForSalon(),
  });
  const [svcForm, setSvcForm] = useState<{
    name: string;
    category: string;
    description: string;
    durationMinutes: number;
    price: number;
    bufferAfterMinutes: number;
  } | null>(null);

  const handleCreateService = async () => {
    if (!svcForm) return;
    try {
      await createService({ data: svcForm });
      toast.success("Service added");
      setSvcForm(null);
      qc.invalidateQueries({ queryKey: ["services-list"] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to create service"));
    }
  };

  const handleToggleSvcActive = async (id: string, isActive: boolean) => {
    try {
      await updateService({ data: { id, isActive: !isActive } });
      qc.invalidateQueries({ queryKey: ["services-list"] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to toggle service"));
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Permanently deactivate this service?")) return;
    try {
      await deleteService({ data: { id } });
      toast.success("Service deactivated");
      qc.invalidateQueries({ queryKey: ["services-list"] });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to delete service"));
    }
  };

  // ── Hours ────────────────────────────────────────────────────────────
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>(() => {
    const raw = (salon.business_hours ?? {}) as Record<string, { open: string; close: string }>;
    const parsed: Record<string, { open: string; close: string }> = {};
    const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
    for (const day of DAYS) {
      const slot = raw[day];
      parsed[day] = { open: slot?.open ?? "", close: slot?.close ?? "" };
    }
    return parsed;
  });
  const [savingHours, setSavingHours] = useState(false);

  const handleSaveHours = async () => {
    setSavingHours(true);
    const businessHours: Record<string, { open: string; close: string }> = {};
    for (const [day, times] of Object.entries(hours)) {
      if (times.open && times.close) {
        businessHours[day] = { open: times.open, close: times.close };
      }
    }
    try {
      await updateSalonHours({ data: { businessHours } });
      toast.success("Hours saved");
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to save hours"));
    }
    setSavingHours(false);
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl space-y-5">
      {/* Business info */}
      <div className="rounded-2xl bg-surface p-6 space-y-4">
        <h3 className="font-semibold">Business</h3>
        <label className="block">
          <span className="text-xs text-muted-foreground font-medium">Salon name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground font-medium">Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT_CLS} />
        </label>
        <button onClick={saveBusiness} disabled={saving} className={BTN_CLS}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* Staff */}
      <div className="rounded-2xl bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Staff</h3>
          <button
            onClick={() => setStaffForm({ name: "", role: "staff" })}
            className={`${BTN_SM_CLS} bg-primary/10 text-primary hover:bg-primary/20`}
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {staffForm && (
          <div className="rounded-xl bg-surface-2 p-4 space-y-3 border border-border/30">
            <label className="block">
              <span className="text-xs text-muted-foreground font-medium">Name</span>
              <input
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className={INPUT_CLS}
                placeholder="Staff name"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground font-medium">Role</span>
              <select
                value={staffForm.role}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, role: e.target.value as "owner" | "staff" })
                }
                className={INPUT_CLS}
              >
                <option value="staff">Staff</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCreateStaff}
                className={`${BTN_SM_CLS} bg-primary text-primary-foreground shadow-1 hover:shadow-2`}
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button
                onClick={() => setStaffForm(null)}
                className={`${BTN_SM_CLS} bg-surface-3 text-muted-foreground hover:bg-border/40`}
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}

        {staffList.length === 0 && !staffForm && (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No staff yet"
            body="Add your first team member so they can start accepting appointments."
          />
        )}

        <div className="space-y-2">
          {staffList.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: s.avatar_color || "#0a0a0a" }}
                >
                  {(s.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStaffActive(s.id, s.is_active)}
                  className={`text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                    s.is_active
                      ? "bg-success/15 text-success-ink"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.is_active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleDeleteStaff(s.id)}
                  className="tap-target p-1.5 text-muted-foreground hover:text-destructive-ink transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="rounded-2xl bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Services</h3>
          <button
            onClick={() =>
              setSvcForm({
                name: "",
                category: "",
                description: "",
                durationMinutes: 30,
                price: 0,
                bufferAfterMinutes: 0,
              })
            }
            className={`${BTN_SM_CLS} bg-primary/10 text-primary hover:bg-primary/20`}
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        {svcForm && (
          <div className="rounded-xl bg-surface-2 p-4 space-y-3 border border-border/30">
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2">
                <span className="text-xs text-muted-foreground font-medium">Name</span>
                <input
                  value={svcForm.name}
                  onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Service name"
                />
              </label>
              <label className="block col-span-2">
                <span className="text-xs text-muted-foreground font-medium">Description</span>
                <textarea
                  value={svcForm.description}
                  onChange={(e) => setSvcForm({ ...svcForm, description: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Brief description shown in booking selector"
                  rows={2}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground font-medium">Category</span>
                <input
                  value={svcForm.category}
                  onChange={(e) => setSvcForm({ ...svcForm, category: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="e.g. Core Nail"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground font-medium">Duration (min)</span>
                <input
                  type="number"
                  value={svcForm.durationMinutes}
                  onChange={(e) =>
                    setSvcForm({ ...svcForm, durationMinutes: Number(e.target.value) })
                  }
                  className={INPUT_CLS}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground font-medium">Price ($)</span>
                <input
                  type="number"
                  step="0.01"
                  value={svcForm.price}
                  onChange={(e) => setSvcForm({ ...svcForm, price: Number(e.target.value) })}
                  className={INPUT_CLS}
                />
              </label>
              <label className="block col-span-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Buffer after (min)
                </span>
                <input
                  type="number"
                  value={svcForm.bufferAfterMinutes}
                  onChange={(e) =>
                    setSvcForm({ ...svcForm, bufferAfterMinutes: Number(e.target.value) })
                  }
                  className={INPUT_CLS}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateService}
                className={`${BTN_SM_CLS} bg-primary text-primary-foreground shadow-1 hover:shadow-2`}
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button
                onClick={() => setSvcForm(null)}
                className={`${BTN_SM_CLS} bg-surface-3 text-muted-foreground hover:bg-border/40`}
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}

        {servicesList.length === 0 && !svcForm && (
          <EmptyState
            icon={<Scissors className="h-12 w-12" />}
            title="No services yet"
            body="Add your first service so clients can start booking appointments."
          />
        )}

        <div className="space-y-2">
          {servicesList.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{svc.name}</p>
                {svc.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {svc.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  {svc.category && (
                    <span className="px-1.5 py-0.5 rounded bg-muted">{svc.category}</span>
                  )}
                  <span>{svc.duration_minutes} min</span>
                  <span className="font-mono">${Number(svc.price).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  onClick={() => handleToggleSvcActive(svc.id, svc.is_active)}
                  className={`text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                    svc.is_active
                      ? "bg-success/15 text-success-ink"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {svc.is_active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleDeleteService(svc.id)}
                  className="tap-target p-1.5 text-muted-foreground hover:text-destructive-ink transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hours */}
      <div className="rounded-2xl bg-surface p-6 space-y-4">
        <h3 className="font-semibold">Business hours</h3>
        <div className="space-y-3">
          {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => {
            const label =
              {
                mon: "Monday",
                tue: "Tuesday",
                wed: "Wednesday",
                thu: "Thursday",
                fri: "Friday",
                sat: "Saturday",
                sun: "Sunday",
              }[day] ?? day;
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium text-muted-foreground">{label}</span>
                <input
                  type="time"
                  value={hours[day]?.open ?? ""}
                  onChange={(e) =>
                    setHours({ ...hours, [day]: { ...hours[day], open: e.target.value } })
                  }
                  className="tap-target rounded-lg bg-surface-2 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={hours[day]?.close ?? ""}
                  onChange={(e) =>
                    setHours({ ...hours, [day]: { ...hours[day], close: e.target.value } })
                  }
                  className="tap-target rounded-lg bg-surface-2 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            );
          })}
        </div>
        <button onClick={handleSaveHours} disabled={savingHours} className={BTN_CLS}>
          <Save className="h-4 w-4" />
          {savingHours ? "Saving..." : "Save hours"}
        </button>
      </div>

      {/* Social links hint */}
      <div className="rounded-2xl bg-surface p-6">
        <h3 className="font-semibold mb-2">Social & online</h3>
        <p className="text-xs text-muted-foreground">
          Social links (Instagram, Facebook, TikTok, Yelp) are managed via environment variables.
          Update your <code className="text-primary bg-primary/10 px-1 rounded">.env</code> to
          change them.
        </p>
      </div>
    </div>
  );
}
