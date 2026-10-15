"use client";

import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { funnelBars, insight, percentLabel, summarize } from "@/lib/funnel";
import type { Application } from "@/lib/types";

export function AnalyticsView({ applications }: { applications: Application[] }) {
  const summary = summarize(applications);
  const bars = funnelBars(summary);
  const months = summary.byMonth.map((bucket) => ({
    ...bucket,
    rate: bucket.rate ?? undefined,
  }));

  return (
    <div className="grid gap-6">
      <blockquote className="max-w-3xl font-display text-3xl leading-snug tracking-tight" data-testid="analytics-insight">
        {insight(summary)}
      </blockquote>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tracked" value={String(summary.total)} />
        <Stat label="Response rate" value={percentLabel(summary.rate)} detail={`${summary.responses} of ${summary.submissions} submissions`} testId="analytics-response-rate" />
        <Stat label="Still waiting" value={String(summary.waiting)} detail="Sitting in Applied" />
        <Stat label="Offers" value={String(summary.counts.OFFER)} detail={percentLabel(summary.offerRate) + " of submissions"} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-4 shadow-card" data-testid="funnel-chart">
          <h2 className="font-display text-2xl">Pipeline</h2>
          <p className="mb-4 text-sm text-muted-foreground">Where every role sits right now.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#e7e1d6" />
                <XAxis type="number" allowDecimals={false} stroke="#a8a29e" fontSize={12} />
                <YAxis type="category" dataKey="label" width={84} stroke="#78716c" fontSize={12} />
                <Tooltip content={<PlainTooltip />} cursor={{ fill: "rgba(28,25,21,0.04)" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Applications" barSize={22}>
                  {bars.map((bar) => (
                    <Cell key={bar.stage} fill={bar.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-4 shadow-card" data-testid="response-chart">
          <h2 className="font-display text-2xl">Response rate</h2>
          <p className="mb-4 text-sm text-muted-foreground">Submissions by the month you applied, and the share that got a reply.</p>
          {months.length === 0 ? (
            <p className="grid h-72 place-items-center text-sm text-muted-foreground">Add applied dates to see this over time.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={months} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e7e1d6" />
                  <XAxis dataKey="label" stroke="#a8a29e" fontSize={12} />
                  <YAxis yAxisId="left" allowDecimals={false} stroke="#a8a29e" fontSize={12} width={32} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 1]}
                    stroke="#c2410c"
                    fontSize={12}
                    width={40}
                    tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                  />
                  <Tooltip content={<RateTooltip />} />
                  <Bar yAxisId="left" dataKey="submissions" fill="#1c1915" radius={[4, 4, 0, 0]} name="Submissions" barSize={28} />
                  <Line yAxisId="right" dataKey="rate" stroke="#c2410c" strokeWidth={2.5} name="Response rate" dot={{ r: 3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, detail, testId }: { label: string; value: string; detail?: string; testId?: string }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 shadow-card" data-testid={testId}>
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-4xl leading-none">{value}</p>
      {detail ? <p className="mt-2 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function PlainTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-card">
      <p className="font-medium">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-muted-foreground">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

function RateTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-card">
      <p className="font-medium">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-muted-foreground">
          {item.name}: {item.name === "Response rate" && typeof item.value === "number" ? `${Math.round(item.value * 100)}%` : item.value}
        </p>
      ))}
    </div>
  );
}
