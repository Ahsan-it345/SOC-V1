import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Lock,
  Plus,
  Search,
  ShieldBan,
  Terminal,
  Unlock,
} from 'lucide-react';
import { Incident, MitrePhase, ProcessNode } from '../types/soc';
import { CopyButton, MitreTag, StatusBadge } from './ui/Primitives';

interface InvestigationScreenProps {
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncident: (id: string) => void;
  onToggleIsolateIncidentHost: (incidentId: string) => void;
  onRevokeToken: (incidentId: string) => void;
  onResolveIncident: (incidentId: string) => void;
  onToggleBlockArtifact: (incidentId: string, artifactId: string) => void;
  onAddNote: (incidentId: string, content: string) => void;
  onPivotHostToTelemetry: (hostname: string) => void;
}

const PHASE_DOT_COLOR: Record<MitrePhase, string> = {
  'Initial Access': 'bg-[#F59E0B] border-[#FBBF24]',
  Execution: 'bg-[#EF4444] border-[#F87171]',
  Persistence: 'bg-[#3B82F6] border-[#60A5FA]',
  'Privilege Escalation': 'bg-[#EF4444] border-[#F87171]',
  'Credential Access': 'bg-[#EF4444] border-[#F87171]',
  'Lateral Movement': 'bg-[#F59E0B] border-[#FBBF24]',
  Exfiltration: 'bg-[#06B6D4] border-[#4cd7f6]',
};

const ProcessTreeBranch: React.FC<{ node: ProcessNode; depth?: number }> = ({
  node,
  depth = 0,
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Boolean(node.children && node.children.length > 0);

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-[#1F2937] pl-3' : ''}>
      <div
        className={`mt-1.5 rounded border px-2.5 py-2 ${
          node.malicious
            ? 'border-[#EF4444]/40 bg-[#EF4444]/8'
            : 'border-[#1F2937] bg-[#031427]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex h-4 w-4 items-center justify-center rounded text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] cursor-pointer"
                aria-label={expanded ? 'Collapse process branch' : 'Expand process branch'}
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <Terminal className="h-3.5 w-3.5 text-[#64748B]" />
            )}
            <span className="font-mono text-xs font-semibold text-[#F8FAFC]">
              {node.name}
            </span>
            <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
              PID {node.pid}
            </span>
            <span className="font-mono text-[11px] text-[#94A3B8]">
              ({node.user})
            </span>
            {node.malicious && (
              <StatusBadge severity="critical" label="MALICIOUS" />
            )}
          </div>
          <CopyButton text={node.hash} label="SHA-256" />
        </div>
        <div className="mt-1.5 overflow-x-auto font-mono text-[11px] text-[#bcc9cd]">
          {node.commandLine}
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <ProcessTreeBranch key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const InvestigationScreen: React.FC<InvestigationScreenProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onToggleIsolateIncidentHost,
  onRevokeToken,
  onResolveIncident,
  onToggleBlockArtifact,
  onAddNote,
  onPivotHostToTelemetry,
}) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'resolved'>('all');
  const [noteInput, setNoteInput] = useState('');

  const filteredList = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSeverity =
        severityFilter === 'all'
          ? true
          : severityFilter === 'resolved'
          ? inc.status === 'resolved' || inc.status === 'contained'
          : inc.severity === severityFilter;

      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        inc.id.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.host.toLowerCase().includes(q) ||
        inc.mitreTechniques.some((t) => t.toLowerCase().includes(q));

      return matchesSeverity && matchesQuery;
    });
  }, [incidents, search, severityFilter]);

  const activeIncident =
    incidents.find((i) => i.id === selectedIncidentId) ?? filteredList[0] ?? incidents[0];

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !activeIncident) return;
    onAddNote(activeIncident.id, noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* Left Queue Column */}
      <aside className="flex flex-col rounded border border-[#1F2937] bg-[#0b1c30] lg:col-span-4">
        <div className="border-b border-[#1F2937] p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter ID, host, MITRE technique..."
              className="h-8 w-full rounded border border-[#374151] bg-[#031427] pr-3 pl-8 font-mono text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#06B6D4] focus:outline-none"
            />
          </div>
          <div className="mt-2.5 flex items-center gap-1 rounded border border-[#1F2937] bg-[#031427] p-1">
            {(['all', 'critical', 'warning', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSeverityFilter(tab)}
                className={`flex-1 rounded py-1 font-mono text-[11px] font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  severityFilter === tab
                    ? 'bg-[#1b2b3f] text-[#4cd7f6]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#1F2937] overflow-y-auto lg:max-h-[calc(100vh-210px)]">
          {filteredList.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#94A3B8]">
              No incidents match current filters.
            </div>
          ) : (
            filteredList.map((inc) => {
              const selected = inc.id === activeIncident?.id;
              return (
                <button
                  key={inc.id}
                  type="button"
                  onClick={() => onSelectIncident(inc.id)}
                  className={`w-full p-3 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#1b2b3f] ring-1 ring-inset ring-[#06B6D4]/50'
                      : 'hover:bg-[#102034]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#4cd7f6]">
                      {inc.id}
                    </span>
                    <StatusBadge
                      severity={inc.severity}
                      status={inc.status === 'resolved' || inc.status === 'contained' ? inc.status : undefined}
                      pulse={inc.severity === 'critical' && inc.status === 'active'}
                    />
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-[13px] font-medium text-[#F8FAFC]">
                    {inc.title}
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-[#64748B]">
                    <span>{inc.host}</span>
                    <span>{inc.assignee}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Dossier Column */}
      {activeIncident && (
        <div className="space-y-3 lg:col-span-8">
          {/* Header & Containment Bar */}
          <section className="rounded border border-[#1F2937] bg-[#0b1c30] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#4cd7f6]">
                    {activeIncident.id}
                  </span>
                  <StatusBadge
                    severity={activeIncident.severity}
                    status={
                      activeIncident.status === 'resolved' ||
                      activeIncident.status === 'contained'
                        ? activeIncident.status
                        : undefined
                    }
                    pulse={
                      activeIncident.severity === 'critical' &&
                      activeIncident.status === 'active'
                    }
                  />
                  <span className="font-mono text-[11px] text-[#64748B]">
                    Opened {activeIncident.createdAt}
                  </span>
                </div>
                <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[#F8FAFC]">
                  {activeIncident.title}
                </h2>
              </div>

              {/* Tactical Containment Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleIsolateIncidentHost(activeIncident.id)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded px-3 font-mono text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    activeIncident.hostIsolated
                      ? 'border border-[#374151] bg-[#102034] text-[#34D399] hover:border-[#10B981]'
                      : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                  }`}
                >
                  {activeIncident.hostIsolated ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Release Host</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Isolate Host</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onRevokeToken(activeIncident.id)}
                  disabled={activeIncident.tokenRevoked}
                  className={`inline-flex h-8 items-center gap-1.5 rounded border px-3 font-mono text-xs font-medium transition-colors whitespace-nowrap ${
                    activeIncident.tokenRevoked
                      ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#34D399] cursor-default'
                      : 'border-[#374151] bg-[#102034] text-[#F8FAFC] hover:border-[#06B6D4] cursor-pointer'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>
                    {activeIncident.tokenRevoked ? 'Tokens Revoked' : 'Revoke Token'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onResolveIncident(activeIncident.id)}
                  disabled={activeIncident.status === 'resolved'}
                  className={`inline-flex h-8 items-center gap-1.5 rounded px-3 font-mono text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeIncident.status === 'resolved'
                      ? 'border border-[#10B981]/40 bg-[#10B981]/12 text-[#34D399] cursor-default'
                      : 'bg-[#06B6D4] text-[#031427] hover:bg-[#22D3EE] cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {activeIncident.status === 'resolved'
                      ? 'Resolved'
                      : 'Mark Resolved'}
                  </span>
                </button>
              </div>
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-[#bcc9cd]">
              {activeIncident.summary}
            </p>

            {/* Metadata Strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#1F2937] pt-3 sm:grid-cols-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  Target Asset
                </div>
                <button
                  type="button"
                  onClick={() => onPivotHostToTelemetry(activeIncident.host)}
                  className="mt-0.5 font-mono text-xs font-medium text-[#38BDF8] hover:underline cursor-pointer"
                >
                  {activeIncident.host}
                </button>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  Host IPv4
                </div>
                <div className="mt-0.5 font-mono text-xs text-[#F8FAFC] tabular-nums">
                  {activeIncident.hostIp}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  Affected Identities
                </div>
                <div className="mt-0.5 font-mono text-xs text-[#F8FAFC] truncate">
                  {activeIncident.affectedUsers.join(', ')}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">
                  MITRE ATT&amp;CK
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeIncident.mitreTechniques.map((t) => (
                    <MitreTag key={t} id={t} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Incident Investigation Timeline & Process Tree */}
          <section className="rounded border border-[#1F2937] bg-[#0b1c30] p-4">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-2.5">
              <h3 className="text-[15px] font-semibold text-[#F8FAFC]">
                Attack Kill-Chain Timeline &amp; Process Execution Tree
              </h3>
              <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums">
                {activeIncident.timeline.length} correlated events
              </span>
            </div>

            <div className="relative mt-4 space-y-5 pl-6">
              {/* Vertical track line */}
              <div
                className="absolute top-2 bottom-2 left-[9px] w-px bg-[#1F2937]"
                aria-hidden="true"
              />

              {activeIncident.timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <span
                    className={`absolute top-1 -left-[20px] h-2.5 w-2.5 rounded-full border-2 ${PHASE_DOT_COLOR[evt.phase]}`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-[#64748B] tabular-nums">
                        {evt.timestamp}
                      </span>
                      <span className="text-[13px] font-semibold text-[#F8FAFC]">
                        {evt.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-[#94A3B8]">
                        {evt.source}
                      </span>
                      <span className="text-[#374151]" aria-hidden="true">
                        /
                      </span>
                      <MitreTag id={`${evt.phase} · ${evt.techniqueId}`} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">
                    {evt.description}
                  </p>

                  {evt.processTree && evt.processTree.length > 0 && (
                    <div className="mt-2.5 rounded border border-[#1F2937] bg-[#081628] p-3">
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Process Execution Tree
                      </div>
                      {evt.processTree.map((rootNode) => (
                        <ProcessTreeBranch key={rootNode.id} node={rootNode} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Grid: Forensic Artifacts & Analyst Notes */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Artifacts / IOCs */}
            <section className="rounded border border-[#1F2937] bg-[#0b1c30] p-4">
              <h3 className="border-b border-[#1F2937] pb-2.5 text-[15px] font-semibold text-[#F8FAFC]">
                Extracted Forensic Artifacts
              </h3>
              {activeIncident.artifacts.length === 0 ? (
                <p className="mt-3 text-xs text-[#64748B]">
                  No external IOC artifacts extracted for this incident.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeIncident.artifacts.map((art) => (
                    <div
                      key={art.id}
                      className="flex items-center justify-between gap-2 rounded border border-[#1F2937] bg-[#031427] p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase text-[#4cd7f6]">
                            {art.type}
                          </span>
                          <span className="truncate font-mono text-xs text-[#F8FAFC]">
                            {art.value}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-[#64748B]">
                          {art.context}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleBlockArtifact(activeIncident.id, art.id)
                        }
                        className={`inline-flex h-6 items-center gap-1 rounded px-2 font-mono text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                          art.blocked
                            ? 'border border-[#10B981]/40 bg-[#10B981]/12 text-[#34D399]'
                            : 'border border-[#374151] bg-[#102034] text-[#F8FAFC] hover:border-[#EF4444] hover:text-[#F87171]'
                        }`}
                      >
                        <ShieldBan className="h-3 w-3" />
                        <span>{art.blocked ? 'Blocked' : 'Block IOC'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Analyst Response Log */}
            <section className="flex flex-col justify-between rounded border border-[#1F2937] bg-[#0b1c30] p-4">
              <div>
                <h3 className="border-b border-[#1F2937] pb-2.5 text-[15px] font-semibold text-[#F8FAFC]">
                  Analyst Investigation Log
                </h3>
                <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                  {activeIncident.notes.length === 0 ? (
                    <p className="text-xs text-[#64748B]">
                      No responder notes recorded yet.
                    </p>
                  ) : (
                    activeIncident.notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded border border-[#1F2937] bg-[#031427] p-2.5"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#64748B]">
                          <span className="text-[#adc6ff]">{n.author}</span>
                          <span>{n.timestamp}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#d3e4fe]">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form onSubmit={handleNoteSubmit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Append triage observation or containment step..."
                  className="h-8 flex-1 rounded border border-[#374151] bg-[#031427] px-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#06B6D4] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-1 rounded bg-[#06B6D4] px-3 font-mono text-xs font-semibold text-[#031427] hover:bg-[#22D3EE] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Note</span>
                </button>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
