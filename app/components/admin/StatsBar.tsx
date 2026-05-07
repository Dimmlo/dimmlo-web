type Stat = { label: string; value: string | number; sub?: string };

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {s.label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-ink">{s.value}</div>
          {s.sub && <div className="mt-0.5 text-xs text-gray-500">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
