import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

/** Show the same reported rule counts available in the adjacent HTML table. */
export function HistoryRuleChart({ rows }: { rows: { label: string; count: number }[] }) {
  return (
    <div className="history-chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height={Math.max(128, rows.length * 32 + 28)}>
        <BarChart data={rows} layout="vertical" accessibilityLayer={false} margin={{ right: 12 }}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "var(--quiet)", fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={164}
            tickLine={false}
            tick={{ fill: "var(--ink)", fontSize: 12 }}
          />
          <Bar
            dataKey="count"
            fill="var(--accent)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
