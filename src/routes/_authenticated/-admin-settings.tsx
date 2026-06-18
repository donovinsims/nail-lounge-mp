import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function SettingsView({ salon }: { salon: any }) {
  const qc = useQueryClient();
  const [name, setName] = useState(salon.name);
  const [phone, setPhone] = useState(salon.phone || "");
  const [commission, setCommission] = useState(Number(salon.commission_split));
  const [tipSplit, setTipSplit] = useState(Number(salon.tip_split_default));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("salons")
      .update({
        name,
        phone,
        commission_split: commission,
        tip_split_default: tipSplit,
      })
      .eq("id", salon.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["my-staff"] });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl space-y-5">
      {/* Business info */}
      <div className="rounded-2xl bg-surface p-6 space-y-4">
        <h3 className="font-semibold">Business</h3>
        <label className="block">
          <span className="text-xs text-muted-foreground font-medium">Salon name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full tap-target rounded-xl bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground font-medium">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full tap-target rounded-xl bg-surface-2 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </label>
      </div>

      {/* Commission & tips */}
      <div className="rounded-2xl bg-surface p-6 space-y-5">
        <h3 className="font-semibold">Commission & tips</h3>
        <div>
          <label className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-2">
            <span>Tech commission</span>
            <span className="font-mono text-foreground">{commission}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
        <div>
          <label className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-2">
            <span>Default tip to tech</span>
            <span className="font-mono text-foreground">{tipSplit}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={tipSplit}
            onChange={(e) => setTipSplit(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Tech: {tipSplit}%</span>
            <span>Salon: {100 - tipSplit}%</span>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="tap-target inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save changes"}
      </button>

      <p className="text-xs text-muted-foreground">
        Hours and holiday schedules are stored as JSON and can be edited here in a future update.
      </p>
    </div>
  );
}
