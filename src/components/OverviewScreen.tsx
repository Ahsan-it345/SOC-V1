import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Asset, Incident, MitrePhase, TimeWindow } from '../types/soc';
import { MetricCard, MitreTag, StatusBadge } from './ui/Primitives';

interface OverviewScreenProps {
  incidents: Incident[];
  assets: Asset[];
  timeWindow: TimeWindow;
  onSelectIncident: (id: string) => void;
  onToggleIsolateHost: (hostname: string) => void;
  onPivotHostToTelemetry: (hostname: string) => void;
}

const THROUGHPUT_SERIES: Record<
  TimeWindow,
  { labels: string[]; baseline: number[]; anomalies: number[] }
> = {
  '15m': {
    labels: ['07:24', '07:26', '07:28', '07:30', '07:32', '07:34', '07:36', '07:38'],
    baseline: [14.1, 14.8, 15.2, 14.9, 16.4, 18.1, 17.6, 15.9],
    anomalies: [2, 3, 4, 3, 9, 18, 14, 11],
  },
  '1h': {
    labels: ['06:40', '06:50', '07:00', '07:10', '07:15', '07:20', '07:30', '07:38'],
    baseline: [12.4, 13.9, 13.2, 14.4, 16.8, 17.5, 16.2, 15.9],
    anomalies: [1, 5, 4, 3, 14, 19, 12, 11],
  },
  '24h': {
    labels: ['08:00', '12:00', '16:00', '20:00', '00:00', '02:00', '04:00', '07:38'],
    baseline: [18.2, 22.1, 21.4, 15.8, 10.4, 9.8, 11.9, 15.9],
    anomalies: [3, 4, 6, 2, 1, 4, 8, 18],
  },
  '7d': {
    labels: ['Nov 18', 'Nov 19', 'Nov 20', 'Nov 21', 'Nov 22', 'Nov 23', 'Nov 24'],
    baseline: [16.5, 17.1, 18.4, 16.9, 13.2, 12.8, 15.9],
    anomalies: [4, 6, 9, 5, 3, 7, 18],
  },
};

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  incidents,
  assets,
  timeWindow,
  onSelectIncident,
  onToggleIsolateHost,
  onPivotHostToTelemetry,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<MitrePhase | 'ALL'>('ALL');

  const activeP1Count = incidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved'
  ).length;
  const openCount = incidents.filter((i) => i.status !== 'resolved').length;
  const healthyAssets = assets.filter((a) => a.status === 'healthy').length;
  const isolatedCount = assets.filter((a) => a.status === 'isolated').length;

  const chart = THROUGHPUT_SERIES[timeWindow];

  const killChainBreakdown = useMemo(() => {
    const phases: MitrePhase[] = [
      'Initial Access',
      'Execution',
      'Persistence',
      'Credential Access',
      'Exfiltration',
    ];
    return phases.map((phase) => {
      const count = incidents.filter(
        (inc) =>
          inc.primaryPhase === phase ||
          inc.timeline.some((tl) => tl.phase === phase)
      ).length;
      return { phase, count };
    });
  }, [incidents]);

  const filteredQueue = useMemo(() => {
    return incidents.filter((inc) => {
      if (selectedPhase === 'ALL') return true;
      return (
        inc.primaryPhase === selectedPhase ||
        inc.timeline.some((tl) => tl.phase === selectedPhase)
      );
    });
  }, [incidents, selectedPhase]);

  // SVG chart geometry
  const svgW = 680;
  const svgH = 210;
  const padL = 36;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const maxBase = Math.max(...chart.baseline, 24);
  const maxAnom = Math.max(...chart.anomalies, 20);

  const baselinePoints = chart.baseline.map((v, i) => {
    const x = padL + (i / Math.max(chart.baseline.length - 1, 1)) * plotW;
    const y = padT + plotH - (v / maxBase) * plotH;
    return { x, y, v };
  });

  const anomPoints = chart.anomalies.map((v, i) => {
    const x = padL + (i / Math.max(chart.anomalies.length - 1, 1)) * plotW;
    const y = padT + plotH - (v / maxAnom) * plotH;
    return { x, y, v };
  });

  const basePath = `M ${baselinePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const baseArea = `${basePath} L ${(padL + plotW).toFixed(1)},${(padT + plotH).toFixed(1)} L ${padL},${(padT + plotH).toFixed(1)} Z`;
  const anomPath = `M ${anomPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;

  const activePointIdx = hoveredIdx ?? chart.labels.length - 1;

  return (
    <div className="space-y-4">
      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active P1 Threats"
          value={activeP1Count}
          delta={activeP1Count > 0 ? '+2 in 1h' : '0 active'}
          deltaTone={activeP1Count > 0 ? 'critical' : 'healthy'}
          sparkData={[0, 1, 1, 0, 1, 2, activeP1Count]}
          sparkColor="#EF4444"
          subtitle={`${openCount} open incidents`}
        />
        <MetricCard
          title="Telemetry Ingest"
          value="15.9k/s"
          delta="+12.4%"
          deltaTone="neutral"
          sparkData={chart.baseline}
          sparkColor="#06B6D4"
          subtitle="EDR · SIEM · K8s Audit"
        />
        <MetricCard
          title="Protected Endpoints"
          value={`${healthyAssets}/${assets.length}`}
          delta={`${isolatedCount} isolated`}
          deltaTone={isolatedCount > 0 ? 'warning' : 'healthy'}
          sparkData={[8, 8, 7, 8, 7, 6, healthyAssets]}
          sparkColor="#10B981"
          subtitle="99.4% sensor heartbeat"
        />
        <MetricCard
          title="Mean Time to Contain"
          value="08m 42s"
          delta="-24% vs 7d"
          deltaTone="healthy"
          sparkData={[14.2, 12.8, 11.9, 10.5, 9.8, 9.1, 8.7]}
          sparkColor="#3B82F6"
          subtitle="SLA target < 15m"
        />
      </div>

      {/* Main Asymmetric Workspace Grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Left 8 Columns: Telemetry Chart + Priority Incident Queue */}
        <div className="space-y-3 lg:col-span-8">
          {/* Telemetry Throughput & Anomaly Correlation */}
          <section className="rounded border border-[#1F2937] bg-[#0b1c30] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-[#F8FAFC]">
                  Telemetry Throughput &amp; Anomaly Correlation
                </h2>
                <p className="mt-0.5 text-xs text-[#94A3B8]">
                  Baseline SIEM ingestion (k events/s) correlated against high-confidence rule triggers ({timeWindow})
                </p>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
                <span className="flex items-center gap-1.5 text-[#4cd7f6]">
                  <span className="h-2 w-2 rounded-sm bg-[#06B6D4]" aria-hidden="true" />
                  Baseline: {chart.baseline[activePointIdx]}k/s
                </span>
                <span className="flex items-center gap-1.5 text-[#F87171]">
                  <span className="h-2 w-2 rounded-sm bg-[#EF4444]" aria-hidden="true" />
                  Anomalies: {chart.anomalies[activePointIdx]} alerts
                </span>
              </div>
            </div>

            <div className="mt-3">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="h-[210px] w-full select-none"
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <defs>
                  <linearGradient id="telemetryFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                  const y = padT + plotH * (1 - t);
                  const val = Math.round(maxBase * t);
                  return (
                    <g key={idx}>
                      <line
                        x1={padL}
                        x2={padL + plotW}
                        y1={y}
                        y2={y}
                        stroke="#1F2937"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padL - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-[#64748B] font-mono text-[10px]"
                      >
                        {val}k
                      </text>
                    </g>
                  );
                })}

                {/* Baseline Area & Line */}
                <path d={baseArea} fill="url(#telemetryFill)" />
                <path
                  d={basePath}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Anomaly Line */}
                <path
                  d={anomPath}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="1.75"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hover Crosshair */}
                <line
                  x1={baselinePoints[activePointIdx].x}
                  x2={baselinePoints[activePointIdx].x}
                  y1={padT}
                  y2={padT + plotH}
                  stroke="#374151"
                  strokeWidth="1"
                />

                {/* Interactive Hit Columns & Data Dots */}
                {chart.labels.map((label, i) => {
                  const bp = baselinePoints[i];
                  const ap = anomPoints[i];
                  const isActive = i === activePointIdx;
                  return (
                    <g key={label}>
                      <text
                        x={bp.x}
                        y={svgH - 6}
                        textAnchor="middle"
                        className={`font-mono text-[10px] ${
                          isActive ? 'fill-[#d3e4fe]' : 'fill-[#64748B]'
                        }`}
                      >
                        {label}
                      </text>
                      <circle
                        cx={bp.x}
                        cy={bp.y}
                        r={isActive ? 4 : 2.5}
                        fill="#06B6D4"
                        stroke="#031427"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={ap.x}
                        cy={ap.y}
                        r={isActive ? 4 : 2.5}
                        fill="#EF4444"
                        stroke="#031427"
                        strokeWidth="1.5"
                      />
                      <rect
                        x={bp.x - plotW / chart.labels.length / 2}
                        y={padT}
                        width={plotW / chart.labels.length}
                        height={plotH + 20}
                        fill="transparent"
                        className="cursor-crosshair"
                        onMouseEnter={() => setHoveredIdx(i)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>

          {/* Priority Incident Queue Table */}
          <section className="rounded border border-[#1F2937] bg-[#0b1c30]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] px-4 py-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[15px] font-semibold text-[#F8FAFC]">
                  Priority Incident Queue
                </h2>
                {selectedPhase !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedPhase('ALL')}
                    className="rounded border border-[#374151] bg-[#102034] px-2 py-0.5 font-mono text-[11px] text-[#4cd7f6] hover:border-[#06B6D4] cursor-pointer"
                  >
                    Phase: {selectedPhase} ×
                  </button>
                )}
              </div>
              <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                Showing {filteredQueue.length} of {incidents.length} incidents
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#1F2937] bg-[#102034] font-mono text-[11px] font-medium uppercase tracking-[0.02em] text-[#64748B]">
                    <th className="px-3 py-2 whitespace-nowrap">Incident ID</th>
                    <th className="px-3 py-2 whitespace-nowrap">Severity</th>
                    <th className="px-3 py-2">Summary</th>
                    <th className="px-3 py-2 whitespace-nowrap">Target Host</th>
                    <th className="px-3 py-2 whitespace-nowrap">MITRE</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/70 text-[13px]">
                  {filteredQueue.map((inc, idx) => (
                    <tr
                      key={inc.id}
                      onClick={() => onSelectIncident(inc.id)}
                      className={`h-9 cursor-pointer transition-colors hover:bg-[#1b2b3f] ${
                        idx % 2 === 1 ? 'bg-[#081628]' : 'bg-[#0b1c30]'
                      }`}
                    >
                      <td className="px-3 py-1.5 font-mono text-xs font-medium text-[#4cd7f6] whitespace-nowrap tabular-nums">
                        {inc.id}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <StatusBadge
                          severity={inc.severity}
                          pulse={inc.severity === 'critical' && inc.status === 'active'}
                          label={
                            inc.status === 'contained'
                              ? 'CONTAINED'
                              : inc.status === 'resolved'
                              ? 'RESOLVED'
                              : undefined
                          }
                        />
                      </td>
                      <td className="max-w-[260px] truncate px-3 py-1.5 font-medium text-[#F8FAFC]">
                        {inc.title}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPivotHostToTelemetry(inc.host);
                          }}
                          className="font-mono text-xs text-[#38BDF8] hover:underline cursor-pointer"
                          title="Pivot to SIEM telemetry for this host"
                        >
                          {inc.host}
                        </button>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {inc.mitreTechniques.slice(0, 2).map((t) => (
                            <MitreTag key={t} id={t} />
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectIncident(inc.id);
                            }}
                            className="inline-flex h-6 items-center gap-1 rounded border border-[#374151] bg-[#102034] px-2 font-mono text-[11px] text-[#F8FAFC] hover:border-[#06B6D4] hover:text-[#4cd7f6] cursor-pointer"
                          >
                            <span>Investigate</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right 4 Columns: Kill-Chain Breakdown & Host Containment Watchlist */}
        <div className="space-y-3 lg:col-span-4">
          {/* MITRE ATT&CK Kill-Chain Phase Breakdown */}
          <section className="rounded border border-[#1F2937] bg-[#0b1c30] p-4">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5">
              <h2 className="text-[15px] font-semibold text-[#F8FAFC]">
                ATT&amp;CK Phase Distribution
              </h2>
              <span className="font-mono text-[11px] text-[#64748B]">Click to filter</span>
            </div>
            <div className="mt-3 space-y-2.5">
              {killChainBreakdown.map(({ phase, count }) => {
                const max = Math.max(...killChainBreakdown.map((k) => k.count), 1);
                const pct = Math.round((count / max) * 100);
                const active = selectedPhase === phase;
                return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() =>
                      setSelectedPhase(active ? 'ALL' : phase)
                    }
                    className={`w-full rounded border p-2 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-[#06B6D4] bg-[#102034]'
                        : 'border-[#1F2937] bg-[#031427]/60 hover:border-[#374151]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#d3e4fe]">{phase}</span>
                      <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                        {count} {count === 1 ? 'incident' : 'incidents'}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-sm bg-[#102034]">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          active ? 'bg-[#4cd7f6]' : 'bg-[#06B6D4]/80'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Critical Host Containment Watchlist */}
          <section className="rounded border border-[#1F2937] bg-[#0b1c30] p-4">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5">
              <h2 className="text-[15px] font-semibold text-[#F8FAFC]">
                High-Risk Endpoint Watchlist
              </h2>
              <span className="font-mono text-[11px] text-[#94A3B8]">EDR Live</span>
            </div>
            <div className="mt-3 divide-y divide-[#1F2937]">
              {assets.slice(0, 5).map((asset) => {
                const isIsolated = asset.status === 'isolated';
                const isCompromised = asset.status === 'compromised';
                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {isCompromised ? (
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[#EF4444]" />
                        ) : isIsolated ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
                        ) : asset.status === 'warning' ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                        )}
                        <button
                          type="button"
                          onClick={() => onPivotHostToTelemetry(asset.hostname)}
                          className="truncate font-mono text-xs font-medium text-[#38BDF8] hover:underline cursor-pointer"
                        >
                          {asset.hostname}
                        </button>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-[#64748B] tabular-nums">
                        <span>{asset.ipv4}</span>
                        <span aria-hidden="true">·</span>
                        <span>CPU {asset.cpuPct}%</span>
                        <span aria-hidden="true">·</span>
                        <span>{asset.openCves.length} CVEs</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleIsolateHost(asset.hostname)}
                      className={`h-7 rounded px-2.5 font-mono text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isIsolated
                          ? 'border border-[#374151] bg-[#102034] text-[#34D399] hover:border-[#10B981]'
                          : isCompromised
                          ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                          : 'border border-[#374151] bg-transparent text-[#F8FAFC] hover:bg-[#1E293B]'
                      }`}
                    >
                      {isIsolated ? 'Release' : 'Isolate'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
