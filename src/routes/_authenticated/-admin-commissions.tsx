import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fmtMoney, fmtDate } from "@/lib/salon";
import { Download, Search, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { KpiCard } from "./-admin-components/kpi-card";

type SortField = "date" | "staffName" | "tip";
type SortDir = "asc" | "desc";

type BookingWithStaffService = {
  id: string;
  completed_at: string | null;
  tip_amount: number | null;
  payment_method: Database["public"]["Enums"]["payment_method"] | null;
  staff: { name: string };
  services: { name: string };
};

function fmtSortableDate(d: string) {
  return new Date(d).getTime();
}

export default function Commissions({ salonId }: { salonId: string }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const perPage = 20;

  const { data: rows = [] } = useQuery({
    queryKey: ["payroll-ledger", salonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select(
          "id, completed_at, tip_amount, payment_method, staff!inner(name), services!inner(name)",
        )
        .eq("salon_id", salonId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let arr = [...rows];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (r: BookingWithStaffService) =>
          r.staff?.name?.toLowerCase().includes(q) || r.services?.name?.toLowerCase().includes(q),
      );
    }

    // Sort
    arr.sort((a: BookingWithStaffService, b: BookingWithStaffService) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = fmtSortableDate(a.completed_at ?? "") - fmtSortableDate(b.completed_at ?? "");
          break;
        case "staffName":
          cmp = (a.staff?.name ?? "").localeCompare(b.staff?.name ?? "");
          break;
        case "tip":
          cmp = Number(a.tip_amount ?? 0) - Number(b.tip_amount ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [rows, search, sortField, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice(page * perPage, (page + 1) * perPage);

  const totals = filtered.reduce(
    (acc: { count: number }, _r: BookingWithStaffService) => ({
      count: acc.count + 1,
    }),
    { count: 0 },
  );

  const exportCsv = () => {
    const headers = ["Date", "Staff Name", "Service Provided", "Tip Amount", "Payment Method"];
    const lines = [headers.join(",")].concat(
      filtered.map((r: BookingWithStaffService) =>
        [
          new Date(r.completed_at!).toISOString(),
          r.staff?.name,
          r.services?.name,
          r.tip_amount ?? "",
          r.payment_method ?? "",
        ].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payroll-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-1">
        <KpiCard label="Records" value={String(totals.count)} icon={Download} />
      </div>

      {/* Search + export toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search staff or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full tap-target rounded-xl bg-surface pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm hover:bg-surface-2 transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
              <tr>
                {[
                  { key: "date" as SortField, label: "Date" },
                  { key: "staffName" as SortField, label: "Staff Name" },
                  { key: null, label: "Service Provided" },
                  { key: "tip" as SortField, label: "Tip Amount" },
                  { key: null, label: "Payment Method" },
                ].map(({ key, label }) => (
                  <th
                    key={label}
                    className={`p-4 ${key ? "cursor-pointer hover:text-foreground group" : ""}`}
                    onClick={() => key && toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {key && <SortIcon field={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((r: any) => (
                <tr key={r.id} className="hover:bg-surface-2/30 transition-colors">
                  <td className="p-4 font-mono text-xs whitespace-nowrap">
                    {fmtDate(r.completed_at)}
                  </td>
                  <td className="font-medium whitespace-nowrap">{r.staff?.name}</td>
                  <td className="text-muted-foreground">{r.services?.name}</td>
                  <td className="font-mono tabular-nums">
                    {r.tip_amount != null ? fmtMoney(Number(r.tip_amount)) : "—"}
                  </td>
                  <td className="text-muted-foreground">{r.payment_method || "—"}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No completed bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>
              Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of{" "}
              {filtered.length}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`tap-target h-8 w-8 rounded-lg text-sm ${
                    i === page ? "bg-primary text-primary-foreground" : "hover:bg-surface-2"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
