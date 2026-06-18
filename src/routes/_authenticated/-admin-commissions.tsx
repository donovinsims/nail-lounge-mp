import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, fmtDate } from "@/lib/salon";
import { Download, Search, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { KpiCard } from "./-admin-components/kpi-card";

type SortField = "date" | "tech" | "gross" | "techShare" | "salonShare" | "tip";
type SortDir = "asc" | "desc";

function fmtSortableDate(d: string) {
  return new Date(d).getTime();
}

export default function Commissions({ salonId }: { salonId: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const perPage = 20;

  const { data: rows = [] } = useQuery({
    queryKey: ["cr", salonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("commission_records")
        .select("*, staff(name), bookings(start_time, status, services(name))")
        .eq("salon_id", salonId)
        .order("created_at", { ascending: false })
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
        (r: any) =>
          r.staff?.name?.toLowerCase().includes(q) ||
          r.bookings?.services?.name?.toLowerCase().includes(q),
      );
    }

    // Sort
    arr.sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = fmtSortableDate(a.created_at) - fmtSortableDate(b.created_at);
          break;
        case "tech":
          cmp = (a.staff?.name ?? "").localeCompare(b.staff?.name ?? "");
          break;
        case "gross":
          cmp = Number(a.gross_amount) - Number(b.gross_amount);
          break;
        case "techShare":
          cmp =
            Number(a.tech_share) + Number(a.tip_to_tech) -
            (Number(b.tech_share) + Number(b.tip_to_tech));
          break;
        case "salonShare":
          cmp =
            Number(a.salon_share) + Number(a.tip_to_salon) -
            (Number(b.salon_share) + Number(b.tip_to_salon));
          break;
        case "tip":
          cmp = Number(a.tip_amount) - Number(b.tip_amount);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [rows, search, sortField, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice(page * perPage, (page + 1) * perPage);

  const totals = filtered.reduce(
    (acc: any, r: any) => ({
      gross: acc.gross + Number(r.gross_amount),
      tech: acc.tech + Number(r.tech_share) + Number(r.tip_to_tech),
      salon: acc.salon + Number(r.salon_share) + Number(r.tip_to_salon),
      tip: acc.tip + Number(r.tip_amount),
      count: acc.count + 1,
    }),
    { gross: 0, tech: 0, salon: 0, tip: 0, count: 0 },
  );

  const exportCsv = () => {
    const headers = [
      "Date",
      "Tech",
      "Service",
      "Gross",
      "Tech share",
      "Salon share",
      "Tip",
      "Tip→Tech",
    ];
    const lines = [headers.join(",")].concat(
      filtered.map((r: any) =>
        [
          new Date(r.created_at).toISOString(),
          r.staff?.name,
          r.bookings?.services?.name,
          r.gross_amount,
          r.tech_share,
          r.salon_share,
          r.tip_amount,
          r.tip_to_tech,
        ].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commissions.csv";
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
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Records" value={String(totals.count)} icon={Download} />
        <KpiCard label="Tech earnings" value={fmtMoney(totals.tech)} />
        <KpiCard label="Salon earnings" value={fmtMoney(totals.salon)} />
      </div>

      {/* Search + export toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search tech or service..."
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
                  { key: "tech" as SortField, label: "Tech" },
                  { key: null, label: "Service" },
                  { key: "gross" as SortField, label: "Gross" },
                  { key: "techShare" as SortField, label: "Tech" },
                  { key: "salonShare" as SortField, label: "Salon" },
                  { key: "tip" as SortField, label: "Tip" },
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
                  <td className="p-4 font-mono text-xs whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="font-medium whitespace-nowrap">{r.staff?.name}</td>
                  <td className="text-muted-foreground">{r.bookings?.services?.name}</td>
                  <td className="font-mono tabular-nums">{fmtMoney(Number(r.gross_amount))}</td>
                  <td className="font-mono tabular-nums text-success">
                    {fmtMoney(Number(r.tech_share) + Number(r.tip_to_tech))}
                  </td>
                  <td className="font-mono tabular-nums">
                    {fmtMoney(Number(r.salon_share) + Number(r.tip_to_salon))}
                  </td>
                  <td className="font-mono tabular-nums">{fmtMoney(Number(r.tip_amount))}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No records yet.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Footer totals */}
            {pageRows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-2/50 font-semibold">
                  <td className="p-4 text-xs font-mono">{filtered.length} total</td>
                  <td />
                  <td />
                  <td className="font-mono tabular-nums">{fmtMoney(totals.gross)}</td>
                  <td className="font-mono tabular-nums text-success">{fmtMoney(totals.tech)}</td>
                  <td className="font-mono tabular-nums">{fmtMoney(totals.salon)}</td>
                  <td className="font-mono tabular-nums">{fmtMoney(totals.tip)}</td>
                </tr>
              </tfoot>
            )}
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
                    i === page
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-surface-2"
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
