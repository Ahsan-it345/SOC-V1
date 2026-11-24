import React, { useMemo, useState } from 'react';
import {
  Download,
  Filter,
  Pause,
  Play,
  Rows3,
  Search,
  Terminal,
  X,
} from 'lucide-react';
import { Severity, TelemetryEvent } from '../types/soc';
import { CopyButton, MitreTag, StatusBadge } from './ui/Primitives';

interface TelemetryScreenProps {
  events: TelemetryEvent[];
  query: string;
  onQueryChange: (q: string) => void;
  streaming: boolean;
  onToggleStreaming: () => void;
  onIsolateHost: (hostname: string) => void;
}

const PRESET_QUERIES = [
  'severity:critical',
  'source:EDR AND action:ALERT',
  'host:prod-k8s-worker-04',
  'protocol:DNS AND action:BLOCK',
];

function renderHighlightedKql(query: string) {
  if (!query) return null;
  const tokens = query.split(/(\s+)/);
  return tokens.map((token, i) => {
    if (token === 'AND' || token === 'OR' || token === 'NOT') {
      return (
        <span key={i} className="font-semibold text-[#06B6D4]">
          {token}
        </span>
      );
    }
    if (token.includes(':')) {
      const [field, ...rest] = token.split(':');
      const val = rest.join(':');
      return (
        <span key={i}>
          <span className="text-[#4cd7f6]">{field}:</span>
          <span className="text-[#10B981]">{val}</span>
        </span>
      );
    }
    return (
      <span key={i} className="text-[#F8FAFC]">
        {token}
      </span>
    );
  });
}

function matchesKql(evt: TelemetryEvent, rawQuery: string): boolean {
  const q = rawQuery.trim();
  if (!q) return true;

  // Support simple AND / OR clauses and field:value syntax
  const orGroups = q.split(/\s+OR\s+/i);
  return orGroups.some((group) => {
    const terms = group.split(/\s+AND\s+/i).flatMap((part) => part.trim().split(/\s+/));
    return terms.every((term) => {
      if (!term) return true;
      const lower = term.toLowerCase();
      if (lower.includes(':')) {
        const [field, ...valParts] = lower.split(':');
        const val = valParts.join(':');
        if (!val) return true;
        switch (field) {
          case 'severity':
            return evt.severity.toLowerCase().includes(val);
          case 'source':
            return evt.source.toLowerCase().includes(val);
          case 'host':
            return evt.host.toLowerCase().includes(val);
          case 'ip':
          case 'src':
            return evt.srcIp.includes(val) || evt.dstIp.includes(val);
          case 'dst':
            return evt.dstIp.includes(val);
          case 'protocol':
            return evt.protocol.toLowerCase().includes(val);
          case 'action':
            return evt.action.toLowerCase().includes(val);
          case 'mitre':
            return (evt.mitreId ?? '').toLowerCase().includes(val);
          default:
            return JSON.stringify(evt).toLowerCase().includes(val);
        }
      }
      return (
        evt.host.toLowerCase().includes(lower) ||
        evt.message.toLowerCase().includes(lower) ||
        evt.srcIp.includes(lower) ||
        evt.dstIp.includes(lower) ||
        evt.source.toLowerCase().includes(lower) ||
        (evt.mitreId ?? '').toLowerCase().includes(lower)
      );
    });
  });
}

export const TelemetryScreen: React.FC<TelemetryScreenProps> = ({
  events,
  query,
  onQueryChange,
  streaming,
  onToggleStreaming,
  onIsolateHost,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events[0]?.id ?? ''
  );
  const [ultraDense, setUltraDense] = useState(false);
  const [severityTab, setSeverityTab] = useState<Severity | 'all'>('all');
  const [pivotTarget, setPivotTarget] = useState<{
    type: 'host' | 'ip';
    value: string;
  } | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (severityTab !== 'all' && evt.severity !== severityTab) return false;
      return matchesKql(evt, query);
    });
  }, [events, query, severityTab]);

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) ?? filteredEvents[0] ?? null;

  const handleExportCsv = () => {
    const headers = [
      'id',
      'timestamp',
      'severity',
      'source',
      'host',
      'srcIp',
      'dstIp',
      'port',
      'protocol',
      'action',
      'mitreId',
      'message',
    ];
    const rows = filteredEvents.map((e) =>
      [
        e.id,
        e.timestamp,
        e.severity,
        e.source,
        e.host,
        e.srcIp,
        e.dstIp,
        e.port,
        e.protocol,
        e.action,
        e.mitreId ?? '',
        `"${e.message.replace(/"/g, '""')}"`,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `siem-telemetry-${new Date().toISOString().slice(0, 19)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* KQL / Lucene Query Bar & Controls */}
      <section className="rounded border border-[#1F2937] bg-[#0b1c30] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-[#06B6D4]" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="KQL Query: e.g. source:EDR AND severity:critical OR host:prod-k8s-worker-04"
              aria-label="KQL Telemetry Query"
              className="h-9 w-full rounded border border-[#374151] bg-[#031427] pr-8 pl-9 font-mono text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#06B6D4] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute top-2.5 right-2.5 text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
                aria-label="Clear query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleStreaming}
            className={`inline-flex h-9 items-center gap-1.5 rounded border px-3 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              streaming
                ? 'border-[#10B981]/40 bg-[#10B981]/12 text-[#34D399]'
                : 'border-[#374151] bg-[#102034] text-[#bcc9cd] hover:text-[#F8FAFC]'
            }`}
          >
            {streaming ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Resume Stream</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setUltraDense((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded border px-3 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              ultraDense
                ? 'border-[#06B6D4] bg-[#102034] text-[#4cd7f6]'
                : 'border-[#374151] bg-[#102034] text-[#bcc9cd] hover:text-[#F8FAFC]'
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" />
            <span>{ultraDense ? '28px Ultra-Dense' : '32px Compact'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-[#374151] bg-[#102034] px-3 font-mono text-xs font-medium text-[#F8FAFC] hover:border-[#06B6D4] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Syntax Preview + Quick Filter Presets */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
              Presets:
            </span>
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onQueryChange(preset)}
                className="rounded border border-[#1F2937] bg-[#031427] px-2 py-0.5 font-mono text-[11px] text-[#94A3B8] hover:border-[#374151] hover:text-[#4cd7f6] cursor-pointer whitespace-nowrap"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded border border-[#1F2937] bg-[#031427] p-0.5">
            {(['all', 'critical', 'warning', 'info', 'healthy'] as const).map(
              (sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverityTab(sev)}
                  className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    severityTab === sev
                      ? 'bg-[#1b2b3f] text-[#4cd7f6]'
                      : 'text-[#64748B] hover:text-[#d3e4fe]'
                  }`}
                >
                  {sev}
                </button>
              )
            )}
          </div>
        </div>

        {query && (
          <div className="mt-2 flex items-center gap-2 rounded border border-[#1F2937] bg-[#031427] px-2.5 py-1 font-mono text-[11px]">
            <Filter className="h-3 w-3 shrink-0 text-[#64748B]" />
            <span className="text-[#64748B]">Parsed:</span>
            <div className="truncate">{renderHighlightedKql(query)}</div>
          </div>
        )}
      </section>

      {/* Quick Pivot Context Bar (when user clicks a host or IP) */}
      {pivotTarget && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#06B6D4]/40 bg-[#102034] px-3 py-2 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[#94A3B8]">Quick Pivot Target:</span>
            <span className="font-semibold text-[#4cd7f6]">{pivotTarget.value}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onQueryChange(
                  pivotTarget.type === 'host'
                    ? `host:${pivotTarget.value}`
                    : `ip:${pivotTarget.value}`
                );
                setPivotTarget(null);
              }}
              className="h-6 rounded bg-[#06B6D4] px-2.5 font-mono text-[11px] font-semibold text-[#031427] hover:bg-[#22D3EE] cursor-pointer"
            >
              Filter Logs
            </button>
            {pivotTarget.type === 'host' && (
              <button
                type="button"
                onClick={() => {
                  onIsolateHost(pivotTarget.value);
                  setPivotTarget(null);
                }}
                className="h-6 rounded bg-[#EF4444] px-2.5 font-mono text-[11px] font-semibold text-white hover:bg-[#DC2626] cursor-pointer"
              >
                Isolate Host
              </button>
            )}
            <button
              type="button"
              onClick={() => setPivotTarget(null)}
              className="h-6 rounded border border-[#374151] px-2 font-mono text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Split: Telemetry Grid + Raw Payload Inspector */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <section className="overflow-hidden rounded border border-[#1F2937] bg-[#0b1c30] xl:col-span-8">
          <div className="flex items-center justify-between border-b border-[#1F2937] px-3 py-2">
            <span className="font-mono text-[11px] font-medium text-[#94A3B8] tabular-nums">
              {filteredEvents.length} events matched
            </span>
            <span className="font-mono text-[11px] text-[#64748B]">
              Click any hostname or IP to pivot · Select row for JSON payload
            </span>
          </div>

          <div className="max-h-[520px] overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 border-b border-[#1F2937] bg-[#102034] font-mono text-[11px] font-medium uppercase tracking-[0.02em] text-[#64748B]">
                <tr>
                  <th className="px-3 py-2 whitespace-nowrap">Timestamp</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Severity</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Source</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Host</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">Src → Dst</th>
                  <th className="px-2.5 py-2 text-right whitespace-nowrap">Port</th>
                  <th className="px-2.5 py-2 whitespace-nowrap">MITRE</th>
                  <th className="px-3 py-2">Event Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/60">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center font-mono text-xs text-[#64748B]"
                    >
                      No telemetry events match query &ldquo;{query}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt, idx) => {
                    const isSelected = selectedEvent?.id === evt.id;
                    const rowHeight = ultraDense ? 'h-7 text-[11px]' : 'h-8 text-xs';
                    return (
                      <tr
                        key={evt.id}
                        onClick={() => setSelectedEventId(evt.id)}
                        className={`${rowHeight} cursor-pointer transition-colors hover:bg-[#1b2b3f] ${
                          isSelected
                            ? 'bg-[#1b2b3f] ring-1 ring-inset ring-[#06B6D4]/50'
                            : idx % 2 === 1
                            ? 'bg-[#081628]'
                            : 'bg-[#0b1c30]'
                        }`}
                      >
                        <td className="px-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap tabular-nums">
                          {evt.timestamp}
                        </td>
                        <td className="px-2.5 whitespace-nowrap">
                          <StatusBadge
                            severity={evt.severity}
                            label={evt.action}
                          />
                        </td>
                        <td className="px-2.5 font-mono text-[11px] text-[#94A3B8] whitespace-nowrap">
                          {evt.source}
                        </td>
                        <td className="px-2.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPivotTarget({ type: 'host', value: evt.host });
                            }}
                            className="font-mono text-[11px] text-[#38BDF8] hover:underline cursor-pointer"
                          >
                            {evt.host}
                          </button>
                        </td>
                        <td className="px-2.5 font-mono text-[11px] whitespace-nowrap tabular-nums">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPivotTarget({ type: 'ip', value: evt.srcIp });
                            }}
                            className="text-[#38BDF8] hover:underline cursor-pointer"
                          >
                            {evt.srcIp}
                          </button>
                          <span className="mx-1 text-[#64748B]">→</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPivotTarget({ type: 'ip', value: evt.dstIp });
                            }}
                            className="text-[#38BDF8] hover:underline cursor-pointer"
                          >
                            {evt.dstIp}
                          </button>
                        </td>
                        <td className="px-2.5 text-right font-mono text-[11px] text-[#bcc9cd] whitespace-nowrap tabular-nums">
                          {evt.port}/{evt.protocol}
                        </td>
                        <td className="px-2.5 whitespace-nowrap">
                          {evt.mitreId ? (
                            <MitreTag
                              id={evt.mitreId}
                              onClick={() => onQueryChange(`mitre:${evt.mitreId}`)}
                            />
                          ) : (
                            <span className="font-mono text-[11px] text-[#475569]">
                              —
                            </span>
                          )}
                        </td>
                        <td className="max-w-[260px] truncate px-3 text-[#d3e4fe]">
                          {evt.message}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Raw JSON Event Payload Inspector */}
        <aside className="flex flex-col rounded border border-[#1F2937] bg-[#0b1c30] p-4 xl:col-span-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#06B6D4]" />
              <h3 className="text-[15px] font-semibold text-[#F8FAFC]">
                Raw Event Inspector
              </h3>
            </div>
            {selectedEvent && (
              <CopyButton
                text={JSON.stringify(selectedEvent, null, 2)}
                label="Copy JSON"
              />
            )}
          </div>

          {selectedEvent ? (
            <div className="mt-3 flex flex-1 flex-col space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded border border-[#1F2937] bg-[#031427] p-2.5 font-mono text-[11px]">
                <div>
                  <span className="text-[#64748B]">Event ID:</span>{' '}
                  <span className="text-[#4cd7f6]">{selectedEvent.id}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Source:</span>{' '}
                  <span className="text-[#F8FAFC]">{selectedEvent.source}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Host:</span>{' '}
                  <span className="text-[#38BDF8]">{selectedEvent.host}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Proto:</span>{' '}
                  <span className="text-[#F8FAFC] tabular-nums">
                    {selectedEvent.protocol}:{selectedEvent.port}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  Normalized JSON Payload
                </div>
                <pre className="max-h-[360px] overflow-auto rounded border border-[#1F2937] bg-[#031427] p-3 font-mono text-[11px] leading-relaxed text-[#4edea3]">
                  {JSON.stringify(
                    {
                      id: selectedEvent.id,
                      timestamp: selectedEvent.timestamp,
                      severity: selectedEvent.severity,
                      action: selectedEvent.action,
                      host: selectedEvent.host,
                      src_ip: selectedEvent.srcIp,
                      dst_ip: selectedEvent.dstIp,
                      mitre_technique: selectedEvent.mitreId ?? null,
                      telemetry: selectedEvent.rawPayload,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center text-xs text-[#64748B]">
              Select a telemetry row to inspect its normalized JSON payload.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
