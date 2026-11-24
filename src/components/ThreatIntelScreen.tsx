import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  ShieldBan,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { DetectionRule, ThreatIoc } from '../types/soc';
import { CopyButton, MitreTag, StatusBadge } from './ui/Primitives';

interface ThreatIntelScreenProps {
  iocs: ThreatIoc[];
  rules: DetectionRule[];
  onToggleBlockIoc: (id: string) => void;
  onAddIoc: (ioc: Omit<ThreatIoc, 'id' | 'firstSeen'>) => void;
  onToggleRule: (id: string) => void;
  onRunRuleInTelemetry: (query: string) => void;
}

export const ThreatIntelScreen: React.FC<ThreatIntelScreenProps> = ({
  iocs,
  rules,
  onToggleBlockIoc,
  onAddIoc,
  onToggleRule,
  onRunRuleInTelemetry,
}) => {
  const [activeTab, setActiveTab] = useState<'iocs' | 'rules'>('iocs');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<ThreatIoc['type']>('IPv4');
  const [newValue, setNewValue] = useState('');
  const [newActor, setNewActor] = useState('');
  const [newTlp, setNewTlp] = useState<ThreatIoc['tlp']>('AMBER');

  const filteredIocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return iocs.filter(
      (i) =>
        !q ||
        i.value.toLowerCase().includes(q) ||
        i.threatActor.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q)
    );
  }, [iocs, search]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.mitreId.toLowerCase().includes(q) ||
        r.query.toLowerCase().includes(q)
    );
  }, [rules, search]);

  const handleCreateIoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    onAddIoc({
      type: newType,
      value: newValue.trim(),
      threatActor: newActor.trim() || 'Manual Analyst Watch',
      confidence: 95,
      tlp: newTlp,
      sourceFeed: 'SOC Manual Entry',
      blocked: true,
    });
    setNewValue('');
    setNewActor('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Top Toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#1F2937] bg-[#0b1c30] p-3">
        <div className="flex items-center gap-1 rounded border border-[#1F2937] bg-[#031427] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('iocs')}
            className={`rounded px-3 py-1 font-mono text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'iocs'
                ? 'bg-[#1b2b3f] text-[#4cd7f6]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            IOC Watchlist ({iocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`rounded px-3 py-1 font-mono text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-[#1b2b3f] text-[#4cd7f6]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Detection Rules ({rules.filter((r) => r.enabled).length}/{rules.length})
          </button>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'iocs'
                  ? 'Search SHA-256, IPv4, domain, threat actor...'
                  : 'Search rule title, MITRE ID, KQL...'
              }
              className="h-8 w-full rounded border border-[#374151] bg-[#031427] pr-3 pl-8 font-mono text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#06B6D4] focus:outline-none"
            />
          </div>

          {activeTab === 'iocs' && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-[#06B6D4] px-3 font-mono text-xs font-semibold text-[#031427] hover:bg-[#22D3EE] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Indicator</span>
            </button>
          )}
        </div>
      </section>

      {/* Content View */}
      {activeTab === 'iocs' ? (
        <section className="overflow-hidden rounded border border-[#1F2937] bg-[#0b1c30]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#102034] font-mono text-[11px] font-medium uppercase tracking-[0.02em] text-[#64748B]">
                  <th className="px-3 py-2 whitespace-nowrap">Type</th>
                  <th className="px-3 py-2">Indicator Value</th>
                  <th className="px-3 py-2 whitespace-nowrap">Threat Group</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Confidence</th>
                  <th className="px-3 py-2 whitespace-nowrap">TLP</th>
                  <th className="px-3 py-2 whitespace-nowrap">Feed Source</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Enforcement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/70 text-xs">
                {filteredIocs.map((ioc, idx) => (
                  <tr
                    key={ioc.id}
                    className={`h-9 transition-colors hover:bg-[#1b2b3f] ${
                      idx % 2 === 1 ? 'bg-[#081628]' : 'bg-[#0b1c30]'
                    }`}
                  >
                    <td className="px-3 font-mono text-[11px] font-medium text-[#4cd7f6] whitespace-nowrap">
                      {ioc.type}
                    </td>
                    <td className="max-w-[280px] px-3 font-mono text-xs text-[#F8FAFC]">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{ioc.value}</span>
                        <CopyButton text={ioc.value} label="Copy" />
                      </div>
                    </td>
                    <td className="px-3 text-[#d3e4fe] whitespace-nowrap">
                      {ioc.threatActor}
                    </td>
                    <td className="px-3 text-right font-mono text-[11px] text-[#F8FAFC] whitespace-nowrap tabular-nums">
                      {ioc.confidence}%
                    </td>
                    <td className="px-3 whitespace-nowrap">
                      <StatusBadge
                        severity={
                          ioc.tlp === 'RED'
                            ? 'critical'
                            : ioc.tlp === 'AMBER'
                            ? 'warning'
                            : 'healthy'
                        }
                        label={`TLP:${ioc.tlp}`}
                      />
                    </td>
                    <td className="px-3 text-[#94A3B8] whitespace-nowrap">
                      {ioc.sourceFeed}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleBlockIoc(ioc.id)}
                        className={`inline-flex h-6 items-center gap-1 rounded px-2.5 font-mono text-[11px] font-medium cursor-pointer ${
                          ioc.blocked
                            ? 'border border-[#10B981]/40 bg-[#10B981]/12 text-[#34D399]'
                            : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                        }`}
                      >
                        {ioc.blocked ? (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            <span>Blocked</span>
                          </>
                        ) : (
                          <>
                            <ShieldBan className="h-3 w-3" />
                            <span>Block Edge</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="space-y-2.5">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col justify-between gap-3 rounded border border-[#1F2937] bg-[#0b1c30] p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-[#64748B]">
                    {rule.id.toUpperCase()}
                  </span>
                  <StatusBadge severity={rule.severity} />
                  <MitreTag id={`${rule.phase} · ${rule.mitreId}`} />
                  <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                    {rule.hits24h} hits / 24h · Last trigger {rule.lastTriggered}
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-[#F8FAFC]">
                  {rule.name}
                </h3>
                <div className="overflow-x-auto rounded border border-[#1F2937] bg-[#031427] px-2.5 py-1.5 font-mono text-[11px] text-[#4edea3]">
                  {rule.query}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRunRuleInTelemetry(rule.query)}
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-[#374151] bg-[#102034] px-3 font-mono text-xs text-[#4cd7f6] hover:border-[#06B6D4] cursor-pointer whitespace-nowrap"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Hunt in SIEM</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleRule(rule.id)}
                  className={`inline-flex h-8 items-center rounded px-3 font-mono text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    rule.enabled
                      ? 'border border-[#10B981]/40 bg-[#10B981]/12 text-[#34D399]'
                      : 'border border-[#374151] bg-[#102034] text-[#64748B]'
                  }`}
                >
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Add IOC Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-ioc-title"
        >
          <div className="w-full max-w-md rounded border border-[#38BDF8]/25 bg-[#102034] p-5 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <h3
                id="add-ioc-title"
                className="text-base font-semibold text-[#F8FAFC]"
              >
                Ingest Threat Indicator
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIoc} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] uppercase text-[#94A3B8]">
                    Indicator Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) =>
                      setNewType(e.target.value as ThreatIoc['type'])
                    }
                    className="mt-1 h-8 w-full rounded border border-[#374151] bg-[#031427] px-2 font-mono text-xs text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none"
                  >
                    <option value="IPv4">IPv4</option>
                    <option value="SHA-256">SHA-256</option>
                    <option value="Domain">Domain</option>
                    <option value="URL">URL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase text-[#94A3B8]">
                    TLP Classification
                  </label>
                  <select
                    value={newTlp}
                    onChange={(e) =>
                      setNewTlp(e.target.value as ThreatIoc['tlp'])
                    }
                    className="mt-1 h-8 w-full rounded border border-[#374151] bg-[#031427] px-2 font-mono text-xs text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none"
                  >
                    <option value="RED">TLP:RED</option>
                    <option value="AMBER">TLP:AMBER</option>
                    <option value="GREEN">TLP:GREEN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase text-[#94A3B8]">
                  Indicator Value
                </label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. 203.0.113.42 or SHA-256 hash"
                  className="mt-1 h-8 w-full rounded border border-[#374151] bg-[#031427] px-2.5 font-mono text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#06B6D4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase text-[#94A3B8]">
                  Attributed Threat Group
                </label>
                <input
                  type="text"
                  value={newActor}
                  onChange={(e) => setNewActor(e.target.value)}
                  placeholder="e.g. UNC-4910"
                  className="mt-1 h-8 w-full rounded border border-[#374151] bg-[#031427] px-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#06B6D4] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 rounded border border-[#374151] px-3 font-mono text-xs text-[#bcc9cd] hover:bg-[#1b2b3f] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 rounded bg-[#06B6D4] px-3 font-mono text-xs font-semibold text-[#031427] hover:bg-[#22D3EE] cursor-pointer"
                >
                  Add &amp; Enforce Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
