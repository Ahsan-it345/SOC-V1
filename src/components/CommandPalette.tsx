import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, Server, ShieldAlert, Terminal, X } from 'lucide-react';
import { Asset, Incident, NavSection } from '../types/soc';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  incidents: Incident[];
  assets: Asset[];
  onNavigate: (section: NavSection) => void;
  onSelectIncident: (id: string) => void;
  onPivotHost: (hostname: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  incidents,
  assets,
  onNavigate,
  onSelectIncident,
  onPivotHost,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: {
      id: string;
      category: string;
      label: string;
      sublabel: string;
      icon: 'nav' | 'incident' | 'asset';
      action: () => void;
    }[] = [
      {
        id: 'nav-overview',
        category: 'Console View',
        label: 'Overview & Triage',
        sublabel: 'KPI posture, throughput chart, priority queue',
        icon: 'nav',
        action: () => onNavigate('overview'),
      },
      {
        id: 'nav-investigations',
        category: 'Console View',
        label: 'Incident Investigation',
        sublabel: 'MITRE timelines, process trees, containment',
        icon: 'nav',
        action: () => onNavigate('investigations'),
      },
      {
        id: 'nav-telemetry',
        category: 'Console View',
        label: 'Telemetry & SIEM',
        sublabel: 'KQL log search, live stream, JSON payload inspector',
        icon: 'nav',
        action: () => onNavigate('telemetry'),
      },
      {
        id: 'nav-assets',
        category: 'Console View',
        label: 'Asset & Agent Fleet',
        sublabel: 'Endpoint inventory, CVEs, host isolation',
        icon: 'nav',
        action: () => onNavigate('assets'),
      },
      {
        id: 'nav-intel',
        category: 'Console View',
        label: 'Threat Intel & Rules',
        sublabel: 'IOC watchlist & SIEM detection logic',
        icon: 'nav',
        action: () => onNavigate('intel'),
      },
      ...incidents.map((inc) => ({
        id: `inc-${inc.id}`,
        category: 'Incident',
        label: `${inc.id} — ${inc.title}`,
        sublabel: `${inc.host} (${inc.hostIp})`,
        icon: 'incident' as const,
        action: () => onSelectIncident(inc.id),
      })),
      ...assets.map((ast) => ({
        id: `ast-${ast.id}`,
        category: 'Query SIEM Host',
        label: ast.hostname,
        sublabel: `${ast.ipv4} · ${ast.os}`,
        icon: 'asset' as const,
        action: () => onPivotHost(ast.hostname),
      })),
    ];

    if (!q) return results.slice(0, 9);
    return results
      .filter(
        (r) =>
          r.label.toLowerCase().includes(q) ||
          r.sublabel.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [assets, incidents, onNavigate, onPivotHost, onSelectIncident, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-20 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded border border-[#38BDF8]/25 bg-[#1b2b3f] shadow-[0_8px_24px_-4px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-[#374151] bg-[#102034] px-3.5 py-2.5">
          <Search className="h-4 w-4 text-[#4cd7f6]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to screen, incident ID, hostname, or IPv4..."
            className="flex-1 bg-transparent font-mono text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 divide-y divide-[#1F2937]/70 overflow-y-auto bg-[#0b1c30]">
          {items.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs text-[#64748B]">
              No matching commands or assets.
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#1b2b3f] cursor-pointer"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {item.icon === 'incident' ? (
                    <ShieldAlert className="h-4 w-4 shrink-0 text-[#EF4444]" />
                  ) : item.icon === 'asset' ? (
                    <Server className="h-4 w-4 shrink-0 text-[#38BDF8]" />
                  ) : (
                    <Terminal className="h-4 w-4 shrink-0 text-[#06B6D4]" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-[#F8FAFC]">
                      {item.label}
                    </div>
                    <div className="truncate font-mono text-[11px] text-[#64748B]">
                      {item.sublabel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] uppercase text-[#94A3B8]">
                    {item.category}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#64748B]" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
